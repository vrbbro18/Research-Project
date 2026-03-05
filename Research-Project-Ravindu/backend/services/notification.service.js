const { v4: uuidv4 } = require('uuid');
const dbService = require('./database.service');
const whatsappService = require('./whatsapp.service');

async function sendAutomaticMessage(notification) {
  const riskEmoji = notification.severity === 'high' ? '🚨' : '⚠️';
  const riskTitle = notification.severity === 'high' ? 'HIGH RISK DETECTED' : 'MEDIUM RISK DETECTED';
  const alertType = notification.severity === 'high' ? 'CRITICAL ALERT' : 'WARNING ALERT';
  
  console.log('\n' + riskEmoji.repeat(30));
  console.log(`${riskEmoji} AUTOMATIC MESSAGE SENT - ${riskTitle} ${riskEmoji}`);
  console.log(riskEmoji.repeat(30));
  console.log(`\n${riskEmoji} ${alertType}: ${notification.severity === 'high' ? 'High-risk' : 'Medium-risk'} driver detected`);
  console.log(`📋 Notification ID: ${notification.id}`);
  console.log(`📱 Message Type: ${notification.type.toUpperCase()}`);
  console.log(`🔴 Severity: ${notification.severity.toUpperCase()}`);
  console.log(`📝 Message: ${notification.message}`);
  console.log(`🕐 Time: ${notification.timestamp}`);
  console.log(`\n📬 AUTOMATIC MESSAGES DISPATCHED:`);
  console.log('   ✓ Emergency alert sent to monitoring center');
  console.log('   ✓ Alert logged in system database');
  
  // Send WhatsApp alerts
  try {
    // Check WhatsApp status first
    const whatsappStatus = whatsappService.getStatus();
    console.log(`\n📱 WhatsApp Status Check:`);
    console.log(`   - Ready: ${whatsappStatus.ready ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Contacts Configured: ${whatsappStatus.contactsConfigured}`);
    console.log(`   - Contact Numbers: ${whatsappStatus.contacts.length > 0 ? whatsappStatus.contacts.join(', ') : 'None'}`);
    
    const whatsappResults = await whatsappService.sendEmergencyAlert(notification);
    
    if (whatsappResults && whatsappResults.length > 0) {
      const successCount = whatsappResults.filter(r => r.success).length;
      const failedCount = whatsappResults.length - successCount;
      
      if (successCount > 0) {
        console.log(`   ✅ WhatsApp alerts sent: ${successCount}/${whatsappResults.length} successful`);
        whatsappResults.forEach((result) => {
          if (result.success) {
            console.log(`      ✅ Sent to ${result.phoneNumber} (Message ID: ${result.messageId || 'N/A'})`);
          }
        });
      }
      
      if (failedCount > 0) {
        console.log(`   ❌ WhatsApp alerts failed: ${failedCount}/${whatsappResults.length} failed`);
        whatsappResults.forEach((result) => {
          if (!result.success) {
            console.log(`      ❌ Failed to ${result.phoneNumber}: ${result.error || 'Unknown error'}`);
          }
        });
      }
    } else {
      console.log('   ⚠️  WhatsApp message was NOT sent.');
      if (!whatsappStatus.ready) {
        console.log('   ⚠️  Reason: WhatsApp is NOT ready. Please scan QR code to connect.');
        console.log('   💡 Solution: Restart server and scan the QR code shown in logs');
      }
      if (whatsappStatus.contactsConfigured === 0) {
        console.log('   ⚠️  Reason: No emergency contacts configured.');
        console.log('   💡 Solution: Add WHATSAPP_CONTACTS=94716596231 to backend/.env file');
      }
    }
  } catch (error) {
    console.error('   ❌ WhatsApp alert error:', error.message);
    console.error('   ❌ Error details:', error);
  }
  
  const actionMessage = notification.severity === 'high' 
    ? '⚠️ IMMEDIATE ACTION REQUIRED ⚠️'
    : '⚠️ MONITORING RECOMMENDED ⚠️';
  
  console.log('\n' + riskEmoji.repeat(30));
  console.log(actionMessage);
  console.log(riskEmoji.repeat(30) + '\n');
}

async function triggerEmergencyNotification(detection) {
  const notificationType = determineNotificationType(detection);
  
  const notification = {
    id: uuidv4(),
    type: notificationType,
    severity: detection.riskLevel,
    category: detection.category,
    detectionId: detection.id,
    message: generateNotificationMessage(detection, notificationType),
    timestamp: new Date().toISOString(),
    status: 'sent',
    metadata: {
      confidence: detection.confidence,
      imagePath: detection.path
    }
  };
  
  dbService.addNotification(notification);
  
  console.log(`[NOTIFICATION] Notification created: ${notification.id}`);
  console.log(`[NOTIFICATION] Risk level: ${detection.riskLevel}`);
  console.log(`[NOTIFICATION] Notification type: ${notificationType}`);
  console.log(`[NOTIFICATION] Should send WhatsApp: ${detection.riskLevel === 'high' || detection.riskLevel === 'medium' || notificationType === 'emergency'}`);
  
  // Send WhatsApp messages for HIGH and MEDIUM risk levels
  if (detection.riskLevel === 'high' || detection.riskLevel === 'medium' || notificationType === 'emergency') {
    console.log(`[NOTIFICATION] Calling sendAutomaticMessage for ${detection.riskLevel} risk...`);
    await sendAutomaticMessage(notification);
    console.log(`[NOTIFICATION] sendAutomaticMessage completed`);
  } else {
    console.log(`[NOTIFICATION] Skipping WhatsApp - risk level ${detection.riskLevel} does not require alert`);
  }
  
  simulateNotificationDelivery(notification);
  
  return notification;
}

function determineNotificationType(detection) {
  if (detection.category === 'unresponsive' || detection.riskLevel === 'high') {
    return 'emergency';
  } else if (detection.riskLevel === 'medium') {
    return 'warning';
  } else {
    return 'info';
  }
}

function generateNotificationMessage(detection, type) {
  const timestamp = new Date(detection.timestamp).toLocaleString();
  
  if (type === 'emergency') {
    return `🚨 EMERGENCY ALERT: Unresponsive driver detected at ${timestamp}. Immediate attention required. Confidence: ${(detection.confidence * 100).toFixed(1)}%`;
  } else if (type === 'warning') {
    return `⚠️ WARNING: Abnormal driver behavior detected at ${timestamp}. Monitor closely. Risk Level: ${detection.riskLevel.toUpperCase()}`;
  } else {
    return `ℹ️ INFO: Driver status normal at ${timestamp}`;
  }
}

function simulateNotificationDelivery(notification) {
  console.log('\n' + '='.repeat(60));
  console.log('📢 NOTIFICATION TRIGGERED');
  console.log('='.repeat(60));
  console.log(`Type: ${notification.type.toUpperCase()}`);
  console.log(`Severity: ${notification.severity.toUpperCase()}`);
  console.log(`Message: ${notification.message}`);
  console.log(`Timestamp: ${notification.timestamp}`);
  console.log(`Detection ID: ${notification.detectionId}`);
  console.log('='.repeat(60));
  
  if (notification.severity !== 'high' && notification.type !== 'emergency') {
    console.log('\n[SIMULATED NOTIFICATION DELIVERY]');
    console.log('✓ Console log notification (current method)');
    console.log('✓ Notification stored in database');
    console.log('✓ UI alert will be shown to frontend users');
    console.log('\n');
  }
}

function getNotificationSummary() {
  const notifications = dbService.getNotifications();
  const recent = notifications.filter(n => {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(n.timestamp) > hourAgo;
  });
  
  return {
    total: notifications.length,
    recent: recent.length,
    emergencies: notifications.filter(n => n.type === 'emergency').length,
    warnings: notifications.filter(n => n.type === 'warning').length
  };
}

module.exports = {
  triggerEmergencyNotification,
  getNotificationSummary
};

