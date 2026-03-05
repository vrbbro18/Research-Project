const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const alertService = require('../services/alertService');
const Violation = require('../models/Violation');

// GET /violations - List all violations with alert levels
router.get('/', requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'), async (req, res) => {
  try {
    const dbViolations = await Violation.find().sort({ timestamp: -1 });

    // Convert to JSON and add alert level
    const violationsWithAlerts = dbViolations.map(violation => {
      const vJson = violation.toJSON();
      return {
        ...vJson,
        id: vJson._id,
        // Using a basic static alert level for manual violations for backward compatibility
        alertLevel: alertService.calculateAlertLevel(1)
      };
    });

    res.json({
      success: true,
      message: 'Violations retrieved successfully',
      role: req.userRole,
      violations: violationsWithAlerts
    });
  } catch (err) {
    console.error('Error fetching violations', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve violations' });
  }
});

// POST /violations - Manually add a speed violation (research/test use)
router.post('/', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  const { vehicleNumber, speed, checkpoint, timestamp } = req.body;

  if (!vehicleNumber || !speed) {
    return res.status(400).json({
      success: false,
      message: 'vehicleNumber and speed (km/h) are required'
    });
  }

  const speedValue = parseFloat(speed);
  if (isNaN(speedValue) || speedValue <= 0) {
    return res.status(400).json({ success: false, message: 'speed must be a valid positive number' });
  }

  const speedCategory = speedValue > 120 ? 'High' : speedValue >= 101 ? 'Medium' : 'Low';
  if (speedCategory === 'Low') {
    return res.status(400).json({ success: false, message: `Speed ${speedValue} km/h is below violation threshold (100 km/h)` });
  }

  try {
    const newViolation = new Violation({
      vehicleNumber: vehicleNumber.trim(),
      violationType: 'Speeding',
      speed: speedValue,
      speedCategory,
      checkpoint: checkpoint || 'Manual Entry',
      timestamp: timestamp || new Date(),
    });

    await newViolation.save();

    res.json({
      success: true,
      message: `Speed violation recorded: ${speedValue} km/h (${speedCategory})`,
      violation: {
        id: newViolation._id,
        vehicleNumber: newViolation.vehicleNumber,
        speed: newViolation.speed,
        speedCategory: newViolation.speedCategory,
        checkpoint: newViolation.checkpoint,
        timestamp: newViolation.timestamp,
      }
    });
  } catch (error) {
    console.error('Error adding violation', error);
    res.status(500).json({ success: false, message: 'Failed to add violation' });
  }
});

// GET /violations/:id - Get specific violation
router.get('/:id', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  const violationId = req.params.id;

  try {
    const violation = await Violation.findById(violationId);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: `Violation with id ${violationId} not found`
      });
    }

    res.json({
      success: true,
      message: `Violation ${violationId} retrieved`,
      violation: {
        id: violation._id,
        ...violation.toJSON(),
        alertLevel: alertService.calculateAlertLevel(1)
      }
    });
  } catch (error) {
    console.error('Error fetching violation', error);
    res.status(500).json({ success: false, message: 'Failed to get violation' });
  }
});

module.exports = router;
