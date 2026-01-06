// WhatsApp Service using whatsapp-web.js
// Uses WhatsApp Web via Puppeteer with QR code authentication
// Session is stored in .wwebjs_auth folder

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.isInitialized = false;
    this.initPromise = null;
    
    // Rate limiting: 1 second delay between messages
    this.lastMessageTime = 0;
    this.MIN_MESSAGE_INTERVAL = 1000; // 1 second
  }

  /**
   * Initialize WhatsApp client with LocalAuth for session persistence
   */
  async initialize() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized and ready
    if (this.isInitialized && this.isReady) {
      return Promise.resolve();
    }

    // Create initialization promise
    this.initPromise = new Promise((resolve, reject) => {
      try {
        console.log('📱 Initializing WhatsApp client...');

        // Create client with LocalAuth for session persistence
        this.client = new Client({
          authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth'
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

        // QR Code event - display in terminal
        this.client.on('qr', (qr) => {
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📱 WHATSAPP QR CODE - Scan with your phone:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          qrcode.generate(qr, { small: true });
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        });

        // Ready event - client is ready to send messages
        this.client.on('ready', () => {
          console.log('✅ WhatsApp client is ready!');
          this.isReady = true;
          this.isInitialized = true;
          resolve();
        });

        // Authentication event
        this.client.on('authenticated', () => {
          console.log('✅ WhatsApp authenticated successfully');
        });

        // Authentication failure event
        this.client.on('auth_failure', (msg) => {
          console.error('❌ WhatsApp authentication failed:', msg);
          this.isReady = false;
          this.isInitialized = false;
          reject(new Error(`WhatsApp authentication failed: ${msg}`));
        });

        // Disconnected event
        this.client.on('disconnected', (reason) => {
          console.warn('⚠️ WhatsApp client disconnected:', reason);
          this.isReady = false;
          
          // Try to reconnect after a delay
          if (reason === 'NAVIGATION') {
            console.log('🔄 Attempting to reconnect...');
            setTimeout(() => {
              this.initialize().catch(err => {
                console.error('❌ Reconnection failed:', err.message);
              });
            }, 5000);
          }
        });

        // Error event
        this.client.on('error', (error) => {
          console.error('❌ WhatsApp client error:', error);
          this.isReady = false;
        });

        // Start the client
        this.client.initialize().catch(reject);

      } catch (error) {
        console.error('❌ Error initializing WhatsApp client:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  /**
   * Wait for client to be ready
   */
  async waitForReady() {
    if (this.isReady) {
      return;
    }

    // Wait up to 5 minutes for authentication
    const maxWaitTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    while (!this.isReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please scan the QR code.');
    }
  }

  /**
   * Format phone number for WhatsApp (adds @c.us suffix)
   * @param {string} phoneNumber - Phone number (e.g., "94716596231")
   * @returns {string} Formatted chat ID (e.g., "94716596231@c.us")
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      return null;
    }

    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Ensure it doesn't start with 0 (remove leading zero if present)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Return with @c.us suffix
    return `${cleaned}@c.us`;
  }

  /**
   * Send WhatsApp message
   * @param {string} phoneNumber - Recipient phone number (without @c.us)
   * @param {string} message - Message to send
   * @returns {Promise<Object>} Message info object
   */
  async sendMessage(phoneNumber, message) {
    try {
      // Ensure client is initialized and ready
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.waitForReady();

      // Rate limiting: wait if needed
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;
      if (timeSinceLastMessage < this.MIN_MESSAGE_INTERVAL) {
        const waitTime = this.MIN_MESSAGE_INTERVAL - timeSinceLastMessage;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Format phone number
      const chatId = this.formatPhoneNumber(phoneNumber);
      if (!chatId) {
        throw new Error('Invalid phone number format');
      }

      console.log(`📤 Sending WhatsApp message to: ${phoneNumber}`);
      console.log(`   Chat ID: ${chatId}`);
      console.log(`   Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);

      // Send message
      const result = await this.client.sendMessage(chatId, message);

      // Update last message time
      this.lastMessageTime = Date.now();

      console.log(`✅ WhatsApp message sent successfully`);
      console.log(`   Message ID: ${result.id._serialized}`);
      console.log(`   Timestamp: ${result.timestamp}`);

      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp,
        chatId: chatId,
        phoneNumber: phoneNumber
      };

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Get client status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      ready: this.isReady,
      connected: this.client && this.isReady
    };
  }

  /**
   * Destroy client
   */
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.isInitialized = false;
      this.initPromise = null;
      console.log('🔌 WhatsApp client destroyed');
    }
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

// Initialize on module load
whatsappService.initialize().catch(err => {
  console.error('Failed to initialize WhatsApp service on load:', err.message);
});

module.exports = whatsappService;
