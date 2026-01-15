/**
 * Post Controller
 * Handles blog post CRUD operations and filtering by category/tag.
 */
const postService = require('../services/post.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

class PostController {
    /**
     * @desc    Create new post
     * @route   POST /api/v1/posts/post
     * @access  Private (author, admin)
     */
    createPost = asyncHandler(async (req, res) => {
        const postData = {
            ...req.body,
            author: req.user.id
        }
        const post = await postService.createPost(postData);
        return ApiResponse.created(res, post, 'Post created successfully');
    });

    /**
     * @desc    Get all posts with optional search and pagination
     * @route   GET /api/v1/posts?term=search&page=1&limit=10
     * @access  Public
     */
    getAllPosts = asyncHandler(async (req, res) => {
        const result = await postService.getAllPosts(req.query);
        return ApiResponse.success(res, {
            posts: result.posts,
            pagination: result.pagination
        }, 'Posts retrieved successfully');
    });

    /**
     * @desc    Get single post by ID
     * @route   GET /api/v1/posts/:id
     * @access  Public
     */
    getPost = asyncHandler(async (req, res) => {
        const post = await postService.getPostById(req.params.id);
        return ApiResponse.success(res, post, 'Post retrieved successfully');
    });

    /**
     * @desc    Update post
     * @route   PUT /api/v1/posts/:id
     * @access  Private (author, admin) - owner only
     */
    updatePost = asyncHandler(async (req, res) => {
        const post = await postService.updatePost(
            req.params.id,
            req.body,
            req.user.id);
        return ApiResponse.success(res, post, 'Post updated successfully');
    });

    /**
     * @desc    Delete post
     * @route   DELETE /api/v1/posts/:id
     * @access  Private (author, admin) - owner only
     */
    deletePost = asyncHandler(async (req, res) => {
        await postService.deletePost(
            req.params.id,
            req.user.id
        );
        return ApiResponse.noContent(res);
    });

    /**
     * @desc    Get posts by category
     * @route   GET /api/v1/posts/category/:category
     * @access  Public
     */
    getPostsByCategory = asyncHandler(async (req, res) => {
        const { category } = req.params;
        const posts = await postService.getPostsByCategory(category);
        return ApiResponse.success(
            res,
            posts,
            `Found ${posts.length} posts in category: ${category}`
        );
    });

    /**
     * @desc    Get posts by tag
     * @route   GET /api/v1/posts/tag/:tag
     * @access  Public
     */
    getPostsByTag = asyncHandler(async (req, res) => {
        const { tag } = req.params;
        const posts = await postService.getPostsByTag(tag);
        return ApiResponse.success(
            res,
            posts,
            `Found ${posts.length} posts with tag: ${tag}`
        );
    });

}

module.exports = new PostController();