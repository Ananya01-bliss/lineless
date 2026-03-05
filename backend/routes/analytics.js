const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Service = require('../models/Service');
const { protect } = require('../middleware/auth');

router.use(protect);

/**
 * @route   GET /api/analytics/service/:serviceId
 * @desc    Get analytics for a service
 * @access  Private
 */
router.get('/service/:serviceId', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const service = await Service.findById(req.params.serviceId);

        if (!service) {
            return res.status(404).json({
                success: false,
                error: 'Service not found'
            });
        }

        const query = {
            serviceId: req.params.serviceId,
            status: 'served'
        };

        if (startDate && endDate) {
            query.joinedAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const tokens = await Token.find(query);

        // Initialize robust analytics structure
        const analytics = {
            totalTokens: tokens.length,
            avgWaitTime: 0,
            maxWaitTime: 0,
            avgServiceTime: 0,
            maxServiceTime: 0,

            // 1. Avg Wait Time (Horizontal Bar - by Hour)
            hourlyWaitTimes: Array(24).fill(0),

            // 2. Peak Load (Line + Area - Arrivals vs Served)
            hourlyArrivals: Array(24).fill(0),
            hourlyServed: Array(24).fill(0),

            // 3. Counter Utilization (Stacked - Busy Time vs Idle)
            counterStats: {}, // { id: { name, busyTime, servedCount } }

            // 4. Throughput (Combo - already covered by hourlyServed)

            // 5. Max Wait (KPI + Trend - Max Wait per Hour)
            hourlyMaxWait: Array(24).fill(0),

            // 6. Heatmap (Day x Hour)
            trafficHeatmap: Array(7).fill(0).map(() => Array(24).fill(0))
        };

        if (tokens.length > 0) {
            let totalWait = 0;
            let totalService = 0;
            let maxWait = 0;
            let maxService = 0;

            // Hourly aggregators
            const hourlyWaitSum = Array(24).fill(0);
            const hourlyWaitCount = Array(24).fill(0);

            tokens.forEach(token => {
                const joinedAt = new Date(token.joinedAt);
                const day = joinedAt.getDay(); // 0-6
                const hour = joinedAt.getHours(); // 0-23

                // 6. Heatmap
                analytics.trafficHeatmap[day][hour]++;

                // 2. Peak Load (Arrivals)
                analytics.hourlyArrivals[hour]++;

                // Wait Times
                let wait = 0;
                if (token.actualWaitTime) {
                    wait = token.actualWaitTime;
                    totalWait += wait;
                    maxWait = Math.max(maxWait, wait);

                    hourlyWaitSum[hour] += wait;
                    hourlyWaitCount[hour]++;
                    analytics.hourlyMaxWait[hour] = Math.max(analytics.hourlyMaxWait[hour], wait);
                }

                // Service Times
                let serviceTime = 0;
                if (token.actualServiceTime) {
                    serviceTime = token.actualServiceTime;
                    totalService += serviceTime;
                    maxService = Math.max(maxService, serviceTime);

                    // Served Hour (using servedAt or approximated by joined+wait+service)
                    // If status served, we likely have servedAt.
                    // Token schema check: 'servedAt' exists?
                    // Assuming servedAt matches 'joinedAt' roughly for hourly aggregation if servedAt missing.
                    // Ideally use token.servedAt
                    if (token.servedAt) {
                        const servedHour = new Date(token.servedAt).getHours();
                        analytics.hourlyServed[servedHour]++;
                    } else {
                        analytics.hourlyServed[hour]++; // Fallback
                    }
                }

                // 3. Counter Stats
                if (token.counterId) {
                    if (!analytics.counterStats[token.counterId]) {
                        analytics.counterStats[token.counterId] = { busyTime: 0, servedCount: 0 };
                    }
                    analytics.counterStats[token.counterId].servedCount++;
                    analytics.counterStats[token.counterId].busyTime += serviceTime;
                }
            });

            // Final Calculations
            analytics.totalTokens = tokens.length;
            analytics.avgWaitTime = tokens.length ? Math.round(totalWait / tokens.length) : 0;
            analytics.maxWaitTime = maxWait;
            analytics.avgServiceTime = tokens.length ? Math.round(totalService / tokens.length) : 0;
            analytics.maxServiceTime = maxService;

            // Hourly Averages
            analytics.hourlyWaitTimes = hourlyWaitSum.map((sum, i) =>
                hourlyWaitCount[i] ? Math.round(sum / hourlyWaitCount[i]) : 0
            );

            // Counter Utilization Percentages
            // To calculate %, we need the time range duration.
            // If date filter exists, use that. Else use "Today so far" or "First to Last Token".
            let durationSeconds = 0;
            if (startDate && endDate) {
                durationSeconds = (new Date(endDate) - new Date(startDate)) / 1000;
            } else {
                // Default to 12 hours (work day) or time since first token
                durationSeconds = 12 * 3600;
            }
            // Avoid division by zero
            if (durationSeconds < 1) durationSeconds = 3600;

            // Create a map for counter names
            const counterMap = {};
            if (service.counters && service.counters.length > 0) {
                service.counters.forEach(c => {
                    counterMap[c._id.toString()] = c.name;
                });
            }

            Object.keys(analytics.counterStats).forEach(id => {
                const stats = analytics.counterStats[id];
                // utilization = busyTime / duration
                // Cap at 100% just in case
                stats.utilization = Math.min(100, Math.round((stats.busyTime / durationSeconds) * 100));

                // Add name
                stats.name = counterMap[id] || `Counter ${id.slice(-4).toUpperCase()}`;
            });
        }

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

module.exports = router;
