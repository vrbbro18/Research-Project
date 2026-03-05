const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Violation = require('../models/Violation');

// Helper function to get date string in YYYY-MM-DD format
const getDateString = (dateObj) => {
  return new Date(dateObj).toISOString().split('T')[0];
};

// All routes in this file require SUPER_ADMIN, OFFICER, or ANALYST role
router.use(requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'));

// GET /charts - Get overall chart data
router.get('/', async (req, res) => {
  try {
    const violations = await Violation.find();

    // Group by Type
    const typeCounts = violations.reduce((acc, violation) => {
      const type = violation.violationType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Group by Severity
    const severityCounts = violations.reduce((acc, violation) => {
      // Fallback for violations without speedCategory
      const severity = violation.speedCategory || 'Low';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Chart data retrieved successfully',
      role: req.userRole,
      charts: {
        violationsByType: {
          labels: Object.keys(typeCounts),
          data: Object.values(typeCounts)
        },
        violationsBySeverity: {
          labels: ['Low', 'Medium', 'High'],
          data: [
            severityCounts['Low'] || 0,
            severityCounts['Medium'] || 0,
            severityCounts['High'] || 0
          ]
        }
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error retrieving chart data' });
  }
});

module.exports = router;
