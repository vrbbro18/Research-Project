import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminData } from '../services/api';

const Admin = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await getAdminData(userRole);
      if (response.success) {
        setAdminData(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          <span>←</span> Back
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Admin Settings</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Role: <strong>{userRole}</strong></span>
          <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
          <button onClick={onLogout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </div>

      {loading && <p>Loading admin data...</p>}
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>Error: {error}</div>}

      {!loading && !error && adminData && (
        <div>
          <div style={{ backgroundColor: '#f0f0f0', padding: '20px', borderRadius: '4px', marginBottom: '20px' }}>
            <h2>System Overview</h2>
            <p><strong>Total Users:</strong> {adminData.totalUsers}</p>
            <p><strong>System Status:</strong> {adminData.systemStatus}</p>
            <p><strong>Permissions:</strong> {adminData.permissions.join(', ')}</p>
          </div>

          <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px', border: '1px solid #ffc107' }}>
            <h3>⚠️ Admin Only Access</h3>
            <p>This page is restricted to SUPER_ADMIN role only.</p>
            <p>You have full system access to manage users, settings, and configurations.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

