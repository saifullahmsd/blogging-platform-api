/**
 * Authentication Controller
 * Handles user authentication endpoints: registration, login, logout, token refresh,
 * profile management, and password changes.
 */
const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const { ApiError } = require('../utils/ApiError');

class AuthController {
    /**
     * @desc    Register new user
     * @route   POST /api/v1/auth/register
     * @access  Public
     */
    register = asyncHandler(async (req, res) => {
        const result = await authService.register(req.body);

        this.setTokenCookies(res, result.tokens);

        return ApiResponse.created(
            res,
            {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken
                }
            },
            'User registered successfully'
        );
    });

    /**
     * @desc    Login user
     * @route   POST /api/v1/auth/login
     * @access  Public
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const ipAddress = req.ip;

        const result = await authService.login(email, password, ipAddress);

        this.setTokenCookies(res, result.tokens);

        return ApiResponse.success(
            res,
            {
                user: result.user,
                tokens: {
                    accessToken: result.tokens.accessToken,
                    refreshToken: result.tokens.refreshToken
                }
            },
            'Login successful'
        );
    });

    /**
     * @desc    Refresh access token
     * @route   POST /api/v1/auth/refresh
     * @access  Public
     */
    refreshToken = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            throw new ApiError(401, 'Refresh token is required');
        }

        const result = await authService.refreshToken(refreshToken);

        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: result.accessTokenExpiry - Date.now()
        });

        return ApiResponse.success(
            res,
            { accessToken: result.accessToken },
            'Token refreshed successfully'
        );
    });

    /**
     * @desc    Logout user
     * @route   POST /api/v1/auth/logout
     * @access  Private
     */
    logout = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout(req.user.id, refreshToken);

        this.clearTokenCookies(res);

        return ApiResponse.success(res, null, 'Logout successful');
    });

    /**
     * @desc    Logout from all devices
     * @route   POST /api/v1/auth/logout-all
     * @access  Private
     */
    logoutAll = asyncHandler(async (req, res) => {
        await authService.logoutAll(req.user.id);

        this.clearTokenCookies(res);

        return ApiResponse.success(res, null, 'Logged out from all devices');
    });

    /**
     * @desc    Get current user profile
     * @route   GET /api/v1/auth/me
     * @access  Private
     */
    getMe = asyncHandler(async (req, res) => {
        const user = await authService.getProfile(req.user.id);

        return ApiResponse.success(res, user, 'Profile retrieved successfully');
    });

    /**
     * @desc    Update user profile
     * @route   PUT /api/v1/auth/profile
     * @access  Private
     */
    updateProfile = asyncHandler(async (req, res) => {
        const user = await authService.updateProfile(req.user.id, req.body);

        return ApiResponse.success(res, user, 'Profile updated successfully');
    });

    /**
     * @desc    Change password
     * @route   PUT /api/v1/auth/password
     * @access  Private
     */
    changePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        await authService.changePassword(req.user.id, currentPassword, newPassword);

        this.clearTokenCookies(res);

        return ApiResponse.success(
            res,
            null,
            'Password changed successfully. Please login again.'
        );
    });

    /**
     * Sets httpOnly cookies for access and refresh tokens.
     * @param {Response} res - Express response object
     * @param {Object} tokens - Token pair with expiry timestamps
     */
    setTokenCookies(res, tokens) {
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'strict',
            maxAge: tokens.accessTokenExpiry - Date.now()
        });

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'strict',
            maxAge: tokens.refreshTokenExpiry - Date.now()
        });
    }

    /**
     * Clears authentication cookies on logout.
     * @param {Response} res - Express response object
     */
    clearTokenCookies(res) {
        res.cookie('accessToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });

        res.cookie('refreshToken', '', {
            httpOnly: true,
            expires: new Date(0)
        });
    }
}

module.exports = new AuthController();