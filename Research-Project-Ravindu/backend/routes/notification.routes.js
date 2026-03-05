const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const dbService = require('../services/database.service');
const whatsappService = require('../services/whatsapp.service');

router.get('/', async (req, res) => {
  try {
    const notifications = await dbService.getNotifications();

    const sorted = notifications.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      success: true,
      count: sorted.length,
      notifications: sorted
    });

  } catch (error) {
    console.error('[NOTIFICATIONS ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve notifications',
      message: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const notifications = await dbService.getNotifications();
    const stats = {
      total: notifications.length,
      byType: {
        emergency: notifications.filter(n => n.type === 'emergency').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        info: notifications.filter(n => n.type === 'info').length
      },
      last24Hours: notifications.filter(n => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(n.timestamp) > dayAgo;
      }).length
    };

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('[NOTIFICATION STATS ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve notification statistics',
      message: error.message
    });
  }
});

router.get('/whatsapp/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      whatsapp: status
    });
  } catch (error) {
    console.error('[WHATSAPP STATUS ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve WhatsApp status',
      message: error.message
    });
  }
});

module.exports = router;

