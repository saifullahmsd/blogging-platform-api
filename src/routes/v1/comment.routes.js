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

// Routes for /api/v1/posts/:postId/comments
router
    .route('/')
    .post(protect, validate(createCommentSchema), commentController.createComment)
    .get(optionalAuth, commentController.getCommentsByPost);

router.get('/stats', commentController.getCommentStats);

// Routes for /api/v1/comments/:id
router
    .route('/:id')
    .get(optionalAuth, commentController.getComment)
    .put(protect, validate(updateCommentSchema), commentController.updateComment)
    .delete(protect, commentController.deleteComment);

router.post('/:id/like', protect, commentController.toggleLike);
router.post('/:id/flag', protect, validate(flagCommentSchema), commentController.flagComment);

module.exports = router;