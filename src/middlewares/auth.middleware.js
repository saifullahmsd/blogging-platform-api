/**
 * Authentication Middleware
 * Provides route protection and role-based access control using JWT tokens.
 */
const User = require('../models/user.model')
const JWTUtils = require('../utils/jwt');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');

/**
 * Protects routes by requiring valid JWT access token.
 * Attaches authenticated user to req.user.
 * @throws {ApiError} 401 if token missing, invalid, or user inactive
 */
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check cookie first, then Authorization header
    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized. Please login.');
    }

    try {
        const decoded = JWTUtils.verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password');

        if (!user || !user.isActive) {
            throw new ApiError(401, 'User no longer exists');
        }

        // Invalidate token if password changed after token was issued
        if (user.passwordChangedAt) {
            const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);

            if (decoded.iat < changedTimestamp) {
                throw new ApiError(401, 'Password recently changed. Please login again.');
            }
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(401, 'Not authorized. Invalid token.');
    }
});

/**
 * Restricts access to specified roles.
 * Must be used after protect middleware.
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'author')
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `User role '${req.user.role}' is not authorized to access this resource`
            );
        }
        next();
    };
};

/**
 * Optional authentication - attaches user if valid token exists.
 * Does not require authentication; silently continues if no token.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = JWTUtils.verifyAccessToken(token);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid or expired - continue without user
        }
    }

    next();
});

module.exports = {
    protect,
    authorize,
    optionalAuth
};