/**
 * Request Logger Middleware
 * Logs HTTP request details (method, URL, status, duration, IP) on response finish.
 * Uses error level for 4xx/5xx responses, info for successful ones.
 */
const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        const message = JSON.stringify(logData);

        if (res.statusCode >= 400) {
            logger.error(message);
        } else {
            logger.info(message);
        }
    });

    next();
};

module.exports = requestLogger;