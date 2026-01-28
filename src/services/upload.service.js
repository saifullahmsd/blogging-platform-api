
const {
    uploadImage,
    deleteImage,
    deleteMultipleImages,
    getImageDetails,
    transformations,
    generateUploadSignature
} = require('../config/cloudinary');
const {
    processImage,
    validateImageDimensions,
    getImageMetadata
} = require('../middlewares/upload.middleware');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const { NotFoundError, ApiError } = require('../utils/ApiError');
const env = require('../config/validateEnv');
const logger = require('../config/logger');

class UploadService {
    /**
     * Upload user avatar
     */
    async uploadAvatar(userId, fileBuffer) {
        try {
            // Validate dimensions (min 100x100)
            await validateImageDimensions(fileBuffer, 100, 100);

            // Process image: resize to 400x400, optimize
            const processedImage = await processImage(fileBuffer, {
                width: 400,
                height: 400,
                quality: 85,
                format: 'jpeg',
                fit: 'cover'
            });

            // Upload to Cloudinary with transformation
            const result = await uploadImage(processedImage, {
                folder: env.CLOUDINARY_AVATAR_FOLDER,
                public_id: `avatar_${userId}`,
                overwrite: true,
                transformation: transformations.avatar
            });

            // Update user's avatar URL
            const user = await User.findById(userId);
            if (!user) {
                throw new NotFoundError('User');
            }

            // Delete old avatar if exists and different
            if (user.avatar && user.avatar.public_id && user.avatar.public_id !== result.public_id) {
                await deleteImage(user.avatar.public_id).catch(err => {
                    logger.warn('Failed to delete old avatar:', err);
                });
            }

            user.avatar = result.url;
            user.avatarPublicId = result.public_id;
            await user.save();

            logger.info(`Avatar uploaded for user ${userId}`);

            return result;
        } catch (error) {
            logger.error('Avatar upload error:', error);
            throw error;
        }
    }

    /**
     * Upload post featured image
     */
    async uploadFeaturedImage(postId, userId, fileBuffer) {
        try {
            // Verify post exists and user owns it
            const post = await Post.findById(postId);
            if (!post) {
                throw new NotFoundError('Post');
            }

            if (post.author.toString() !== userId.toString()) {
                throw new ApiError(403, 'You can only upload images to your own posts');
            }

            await validateImageDimensions(fileBuffer, 800, 400);

            const processedImage = await processImage(fileBuffer, {
                width: 1200,
                height: 630,
                quality: 90,
                format: 'jpeg',
                fit: 'cover'
            });

            const result = await uploadImage(processedImage, {
                folder: env.CLOUDINARY_POST_FOLDER,
                public_id: `post_${postId}_featured`,
                overwrite: true,
                transformation: transformations.featuredImage
            });

            // Delete old featured image if exists
            if (post.featuredImage?.public_id && post.featuredImage.public_id !== result.public_id) {
                await deleteImage(post.featuredImage.public_id).catch(err => {
                    logger.warn('Failed to delete old featured image:', err);
                });
            }

            // Update post
            post.featuredImage = {
                url: result.url,
                public_id: result.public_id,
                width: result.width,
                height: result.height
            };
            await post.save();

            logger.info(`Featured image uploaded for post ${postId}`);

            return result;
        } catch (error) {
            logger.error('Featured image upload error:', error);
            throw error;
        }
    }

    /**
     * Upload content images (for use in post body)
     */
    async uploadContentImages(userId, files) {
        try {
            const uploadPromises = files.map(async (file, index) => {
                await validateImageDimensions(file.buffer, 200, 200);

                const processedImage = await processImage(file.buffer, {
                    width: 1000,
                    quality: 85,
                    format: 'jpeg',
                    fit: 'inside'
                });

                const result = await uploadImage(processedImage, {
                    folder: env.CLOUDINARY_CONTENT_FOLDER,
                    public_id: `content_${userId}_${Date.now()}_${index}`,
                    transformation: transformations.contentImage
                });

                return {
                    url: result.url,
                    public_id: result.public_id,
                    width: result.width,
                    height: result.height,
                    originalName: file.originalname
                };
            });

            const results = await Promise.all(uploadPromises);

            logger.info(`${results.length} content images uploaded by user ${userId}`);

            return results;
        } catch (error) {
            logger.error('Content images upload error:', error);
            throw error;
        }
    }

    /**
     * Delete image by public ID
     */
    async deleteImageByPublicId(publicId, userId, userRole) {
        try {
            // Verify ownership
            const [user, post] = await Promise.all([
                User.findOne({ avatarPublicId: publicId }),
                Post.findOne({ 'featuredImage.public_id': publicId })
            ]);

            if (user) {
                // Deleting avatar
                if (user._id.toString() !== userId.toString() && userRole !== 'admin') {
                    throw new ApiError(403, 'You can only delete your own images');
                }

                const deleted = await deleteImage(publicId);

                if (deleted) {
                    user.avatar = null;
                    user.avatarPublicId = null;
                    await user.save();
                }

                return { deleted, type: 'avatar' };
            }

            if (post) {
                // Deleting featured image
                if (post.author.toString() !== userId.toString() && userRole !== 'admin') {
                    throw new ApiError(403, 'You can only delete your own images');
                }

                const deleted = await deleteImage(publicId);

                if (deleted) {
                    post.featuredImage = null;
                    await post.save();
                }

                return { deleted, type: 'featured_image' };
            }

            // Check if it's a content image (less strict ownership)
            if (publicId.startsWith(`${env.CLOUDINARY_CONTENT_FOLDER}/content_${userId}`)) {
                const deleted = await deleteImage(publicId);
                return { deleted, type: 'content_image' };
            }

            throw new NotFoundError('Image');
        } catch (error) {
            logger.error('Image deletion error:', error);
            throw error;
        }
    }

    /**
     * Get image details
     */
    async getImageInfo(publicId) {
        try {
            const details = await getImageDetails(publicId);

            return {
                public_id: details.public_id,
                url: details.secure_url,
                format: details.format,
                width: details.width,
                height: details.height,
                size: details.bytes,
                created_at: details.created_at
            };
        } catch (error) {
            logger.error('Get image info error:', error);
            throw new NotFoundError('Image');
        }
    }

    /**
     * Generate signed upload URL for client-side uploads
     */
    generateSignedUpload(userId, uploadType = 'content') {
        const folderMap = {
            avatar: env.CLOUDINARY_AVATAR_FOLDER,
            featured: env.CLOUDINARY_POST_FOLDER,
            content: env.CLOUDINARY_CONTENT_FOLDER
        };

        const folder = folderMap[uploadType] || env.CLOUDINARY_CONTENT_FOLDER;

        const signature = generateUploadSignature(
            folder,
            uploadType === 'avatar' ? `avatar_${userId}` : null
        );

        return {
            ...signature,
            upload_url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`
        };
    }

}

module.exports = new UploadService();