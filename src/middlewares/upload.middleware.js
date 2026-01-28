const multer = require('multer');
const sharp = require('sharp');
const { ApiError } = require('../utils/ApiError');
const env = require('../config/validateEnv');
const logger = require('../config/logger');

/**
 * File filter for images
 */
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = env.ALLOWED_IMAGE_TYPES.split(',');

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400,
                `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            ),
            false
        );
    }
};

/**
 * Memory storage configuration
 */
const storage = multer.memoryStorage();

/**
 * Base upload configuration
 */
const createUploader = (options = {}) => {
    const {
        maxSize = env.MAX_FILE_SIZE,
        allowedTypes = imageFileFilter,
        limits = {}
    } = options;

    return multer({
        storage,
        fileFilter: allowedTypes,
        limits: {
            fileSize: maxSize,
            files: 1,
            ...limits
        }
    });
};

/**
 * Avatar upload (single file, 2MB max)
 */
const uploadAvatar = createUploader({
    maxSize: env.MAX_AVATAR_SIZE
}).single('avatar');

/**
 * Post featured image (single file, 5MB max)
 */
const uploadFeaturedImage = createUploader({
    maxSize: env.MAX_FILE_SIZE
}).single('featuredImage');

/**
 * Content images (multiple files, 5MB each, max 5 files)
 */
const uploadContentImages = createUploader({
    maxSize: env.MAX_FILE_SIZE,
    limits: { files: 5 }
}).array('images', 5);

/**
 * Single image upload
 */
const uploadSingleImage = createUploader().single('image');

/**
 * Process and optimize image
 */
const processImage = async (buffer, options = {}) => {
    const {
        width = null,
        height = null,
        quality = 80,
        format = 'jpeg',
        fit = 'inside'
    } = options;

    try {
        let processor = sharp(buffer);

        // Resize if dimensions provided
        if (width || height) {
            processor = processor.resize(width, height, {
                fit,
                withoutEnlargement: true
            });
        }

        // Convert format and optimize
        switch (format) {
            case 'jpeg':
            case 'jpg':
                processor = processor.jpeg({ quality, progressive: true });
                break;
            case 'png':
                processor = processor.png({ quality, progressive: true });
                break;
            case 'webp':
                processor = processor.webp({ quality });
                break;
            default:
                processor = processor.jpeg({ quality });
        }

        return await processor.toBuffer();
    } catch (error) {
        logger.error('Image processing error:', error);
        throw new ApiError(500, 'Failed to process image');
    }
};

/**
 * Validate image dimensions
 */
const validateImageDimensions = async (buffer, minWidth = 100, minHeight = 100) => {
    try {
        const metadata = await sharp(buffer).metadata();

        if (metadata.width < minWidth || metadata.height < minHeight) {
            throw new ApiError(
                400,
                `Image dimensions must be at least ${minWidth}x${minHeight}px`
            );
        }

        return metadata;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(400, 'Invalid image file');
    }
};

/**
 * Extract image metadata
 */
const getImageMetadata = async (buffer) => {
    try {
        const metadata = await sharp(buffer).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size,
            space: metadata.space,
            hasAlpha: metadata.hasAlpha
        };
    } catch (error) {
        logger.error('Error extracting image metadata:', error);
        return null;
    }
};

/**
 * Multer error handler middleware
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${env.MAX_FILE_SIZE / 1024 / 1024}MB`
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name'
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    next(err);
};

module.exports = {
    uploadAvatar,
    uploadFeaturedImage,
    uploadContentImages,
    uploadSingleImage,
    processImage,
    validateImageDimensions,
    getImageMetadata,
    handleUploadError
};