const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   POST api/auth/logout
// @desc    Logout user and clear refresh token
// @access  Private
router.post('/logout', authMiddleware, authController.logout);

// @route   POST api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh-token', authController.refreshToken);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and activate user account
// @access  Public
router.post('/verify-otp', authController.verifyOTP);

// @route   PUT /api/auth/profile-picture
// @desc    Update user profile picture
// @access  Private
router.put('/profile-picture', authMiddleware, upload.single('profile_picture'), authController.updateProfilePicture);

module.exports = router;
