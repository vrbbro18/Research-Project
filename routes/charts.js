const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');

// All routes in this file require SUPER_ADMIN, OFFICER, or ANALYST role
router.use(requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'));

// GET /charts - Get chart data
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chart data retrieved successfully',
    role: req.userRole,
    charts: {
      violationsByType: {
        labels: ['Speeding', 'Red Light', 'Parking', 'Other'],
        data: [45, 30, 20, 5]
      },
      violationsByTime: {
        labels: ['00:00', '06:00', '12:00', '18:00'],
        data: [10, 25, 40, 25]
      },
      violationsBySeverity: {
        labels: ['Low', 'Medium', 'High'],
        data: [20, 50, 30]
      }
    }
  });
});

// GET /charts/violations-by-type - Violations by type chart data
router.get('/violations-by-type', (req, res) => {
  res.json({
    success: true,
    message: 'Violations by type chart data',
    data: {
      labels: ['Speeding', 'Red Light', 'Parking', 'Other'],
      values: [45, 30, 20, 5]
    }
  });
});

// GET /charts/violations-over-time - Violations over time chart data
router.get('/violations-over-time', (req, res) => {
  res.json({
    success: true,
    message: 'Violations over time chart data',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      values: [120, 145, 132, 158, 167, 180]
    }
  });
});

module.exports = router;
