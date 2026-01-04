// Driver Lookup Service
// Handles relational data retrieval between vehicles and drivers
// Simulates JOIN operations in a relational database

const drivers = require('../data/drivers');
const vehicles = require('../data/vehicles');

/**
 * Find driver information by vehicle number
 * Simulates a JOIN operation: vehicles JOIN drivers ON vehicles.driverId = drivers.driverId
 * @param {string} vehicleNumber - The vehicle number to lookup
 * @returns {Object|null} Driver information object with name and phoneNumber, or null if not found
 */
const getDriverByVehicleNumber = (vehicleNumber) => {
  // Step 1: Find the vehicle record
  const vehicle = vehicles.find(v => v.vehicleNumber === vehicleNumber);
  
  if (!vehicle) {
    return null; // Vehicle not found
  }

  // Step 2: Use the driverId from vehicle to find the driver
  const driver = drivers.find(d => d.driverId === vehicle.driverId);
  
  if (!driver) {
    return null; // Driver not found (data inconsistency)
  }

  // Step 3: Return driver information
  return {
    driverId: driver.driverId,
    name: driver.name,
    phoneNumber: driver.phoneNumber,
    vehicleNumber: vehicleNumber
  };
};

/**
 * Get all vehicles for a specific driver
 * @param {string} driverId - The driver ID to lookup
 * @returns {Array} Array of vehicle numbers owned by the driver
 */
const getVehiclesByDriverId = (driverId) => {
  const driverVehicles = vehicles.filter(v => v.driverId === driverId);
  return driverVehicles.map(v => v.vehicleNumber);
};

/**
 * Get complete driver information with all their vehicles
 * @param {string} driverId - The driver ID to lookup
 * @returns {Object|null} Driver object with vehicles array, or null if not found
 */
const getDriverWithVehicles = (driverId) => {
  const driver = drivers.find(d => d.driverId === driverId);
  
  if (!driver) {
    return null;
  }

  const vehicleNumbers = getVehiclesByDriverId(driverId);

  return {
    driverId: driver.driverId,
    name: driver.name,
    phoneNumber: driver.phoneNumber,
    vehicles: vehicleNumbers
  };
};

/**
 * Validate if a vehicle number exists
 * @param {string} vehicleNumber - The vehicle number to validate
 * @returns {boolean} True if vehicle exists, false otherwise
 */
const vehicleExists = (vehicleNumber) => {
  return vehicles.some(v => v.vehicleNumber === vehicleNumber);
};

module.exports = {
  getDriverByVehicleNumber,
  getVehiclesByDriverId,
  getDriverWithVehicles,
  vehicleExists
};


