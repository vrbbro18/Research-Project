// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const whatsappService = require('../services/whatsapp.service');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          WHATSAPP STATUS CHECK                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Get WhatsApp status
const status = whatsappService.getStatus();

console.log('📱 WhatsApp Connection Status:');
console.log(`   Ready: ${status.ready ? '✅ YES' : '❌ NO'}`);
console.log(`   Authenticated: ${status.authenticated ? '✅ YES' : '❌ NO'}`);
console.log(`   Contacts Configured: ${status.contactsConfigured}`);
console.log(`   Contact Numbers: ${status.contacts.length > 0 ? status.contacts.join(', ') : 'None'}\n`);

if (!status.ready) {
  console.log('❌ PROBLEM DETECTED: WhatsApp is NOT ready!\n');
  console.log('🔧 SOLUTIONS:');
  console.log('   1. Make sure the backend server is running');
  console.log('   2. Look for a QR code in the server startup logs');
  console.log('   3. Scan the QR code with your WhatsApp mobile app');
  console.log('   4. Wait for "WhatsApp client is ready!" message\n');
} else {
  console.log('✅ WhatsApp is ready and connected!\n');
  
  if (status.contactsConfigured === 0) {
    console.log('⚠️  WARNING: No emergency contacts configured!\n');
    console.log('🔧 SOLUTION:');
    console.log('   Edit backend/.env file and add:');
    console.log('   WHATSAPP_CONTACTS=94716596231\n');
  } else {
    console.log('✅ Emergency contacts are configured\n');
    
    // Test sending a message
    console.log('🧪 Testing message send...\n');
    const testNotification = {
      id: 'test-' + Date.now(),
      type: 'emergency',
      severity: 'high',
      category: 'unresponsive',
      message: '🧪 TEST MESSAGE: This is a test alert from the system',
      timestamp: new Date().toISOString()
    };
    
    whatsappService.sendEmergencyAlert(testNotification)
      .then(results => {
        console.log('\n📊 Test Results:');
        if (results.length > 0) {
          results.forEach((result, index) => {
            if (result.success) {
              console.log(`   ✅ Message ${index + 1} sent successfully to ${result.phoneNumber}`);
            } else {
              console.log(`   ❌ Message ${index + 1} failed to ${result.phoneNumber}`);
              console.log(`      Error: ${result.error}`);
            }
          });
        } else {
          console.log('   ⚠️  No results returned (check server logs for details)');
        }
        console.log('\n');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Error during test:', error.message);
        console.log('\n');
        process.exit(1);
      });
  }
}

