import React, { useState } from 'react';
import { login } from '../services/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(username, password);
      if (response.success) {
        onLogin(response.role);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.03) 35px, rgba(59, 130, 246, 0.03) 70px)
        `,
        pointerEvents: 'none'
      }}></div>

      {/* Glowing Orbs */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>

      {/* Login Card */}
      <div style={{
        backgroundColor: '#1a1f2e',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        zIndex: 1,
        border: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        {/* Logo/Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            position: 'relative'
          }}>
            <span style={{
              fontSize: '45px',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
            }}>🛡️</span>
            <div style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '20px',
              height: '20px',
              background: '#10b981',
              borderRadius: '50%',
              border: '3px solid #1a1f2e',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)'
            }}></div>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
            marginBottom: '8px'
          }}>
            Traffic Violation
          </h1>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '600',
            color: '#3b82f6',
            letterSpacing: '-0.3px',
            marginBottom: '16px'
          }}>
            Monitoring System
          </h2>
          <div style={{
            display: 'inline-block',
            padding: '8px 18px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            color: '#60a5fa',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            🔐 Secure Access Portal
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 52px',
                  fontSize: '15px',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: '#0f1419',
                  color: '#ffffff',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1), 0 0 20px rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#0f1419';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#6b7280'
              }}>👤</span>
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 52px',
                  fontSize: '18px',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'all 0.3s',
                  backgroundColor: '#0f1419',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '3px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1), 0 0 20px rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.backgroundColor = '#1a1f2e';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#0f1419';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#6b7280'
              }}>🔒</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              marginBottom: '24px',
              color: '#fca5a5',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading 
                ? 'linear-gradient(135deg, #4b5563 0%, #374151 100%)' 
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              boxShadow: loading 
                ? 'none' 
                : '0 8px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Authenticating...
              </span>
            ) : (
              '🔐 Access System'
            )}
          </button>
        </form>

        {/* Footer/Test Credentials */}
        {/* <div style={{
          marginTop: '36px',
          paddingTop: '28px',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '600',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Test Credentials
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#cbd5e1'
            }}>
              <span><strong style={{ color: '#3b82f6' }}>SUPER_ADMIN:</strong></span>
              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>admin / admin123</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#cbd5e1'
            }}>
              <span><strong style={{ color: '#3b82f6' }}>OFFICER:</strong></span>
              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>officer / officer123</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#cbd5e1'
            }}>
              <span><strong style={{ color: '#3b82f6' }}>ANALYST:</strong></span>
              <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>analyst / analyst123</span>
            </div>
          </div>
        </div> */}

        {/* Security Notice */}
        <div style={{
          marginTop: '28px',
          padding: '14px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '12px',
          color: '#6ee7b7',
          textAlign: 'center'
        }}>
          <strong>🔒 Secure Connection:</strong> All communications are encrypted and monitored.
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
