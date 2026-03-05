const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'paused'],
        default: 'active'
    },
    staffName: {
        type: String,
        default: ''
    },
    currentToken: {
        type: String,
        default: null
    },
    queueStartTime: {
        type: Date,
        default: null
    },
    queueEndTime: {
        type: Date,
        default: null
    }
});

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide service name'],
        trim: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: 'service'
    },
    counters: [counterSchema],
    qrCode: {
        type: String
    },
    tokenPrefix: {
        type: String,
        default: 'T',
        maxlength: 3
    },
    currentTokenNumber: {
        type: Number,
        default: 0
    },
    estimatedServiceTime: {
        type: Number,
        default: 180 // seconds (3 minutes default)
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stats: {
        todayTokens: {
            type: Number,
            default: 0
        },
        totalTokens: {
            type: Number,
            default: 0
        },
        avgWaitTime: {
            type: Number,
            default: 0
        },
        avgServiceTime: {
            type: Number,
            default: 0
        }
    },
    // Queue scheduling and control
    queueStatus: {
        type: String,
        enum: ['scheduled', 'active', 'paused', 'closed'],
        default: 'active'
    },
    queueStartTime: {
        type: Date,
        default: null
    },
    queueEndTime: {
        type: Date,
        default: null
    },
    pausedAt: {
        type: Date,
        default: null
    },
    pauseMessage: {
        type: String,
        default: 'Queue is temporarily paused. Please wait.'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
serviceSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

// Generate next token number
serviceSchema.methods.getNextTokenNumber = function () {
    this.currentTokenNumber++;
    return `${this.tokenPrefix}${String(this.currentTokenNumber).padStart(3, '0')}`;
};

module.exports = mongoose.model('Service', serviceSchema);
