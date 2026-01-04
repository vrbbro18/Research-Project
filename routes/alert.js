const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/authMiddleware');
const violations = require('../data/violations');
const alertService = require('../services/alertService');
const driverService = require('../services/driverService');
const alertSender = require('../services/alertSender');

/**
 * Generate alert message based on alert level and violation details
 * @param {string} alertLevel - Alert level (WARNING, CRITICAL, NORMAL)
 * @param {number} violationCount - Number of violations
 * @param {string} vehicleNumber - Vehicle number
 * @param {string} driverName - Driver name
 * @returns {string} Formatted alert message
 */
const generateAlertMessage = (alertLevel, violationCount, vehicleNumber, driverName) => {
  const baseMessage = `Traffic Violation Alert - Vehicle: ${vehicleNumber}`;
  
  switch (alertLevel) {
    case 'CRITICAL':
      return `${baseMessage}\n\n🚨 CRITICAL ALERT\n\nDear ${driverName},\n\nYour vehicle ${vehicleNumber} has accumulated ${violationCount} speed violations. Immediate attention is required. Please drive safely and within speed limits.\n\nThis is a critical alert - please contact the traffic department if you have any questions.`;
    
    case 'WARNING':
      return `${baseMessage}\n\n⚠️ WARNING ALERT\n\nDear ${driverName},\n\nYour vehicle ${vehicleNumber} has ${violationCount} speed violations. Please be cautious and adhere to speed limits.\n\nPlease drive safely.`;
    
    default:
      return `${baseMessage}\n\nDear ${driverName},\n\nNotification: Your vehicle ${vehicleNumber} has ${violationCount} speed violation(s). Please drive safely.`;
  }
};

// POST /send-alert - Send alert to driver for a vehicle
// Full alert workflow: vehicleNumber -> violation status -> driver lookup -> alert message -> WhatsApp send
// Accessible to SUPER_ADMIN and OFFICER
router.post('/send-alert', requireRole('SUPER_ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const { vehicleNumber } = req.body;

    // Step 1: Validate input
    if (!vehicleNumber) {
      return res.status(400).json({
        success: false,
        message: 'vehicleNumber is required'
      });
    }

    // Step 2: Retrieve latest violation status for the vehicle
    const speedViolationCount = alertService.countSpeedViolations(violations, vehicleNumber);
    const speedAlertStatus = alertService.getSpeedAlertStatus(violations, vehicleNumber);
    
    // Get all violations for context
    const vehicleViolations = violations.filter(v => v.vehicleNumber === vehicleNumber);
    const latestViolation = vehicleViolations.length > 0
      ? vehicleViolations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
      : null;

    // Step 3: Lookup driver details by vehicle number
    const driverInfo = driverService.getDriverByVehicleNumber(vehicleNumber);

    if (!driverInfo) {
      return res.status(404).json({
        success: false,
        message: `No driver found for vehicle number: ${vehicleNumber}`
      });
    }

    // Step 4: Generate alert message based on alert level
    const alertMessage = generateAlertMessage(
      speedAlertStatus.alertLevel,
      speedViolationCount,
      vehicleNumber,
      driverInfo.name
    );

    // Step 5: Prepare WhatsApp alert options
    // If Content Template is used, generate content variables from violation data
    const whatsappOptions = {};
    if (process.env.TWILIO_CONTENT_SID) {
      // Generate content variables for the template
      // Adjust variable keys based on your Content Template structure
      whatsappOptions.contentVariables = {
        "1": vehicleNumber,           // Vehicle number
        "2": driverInfo.name,         // Driver name
        "3": speedViolationCount.toString(), // Violation count
        "4": speedAlertStatus.alertLevel,    // Alert level
        "5": new Date().toLocaleDateString() // Date
      };
    }

    // Step 6: Send WhatsApp alert (async)
    const whatsappResult = await alertSender.sendWhatsAppAlert(
      driverInfo.phoneNumber,
      speedAlertStatus.alertLevel,
      alertMessage,
      whatsappOptions
    );

    // Step 6: Return confirmation
    return res.json({
      success: true,
      message: 'Alert sent successfully',
      workflow: {
        step1_vehicleLookup: {
          vehicleNumber: vehicleNumber,
          found: true
        },
        step2_violationStatus: {
          speedViolationCount: speedViolationCount,
          totalViolationCount: alertService.getCurrentViolationCount(violations, vehicleNumber),
          alertLevel: speedAlertStatus.alertLevel,
          latestViolation: latestViolation ? {
            id: latestViolation.id,
            type: latestViolation.violationType,
            timestamp: latestViolation.timestamp
          } : null
        },
        step3_driverLookup: {
          driverId: driverInfo.driverId,
          name: driverInfo.name,
          phoneNumber: alertSender.maskPhoneNumber(driverInfo.phoneNumber)
        },
        step4_messageGenerated: {
          message: alertMessage,
          alertLevel: speedAlertStatus.alertLevel
        },
        step5_whatsappSent: whatsappResult
      },
      summary: {
        vehicleNumber: vehicleNumber,
        driverName: driverInfo.name,
        alertLevel: speedAlertStatus.alertLevel,
        speedViolationCount: speedViolationCount,
        whatsappSent: whatsappResult.sent,
        timestamp: whatsappResult.timestamp
      }
    });

  } catch (error) {
    console.error('Error in send-alert endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send alert',
      error: error.message
    });
  }
});

module.exports = router;

