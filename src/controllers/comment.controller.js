
const commentService = require('../services/comment.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

class CommentController {
    /**
     * @desc    Create comment on a post
     * @route   POST /api/v1/posts/:postId/comments
     * @access  Private
     */
    createComment = asyncHandler(async (req, res) => {
        const { postId } = req.params;
        const userId = req.user.id;

        const comment = await commentService.createComment(postId, userId, req.body);

        return ApiResponse.created(res, comment, 'Comment created successfully');
    });

    /**
     * @desc    Get comments for a post
     * @route   GET /api/v1/posts/:postId/comments
     * @access  Public
     */
    getCommentsByPost = asyncHandler(async (req, res) => {
        const { postId } = req.params;
        const userId = req.user?.id || null;

        const result = await commentService.getCommentsByPost(postId, {
            ...req.query,
            userId
        });

        return ApiResponse.success(res, {
            comments: result.comments,
            pagination: result.pagination
        }, 'Comments retrieved successfully');
    });

    /**
     * @desc    Get single comment with replies
     * @route   GET /api/v1/comments/:id
     * @access  Public
     */
    getComment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user?.id || null;

        const comment = await commentService.getCommentById(id, userId);

        return ApiResponse.success(res, comment, 'Comment retrieved successfully');
    });

    /**
     * @desc    Update comment
     * @route   PUT /api/v1/comments/:id
     * @access  Private
     */
    updateComment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const comment = await commentService.updateComment(id, userId, req.body);

        return ApiResponse.success(res, comment, 'Comment updated successfully');
    });

    /**
     * @desc    Delete comment
     * @route   DELETE /api/v1/comments/:id
     * @access  Private
     */
    deleteComment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await commentService.deleteComment(id, userId, userRole);

        return ApiResponse.success(
            res,
            result,
            `Comment and ${result.deletedCount - 1} replies deleted successfully`
        );
    });

    /**
     * @desc    Like/Unlike comment
     * @route   POST /api/v1/comments/:id/like
     * @access  Private
     */
    toggleLike = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await commentService.toggleLike(id, userId);

        return ApiResponse.success(
            res,
            result,
            result.liked ? 'Comment liked' : 'Comment unliked'
        );
    });

    /**
     * @desc    Flag comment
     * @route   POST /api/v1/comments/:id/flag
     * @access  Private
     */
    flagComment = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await commentService.flagComment(id, userId, req.body);

        return ApiResponse.success(res, result, 'Comment flagged successfully');
    });

    /**
     * @desc    Get user's comments
     * @route   GET /api/v1/users/me/comments
     * @access  Private
     */
    getUserComments = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const result = await commentService.getUserComments(userId, req.query);

        return ApiResponse.success(res, {
            comments: result.comments,
            pagination: result.pagination
        }, 'User comments retrieved successfully');
    });

    /**
     * @desc    Get comment statistics for a post
     * @route   GET /api/v1/posts/:postId/comments/stats
     * @access  Public
     */
    getCommentStats = asyncHandler(async (req, res) => {
        const { postId } = req.params;

        const stats = await commentService.getCommentStats(postId);

        return ApiResponse.success(res, stats, 'Comment statistics retrieved successfully');
    });
}

module.exports = new CommentController();