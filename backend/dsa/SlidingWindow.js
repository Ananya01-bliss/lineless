/**
 * Sliding Window for Dynamic Wait Time Prediction
 * Time Complexity: add O(1), getAverage O(1)
 * Space Complexity: O(window_size)
 * Purpose: Calculate rolling average of recent service times for accurate predictions
 */

class SlidingWindow {
    constructor(windowSize = 20) {
        this.windowSize = windowSize;
        this.window = [];
        this.sum = 0;
        this.head = 0;
    }

    /**
     * Add new service time to window
     * @param {number} serviceTime - Service time in seconds
     */
    add(serviceTime) {
        if (this.window.length < this.windowSize) {
            // Window not full yet
            this.window.push(serviceTime);
            this.sum += serviceTime;
        } else {
            // Window full, replace oldest
            this.sum -= this.window[this.head];
            this.window[this.head] = serviceTime;
            this.sum += serviceTime;
            this.head = (this.head + 1) % this.windowSize;
        }
    }

    /**
     * Get average service time
     * @returns {number} Average in seconds
     */
    getAverage() {
        if (this.window.length === 0) {
            return 0;
        }
        return this.sum / this.window.length;
    }

    /**
     * Get median service time (more robust to outliers)
     * @returns {number} Median in seconds
     */
    getMedian() {
        if (this.window.length === 0) {
            return 0;
        }

        const sorted = [...this.window].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * Get minimum service time in window
     * @returns {number}
     */
    getMin() {
        if (this.window.length === 0) {
            return 0;
        }
        return Math.min(...this.window);
    }

    /**
     * Get maximum service time in window
     * @returns {number}
     */
    getMax() {
        if (this.window.length === 0) {
            return 0;
        }
        return Math.max(...this.window);
    }

    /**
     * Get standard deviation
     * @returns {number}
     */
    getStdDev() {
        if (this.window.length === 0) {
            return 0;
        }

        const avg = this.getAverage();
        const squaredDiffs = this.window.map(time => Math.pow(time - avg, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / this.window.length;
        return Math.sqrt(variance);
    }

    /**
     * Predict wait time for position in queue
     * @param {number} position - Position in queue
     * @param {number} activeCounters - Number of active counters
     * @returns {number} Estimated wait time in seconds
     */
    predictWaitTime(position, activeCounters = 1) {
        if (position <= 0 || activeCounters <= 0) {
            return 0;
        }

        const avgServiceTime = this.getAverage();

        // If no data yet, use default estimate
        if (avgServiceTime === 0) {
            return position * 180; // Default 3 minutes per person
        }

        // Calculate parallel processing time
        const tokensPerCounter = Math.ceil(position / activeCounters);
        return tokensPerCounter * avgServiceTime;
    }

    /**
     * Predict wait time with confidence interval
     * @param {number} position
     * @param {number} activeCounters
     * @returns {Object} {min, avg, max} wait times
     */
    predictWaitTimeRange(position, activeCounters = 1) {
        if (position <= 0 || activeCounters <= 0) {
            return { min: 0, avg: 0, max: 0 };
        }

        const avg = this.getAverage();
        const stdDev = this.getStdDev();

        if (avg === 0) {
            const defaultTime = position * 180 / activeCounters;
            return {
                min: defaultTime * 0.7,
                avg: defaultTime,
                max: defaultTime * 1.3
            };
        }

        const tokensPerCounter = Math.ceil(position / activeCounters);

        return {
            min: Math.max(0, tokensPerCounter * (avg - stdDev)),
            avg: tokensPerCounter * avg,
            max: tokensPerCounter * (avg + stdDev)
        };
    }

    /**
     * Check if burst traffic detected
     * @param {number} threshold - Multiplier of average (e.g., 1.5)
     * @returns {boolean}
     */
    isBurstTraffic(threshold = 1.5) {
        if (this.window.length < this.windowSize / 2) {
            return false; // Not enough data
        }

        const recentAvg = this.getRecentAverage(5);
        const overallAvg = this.getAverage();

        return recentAvg > overallAvg * threshold;
    }

    /**
     * Get average of most recent N entries
     * @param {number} n - Number of recent entries
     * @returns {number}
     */
    getRecentAverage(n) {
        if (this.window.length === 0) {
            return 0;
        }

        n = Math.min(n, this.window.length);
        let sum = 0;

        for (let i = 0; i < n; i++) {
            const index = (this.head - 1 - i + this.window.length) % this.window.length;
            sum += this.window[index];
        }

        return sum / n;
    }

    /**
     * Get current window size
     * @returns {number}
     */
    size() {
        return this.window.length;
    }

    /**
     * Check if window is full
     * @returns {boolean}
     */
    isFull() {
        return this.window.length === this.windowSize;
    }

    /**
     * Clear window
     */
    clear() {
        this.window = [];
        this.sum = 0;
        this.head = 0;
    }

    /**
     * Get window statistics
     * @returns {Object}
     */
    getStats() {
        return {
            size: this.window.length,
            windowSize: this.windowSize,
            isFull: this.isFull(),
            average: this.getAverage(),
            median: this.getMedian(),
            min: this.getMin(),
            max: this.getMax(),
            stdDev: this.getStdDev()
        };
    }

    /**
     * Get all values in window (for debugging)
     * @returns {Array}
     */
    getAll() {
        return [...this.window];
    }
}

module.exports = SlidingWindow;
