/**
 * Server Entry Point
 * Initializes database connection, starts HTTP server, and handles graceful shutdown.
 */
const app = require('./api/app');
const env = require('./config/validateEnv');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/database');

const PORT = env.PORT || 5000;
let server;

// Database Connection & Server Start
const startServer = async () => {
    try {

        await connectDB();


        server = app.listen(PORT, () => {
            logger.info(`✅ Server running on port ${PORT} in ${env.NODE_ENV} mode`);
            logger.info(`📝 API Docs available at http://localhost:${PORT}/`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful Shutdown Logic 
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            try {
                await disconnectDB();
                logger.info('Database connection closed');
                process.exit(0);
            } catch (err) {
                logger.error('Error during database disconnection', err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }

    // Force shutdown 
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

//System Signals Handling
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
    gracefulShutdown('unhandledRejection');
});