/**
 * FIFO Queue Implementation
 * Time Complexity: enqueue O(1), dequeue O(1), peek O(1)
 * Space Complexity: O(n)
 * Purpose: Maintain arrival order fairness for queue tokens
 */

class FIFOQueue {
    constructor() {
        this.items = [];
        this.front = 0;
    }

    /**
     * Add token to the end of queue
     * @param {Object} token - Token object
     */
    enqueue(token) {
        this.items.push(token);
    }

    /**
     * Remove and return token from front of queue
     * @returns {Object|null} Token object or null if empty
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const token = this.items[this.front];
        this.front++;

        // Optimize memory: reset array when half is consumed
        if (this.front > this.items.length / 2) {
            this.items = this.items.slice(this.front);
            this.front = 0;
        }

        return token;
    }

    /**
     * View front token without removing
     * @returns {Object|null} Token object or null if empty
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.front];
    }

    /**
     * Get all tokens in queue (for display)
     * @returns {Array} Array of tokens
     */
    getAll() {
        return this.items.slice(this.front);
    }

    /**
     * Get token at specific position
     * @param {number} position - Position in queue (0-indexed from front)
     * @returns {Object|null} Token object or null
     */
    getAt(position) {
        const actualIndex = this.front + position;
        if (actualIndex >= this.items.length) {
            return null;
        }
        return this.items[actualIndex];
    }

    /**
     * Find position of token by ID
     * @param {string} tokenId - Token ID
     * @returns {number} Position in queue (-1 if not found)
     */
    findPosition(tokenId) {
        for (let i = this.front; i < this.items.length; i++) {
            if (this.items[i].id === tokenId) {
                return i - this.front;
            }
        }
        return -1;
    }

    /**
     * Remove specific token by ID
     * @param {string} tokenId - Token ID
     * @returns {Object|null} Removed token or null
     */
    remove(tokenId) {
        for (let i = this.front; i < this.items.length; i++) {
            if (this.items[i].id === tokenId) {
                const token = this.items[i];
                this.items.splice(i, 1);
                return token;
            }
        }
        return null;
    }

    /**
     * Get current queue size
     * @returns {number} Number of tokens in queue
     */
    size() {
        return this.items.length - this.front;
    }

    /**
     * Check if queue is empty
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.front >= this.items.length;
    }

    /**
     * Clear all tokens from queue
     */
    clear() {
        this.items = [];
        this.front = 0;
    }

    /**
     * Get queue statistics
     * @returns {Object} Statistics object
     */
    /**
     * Get queue statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            size: this.size(),
            isEmpty: this.isEmpty(),
            frontToken: this.peek(),
            totalCapacity: this.items.length
        };
    }

    /**
     * Dequeue first token assigned to a specific counter
     * @param {string} counterId
     * @returns {Object|null} Token object or null
     */
    dequeueForCounter(counterId) {
        if (this.isEmpty()) return null;

        for (let i = this.front; i < this.items.length; i++) {
            if (this.items[i].counterId === counterId) {
                const token = this.items[i];
                this.items.splice(i, 1);
                return token;
            }
        }
        return null;
    }
}

module.exports = FIFOQueue;
