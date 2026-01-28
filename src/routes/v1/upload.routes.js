
const express = require('express');
const router = express.Router();
const uploadController = require('../../controllers/upload.controller');
const { protect } = require('../../middlewares/auth.middleware');
const {
    uploadAvatar,
    uploadFeaturedImage,
    uploadContentImages,
    handleUploadError
} = require('../../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoints for images (avatars, featured images, content images)
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/upload/avatar:
 *   post:
 *     summary: Upload user avatar
 *     description: |
 *       Upload a new avatar image for the authenticated user.
 *       Image is resized to 200x200 pixels and uploaded to Cloudinary.
 *       Old avatar is automatically deleted.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                   example: Avatar uploaded successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/avatars/user_123.jpg
 *                     public_id:
 *                       type: string
 *                       example: avatars/user_123
 *                     width:
 *                       type: integer
 *                       example: 200
 *                     height:
 *                       type: integer
 *                       example: 200
 *       400:
 *         description: No file uploaded or invalid file type
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
router.post('/avatar', uploadAvatar, handleUploadError, uploadController.uploadAvatar);

/**
 * @swagger
 * /api/v1/upload/post/{postId}/featured:
 *   post:
 *     summary: Upload featured image for a post
 *     description: |
 *       Upload a featured/thumbnail image for a blog post.
 *       Image is resized to 1200x630 (optimal for social sharing).
 *       Minimum dimensions required: 800x400.
 *       Only the post owner can upload featured images.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 10MB, min 800x400)
 *     responses:
 *       200:
 *         description: Featured image uploaded successfully
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
 *                   example: Featured image uploaded successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/posts/featured/post_123.jpg
 *                     public_id:
 *                       type: string
 *                       example: posts/featured/post_123
 *                     width:
 *                       type: integer
 *                       example: 1200
 *                     height:
 *                       type: integer
 *                       example: 630
 *       400:
 *         description: No file or image dimensions too small
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: You can only upload images to your own posts
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
router.post(
    '/post/:postId/featured',
    uploadFeaturedImage,
    handleUploadError,
    uploadController.uploadFeaturedImage
);

/**
 * @swagger
 * /api/v1/upload/content:
 *   post:
 *     summary: Upload content images (multiple)
 *     description: |
 *       Upload multiple images for use in blog post content.
 *       Images are resized to max 1000px width while maintaining aspect ratio.
 *       Up to 10 images can be uploaded at once.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (max 10 files, 5MB each)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
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
 *                   example: 3 images uploaded successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             example: https://res.cloudinary.com/demo/image/upload/content/img_123.jpg
 *                           public_id:
 *                             type: string
 *                             example: content/img_123
 *                           width:
 *                             type: integer
 *                             example: 1000
 *                           height:
 *                             type: integer
 *                             example: 750
 *       400:
 *         description: No files uploaded
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
router.post(
    '/content',
    uploadContentImages,
    handleUploadError,
    uploadController.uploadContentImages
);

/**
 * @swagger
 * /api/v1/upload/{publicId}:
 *   delete:
 *     summary: Delete an image
 *     description: |
 *       Delete an image from Cloudinary by its public ID.
 *       Public ID should be URL-encoded if it contains slashes.
 *       Only the image owner or admin can delete.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID (URL-encoded)
 *         example: avatars%2Fuser_123
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: avatar deleted successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: avatar
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *       403:
 *         description: You can only delete your own images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:publicId', uploadController.deleteImage);

/**
 * @swagger
 * /api/v1/upload/{publicId}/info:
 *   get:
 *     summary: Get image information
 *     description: Retrieve metadata and details about an uploaded image.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary public ID (URL-encoded)
 *         example: avatars%2Fuser_123
 *     responses:
 *       200:
 *         description: Image info retrieved successfully
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
 *                   example: Image info retrieved successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                       example: avatars/user_123
 *                     format:
 *                       type: string
 *                       example: jpg
 *                     width:
 *                       type: integer
 *                       example: 200
 *                     height:
 *                       type: integer
 *                       example: 200
 *                     bytes:
 *                       type: integer
 *                       example: 25600
 *                     url:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/avatars/user_123.jpg
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:publicId/info', uploadController.getImageInfo);

/**
 * @swagger
 * /api/v1/upload/signature:
 *   post:
 *     summary: Generate signed upload parameters
 *     description: |
 *       Generate Cloudinary signed upload parameters for client-side/direct uploads.
 *       Use this for frontend upload widgets or SDKs.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadType:
 *                 type: string
 *                 enum: [avatar, featured, content]
 *                 default: content
 *                 example: avatar
 *     responses:
 *       200:
 *         description: Signature generated successfully
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
 *                   example: Upload signature generated successfully
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: object
 *                   properties:
 *                     signature:
 *                       type: string
 *                       example: a1b2c3d4e5f6...
 *                     timestamp:
 *                       type: integer
 *                       example: 1706123456
 *                     cloudName:
 *                       type: string
 *                       example: your-cloud-name
 *                     apiKey:
 *                       type: string
 *                       example: 123456789012345
 *                     folder:
 *                       type: string
 *                       example: avatars
 *       400:
 *         description: Invalid upload type
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
router.post('/signature', uploadController.generateSignature);

module.exports = router;