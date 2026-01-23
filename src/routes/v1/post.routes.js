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
router.get('/tag/:tag', postController.getPostsByTag);
router.get('/category/:category', postController.getPostsByCategory);

// NESTED ROUTES 
router.use('/:postId/comments', commentsRoute);

// GENERIC ROUTES 
router.get('/', optionalAuth, postController.getAllPosts);
router.get('/:id', optionalAuth, postController.getPost);

// Protected Routes
router.use(protect);

router.post('/', authorize('author', 'admin'), validate(createPostSchema), postController.createPost);
router.route('/:id')
    .put(authorize('author', 'admin'), validate(updatePostSchema), postController.updatePost)
    .delete(authorize('author', 'admin'), postController.deletePost);

module.exports = router;