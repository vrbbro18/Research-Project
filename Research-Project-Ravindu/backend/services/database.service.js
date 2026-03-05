const Detection = require('../models/Detection');
const Notification = require('../models/Notification');
const Accident = require('../models/Accident');
const { v4: uuidv4 } = require('uuid');

/**
 * DATABASE SERVICE (Mongoose Version)
 */

async function addDetection(detection) {
  try {
    const newDetection = await Detection.create(detection);
    console.log(`[DATABASE] Added detection: ${newDetection.id} (${newDetection.riskLevel})`);

    // Optional: Implement cleanup logic if we want to limit records
    return newDetection;
  } catch (error) {
    console.error('[DATABASE ERROR] addDetection:', error);
    throw error;
  }
}

async function getDetections(riskLevel = null) {
  try {
    let query = {};
    if (riskLevel) {
      // In the original, it's exact string match
      query.riskLevel = riskLevel;
    }
    const detections = await Detection.find(query).lean();
    return detections;
  } catch (error) {
    console.error('[DATABASE ERROR] getDetections:', error);
    throw error;
  }
}

async function getDetectionById(id) {
  try {
    return await Detection.findOne({ id }).lean();
  } catch (error) {
    console.error('[DATABASE ERROR] getDetectionById:', error);
    throw error;
  }
}

async function getStatistics() {
  try {
    const total = await Detection.countDocuments();

    const lowRisk = await Detection.countDocuments({ riskLevel: 'low' });
    const mediumRisk = await Detection.countDocuments({ riskLevel: 'medium' });
    const highRisk = await Detection.countDocuments({ riskLevel: 'high' });

    const normalCat = await Detection.countDocuments({ category: 'normal' });
    const abnormalCat = await Detection.countDocuments({ category: 'abnormal' });
    const unresponsiveCat = await Detection.countDocuments({ category: 'unresponsive' });
    const unknownCat = await Detection.countDocuments({ category: { $nin: ['normal', 'abnormal', 'unresponsive'] } });

    // Calculate average confidence
    const confidenceResult = await Detection.aggregate([
      { $group: { _id: null, avgConf: { $avg: "$confidence" } } }
    ]);
    const avgConfidence = confidenceResult.length > 0 ? (confidenceResult[0].avgConf || 0) : 0;

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Detection.countDocuments({ timestamp: { $gt: dayAgo } });

    const lastDetection = await Detection.findOne().sort({ timestamp: -1 });

    return {
      total,
      byRiskLevel: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk
      },
      byCategory: {
        normal: normalCat,
        abnormal: abnormalCat,
        unresponsive: unresponsiveCat,
        unknown: unknownCat
      },
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      last24Hours: recent,
      lastUpdated: lastDetection ? lastDetection.timestamp : null
    };
  } catch (error) {
    console.error('[DATABASE ERROR] getStatistics:', error);
    throw error;
  }
}

async function addNotification(notification) {
  try {
    const newNotification = await Notification.create(notification);
    console.log(`[DATABASE] Added notification: ${newNotification.id} (${newNotification.type})`);
    return newNotification;
  } catch (error) {
    console.error('[DATABASE ERROR] addNotification:', error);
    throw error;
  }
}

async function getNotifications() {
  try {
    return await Notification.find({}).lean();
  } catch (error) {
    console.error('[DATABASE ERROR] getNotifications:', error);
    throw error;
  }
}

async function addAccident(accident) {
  try {
    const newAccident = await Accident.create(accident);
    console.log(`[DATABASE] Added accident: ${newAccident.accidentId} (${newAccident.riskLevel})`);
    return newAccident;
  } catch (error) {
    console.error('[DATABASE ERROR] addAccident:', error);
    throw error;
  }
}

async function getAccidents(riskLevel = null) {
  try {
    let query = {};
    if (riskLevel) {
      query.riskLevel = riskLevel;
    }
    return await Accident.find(query).lean();
  } catch (error) {
    console.error('[DATABASE ERROR] getAccidents:', error);
    throw error;
  }
}

async function getAccidentById(accidentId) {
  try {
    return await Accident.findOne({ accidentId }).lean();
  } catch (error) {
    console.error('[DATABASE ERROR] getAccidentById:', error);
    throw error;
  }
}

async function getAccidentCount() {
  try {
    return await Accident.countDocuments();
  } catch (error) {
    console.error('[DATABASE ERROR] getAccidentCount:', error);
    return 0; // The route logic relies on this not throwing potentially
  }
}

async function clearAll() {
  try {
    await Detection.deleteMany({});
    await Notification.deleteMany({});
    await Accident.deleteMany({});
    console.log('[DATABASE] All data cleared');
  } catch (error) {
    console.error('[DATABASE ERROR] clearAll:', error);
    throw error;
  }
}

module.exports = {
  addDetection,
  getDetections,
  getDetectionById,
  getStatistics,
  addNotification,
  getNotifications,
  addAccident,
  getAccidents,
  getAccidentById,
  getAccidentCount,
  clearAll
};
