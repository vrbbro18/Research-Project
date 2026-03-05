const API_BASE_URL = 'http://localhost:3002';

const headers = (userRole) => ({
  'Content-Type': 'application/json',
  'x-user-role': userRole,
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// Auth
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(response);
};

// Violations
export const getViolations = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/violations`, { headers: headers(userRole) });
  return handleResponse(response);
};

export const createViolation = async (userRole, violationData) => {
  const response = await fetch(`${API_BASE_URL}/violations`, {
    method: 'POST',
    headers: headers(userRole),
    body: JSON.stringify(violationData),
  });
  return handleResponse(response);
};

// Charts
export const getCharts = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/charts`, { headers: headers(userRole) });
  return handleResponse(response);
};

// Admin
export const getAdminData = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/admin`, { headers: headers(userRole) });
  return handleResponse(response);
};

// Dashboard Stats
export const getDashboardStats = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`, { headers: headers(userRole) });
  return handleResponse(response);
};

// Alert
export const sendAlert = async (userRole, vehicleNumber) => {
  const response = await fetch(`${API_BASE_URL}/send-alert`, {
    method: 'POST',
    headers: headers(userRole),
    body: JSON.stringify({ vehicleNumber }),
  });
  return handleResponse(response);
};

// Scoreboard / Driver Scoring
export const getScoreboard = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/scoreboard`, { headers: headers(userRole) });
  return handleResponse(response);
};

// Vehicle Tracking
export const getVehicles = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/vehicles`, { headers: headers(userRole) });
  return handleResponse(response);
};

export const getVehicleDetail = async (userRole, vehicleNumber) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleNumber}`, { headers: headers(userRole) });
  return handleResponse(response);
};

export const updateVehicleStatus = async (userRole, vehicleNumber, status) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleNumber}/status`, {
    method: 'PATCH',
    headers: headers(userRole),
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
};
