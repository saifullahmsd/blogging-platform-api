/**
 * Health Check Routes
 * Provides system status endpoint for monitoring and load balancer health checks.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @desc    System health status
 * @route   GET /health
 * @access  Public
 */
router.get('/', async (req, res) => {
    const health = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'OK',
        environment: process.env.NODE_ENV,
        services: {
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            memory: {
                used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
            }
        }
    };

    const statusCode = health.services.database === 'connected' ? 200 : 503;
    res.status(statusCode).json(health);
});

module.exports = router;