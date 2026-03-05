const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const detectionService = require('../services/detection.service');
const dbService = require('../services/database.service');

// Configure multer for file uploads
// Research Note: In production, use cloud storage (AWS S3, Azure Blob) instead of local filesystem
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

/**
 * POST /api/detection/analyze
 * Upload an image and perform risk detection
 * 
 * Request: multipart/form-data with 'image' field
 * Response: Detection result with risk level and confidence
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file in the "image" field'
      });
    }

    console.log(`[DETECTION] Processing image: ${req.file.filename}`);

    const detectionResult = await detectionService.analyzeImage(req.file.path);

    const record = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      riskLevel: detectionResult.riskLevel,
      confidence: detectionResult.confidence,
      category: detectionResult.category,
      timestamp: new Date().toISOString(),
      details: detectionResult.details
    };

    await dbService.addDetection(record);

    // Trigger notifications for HIGH, MEDIUM risk, or unresponsive category
    if (detectionResult.riskLevel === 'high' || detectionResult.riskLevel === 'medium' || detectionResult.category === 'unresponsive') {
      const notificationService = require('../services/notification.service');
      await notificationService.triggerEmergencyNotification(record);
    }

    res.json({
      success: true,
      detection: record
    });

  } catch (error) {
    console.error('[DETECTION ERROR]', error);
    res.status(500).json({
      error: 'Detection failed',
      message: error.message
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const riskLevel = req.query.riskLevel;

    let history = await dbService.getDetections(riskLevel);

    history = history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      count: history.length,
      detections: history
    });

  } catch (error) {
    console.error('[HISTORY ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: error.message
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await dbService.getStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('[STATS ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

module.exports = router;

