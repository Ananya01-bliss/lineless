const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');
const QRCode = require('qrcode');

/**
 * @route   GET /api/services/public/:id
 * @desc    Get single service (Public)
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   GET /api/services/public/organization/:orgId
 * @desc    Get all active services for an organization (Public)
 * @access  Public
 */
router.get('/public/organization/:orgId', async (req, res) => {
    try {
        const services = await Service.find({ organizationId: req.params.orgId, isActive: true });
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Protected routes below
router.use(protect);

/**
 * @route   GET /api/services/organization/:orgId
 * @desc    Get all services for an organization
 * @access  Private
 */
router.get('/organization/:orgId', async (req, res) => {
    try {
        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: req.params.orgId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        const services = await Service.find({ organizationId: req.params.orgId });

        res.status(200).json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   GET /api/services/:id
 * @desc    Get single service
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: service.organizationId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private
 */
router.post('/', [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('organizationId').notEmpty().withMessage('Organization ID is required'),
    body('counters').isArray({ min: 1 }).withMessage('At least one counter is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: req.body.organizationId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        const service = await Service.create(req.body);

        // Generate QR code - Forcing IP for mobile connectivity
        let baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        if (baseUrl.includes('localhost')) {
            baseUrl = baseUrl.replace('localhost', '10.229.154.68');
        }
        const qrData = `${baseUrl}/join/${service._id}`;
        const qrCode = await QRCode.toDataURL(qrData);
        service.qrCode = qrCode;
        await service.save();

        res.status(201).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        let service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: service.organizationId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: service.organizationId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        await service.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   PUT /api/services/:id/counter/:counterId
 * @desc    Update counter status
 * @access  Private
 */
router.put('/:id/counter/:counterId', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        const counter = service.counters.id(req.params.counterId);

        if (!counter) {
            return res.status(404).json({
                success: false,
                error: 'Counter not found'
            });
        }

        Object.assign(counter, req.body);
        await service.save();

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        console.error('Update counter error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// ... (existing code)

/**
 * @route   POST /api/services/:id/counter/:counterId/pause
 * @desc    Pause an individual counter
 * @access  Private
 */
router.post('/:id/counter/:counterId/pause', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        const counter = service.counters.id(req.params.counterId);
        if (!counter) {
            return res.status(404).json({ success: false, error: 'Counter not found' });
        }

        counter.status = 'paused';
        await service.save();

        // Also update the in-memory QueueManager if it exists
        const { queueManagers } = require('./tokens'); // Reuse the same map
        const qm = queueManagers ? queueManagers.get(req.params.id) : null;
        if (qm) qm.pauseCounter(req.params.counterId);

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('counter-status-changed', {
            counterId: req.params.counterId,
            status: 'paused'
        });

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Pause counter error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   POST /api/services/:id/counter/:counterId/resume
 * @desc    Resume an individual counter
 * @access  Private
 */
router.post('/:id/counter/:counterId/resume', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        const counter = service.counters.id(req.params.counterId);
        if (!counter) {
            return res.status(404).json({ success: false, error: 'Counter not found' });
        }

        counter.status = 'active';
        await service.save();

        // Also update the in-memory QueueManager if it exists
        const { queueManagers } = require('./tokens');
        const qm = queueManagers ? queueManagers.get(req.params.id) : null;
        if (qm) qm.resumeCounter(req.params.counterId);

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('counter-status-changed', {
            counterId: req.params.counterId,
            status: 'active'
        });

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Resume counter error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   POST /api/services/:id/qr
 * @desc    Generate QR code for service
 * @access  Private
 */
router.post('/:id/qr', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        // Verify organization belongs to user
        const organization = await Organization.findOne({
            _id: service.organizationId,
            userId: req.user._id
        });

        if (!organization) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Generate QR code - Forcing IP for mobile connectivity
        let baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        if (baseUrl.includes('localhost')) {
            baseUrl = baseUrl.replace('localhost', '10.229.154.68');
        }
        const qrData = `${baseUrl}/join/${service._id}`;
        const qrCode = await QRCode.toDataURL(qrData);

        service.qrCode = qrCode;
        await service.save();

        res.status(200).json({
            success: true,
            data: { qrCode }
        });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/services/:id/pause
 * @desc    Pause the queue
 * @access  Private
 */
router.post('/:id/pause', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        service.queueStatus = 'paused';
        service.pausedAt = new Date();
        service.pauseMessage = req.body.message || 'Queue is temporarily paused. Please wait.';
        await service.save();

        // Emit socket event to notify all clients
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('queue-status-changed', {
            status: 'paused',
            message: service.pauseMessage,
            pausedAt: service.pausedAt
        });

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Pause queue error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   POST /api/services/:id/resume
 * @desc    Resume the queue
 * @access  Private
 */
router.post('/:id/resume', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        service.queueStatus = 'active';
        service.pausedAt = null;
        await service.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('queue-status-changed', {
            status: 'active',
            message: 'Queue is now active!'
        });

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Resume queue error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   POST /api/services/:id/schedule
 * @desc    Set queue schedule
 * @access  Private
 */
router.post('/:id/schedule', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        const { startTime, endTime, counterId } = req.body;

        if (counterId) {
            const counter = service.counters.id(counterId);
            if (!counter) {
                return res.status(404).json({ success: false, error: 'Counter not found' });
            }

            if (startTime) counter.queueStartTime = new Date(startTime);
            if (endTime) counter.queueEndTime = new Date(endTime);

            // If explicit empty string passed (clearing schedule)
            if (startTime === '') counter.queueStartTime = null;
            if (endTime === '') counter.queueEndTime = null;

        } else {
            if (startTime) {
                service.queueStartTime = new Date(startTime);
                // If start time is in future, set status to scheduled
                if (new Date(startTime) > new Date()) {
                    service.queueStatus = 'scheduled';
                } else {
                    service.queueStatus = 'active';
                }
            } else if (startTime === '') {
                service.queueStartTime = null;
            }

            if (endTime) {
                service.queueEndTime = new Date(endTime);
            } else if (endTime === '') {
                service.queueEndTime = null;
            }
        }

        await service.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('queue-status-changed', {
            status: service.queueStatus,
            startTime: service.queueStartTime,
            endTime: service.queueEndTime,
            counterId: counterId // Include this so frontend knows
        });

        res.status(200).json({ success: true, data: service });
    } catch (error) {
        console.error('Schedule queue error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   POST /api/services/:id/fresh-start
 * @desc    Reset token sequence to T001 and clear active queue for a new day
 * @access  Private
 */
router.post('/:id/fresh-start', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        // Auth check
        const organization = await Organization.findOne({
            _id: service.organizationId,
            userId: req.user._id
        });
        if (!organization) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        const Token = require('../models/Token');

        // 1. Cancel all currently active/waiting tokens in DB
        await Token.updateMany(
            {
                serviceId: req.params.id,
                status: { $in: ['waiting', 'called', 'serving'] }
            },
            {
                $set: { status: 'cancelled', cancelledAt: new Date() }
            }
        );

        // 2. Reset token number counter on service
        service.currentTokenNumber = 0;
        service.queueStatus = 'active';
        await service.save();

        // 3. Clear the in-memory QueueManager so it starts fresh
        const { queueManagers } = require('./tokens');
        if (queueManagers && queueManagers.has(req.params.id)) {
            queueManagers.delete(req.params.id); // Forces re-init on next token join
        }

        // 4. Notify all connected clients
        const io = req.app.get('io');
        io.to(`service-${req.params.id}`).emit('queue-updated', { freshStart: true });
        io.to(`service-${req.params.id}`).emit('queue-status-changed', {
            status: 'active',
            message: '🔄 Fresh start — token numbering reset to T001'
        });

        res.status(200).json({
            success: true,
            message: 'Queue reset successfully. Token numbering will restart from T001.',
            data: { currentTokenNumber: 0 }
        });
    } catch (error) {
        console.error('Fresh start error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;

