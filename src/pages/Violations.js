import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getViolations, sendAlert } from '../services/api';

const Violations = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingAlert, setSendingAlert] = useState(null); // Track which vehicle alert is being sent
  const [alertSuccess, setAlertSuccess] = useState(null); // Track successful alert

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await getViolations(userRole);
      if (response.success) {
        setViolations(response.violations);
      }
    } catch (err) {
      setError(err.message || 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAlert = async (vehicleNumber) => {
    try {
      setSendingAlert(vehicleNumber);
      setAlertSuccess(null);
      const response = await sendAlert(userRole, vehicleNumber);
      
      if (response.success) {
        setAlertSuccess({
          vehicleNumber: vehicleNumber,
          driverName: response.summary.driverName,
          alertLevel: response.summary.alertLevel
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setAlertSuccess(null);
        }, 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send alert');
      // Clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setSendingAlert(null);
    }
  };

  const getAlertStyle = (alertLevel) => {
    switch (alertLevel) {
      case 'CRITICAL':
        return { backgroundColor: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: '4px' };
      case 'WARNING':
        return { backgroundColor: '#ffc107', color: 'black', padding: '4px 8px', borderRadius: '4px' };
      default:
        return { backgroundColor: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px' };
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
        <h1>Traffic Violations</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Role: <strong>{userRole}</strong></span>
          <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
          <button onClick={onLogout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Success Popup */}
      {alertSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                WhatsApp Alert Sent Successfully
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Alert sent to {alertSuccess.driverName} ({alertSuccess.vehicleNumber})
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Alert Level: {alertSuccess.alertLevel}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading violations...</p>}
      {error && <div style={{ color: 'red', marginBottom: '20px', padding: '12px', backgroundColor: '#fee', borderRadius: '4px' }}>Error: {error}</div>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <p>Total Violations: {violations.length}</p>
            <button onClick={fetchViolations} style={{ padding: '8px 16px' }}>
              Refresh
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Vehicle Number</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Violation Type</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Violation Count</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Alert Level</th>
                {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                  <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {violations.map((violation) => (
                <tr key={violation.id}>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{violation.id}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{violation.vehicleNumber}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{violation.violationType}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {new Date(violation.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{violation.violationCount}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={getAlertStyle(violation.alertLevel)}>
                      {violation.alertLevel}
                    </span>
                  </td>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleSendAlert(violation.vehicleNumber)}
                        disabled={sendingAlert === violation.vehicleNumber}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: sendingAlert === violation.vehicleNumber ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: sendingAlert === violation.vehicleNumber ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (sendingAlert !== violation.vehicleNumber) {
                            e.currentTarget.style.backgroundColor = '#218838';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (sendingAlert !== violation.vehicleNumber) {
                            e.currentTarget.style.backgroundColor = '#28a745';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {sendingAlert === violation.vehicleNumber ? (
                          <>
                            <span style={{
                              display: 'inline-block',
                              width: '12px',
                              height: '12px',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: 'white',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite'
                            }}></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <span>📱</span>
                            Send WhatsApp Alert
                          </>
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Violations;
