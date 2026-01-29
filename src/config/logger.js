/**
 * Winston Logger Configuration
 * Provides structured JSON logging with file rotation and console output in development.
 */
const winston = require('winston');
const path = require('path');
const env = require('./validateEnv');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Check if running in serverless environment (Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const transports = [];

// File transports only for non-serverless environments
if (!isServerless) {
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    );
}

// Console transport for serverless and development
if (isServerless || (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test')) {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    );
}

// Fallback: ensure at least one transport exists
if (transports.length === 0) {
    transports.push(new winston.transports.Console());
}

const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: logFormat,
    defaultMeta: { service: 'blogging-api' },
    transports
});

module.exports = logger;