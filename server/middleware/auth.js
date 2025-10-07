const jwt = require('jsonwebtoken');
const User = require('../model/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Get full user information
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticateToken };
