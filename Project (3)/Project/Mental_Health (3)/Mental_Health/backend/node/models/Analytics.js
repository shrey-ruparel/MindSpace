const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    metric: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be any type
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
