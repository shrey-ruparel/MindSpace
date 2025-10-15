const mongoose = require('mongoose');

const CounsellorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    availability: {
        type: String, // e.g., "Mon-Fri, 9 AM - 5 PM"
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profile_picture: {
        type: String,
        default: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default_counsellor.png' // Default profile picture
    },
    bio: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Counsellor', CounsellorSchema);
