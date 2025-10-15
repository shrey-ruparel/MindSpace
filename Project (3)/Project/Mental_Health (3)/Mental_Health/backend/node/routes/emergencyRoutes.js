const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/emergency
// @desc    Trigger emergency support (e.g., panic button)
// @access  Private
router.post('/', authMiddleware, emergencyController.triggerEmergency);

// @route   POST /api/emergency/sos
// @desc    Send SOS alert with user details and location
// @access  Private
router.post('/sos', authMiddleware, emergencyController.sendSOSAlert);

module.exports = router;
