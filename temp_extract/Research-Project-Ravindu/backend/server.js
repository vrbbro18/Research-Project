require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const detectionRoutes = require('./routes/detection.routes');
const notificationRoutes = require('./routes/notification.routes');
const accidentRoutes = require('./routes/accident.routes');
const weatherRoutes = require('./routes/weather.routes');
const videoRoutes = require('./routes/video.routes');
const mobileRoutes = require('./routes/mobile.routes');
const whatsappService = require('./services/whatsapp.service');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

app.use('/api/detection', detectionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/accident', accidentRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/mobile', mobileRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Driver Risk Detection API is running',
    timestamp: new Date().toISOString()
  });
});

const requiredDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'data'),
  path.join(__dirname, 'videos')
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

app.listen(PORT, async () => {
  console.log(`\n=== Driver Risk Detection Backend Server ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);

  // Initialize WhatsApp service
  try {
    await whatsappService.initializeWhatsApp();
  } catch (error) {
    console.error('⚠️  Failed to initialize WhatsApp service:', error.message);
    console.log('⚠️  WhatsApp alerts will not be available until service is initialized\n');
  }
});

module.exports = app;

