const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
  vehicleNumber:  { type: String, required: true },
  violationType:  { type: String, required: true, default: 'Speeding' },
  speed:          { type: Number },
  speedCategory:  { type: String, enum: ['Low', 'Medium', 'High', null] },
  checkpoint:     { type: String }, // RFID reader location e.g. "E01-KM28"
  timestamp:      { type: Date, default: Date.now },
  alertSent:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Violation', ViolationSchema);
