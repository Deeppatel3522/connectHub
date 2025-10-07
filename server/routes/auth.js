const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/user');
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../services/emailService');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Validate input
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                error: existingUser.email === email ?
                    'Email already registered' :
                    'Username already taken'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password, // Will be hashed by pre-save middleware
            firstName,
            lastName
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userData,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                error: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (without password)
        const userData = {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName
        };

        res.json({
            message: 'Login successful',
            user: userData,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Forgot password - Send reset email
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.firstName);

        if (emailResult.success) {
            res.json({
                message: 'If an account with that email exists, we have sent a password reset link.'
            });
        } else {
            console.error('Failed to send reset email:', emailResult.error);
            res.status(500).json({
                error: 'Failed to send reset email. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error during password reset request' });
    }
});

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (!password || !confirmPassword) {
            return res.status(400).json({
                error: 'Password and confirm password are required'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Hash the token to compare with database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Password reset token is invalid or has expired'
            });
        }

        // Update password
        user.password = password; // Will be hashed by pre-save middleware
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        // Send confirmation email
        await sendPasswordResetConfirmation(user.email, user.firstName);

        res.json({
            message: 'Password has been reset successfully! You can now log in with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

// Verify reset token (optional - to check if token is valid before showing form)
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Password reset token is invalid or has expired'
            });
        }

        res.json({
            message: 'Token is valid',
            email: user.email // You can show masked email for confirmation
        });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
