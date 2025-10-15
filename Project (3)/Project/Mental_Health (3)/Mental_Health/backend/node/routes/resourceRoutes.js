const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/resources
// @desc    Create a new resource (Admin/Counsellor)
// @access  Private (Admin/Counsellor)
router.post('/', authMiddleware, upload.single('file'), (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'counsellor') {
        return res.status(403).json({ msg: 'Not authorized to create resources' });
    }
    next();
}, resourceController.createResource);

// @route   GET /api/resources
// @desc    Get all resources
// @access  Public
router.get('/', resourceController.getResources);

// @route   GET /api/resources/:id
// @desc    Get resource by ID
// @access  Public
router.get('/:id', resourceController.getResourceById);

// @route   GET /api/resources/download/:id
// @desc    Download a resource file
// @access  Public
router.get('/download/:id', resourceController.downloadResource);

// @route   POST /api/resources/download/:id
// @desc    Increment download count for a resource
// @access  Public
router.post('/download/:id', resourceController.increment_download_count);

module.exports = router;
