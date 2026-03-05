# Database Access Guide

## Current Database System

This system currently uses an **in-memory database** (JavaScript arrays) stored in `backend/services/database.service.js`. 

**Important Notes:**
- Data is stored in memory (RAM)
- Data is **lost when the server restarts**
- No persistent database file exists
- Suitable for development/testing, not production

## How to Access the Database

### 1. Through API Endpoints (Recommended)

The easiest way to access data is through the REST API endpoints:

#### Get All Detections
```bash
GET http://localhost:3001/api/detection/history
```

#### Get Detections by Risk Level
```bash
GET http://localhost:3001/api/detection/history?riskLevel=high
GET http://localhost:3001/api/detection/history?riskLevel=medium
GET http://localhost:3001/api/detection/history?riskLevel=low
```

#### Get Detection Statistics
```bash
GET http://localhost:3001/api/detection/statistics
```

#### Get All Accidents
```bash
GET http://localhost:3001/api/accident/history
```

#### Get Accidents by Risk Level
```bash
GET http://localhost:3001/api/accident/history?riskLevel=HIGH
```

#### Get All Notifications
```bash
GET http://localhost:3001/api/notifications
```

#### Get Notification Statistics
```bash
GET http://localhost:3001/api/notifications/stats
```

### 2. Using Browser/Postman

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open browser or Postman:**
   - Navigate to: `http://localhost:3001/api/detection/history`
   - Or use Postman to make GET requests

### 3. Direct Access via Database Service

You can access the database directly in Node.js:

```javascript
const dbService = require('./services/database.service');

// Get all detections
const allDetections = dbService.getDetections();

// Get high-risk detections only
const highRiskDetections = dbService.getDetections('high');

// Get detection by ID
const detection = dbService.getDetectionById('some-id');

// Get statistics
const stats = dbService.getStatistics();

// Get all accidents
const allAccidents = dbService.getAccidents();

// Get high-risk accidents
const highRiskAccidents = dbService.getAccidents('HIGH');

// Get all notifications
const allNotifications = dbService.getNotifications();

// Get accident by ID
const accident = dbService.getAccidentById('accident-id');
```

### 4. Create a Database Viewer Script

Create a file `backend/scripts/view-database.js`:

```javascript
const dbService = require('../services/database.service');

console.log('\n=== DATABASE CONTENTS ===\n');

// Detections
const detections = dbService.getDetections();
console.log(`📊 Detections: ${detections.length} records`);
console.log('Sample:', detections.slice(0, 3));

// Accidents
const accidents = dbService.getAccidents();
console.log(`\n🚨 Accidents: ${accidents.length} records`);
console.log('Sample:', accidents.slice(0, 3));

// Notifications
const notifications = dbService.getNotifications();
console.log(`\n🔔 Notifications: ${notifications.length} records`);
console.log('Sample:', notifications.slice(0, 3));

// Statistics
const stats = dbService.getStatistics();
console.log('\n📈 Statistics:');
console.log(JSON.stringify(stats, null, 2));
```

Run it:
```bash
node backend/scripts/view-database.js
```

## Data Structure

### Detection Record
```javascript
{
  id: "uuid",
  riskLevel: "high" | "medium" | "low",
  category: "normal" | "abnormal" | "unresponsive",
  confidence: 0.0-1.0,
  timestamp: "ISO date string",
  path: "/uploads/image.jpg"
}
```

### Accident Record
```javascript
{
  accidentId: "uuid",
  vehicleNo: "WP-ABC-1234",
  riskLevel: "HIGH" | "MEDIUM" | "LOW",
  timestamp: "ISO date string",
  imagePath: "/uploads/accident.jpg",
  gpsLocation: {
    latitude: 6.9271,
    longitude: 79.8612
  },
  alertSent: true/false
}
```

### Notification Record
```javascript
{
  id: "uuid",
  type: "emergency" | "warning" | "info",
  severity: "high" | "medium" | "low",
  category: "unresponsive" | "abnormal",
  message: "Alert message",
  timestamp: "ISO date string",
  status: "sent",
  metadata: {
    confidence: 0.85,
    imagePath: "/uploads/image.jpg"
  }
}
```

## Exporting Data

### Export to JSON File

Create `backend/scripts/export-data.js`:

```javascript
const fs = require('fs');
const dbService = require('../services/database.service');

const data = {
  detections: dbService.getDetections(),
  accidents: dbService.getAccidents(),
  notifications: dbService.getNotifications(),
  statistics: dbService.getStatistics(),
  exportedAt: new Date().toISOString()
};

fs.writeFileSync(
  'database-export.json',
  JSON.stringify(data, null, 2)
);

console.log('✅ Data exported to database-export.json');
console.log(`📊 Exported ${data.detections.length} detections`);
console.log(`🚨 Exported ${data.accidents.length} accidents`);
console.log(`🔔 Exported ${data.notifications.length} notifications`);
```

Run:
```bash
node backend/scripts/export-data.js
```

## Upgrading to a Real Database

For production use, consider migrating to:

### Option 1: SQLite (Simple, File-based)
```bash
npm install sqlite3
```

### Option 2: MongoDB (NoSQL, Flexible)
```bash
npm install mongoose
```

### Option 3: PostgreSQL/MySQL (Relational, Robust)
```bash
npm install pg  # PostgreSQL
# or
npm install mysql2  # MySQL
```

## Current Limitations

1. **No Persistence**: Data lost on server restart
2. **Memory Only**: Limited by available RAM
3. **No Relationships**: Simple arrays, no foreign keys
4. **No Transactions**: No rollback capability
5. **No Backup**: No automatic backup system

## Recommendations

For production:
1. Migrate to SQLite for simple persistence
2. Use MongoDB for flexible document storage
3. Use PostgreSQL for complex relational data
4. Implement data backup/export functionality
5. Add database migration scripts

## Quick Access Commands

```bash
# View all detections (using curl)
curl http://localhost:3001/api/detection/history

# View statistics
curl http://localhost:3001/api/detection/statistics

# View accidents
curl http://localhost:3001/api/accident/history

# View notifications
curl http://localhost:3001/api/notifications
```

## Need Help?

- Check `backend/routes/` for all available API endpoints
- Check `backend/services/database.service.js` for all database functions
- Use browser DevTools Network tab to see API responses
- Use Postman for testing API endpoints

