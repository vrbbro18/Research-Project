const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const violations = require('../data/violations');
const alertService = require('../services/alertService');

// GET /violations - List all violations with alert levels
// Allow SUPER_ADMIN, OFFICER, and ANALYST (ANALYST needs this for charts)
router.get('/', requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'), (req, res) => {
  // Map violations and add alert level to each record using alert service
  const violationsWithAlerts = violations.map(violation => ({
    ...violation,
    alertLevel: alertService.calculateAlertLevel(violation.violationCount)
  }));

  res.json({
    success: true,
    message: 'Violations retrieved successfully',
    role: req.userRole,
    violations: violationsWithAlerts
  });
});

// POST /violations - Manually add a new violation (SUPER_ADMIN and OFFICER only)
router.post('/', requireRole('SUPER_ADMIN', 'OFFICER'), (req, res) => {
  const { vehicleNumber, violationType, timestamp } = req.body;

  // Input validation
  if (!vehicleNumber || !violationType) {
    return res.status(400).json({
      success: false,
      message: 'vehicleNumber and violationType are required'
    });
  }

  // Valid violation types
  const validViolationTypes = ['Speeding', 'Red Light', 'Parking', 'No Seatbelt', 'Illegal Turn', 'Wrong Lane'];
  if (!validViolationTypes.includes(violationType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid violationType. Must be one of: ${validViolationTypes.join(', ')}`
    });
  }

  // Calculate new violation count for this vehicle (increment total count)
  const currentTotalViolationCount = alertService.getCurrentViolationCount(violations, vehicleNumber);
  const newTotalViolationCount = currentTotalViolationCount + 1;

  // Generate new violation ID
  const newId = violations.length > 0 ? Math.max(...violations.map(v => v.id)) + 1 : 1;

  // Create new violation record
  const newViolation = {
    id: newId,
    vehicleNumber: vehicleNumber.trim(),
    violationType: violationType,
    timestamp: timestamp || new Date().toISOString(),
    violationCount: newTotalViolationCount,
    source: 'manual' // Mark as manually added for research tracking
  };

  // Add violation to the array (in-memory storage)
  violations.push(newViolation);

  // Calculate alert level
  const alertLevel = alertService.calculateAlertLevel(newTotalViolationCount);

  const violationWithAlert = {
    ...newViolation,
    alertLevel: alertLevel
  };

  res.json({
    success: true,
    message: 'Violation added successfully',
    violation: violationWithAlert
  });
});

// GET /violations/:id - Get specific violation (SUPER_ADMIN and OFFICER only)
router.get('/:id', requireRole('SUPER_ADMIN', 'OFFICER'), (req, res) => {
  const violationId = parseInt(req.params.id);
  const violation = violations.find(v => v.id === violationId);

  if (!violation) {
    return res.status(404).json({
      success: false,
      message: `Violation with id ${violationId} not found`
    });
  }

  const violationWithAlert = {
    ...violation,
    alertLevel: alertService.calculateAlertLevel(violation.violationCount)
  };

  res.json({
    success: true,
    message: `Violation ${violationId} retrieved`,
    violation: violationWithAlert
  });
});

module.exports = router;

