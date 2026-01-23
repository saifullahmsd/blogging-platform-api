const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');

class UploadController {
    /**
     * @desc    Upload user avatar
     * @route   POST /api/v1/upload/avatar
     * @access  Private
     */
    uploadAvatar = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
        }

        const result = await uploadService.uploadAvatar(req.user.id, req.file.buffer);

        return ApiResponse.success(res, result, 'Avatar uploaded successfully');
    });

    /**
     * @desc    Upload post featured image
     * @route   POST /api/v1/upload/post/:postId/featured
     * @access  Private
     */
    uploadFeaturedImage = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
        }

        const { postId } = req.params;
        const result = await uploadService.uploadFeaturedImage(
            postId,
            req.user.id,
            req.file.buffer
        );

        return ApiResponse.success(res, result, 'Featured image uploaded successfully');
    });

    /**
     * @desc    Upload content images (multiple)
     * @route   POST /api/v1/upload/content
     * @access  Private
     */
    uploadContentImages = asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            throw new ApiError(400, 'No files uploaded');
        }

        const results = await uploadService.uploadContentImages(req.user.id, req.files);

        return ApiResponse.success(
            res,
            { images: results },
            `${results.length} images uploaded successfully`
        );
    });

    /**
     * @desc    Delete image by public ID
     * @route   DELETE /api/v1/upload/:publicId
     * @access  Private
     */
    deleteImage = asyncHandler(async (req, res) => {
        const { publicId } = req.params;

        // Decode public ID (it may contain slashes)
        const decodedPublicId = decodeURIComponent(publicId);

        const result = await uploadService.deleteImageByPublicId(
            decodedPublicId,
            req.user.id,
            req.user.role
        );

        return ApiResponse.success(
            res,
            result,
            `${result.type} deleted successfully`
        );
    });

    /**
     * @desc    Get image details
     * @route   GET /api/v1/upload/:publicId/info
     * @access  Private
     */
    getImageInfo = asyncHandler(async (req, res) => {
        const { publicId } = req.params;
        const decodedPublicId = decodeURIComponent(publicId);

        const info = await uploadService.getImageInfo(decodedPublicId);

        return ApiResponse.success(res, info, 'Image info retrieved successfully');
    });

    /**
     * @desc    Generate signed upload parameters (for client-side uploads)
     * @route   POST /api/v1/upload/signature
     * @access  Private
     */
    generateSignature = asyncHandler(async (req, res) => {
        const { uploadType = 'content' } = req.body;

        if (!['avatar', 'featured', 'content'].includes(uploadType)) {
            throw new ApiError(400, 'Invalid upload type');
        }

        const signature = uploadService.generateSignedUpload(req.user.id, uploadType);

        return ApiResponse.success(
            res,
            signature,
            'Upload signature generated successfully'
        );
    });
}

module.exports = new UploadController();