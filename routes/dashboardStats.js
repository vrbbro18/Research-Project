const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const Violation = require('../models/Violation');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');

router.get('/stats', requireRole('SUPER_ADMIN', 'OFFICER', 'ANALYST'), async (req, res) => {
  try {
    const all = await Violation.find().sort({ timestamp: -1 });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now); last7.setDate(last7.getDate() - 7);
    const last30 = new Date(now); last30.setDate(last30.getDate() - 30);

    const todayViolations  = all.filter(v => new Date(v.timestamp) >= today);
    const weekViolations   = all.filter(v => new Date(v.timestamp) >= last7);
    const monthViolations  = all.filter(v => new Date(v.timestamp) >= last30);

    const high   = all.filter(v => v.speedCategory === 'High');
    const medium = all.filter(v => v.speedCategory === 'Medium');
    const speeds = all.filter(v => v.speed).map(v => v.speed);
    const maxSpeed = speeds.length ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length ? Math.round(speeds.reduce((a,b) => a+b, 0) / speeds.length) : 0;

    // Per-day counts for last 14 days
    const dailyCounts = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd   = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const count = all.filter(v => new Date(v.timestamp) >= dayStart && new Date(v.timestamp) < dayEnd).length;
      const highCount = all.filter(v => new Date(v.timestamp) >= dayStart && new Date(v.timestamp) < dayEnd && v.speedCategory === 'High').length;
      dailyCounts.push({ label, count, highCount });
    }

    // Speed distribution buckets
    const speedBuckets = {
      '101-110': all.filter(v => v.speed >= 101 && v.speed <= 110).length,
      '111-120': all.filter(v => v.speed >= 111 && v.speed <= 120).length,
      '121-130': all.filter(v => v.speed >= 121 && v.speed <= 130).length,
      '131-140': all.filter(v => v.speed >= 131 && v.speed <= 140).length,
      '141-150': all.filter(v => v.speed >= 141 && v.speed <= 150).length,
      '151+':    all.filter(v => v.speed > 150).length,
    };

    // Hotspot checkpoints
    const checkpointCounts = {};
    all.forEach(v => {
      if (v.checkpoint) checkpointCounts[v.checkpoint] = (checkpointCounts[v.checkpoint] || 0) + 1;
    });
    const hotspots = Object.entries(checkpointCounts)
      .sort((a,b) => b[1]-a[1]).slice(0,5)
      .map(([cp, count]) => ({ checkpoint: cp, count }));

    // Hourly distribution (heatmap data)
    const hourly = Array(24).fill(0);
    all.forEach(v => { hourly[new Date(v.timestamp).getHours()]++; });

    // Top offenders (vehicles with most violations)
    const vehicleCounts = {};
    all.forEach(v => { vehicleCounts[v.vehicleNumber] = (vehicleCounts[v.vehicleNumber] || 0) + 1; });
    const topOffenders = Object.entries(vehicleCounts)
      .sort((a,b) => b[1]-a[1]).slice(0,5)
      .map(([vNum, count]) => {
        const latestViol = all.find(v => v.vehicleNumber === vNum);
        return { vehicleNumber: vNum, count, latestSpeed: latestViol?.speed, speedCategory: latestViol?.speedCategory };
      });

    // Recent critical alerts
    const recentCritical = high.slice(0, 8).map(v => ({
      vehicleNumber: v.vehicleNumber,
      speed: v.speed,
      checkpoint: v.checkpoint,
      timestamp: v.timestamp,
      alertSent: v.alertSent,
    }));

    // Driver stats
    const totalDrivers = await Driver.countDocuments();
    const suspendedDrivers = await Driver.countDocuments({ status: 'Suspended' });
    const flaggedDrivers = await Driver.countDocuments({ status: 'Flagged' });
    const criticalDrivers = await Driver.countDocuments({ rating: { $lt: 40 } });
    const vehicles = await Vehicle.countDocuments();
    const alertsSent = all.filter(v => v.alertSent).length;

    res.json({
      success: true,
      stats: {
        overview: {
          total: all.length, today: todayViolations.length,
          thisWeek: weekViolations.length, thisMonth: monthViolations.length,
          highSpeed: high.length, mediumSpeed: medium.length,
          maxSpeed, avgSpeed, alertsSent,
          totalDrivers, suspendedDrivers, flaggedDrivers, criticalDrivers,
          totalVehicles: vehicles,
        },
        dailyCounts,
        speedBuckets,
        hotspots,
        hourly,
        topOffenders,
        recentCritical,
        latestViolations: all.slice(0, 15),
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
  }
});

module.exports = router;
