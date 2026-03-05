const express = require('express');
const router = express.Router();
const Accident = require('../models/Accident');
const Detection = require('../models/Detection');

// ─────────────────────────────────────────────
// 1. AUTH - simple mock auth (token-based)
// ─────────────────────────────────────────────
router.post('/auth/login', (req, res) => {
    const { vehicleNo, password, role } = req.body;
    if (!vehicleNo || !password) {
        return res.status(400).json({ success: false, message: 'vehicleNo and password required' });
    }
    // In production: validate against a Users collection
    res.json({
        success: true,
        token: `mock-jwt-${Date.now()}`,
        user: {
            vehicleNo,
            role: role || 'driver',  // 'driver' or 'police'
            name: `Driver (${vehicleNo})`
        }
    });
});

// ─────────────────────────────────────────────
// 2. DRIVER DASHBOARD - real data from MongoDB
// ─────────────────────────────────────────────
router.get('/driver/dashboard', async (req, res) => {
    try {
        const { vehicleNo } = req.query;
        if (!vehicleNo) {
            return res.status(400).json({ success: false, message: 'vehicleNo query param required' });
        }

        // Get all accidents for this vehicle
        const accidents = await Accident.find({ vehicleNo }).sort({ timestamp: -1 }).lean();

        const totalViolations = accidents.length;
        const highCount = accidents.filter(a => a.riskLevel === 'HIGH').length;
        const medCount = accidents.filter(a => a.riskLevel === 'MEDIUM').length;

        // Compute driver score: starts at 100, each HIGH -10, MEDIUM -5, LOW -1
        let score = 100 - (highCount * 10) - (medCount * 5) - ((totalViolations - highCount - medCount) * 1);
        score = Math.max(0, Math.min(100, score));

        // Overall risk: if any HIGH → HIGH, if any MEDIUM → MEDIUM, else LOW
        const overallRisk = highCount > 0 ? 'HIGH' : medCount > 0 ? 'MEDIUM' : 'LOW';

        // Last detection speed status
        const lastDetection = await Detection.findOne({ vehicleNo }).sort({ timestamp: -1 }).lean();
        const recentSpeedStatus = lastDetection ? (lastDetection.speedLevel || 'NORMAL') : 'NORMAL';

        res.json({
            success: true,
            data: {
                vehicleNo,
                driverName: `Driver (${vehicleNo})`,
                licenseNumber: `DL-${vehicleNo.replace(/\D/g, '')}`,
                rfidId: `RFID-${vehicleNo}`,
                driverScore: score,
                totalViolations,
                highRiskCount: highCount,
                mediumRiskCount: medCount,
                riskLevel: overallRisk,
                recentSpeedStatus,
                lastIncident: accidents[0]?.timestamp || null
            }
        });
    } catch (err) {
        console.error('[MOBILE] Dashboard error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// 3. VIOLATIONS - real accidents from MongoDB
// ─────────────────────────────────────────────
router.get('/violations', async (req, res) => {
    try {
        const { vehicleNo, limit = 20 } = req.query;
        const query = vehicleNo ? { vehicleNo } : {};

        const accidents = await Accident.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        const violations = accidents.map(a => ({
            id: a.accidentId || a._id.toString(),
            vehicleNo: a.vehicleNo,
            date: a.timestamp,
            location: a.gpsLocation?.address || `${a.gpsLocation?.latitude?.toFixed(4)}, ${a.gpsLocation?.longitude?.toFixed(4)}` || 'Highway',
            riskLevel: a.riskLevel,
            category: a.aiClassification?.category || 'unknown',
            confidence: a.aiClassification?.confidence || 0,
            imagePath: a.imagePath || null,
            paymentStatus: a.paymentStatus || 'PENDING',
            fineAmount: a.riskLevel === 'HIGH' ? 5000 : a.riskLevel === 'MEDIUM' ? 2500 : 1000
        }));

        res.json({ success: true, count: violations.length, data: violations });
    } catch (err) {
        console.error('[MOBILE] Violations error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// 4. FINE PAYMENT - update paymentStatus in DB
// ─────────────────────────────────────────────
router.post('/payments', async (req, res) => {
    try {
        const { accidentId, paymentMethod } = req.body;
        if (!accidentId) {
            return res.status(400).json({ success: false, message: 'accidentId required' });
        }

        const updated = await Accident.findOneAndUpdate(
            { accidentId },
            { paymentStatus: 'PAID', paidAt: new Date(), paymentMethod: paymentMethod || 'mobile' },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Violation not found' });
        }

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: { accidentId, status: 'PAID', paidAt: updated.paidAt }
        });
    } catch (err) {
        console.error('[MOBILE] Payment error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// 5. ACCIDENTS (HIGH risk only) - for emergency view
// ─────────────────────────────────────────────
router.get('/accidents', async (req, res) => {
    try {
        const { vehicleNo, limit = 10 } = req.query;
        const query = { riskLevel: 'HIGH' };
        if (vehicleNo) query.vehicleNo = vehicleNo;

        const accidents = await Accident.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        const formatted = accidents.map(a => ({
            id: a.accidentId || a._id.toString(),
            vehicleNo: a.vehicleNo,
            riskLevel: a.riskLevel,
            location: a.gpsLocation?.address || `Lat: ${a.gpsLocation?.latitude?.toFixed(4)}, Lng: ${a.gpsLocation?.longitude?.toFixed(4)}`,
            latitude: a.gpsLocation?.latitude,
            longitude: a.gpsLocation?.longitude,
            timestamp: a.timestamp,
            aiCategory: a.aiClassification?.category || 'unresponsive',
            confidence: a.aiClassification?.confidence || 0,
            alertSent: a.alertSent || false
        }));

        res.json({ success: true, count: formatted.length, data: formatted });
    } catch (err) {
        console.error('[MOBILE] Accidents error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────────
// 6. POLICE - ALL high-risk targets (police view)
// ─────────────────────────────────────────────
router.get('/police/alerts', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const highRisk = await Accident.find({ riskLevel: { $in: ['HIGH', 'MEDIUM'] } })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .lean();

        // Group by vehicle to get offender summary
        const vehicleMap = {};
        highRisk.forEach(a => {
            if (!vehicleMap[a.vehicleNo]) {
                vehicleMap[a.vehicleNo] = { vehicleNo: a.vehicleNo, highCount: 0, medCount: 0, lastSeen: null, location: null };
            }
            if (a.riskLevel === 'HIGH') vehicleMap[a.vehicleNo].highCount++;
            else vehicleMap[a.vehicleNo].medCount++;
            if (!vehicleMap[a.vehicleNo].lastSeen || new Date(a.timestamp) > new Date(vehicleMap[a.vehicleNo].lastSeen)) {
                vehicleMap[a.vehicleNo].lastSeen = a.timestamp;
                vehicleMap[a.vehicleNo].location = a.gpsLocation?.address || `${a.gpsLocation?.latitude?.toFixed(4)}, ${a.gpsLocation?.longitude?.toFixed(4)}`;
            }
        });

        const suspects = Object.values(vehicleMap)
            .sort((a, b) => b.highCount - a.highCount);

        res.json({ success: true, count: suspects.length, data: suspects, recentAlerts: highRisk.slice(0, 10) });
    } catch (err) {
        console.error('[MOBILE] Police alerts error:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
