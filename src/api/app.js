/**
 * Express Application Configuration
 * Sets up middleware stack: security (helmet, cors, rate limiting),
 * parsing (json, urlencoded, cookies), logging, and routing.
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const env = require('../config/validateEnv');
const corsOptions = require('../config/cors');
const requestLogger = require('../middlewares/logger.middleware');
const errorHandler = require('../middlewares/error.middleware');
const healthRoutes = require('../routes/health.routes');
const v1Routes = require('../routes/v1');
const upload = require('../middlewares/multer.middleware');

const app = express();

app.use(helmet());

app.use(cors(corsOptions));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'development'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(requestLogger);
app.use('/health', healthRoutes);
app.use('/api/v1', v1Routes);

// Root Route (Documentation Info)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Blogging Platform API',
        version: '1.0.0',
        docs: '/api/v1/docs'
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler);

module.exports = app;