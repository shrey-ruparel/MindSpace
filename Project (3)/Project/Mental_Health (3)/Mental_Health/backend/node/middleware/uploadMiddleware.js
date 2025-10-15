const multer = require('multer');

// Use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // List of allowed MIME types
    const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        // Documents
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        // Video
        'video/mp4', 'video/webm', 'video/ogg',
        // Archives
        'application/zip', 'application/x-rar-compressed',
        // Text
        'text/plain', 'text/csv'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('File type not allowed. Please upload a supported file type.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 50 // 50MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
