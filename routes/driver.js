const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');

// GET /driver/:vehicleNumber - Get driver information by vehicle number
router.get('/:vehicleNumber', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  const { vehicleNumber } = req.params;

  if (!vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle number is required'
    });
  }

  try {
    // Lookup vehicle
    const vehicle = await Vehicle.findOne({ vehicleNumber });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `No vehicle found for number: ${vehicleNumber}`
      });
    }

    // Lookup Driver from Vehicle.driverId
    const driverInfo = await Driver.findOne({ driverId: vehicle.driverId });
    if (!driverInfo) {
      return res.status(404).json({
        success: false,
        message: `No driver found for vehicle number: ${vehicleNumber}`
      });
    }

    // Return driver information
    res.json({
      success: true,
      message: 'Driver information retrieved successfully',
      data: {
        vehicleNumber: vehicle.vehicleNumber,
        driver: {
          driverId: driverInfo.driverId,
          name: driverInfo.name,
          phoneNumber: driverInfo.phoneNumber,
          rating: driverInfo.rating
        }
      }
    });

  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving driver' });
  }
});

module.exports = router;
