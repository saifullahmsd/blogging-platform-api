/**
 * Standardized API Response Helper
 * Provides consistent response format across all endpoints.
 */
class ApiResponse {
    /**
     * Send success response with optional data.
     * @param {Response} res - Express response
     * @param {*} data - Response payload
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status (default: 200)
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            status: 'success',
            message,
            timestamp: new Date().toISOString(),
        };
        if (data !== null) {
            response.data = data;
        }
        return res.status(statusCode).json(response);
    }

    /**
     * Send 201 Created response for resource creation.
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Send 204 No Content response for successful deletions.
     */
    static noContent(res) {
        return res.status(204).send();
    }

    /**
     * Send error response.
     * @param {Response} res - Express response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status (default: 500)
     * @param {*} error - Additional error details
     */
    static error(res, message, statusCode = 500, error = null) {
        const response = {
            status: 'error',
            message,
            timestamp: new Date().toISOString(),
        };
        if (error) {
            response.error = error;
        }

        return res.status(statusCode).json(response);
    }
}

module.exports = ApiResponse;