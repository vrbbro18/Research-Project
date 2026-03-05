const mongoose = require('mongoose');

const accidentSchema = new mongoose.Schema({
    accidentId: {
        type: String,
        required: true,
        unique: true
    },
    vehicleNo: {
        type: String,
        required: true
    },
    riskLevel: {
        type: String,
        required: true,
        // Note: Accident routes use uppercase HIGH/MEDIUM/LOW
        enum: ['LOW', 'MEDIUM', 'HIGH']
    },
    gpsLocation: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    alertSent: {
        type: Boolean,
        default: false
    },
    notificationStatus: {
        type: mongoose.Schema.Types.Mixed
    },
    imagePath: {
        type: String,
        required: true
    },
    originalFilename: {
        type: String
    },
    aiClassification: {
        category: String,
        confidence: Number,
        details: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('Accident', accidentSchema);
