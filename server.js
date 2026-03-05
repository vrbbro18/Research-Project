require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://iotuser:Iot12345@cluster0.r5gxqyg.mongodb.net/rfidDB';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const violationsRoutes = require('./routes/violations');
const chartsRoutes = require('./routes/charts');
const speedRoutes = require('./routes/speed');
const driverRoutes = require('./routes/driver');
const alertRoutes = require('./routes/alert');
const scoreboardRoutes = require('./routes/scoreboard');
const vehiclesRoutes = require('./routes/vehicles');
const dashboardStatsRoutes = require('./routes/dashboardStats');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', authRoutes);

// IoT/Sensor endpoints (no authentication required)
app.use('/', speedRoutes);  // POST /speed

// Protected routes with RBAC
app.use('/admin', adminRoutes);        // SUPER_ADMIN only
app.use('/violations', violationsRoutes); // SUPER_ADMIN, OFFICER
app.use('/charts', chartsRoutes);      // SUPER_ADMIN, OFFICER, ANALYST
app.use('/driver', driverRoutes);      // SUPER_ADMIN, OFFICER
app.use('/', alertRoutes);             // POST /send-alert (SUPER_ADMIN, OFFICER)
app.use('/scoreboard', scoreboardRoutes); // SUPER_ADMIN, OFFICER, ANALYST
app.use('/vehicles', vehiclesRoutes);  // SUPER_ADMIN, OFFICER, ANALYST
app.use('/dashboard', dashboardStatsRoutes); // GET /dashboard/stats

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /login - Login with username and password');
  console.log('  GET /health - Health check');
  console.log('  POST /speed - IoT speed sensor input (vehicleNumber, speed)');
  console.log('\nProtected endpoints (require x-user-role header):');
  console.log('  GET /admin - SUPER_ADMIN only');
  console.log('  GET /violations - SUPER_ADMIN, OFFICER, ANALYST');
  console.log('  POST /violations - SUPER_ADMIN, OFFICER (add manual violation)');
  console.log('  GET /charts - SUPER_ADMIN, OFFICER, ANALYST');
  console.log('  GET /driver/:vehicleNumber - SUPER_ADMIN, OFFICER (driver lookup)');
  console.log('  POST /send-alert - SUPER_ADMIN, OFFICER (full alert workflow)');
});
