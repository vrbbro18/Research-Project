const fs = require('fs');
const path = require('path');
const dbService = require('../services/database.service');

const data = {
  exportedAt: new Date().toISOString(),
  detections: dbService.getDetections(),
  accidents: dbService.getAccidents(),
  notifications: dbService.getNotifications(),
  statistics: dbService.getStatistics(),
  accidentCount: dbService.getAccidentCount()
};

const exportPath = path.join(__dirname, '..', 'database-export.json');

fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          DATABASE EXPORT COMPLETE                        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`✅ Data exported to: ${exportPath}`);
console.log(`\n📊 Summary:`);
console.log(`   - Detections: ${data.detections.length} records`);
console.log(`   - Accidents: ${data.accidents.length} records`);
console.log(`   - Notifications: ${data.notifications.length} records`);
console.log(`   - Export Time: ${new Date(data.exportedAt).toLocaleString()}`);
console.log(`\n💡 You can now open database-export.json to view all data\n`);

