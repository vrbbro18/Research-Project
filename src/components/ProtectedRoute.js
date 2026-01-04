import React from 'react';
import { Navigate, Link } from 'react-router-dom';

const ProtectedRoute = ({ children, userRole, allowedRoles }) => {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <div style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '100px auto',
        backgroundColor: '#fff',
        border: '3px solid #dc3545',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '72px',
            marginBottom: '20px'
          }}>🚫</div>
          <h1 style={{
            color: '#dc3545',
            fontSize: '32px',
            marginBottom: '10px'
          }}>ACCESS DENIED</h1>
        </div>
        
        <div style={{
          backgroundColor: '#f8d7da',
          padding: '20px',
          borderRadius: '4px',
          marginBottom: '30px',
          border: '1px solid #f5c6cb'
        }}>
          <p style={{
            fontSize: '18px',
            marginBottom: '15px',
            fontWeight: 'bold'
          }}>
            You do not have permission to access this page.
          </p>
          <div style={{
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '15px'
          }}>
            <p><strong>Your Role:</strong> <span style={{
              color: '#dc3545',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>{userRole}</span></p>
            <p style={{ marginTop: '10px' }}>
              <strong>Required Role(s):</strong> {allowedRoles.join(', ')}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          {userRole === 'ANALYST' ? (
            <Link
              to="/charts"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Return to Charts
            </Link>
          ) : (
            <Link
              to="/dashboard"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Return to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

