const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const detectionService = require('../services/detection.service');
const dbService = require('../services/database.service');
const notificationService = require('../services/notification.service');

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

function postureToRiskLevel(posture) {
  const postureLower = (posture || '').toLowerCase();

  switch (postureLower) {
    case 'normal':
      return 'LOW';
    case 'abnormal':
      return 'MEDIUM';
    case 'unresponsive':
      return 'HIGH';
    default:
      console.warn(`[ACCIDENT] Unknown posture: ${posture}, defaulting to MEDIUM risk`);
      return 'MEDIUM';
  }
}

/**
 * POST /api/accident/upload
 * 
 * Upload driver image with vehicle and GPS information.
 * Performs AI inference to classify driver posture and determine risk level.
 * 
 * Request (multipart/form-data):
 * - image: Driver photo (JPEG/PNG)
 * - vehicleNo: Vehicle registration number
 * - latitude: GPS latitude (decimal degrees)
 * - longitude: GPS longitude (decimal degrees)
 * 
 * Response (JSON):
 * - riskLevel: LOW, MEDIUM, or HIGH
 * - gpsLocation: { latitude, longitude, address? }
 * - notificationStatus: Status of emergency notification (if triggered)
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided',
        message: 'Please upload an image file in the "image" field'
      });
    }

    if (!req.body.vehicleNo) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'vehicleNo is required'
      });
    }

    if (!req.body.latitude || !req.body.longitude) {
      return res.status(400).json({
        error: 'Missing GPS coordinates',
        message: 'Both latitude and longitude are required'
      });
    }

    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Invalid GPS coordinates',
        message: 'Latitude and longitude must be valid numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Invalid GPS coordinates',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    console.log(`[ACCIDENT] Processing upload for vehicle: ${req.body.vehicleNo}`);
    console.log(`[ACCIDENT] GPS: (${latitude}, ${longitude})`);

    const aiResult = await detectionService.analyzeImage(req.file.path);
    console.log(`[ACCIDENT] AI classification: ${aiResult.category} (confidence: ${aiResult.confidence})`);
    console.log(`[ACCIDENT] Detection method: ${aiResult.details?.method || 'unknown'}`);
    console.log(`[ACCIDENT] Risk level from AI: ${aiResult.riskLevel}`);

    const riskLevel = (aiResult.riskLevel || 'low').toUpperCase();

    const gpsLocation = {
      latitude: latitude,
      longitude: longitude
    };

    const accidentCount = await dbService.getAccidentCount();
    const accidentId = `ACC-${new Date().getFullYear()}-${String(accidentCount + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    let notificationStatus = {
      triggered: false,
      message: 'No notification required'
    };

    if (riskLevel === 'HIGH') {
      const detectionRecord = {
        id: uuidv4(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        riskLevel: 'high',
        confidence: aiResult.confidence,
        category: aiResult.category,
        timestamp: timestamp,
        details: aiResult.details || {},
        vehicleNo: req.body.vehicleNo,
        gpsLocation: gpsLocation
      };

      console.log('\n⚠️ HIGH RISK DETECTED - AUTOMATIC MESSAGE SENDING TRIGGERED ⚠️');
      const notification = await notificationService.triggerEmergencyNotification(detectionRecord);
      notificationStatus = {
        triggered: true,
        automatic: true,
        notificationId: notification.id,
        type: notification.type,
        message: notification.message,
        timestamp: notification.timestamp,
        status: 'Message automatically sent'
      };
      console.log(`[ACCIDENT] ✅ Automatic emergency message sent: ${notification.id}`);
    } else if (riskLevel === 'MEDIUM') {
      const detectionRecord = {
        id: uuidv4(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        riskLevel: 'medium',
        confidence: aiResult.confidence,
        category: aiResult.category,
        timestamp: timestamp,
        details: aiResult.details || {},
        vehicleNo: req.body.vehicleNo,
        gpsLocation: gpsLocation
      };

      console.log('\n⚠️ MEDIUM RISK DETECTED - AUTOMATIC MESSAGE SENDING TRIGGERED ⚠️');
      const notification = await notificationService.triggerEmergencyNotification(detectionRecord);
      notificationStatus = {
        triggered: true,
        automatic: true,
        notificationId: notification.id,
        type: notification.type,
        message: notification.message,
        timestamp: notification.timestamp,
        status: 'Message automatically sent'
      };
      console.log(`[ACCIDENT] ✅ Automatic warning message sent: ${notification.id}`);
    }

    const accidentRecord = {
      accidentId: accidentId,
      vehicleNo: req.body.vehicleNo,
      riskLevel: riskLevel,
      gpsLocation: gpsLocation,
      timestamp: timestamp,
      alertSent: notificationStatus.triggered,
      notificationStatus: notificationStatus,
      imagePath: `/uploads/${req.file.filename}`,
      originalFilename: req.file.originalname,
      aiClassification: {
        category: aiResult.category,
        confidence: aiResult.confidence,
        details: aiResult.details || {}
      }
    };

    await dbService.addAccident(accidentRecord);
    console.log(`[ACCIDENT] Stored record: ${accidentId}`);
    console.log(`[ACCIDENT] - Risk Level: ${riskLevel}`);
    console.log(`[ACCIDENT] - Alert Sent: ${accidentRecord.alertSent}`);
    console.log(`[ACCIDENT] - Notification Triggered: ${notificationStatus.triggered}`);

    res.json({
      success: true,
      accidentId: accidentId,
      riskLevel: riskLevel,
      gpsLocation: gpsLocation,
      notificationStatus: notificationStatus,
      alertSent: notificationStatus.triggered,
      aiClassification: {
        category: aiResult.category,
        confidence: aiResult.confidence
      },
      timestamp: timestamp
    });

  } catch (error) {
    console.error('[ACCIDENT ERROR]', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const riskLevel = req.query.riskLevel;

    let accidents = await dbService.getAccidents(riskLevel);

    accidents = accidents
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      count: accidents.length,
      accidents: accidents
    });

  } catch (error) {
    console.error('[ACCIDENT HISTORY ERROR]', error);
    res.status(500).json({
      error: 'Failed to retrieve accident history',
      message: error.message
    });
  }
});

module.exports = router;

