const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/gamification/stats
// @desc    Get gamification stats for the logged-in user
// @access  Private
router.get('/stats', authMiddleware, gamificationController.getUserStats);

// @route   POST /api/gamification/award-badge
// @desc    Manually award a badge (Admin only)
// @access  Private (Admin)
router.post('/award-badge', authMiddleware, gamificationController.awardBadgeManually);

module.exports = router;
