const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Violation = require('../models/Violation');

// GET /vehicles - All vehicles with driver info and violation summary
router.get('/', requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    const drivers = await Driver.find();
    const violations = await Violation.find();

    const result = vehicles.map(vehicle => {
      const driver = drivers.find(d => d.driverId === vehicle.driverId);
      const viol = violations.filter(v => v.vehicleNumber === vehicle.vehicleNumber);
      const lastViolation = viol.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      return {
        vehicleNumber: vehicle.vehicleNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        type: vehicle.type,
        status: vehicle.status,
        driverId: vehicle.driverId,
        driverName: driver ? driver.name : 'Unknown',
        driverRating: driver ? driver.rating : null,
        totalViolations: viol.length,
        lastViolationType: lastViolation ? lastViolation.violationType : null,
        lastViolationDate: lastViolation ? lastViolation.timestamp : null,
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Vehicle tracking error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving vehicles' });
  }
});

// GET /vehicles/:vehicleNumber - Single vehicle detail
router.get('/:vehicleNumber', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleNumber: req.params.vehicleNumber });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const driver = await Driver.findOne({ driverId: vehicle.driverId });
    const violations = await Violation.find({ vehicleNumber: vehicle.vehicleNumber }).sort({ timestamp: -1 });

    res.json({
      success: true,
      data: {
        vehicle,
        driver: driver || null,
        violations,
        violationCount: violations.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /vehicles/:vehicleNumber/status - Update vehicle status
router.patch('/:vehicleNumber/status', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Flagged', 'Suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const vehicle = await Vehicle.findOneAndUpdate(
      { vehicleNumber: req.params.vehicleNumber },
      { status },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: `Vehicle status updated to ${status}`, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
