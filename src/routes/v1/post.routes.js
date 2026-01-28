/** Post Routes */
const express = require('express');
const router = express.Router();
const postController = require('../../controllers/post.controller');
const validate = require('../../middlewares/validate.middleware');
const {
    protect,
    authorize,
    optionalAuth
} = require('../../middlewares/auth.middleware')
const {
    createPostSchema,
    updatePostSchema
} = require('../../validators/post.validator');
const commentsRoute = require('./comment.routes');


// SPECIFIC ROUTES 

/**
 * @swagger
 * /api/v1/posts/tag/{tag}:
 *   get:
 *     summary: Get posts by tag
 *     description: Retrieve all blog posts that contain a specific tag. Returns an array of posts sorted by creation date (newest first).
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag name to filter posts
 *         example: javascript
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                   example: "Found 5 posts with tag: javascript"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */
router.get('/tag/:tag', postController.getPostsByTag);

/**
 * @swagger
 * /api/v1/posts/category/{category}:
 *   get:
 *     summary: Get posts by category
 *     description: Retrieve all blog posts in a specific category. Returns an array of posts sorted by creation date (newest first).
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Technology, Lifestyle, Travel, Food, Health, Finance, Other]
 *         description: Category name to filter posts
 *         example: Technology
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                   example: "Found 10 posts in category: Technology"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 */
router.get('/category/:category', postController.getPostsByCategory);

// NESTED ROUTES 
router.use('/:postId/comments', commentsRoute);

/**
 * @swagger
 * /api/v1/posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve a paginated list of blog posts. Supports full-text search across title, content, category, and tags.
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Search term to filter posts (searches in title, content, category, tags)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of posts per page (max 100)
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
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
 *                   example: Posts retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', optionalAuth, postController.getAllPosts);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   get:
 *     summary: Get a single post
 *     description: Retrieve a specific blog post by its ID. Includes author details and up to 5 recent comments.
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Post retrieved successfully
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
 *                   example: Post retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', optionalAuth, postController.getPost);

// Protected Routes
router.use(protect);

/**
 * @swagger
 * /api/v1/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new blog post. Requires authentication. Only users with 'author' or 'admin' role can create posts.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: Getting Started with Node.js
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 50000
 *                 example: This is a comprehensive guide to Node.js development...
 *               category:
 *                 type: string
 *                 enum: [Technology, Lifestyle, Travel, Food, Health, Finance, Other]
 *                 example: Technology
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 30
 *                 maxItems: 10
 *                 example: ['nodejs', 'javascript', 'backend']
 *     responses:
 *       201:
 *         description: Post created successfully
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
 *                   example: Post created successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error (missing or invalid fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - User role not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflict - Post with this title already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authorize('author', 'admin'), validate(createPostSchema), postController.createPost);

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update an existing blog post. Requires authentication. Only the post owner can update their own post.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: Updated Post Title
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 50000
 *                 example: Updated content for the blog post...
 *               category:
 *                 type: string
 *                 enum: [Technology, Lifestyle, Travel, Food, Health, Finance, Other]
 *                 example: Technology
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 30
 *                 maxItems: 10
 *                 example: ['updated', 'tags']
 *     responses:
 *       200:
 *         description: Post updated successfully
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
 *                   example: Post updated successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error (at least one field must be provided)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - You can only update your own post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Permanently delete a blog post. Requires authentication. Only the post owner can delete their own post. Also deletes associated images from Cloudinary.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       204:
 *         description: Post deleted successfully (No Content)
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - You can only delete your own posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route('/:id')
    .put(authorize('author', 'admin'), validate(updatePostSchema), postController.updatePost)
    .delete(authorize('author', 'admin'), postController.deletePost);

module.exports = router;