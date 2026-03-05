const mongoose = require('mongoose');

const detectionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
    },
    path: {
        type: String,
        required: true
    },
    riskLevel: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    confidence: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('Detection', detectionSchema);
