/**
 * Queue Manager - Orchestrates all DSA components
 * Integrates: FIFO Queue, Min-Heap, Sliding Window, Deque, HashMap
 * Purpose: Intelligent queue management with dynamic load balancing and predictions
 * 
 * DSA Concepts:
 * 1. Min-Heap: O(log n) for finding counter with least wait time
 * 2. FIFO Queue: O(1) enqueue/dequeue for fair ordering
 * 3. Sliding Window: O(1) average calculation for wait time prediction
 * 4. Deque: O(1) for no-show management (front/back operations)
 * 5. HashMap: O(1) for token state lookups
 */

const FIFOQueue = require('./FIFOQueue');
const MinHeap = require('./MinHeap');
const SlidingWindow = require('./SlidingWindow');
const Deque = require('./Deque');

class QueueManager {
    constructor(serviceId, counters = []) {
        this.serviceId = serviceId;

        // Priority queues (Dual-Queue approach for priority handling)
        // Priority queues (Dual-Queue approach for priority handling)
        this.priorityQueue = new FIFOQueue(); // For priority customers
        this.normalQueue = new FIFOQueue();   // For normal customers

        // Wait time prediction using Sliding Window
        this.slidingWindow = new SlidingWindow(20); // Last 20 services

        // Counter load balancing - Min-Heap keyed by estimated wait time
        this.counterHeap = new MinHeap((a, b) => {
            // Compare by estimated wait time (load * avgServiceTime)
            const aWait = this.getCounterWaitTime(a);
            const bWait = this.getCounterWaitTime(b);
            return aWait - bWait;
        });
        this.initializeCounters(counters);

        // No-show management using Deque
        this.skippedTokens = new Deque();

        // Token state HashMap for O(1) lookups
        this.tokenMap = new Map();

        // Statistics
        this.stats = {
            totalTokens: 0,
            servedTokens: 0,
            skippedTokens: 0,
            avgWaitTime: 0,
            avgServiceTime: 0
        };
    }

    /**
     * Hydrate queue state from DB tokens (after server restart)
     * @param {Array} tokens - Array of token documents from DB
     */
    hydrate(tokens) {
        console.log(`[Hydrate] Restoring ${tokens.length} tokens to memory...`);
        tokens.forEach(t => {
            const token = {
                id: t._id ? t._id.toString() : t.id,
                number: t.number,
                priority: t.priority || 'normal',
                joinedAt: t.joinedAt || new Date(),
                status: t.status || 'waiting',
                customerId: t.customerId,
                customerName: t.customerName || 'Guest',
                serviceId: this.serviceId,
                counterId: t.counterId ? t.counterId.toString() : null
            };

            if (token.priority === 'priority') {
                this.priorityQueue.enqueue(token);
            } else {
                this.normalQueue.enqueue(token);
            }

            this.tokenMap.set(token.id, token);
            // Don't increment totalTokens stats as these are existing
        });

        // Recalculate loads based on restored state
        this.rebalanceQueue();
    }

    /**
     * Calculate estimated wait time for a counter
     * @param {Object} counter
     * @returns {number} Estimated wait time in seconds
     */
    getCounterWaitTime(counter) {
        if (!counter || counter.status !== 'active') {
            return Infinity; // Inactive counters have infinite wait
        }

        const avgServiceTime = this.slidingWindow.getAverage() || 180; // Default 3 min (seconds)

        // How long is the current token taking so far?
        let remainingCurrentService = 0;
        if (counter.currentToken) {
            const currentToken = this.tokenMap.get(counter.currentToken);
            if (currentToken && currentToken.calledAt) {
                const elapsedSeconds = (Date.now() - new Date(currentToken.calledAt).getTime()) / 1000;
                // Remaining = full avg service time minus time already spent (floor at 0)
                remainingCurrentService = Math.max(0, avgServiceTime - elapsedSeconds);
            } else {
                // Token is being served but calledAt unknown — assume a full service slot
                remainingCurrentService = avgServiceTime;
            }
        }
        // counter.load = number of waiting (not yet called) tokens
        return remainingCurrentService + (counter.load * avgServiceTime);
    }

    /**
     * Initialize counters in min-heap
     * @param {Array} counters - Array of counter objects
     */
    initializeCounters(counters) {
        const now = new Date();
        counters.forEach(counter => {
            // Determine effective initial status based on schedule
            let effectiveStatus = counter.status || 'active';

            // If a start time is defined, respect it for scheduling
            if (counter.queueStartTime) {
                const start = new Date(counter.queueStartTime);
                const end = counter.queueEndTime ? new Date(counter.queueEndTime) : null;
                const hasStarted = now >= start;
                const hasEnded = end && now >= end;

                if (hasEnded) {
                    // Past the end time - counter should be paused/closed
                    effectiveStatus = 'paused';
                } else if (!hasStarted) {
                    // Hasn't started yet - pause it regardless of DB status
                    effectiveStatus = 'paused';
                } else {
                    // Within active window
                    effectiveStatus = 'active';
                }
            }

            this.counterHeap.insert({
                id: counter.id,
                name: counter.name,
                load: 0,
                status: effectiveStatus,
                queueStartTime: counter.queueStartTime,
                queueEndTime: counter.queueEndTime,
                currentToken: null
            });
        });
    }

    /**
     * Sync counters with latest DB data
     * @param {Array} counters
     */
    syncCounters(counters) {
        const currentIds = new Set(this.counterHeap.getAll().map(c => c.id));
        const newIds = new Set(counters.map(c => c.id));

        counters.forEach(c => {
            const existing = this.counterHeap.find(c.id);
            if (existing) {
                // Sync all relevant fields including status from DB
                this.counterHeap.update(c.id, {
                    name: c.name,
                    status: c.status || existing.status,
                    queueStartTime: c.queueStartTime,
                    queueEndTime: c.queueEndTime
                });
            } else {
                this.counterHeap.insert({
                    id: c.id,
                    name: c.name,
                    load: 0,
                    status: c.status || 'active',
                    queueStartTime: c.queueStartTime,
                    queueEndTime: c.queueEndTime,
                    currentToken: null
                });
            }
        });

        currentIds.forEach(id => {
            if (!newIds.has(id)) {
                this.counterHeap.update(id, { status: 'inactive' });
            }
        });

        this.checkSchedules();
    }

    /**
     * Check and update counter schedules - Auto-activate/pause based on time
     * Triggers rebalancing when a new counter activates
     */
    checkSchedules() {
        const now = new Date();
        const counters = this.counterHeap.getAll();
        let newlyActivated = [];

        counters.forEach(c => {
            // Only apply schedule logic if at least a start time is set
            if (c.queueStartTime) {
                const start = new Date(c.queueStartTime);
                const end = c.queueEndTime ? new Date(c.queueEndTime) : null;

                const hasStarted = now >= start;
                const hasEnded = end && now >= end;

                if (hasStarted && !hasEnded && c.status !== 'active' && !c._manuallyPaused) {
                    // Within the active window - activate this counter (skip if manually paused)
                    this.updateCounterStatus(c.id, 'active');
                    newlyActivated.push(c.id);
                    console.log(`[Schedule] Counter ${c.name} activated at ${now.toLocaleTimeString()}`);
                } else if ((!hasStarted || hasEnded) && c.status === 'active' && !c._manuallyActivated) {
                    // Before start time, or after end time - deactivate
                    this.updateCounterStatus(c.id, 'paused');
                    console.log(`[Schedule] Counter ${c.name} paused at ${now.toLocaleTimeString()}`);
                }
            }
        });

        // Rebalance queue when new counters activate
        if (newlyActivated.length > 0) {
            this.rebalanceQueue();
        }
    }

    /**
     * Rebalance queue - Distribute tokens to minimize overall wait time
     * Called when new counters activate or load becomes uneven
     */
    rebalanceQueue() {
        const activeCounters = this.counterHeap.getAll().filter(c => c.status === 'active');
        if (activeCounters.length === 0) {
            console.log('[Rebalance] No active counters — tokens stay queued until a counter activates');
            return;
        }

        console.log(`[Rebalance] Redistributing tokens among ${activeCounters.length} active counters`);

        // Collect all waiting tokens (priority pool + normal pool)
        const priorityTokens = this.priorityQueue.getAll();
        const normalTokens = this.normalQueue.getAll();

        // Sort each group by joinedAt ascending (oldest waiter gets re-assigned first)
        const byAge = (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt);
        priorityTokens.sort(byAge);
        normalTokens.sort(byAge);

        // Merged order: priority customers first, then normal, each sorted by wait time
        const allTokens = [...priorityTokens, ...normalTokens];

        // Reset loads on all active counters
        activeCounters.forEach(c => this.counterHeap.update(c.id, { load: 0 }));

        // Re-assign each token (oldest first) to least-loaded active counter
        allTokens.forEach(token => {
            const bestCounter = this.findBestCounter();
            if (bestCounter) {
                token.counterId = bestCounter.id;
                // Read fresh load after last update
                const fresh = this.counterHeap.find(bestCounter.id);
                this.counterHeap.update(bestCounter.id, { load: (fresh ? fresh.load : 0) + 1 });
            }
        });

        console.log(`[Rebalance] Redistributed ${allTokens.length} tokens by wait-time order`);
    }

    /**
     * Find the best counter (least wait time) among active counters
     * Uses Min-Heap for O(log n) extraction
     * @returns {Object|null} Best counter or null
     */
    findBestCounter() {
        const counters = this.counterHeap.getAll();
        let bestCounter = null;
        let minWait = Infinity;

        for (const c of counters) {
            if (c.status === 'active') {
                const waitTime = this.getCounterWaitTime(c);
                if (waitTime < minWait) {
                    minWait = waitTime;
                    bestCounter = c;
                }
            }
        }

        return bestCounter;
    }

    /**
     * Add new token to queue - Assigns to counter with LEAST WAIT TIME
     * @param {Object} tokenData - Token information
     * @returns {Object} Created token with position and wait time
     */
    addToken(tokenData) {
        // 1. Check schedules before adding
        this.checkSchedules();

        // 2. Find best counter (least wait time among active counters)
        const bestCounter = this.findBestCounter();
        let assignedCounterId = null;

        if (bestCounter) {
            assignedCounterId = bestCounter.id;
            // Increment load for this counter
            this.counterHeap.update(bestCounter.id, {
                load: bestCounter.load + 1
            });
            console.log(`[Assignment] Token ${tokenData.number} -> ${bestCounter.name} (Wait: ${this.getCounterWaitTime(bestCounter)}s)`);
        } else {
            console.log(`[Assignment] No active counters, token ${tokenData.number} unassigned`);
        }

        const token = {
            id: tokenData.id,
            number: tokenData.number,
            priority: tokenData.priority || 'normal',
            joinedAt: new Date(),
            status: 'waiting',
            customerId: tokenData.customerId,
            customerName: tokenData.customerName || 'Guest',
            serviceId: this.serviceId,
            counterId: assignedCounterId
        };

        // Add to appropriate queue based on priority
        if (token.priority === 'priority') {
            this.priorityQueue.enqueue(token);
        } else {
            this.normalQueue.enqueue(token);
        }

        // Add to HashMap for O(1) lookup
        this.tokenMap.set(token.id, token);
        this.stats.totalTokens++;

        // Calculate position and wait time
        const position = this.getTokenPosition(token.id);
        const waitTime = this.predictWaitTime(position);

        return {
            ...token,
            position,
            estimatedWaitTime: waitTime
        };
    }

    assignNextToken(requestingCounterId = null) {
        this.checkSchedules();

        if (!requestingCounterId) {
            // ── Auto-assign mode (no specific counter) ──────────────────────
            // Pick globally oldest priority token, then oldest normal token
            let token = this.priorityQueue.peek();
            let isPriority = true;
            if (!token) { token = this.normalQueue.peek(); isPriority = false; }
            if (!token) return null;

            if (isPriority) this.priorityQueue.dequeue();
            else this.normalQueue.dequeue();

            const counter = token.counterId
                ? this.counterHeap.find(token.counterId)
                : this.findBestCounter();
            if (!counter) return null;

            token.status = 'called';
            token.calledAt = new Date();
            token.counterId = counter.id;
            this.tokenMap.set(token.id, token);
            this.counterHeap.update(counter.id, { currentToken: token.id });
            return { token, counter, isPriority };
        }

        // ── Counter-specific "Call Next" ─────────────────────────────────────
        // GLOBAL OLDEST-FIRST: collect ALL waiting tokens, sort by
        // priority-tier then actual waiting time, serve the longest waiter.

        // 1. Gather all waiting tokens from both queues
        const allPriority = this.priorityQueue.getAll();
        const allNormal = this.normalQueue.getAll();

        // 2. Sort each group by joinedAt ascending (oldest wait = index 0)
        const byAge = (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt);
        allPriority.sort(byAge);
        allNormal.sort(byAge);

        // 3. Priority customers always come before normal customers
        const candidates = [...allPriority, ...allNormal];
        if (candidates.length === 0) return null;

        // 4. Pick the globally oldest / highest-priority waiting token
        const chosen = candidates[0];
        const isPriority = chosen.priority === 'priority';

        // 5. Remove it from whichever queue holds it
        let token = isPriority
            ? this.priorityQueue.remove(chosen.id)
            : this.normalQueue.remove(chosen.id);

        if (!token) return null;

        // 6. Get the requesting counter
        const counter = this.counterHeap.find(requestingCounterId);
        if (!counter) return null;

        // 7. Adjust loads: decrement old counter's load if the token moves
        const oldCounterId = token.counterId;
        if (oldCounterId && oldCounterId !== requestingCounterId) {
            const oldCounter = this.counterHeap.find(oldCounterId);
            if (oldCounter) {
                this.counterHeap.update(oldCounterId, { load: Math.max(0, oldCounter.load - 1) });
            }
        }

        // 8. Assign token to requesting counter
        token.status = 'called';
        token.calledAt = new Date();
        token.counterId = requestingCounterId;
        this.tokenMap.set(token.id, token);

        this.counterHeap.update(requestingCounterId, { currentToken: token.id });

        console.log(`[CallNext] Counter ${counter.name} called token ${token.number} (waited ${Math.round((Date.now() - new Date(token.joinedAt)) / 60000)} min)`);

        return { token, counter, isPriority };
    }

    /**
     * WORK STEALING: Find and steal the OLDEST token from ANY busy counter
     * Prioritizes Priority Queue, then Normal Queue (Arrival Time)
     * @param {string} requestingCounterId
     * @returns {Object|null} { token, isPriority } or null
     */
    // NOTE: stealToken() removed – assignNextToken() now uses global-oldest-first
    // selection across ALL waiting tokens, so work-stealing is no longer needed.

    /**
     * Mark token as served
     * Updates Sliding Window with service time for better predictions
     * @param {string} tokenId
     * @returns {Object|null} Service completion details
     */
    markServed(tokenId) {
        const token = this.tokenMap.get(tokenId);
        if (!token) return null;

        const now = new Date();
        token.status = 'served';
        token.servedAt = now;

        // Calculate and record service time for Sliding Window
        const serviceTime = (now - token.calledAt) / 1000;
        this.slidingWindow.add(serviceTime);

        // Update counter load
        const counter = this.counterHeap.find(token.counterId);
        if (counter) {
            this.counterHeap.update(token.counterId, {
                load: Math.max(0, counter.load - 1),
                currentToken: null
            });
        }

        this.stats.servedTokens++;
        this.stats.avgServiceTime = this.slidingWindow.getAverage();

        const waitTime = (token.calledAt - token.joinedAt) / 1000;
        this.stats.avgWaitTime = (this.stats.avgWaitTime * (this.stats.servedTokens - 1) + waitTime) / this.stats.servedTokens;

        return { token, serviceTime, waitTime };
    }

    /**
     * Skip token (no-show) - Add to Deque for potential recall
     * @param {string} tokenId
     * @returns {Object|null} Skipped token
     */
    skipToken(tokenId) {
        const token = this.tokenMap.get(tokenId);
        if (!token) return null;

        token.status = 'skipped';
        token.skippedAt = new Date();

        // Add to skipped deque (back) for LIFO recall
        this.skippedTokens.addBack(token);

        // Update counter
        const counter = this.counterHeap.find(token.counterId);
        if (counter) {
            this.counterHeap.update(token.counterId, {
                load: Math.max(0, counter.load - 1),
                currentToken: null
            });
        }

        this.stats.skippedTokens++;
        return token;
    }

    /**
     * Recall skipped token - Uses Deque for efficient front insertion
     * @param {string} tokenId
     * @returns {Object|null} Recalled token
     */
    recallToken(tokenId) {
        const token = this.skippedTokens.remove(tokenId);
        if (!token) return null;

        token.status = 'waiting';
        delete token.skippedAt;

        // Add to front of priority queue (they were already called)
        this.priorityQueue.enqueue(token);
        this.tokenMap.set(token.id, token);

        return token;
    }

    /**
     * Get token position in queue
     * @param {string} tokenId
     * @returns {number} Position (1-indexed)
     */
    getTokenPosition(tokenId) {
        const token = this.tokenMap.get(tokenId);
        if (!token || token.status !== 'waiting') return -1;

        if (token.priority === 'priority') {
            return this.priorityQueue.findPosition(tokenId) + 1;
        } else {
            return this.priorityQueue.size() + this.normalQueue.findPosition(tokenId) + 1;
        }
    }

    /**
     * Predict wait time using Sliding Window algorithm
     * @param {number} position
     * @returns {number} Estimated wait time in seconds
     */
    predictWaitTime(position) {
        const activeCounters = this.getActiveCounterCount();
        return this.slidingWindow.predictWaitTime(position, activeCounters);
    }

    /**
     * Get count of active counters
     * @returns {number}
     */
    getActiveCounterCount() {
        return this.counterHeap.getAll().filter(c => c.status === 'active').length;
    }

    /**
     * Update counter status
     * @param {string} counterId
     * @param {string} status
     */
    updateCounterStatus(counterId, status) {
        const counter = this.counterHeap.find(counterId);
        if (counter) {
            this.counterHeap.update(counterId, { status });
        }
    }

    /**
     * Manually pause a specific counter (prevents schedule from auto-resuming)
     * @param {string} counterId
     */
    pauseCounter(counterId) {
        const counter = this.counterHeap.find(counterId);
        if (counter) {
            this.counterHeap.update(counterId, { status: 'paused', _manuallyPaused: true, _manuallyActivated: false });
            console.log(`[Counter] Counter ${counter.name} manually paused — redistributing its tokens`);
            // Immediately move tokens that were assigned to this counter over to active counters
            this.rebalanceQueue();
            return true;
        }
        return false;
    }

    /**
     * Manually resume a specific counter
     * @param {string} counterId
     */
    resumeCounter(counterId) {
        const counter = this.counterHeap.find(counterId);
        if (counter) {
            this.counterHeap.update(counterId, { status: 'active', _manuallyPaused: false, _manuallyActivated: true });
            console.log(`[Counter] Counter ${counter.name} manually resumed`);
            this.rebalanceQueue(); // Redistribute tokens now that this counter is active
            return true;
        }
        return false;
    }

    /**
     * Get current queue status
     * @returns {Object}
     */
    getQueueStatus() {
        return {
            priorityQueue: this.priorityQueue.size(),
            normalQueue: this.normalQueue.size(),
            totalWaiting: this.priorityQueue.size() + this.normalQueue.size(),
            skipped: this.skippedTokens.size(),
            activeCounters: this.getActiveCounterCount(),
            counterStats: this.counterHeap.getStats(),
            predictionStats: this.slidingWindow.getStats(),
            stats: this.stats
        };
    }

    /**
     * Get all waiting tokens
     * @returns {Array}
     */
    getWaitingTokens() {
        return [
            ...this.priorityQueue.getAll(),
            ...this.normalQueue.getAll()
        ];
    }

    /**
     * Get counter details
     * @returns {Array}
     */
    getCounters() {
        return this.counterHeap.getAll();
    }

    /**
     * Get tokens for a specific counter
     * @param {string} counterId
     * @returns {Array}
     */
    getTokensForCounter(counterId) {
        const all = this.getWaitingTokens();
        return all.filter(t => t.counterId === counterId);
    }

    /**
     * Add counter
     * @param {Object} counter
     */
    addCounter(counter) {
        this.counterHeap.insert({
            id: counter.id,
            name: counter.name,
            load: 0,
            status: counter.status || 'active',
            queueStartTime: counter.queueStartTime,
            queueEndTime: counter.queueEndTime,
            currentToken: null
        });
    }

    /**
     * Remove counter
     * @param {string} counterId
     */
    removeCounter(counterId) {
        this.counterHeap.remove(counterId);
    }

    /**
     * Detect burst traffic using Sliding Window
     * @returns {boolean}
     */
    isBurstTraffic() {
        return this.slidingWindow.isBurstTraffic(1.5);
    }

    /**
     * Get comprehensive analytics
     * @returns {Object}
     */
    getAnalytics() {
        return {
            queueStatus: this.getQueueStatus(),
            waitingTokens: this.getWaitingTokens(),
            counters: this.getCounters(),
            skippedTokens: this.skippedTokens.getAll(),
            isBurstTraffic: this.isBurstTraffic(),
            predictions: {
                avgServiceTime: this.slidingWindow.getAverage(),
                nextTokenWaitTime: this.predictWaitTime(1)
            }
        };
    }
}

module.exports = QueueManager;
