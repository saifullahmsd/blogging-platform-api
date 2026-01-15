/**
 * Custom API Error Classes
 * Provides consistent error handling with status codes for different error types.
 */

/**
 * Base API error with status code and operational flag.
 */
class ApiError extends Error {
    constructor(
        statusCode,
        message,
        isOperational = true,
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * 400 Bad Request - Input validation failures.
 */
class ValidationError extends ApiError {
    constructor(message, errors = []) {
        super(400, message);
        this.errors = errors;
    }
}

/**
 * 404 Not Found - Resource does not exist.
 */
class NotFoundError extends ApiError {
    constructor(resource) {
        super(404, `${resource} not found`);
    }
}

/**
 * 409 Conflict - Resource already exists or state conflict.
 */
class ConflictError extends ApiError {
    constructor(message) {
        super(409, message);
    }
}

module.exports = {
    ApiError,
    ValidationError,
    NotFoundError,
    ConflictError
};