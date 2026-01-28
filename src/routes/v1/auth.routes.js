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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management endpoints
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Create a new user account. Returns user data along with access and refresh tokens.
 *       Tokens are also set as httpOnly cookies for browser clients.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: SecurePass123!
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Full-stack developer
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookies containing accessToken and refreshToken
 *             schema:
 *               type: string
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
 *                   example: User registered successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Validation error (invalid email, weak password, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: |
 *       Authenticate user with email and password. Returns user data and tokens.
 *       Account gets locked after 5 failed attempts for security.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookies containing accessToken and refreshToken
 *             schema:
 *               type: string
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
 *                   example: Login successful
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       423:
 *         description: Account locked due to too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Get a new access token using a valid refresh token.
 *       Refresh token can be provided via httpOnly cookie or request body.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if sent via cookie)
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: Token refreshed successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token is required or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authController.refreshToken);

// Protected routes - require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the profile of the currently authenticated user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: Profile retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - No token or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authController.getMe);

/**
 * @swagger
 * /api/v1/auth/me/comments:
 *   get:
 *     summary: Get current user's comments
 *     description: Retrieve all comments made by the currently authenticated user.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me/comments', commentController.getUserComments);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the profile of the currently authenticated user. At least one field must be provided.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: John Updated
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated bio information
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error (at least one field required)
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
 */
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);

/**
 * @swagger
 * /api/v1/auth/password:
 *   put:
 *     summary: Change password
 *     description: |
 *       Change the password of the currently authenticated user.
 *       After successful change, user will be logged out and must login again.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPass123!
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: NewSecurePass456!
 *               confirmPassword:
 *                 type: string
 *                 description: Must match newPassword
 *                 example: NewSecurePass456!
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully. Please login again.
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (passwords don't match, weak password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/password', validate(changePasswordSchema), authController.changePassword);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Logout from the current device/session.
 *       Invalidates the current refresh token and clears auth cookies.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logout successful
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: |
 *       Logout from ALL devices/sessions.
 *       Invalidates all refresh tokens for the user, forcing re-login on all devices.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
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
 *                   example: Logged out from all devices
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout-all', authController.logoutAll);

module.exports = router;