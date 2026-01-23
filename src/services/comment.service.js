const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const { NotFoundError, ApiError, ValidationError } = require('../utils/ApiError');
const logger = require('../config/logger');

class CommentService {
    /**
     * Create a new comment
     */
    async createComment(postId, userId, commentData) {
        const post = await Post.findById(postId);

        if (!post) {
            throw new NotFoundError('Post');
        }

        if (!post.commentsEnabled) {
            throw new ApiError(403, 'Comments are disabled for this post');
        }

        if (commentData.parentComment) {
            const parentComment = await Comment.findOne({
                _id: commentData.parentComment,
                post: postId,
                isDeleted: false
            });

            if (!parentComment) {
                throw new NotFoundError('Parent comment');
            }

            // Check nesting level
            if (parentComment.level >= 5) {
                throw new ValidationError('Maximum comment nesting level reached');
            }
        }

        const comment = await Comment.create({
            content: commentData.content,
            post: postId,
            author: userId,
            parentComment: commentData.parentComment || null
        });

        if (!commentData.parentComment) {
            await Post.findByIdAndUpdate(postId, {
                $inc: { commentsCount: 1 }
            });
        }

        await comment.populate('author', 'name avatar');

        logger.info(`Comment created: ${comment.id} on post ${postId} by user ${userId}`);

        return comment;
    }

    /**
     * Get comments for a post with pagination
     */
    async getCommentsByPost(postId, query = {}) {
        const {
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = -1,
            parentComment = null,
            userId = null
        } = query;

        const post = await Post.findById(postId);
        if (!post) {
            throw new NotFoundError('Post');
        }

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const findQuery = {
            post: postId,
            isDeleted: false
        };

        if (parentComment === 'null' || parentComment === null) {
            findQuery.parentComment = null;
        } else if (parentComment) {
            findQuery.parentComment = parentComment;
        }

        const [comments, total] = await Promise.all([
            Comment.find(findQuery)
                .populate('author', 'name avatar role')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Comment.countDocuments(findQuery)
        ]);

        if (userId) {
            comments.forEach(comment => {
                comment.isLikedByCurrentUser = comment.likes.some(
                    like => like.toString() === userId.toString()
                );
                // Remove likes array for privacy
                comment.likes = undefined;
            });
        } else {
            comments.forEach(comment => {
                comment.likes = undefined;
            });
        }

        return {
            comments,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPrevPage: pageNum > 1
            }
        };
    }

    /**
     * Get single comment with replies
     */
    async getCommentById(commentId, userId = null) {
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        })
            .populate('author', 'name avatar role')
            .lean();

        if (!comment) {
            throw new NotFoundError('Comment');
        }

        if (userId) {
            comment.isLikedByCurrentUser = comment.likes.some(
                like => like.toString() === userId.toString()
            );
        }
        comment.likes = undefined;

        const replies = await Comment.find({
            parentComment: commentId,
            isDeleted: false
        })
            .populate('author', 'name avatar role')
            .sort({ createdAt: 1 })
            .lean();

        if (userId) {
            replies.forEach(reply => {
                reply.isLikedByCurrentUser = reply.likes.some(
                    like => like.toString() === userId.toString()
                );
                reply.likes = undefined;
            });
        } else {
            replies.forEach(reply => {
                reply.likes = undefined;
            });
        }

        comment.replies = replies;

        return comment;
    }

    /**
     * Update comment
     */
    async updateComment(commentId, userId, updateData) {
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });

        if (!comment) {
            throw new NotFoundError('Comment');
        }

        if (comment.author.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only edit your own comments');
        }

        const editWindow = 15 * 60 * 1000; // 15 minutes
        if (Date.now() - comment.createdAt.getTime() > editWindow) {
            throw new ApiError(403, 'Comment edit window has expired');
        }

        comment.content = updateData.content;
        comment.isEdited = true;
        comment.editedAt = new Date();

        await comment.save();
        await comment.populate('author', 'name avatar');

        logger.info(`Comment updated: ${commentId} by user ${userId}`);

        return comment;
    }

    /**
     * Delete comment (soft delete)
     */
    async deleteComment(commentId, userId, userRole) {
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });

        if (!comment) {
            throw new NotFoundError('Comment');
        }

        const isOwner = comment.author.toString() === userId.toString();
        const isAdmin = userRole === 'admin';

        if (!isOwner && !isAdmin) {
            throw new ApiError(403, 'You can only delete your own comments');
        }

        const deletedCount = await comment.softDelete(userId);

        if (!comment.parentComment) {
            await Post.findByIdAndUpdate(comment.post, {
                $inc: { commentsCount: -deletedCount }
            });
        }

        logger.info(`Comment deleted: ${commentId} by user ${userId} (${deletedCount} total)`);

        return { deletedCount };
    }

    /**
     * Toggle like on comment
     */
    async toggleLike(commentId, userId) {
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });

        if (!comment) {
            throw new NotFoundError('Comment');
        }

        const result = await comment.toggleLike(userId);

        logger.info(`Comment ${commentId} ${result.liked ? 'liked' : 'unliked'} by user ${userId}`);

        return result;
    }

    /**
     * Flag comment for moderation
     */
    async flagComment(commentId, userId, flagData) {
        const comment = await Comment.findOne({
            _id: commentId,
            isDeleted: false
        });

        if (!comment) {
            throw new NotFoundError('Comment');
        }

        const alreadyFlagged = comment.flaggedBy.some(
            flag => flag.user.toString() === userId.toString()
        );

        if (alreadyFlagged) {
            throw new ApiError(400, 'You have already flagged this comment');
        }

        comment.flaggedBy.push({
            user: userId,
            reason: flagData.reason,
            details: flagData.details,
            timestamp: new Date()
        });

        if (comment.flaggedBy.length >= 3 && !comment.isFlagged) {
            comment.isFlagged = true;
            comment.flagReason = flagData.reason;
        }

        await comment.save();

        logger.info(`Comment ${commentId} flagged by user ${userId} (${comment.flaggedBy.length} total flags)`);

        return {
            flagCount: comment.flaggedBy.length,
            isFlagged: comment.isFlagged
        };
    }

    /**
     * Get user's comments
     */
    async getUserComments(userId, query = {}) {
        const {
            page = 1,
            limit = 20
        } = query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [comments, total] = await Promise.all([
            Comment.find({
                author: userId,
                isDeleted: false
            })
                .populate('post', 'title slug')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Comment.countDocuments({
                author: userId,
                isDeleted: false
            })
        ]);

        return {
            comments,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        };
    }

    /**
     * Get comment statistics
     */
    async getCommentStats(postId) {
        const stats = await Comment.aggregate([
            {
                $match: {
                    post: mongoose.Types.ObjectId(postId),
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalComments: { $sum: 1 },
                    totalLikes: { $sum: '$likesCount' },
                    topLevelComments: {
                        $sum: {
                            $cond: [{ $eq: ['$parentComment', null] }, 1, 0]
                        }
                    },
                    totalReplies: {
                        $sum: {
                            $cond: [{ $ne: ['$parentComment', null] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        return stats[0] || {
            totalComments: 0,
            totalLikes: 0,
            topLevelComments: 0,
            totalReplies: 0
        };
    }
}

module.exports = new CommentService();