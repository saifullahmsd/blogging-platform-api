/**
 * Health Check Routes
 * Provides system status endpoint for monitoring and load balancer health checks.
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System Health Check
 *     description: Returns the current health status of the API including database connection, memory usage, uptime, and environment. Use this endpoint for monitoring and load balancer health checks.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy, database is connected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 timestamp:
 *                   type: number
 *                   example: 1769196436978
 *                 status:
 *                   type: string
 *                   example: OK
 *                 environment:
 *                   type: string
 *                   example: development
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: string
 *                           example: 30MB
 *                         total:
 *                           type: string
 *                           example: 31MB
 *       503:
 *         description: System is degraded, database is disconnected
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