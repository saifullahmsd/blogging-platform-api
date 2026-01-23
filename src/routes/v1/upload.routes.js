
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

// All routes require authentication
router.use(protect);

// Avatar upload
router.post('/avatar', uploadAvatar, handleUploadError, uploadController.uploadAvatar);

// Featured image for post
router.post(
    '/post/:postId/featured',
    uploadFeaturedImage,
    handleUploadError,
    uploadController.uploadFeaturedImage
);

// Content images (multiple)
router.post(
    '/content',
    uploadContentImages,
    handleUploadError,
    uploadController.uploadContentImages
);

// Delete image
router.delete('/:publicId', uploadController.deleteImage);

// Get image info
router.get('/:publicId/info', uploadController.getImageInfo);

// Generate signed upload (for client-side uploads)
router.post('/signature', uploadController.generateSignature);

module.exports = router;