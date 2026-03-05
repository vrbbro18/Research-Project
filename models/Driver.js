const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  driverId:       { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  phoneNumber:    { type: String },
  fcmToken:       { type: String },
  rating:         { type: Number, default: 100 },
  licenseNumber:  { type: String },
  licenseClass:   { type: String, enum: ['A', 'B', 'C', 'D'], default: 'B' },
  address:        { type: String },
  yearsLicensed:  { type: Number, default: 0 },
  status:         { type: String, enum: ['Active', 'Flagged', 'Suspended'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Driver', DriverSchema);
