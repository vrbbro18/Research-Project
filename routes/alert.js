const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const alertService = require('../services/alertService');
const mobileAlertService = require('../services/mobileAlertService');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');

// POST /send-alert - Send manual alert to driver for a vehicle via mobile push
router.post('/send-alert', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const { vehicleNumber } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'vehicleNumber is required' });
    }

    const vehicle = await Vehicle.findOne({ vehicleNumber });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: `Vehicle not found: ${vehicleNumber}` });
    }

    const driverInfo = await Driver.findOne({ driverId: vehicle.driverId });
    if (!driverInfo) {
      return res.status(404).json({ success: false, message: `Driver not found for vehicle: ${vehicleNumber}` });
    }

    // Since this is a manual send-alert not tied to a specific speed, 
    // it functions as a manual push notification to the driver
    const latestViolation = await Violation.findOne({ vehicleNumber }).sort({ timestamp: -1 });
    let speed = latestViolation ? latestViolation.speed : 'Unknown';

    // Disptach push notification
    const pushResult = await mobileAlertService.sendHighSpeedAlert(driverInfo, vehicleNumber, speed);

    return res.json({
      success: true,
      message: 'Mobile Alert sent successfully',
      result: pushResult
    });

  } catch (error) {
    console.error('Error in send-alert endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send alert',
      error: error.message
    });
  }
});

module.exports = router;
