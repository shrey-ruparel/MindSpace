const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    counsellor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    datetime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'scheduled', 'completed', 'cancelled'],
        default: 'pending'
    },
    suggested_datetime: {
        type: Date,
        required: false
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    cancellation_remark: {
        type: String,
        required: function() { return this.status === 'cancelled'; }
    },
    meetLink: {
        type: String
    },
    chatHistoryAccessStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'denied'],
        default: 'none'
    },
    chatHistoryAccessRequestedAt: {
        type: Date,
    },
    chatHistoryAccessRespondedAt: {
        type: Date,
    },
    chatHistoryAccessToken: {
        type: String,
    },
    chatHistoryAccessTokenExpires: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
