const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Token = require('../models/Token');
const Service = require('../models/Service');
const QueueManager = require('../dsa/QueueManager');
const { v4: uuidv4 } = require('uuid');

// In-memory queue managers for each service
const queueManagers = new Map();

/**
 * Get or create queue manager for service
 */
/**
 * Get or create queue manager for service
 */
async function getQueueManager(serviceId, counters) {
    if (!queueManagers.has(serviceId)) {
        console.log(`[QueueManager] Creating new manager for ${serviceId}`);
        const manager = new QueueManager(serviceId, counters || []);

        // Hydrate from DB to restore waiting tokens
        try {
            const existingTokens = await Token.find({
                serviceId: serviceId,
                status: 'waiting'
            }).sort({ joinedAt: 1 }); // Sort by arrival (priority handled by hydrate/enqueue)

            if (existingTokens.length > 0) {
                manager.hydrate(existingTokens);
            }
        } catch (err) {
            console.error('[QueueManager] Hydration failed:', err);
        }

        queueManagers.set(serviceId, manager);
    }
    const manager = queueManagers.get(serviceId);
    // Ensure counters are up to date
    if (manager && counters && counters.length > 0) {
        manager.syncCounters(counters);
    }
    return manager;
}

/**
 * @route   POST /api/tokens/join
 * @desc    Join queue (customer creates token)
 * @access  Public
 */
router.post('/join', [
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('priority').optional().isIn(['normal', 'priority']).withMessage('Invalid priority')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        console.log('[Join] Request received:', req.body);
        const { serviceId, priority, priorityReason, customerName, gender } = req.body;

        // Get service
        const service = await Service.findById(serviceId);

        if (!service || !service.isActive) {
            return res.status(404).json({
                success: false,
                error: 'Service not found or inactive'
            });
        }

        // Generate token number
        const tokenNumber = service.getNextTokenNumber();
        await service.save();

        // Generate customer ID (in production, this would be from session/auth)
        const customerId = uuidv4();

        // Create token in database
        const token = await Token.create({
            number: tokenNumber,
            serviceId: service._id,
            organizationId: service.organizationId,
            customerId,
            customerName: customerName || 'Guest',
            gender: gender || 'not_disclosed',
            priority: priority || 'normal',
            priorityReason: priorityReason || null,
            status: 'waiting'
        });

        // Get queue manager (syncs counters)
        const counters = (service.counters || []).map(c => ({
            id: c._id.toString(),
            name: c.name,
            status: c.status || 'active',
            queueStartTime: c.queueStartTime,
            queueEndTime: c.queueEndTime
        }));

        console.log(`[Join] Initializing QueueManager for ${serviceId} with ${counters.length} counters`);
        let queueManager;
        try {
            queueManager = await getQueueManager(serviceId, counters);
        } catch (err) {
            console.error('[Join] Failed to get/create QueueManager:', err);
            throw err;
        }

        // Add to queue
        console.log('[Join] Adding token to QueueManager...');
        const queueData = queueManager.addToken({
            id: token._id.toString(),
            number: tokenNumber,
            priority: priority || 'normal',
            customerId,
            customerName: customerName || 'Guest',
            gender: gender || 'not_disclosed'
        });
        console.log('[Join] Token added successfully:', queueData);

        // Update token with position, wait time, and counter assignment
        token.position = queueData.position;
        token.estimatedWaitTime = queueData.estimatedWaitTime; // In seconds
        token.counterId = queueData.counterId; // Assigned counter
        await token.save();

        // Get counter name for display
        const assignedCounter = service.counters.find(c => c._id.toString() === queueData.counterId);
        const counterName = assignedCounter ? assignedCounter.name : 'TBD';

        // Update service stats
        service.stats.todayTokens++;
        service.stats.totalTokens++;
        await service.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${serviceId}`).emit('queue-updated', {
            queueStatus: queueManager.getQueueStatus()
        });

        // Convert wait time to minutes for frontend
        const waitTimeMinutes = Math.ceil((queueData.estimatedWaitTime || 0) / 60);

        res.status(201).json({
            success: true,
            data: {
                token: {
                    id: token._id,
                    number: token.number,
                    position: token.position,
                    estimatedWaitTime: waitTimeMinutes, // Minutes for display
                    priority: token.priority,
                    status: token.status,
                    counterId: queueData.counterId,
                    counterName: counterName
                },
                customerId
            }
        });
    } catch (error) {
        console.error('Join queue error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message
        });
    }
});

/**
 * @route   GET /api/tokens/:tokenId/status
 * @desc    Get token status (for customer tracking)
 * @access  Public
 */
router.get('/:tokenId/status', async (req, res) => {
    try {
        const token = await Token.findById(req.params.tokenId);

        if (!token) {
            return res.status(404).json({
                success: false,
                error: 'Token not found'
            });
        }

        const queueManager = queueManagers.get(token.serviceId.toString());

        let position = token.position;
        let estimatedWaitTime = token.estimatedWaitTime;

        if (queueManager && token.status === 'waiting') {
            position = queueManager.getTokenPosition(token._id.toString());
            estimatedWaitTime = queueManager.predictWaitTime(position);
        }

        // Get counter name
        let counterName = null;
        if (token.counterId) {
            const service = await Service.findById(token.serviceId);
            if (service) {
                const counter = service.counters.find(c => c._id.toString() === token.counterId);
                counterName = counter ? counter.name : token.counterId;
            }
        }

        // Convert wait time to minutes for frontend — round to avoid decimals
        const waitTimeMinutes = Math.round((estimatedWaitTime || 0) / 60);

        res.status(200).json({
            success: true,
            data: {
                number: token.number,
                status: token.status,
                position,
                estimatedWaitTime: waitTimeMinutes, // Minutes (whole number)
                joinedAt: token.joinedAt || token.createdAt, // For actual wait calculation
                counterId: token.counterId,
                counterName: counterName,
                priority: token.priority
            }
        });
    } catch (error) {
        console.error('Get token status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/tokens/call-next
 * @desc    Call next token (staff action)
 * @access  Public (should be protected in production)
 */
router.post('/call-next', [
    body('serviceId').notEmpty().withMessage('Service ID is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { serviceId, counterId } = req.body;

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }



        // Get queue manager (syncs counters and schedules)
        const queueManager = await getQueueManager(
            serviceId,
            service.counters.map(c => ({
                id: c._id.toString(),
                name: c.name,
                status: c.status,
                queueStartTime: c.queueStartTime,
                queueEndTime: c.queueEndTime
            }))
        );

        if (!queueManager) {
            // Should be created by above call if service exists, but technically could fail logic
            return res.status(500).json({
                success: false,
                error: 'Failed to initialize queue manager'
            });
        }

        // Assign next token
        const assignment = queueManager.assignNextToken(counterId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: 'No active counters or no tokens in queue'
            });
        }

        // Update token in database
        const token = await Token.findById(assignment.token.id);
        token.status = 'called';
        token.calledAt = new Date();
        token.counterId = assignment.counter.id;
        await token.save();

        // Emit socket events
        const io = req.app.get('io');

        // Notify customer
        io.to(`service-${serviceId}`).emit('token-called', {
            tokenId: token._id,
            tokenNumber: token.number,
            counterId: assignment.counter.id,
            counterName: assignment.counter.name
        });

        // Update queue display
        io.to(`service-${serviceId}`).emit('queue-updated', {
            queueStatus: queueManager.getQueueStatus()
        });

        res.status(200).json({
            success: true,
            data: {
                token: {
                    id: token._id,
                    number: token.number,
                    counterId: assignment.counter.id,
                    counterName: assignment.counter.name
                }
            }
        });
    } catch (error) {
        console.error('Call next token error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/tokens/:tokenId/serve
 * @desc    Mark token as served
 * @access  Public (should be protected in production)
 */
router.post('/:tokenId/serve', async (req, res) => {
    try {
        const token = await Token.findById(req.params.tokenId);

        if (!token) {
            return res.status(404).json({
                success: false,
                error: 'Token not found'
            });
        }

        const queueManager = queueManagers.get(token.serviceId.toString());

        if (queueManager) {
            const serviceData = queueManager.markServed(token._id.toString());

            if (serviceData) {
                token.actualWaitTime = serviceData.waitTime;
                token.actualServiceTime = serviceData.serviceTime;
            }
        }

        token.status = 'served';
        token.servedAt = new Date();
        await token.save();

        // Update service stats
        const service = await Service.findById(token.serviceId);
        if (service && queueManager) {
            const stats = queueManager.getQueueStatus().stats;
            service.stats.avgWaitTime = stats.avgWaitTime;
            service.stats.avgServiceTime = stats.avgServiceTime;
            await service.save();
        }

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${token.serviceId}`).emit('queue-updated', {
            queueStatus: queueManager ? queueManager.getQueueStatus() : null
        });

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (error) {
        console.error('Mark served error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   POST /api/tokens/:tokenId/skip
 * @desc    Skip token (no-show)
 * @access  Public (should be protected in production)
 */
router.post('/:tokenId/skip', async (req, res) => {
    try {
        const token = await Token.findById(req.params.tokenId);

        if (!token) {
            return res.status(404).json({
                success: false,
                error: 'Token not found'
            });
        }

        const queueManager = queueManagers.get(token.serviceId.toString());

        if (queueManager) {
            queueManager.skipToken(token._id.toString());
        }

        token.status = 'skipped';
        token.skippedAt = new Date();
        await token.save();

        // Emit socket event
        const io = req.app.get('io');
        io.to(`service-${token.serviceId}`).emit('queue-updated', {
            queueStatus: queueManager ? queueManager.getQueueStatus() : null
        });

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (error) {
        console.error('Skip token error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

/**
 * @route   GET /api/tokens/service/:serviceId/queue
 * @desc    Get current queue status (Public) - Returns all active tokens (waiting, called, serving)
 * @access  Public
 */
router.get('/service/:serviceId/queue', async (req, res) => {
    try {
        // Get service to map counter names
        const service = await Service.findById(req.params.serviceId);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        // Fetch all active tokens
        const tokens = await Token.find({
            serviceId: req.params.serviceId,
            status: { $in: ['waiting', 'called', 'serving'] }
        }).sort({ joinedAt: 1 });

        const formattedTokens = tokens.map(t => {
            // Map counter name
            let counterName = null;
            if (t.counterId && service.counters) {
                const counter = service.counters.find(c => c._id.toString() === t.counterId.toString());
                if (counter) counterName = counter.name;
            }

            return {
                id: t._id,
                tokenNumber: t.number,
                number: t.number, // Backward compatibility
                status: t.status,
                priority: t.priority,
                customerName: t.customerName || 'Guest',
                gender: t.gender || 'not_disclosed',
                counterId: t.counterId,
                counterName: counterName,
                joinedAt: t.joinedAt || t.createdAt,
                position: t.position,
                estimatedWaitTime: t.estimatedWaitTime
            };
        });

        res.status(200).json({
            success: true,
            data: {
                // 'queue' will contain everything needed for the display
                queue: formattedTokens,
                // 'waitingTokens' for backward compatibility
                waitingTokens: formattedTokens.filter(t => t.status === 'waiting'),
                queueStatus: {
                    totalWaiting: formattedTokens.filter(t => t.status === 'waiting').length,
                    active: true
                }
            }
        });
    } catch (error) {
        console.error('Get queue status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});


/**
 * @route   GET /api/tokens/service/:serviceId
 * @desc    Get all tokens for a service from database
 * @access  Private (should add auth in production)
 */
router.get('/service/:serviceId', async (req, res) => {
    try {
        const tokens = await Token.find({
            serviceId: req.params.serviceId,
            status: { $in: ['waiting', 'called', 'serving'] }
        }).sort({ joinedAt: 1 });

        res.status(200).json({
            success: true,
            data: tokens.map(t => ({
                _id: t._id,
                tokenNumber: t.number,
                number: t.number,
                status: t.status,
                priority: t.priority,
                customerName: t.customerName || 'Anonymous',
                joinedAt: t.joinedAt || t.createdAt,
                calledAt: t.calledAt,
                counterId: t.counterId,
                position: t.position,
                estimatedWaitTime: t.estimatedWaitTime
            }))
        });
    } catch (error) {
        console.error('Get service tokens error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

module.exports = router;
module.exports.queueManagers = queueManagers;
