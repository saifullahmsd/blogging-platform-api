/**
 * Global Error Handler Middleware
 * Catches all errors, normalizes them to ApiError format, logs details,
 * and returns consistent JSON error responses.
 */
const { ApiError, ValidationError, ConflictError } = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/validateEnv');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    // Mongoose invalid ObjectId
    if (err.name === 'CastError') {
        error = new ApiError(400, 'Invalid ID format');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'Field';
        error = new ConflictError(`${field} already exists`);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error = new ValidationError(messages.join(', '));
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(error.errors && { errors: error.errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;