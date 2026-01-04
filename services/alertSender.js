// WhatsApp Alert Sender
// Supports both real WhatsApp integration (Twilio) and simulated mode
// Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in .env for real integration
// If credentials are not set, falls back to simulation mode

const twilio = require('twilio');

// Check if Twilio credentials are configured
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number
const TWILIO_CONTENT_SID = process.env.TWILIO_CONTENT_SID; // Optional: For Content Templates

const USE_REAL_WHATSAPP = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

// Initialize Twilio client if credentials are available
let twilioClient = null;
if (USE_REAL_WHATSAPP) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Real WhatsApp integration enabled (Twilio)');
  } catch (error) {
    console.warn('⚠️ Twilio initialization failed, falling back to simulation:', error.message);
  }
} else {
  console.log('ℹ️ WhatsApp simulation mode (no Twilio credentials found)');
  console.log('   To enable real WhatsApp, set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env file');
}

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
 * Format phone number for Twilio WhatsApp (must be in format: whatsapp:+1234567890)
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} Formatted phone number for Twilio
 */
const formatPhoneForTwilio = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // If no country code, assume +1 (US/Canada) - adjust as needed
    cleaned = '+1' + cleaned.replace(/\D/g, '');
  }
  
  // Format for Twilio: whatsapp:+1234567890
  return `whatsapp:${cleaned}`;
};

/**
 * Generate content variables JSON string for Twilio Content Templates
 * @param {Object} variables - Variables object to include in template
 * @returns {string} JSON string of content variables
 */
const generateContentVariables = (variables) => {
  return JSON.stringify(variables);
};

/**
 * Send real WhatsApp message via Twilio
 * Supports both regular messages (body) and Content Templates (contentSid + contentVariables)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message to send (for regular messages)
 * @param {Object} options - Additional options: { contentSid, contentVariables }
 * @returns {Object} Twilio message response
 */
const sendRealWhatsApp = async (phoneNumber, message, options = {}) => {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  const toNumber = formatPhoneForTwilio(phoneNumber);
  if (!toNumber) {
    throw new Error('Invalid phone number format');
  }

  try {
    // Determine message payload: Content Template or regular message
    const messagePayload = {
      from: TWILIO_WHATSAPP_FROM,
      to: toNumber
    };

    // Use Content Template if contentSid is provided (either from options or env)
    const contentSid = options.contentSid || TWILIO_CONTENT_SID;
    
    if (contentSid) {
      // Content Template mode
      messagePayload.contentSid = contentSid;
      
      // Merge content variables from options with any default variables
      const contentVariables = options.contentVariables || {};
      
      // If contentVariables is a string, use it directly; otherwise stringify
      if (typeof contentVariables === 'string') {
        messagePayload.contentVariables = contentVariables;
      } else if (Object.keys(contentVariables).length > 0) {
        messagePayload.contentVariables = generateContentVariables(contentVariables);
      }
      
      console.log(`📋 Using Content Template: ${contentSid}`);
      console.log(`   To: ${toNumber}`);
      console.log(`   From: ${TWILIO_WHATSAPP_FROM}`);
      if (messagePayload.contentVariables) {
        console.log(`   Variables: ${messagePayload.contentVariables}`);
      }
    } else {
      // Regular message mode
      messagePayload.body = message;
      console.log(`📝 Using Regular Message Mode`);
      console.log(`   To: ${toNumber}`);
      console.log(`   From: ${TWILIO_WHATSAPP_FROM}`);
      console.log(`   Message: ${message.substring(0, 100)}...`);
    }

    console.log(`\n🚀 Sending WhatsApp message via Twilio...`);
    console.log(`   Full payload:`, JSON.stringify(messagePayload, null, 2));
    
    const twilioMessage = await twilioClient.messages.create(messagePayload);

    console.log(`✅ Twilio API Response:`);
    console.log(`   Message SID: ${twilioMessage.sid}`);
    console.log(`   Status: ${twilioMessage.status}`);
    console.log(`   Error Code: ${twilioMessage.errorCode || 'None'}`);
    console.log(`   Error Message: ${twilioMessage.errorMessage || 'None'}`);

    return {
      sid: twilioMessage.sid,
      status: twilioMessage.status,
      dateCreated: twilioMessage.dateCreated,
      dateSent: twilioMessage.dateSent,
      errorCode: twilioMessage.errorCode,
      errorMessage: twilioMessage.errorMessage,
      method: contentSid ? 'content_template' : 'regular_message'
    };
  } catch (error) {
    console.error('\n❌ Twilio WhatsApp API Error:');
    console.error(`   Error Type: ${error.constructor.name}`);
    console.error(`   Error Code: ${error.code || 'N/A'}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   More Info: ${error.moreInfo || 'N/A'}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw new Error(`Failed to send WhatsApp via Twilio: ${error.message} (Code: ${error.code || 'N/A'})`);
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
  console.log(USE_REAL_WHATSAPP ? '📱 WHATSAPP ALERT (REAL)' : '📱 WHATSAPP ALERT (SIMULATED)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${maskedPhone}`);
  console.log(`Alert Level: ${alertLevel}`);
  console.log(`Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  let twilioResult = null;
  let sentVia = 'simulation';

  // Try to send via real WhatsApp if configured
  if (USE_REAL_WHATSAPP && twilioClient) {
    try {
      twilioResult = await sendRealWhatsApp(phoneNumber, message, options);
      sentVia = 'twilio';
      console.log(`✅ [REAL] WhatsApp message sent via Twilio`);
      console.log(`   Message SID: ${twilioResult.sid}`);
      console.log(`   Status: ${twilioResult.status}`);
      console.log(`   Method: ${twilioResult.method || 'regular_message'}`);
    } catch (error) {
      console.warn(`⚠️ Failed to send via Twilio: ${error.message}`);
      console.log(`   Falling back to simulation mode`);
      sentVia = 'simulation_fallback';
    }
  } else {
    console.log(`[SIMULATED] WhatsApp alert sent to ${maskedPhone}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Return success response
  const response = {
    success: true,
    sent: true,
    timestamp: new Date().toISOString(),
    recipient: maskedPhone,
    alertLevel: alertLevel,
    message: message,
    method: sentVia === 'twilio' ? (twilioResult?.method || 'whatsapp_twilio') : 'whatsapp_simulated',
    note: sentVia === 'twilio' 
      ? 'Message sent via Twilio WhatsApp API' 
      : 'This is a simulated alert for research purposes only'
  };

  // Include Twilio details if real message was sent
  if (twilioResult) {
    response.twilio = {
      messageSid: twilioResult.sid,
      status: twilioResult.status,
      dateCreated: twilioResult.dateCreated,
      dateSent: twilioResult.dateSent,
      method: twilioResult.method
    };
    
    // Include content template info if used
    if (options.contentSid || TWILIO_CONTENT_SID) {
      response.twilio.contentTemplate = {
        contentSid: options.contentSid || TWILIO_CONTENT_SID,
        contentVariables: options.contentVariables || null
      };
    }
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
