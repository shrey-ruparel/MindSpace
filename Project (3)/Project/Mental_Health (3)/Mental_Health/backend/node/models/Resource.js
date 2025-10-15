const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pdf', 'audio', 'video', 'text', 'guide', 'tool'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    file_url: { // This will store the Cloudinary URL
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    duration: {
        type: String
    },
    rating: {
        type: Number,
        default: 0
    },
    downloads: {
        type: Number,
        default: 0
    },
    tags: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Resource', ResourceSchema);
