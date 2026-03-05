import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Violations from './pages/Violations';
import Charts from './pages/Charts';
import Admin from './pages/Admin';
import DriverScoring from './pages/DriverScoring';
import VehicleTracking from './pages/VehicleTracking';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedUser = localStorage.getItem('username');
    if (storedRole) { setUserRole(storedRole); setUsername(storedUser); }
  }, []);

  const handleLogin = (role, user) => {
    setUserRole(role);
    setUsername(user);
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', user || role);
  };

  const handleLogout = () => {
    setUserRole(null);
    setUsername(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
  };

  const defaultRedirect = userRole === 'ANALYST' ? '/charts' : '/dashboard';

  const protect = (element, roles) => (
    <ProtectedRoute userRole={userRole} allowedRoles={roles}>{element}</ProtectedRoute>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={userRole ? <Navigate to={defaultRedirect} replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/dashboard"  element={protect(<Dashboard     userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN', 'OFFICER'])} />
        <Route path="/violations" element={protect(<Violations    userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN', 'OFFICER'])} />
        <Route path="/charts"     element={protect(<Charts        userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN', 'OFFICER', 'ANALYST'])} />
        <Route path="/admin"      element={protect(<Admin         userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN'])} />
        <Route path="/scoreboard" element={protect(<DriverScoring userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN', 'OFFICER', 'ANALYST'])} />
        <Route path="/vehicles"   element={protect(<VehicleTracking userRole={userRole} onLogout={handleLogout} />, ['SUPER_ADMIN', 'OFFICER', 'ANALYST'])} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
