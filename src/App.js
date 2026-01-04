import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Violations from './pages/Violations';
import Charts from './pages/Charts';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Load user role from localStorage on mount
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const handleLogin = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            userRole ? (
              userRole === 'ANALYST' ? (
                <Navigate to="/charts" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['SUPER_ADMIN', 'OFFICER']}>
              <Dashboard userRole={userRole} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/violations"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['SUPER_ADMIN', 'OFFICER']}>
              <Violations userRole={userRole} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/charts"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['SUPER_ADMIN', 'OFFICER', 'ANALYST']}>
              <Charts userRole={userRole} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute userRole={userRole} allowedRoles={['SUPER_ADMIN']}>
              <Admin userRole={userRole} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

