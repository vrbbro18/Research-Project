import React, { useState } from 'react';
import './Navbar.css';

function Navbar({ onMenuClick }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="navbar-title">
            <h1>🚔 Police Command Center</h1>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-info">
            <div className="time-display">
              <span className="time-icon">🕐</span>
              <span className="time-text">{time}</span>
            </div>
            <div className="user-badge">
              <span className="user-icon">👤</span>
              <span className="user-text">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

