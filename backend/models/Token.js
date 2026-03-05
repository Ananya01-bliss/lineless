const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    customerId: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        default: 'Guest'
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'not_disclosed'],
        default: 'not_disclosed'
    },
    priority: {
        type: String,
        enum: ['normal', 'priority'],
        default: 'normal'
    },
    priorityReason: {
        type: String,
        enum: ['senior', 'expectant_mother', 'pwd', 'other'],
        default: null
    },
    status: {
        type: String,
        enum: ['waiting', 'called', 'served', 'skipped', 'cancelled'],
        default: 'waiting'
    },
    position: {
        type: Number
    },
    estimatedWaitTime: {
        type: Number // in seconds
    },
    counterId: {
        type: String,
        default: null
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    calledAt: {
        type: Date
    },
    servedAt: {
        type: Date
    },
    skippedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    actualWaitTime: {
        type: Number // in seconds
    },
    actualServiceTime: {
        type: Number // in seconds
    },
    notificationSent: {
        type: Boolean,
        default: false
    }
});

// Calculate actual wait time when called
tokenSchema.pre('save', async function () {
    if (this.isModified('calledAt') && this.calledAt && this.joinedAt) {
        this.actualWaitTime = Math.floor((this.calledAt - this.joinedAt) / 1000);
    }

    if (this.isModified('servedAt') && this.servedAt && this.calledAt) {
        this.actualServiceTime = Math.floor((this.servedAt - this.calledAt) / 1000);
    }
});

// Index for faster queries
tokenSchema.index({ serviceId: 1, status: 1 });
tokenSchema.index({ organizationId: 1, joinedAt: -1 });
tokenSchema.index({ customerId: 1 });

module.exports = mongoose.model('Token', tokenSchema);
