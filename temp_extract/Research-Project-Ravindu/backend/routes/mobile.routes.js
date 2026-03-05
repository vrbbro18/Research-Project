const express = require('express');
const router = express.Router();

// Mock Data
const mockDriver = {
    driverName: "John Doe",
    licenseNumber: "DL-123456789",
    vehicleNumber: "ABC-1234",
    rfidId: "RFID-987654321",
    driverScore: 85,
    totalViolations: 3,
    riskLevel: "MEDIUM",
    recentSpeedStatus: "HIGH"
};

const mockViolations = [
    { id: 'v1', date: '2026-02-28T10:00:00Z', location: 'Main Street', speed: 85, speedLevel: 'HIGH', fineAmount: 100, paymentStatus: 'PENDING' },
    { id: 'v2', date: '2026-02-25T14:30:00Z', location: 'Highway 1', speed: 110, speedLevel: 'HIGH', fineAmount: 250, paymentStatus: 'PAID' },
    { id: 'v3', date: '2026-02-20T09:15:00Z', location: 'School Zone', speed: 45, speedLevel: 'MEDIUM', fineAmount: 50, paymentStatus: 'PAID' },
];

const mockAccidents = [
    { id: 'a1', riskLevel: 'HIGH', location: 'Highway 1 Intersection', timestamp: '2026-03-01T08:00:00Z', emergencyContact: '+1234567890' }
];

// 1. Auth Module
router.post('/auth/login', (req, res) => {
    const { phone, password } = req.body;
    if (phone && password) {
        // Return mock JWT and user info
        res.json({
            success: true,
            token: 'mock-jwt-token-12345',
            user: mockDriver
        });
    } else {
        res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
});

// 2. Dashboard / Profile Module
router.get('/driver/dashboard', (req, res) => {
    // Assume generic dashboard info
    res.json({
        success: true,
        data: mockDriver
    });
});

// 3. Speed Violations Module
router.get('/violations', (req, res) => {
    res.json({
        success: true,
        data: mockViolations
    });
});

// 4. Fine Payment Module
router.post('/payments', (req, res) => {
    const { violationId, paymentMethodId } = req.body;

    if (!violationId) {
        return res.status(400).json({ success: false, message: 'violationId required' });
    }

    // Find and update mock violation status
    const violationIndex = mockViolations.findIndex(v => v.id === violationId);
    if (violationIndex !== -1) {
        mockViolations[violationIndex].paymentStatus = 'PAID';
    }

    res.json({
        success: true,
        message: 'Payment processed successfully',
        updatedViolationId: violationId
    });
});

// 5. Accident Emergency Module
router.get('/accidents', (req, res) => {
    res.json({
        success: true,
        data: mockAccidents
    });
});

module.exports = router;
