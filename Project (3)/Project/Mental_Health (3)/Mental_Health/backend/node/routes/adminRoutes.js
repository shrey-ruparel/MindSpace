const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { addCounsellor, editCounsellor, removeCounsellor, listCounsellors, listPendingCounsellors, updateCounsellorStatus } = require('../controllers/counsellorController');
const { createResource, editResource, removeResource, getResources } = require('../controllers/resourceController');
const checkAdminAuth = require('../middleware/adminAuthMiddleware');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware'); // Import authMiddleware

// All admin routes will use the authentication middleware first, then the adminAuth middleware
router.use(authMiddleware, checkAdminAuth);

// Existing Admin Routes (User Management & Analytics)
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);
router.get('/analytics', adminController.getAdminAnalytics);
router.put('/users/:id/role', adminController.updateUserRole);

// Counsellor Management Routes
router.post('/counsellors/add', upload.single('profile_picture'), addCounsellor);
router.put('/counsellors/edit/:id', upload.single('profile_picture'), editCounsellor);
router.delete('/counsellors/remove/:id', removeCounsellor);
router.get('/counsellors', listCounsellors);
router.get('/counsellors/pending', listPendingCounsellors);
router.put('/counsellors/status/:id', updateCounsellorStatus);

// Resource Management Routes (with file upload for add/edit)
router.post('/resources/add', upload.single('resource_file'), createResource);
router.put('/resources/edit/:id', upload.single('resource_file'), editResource);
router.delete('/resources/remove/:id', removeResource);
router.get('/resources', getResources);

module.exports = router;
