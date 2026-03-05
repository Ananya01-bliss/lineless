const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/auth');
const crypto = require('crypto');

// ── Whitelisted email domains ─────────────────────────────────────────────
const ALLOWED_DOMAINS = new Set([
    // Google
    'gmail.com', 'googlemail.com',
    // Microsoft
    'outlook.com', 'hotmail.com', 'hotmail.in', 'live.com', 'live.in', 'msn.com',
    // Yahoo
    'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'ymail.com',
    // Apple
    'icloud.com', 'me.com', 'mac.com',
    // Indian providers
    'rediffmail.com', 'sify.com',
    // ProtonMail
    'proton.me', 'protonmail.com',
    // Other popular
    'zoho.com', 'aol.com', 'mail.com', 'gmx.com', 'gmx.net',
    'tutanota.com', 'fastmail.com', 'yandex.com', 'yandex.ru',
]);

// Helper: check if a domain is allowed (also permits any .edu, .ac.in, .edu.in domain)
function isDomainAllowed(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    if (ALLOWED_DOMAINS.has(domain)) return true;
    // Allow any academic / institutional domain
    if (domain.endsWith('.edu') || domain.endsWith('.ac.in') ||
        domain.endsWith('.edu.in') || domain.endsWith('.ac.uk') ||
        domain.endsWith('.edu.au')) return true;
    return false;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        console.log('[Auth] Register request received:', req.body.email);
        console.time('[Auth] Registration Duration');
        const { name, email, password } = req.body;

        // ── Domain whitelist check ────────────────────────────────────────
        if (!isDomainAllowed(email)) {
            return res.status(400).json({
                success: false,
                error: 'This email domain is not accepted. Please use Gmail, Outlook, Yahoo, iCloud, or an institutional (.edu / .ac.in) address.',
                message: 'This email domain is not accepted. Please use Gmail, Outlook, Yahoo, iCloud, or an institutional (.edu / .ac.in) address.'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.timeEnd('[Auth] Registration Duration');
            return res.status(400).json({
                success: false,
                error: 'An account with this email already exists.',
                message: 'An account with this email already exists.'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            verificationToken: crypto.randomBytes(20).toString('hex')
        });

        // TODO: Send verification email

        sendTokenResponse(user, 201, res);
        console.timeEnd('[Auth] Registration Duration');
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack // Temporary debug info
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'No account found with this email address.',
                message: 'No account found with this email address.'
            });
        }

        // Check password
        console.time('Bcrypt Compare');
        const isMatch = await user.comparePassword(password);
        console.timeEnd('Bcrypt Compare');

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Incorrect password. Please try again.',
                message: 'Incorrect password. Please try again.'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No user found with that email'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // TODO: Send email with reset link

        res.status(200).json({
            success: true,
            message: 'Password reset email sent',
            resetToken // Remove in production, only for testing
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password/:resetToken
 * @desc    Reset password
 * @access  Public
 */
router.post('/reset-password/:resetToken', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset token'
            });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

module.exports = router;
