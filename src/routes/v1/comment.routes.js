const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../../controllers/comment.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect, optionalAuth } = require('../../middlewares/auth.middleware');
const {
    createCommentSchema,
    updateCommentSchema,
    flagCommentSchema
} = require('../../validators/comment.validator');

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management for blog posts (nested under posts)
 */

/**
 * @swagger
 * /api/v1/posts/{postId}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     description: |
 *       Add a new comment to a blog post. Supports nested replies up to 5 levels deep.
 *       To reply to a comment, include the parentComment ID.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID to comment on
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: Great article! Very helpful.
 *               parentComment:
 *                 type: string
 *                 description: Parent comment ID for replies (optional)
 *                 example: 507f1f77bcf86cd799439012
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment created successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error or maximum nesting level reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post or parent comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     description: Retrieve paginated top-level comments for a post, sorted by creation date.
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Comments per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likesCount]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comments retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
    .route('/')
    .post(protect, validate(createCommentSchema), commentController.createComment)
    .get(optionalAuth, commentController.getCommentsByPost);

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/stats:
 *   get:
 *     summary: Get comment statistics for a post
 *     description: Get total count and other statistics about comments on a post.
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment statistics retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalComments:
 *                       type: integer
 *                       example: 25
 *                     topLevelComments:
 *                       type: integer
 *                       example: 10
 *                     totalReplies:
 *                       type: integer
 *                       example: 15
 */
router.get('/stats', commentController.getCommentStats);

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/{id}:
 *   get:
 *     summary: Get a single comment
 *     description: Retrieve a specific comment by ID, including its replies.
 *     tags: [Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Comment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     description: Update the content of your own comment. Sets isEdited to true.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: Updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment updated successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: You can only edit your own comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: |
 *       Soft delete a comment and all its nested replies.
 *       Only the comment author or admin can delete a comment.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment and 3 replies deleted successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 4
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: You can only delete your own comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router
    .route('/:id')
    .get(optionalAuth, commentController.getComment)
    .put(protect, validate(updateCommentSchema), commentController.updateComment)
    .delete(protect, commentController.deleteComment);

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/{id}/like:
 *   post:
 *     summary: Like or unlike a comment
 *     description: Toggle like on a comment. If already liked, it will unlike.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment liked
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                       example: true
 *                     likesCount:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/like', protect, commentController.toggleLike);

/**
 * @swagger
 * /api/v1/posts/{postId}/comments/{id}/flag:
 *   post:
 *     summary: Flag a comment for moderation
 *     description: Report a comment for violating community guidelines.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [spam, offensive, harassment, misinformation, other]
 *                 example: spam
 *               details:
 *                 type: string
 *                 maxLength: 500
 *                 example: This comment is promoting a product.
 *     responses:
 *       200:
 *         description: Comment flagged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Comment flagged successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     flagCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         description: You have already flagged this comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/flag', protect, validate(flagCommentSchema), commentController.flagComment);

module.exports = router;