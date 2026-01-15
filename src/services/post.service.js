/**
 * Post Service
 * Business logic for blog posts: CRUD operations, search, pagination,
 * and filtering by category/tag.
 */
const Post = require('../models/post.model');
const { NotFoundError, ConflictError, ApiError } = require('../utils/ApiError');
const { PAGINATION } = require('../utils/constants');
const logger = require('../config/logger');

class PostService {
    /**
     * Create a new blog post with duplicate title check.
     */
    async createPost(postData) {
        const existingPost = await Post.findOne({
            title: { $regex: `^${postData.title}$`, $options: 'i' }
        });

        if (existingPost) {
            throw new ConflictError('A post with this title already exists');
        }

        const post = await Post.create(postData);
        logger.info(`Post created: ${post.id}`);
        return post;
    }

    /**
     * Get paginated posts with optional full-text search.
     */
    async getAllPosts(query = {}) {
        const { term, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = query;

        // Clamp pagination values to valid range
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(
            PAGINATION.MAX_LIMIT,
            Math.max(1, parseInt(limit))
        );
        const skip = (pageNum - 1) * limitNum;

        let findQuery = {};

        if (term && term.trim()) {
            const searchTerm = term.trim();
            findQuery = {
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { content: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } },
                    { tags: { $in: [new RegExp(searchTerm, 'i')] } }
                ]
            };
        }

        const [posts, total] = await Promise.all([
            Post.find(findQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Post.countDocuments(findQuery)
        ]);

        return {
            posts,
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
     * Get single post by ID.
     */
    async getPostById(id) {
        const post = await Post.findById(id).lean();

        if (!post) {
            throw new NotFoundError('Post');
        }

        return post;
    }

    /**
     * Update post by ID. Only post owner can update.
     */
    async updatePost(id, updateData, userId) {
        const post = await Post.findById(id);

        if (!post) {
            throw new NotFoundError('Post');
        }

        if (post.author.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only update your own post')
        }

        Object.assign(post, updateData);
        await post.save();

        logger.info(`Post updated: ${id} by user ${userId}`);
        return post;
    }

    /**
     * Delete post by ID. Only post owner can delete.
     */
    async deletePost(id, userId) {
        const post = await Post.findById(id);

        if (!post) {
            throw new NotFoundError('Post');
        }

        if (post.author.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only delete your own posts');
        }

        await post.deleteOne();
        logger.info(`Post deleted: ${id} by user ${userId}`);
        return true;
    }

    /**
     * Get all posts in a specific category.
     */
    async getPostsByCategory(category) {
        const posts = await Post.find({ category })
            .sort({ createdAt: -1 })
            .lean();

        return posts;
    }

    /**
     * Get all posts with a specific tag.
     */
    async getPostsByTag(tag) {
        const posts = await Post.find({ tags: tag })
            .sort({ createdAt: -1 })
            .lean();

        return posts;
    }
}

module.exports = new PostService();