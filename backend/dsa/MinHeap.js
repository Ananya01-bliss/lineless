/**
 * Min-Heap Implementation for Counter Load Balancing
 * Time Complexity: insert O(log n), extractMin O(log n), peek O(1)
 * Space Complexity: O(n)
 * Purpose: Efficiently assign tokens to least-loaded counters
 */

class MinHeap {
    constructor(compareFunction = null) {
        this.heap = [];
        // Default: compare by load property
        this.compare = compareFunction || ((a, b) => a.load - b.load);
    }

    /**
     * Get parent index
     * @param {number} index
     * @returns {number}
     */
    getParentIndex(index) {
        return Math.floor((index - 1) / 2);
    }

    /**
     * Get left child index
     * @param {number} index
     * @returns {number}
     */
    getLeftChildIndex(index) {
        return 2 * index + 1;
    }

    /**
     * Get right child index
     * @param {number} index
     * @returns {number}
     */
    getRightChildIndex(index) {
        return 2 * index + 2;
    }

    /**
     * Swap two elements in heap
     * @param {number} index1
     * @param {number} index2
     */
    swap(index1, index2) {
        [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
    }

    /**
     * Bubble up element to maintain heap property
     * @param {number} index
     */
    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = this.getParentIndex(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
                break;
            }
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    /**
     * Bubble down element to maintain heap property
     * @param {number} index
     */
    bubbleDown(index) {
        while (true) {
            let minIndex = index;
            const leftIndex = this.getLeftChildIndex(index);
            const rightIndex = this.getRightChildIndex(index);

            if (leftIndex < this.heap.length &&
                this.compare(this.heap[leftIndex], this.heap[minIndex]) < 0) {
                minIndex = leftIndex;
            }

            if (rightIndex < this.heap.length &&
                this.compare(this.heap[rightIndex], this.heap[minIndex]) < 0) {
                minIndex = rightIndex;
            }

            if (minIndex === index) {
                break;
            }

            this.swap(index, minIndex);
            index = minIndex;
        }
    }

    /**
     * Insert element into heap
     * @param {Object} element - Counter object with load property
     */
    insert(element) {
        this.heap.push(element);
        this.bubbleUp(this.heap.length - 1);
    }

    /**
     * Extract minimum element (least loaded counter)
     * @returns {Object|null} Counter object or null if empty
     */
    extractMin() {
        if (this.isEmpty()) {
            return null;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return min;
    }

    /**
     * Peek at minimum element without removing
     * @returns {Object|null} Counter object or null if empty
     */
    peek() {
        return this.isEmpty() ? null : this.heap[0];
    }

    /**
     * Update element and reheapify
     * @param {string} counterId - Counter ID to update
     * @param {Object} newData - New counter data
     * @returns {boolean} True if found and updated
     */
    update(counterId, newData) {
        const index = this.heap.findIndex(counter => counter.id === counterId);
        if (index === -1) {
            return false;
        }

        const oldLoad = this.heap[index].load;
        this.heap[index] = { ...this.heap[index], ...newData };
        const newLoad = this.heap[index].load;

        if (newLoad < oldLoad) {
            this.bubbleUp(index);
        } else if (newLoad > oldLoad) {
            this.bubbleDown(index);
        }

        return true;
    }

    /**
     * Find counter by ID
     * @param {string} counterId
     * @returns {Object|null} Counter object or null
     */
    find(counterId) {
        return this.heap.find(counter => counter.id === counterId) || null;
    }

    /**
     * Remove counter by ID
     * @param {string} counterId
     * @returns {Object|null} Removed counter or null
     */
    remove(counterId) {
        const index = this.heap.findIndex(counter => counter.id === counterId);
        if (index === -1) {
            return null;
        }

        const removed = this.heap[index];

        if (index === this.heap.length - 1) {
            this.heap.pop();
            return removed;
        }

        this.heap[index] = this.heap.pop();

        const parentIndex = this.getParentIndex(index);
        if (index > 0 && this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
            this.bubbleUp(index);
        } else {
            this.bubbleDown(index);
        }

        return removed;
    }

    /**
     * Get all counters sorted by load
     * @returns {Array} Sorted array of counters
     */
    getAll() {
        return [...this.heap].sort(this.compare);
    }

    /**
     * Get heap size
     * @returns {number}
     */
    size() {
        return this.heap.length;
    }

    /**
     * Check if heap is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Clear heap
     */
    clear() {
        this.heap = [];
    }

    /**
     * Get heap statistics
     * @returns {Object}
     */
    getStats() {
        if (this.isEmpty()) {
            return {
                size: 0,
                minLoad: null,
                maxLoad: null,
                avgLoad: null
            };
        }

        const loads = this.heap.map(c => c.load);
        return {
            size: this.heap.length,
            minLoad: Math.min(...loads),
            maxLoad: Math.max(...loads),
            avgLoad: loads.reduce((a, b) => a + b, 0) / loads.length
        };
    }
}

module.exports = MinHeap;
