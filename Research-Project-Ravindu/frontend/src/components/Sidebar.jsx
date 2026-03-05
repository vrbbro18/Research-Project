import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen }) {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      icon: '🏠',
      label: 'Dashboard',
      description: 'Command center overview'
    },
    {
      path: '/driver-risk',
      icon: '🚗',
      label: 'Driver Risk Detection',
      description: 'Upload & analyze images'
    },
    {
      path: '/accident-history',
      icon: '📊',
      label: 'Accident History',
      description: 'View all records'
    },
    {
      path: '/analytics',
      icon: '📈',
      label: 'Analytics & Reports',
      description: 'Statistics & insights'
    },
    {
      path: '/predictive-analytics',
      icon: '🎯',
      label: 'Predictive Policing',
      description: 'Future violation analysis'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'System Settings',
      description: 'Configuration'
    }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🚨</span>
          <div className="logo-text">
            <h2>Driver Risk</h2>
            <p>Detection System</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>System Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

