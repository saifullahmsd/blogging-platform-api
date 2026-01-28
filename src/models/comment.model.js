const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true,
        minlength: [1, 'Comment must be at least 1 character'],
        maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post reference is required'],
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
        index: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    level: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    path: {
        type: String,
        index: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    likesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    repliesCount: {
        type: Number,
        default: 0,
        min: 0
    },

    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isFlagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String,
        enum: ['spam', 'offensive', 'harassment', 'misinformation', 'other'],
        default: null
    },
    flaggedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;

            if (ret.flaggedBy) {
                ret.flagCount = ret.flaggedBy.length;
                delete ret.flaggedBy;
            }

            return ret;
        }
    },
    toObject: { virtuals: true }
});


commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ post: 1, isDeleted: 1, createdAt: -1 });


commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment',
    options: { sort: { createdAt: 1 } }
});

commentSchema.virtual('isLikedByCurrentUser').get(function () {
    return this._isLikedByCurrentUser || false;
});

commentSchema.pre('save', async function (next) {
    if (this.isNew && this.parentComment) {
        try {
            const parent = await this.model('Comment').findById(this.parentComment);

            if (!parent) {
                return next(new Error('Parent comment not found'));
            }

            this.level = parent.level + 1;

            if (this.level > 5) {
                return next(new Error('Maximum comment nesting level reached'));
            }

            this.path = parent.path ? `${parent.path}.${this._id}` : `${parent._id}.${this._id}`;

            if (this.post.toString() !== parent.post.toString()) {
                return next(new Error('Parent comment belongs to a different post'));
            }
        } catch (error) {
            return next(error);
        }
    } else if (this.isNew) {
        this.path = this._id.toString();
        this.level = 0;
    }

    next();
});

commentSchema.post('save', async function (doc) {
    if (doc.parentComment && !doc.isDeleted) {
        await this.model('Comment').findByIdAndUpdate(
            doc.parentComment,
            { $inc: { repliesCount: 1 } }
        );
    }
});

commentSchema.pre('remove', async function (next) {
    if (this.parentComment) {
        await this.model('Comment').findByIdAndUpdate(
            this.parentComment,
            { $inc: { repliesCount: -1 } }
        );
    }
    next();
});

commentSchema.statics.getCommentTree = async function (postId, options = {}) {
    const {
        limit = 20,
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = -1,
        userId = null
    } = options;

    const comments = await this.find({
        post: postId,
        parentComment: null,
        isDeleted: false
    })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar')
        .lean();

    if (userId) {
        comments.forEach(comment => {
            comment.isLikedByCurrentUser = comment.likes.some(
                like => like.toString() === userId.toString()
            );
        });
    }

    return comments;
};

commentSchema.statics.getDescendants = async function (commentId) {
    const comment = await this.findById(commentId);
    if (!comment) return [];

    return await this.find({
        path: new RegExp(`^${comment.path}\\.`)
    });
};

commentSchema.methods.softDelete = async function (deletedBy) {

    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    await this.save();

    const descendants = await this.model('Comment').getDescendants(this._id);

    for (const descendant of descendants) {
        descendant.isDeleted = true;
        descendant.deletedAt = new Date();
        descendant.deletedBy = deletedBy;
        await descendant.save();
    }

    return descendants.length + 1; // Total deleted
};

// Instance method: Toggle like
commentSchema.methods.toggleLike = async function (userId) {
    const userObjectId = mongoose.Types.ObjectId(userId);
    const likeIndex = this.likes.findIndex(
        like => like.toString() === userId.toString()
    );

    if (likeIndex > -1) {
        // Unlike
        this.likes.splice(likeIndex, 1);
        this.likesCount = Math.max(0, this.likesCount - 1);
        await this.save();
        return { liked: false, likesCount: this.likesCount };
    } else {
        // Like
        this.likes.push(userObjectId);
        this.likesCount += 1;
        await this.save();
        return { liked: true, likesCount: this.likesCount };
    }
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;