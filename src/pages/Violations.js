import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getViolations, sendAlert, createViolation } from '../services/api';

const Violations = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingAlert, setSendingAlert] = useState(null); // Track which vehicle alert is being sent
  const [alertSuccess, setAlertSuccess] = useState(null); // Track successful alert
  const [showAddForm, setShowAddForm] = useState(false); // Toggle for add violation form
  const [formData, setFormData] = useState({ vehicleNumber: '', violationType: '', timestamp: '' });
  const [addingViolation, setAddingViolation] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Available vehicles (for research/demo purposes)
  const availableVehicles = [
    'ABC-1234', 'XYZ-5678', 'DEF-9012', 'GHI-3456', 'JKL-7890',
    'MNO-2468', 'PQR-1357', 'STU-9753', 'VWX-4680', 'YZA-8024'
  ];

  // Available violation types
  const violationTypes = ['Speeding', 'Red Light', 'Parking', 'No Seatbelt', 'Illegal Turn', 'Wrong Lane'];

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

  const handleAddViolation = async (e) => {
    e.preventDefault();
    if (!formData.vehicleNumber || !formData.violationType) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setAddingViolation(true);
      setError('');
      const violationData = {
        vehicleNumber: formData.vehicleNumber,
        violationType: formData.violationType,
        timestamp: formData.timestamp || new Date().toISOString()
      };
      
      const response = await createViolation(userRole, violationData);
      
      if (response.success) {
        setAddSuccess(true);
        setFormData({ vehicleNumber: '', violationType: '', timestamp: '' });
        setShowAddForm(false);
        // Refresh violations list
        await fetchViolations();
        // Hide success message after 3 seconds
        setTimeout(() => setAddSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to add violation');
      setTimeout(() => setError(''), 5000);
    } finally {
      setAddingViolation(false);
    }
  };

  const getAlertStyle = (alertLevel) => {
    switch (alertLevel) {
      case 'CRITICAL':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        };
      case 'WARNING':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        };
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.02) 35px, rgba(59, 130, 246, 0.02) 70px)
        `,
        pointerEvents: 'none'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%)',
          borderRadius: '12px',
          padding: '20px 28px',
          marginBottom: '24px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'rgba(107, 114, 128, 0.3)',
                color: '#e2e8f0',
                border: '1px solid rgba(107, 114, 128, 0.4)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span>←</span> Back
            </button>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.3px'
              }}>
                Traffic Violations
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '8px 16px',
              background: userRole === 'SUPER_ADMIN' 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
              border: `1px solid ${userRole === 'SUPER_ADMIN' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: userRole === 'SUPER_ADMIN' ? '#93c5fd' : '#fcd34d',
              letterSpacing: '0.5px'
            }}>
              {userRole}
            </div>
            <Link 
              to="/dashboard" 
              style={{ 
                padding: '10px 18px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                color: '#93c5fd',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Dashboard
            </Link>
            <button onClick={onLogout} style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}>
              Logout
            </button>
          </div>
        </div>

        {!loading && !error && (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '500' }}>
                Total Violations: <strong>{violations.length}</strong>
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={fetchViolations} 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  🔄 Refresh
                </button>
                {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                      padding: '12px 24px',
                      background: showAddForm 
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' 
                        : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: showAddForm 
                        ? '0 4px 12px rgba(107, 114, 128, 0.3)' 
                        : '0 4px 16px rgba(59, 130, 246, 0.4)',
                      transition: 'all 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.3px'
                    }}
                    onMouseEnter={(e) => {
                      if (!showAddForm) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showAddForm) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{showAddForm ? '✕' : '➕'}</span>
                    {showAddForm ? 'Cancel' : 'Add Manual Violation'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Add Violation Form - Professional Dark Theme */}
          {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && showAddForm && (
            <div style={{
              marginBottom: '30px',
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1419 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Animated Border Glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite'
              }}></div>

              {/* Header Section */}
              <div style={{
                padding: '24px 28px',
                borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }}>
                    <span style={{ fontSize: '24px' }}>📝</span>
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      letterSpacing: '-0.3px'
                    }}>
                      Manual Violation Entry
                    </h3>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontWeight: '500'
                    }}>
                      Research & Demonstration Panel
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div style={{ padding: '28px' }}>
                <form onSubmit={handleAddViolation}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                  }}>
                    {/* Vehicle Number Field */}
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        letterSpacing: '0.3px'
                      }}>
                        <span style={{ fontSize: '18px' }}>🚗</span>
                        Vehicle Number
                        <span style={{ color: '#ef4444', fontSize: '16px' }}>*</span>
                      </label>
                      <select
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#e2e8f0',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" style={{ background: '#1a1f3a', color: '#94a3b8' }}>Select Vehicle...</option>
                        {availableVehicles.map(v => (
                          <option key={v} value={v} style={{ background: '#1a1f3a', color: '#e2e8f0' }}>{v}</option>
                        ))}
                      </select>
                    </div>

                    {/* Violation Type Field */}
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        letterSpacing: '0.3px'
                      }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        Violation Type
                        <span style={{ color: '#ef4444', fontSize: '16px' }}>*</span>
                      </label>
                      <select
                        value={formData.violationType}
                        onChange={(e) => setFormData({ ...formData, violationType: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#e2e8f0',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" style={{ background: '#1a1f3a', color: '#94a3b8' }}>Select Type...</option>
                        {violationTypes.map(type => (
                          <option key={type} value={type} style={{ background: '#1a1f3a', color: '#e2e8f0' }}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Timestamp Field */}
                    <div>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        letterSpacing: '0.3px'
                      }}>
                        <span style={{ fontSize: '18px' }}>🕐</span>
                        Timestamp
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          color: '#64748b',
                          fontWeight: '400'
                        }}>(Optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.timestamp ? new Date(formData.timestamp).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setFormData({ ...formData, timestamp: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '10px',
                          fontSize: '14px',
                          color: '#e2e8f0',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          fontFamily: 'inherit'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <small style={{
                        display: 'block',
                        marginTop: '8px',
                        color: '#64748b',
                        fontSize: '12px',
                        fontStyle: 'italic'
                      }}>
                        Leave empty to use current time
                      </small>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(59, 130, 246, 0.15)'
                  }}>
                    <button
                      type="submit"
                      disabled={addingViolation}
                      style={{
                        flex: 1,
                        padding: '14px 28px',
                        background: addingViolation
                          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: addingViolation ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        boxShadow: addingViolation
                          ? '0 4px 12px rgba(107, 114, 128, 0.3)'
                          : '0 4px 16px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        letterSpacing: '0.3px'
                      }}
                      onMouseEnter={(e) => {
                        if (!addingViolation) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!addingViolation) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
                        }
                      }}
                    >
                      {addingViolation ? (
                        <>
                          <span style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }}></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '18px' }}>✓</span>
                          Add Violation
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ vehicleNumber: '', violationType: '', timestamp: '' });
                        setError('');
                      }}
                      style={{
                        padding: '14px 28px',
                        background: 'rgba(107, 114, 128, 0.2)',
                        color: '#e2e8f0',
                        border: '2px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        letterSpacing: '0.3px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)';
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Success Message */}
                {addSuccess && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                    color: '#10b981',
                    borderRadius: '10px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    <span style={{ fontSize: '20px' }}>✓</span>
                    <span>Violation added successfully! The list has been refreshed.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            overflowX: 'auto',
            marginTop: '20px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
                  borderBottom: '2px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Number</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Violation Type</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timestamp</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Violation Count</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alert Level</th>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: '#e2e8f0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {violations.map((violation, index) => (
                  <tr 
                    key={violation.id}
                    style={{
                      borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
                      background: index % 2 === 0 ? 'transparent' : 'rgba(59, 130, 246, 0.03)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(59, 130, 246, 0.03)'}
                  >
                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>{violation.id}</td>
                    <td style={{ padding: '14px 16px', color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>{violation.vehicleNumber}</td>
                    <td style={{ padding: '14px 16px', color: '#cbd5e1', fontSize: '14px' }}>{violation.violationType}</td>
                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(violation.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#e2e8f0', fontSize: '14px', fontWeight: '600' }}>{violation.violationCount}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={getAlertStyle(violation.alertLevel)}>
                        {violation.alertLevel}
                      </span>
                    </td>
                    {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => handleSendAlert(violation.vehicleNumber)}
                          disabled={sendingAlert === violation.vehicleNumber}
                          style={{
                            padding: '10px 18px',
                            background: sendingAlert === violation.vehicleNumber 
                              ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: sendingAlert === violation.vehicleNumber ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: sendingAlert === violation.vehicleNumber 
                              ? '0 2px 8px rgba(107, 114, 128, 0.3)'
                              : '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            if (sendingAlert !== violation.vehicleNumber) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sendingAlert !== violation.vehicleNumber) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                            }
                          }}
                        >
                          {sendingAlert === violation.vehicleNumber ? (
                            <>
                              <span style={{
                                display: 'inline-block',
                                width: '14px',
                                height: '14px',
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
                              Send Alert
                            </>
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>

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
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Violations;
