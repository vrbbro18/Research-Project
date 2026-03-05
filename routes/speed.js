const express = require('express');
const router = express.Router();
const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const mobileAlertService = require('../services/mobileAlertService');

// POST /speed/average - Calculate average speed from two RFID readers
router.post('/average', async (req, res) => {
  const { vehicleNumber, rfid1Timestamp, rfid2Timestamp, distanceMeters } = req.body;

  if (!vehicleNumber || !rfid1Timestamp || !rfid2Timestamp || !distanceMeters) {
    return res.status(400).json({
      success: false,
      message: 'vehicleNumber, rfid1Timestamp, rfid2Timestamp, and distanceMeters are required'
    });
  }

  // Calculate speed: distance / time
  const t1 = new Date(rfid1Timestamp).getTime();
  const t2 = new Date(rfid2Timestamp).getTime();
  const timeDiffSeconds = Math.abs(t2 - t1) / 1000;

  if (timeDiffSeconds === 0) {
    return res.status(400).json({ success: false, message: 'Invalid timestamps: time difference cannot be zero' });
  }

  // Speed in meters per second
  const speedMps = distanceMeters / timeDiffSeconds;

  // Convert to km/h
  const speedKmh = speedMps * 3.6;

  // Internal redirect to main speed processing logic
  req.body.speed = parseFloat(speedKmh.toFixed(2));

  // Continue processing as a normal speed reading
  req.url = '/';
  router.handle(req, res);
});


// POST /speed - IoT speed sensor input endpoint
// Processes either a direct speed reading or a forwarded average speed 
router.post('/', async (req, res) => {
  const { vehicleNumber, speed } = req.body;

  // Validate input
  if (!vehicleNumber || speed === undefined || speed === null) {
    return res.status(400).json({
      success: false,
      message: 'vehicleNumber and speed are required'
    });
  }

  const speedValue = parseFloat(speed);
  if (isNaN(speedValue)) {
    return res.status(400).json({
      success: false,
      message: 'speed must be a valid number'
    });
  }

  // Speed Classification Logic
  let speedCategory = null;
  if (speedValue < 100) {
    speedCategory = 'Low';
  } else if (speedValue >= 100 && speedValue <= 120) {
    speedCategory = 'Medium';
  } else if (speedValue > 120) {
    speedCategory = 'High';
  }

  try {
    // Only record as violation if Medium or High (Speed > 100)
    if (speedCategory === 'Medium' || speedCategory === 'High') {

      const newViolation = new Violation({
        vehicleNumber: vehicleNumber,
        violationType: 'Speeding',
        speed: speedValue,
        speedCategory: speedCategory,
        timestamp: new Date()
      });

      // Special handling for High speed - decrease driver rating and send alert
      let alertDetails = null;
      let driverFound = false;

      if (speedCategory === 'High') {
        const vehicle = await Vehicle.findOne({ vehicleNumber });
        if (vehicle) {
          const driver = await Driver.findOne({ driverId: vehicle.driverId });
          if (driver) {
            driverFound = true;
            // Deduct rating penalty for high speed
            driver.rating = Math.max(0, driver.rating - 15);
            await driver.save();

            // Fire mobile notification
            alertDetails = await mobileAlertService.sendHighSpeedAlert(driver, vehicleNumber, speedValue);
            newViolation.alertSent = alertDetails.success;
          }
        }
      } else if (speedCategory === 'Medium') {
        // Deduct minor penalty for medium speed
        const vehicle = await Vehicle.findOne({ vehicleNumber });
        if (vehicle) {
          const driver = await Driver.findOne({ driverId: vehicle.driverId });
          if (driver) {
            driver.rating = Math.max(0, driver.rating - 5);
            await driver.save();
          }
        }
      }

      await newViolation.save();

      return res.json({
        success: true,
        violationDetected: true,
        message: `Speed violation detected: ${speedValue} km/h is considered ${speedCategory}`,
        violation: {
          id: newViolation._id,
          vehicleNumber: vehicleNumber,
          violationType: 'Speeding',
          speed: speedValue,
          speedCategory: speedCategory,
          timestamp: newViolation.timestamp,
        },
        alertSent: newViolation.alertSent,
        driverFound
      });
    } else {
      // Speed is Low (< 100) - no violation
      return res.json({
        success: true,
        violationDetected: false,
        message: `Speed ${speedValue} km/h is within safe limits (Low)`,
        status: {
          vehicleNumber: vehicleNumber,
          speed: speedValue,
          speedCategory: speedCategory
        }
      });
    }
  } catch (error) {
    console.error('Error processing speed data', error);
    res.status(500).json({ success: false, message: 'Server error processing speed sensor data' });
  }
});

module.exports = router;
