import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ userRole, onLogout, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState('main');

  const isActive = (path) => location.pathname === path;

  const navSections = [
    {
      id: 'main',
      label: 'MAIN',
      items: [
        { path: '/dashboard', icon: '⬡', label: 'Dashboard', roles: ['SUPER_ADMIN', 'OFFICER'] },
        { path: '/charts', icon: '◈', label: 'Analytics', roles: ['SUPER_ADMIN', 'OFFICER', 'ANALYST'] },
      ]
    },
    {
      id: 'enforcement',
      label: 'ENFORCEMENT',
      items: [
        { path: '/violations', icon: '⚠', label: 'Violations', badge: null, roles: ['SUPER_ADMIN', 'OFFICER'] },
        { path: '/vehicles', icon: '◉', label: 'Vehicle Tracking', roles: ['SUPER_ADMIN', 'OFFICER', 'ANALYST'] },
      ]
    },
    {
      id: 'intelligence',
      label: 'INTELLIGENCE',
      items: [
        { path: '/scoreboard', icon: '◆', label: 'Driver Scoring', roles: ['SUPER_ADMIN', 'OFFICER', 'ANALYST'] },
      ]
    },
    {
      id: 'system',
      label: 'SYSTEM',
      items: [
        { path: '/admin', icon: '◎', label: 'Admin Panel', roles: ['SUPER_ADMIN'] },
      ]
    },
  ];

  const styles = {
    sidebar: {
      width: collapsed ? '72px' : '260px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1117 50%, #0a0e1a 100%)',
      borderRight: '1px solid rgba(56, 189, 248, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 100,
      overflowX: 'hidden',
      boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
    },
    logo: {
      padding: collapsed ? '24px 16px' : '24px 20px',
      borderBottom: '1px solid rgba(56, 189, 248, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      minHeight: '80px',
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0,
      boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
    },
    logoText: {
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.2s ease',
      whiteSpace: 'nowrap',
    },
    logoTitle: {
      fontSize: '13px',
      fontWeight: '800',
      color: '#f1f5f9',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    logoSub: {
      fontSize: '10px',
      color: '#38bdf8',
      letterSpacing: '2px',
      fontWeight: '600',
    },
    nav: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '12px 0',
    },
    sectionLabel: {
      fontSize: '9px',
      fontWeight: '700',
      letterSpacing: '2px',
      color: '#475569',
      padding: collapsed ? '16px 0 8px 0' : '16px 20px 8px 20px',
      textAlign: collapsed ? 'center' : 'left',
      textTransform: 'uppercase',
      transition: 'all 0.3s ease',
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: collapsed ? '12px 16px' : '11px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
      background: active
        ? 'linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.02) 100%)'
        : 'transparent',
      margin: '2px 8px',
      borderRadius: active ? '0 8px 8px 0' : '0 8px 8px 0',
      position: 'relative',
      overflow: 'hidden',
    }),
    navIcon: (active) => ({
      fontSize: '18px',
      width: '24px',
      textAlign: 'center',
      flexShrink: 0,
      color: active ? '#38bdf8' : '#64748b',
      transition: 'color 0.2s ease',
      filter: active ? 'drop-shadow(0 0 6px rgba(56,189,248,0.7))' : 'none',
    }),
    navLabel: (active) => ({
      fontSize: '13px',
      fontWeight: active ? '600' : '500',
      color: active ? '#e2e8f0' : '#94a3b8',
      whiteSpace: 'nowrap',
      opacity: collapsed ? 0 : 1,
      transition: 'opacity 0.2s ease',
    }),
    activeGlow: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '4px',
      height: '60%',
      background: 'linear-gradient(180deg, #38bdf8, #818cf8)',
      borderRadius: '2px 0 0 2px',
      opacity: 0.6,
    },
    userSection: {
      padding: collapsed ? '16px 12px' : '16px 16px',
      borderTop: '1px solid rgba(56, 189, 248, 0.1)',
      background: 'rgba(15, 23, 42, 0.5)',
    },
    userCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: collapsed ? '10px 4px' : '10px 12px',
      background: 'rgba(56, 189, 248, 0.06)',
      borderRadius: '10px',
      border: '1px solid rgba(56, 189, 248, 0.12)',
      marginBottom: '8px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: userRole === 'SUPER_ADMIN'
        ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
        : userRole === 'OFFICER'
          ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
          : 'linear-gradient(135deg, #10b981, #3b82f6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      flexShrink: 0,
      boxShadow: '0 0 12px rgba(56,189,248,0.2)',
    },
    collapseBtn: {
      position: 'absolute',
      top: '24px',
      right: '-12px',
      width: '24px',
      height: '24px',
      background: 'linear-gradient(135deg, #1e2d3d, #0f172a)',
      border: '1px solid rgba(56,189,248,0.3)',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      color: '#38bdf8',
      transition: 'all 0.2s ease',
      zIndex: 101,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }
  };

  return (
    <div style={styles.sidebar}>
      {/* Collapse Toggle */}
      <button
        style={styles.collapseBtn}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #38bdf8, #818cf8)'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1e2d3d, #0f172a)'; e.currentTarget.style.color = '#38bdf8'; }}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Logo */}
      <div style={styles.logo} onClick={() => navigate('/dashboard')}>
        <div style={styles.logoIcon}>🛡️</div>
        <div style={styles.logoText}>
          <div style={styles.logoTitle}>TrafficIQ</div>
          <div style={styles.logoSub}>Police Command</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navSections.map(section => {
          const accessibleItems = section.items.filter(item => item.roles.includes(userRole));
          if (accessibleItems.length === 0) return null;

          return (
            <div key={section.id}>
              {!collapsed && <div style={styles.sectionLabel}>{section.label}</div>}
              {collapsed && <div style={{ height: '8px' }} />}
              {accessibleItems.map(item => {
                const active = isActive(item.path);
                return (
                  <div
                    key={item.path}
                    style={styles.navItem(active)}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : ''}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'rgba(56,189,248,0.06)';
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={styles.navIcon(active)}>{item.icon}</span>
                    <span style={styles.navLabel(active)}>{item.label}</span>
                    {active && <div style={styles.activeGlow} />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={styles.userSection}>
        <div style={styles.userCard}>
          <div style={styles.avatar}>
            {userRole === 'SUPER_ADMIN' ? '★' : userRole === 'OFFICER' ? '⚑' : '◈'}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                {userRole === 'SUPER_ADMIN' ? 'Super Admin' : userRole === 'OFFICER' ? 'Police Officer' : 'Analyst'}
              </div>
              <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '500' }}>
                {userRole === 'SUPER_ADMIN' ? 'Full Access' : userRole === 'OFFICER' ? 'Enforcement Access' : 'Read Only'}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: collapsed ? '10px 4px' : '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
            transition: 'all 0.2s ease',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
          }}
        >
          <span>⏻</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
