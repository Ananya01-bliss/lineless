const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide organization name'],
        trim: true
    },
    type: {
        type: String,
        default: 'General'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    logo: {
        type: String
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#6366F1'
        },
        secondaryColor: {
            type: String,
            default: '#3B82F6'
        }
    },
    settings: {
        autoRefreshInterval: {
            type: Number,
            default: 3000 // milliseconds
        },
        maxTokensPerDay: {
            type: Number,
            default: 1000
        },
        enableNotifications: {
            type: Boolean,
            default: true
        },
        enablePriority: {
            type: Boolean,
            default: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
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
organizationSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

// Cascade delete services and tokens when organization is deleted
organizationSchema.pre('deleteOne', { document: true, query: false }, async function () {
    console.log(`organizationSchema pre deleteOne called for org ${this._id}`);
    try {
        // Use mongoose.model to avoid circular dependency issues with require
        // Check if models are registered, if not try to require them (fallback)
        const Service = mongoose.models.Service || require('./Service');
        const Token = mongoose.models.Token || require('./Token');

        console.log(`Deleting services for organization ${this._id}`);
        await Service.deleteMany({ organizationId: this._id });

        console.log(`Deleting tokens for organization ${this._id}`);
        await Token.deleteMany({ organizationId: this._id });
    } catch (err) {
        console.error('Error in organization deleteOne pre-hook:', err);
        throw err;
    }
});

module.exports = mongoose.model('Organization', organizationSchema);
