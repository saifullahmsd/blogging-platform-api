/**
 * CORS Configuration
 * Restricts cross-origin requests to whitelisted domains from ALLOWED_ORIGINS env var.
 */
const env = require('./validateEnv');

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim());

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 //24 hours
};

module.exports = corsOptions;