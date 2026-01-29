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
const upload = require('../middlewares/upload.middleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');


const app = express();

// Trust proxy for Vercel/reverse proxy
app.set('trust proxy', 1);

// Helmet with Swagger-compatible CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
        }
    },
    crossOriginEmbedderPolicy: false,
}));

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
    skip: (req) => env.NODE_ENV === 'development' || req.path.startsWith('/v1/docs')
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(requestLogger);
app.use('/health', healthRoutes);

// Swagger UI with CDN assets for serverless
const swaggerOptions = {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js'
    ]
};
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

app.use('/api/v1', v1Routes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health Check
 *     description: Returns the status, message, and version of the API.
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Blogging Platform API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 docs:
 *                   type: string
 *                   example: /api/v1/docs
 */
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