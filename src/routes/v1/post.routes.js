/**
 * Post Routes
 * Handles blog post CRUD operations with optional authentication for reads
 * and required authentication + authorization for writes.
 */
const express = require('express');
const router = express.Router();
const postController = require('../../controllers/post.controller');
const validate = require('../../middlewares/validate.middleware');
const {
    protect,
    authorize,
    optionalAuth
} = require('../../middlewares/auth.middleware')
const { createPostSchema, updatePostSchema } = require('../../validators/post.validator');

// Public routes - authentication optional
router.get('/tag/:tag', postController.getPostsByTag);
router.get('/category/:category', postController.getPostsByCategory);
router.get('/', optionalAuth, postController.getAllPosts);
router.get('/:id', optionalAuth, postController.getPost);

// Protected routes - require authentication
router.use(protect);

router.post('/post', authorize('author', 'admin'), validate(createPostSchema), postController.createPost);

router.route('/:id')
    .put(authorize('author', 'admin'), validate(updatePostSchema), postController.updatePost)
    .delete(authorize('author', 'admin'), postController.deletePost);

module.exports = router;