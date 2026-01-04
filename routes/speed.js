const express = require('express');
const router = express.Router();
const violations = require('../data/violations');
const alertService = require('../services/alertService');

// POST /speed - IoT speed sensor input endpoint
// This endpoint simulates data coming from an IoT speed sensor
// No authentication required as it's an IoT device endpoint
router.post('/speed', (req, res) => {
  const { vehicleNumber, speed } = req.body;

  // Validate input
  if (!vehicleNumber || speed === undefined || speed === null) {
    return res.status(400).json({
      success: false,
      message: 'vehicleNumber and speed are required'
    });
  }

  // Validate speed is a number
  const speedValue = parseFloat(speed);
  if (isNaN(speedValue)) {
    return res.status(400).json({
      success: false,
      message: 'speed must be a valid number'
    });
  }

  // Check if speed exceeds limit (80 km/h or mph)
  if (speedValue > 80) {
    // Count current SPEED violations for this vehicle (before adding new one)
    const currentSpeedViolationCount = alertService.countSpeedViolations(violations, vehicleNumber);
    const newSpeedViolationCount = currentSpeedViolationCount + 1;

    // Calculate current total violation count for this vehicle
    const currentTotalViolationCount = alertService.getCurrentViolationCount(violations, vehicleNumber);
    const newTotalViolationCount = currentTotalViolationCount + 1;

    // Create new speed violation record
    const newViolation = {
      id: violations.length > 0 ? Math.max(...violations.map(v => v.id)) + 1 : 1,
      vehicleNumber: vehicleNumber,
      violationType: 'Speeding',
      timestamp: new Date().toISOString(),
      violationCount: newTotalViolationCount,
      speed: speedValue  // Store the speed that triggered the violation
    };

    // Add violation to the array (in a real app, this would be saved to database)
    violations.push(newViolation);

    // Use alert service to calculate alert status based on SPEED violations only
    const speedAlertStatus = alertService.getSpeedAlertStatus(violations, vehicleNumber);

    // Return violation status
    return res.json({
      success: true,
      violationDetected: true,
      message: `Speed violation detected: ${speedValue} exceeds limit of 80`,
      violation: {
        id: newViolation.id,
        vehicleNumber: vehicleNumber,
        violationType: 'Speeding',
        speed: speedValue,
        timestamp: newViolation.timestamp,
        violationCount: newTotalViolationCount,
        alertLevel: speedAlertStatus.alertLevel
      },
      status: {
        vehicleNumber: vehicleNumber,
        speedViolationCount: newSpeedViolationCount,
        totalViolationCount: newTotalViolationCount,
        alertLevel: speedAlertStatus.alertLevel,
        message: speedAlertStatus.message
      }
    });
  } else {
    // Speed is within limit - no violation
    // Still return current SPEED violation alert status for the vehicle
    const speedAlertStatus = alertService.getSpeedAlertStatus(violations, vehicleNumber);
    const currentTotalViolationCount = alertService.getCurrentViolationCount(violations, vehicleNumber);

    return res.json({
      success: true,
      violationDetected: false,
      message: `Speed ${speedValue} is within limit`,
      status: {
        vehicleNumber: vehicleNumber,
        speed: speedValue,
        speedViolationCount: alertService.countSpeedViolations(violations, vehicleNumber),
        totalViolationCount: currentTotalViolationCount,
        alertLevel: speedAlertStatus.alertLevel,
        message: speedAlertStatus.message
      }
    });
  }
});

module.exports = router;

