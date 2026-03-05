const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['emergency', 'warning', 'info']
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high'] // Lowercase used in services
    },
    category: {
        type: String,
        required: true
    },
    detectionId: {
        type: String
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
