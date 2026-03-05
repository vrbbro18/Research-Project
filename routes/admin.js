const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const os = require('os');

router.use(requireRole('SUPER_ADMIN'));

// GET /admin - Full system admin data
router.get('/', async (req, res) => {
  try {
    const totalViolations = await Violation.countDocuments();
    const highSpeed = await Violation.countDocuments({ speedCategory: 'High' });
    const mediumSpeed = await Violation.countDocuments({ speedCategory: 'Medium' });
    const alertsSent = await Violation.countDocuments({ alertSent: true });
    const totalDrivers = await Driver.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    const suspendedDrivers = await Driver.countDocuments({ status: 'Suspended' });
    const flaggedDrivers = await Driver.countDocuments({ status: 'Flagged' });
    const criticalDrivers = await Driver.countDocuments({ rating: { $lt: 40 } });

    // Today's violations
    const today = new Date(); today.setHours(0,0,0,0);
    const todayViolations = await Violation.countDocuments({ timestamp: { $gte: today } });

    // Speed thresholds config
    const speedThresholds = {
      safe: { max: 100, label: 'Safe Zone', color: '#10b981' },
      medium: { min: 101, max: 120, label: 'Warning Zone', deduction: 5, color: '#f59e0b' },
      high: { min: 121, label: 'Critical Zone', deduction: 15, color: '#ef4444', alertTriggered: true },
    };

    // RFID checkpoints status (static config)
    const rfidCheckpoints = [
      { id: 'E01-KM12', highway: 'E01 - Southern Expressway', location: 'Kottawa Interchange',    km: 12, status: 'Online', lastPing: new Date(Date.now() - 45000).toISOString() },
      { id: 'E01-KM28', highway: 'E01 - Southern Expressway', location: 'Kahathuduwa',            km: 28, status: 'Online', lastPing: new Date(Date.now() - 12000).toISOString() },
      { id: 'E01-KM45', highway: 'E01 - Southern Expressway', location: 'Gelanigama',             km: 45, status: 'Online', lastPing: new Date(Date.now() - 30000).toISOString() },
      { id: 'E01-KM67', highway: 'E01 - Southern Expressway', location: 'Pinnaduwa',              km: 67, status: 'Online', lastPing: new Date(Date.now() - 60000).toISOString() },
      { id: 'E01-KM89', highway: 'E01 - Southern Expressway', location: 'Imaduwa',               km: 89, status: 'Warning', lastPing: new Date(Date.now() - 180000).toISOString() },
      { id: 'E03-KM08', highway: 'E03 - Outer Circular',      location: 'Kaduwela',              km: 8,  status: 'Online', lastPing: new Date(Date.now() - 22000).toISOString() },
      { id: 'E03-KM22', highway: 'E03 - Outer Circular',      location: 'Kelaniya',              km: 22, status: 'Online', lastPing: new Date(Date.now() - 55000).toISOString() },
      { id: 'E03-KM38', highway: 'E03 - Outer Circular',      location: 'Peliyagoda',            km: 38, status: 'Offline', lastPing: new Date(Date.now() - 900000).toISOString() },
      { id: 'E04-KM05', highway: 'E04 - Central Expressway',  location: 'Kadawatha',             km: 5,  status: 'Online', lastPing: new Date(Date.now() - 8000).toISOString() },
      { id: 'E04-KM19', highway: 'E04 - Central Expressway',  location: 'Nittambuwa',            km: 19, status: 'Online', lastPing: new Date(Date.now() - 35000).toISOString() },
    ];

    // System users
    const systemUsers = [
      { username: 'admin',   role: 'SUPER_ADMIN', lastLogin: new Date(Date.now() - 300000).toISOString(), status: 'Active' },
      { username: 'officer', role: 'OFFICER',     lastLogin: new Date(Date.now() - 1800000).toISOString(), status: 'Active' },
      { username: 'analyst', role: 'ANALYST',     lastLogin: new Date(Date.now() - 7200000).toISOString(), status: 'Active' },
    ];

    // System health
    const uptimeSeconds = process.uptime();
    const memUsage = process.memoryUsage();
    const systemHealth = {
      uptime: uptimeSeconds,
      memoryUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      cpuPlatform: os.platform(),
      nodeVersion: process.version,
      serverTime: new Date().toISOString(),
      dbStatus: 'Connected',
      apiStatus: 'Operational',
    };

    res.json({
      success: true,
      data: {
        stats: {
          totalViolations, highSpeed, mediumSpeed, alertsSent,
          totalDrivers, totalVehicles, suspendedDrivers, flaggedDrivers,
          criticalDrivers, todayViolations,
        },
        speedThresholds,
        rfidCheckpoints,
        systemUsers,
        systemHealth,
      }
    });
  } catch (err) {
    console.error('Admin panel error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admin data' });
  }
});

// GET /admin/users
router.get('/users', (req, res) => {
  res.json({
    success: true,
    users: [
      { username: 'admin',   role: 'SUPER_ADMIN' },
      { username: 'officer', role: 'OFFICER' },
      { username: 'analyst', role: 'ANALYST' },
    ]
  });
});

module.exports = router;
