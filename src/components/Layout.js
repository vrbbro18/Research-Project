import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, userRole, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060a14', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <Sidebar userRole={userRole} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{
        marginLeft: collapsed ? '72px' : '260px',
        flex: 1,
        minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
