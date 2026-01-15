/**
 * Authentication Service
 * Business logic for user authentication: registration, login, token management,
 * profile updates, and password changes.
 */
const User = require('../models/user.model');
const JWTUtils = require('../utils/jwt');
const { ApiError, NotFoundError, ValidationError } = require('../utils/ApiError');
const logger = require('../config/logger');

class AuthService {
    /**
     * Register new user and generate token pair.
     */
    async register(userData) {
        try {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new ValidationError('Email already registered');
            }

            const user = await User.create({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                bio: userData.bio,
                role: 'user'
            });

            logger.info(`User registered: ${user.email}`);

            const tokens = JWTUtils.generateTokenPair(user.id);
            await user.addRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiry);

            return { user, tokens };
        } catch (error) {
            if (error.code === 11000) {
                throw new ValidationError('Email already registered');
            }
            throw error;
        }
    }

    /**
     * Authenticate user credentials and generate token pair.
     */
    async login(email, password, ipAddress) {
        const user = await User.findOne({ email, isActive: true }).select('+password');

        if (!user) {
            throw new ApiError(401, 'Invalid email or password');
        }

        if (user.isLocked()) {
            const unlockTime = new Date(user.lockUntil).toLocaleString();
            throw new ApiError(403, `Account is locked until ${unlockTime}`);
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            await user.incLoginAttempts();

            const remainingAttempts = 5 - (user.loginAttempts + 1);

            if (remainingAttempts <= 0) {
                throw new ApiError(403, 'Account locked due to too many failed attempts');
            }

            throw new ApiError(401, `Invalid email or password. ${remainingAttempts} attempts remaining`);
        }

        await user.resetLoginAttempts();

        const tokens = JWTUtils.generateTokenPair(user.id);
        await user.addRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiry);

        logger.info(`User logged in: ${user.email} from ${ipAddress}`);

        user.password = undefined;

        return { user, tokens };
    }

    /**
     * Generate new access token from valid refresh token.
     */
    async refreshToken(refreshToken) {
        const decoded = JWTUtils.verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        const tokenExists = user.refreshTokens.some(
            rt => rt.token === refreshToken && rt.expiresAt > new Date()
        );

        if (!tokenExists) {
            throw new ApiError(401, 'Invalid or expired refresh token');
        }

        const accessToken = JWTUtils.generateAccessToken(user.id);
        const accessTokenExpiry = new Date(
            Date.now() + JWTUtils.parseExpiry(process.env.JWT_ACCESS_EXPIRY)
        );

        return { accessToken, accessTokenExpiry };
    }

    /**
     * Invalidate specific refresh token on logout.
     */
    async logout(userId, refreshToken) {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User');
        }

        if (refreshToken) {
            await user.removeRefreshToken(refreshToken);
        }

        logger.info(`User logged out: ${user.email}`);

        return true;
    }

    /**
     * Invalidate all refresh tokens for multi-device logout.
     */
    async logoutAll(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User');
        }

        user.refreshTokens = [];
        await user.save();

        logger.info(`User logged out from all devices: ${user.email}`);

        return true;
    }

    /**
     * Get user profile by ID.
     */
    async getProfile(userId) {
        const user = await User.findById(userId);

        if (!user || !user.isActive) {
            throw new NotFoundError('User');
        }

        return user;
    }

    /**
     * Update user profile fields (name, bio, avatar).
     */
    async updateProfile(userId, updateData) {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User');
        }

        const allowedUpdates = ['name', 'bio', 'avatar'];
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });

        await user.save();

        logger.info(`User profile updated: ${user.email}`);

        return user;
    }

    /**
     * Change user password and invalidate all sessions.
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new NotFoundError('User');
        }

        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            throw new ApiError(401, 'Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        // Force logout from all devices
        user.refreshTokens = [];
        await user.save();

        logger.info(`Password changed for user: ${user.email}`);

        return true;
    }
}

module.exports = new AuthService();