const API_BASE_URL = 'http://localhost:3001';

// Login API
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

// Get violations
export const getViolations = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/violations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch violations');
  }
  return data;
};

// Get charts data
export const getCharts = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/charts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch charts');
  }
  return data;
};

// Get admin data
export const getAdminData = async (userRole) => {
  const response = await fetch(`${API_BASE_URL}/admin`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch admin data');
  }
  return data;
};

// Send WhatsApp alert to driver
export const sendAlert = async (userRole, vehicleNumber) => {
  const response = await fetch(`${API_BASE_URL}/send-alert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': userRole,
    },
    body: JSON.stringify({ vehicleNumber }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send alert');
  }
  return data;
};

