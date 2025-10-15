const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded JWT payload:', decoded);
        req.user = decoded.user;
        console.log('req.user after decoding:', req.user);
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
