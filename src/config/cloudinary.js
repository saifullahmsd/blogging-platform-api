const cloudinary = require('cloudinary').v2;
const env = require('./validateEnv');
const logger = require('./logger');

// Configure Cloudinary
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
});

/**
 * Test Cloudinary connection
 */
const testConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        logger.info('Cloudinary connected successfully');
        return result;
    } catch (error) {
        logger.error('Cloudinary connection failed:', error);
        throw error;
    }
};

/**
 * Upload image to Cloudinary
 */
const uploadImage = async (file, options = {}) => {
    const {
        folder = env.CLOUDINARY_CONTENT_FOLDER,
        transformation = [],
        public_id = null,
        overwrite = false,
        resource_type = 'image',
        format = null
    } = options;

    try {
        const uploadOptions = {
            folder,
            resource_type,
            overwrite,
            unique_filename: !public_id,
            use_filename: true,
            ...(public_id && { public_id }),
            ...(format && { format }),
            ...(transformation.length > 0 && { transformation })
        };

        let result;

        if (Buffer.isBuffer(file)) {
            // Upload from buffer
            result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(file);
            });
        } else if (typeof file === 'string') {
            // Upload from file path or URL
            result = await cloudinary.uploader.upload(file, uploadOptions);
        } else {
            throw new Error('Invalid file format');
        }

        logger.info(`Image uploaded to Cloudinary: ${result.public_id}`);

        return {
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes,
            created_at: result.created_at
        };
    } catch (error) {
        logger.error('Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Delete image from Cloudinary
 */
const deleteImage = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        if (result.result === 'ok') {
            logger.info(`Image deleted from Cloudinary: ${publicId}`);
            return true;
        } else {
            logger.warn(`Failed to delete image: ${publicId}`, result);
            return false;
        }
    } catch (error) {
        logger.error('Cloudinary delete error:', error);
        throw error;
    }
};

/**
 * Delete multiple images
 */
const deleteMultipleImages = async (publicIds, resourceType = 'image') => {
    try {
        const result = await cloudinary.api.delete_resources(publicIds, {
            resource_type: resourceType
        });

        logger.info(`Deleted ${Object.keys(result.deleted).length} images from Cloudinary`);
        return result;
    } catch (error) {
        logger.error('Cloudinary batch delete error:', error);
        throw error;
    }
};

/**
 * Get image details
 */
const getImageDetails = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        logger.error('Cloudinary get details error:', error);
        throw error;
    }
};

/**
 * Generate transformed image URL
 */
const getTransformedUrl = (publicId, transformations = []) => {
    return cloudinary.url(publicId, {
        secure: true,
        transformation: transformations
    });
};

/**
 * Common transformations
 */
const transformations = {
    avatar: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
    ],
    thumbnail: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
    ],
    featuredImage: [
        { width: 1200, height: 630, crop: 'fill' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
    ],
    contentImage: [
        { width: 1000, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
    ],
    responsive: [
        { width: 'auto', crop: 'scale', responsive: true },
        { dpr: 'auto' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
    ]
};

/**
 * Generate upload signature for client-side uploads
 */
const generateUploadSignature = (folder, publicId = null) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const params = {
        timestamp,
        folder,
        ...(publicId && { public_id: publicId })
    };

    const signature = cloudinary.utils.api_sign_request(
        params,
        env.CLOUDINARY_API_SECRET
    );

    return {
        signature,
        timestamp,
        api_key: env.CLOUDINARY_API_KEY,
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        folder
    };
};

module.exports = {
    cloudinary,
    testConnection,
    uploadImage,
    deleteImage,
    deleteMultipleImages,
    getImageDetails,
    getTransformedUrl,
    transformations,
    generateUploadSignature
};