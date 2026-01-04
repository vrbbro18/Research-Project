// Alert Decision Module
// Separated service layer for alert calculation logic
// This module handles all alert decision rules independently from controllers

/**
 * Calculate alert level based on violation count for SPEED violations
 * @param {number} violationCount - The current violation count for a vehicle
 * @returns {string} Alert level: 'NORMAL', 'WARNING', or 'CRITICAL'
 */
const calculateSpeedAlertLevel = (violationCount) => {
  if (violationCount >= 5) {
    return 'CRITICAL';
  } else if (violationCount >= 3) {
    return 'WARNING';
  }
  return 'NORMAL';
};

/**
 * Calculate alert level based on violation count (generic method)
 * Uses the same rules as speed violations for backward compatibility
 * @param {number} violationCount - The current violation count
 * @returns {string} Alert level: 'NORMAL', 'WARNING', or 'CRITICAL'
 */
const calculateAlertLevel = (violationCount) => {
  return calculateSpeedAlertLevel(violationCount);
};

/**
 * Get alert message based on alert level
 * @param {string} alertLevel - The alert level ('NORMAL', 'WARNING', 'CRITICAL')
 * @param {number} violationCount - Optional violation count for detailed messages
 * @returns {string} Human-readable alert message
 */
const getAlertMessage = (alertLevel, violationCount = null) => {
  switch (alertLevel) {
    case 'CRITICAL':
      return violationCount !== null
        ? `CRITICAL: Vehicle has ${violationCount} violations (5+ required for CRITICAL)`
        : 'CRITICAL: Vehicle has 5+ violations';
    case 'WARNING':
      return violationCount !== null
        ? `WARNING: Vehicle has ${violationCount} violations (3+ required for WARNING)`
        : 'WARNING: Vehicle has 3+ violations';
    default:
      return violationCount !== null
        ? `Normal status: ${violationCount} violations`
        : 'Normal status';
  }
};

/**
 * Calculate alert status for a vehicle based on its violation count
 * @param {number} violationCount - The current violation count for the vehicle
 * @returns {Object} Alert status object with level and message
 */
const calculateAlertStatus = (violationCount) => {
  const alertLevel = calculateSpeedAlertLevel(violationCount);
  const message = getAlertMessage(alertLevel, violationCount);

  return {
    alertLevel,
    message,
    violationCount
  };
};

/**
 * Count SPEED violations for a specific vehicle
 * @param {Array} violations - Array of all violations
 * @param {string} vehicleNumber - Vehicle number to count violations for
 * @returns {number} Count of SPEED violations for the vehicle
 */
const countSpeedViolations = (violations, vehicleNumber) => {
  return violations.filter(v => 
    v.vehicleNumber === vehicleNumber && v.violationType === 'Speeding'
  ).length;
};

/**
 * Get current violation count for a vehicle (all violation types)
 * @param {Array} violations - Array of all violations
 * @param {string} vehicleNumber - Vehicle number to count violations for
 * @returns {number} Maximum violation count for the vehicle
 */
const getCurrentViolationCount = (violations, vehicleNumber) => {
  const vehicleViolations = violations.filter(v => v.vehicleNumber === vehicleNumber);
  return vehicleViolations.length > 0
    ? Math.max(...vehicleViolations.map(v => v.violationCount))
    : 0;
};

/**
 * Get alert status for a vehicle based on SPEED violations only
 * @param {Array} violations - Array of all violations
 * @param {string} vehicleNumber - Vehicle number to check
 * @returns {Object} Alert status for SPEED violations
 */
const getSpeedAlertStatus = (violations, vehicleNumber) => {
  const speedViolationCount = countSpeedViolations(violations, vehicleNumber);
  return calculateAlertStatus(speedViolationCount);
};

module.exports = {
  calculateSpeedAlertLevel,
  calculateAlertLevel,
  getAlertMessage,
  calculateAlertStatus,
  countSpeedViolations,
  getCurrentViolationCount,
  getSpeedAlertStatus
};


