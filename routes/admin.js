const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');

// All routes in this file require SUPER_ADMIN role
router.use(requireRole('SUPER_ADMIN'));

// GET /admin - Admin dashboard info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard accessed successfully',
    role: req.userRole,
    data: {
      totalUsers: 3,
      systemStatus: 'operational',
      permissions: ['full_access']
    }
  });
});

// GET /admin/users - List all users (example endpoint)
router.get('/users', (req, res) => {
  res.json({
    success: true,
    message: 'Users list retrieved',
    users: [
      { username: 'admin', role: 'SUPER_ADMIN' },
      { username: 'officer', role: 'OFFICER' },
      { username: 'analyst', role: 'ANALYST' }
    ]
  });
});

module.exports = router;

