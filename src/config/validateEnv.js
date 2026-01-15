/**
 * Environment Variable Validation
 * Validates and exports type-safe environment configuration using envalid.
 * Process exits with error details if required variables are missing or invalid.
 */
require('dotenv').config();
const { cleanEnv, str, port, url, num } = require('envalid');

const env = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ['development', 'production', 'test'],
        default: 'development'
    }),
    PORT: port({ default: 5000 }),
    MONGO_URI: url({ desc: 'MongoDB connection string' }),
    LOG_LEVEL: str({
        choices: ['error', 'warn', 'info', 'debug'],
        default: 'info'
    }),
    ALLOWED_ORIGINS: str({ desc: 'Comma-separated allowed origins' }),

    // JWT Configuration
    JWT_ACCESS_SECRET: str({
        minLength: 32,
        desc: 'JWT access secret'
    }),
    JWT_REFRESH_SECRET: str({
        minLength: 32,
        desc: 'JWT refresh secret'
    }),
    JWT_ACCESS_EXPIRY: str({
        default: '15m',
        desc: 'e.g., 15m, 1h'
    }),
    JWT_REFRESH_EXPIRY: str({
        default: '7d',
        desc: 'e.g., 7d, 30d'
    }),

    // Security Configuration
    BCRYPT_ROUNDS: num({
        default: 12,
        desc: 'Number of bcrypt rounds'
    }),
    MAX_LOGIN_ATTEMPTS: num({
        default: 5,
        desc: 'Max Login attempts before lockout'
    }),
    LOCK_TIME: str({
        default: '2h',
        desc: 'Account lock duration'
    })
}, {
    reporter: ({ errors }) => {
        if (Object.keys(errors).length > 0) {
            console.error('Invalid environment variables:');
            Object.entries(errors).forEach(([key, err]) => {
                console.error(`  ${key}: ${err.message}`);
            });
            process.exit(1);
        }
    }
});

module.exports = env;
