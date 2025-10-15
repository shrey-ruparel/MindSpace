const mongoose = require('mongoose');

const ChatbotLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    encryptedQuery: {
        type: String,
        required: true
    },
    encryptedResponse: {
        type: String,
        required: true
    },
    iv: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatbotLog', ChatbotLogSchema);
