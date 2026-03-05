const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  driverId:      { type: String, required: true },
  make:          { type: String },
  model:         { type: String },
  year:          { type: Number },
  color:         { type: String },
  type:          { type: String, enum: ['Sedan', 'SUV', 'Pickup', 'Hybrid', 'Van', 'Motorcycle', 'Other'], default: 'Sedan' },
  status:        { type: String, enum: ['Active', 'Flagged', 'Suspended'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
