/**
 * JWT Utilities
 * Token generation, verification, and expiry parsing for access/refresh token pairs.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/validateEnv');
const { ApiError } = require('./ApiError');

class JWTUtils {
    /**
     * Generate short-lived access token.
     * @param {string} userId - User ID to encode
     * @returns {string} Signed JWT access token
     */
    static generateAccessToken(userId) {
        return jwt.sign(
            { id: userId, type: 'access' },
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRY }
        );
    }

    /**
     * Generate long-lived refresh token.
     * @param {string} userId - User ID to encode
     * @returns {string} Signed JWT refresh token
     */
    static generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId, type: 'refresh' },
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRY }
        );
    }

    /**
     * Verify and decode access token.
     * @param {string} token - JWT access token
     * @returns {Object} Decoded token payload
     * @throws {ApiError} 401 if token invalid or expired
     */
    static verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

            if (decoded.type !== 'access') {
                throw new ApiError(401, 'Invalid token type');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError(401, 'Access token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError(401, 'Invalid access token');
            }
            throw error;
        }
    }


    // Verify and decode refresh token.

    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

            if (decoded.type !== 'refresh') {
                throw new ApiError(401, 'Invalid token type');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError(401, 'Refresh token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError(401, 'Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Generate both access and refresh tokens with expiry timestamps.
     * @param {string} userId - User ID to encode
     * @returns {Object} Token pair with expiry dates
     */
    static generateTokenPair(userId) {
        const accessToken = this.generateAccessToken(userId);
        const refreshToken = this.generateRefreshToken(userId);

        const accessTokenExpiry = new Date(Date.now() + this.parseExpiry(env.JWT_ACCESS_EXPIRY));
        const refreshTokenExpiry = new Date(Date.now() + this.parseExpiry(env.JWT_REFRESH_EXPIRY));

        return {
            accessToken,
            refreshToken,
            accessTokenExpiry,
            refreshTokenExpiry
        };
    }


    static parseExpiry(expiry) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        const unit = expiry.slice(-1);
        const value = parseInt(expiry.slice(0, -1));

        return value * (units[unit] || units.m);
    }
}

module.exports = JWTUtils;