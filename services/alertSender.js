// WhatsApp Alert Sender
// Uses whatsapp-web.js library with QR code authentication
// Always sends messages to 94766702382

const whatsappService = require('./whatsapp.service');

// Fixed phone number to send all WhatsApp messages
const WHATSAPP_RECIPIENT = '94766702382';

console.log('📱 WhatsApp service initialized (whatsapp-web.js)');
console.log(`   All messages will be sent to: ${WHATSAPP_RECIPIENT}`);
console.log('   QR code will be displayed in terminal when authentication is required');

/**
 * Mask phone number for logging (privacy protection)
 * Shows country code and last 4 digits
 * @param {string} phoneNumber - Full phone number
 * @returns {string} Masked phone number for logging
 */
const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'N/A';
  
  // Remove non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If phone number is too short, return as is
  if (cleaned.length <= 6) {
    return cleaned;
  }

  // Mask middle digits, show country code and last 4 digits
  const countryCode = cleaned.match(/^\+\d{1,3}/)?.[0] || '';
  const last4 = cleaned.slice(-4);
  const masked = cleaned.replace(/^\+\d{1,3}/, '').slice(0, -4).replace(/\d/g, 'x');
  
  return countryCode ? `${countryCode}${masked}${last4}` : `xxxxxx${last4}`;
};

/**
 * Send real WhatsApp message via whatsapp-web.js
 * Always sends to the fixed recipient number (94716596231)
 * @param {string} phoneNumber - Original phone number (for logging only, not used for sending)
 * @param {string} message - Message to send
 * @param {Object} options - Additional options (kept for compatibility, not used)
 * @returns {Object} Message response
 */
const sendRealWhatsApp = async (phoneNumber, message, options = {}) => {
  try {
    // Always send to the fixed recipient number
    const recipientNumber = WHATSAPP_RECIPIENT;
    
    console.log(`📤 Sending WhatsApp message via whatsapp-web.js`);
    console.log(`   Original recipient (for reference): ${maskPhoneNumber(phoneNumber)}`);
    console.log(`   Actual recipient: ${recipientNumber}`);
    console.log(`   Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

    // Send message using WhatsApp service
    const result = await whatsappService.sendMessage(recipientNumber, message);

    console.log(`✅ WhatsApp message sent successfully`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Timestamp: ${result.timestamp}`);

    return {
      messageId: result.messageId,
      status: 'sent',
      timestamp: result.timestamp,
      chatId: result.chatId,
      phoneNumber: recipientNumber,
      method: 'whatsapp-web.js'
    };
  } catch (error) {
    console.error('\n❌ WhatsApp-web.js Error:');
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Error Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
};

/**
 * Simulates sending a WhatsApp alert to a driver
 * @param {string} phoneNumber - Driver's phone number (e.g., "+1-555-0101")
 * @param {string} alertLevel - Alert level: 'WARNING', 'CRITICAL', or 'NORMAL'
 * @param {string} message - The alert message to send
 * @param {Object} options - Optional: { contentSid, contentVariables } for Content Templates
 * @returns {Object} Response object with success status and details
 */
const sendWhatsAppAlert = async (phoneNumber, alertLevel, message, options = {}) => {
  // Validate inputs
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  if (!alertLevel) {
    throw new Error('Alert level is required');
  }
  
  if (!message) {
    throw new Error('Message is required');
  }

  // Validate alert level
  const validAlertLevels = ['NORMAL', 'WARNING', 'CRITICAL'];
  if (!validAlertLevels.includes(alertLevel)) {
    throw new Error(`Invalid alert level. Must be one of: ${validAlertLevels.join(', ')}`);
  }

  // Format phone number for logging (mask sensitive parts)
  const maskedPhone = maskPhoneNumber(phoneNumber);

  // Log the WhatsApp alert
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 WHATSAPP ALERT (whatsapp-web.js)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Original Recipient (for reference): ${maskedPhone}`);
  console.log(`Actual Recipient: ${WHATSAPP_RECIPIENT}`);
  console.log(`Alert Level: ${alertLevel}`);
  console.log(`Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let whatsappResult = null;
  let sentVia = 'whatsapp-web.js';

  // Send via whatsapp-web.js
  try {
    whatsappResult = await sendRealWhatsApp(phoneNumber, message, options);
    sentVia = 'whatsapp-web.js';
    console.log(`✅ [REAL] WhatsApp message sent via whatsapp-web.js`);
    console.log(`   Message ID: ${whatsappResult.messageId}`);
    console.log(`   Status: ${whatsappResult.status}`);
    console.log(`   Sent to: ${whatsappResult.phoneNumber}`);
  } catch (error) {
    console.error(`❌ Failed to send via WhatsApp: ${error.message}`);
    sentVia = 'failed';
    throw error; // Re-throw to be handled by caller
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Return success response
  const response = {
    success: true,
    sent: true,
    timestamp: new Date().toISOString(),
    originalRecipient: maskedPhone, // Original phone number (for reference)
    actualRecipient: WHATSAPP_RECIPIENT, // Actual recipient number
    alertLevel: alertLevel,
    message: message,
    method: 'whatsapp-web.js',
    note: `Message sent via whatsapp-web.js to ${WHATSAPP_RECIPIENT}`
  };

  // Include WhatsApp details if message was sent
  if (whatsappResult) {
    response.whatsapp = {
      messageId: whatsappResult.messageId,
      status: whatsappResult.status,
      timestamp: whatsappResult.timestamp,
      chatId: whatsappResult.chatId,
      phoneNumber: whatsappResult.phoneNumber,
      method: whatsappResult.method
    };
  }

  return response;
};

/**
 * Send multiple WhatsApp alerts (batch operation)
 * @param {Array} alerts - Array of alert objects {phoneNumber, alertLevel, message}
 * @returns {Array} Array of response objects
 */
const sendBulkWhatsAppAlerts = async (alerts) => {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    throw new Error('Alerts array is required and must not be empty');
  }

  const results = [];
  
  for (let i = 0; i < alerts.length; i++) {
    const alert = alerts[i];
    try {
      const result = await sendWhatsAppAlert(alert.phoneNumber, alert.alertLevel, alert.message);
      results.push({
        index: i,
        ...result
      });
      
      // Small delay between messages to avoid rate limiting
      if (i < alerts.length - 1 && USE_REAL_WHATSAPP) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      results.push({
        index: i,
        success: false,
        sent: false,
        error: error.message,
        recipient: alert.phoneNumber ? maskPhoneNumber(alert.phoneNumber) : 'N/A'
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  console.log(`\n📊 Bulk Alert Summary: ${successCount} sent, ${failureCount} failed\n`);

  return {
    total: alerts.length,
    successful: successCount,
    failed: failureCount,
    results: results
  };
};

module.exports = {
  sendWhatsAppAlert,
  sendBulkWhatsAppAlerts,
  maskPhoneNumber
};
