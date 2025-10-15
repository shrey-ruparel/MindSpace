const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model is still needed for types, but won't be used for lookup here

const checkAdminAuth = async (req, res, next) => {
    // Assuming authMiddleware has already run and populated req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = checkAdminAuth;
