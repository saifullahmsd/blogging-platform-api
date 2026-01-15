/**
 * Database Configuration
 * Manages MongoDB connection lifecycle with connection pooling and event handlers.
 */
const mongoose = require('mongoose');
const env = require('./validateEnv');
const logger = require('./logger');

/** Tracks active connection state to prevent redundant connections */
let isConnected = false;

const connectDB = async () => {
    try {
        if (isConnected && mongoose.connection.readyState === 1) {
            logger.info('Using existing Database connection');
            return;
        };
        mongoose.set('strictQuery', true);
        const conn = await mongoose.connect(env.MONGO_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });

        isConnected = true;
        logger.info(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => {
            logger.error(`MongoDB connection error : ${err}`);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            logger.info('MongoDB disconnected');
            isConnected = false;
        })

    } catch (error) {
        logger.error(`Database connection failed : ${error}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    if (!isConnected) return;

    try {
        await mongoose.connection.close();
        isConnected = false;
        logger.info('MongoDB disconnected');
    } catch (error) {
        logger.error(`Error disconnecting MongoDB ${error}`);
    }
}

module.exports = {
    connectDB,
    disconnectDB,
};
