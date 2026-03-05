const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/organizations/public/:id
 * @desc    Get single organization (Public)
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: organization._id,
                name: organization.name,
                description: organization.description,
                logo: organization.logo
            }
        });
    } catch (error) {
        console.error('Get public organization error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Protected routes below
router.use(protect);

/**
 * @route   GET /api/organizations
 * @desc    Get all organizations for logged-in user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const organizations = await Organization.find({ userId: req.user._id });

        res.status(200).json({
            success: true,
            count: organizations.length,
            data: organizations
        });
    } catch (error) {
        console.error('Get organizations error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   GET /api/organizations/:id
 * @desc    Get single organization
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const organization = await Organization.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        res.status(200).json({
            success: true,
            data: organization
        });
    } catch (error) {
        console.error('Get organization error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/organizations
 * @desc    Create new organization
 * @access  Private
 */
router.post('/', [
    body('name').trim().notEmpty().withMessage('Organization name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const organizationData = {
            ...req.body,
            userId: req.user._id
        };

        const organization = await Organization.create(organizationData);

        res.status(201).json({
            success: true,
            data: organization
        });
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        let organization = await Organization.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        organization = await Organization.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: organization
        });
    } catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const organization = await Organization.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        await organization.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete organization error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
});

module.exports = router;
