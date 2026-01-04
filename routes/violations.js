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

