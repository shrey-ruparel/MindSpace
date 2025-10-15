const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/chatbot/query
// @desc    Send query to AI chatbot and get response
// @access  Private
router.post('/query', authMiddleware, chatbotController.chatbotQuery);

module.exports = router;
