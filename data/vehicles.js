// Simulated vehicle data
// Normalized vehicle information with foreign key to drivers
// This reflects a normalized database design where vehicles reference drivers
const vehicles = [
  {
    vehicleNumber: 'ABC-1234',
    driverId: 'DRV001'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'XYZ-5678',
    driverId: 'DRV002'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'DEF-9012',
    driverId: 'DRV001'  // Same driver can have multiple vehicles
  },
  {
    vehicleNumber: 'GHI-3456',
    driverId: 'DRV003'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'JKL-7890',
    driverId: 'DRV002'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'MNO-2468',
    driverId: 'DRV004'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'PQR-1357',
    driverId: 'DRV005'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'STU-9753',
    driverId: 'DRV003'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'VWX-4680',
    driverId: 'DRV004'  // Foreign key to drivers.driverId
  },
  {
    vehicleNumber: 'YZA-8024',
    driverId: 'DRV005'  // Foreign key to drivers.driverId
  }
];

module.exports = vehicles;

