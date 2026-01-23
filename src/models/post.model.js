/**
 * Post Model
 * Defines blog post schema with title, content, category, tags, author reference,
 * status workflow, and auto-generated slug.
 */
const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
        index: true
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        minlength: [10, 'Content must be at least 10 characters'],
        maxlength: [50000, 'Content cannot exceed 50000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: Object.values(CATEGORIES),
        index: true
    },
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function (tags) {
                return tags.length <= 10;
            },
            message: 'Cannot have more than 10 tags'
        }
    },
    slug: {
        type: String,
        unique: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required'],
        index: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
        index: true
    },
    publishedAt: {
        type: Date
    },
    views: {
        type: Number,
        default: 0
    },
    featuredImage: {
        url: {
            type: String,
            default: null
        },
        public_id: {
            type: String,
            default: null
        },
        width: Number,
        height: Number
    },

    // For tracking content images used in post body
    contentImages: [{
        url: String,
        public_id: String,
        width: Number,
        height: Number
    }],

    commentsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commentsEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

postSchema.index({ title: 'text', content: 'text', category: 'text' });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.index({ status: 1, publishedAt: -1 });


postSchema.virtual('readingTime').get(function () {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
});

/**
 * Virtual: Comments for a post.
 * Filters out deleted comments and top-level comments.
 */
postSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'post',
    options: {
        match: { isDeleted: false, parentComment: null },
        sort: { createdAt: -1 }
    }
});

/**
 * Pre-save: Auto-generates URL slug from title.
 */
postSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now();
    }

    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

postSchema.pre('remove', async function (next) {
    try {
        const { deleteImage, deleteMultipleImages } = require('../config/cloudinary');

        // Delete featured image
        if (this.featuredImage?.public_id) {
            await deleteImage(this.featuredImage.public_id);
        }

        // Delete content images
        if (this.contentImages && this.contentImages.length > 0) {
            const publicIds = this.contentImages.map(img => img.public_id);
            await deleteMultipleImages(publicIds);
        }

        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Full-text search across title, content, and category.
 */
postSchema.statics.searchPosts = function (term) {
    return this.find({
        $text: { $search: term }
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
