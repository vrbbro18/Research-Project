const express = require('express');
const router = express.Router();
const users = require('../data/users');

// POST /login
// Accepts username and password, returns user role if valid
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  // Find user
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }

  // Return user role
  res.json({
    success: true,
    role: user.role,
    username: user.username
  });
});

module.exports = router;

