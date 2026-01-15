/**
 * API v1 Route Aggregator
 * Mounts all v1 API routes under their respective prefixes.
 */
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);

module.exports = router;