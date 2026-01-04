const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const driverService = require('../services/driverService');

// GET /driver/:vehicleNumber - Get driver information by vehicle number
// This endpoint simulates relational data retrieval (JOIN operation)
// Accessible to SUPER_ADMIN and OFFICER (those who can view violations)
router.get('/:vehicleNumber', requireRole('SUPER_ADMIN', 'OFFICER'), (req, res) => {
  const { vehicleNumber } = req.params;

  if (!vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle number is required'
    });
  }

  // Use service to lookup driver by vehicle number
  const driverInfo = driverService.getDriverByVehicleNumber(vehicleNumber);

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
      vehicleNumber: driverInfo.vehicleNumber,
      driver: {
        driverId: driverInfo.driverId,
        name: driverInfo.name,
        phoneNumber: driverInfo.phoneNumber
      }
    }
  });
});

module.exports = router;


