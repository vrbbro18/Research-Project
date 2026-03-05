const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');

// GET /scoreboard - Full driver scoreboard with violation counts
router.get('/', requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'), async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ rating: -1 });
    const violations = await Violation.find();
    const vehicles = await Vehicle.find();

    const scoreboard = drivers.map((driver, index) => {
      const driverVehicles = vehicles.filter(v => v.driverId === driver.driverId);
      const vehicleNums = driverVehicles.map(v => v.vehicleNumber);
      const driverViolations = violations.filter(v => vehicleNums.includes(v.vehicleNumber));
      const speedingCount = driverViolations.filter(v => v.violationType === 'Speeding').length;
      const totalViolations = driverViolations.length;

      let riskLevel = 'Safe';
      if (driver.rating < 40)      riskLevel = 'Critical';
      else if (driver.rating < 60) riskLevel = 'High Risk';
      else if (driver.rating < 80) riskLevel = 'Moderate';

      return {
        rank: index + 1,
        driverId: driver.driverId,
        name: driver.name,
        phoneNumber: driver.phoneNumber,
        rating: driver.rating,
        riskLevel,
        totalViolations,
        speedingCount,
        status: driver.status,
        licenseNumber: driver.licenseNumber,
        vehicles: driverVehicles.map(v => v.vehicleNumber),
      };
    });

    res.json({ success: true, message: 'Scoreboard retrieved', data: scoreboard });
  } catch (error) {
    console.error('Scoreboard error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving scoreboard' });
  }
});

module.exports = router;
