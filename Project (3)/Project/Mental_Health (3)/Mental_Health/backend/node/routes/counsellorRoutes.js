const express = require('express');
const router = express.Router();
const { requestCounsellorApproval, editCounsellor, getCounsellorById, getCounsellorChatHistory } = require('../controllers/counsellorController');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/counsellors/request-approval
// @desc    Counsellor submits their profile for approval
// @access  Private (Counsellor)
router.post('/request-approval', authMiddleware, upload.single('profile_picture'), requestCounsellorApproval);

// @route   PUT /api/counsellors/:id
// @desc    Counsellor updates their own profile
// @access  Private (Counsellor - ensure user can only update their own profile)
router.put('/:id', authMiddleware, upload.single('profile_picture'), editCounsellor);

// @route   GET /api/counsellors/:id
// @desc    Get a single counsellor's details
// @access  Public (or Private depending on future needs)
router.get('/:id', getCounsellorById);

// @route   GET /api/counsellors/chat-history/:studentId/:appointmentId
// @desc    Counsellor gets decrypted chatbot history for a specific student and approved appointment
// @access  Private (Counsellor)
router.get('/chat-history/:studentId/:appointmentId', authMiddleware, getCounsellorChatHistory);

module.exports = router;
