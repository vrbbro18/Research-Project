import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AccidentSimulation from './pages/AccidentSimulation';
import AccidentHistory from './pages/AccidentHistory';
import Analytics from './pages/Analytics';
import PredictionDashboard from './pages/PredictionDashboard';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="App">
        <Sidebar isOpen={sidebarOpen} />
        <Navbar onMenuClick={toggleSidebar} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/driver-risk" element={<AccidentSimulation />} />
            <Route path="/accident-history" element={<AccidentHistory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/predictive-analytics" element={<PredictionDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

