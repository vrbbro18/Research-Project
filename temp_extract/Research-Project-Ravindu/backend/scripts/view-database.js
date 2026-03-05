const dbService = require('../services/database.service');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          DATABASE CONTENTS VIEWER                      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Detections
const detections = dbService.getDetections();
console.log(`📊 DETECTIONS: ${detections.length} records`);
if (detections.length > 0) {
  console.log('   Sample (first 3):');
  detections.slice(0, 3).forEach((d, i) => {
    console.log(`   ${i + 1}. ID: ${d.id}`);
    console.log(`      Risk: ${d.riskLevel} | Category: ${d.category} | Confidence: ${(d.confidence * 100).toFixed(1)}%`);
    console.log(`      Time: ${new Date(d.timestamp).toLocaleString()}`);
  });
} else {
  console.log('   No detections found');
}

// Accidents
const accidents = dbService.getAccidents();
console.log(`\n🚨 ACCIDENTS: ${accidents.length} records`);
if (accidents.length > 0) {
  console.log('   Sample (first 3):');
  accidents.slice(0, 3).forEach((a, i) => {
    console.log(`   ${i + 1}. ID: ${a.accidentId}`);
    console.log(`      Vehicle: ${a.vehicleNo || 'N/A'} | Risk: ${a.riskLevel}`);
    console.log(`      Time: ${new Date(a.timestamp).toLocaleString()}`);
    console.log(`      Alert Sent: ${a.alertSent ? 'Yes' : 'No'}`);
  });
} else {
  console.log('   No accidents found');
}

// Notifications
const notifications = dbService.getNotifications();
console.log(`\n🔔 NOTIFICATIONS: ${notifications.length} records`);
if (notifications.length > 0) {
  console.log('   Sample (first 3):');
  notifications.slice(0, 3).forEach((n, i) => {
    console.log(`   ${i + 1}. ID: ${n.id}`);
    console.log(`      Type: ${n.type} | Severity: ${n.severity}`);
    console.log(`      Message: ${n.message.substring(0, 50)}...`);
    console.log(`      Time: ${new Date(n.timestamp).toLocaleString()}`);
  });
} else {
  console.log('   No notifications found');
}

// Statistics
const stats = dbService.getStatistics();
console.log('\n📈 STATISTICS:');
console.log(`   Total Detections: ${stats.total}`);
console.log(`   By Risk Level:`);
console.log(`      - High: ${stats.byRiskLevel.high}`);
console.log(`      - Medium: ${stats.byRiskLevel.medium}`);
console.log(`      - Low: ${stats.byRiskLevel.low}`);
console.log(`   By Category:`);
console.log(`      - Normal: ${stats.byCategory.normal}`);
console.log(`      - Abnormal: ${stats.byCategory.abnormal}`);
console.log(`      - Unresponsive: ${stats.byCategory.unresponsive}`);
console.log(`   Average Confidence: ${(stats.averageConfidence * 100).toFixed(1)}%`);
console.log(`   Last 24 Hours: ${stats.last24Hours}`);

// Accident Count
const accidentCount = dbService.getAccidentCount();
console.log(`\n   Total Accidents: ${accidentCount}`);

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  To export data, run: node scripts/export-data.js      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

