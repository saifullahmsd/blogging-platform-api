/**
 * Authentication Routes
 * Handles user registration, login, logout, token refresh, and profile management.
 */
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const commentController = require('../../controllers/comment.controller');
const validate = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema
} = require('../../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes - require authentication
router.use(protect);

// User Profile Routes
router.get('/me', authController.getMe);
router.get('/me/comments', commentController.getUserComments);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);
router.put('/password', validate(changePasswordSchema), authController.changePassword);

// Session Routes
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

module.exports = router;