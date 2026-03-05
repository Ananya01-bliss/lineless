/**
 * Deque (Double-Ended Queue) for No-Show Management
 * Time Complexity: addFront O(1), addBack O(1), removeFront O(1), removeBack O(1)
 * Space Complexity: O(n)
 * Purpose: Handle skipped tokens, burst traffic, and flexible queue operations
 */

class Deque {
    constructor() {
        this.items = {};
        this.front = 0;
        this.back = 0;
    }

    /**
     * Add element to front of deque
     * @param {Object} element
     */
    addFront(element) {
        this.front--;
        this.items[this.front] = element;
    }

    /**
     * Add element to back of deque
     * @param {Object} element
     */
    addBack(element) {
        this.items[this.back] = element;
        this.back++;
    }

    /**
     * Remove and return element from front
     * @returns {Object|null}
     */
    removeFront() {
        if (this.isEmpty()) {
            return null;
        }

        const element = this.items[this.front];
        delete this.items[this.front];
        this.front++;
        return element;
    }

    /**
     * Remove and return element from back
     * @returns {Object|null}
     */
    removeBack() {
        if (this.isEmpty()) {
            return null;
        }

        this.back--;
        const element = this.items[this.back];
        delete this.items[this.back];
        return element;
    }

    /**
     * Peek at front element without removing
     * @returns {Object|null}
     */
    peekFront() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.front];
    }

    /**
     * Peek at back element without removing
     * @returns {Object|null}
     */
    peekBack() {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.back - 1];
    }

    /**
     * Get all elements as array
     * @returns {Array}
     */
    getAll() {
        const result = [];
        for (let i = this.front; i < this.back; i++) {
            result.push(this.items[i]);
        }
        return result;
    }

    /**
     * Find element by ID
     * @param {string} id
     * @returns {Object|null}
     */
    find(id) {
        for (let i = this.front; i < this.back; i++) {
            if (this.items[i].id === id) {
                return this.items[i];
            }
        }
        return null;
    }

    /**
     * Remove element by ID
     * @param {string} id
     * @returns {Object|null}
     */
    remove(id) {
        for (let i = this.front; i < this.back; i++) {
            if (this.items[i].id === id) {
                const element = this.items[i];
                delete this.items[i];
                return element;
            }
        }
        return null;
    }

    /**
     * Get deque size
     * @returns {number}
     */
    size() {
        return this.back - this.front;
    }

    /**
     * Check if deque is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.size() === 0;
    }

    /**
     * Clear deque
     */
    clear() {
        this.items = {};
        this.front = 0;
        this.back = 0;
    }

    /**
     * Get deque statistics
     * @returns {Object}
     */
    getStats() {
        return {
            size: this.size(),
            isEmpty: this.isEmpty(),
            frontElement: this.peekFront(),
            backElement: this.peekBack()
        };
    }
}

module.exports = Deque;
