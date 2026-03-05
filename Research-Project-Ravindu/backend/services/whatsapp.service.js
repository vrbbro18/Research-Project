// Load environment variables FIRST - use explicit path
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');

// Load .env file explicitly
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.warn(`[WHATSAPP] ⚠️  Error loading .env file: ${envResult.error.message}`);
  console.warn(`[WHATSAPP] ⚠️  .env file path: ${envPath}`);
} else {
  console.log(`[WHATSAPP] ✅ Loaded .env file from: ${envPath}`);
}

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Function to get emergency contacts (loads fresh from .env each time)
function getEmergencyContacts() {
  // Reload .env to get latest values
  dotenv.config({ path: envPath });
  const contacts = process.env.WHATSAPP_CONTACTS 
    ? process.env.WHATSAPP_CONTACTS.split(',').map(num => num.trim()).filter(num => num.length > 0)
    : [];
  return contacts;
}

// Initial load of contacts
let EMERGENCY_CONTACTS = getEmergencyContacts();

// Debug: Log loaded contacts
console.log(`[WHATSAPP] Environment check:`);
console.log(`   - WHATSAPP_CONTACTS from process.env: ${process.env.WHATSAPP_CONTACTS || 'undefined'}`);
console.log(`   - .env file exists: ${fs.existsSync(envPath)}`);

if (EMERGENCY_CONTACTS.length > 0) {
  console.log(`[WHATSAPP] ✅ Loaded ${EMERGENCY_CONTACTS.length} emergency contact(s): ${EMERGENCY_CONTACTS.join(', ')}`);
} else {
  console.warn('[WHATSAPP] ⚠️  No emergency contacts loaded from environment variable WHATSAPP_CONTACTS');
  console.warn('[WHATSAPP] ⚠️  Please check your .env file and ensure it contains: WHATSAPP_CONTACTS=94716596231');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.warn(`[WHATSAPP] ⚠️  .env file content: "${envContent}"`);
    console.warn(`[WHATSAPP] ⚠️  .env file length: ${envContent.length} characters`);
  }
}

let whatsappClient = null;
let isReady = false;
let qrCodeGenerated = false;

/**
 * Initialize WhatsApp client
 */
function initializeWhatsApp() {
  if (whatsappClient) {
    return Promise.resolve(whatsappClient);
  }

  console.log('\n📱 Initializing WhatsApp service...');
  
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '../.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // QR Code generation
  whatsappClient.on('qr', (qr) => {
    if (!qrCodeGenerated) {
      console.log('\n📱 WhatsApp QR Code - Scan this with your phone:');
      console.log('='.repeat(60));
      qrcode.generate(qr, { small: true });
      console.log('='.repeat(60));
      console.log('⚠️  Scan the QR code above with WhatsApp on your phone');
      console.log('   1. Open WhatsApp on your phone');
      console.log('   2. Go to Settings > Linked Devices');
      console.log('   3. Tap "Link a Device"');
      console.log('   4. Scan the QR code above\n');
      qrCodeGenerated = true;
    }
  });

  // Ready event
  whatsappClient.on('ready', () => {
    isReady = true;
    console.log('\n✅ WhatsApp client is ready!');
    console.log('📱 WhatsApp alerts are now active\n');
  });

  // Authentication failure
  whatsappClient.on('auth_failure', (msg) => {
    console.error('\n❌ WhatsApp authentication failed:', msg);
    console.error('Please delete the .wwebjs_auth folder and try again\n');
    isReady = false;
  });

  // Disconnected
  whatsappClient.on('disconnected', (reason) => {
    console.log('\n⚠️  WhatsApp client disconnected:', reason);
    isReady = false;
    // Attempt to reconnect
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect WhatsApp...');
      initializeWhatsApp();
    }, 5000);
  });

  // Initialize the client
  return whatsappClient.initialize().catch(err => {
    console.error('❌ Error initializing WhatsApp:', err);
    throw err;
  });
}

/**
 * Send WhatsApp message to a phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., "1234567890")
 * @param {string} message - Message to send
 * @returns {Promise<Object>} - Result of the message send
 */
async function sendWhatsAppMessage(phoneNumber, message) {
  if (!isReady || !whatsappClient) {
    const errorMsg = `WhatsApp client is not ready. isReady: ${isReady}, client exists: ${!!whatsappClient}`;
    console.error(`[WHATSAPP] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    // Format phone number (add @c.us suffix for WhatsApp)
    const chatId = phoneNumber.includes('@c.us') 
      ? phoneNumber 
      : `${phoneNumber}@c.us`;

    console.log(`[WHATSAPP] Attempting to send to chatId: ${chatId}`);
    
    // Send message
    const result = await whatsappClient.sendMessage(chatId, message);
    
    console.log(`[WHATSAPP] ✅ Message sent successfully to ${phoneNumber}`);
    console.log(`[WHATSAPP] Message ID: ${result.id._serialized}`);
    
    return {
      success: true,
      messageId: result.id._serialized,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[WHATSAPP] ❌ Failed to send WhatsApp message to ${phoneNumber}`);
    console.error(`[WHATSAPP] Error type: ${error.constructor.name}`);
    console.error(`[WHATSAPP] Error message: ${error.message}`);
    console.error(`[WHATSAPP] Full error:`, error);
    
    return {
      success: false,
      error: error.message,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Send emergency alert to all configured contacts
 * @param {Object} notification - Notification object
 * @returns {Promise<Array>} - Array of send results
 */
async function sendEmergencyAlert(notification) {
  console.log(`\n[WHATSAPP] ========================================`);
  console.log(`[WHATSAPP] Attempting to send alert for ${notification.type} (${notification.severity})`);
  console.log(`[WHATSAPP] ========================================`);
  
  // Reload contacts to ensure we have the latest
  const currentContacts = getEmergencyContacts();
  
  console.log(`[WHATSAPP] Current contacts from .env: ${currentContacts.length}`);
  console.log(`[WHATSAPP] Contact numbers: ${currentContacts.join(', ') || 'None'}`);
  
  if (currentContacts.length === 0) {
    console.error('❌ [WHATSAPP] No emergency contacts configured!');
    console.error('   Please set WHATSAPP_CONTACTS in .env file');
    console.error('   Example: WHATSAPP_CONTACTS=94716596231');
    return [];
  }

  console.log(`[WHATSAPP] WhatsApp ready status: ${isReady}`);
  console.log(`[WHATSAPP] WhatsApp client exists: ${!!whatsappClient}`);

  if (!isReady) {
    console.error('❌ [WHATSAPP] WhatsApp client is NOT ready!');
    console.error('   Possible reasons:');
    console.error('   1. QR code not scanned yet');
    console.error('   2. WhatsApp Web disconnected');
    console.error('   3. Initialization failed');
    console.error('   Check server startup logs for QR code');
    console.error('   Solution: Restart server and scan QR code');
    return [];
  }

  if (!whatsappClient) {
    console.error('❌ [WHATSAPP] WhatsApp client object is null!');
    console.error('   Solution: Restart the server to reinitialize WhatsApp');
    return [];
  }

  const message = formatEmergencyMessage(notification);
  const results = [];

  console.log(`\n📱 Sending WhatsApp alerts to ${currentContacts.length} contact(s)...`);
  console.log(`[WHATSAPP] Message preview: ${message.substring(0, 100)}...`);

  for (const contact of currentContacts) {
    try {
      console.log(`[WHATSAPP] Sending message to ${contact}...`);
      const result = await sendWhatsAppMessage(contact, message);
      results.push(result);
      
      if (result.success) {
        console.log(`[WHATSAPP] ✅ Successfully sent to ${contact}`);
      } else {
        console.log(`[WHATSAPP] ❌ Failed to send to ${contact}: ${result.error}`);
      }
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[WHATSAPP] ❌ Exception sending to ${contact}:`, error.message);
      results.push({
        success: false,
        error: error.message,
        phoneNumber: contact,
        timestamp: new Date().toISOString()
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n[WHATSAPP] ========================================`);
  console.log(`📱 WhatsApp alerts sent: ${successCount}/${currentContacts.length} successful`);
  if (successCount > 0) {
    console.log(`✅ Messages successfully delivered!`);
    console.log(`✅ Check your WhatsApp (${currentContacts.join(', ')}) for the alert message`);
  } else {
    console.log(`❌ No messages were delivered. Check errors above.`);
  }
  console.log(`[WHATSAPP] ========================================\n`);

  return results;
}

/**
 * Format notification into WhatsApp message
 * @param {Object} notification - Notification object
 * @returns {string} - Formatted message
 */
function formatEmergencyMessage(notification) {
  const timestamp = new Date(notification.timestamp).toLocaleString();
  
  let message = `🚨 *EMERGENCY ALERT - Driver Risk Detection System* 🚨\n\n`;
  message += `*Alert Type:* ${notification.type.toUpperCase()}\n`;
  message += `*Severity:* ${notification.severity.toUpperCase()}\n`;
  message += `*Category:* ${notification.category || 'N/A'}\n`;
  message += `*Time:* ${timestamp}\n\n`;
  message += `*Message:*\n${notification.message}\n\n`;
  
  if (notification.metadata && notification.metadata.confidence) {
    message += `*Confidence:* ${(notification.metadata.confidence * 100).toFixed(1)}%\n`;
  }
  
  message += `\n*Alert ID:* ${notification.id}\n`;
  message += `\n⚠️ *IMMEDIATE ACTION REQUIRED* ⚠️`;
  
  return message;
}

/**
 * Check if WhatsApp is ready
 * @returns {boolean}
 */
function isWhatsAppReady() {
  return isReady;
}

/**
 * Get WhatsApp client status
 * @returns {Object}
 */
function getStatus() {
  // Reload contacts from env to get latest
  const currentContacts = getEmergencyContacts();
  
  // Also update the module-level variable
  EMERGENCY_CONTACTS = currentContacts;
  
  return {
    ready: isReady,
    authenticated: whatsappClient ? true : false,
    contactsConfigured: currentContacts.length,
    contacts: currentContacts.map(num => num.replace(/@c\.us$/, ''))
  };
}

module.exports = {
  initializeWhatsApp,
  sendWhatsAppMessage,
  sendEmergencyAlert,
  isWhatsAppReady,
  getStatus
};

