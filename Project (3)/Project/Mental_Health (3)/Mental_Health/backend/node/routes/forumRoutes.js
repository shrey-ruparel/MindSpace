const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/forum
// @desc    Create a new forum post
// @access  Private
router.post('/', authMiddleware, upload.single('media_file'), forumController.createPost);

// @route   GET /api/forum
// @desc    Get all forum posts
// @access  Public
router.get('/', forumController.getPosts);

// @route   DELETE /api/forum/:id
// @desc    Delete a forum post
// @access  Private (Owner or Admin)
router.delete('/:id', authMiddleware, forumController.deletePost);

module.exports = router;
