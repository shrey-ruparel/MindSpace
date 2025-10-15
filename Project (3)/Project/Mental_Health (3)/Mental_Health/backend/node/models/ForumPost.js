const mongoose = require('mongoose');

const ForumPostSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    flagged: {
        type: Boolean,
        default: false
    },
    media_url: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ForumPost', ForumPostSchema);
