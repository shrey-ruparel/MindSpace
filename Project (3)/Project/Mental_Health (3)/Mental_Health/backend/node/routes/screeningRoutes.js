const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/screenings/phq9
// @desc    Submit PHQ-9 screening
// @access  Private
router.post('/phq9', authMiddleware, screeningController.submitPhq9);

// @route   POST /api/screenings/gad7
// @desc    Submit GAD-7 screening
// @access  Private
router.post('/gad7', authMiddleware, screeningController.submitGad7);

// @route   GET /api/screenings/me
// @desc    Get all screenings for the logged-in user
// @access  Private
router.get('/me', authMiddleware, screeningController.getUserScreenings);

module.exports = router;
