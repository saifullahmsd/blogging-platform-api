/**
 * API v1 Route Aggregator
 * Mounts all v1 API routes under their respective prefixes.
 */
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const postRoutes = require('./post.routes');
const commentRoutes = require('./comment.routes');
const uploadRoutes = require('./upload.routes');

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;