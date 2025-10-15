const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['student', 'counsellor', 'admin'],
        default: 'student'
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    anonymous_flag: {
        type: Boolean,
        default: false
    },
    profile_picture: {
        type: String,
        default: ''
    },
    streak: {
        type: Number,
        default: 0
    },
    badges: {
        type: [String],
        default: []
    },
    refreshToken: {
        type: String,
        required: false // Refresh token is not required initially
    },
    otp: String,
    otp_expiration: Date,
    isVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);
