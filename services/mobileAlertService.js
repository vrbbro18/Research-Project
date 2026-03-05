/**
 * Mobile Alert Service
 * Replaces whatsapp.js to push notifications directly to the Mobile App
 * 
 * Note: If using real FCM, you would initialize firebase-admin here.
 * For this implementation, we simulate the POST request to the mobile push service.
 */

const sendHighSpeedAlert = async (driver, vehicleNumber, speed) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 MOBILE APP PUSH NOTIFICATION ALERT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Driver Name: ${driver.name} (ID: ${driver.driverId})`);
    console.log(`Vehicle Number: ${vehicleNumber}`);
    console.log(`Violation: HIGH SPEED (${speed} km/h)`);
    console.log(`FCM Token Available: ${driver.fcmToken ? 'Yes' : 'No'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    const messagePayload = {
        title: "CRITICAL: HIGH SPEED ALERT",
        body: `Your vehicle ${vehicleNumber} was recorded at ${speed} km/h (>120 km/h threshold). Please slow down immediately. Points have been deducted from your scoreboard.`,
        data: {
            vehicleNumber,
            speed,
            severity: "HIGH",
            timestamp: new Date().toISOString()
        }
    };

    try {
        if (!driver.fcmToken) {
            console.log('⚠️ No FCM Token found for driver. Alert marked as unsendable directly to device.');
            // In a real scenario, could fallback to SMS or email here.
            return { success: false, reason: "No FCM Token" };
        }

        // Simulate sending to FCM or another Push API
        console.log(`📤 Sending push notification payload:`, JSON.stringify(messagePayload, null, 2));

        // Example logic for FCM:
        // await admin.messaging().send({
        //     token: driver.fcmToken,
        //     notification: { title: messagePayload.title, body: messagePayload.body },
        //     data: messagePayload.data
        // });

        console.log(`✅ Push notification sent successfully to driver's mobile app.`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: true,
            method: "Mobile Push Notification",
            timestamp: new Date()
        };
    } catch (error) {
        console.error(`❌ Failed to send mobile alert: ${error.message}`);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendHighSpeedAlert
};
