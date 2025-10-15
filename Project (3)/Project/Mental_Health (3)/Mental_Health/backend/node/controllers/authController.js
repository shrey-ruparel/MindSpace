const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const crypto = require('crypto');
const otpGenerator = require('otp-generator');
const transporter = require('../config/emailConfig'); // Import the nodemailer transporter

const generateAccessToken = (id, role) => {
    return jwt.sign({ user: { id, role } }, process.env.JWT_SECRET, { expiresIn: '7d' }); // 7 days expiry
};

const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex'); // Generate a random refresh token
};

// Placeholder for sending OTP email
const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER, // Sender address
            to: email, // List of receivers
            subject: 'Your OTP for Mental Health App Registration', // Subject line
            html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`, // HTML body
        });
        console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
        console.error(`Error sending OTP to ${email}:`, error);
    }
};

exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        const otp_expiration = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        user = new User({
            name,
            email,
            password_hash: password, // Will be hashed below
            role,
            otp,
            otp_expiration,
            isVerified: (role === 'student') ? true : false // Students are verified directly, others need OTP
        });

        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(password, salt);
        
        // No refresh token or access token generated yet, as user is not verified

        await user.save();

        // Send OTP email (placeholder)
        await sendOTPEmail(email, otp);

        res.status(200).json({ msg: 'User registered successfully. Please verify your email with the OTP sent to your email address.', userId: user._id });

    } catch (err) {
        console.error('Error during user registration:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'User not found' });
        }

        if (user.otp !== otp || user.otp_expiration < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined; // Clear OTP after successful verification
        user.otp_expiration = undefined; // Clear OTP expiration

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken();
        user.refreshToken = refreshToken;

        await user.save();

        res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });

    } catch (err) {
        console.error('Error during OTP verification:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if user is verified (only for non-student roles)
        if (!user.isVerified && (user.role === 'admin' || user.role === 'counsellor')) {
            return res.status(400).json({ msg: 'Account not verified. Please verify your email with the OTP sent to your email address.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // If user is admin or counsellor, initiate OTP verification for login
        if (user.role === 'admin' || user.role === 'counsellor') {
            const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
            const otp_expiration = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

            user.otp = otp;
            user.otp_expiration = otp_expiration;
            await user.save();

            await sendOTPEmail(email, otp);

            return res.status(200).json({ msg: 'OTP sent to your email. Please verify to log in.', userId: user._id, email: user.email, otpRequiredForLogin: true });
        }
        // For student roles, if password matches and account is verified, proceed directly to login
        // (The !user.isVerified check above will handle unverified students, though with new registration they should be verified)

        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save();

        res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error('Error during user login:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ msg: 'Refresh Token Not Found' });
    }

    try {
        const user = await User.findOne({ refreshToken });

        if (!user) {
            return res.status(403).json({ msg: 'Invalid Refresh Token' });
        }

        // Generate new access and refresh tokens
        const newAccessToken = generateAccessToken(user.id, user.role);
        const newRefreshToken = generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error('Error refreshing token:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const user = await User.findOne({ refreshToken });

        if (user) {
            user.refreshToken = null; // Invalidate refresh token
            await user.save();
        }

        res.status(200).json({ msg: 'Logged out successfully' });

    } catch (err) {
        console.error('Error during logout:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'profile_pictures',
        });

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Delete old profile picture if exists
        if (user.profile_picture) {
            const publicId = user.profile_picture.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        }

        user.profile_picture = result.secure_url;
        await user.save();

        // Delete local file
        fs.unlinkSync(req.file.path);

        res.json({ msg: 'Profile picture updated', profile_picture: user.profile_picture });

    } catch (err) {
        console.error('Error updating profile picture:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash -refreshToken'); // Exclude refreshToken
        res.json(user);
    } catch (err) {
        console.error('Error getting user data:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};
