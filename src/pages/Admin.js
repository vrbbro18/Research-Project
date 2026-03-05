import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getAdminData } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUptime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return [h > 0 && `${h}h`, m > 0 && `${m}m`, `${sec}s`].filter(Boolean).join(' ');
};
const fmtAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  return `${Math.floor(diff/3600)}h ago`;
};
const roleColor = { SUPER_ADMIN: '#818cf8', OFFICER: '#f59e0b', ANALYST: '#10b981' };
const roleBg    = { SUPER_ADMIN: 'rgba(129,140,248,0.12)', OFFICER: 'rgba(245,158,11,0.12)', ANALYST: 'rgba(16,185,129,0.12)' };
const roleBorder= { SUPER_ADMIN: 'rgba(129,140,248,0.3)', OFFICER: 'rgba(245,158,11,0.3)', ANALYST: 'rgba(16,185,129,0.3)' };
const statusCfg = {
  Online:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  dot: '#10b981' },
  Warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  Offline: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   dot: '#ef4444' },
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, color, children, style = {} }) => (
  <div style={{ background: 'rgba(10,14,26,0.8)', border: `1px solid ${color}20`, borderRadius: '16px', padding: '22px', backdropFilter: 'blur(10px)', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '12px', borderBottom: `1px solid ${color}15` }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</span>
    </div>
    {children}
  </div>
);

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const Tile = ({ label, value, color, sub }) => (
  <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: '12px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: '900', color, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: '#64748b' }}>{sub}</div>}
  </div>
);

// ─── RFID Status Dot ─────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const cfg = statusCfg[status] || statusCfg.Offline;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}`, animation: status === 'Online' ? 'pulse 2s infinite' : 'none' }} />
      <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.color }}>{status.toUpperCase()}</span>
    </div>
  );
};

// ─── Admin Page ───────────────────────────────────────────────────────────────
const Admin = ({ userRole, onLogout }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [rfidFilter, setRfidFilter] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminData(userRole);
      if (res.success) setData(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [userRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '⬡' },
    { id: 'rfid',     label: 'RFID Readers', icon: '◉' },
    { id: 'users',    label: 'User Management', icon: '◈' },
    { id: 'thresholds', label: 'Speed Thresholds', icon: '▲' },
    { id: 'health',   label: 'System Health', icon: '◆' },
  ];

  const s = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #060a14 0%, #0a0f1e 100%)', padding: '28px', color: '#e2e8f0', fontFamily: "'Inter','Segoe UI',sans-serif" },
    tabBtn: (active) => ({
      padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
      background: active ? 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(129,140,248,0.15))' : 'transparent',
      color: active ? '#38bdf8' : '#64748b',
      outline: active ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
    }),
    tableHeader: { padding: '10px 14px', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', background: 'rgba(15,23,42,0.5)', borderBottom: '1px solid rgba(56,189,248,0.08)' },
    tableCell: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'middle' },
  };

  return (
    <Layout userRole={userRole} onLogout={onLogout}>
      <div style={s.page}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 60%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              ◎ System Administration
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '500' }}>Highway Speed Monitoring — SUPER_ADMIN Console</p>
          </div>
          <button onClick={fetchData} style={{ padding: '9px 18px', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.35)', borderRadius: '10px', color: '#818cf8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px' }}>
            ↺ REFRESH
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'rgba(10,14,26,0.6)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.08)', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} style={s.tabBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
              <span style={{ marginRight: '6px' }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Error / Loading ── */}
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#f87171', marginBottom: '20px' }}>⚠ {error}</div>}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '20px' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px' }}>
              <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(129,140,248,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ color: '#818cf8', fontWeight: '700', fontSize: '13px', letterSpacing: '3px' }}>LOADING SYSTEM DATA...</div>
          </div>
        )}

        {!loading && data && (() => {
          const { stats, speedThresholds, rfidCheckpoints, systemUsers, systemHealth } = data;

          // ── TAB: OVERVIEW ─────────────────────────────────────────────────
          if (activeTab === 'overview') return (
            <>
              {/* KPI grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <Tile label="Total Violations" value={stats.totalViolations} color="#38bdf8" sub={`${stats.todayViolations} today`} />
                <Tile label="High Speed >120" value={stats.highSpeed}        color="#ef4444" />
                <Tile label="Medium 101-120"  value={stats.mediumSpeed}      color="#f97316" />
                <Tile label="Alerts Sent"     value={stats.alertsSent}       color="#10b981" sub="Mobile notifications" />
                <Tile label="Total Drivers"   value={stats.totalDrivers}     color="#818cf8" />
                <Tile label="Vehicles"        value={stats.totalVehicles}    color="#38bdf8" />
                <Tile label="Suspended"       value={stats.suspendedDrivers} color="#ef4444" sub="drivers" />
                <Tile label="Flagged"         value={stats.flaggedDrivers}   color="#f59e0b" sub="drivers" />
                <Tile label="Critical Score"  value={stats.criticalDrivers}  color="#ef4444" sub="score < 40" />
              </div>

              {/* Summary 2-col */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* RFID Summary */}
                <SectionCard title="RFID Network Summary" icon="◉" color="#38bdf8">
                  {Object.entries(
                    rfidCheckpoints.reduce((acc, r) => { acc[r.highway] = (acc[r.highway] || []); acc[r.highway].push(r); return acc; }, {})
                  ).map(([highway, readers]) => (
                    <div key={highway} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', letterSpacing: '0.5px' }}>{highway}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {readers.map(r => {
                          const cfg = statusCfg[r.status];
                          return (
                            <div key={r.id} style={{ padding: '4px 10px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '8px', fontSize: '11px', color: cfg.color, fontFamily: 'monospace', fontWeight: '700' }}>
                              {r.id}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(15,23,42,0.5)', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.08)', display: 'flex', gap: '18px' }}>
                    {[
                      { label: 'Online',  count: rfidCheckpoints.filter(r => r.status === 'Online').length,  color: '#10b981' },
                      { label: 'Warning', count: rfidCheckpoints.filter(r => r.status === 'Warning').length, color: '#f59e0b' },
                      { label: 'Offline', count: rfidCheckpoints.filter(r => r.status === 'Offline').length, color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: s.color }}>{s.count}</div>
                        <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Quick System Health */}
                <SectionCard title="System Health" icon="◆" color="#10b981">
                  {[
                    { label: 'API Server',    value: systemHealth.apiStatus, ok: systemHealth.apiStatus === 'Operational' },
                    { label: 'Database',      value: systemHealth.dbStatus,  ok: systemHealth.dbStatus === 'Connected' },
                    { label: 'Uptime',        value: fmtUptime(systemHealth.uptime), ok: true },
                    { label: 'Node.js',       value: systemHealth.nodeVersion, ok: true },
                    { label: 'Heap Used',     value: `${systemHealth.memoryUsedMB} MB / ${systemHealth.memoryTotalMB} MB`, ok: true },
                    { label: 'Platform',      value: systemHealth.cpuPlatform, ok: true },
                    { label: 'Server Time',   value: new Date(systemHealth.serverTime).toLocaleTimeString(), ok: true },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{item.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: item.ok ? '#10b981' : '#ef4444', fontFamily: ['Uptime','Node.js','Server Time','Platform'].includes(item.label) ? 'monospace' : 'inherit' }}>{item.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>Memory Usage</span>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>{Math.round((systemHealth.memoryUsedMB / systemHealth.memoryTotalMB) * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((systemHealth.memoryUsedMB / systemHealth.memoryTotalMB) * 100)}%`, background: 'linear-gradient(90deg,#10b981,#38bdf8)', borderRadius: '3px' }} />
                    </div>
                  </div>
                </SectionCard>
              </div>
            </>
          );

          // ── TAB: RFID READERS ─────────────────────────────────────────────
          if (activeTab === 'rfid') {
            const highways = [...new Set(rfidCheckpoints.map(r => r.highway))];
            const filtered = rfidFilter === 'All' ? rfidCheckpoints : rfidCheckpoints.filter(r => r.status === rfidFilter);
            return (
              <div>
                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  {['All', 'Online', 'Warning', 'Offline'].map(f => (
                    <button key={f} onClick={() => setRfidFilter(f)} style={{
                      padding: '7px 16px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                      borderColor: rfidFilter === f ? (statusCfg[f]?.border || 'rgba(56,189,248,0.4)') : 'rgba(56,189,248,0.1)',
                      background: rfidFilter === f ? (statusCfg[f]?.bg || 'rgba(56,189,248,0.12)') : 'transparent',
                      color: rfidFilter === f ? (statusCfg[f]?.color || '#38bdf8') : '#64748b',
                    }}>
                      {f} {f !== 'All' && `(${rfidCheckpoints.filter(r => r.status === f).length})`}
                    </button>
                  ))}
                </div>

                {/* Group by highway */}
                {highways.map(highway => {
                  const readers = filtered.filter(r => r.highway === highway);
                  if (readers.length === 0) return null;
                  return (
                    <div key={highway} style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', padding: '0 4px' }}>{highway}</div>
                      <div style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              {['Reader ID', 'Location', 'Km Mark', 'Status', 'Last Ping'].map(h => (
                                <th key={h} style={s.tableHeader}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {readers.map(r => {
                              const cfg = statusCfg[r.status];
                              return (
                                <tr key={r.id}
                                  style={{ transition: 'background 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.04)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <td style={s.tableCell}>
                                    <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#38bdf8', fontSize: '14px' }}>{r.id}</span>
                                  </td>
                                  <td style={s.tableCell}><span style={{ color: '#e2e8f0', fontWeight: '600' }}>{r.location}</span></td>
                                  <td style={s.tableCell}><span style={{ color: '#64748b', fontFamily: 'monospace' }}>KM {r.km}</span></td>
                                  <td style={s.tableCell}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px' }}>
                                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: cfg.dot, animation: r.status === 'Online' ? 'pulse 2s infinite' : 'none' }} />
                                      <span style={{ color: cfg.color, fontSize: '11px', fontWeight: '800' }}>{r.status}</span>
                                    </span>
                                  </td>
                                  <td style={s.tableCell}>
                                    <span style={{ fontSize: '12px', color: r.status === 'Offline' ? '#ef4444' : r.status === 'Warning' ? '#f59e0b' : '#64748b', fontWeight: '600' }}>
                                      {fmtAgo(r.lastPing)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          // ── TAB: USER MANAGEMENT ──────────────────────────────────────────
          if (activeTab === 'users') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {systemUsers.map(user => (
                <div key={user.username} style={{ background: 'rgba(10,14,26,0.8)', border: `1px solid ${roleBorder[user.role]}`, borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${roleColor[user.role]}, ${roleColor[user.role]}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white', flexShrink: 0, boxShadow: `0 4px 16px ${roleColor[user.role]}30` }}>
                    {user.role === 'SUPER_ADMIN' ? '★' : user.role === 'OFFICER' ? '⚑' : '◈'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#f1f5f9', marginBottom: '4px' }}>
                      @{user.username}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ padding: '3px 12px', background: roleBg[user.role], border: `1px solid ${roleBorder[user.role]}`, borderRadius: '20px', color: roleColor[user.role], fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>
                        {user.role}
                      </span>
                      <span style={{ fontSize: '12px', color: '#475569' }}>Last login: {fmtAgo(user.lastLogin)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>{user.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Access Scope</div>
                    {user.role === 'SUPER_ADMIN' && ['Dashboard', 'Violations', 'Vehicles', 'Scoring', 'Analytics', 'Admin'].map(p => (
                      <span key={p} style={{ padding: '2px 10px', background: 'rgba(129,140,248,0.1)', borderRadius: '6px', fontSize: '11px', color: '#818cf8', fontWeight: '600' }}>{p}</span>
                    ))}
                    {user.role === 'OFFICER' && ['Dashboard', 'Violations', 'Vehicles', 'Scoring', 'Analytics'].map(p => (
                      <span key={p} style={{ padding: '2px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>{p}</span>
                    ))}
                    {user.role === 'ANALYST' && ['Analytics', 'Vehicles', 'Scoring'].map(p => (
                      <span key={p} style={{ padding: '2px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', fontSize: '11px', color: '#10b981', fontWeight: '600' }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Info notice */}
              <div style={{ padding: '14px 20px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
                ℹ️ User accounts are managed via <code style={{ color: '#38bdf8', fontSize: '12px' }}>data/users.js</code>. To add new users, edit that file and restart the server.
              </div>
            </div>
          );

          // ── TAB: SPEED THRESHOLDS ─────────────────────────────────────────
          if (activeTab === 'thresholds') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Thresholds */}
              {[
                {
                  key: 'safe', label: 'Safe Zone', icon: '✦', color: '#10b981',
                  desc: 'Vehicles below this speed are within the highway speed limit. No violation recorded.',
                  rules: [`Max speed: ${speedThresholds.safe.max} km/h`, 'No violation recorded', 'No penalty', 'No alert sent'],
                },
                {
                  key: 'medium', label: 'Warning Zone', icon: '◈', color: '#f59e0b',
                  desc: 'Vehicles exceeding 100 km/h but within 120 km/h. Violation recorded with minor penalty.',
                  rules: [`Range: ${speedThresholds.medium.min}–${speedThresholds.medium.max} km/h`, 'Violation recorded in DB', `Driver rating deducted: -${speedThresholds.medium.deduction} points`, 'No mobile alert sent'],
                },
                {
                  key: 'high', label: 'Critical Zone', icon: '⚡', color: '#ef4444',
                  desc: 'Vehicles exceeding 120 km/h. Immediate mobile alert sent to driver, heavy penalty applied.',
                  rules: [`Min speed: ${speedThresholds.high.min} km/h`, 'Violation recorded in DB', `Driver rating deducted: -${speedThresholds.high.deduction} points`, 'Mobile push notification sent 📱', 'Vehicle flagged for review'],
                },
              ].map(t => (
                <div key={t.key} style={{ background: `${t.color}08`, border: `1px solid ${t.color}25`, borderRadius: '16px', padding: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `linear-gradient(135deg, ${t.color}30, ${t.color}15)`, border: `1px solid ${t.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>
                    {t.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: t.color, marginBottom: '6px' }}>{t.label}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: 1.6 }}>{t.desc}</div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {t.rules.map((rule, i) => (
                        <span key={i} style={{ padding: '4px 12px', background: `${t.color}12`, border: `1px solid ${t.color}25`, borderRadius: '8px', fontSize: '12px', color: t.color, fontWeight: '600' }}>
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Speed visual ruler */}
              <div style={{ background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Speed Zone Ruler (km/h)</div>
                <div style={{ position: 'relative', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', marginBottom: '8px' }}>
                  <div style={{ position: 'absolute', left: 0, width: `${(100/200)*100}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#10b98155)' }} title="Safe: 0–100 km/h" />
                  <div style={{ position: 'absolute', left: `${(100/200)*100}%`, width: `${(20/200)*100}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#f59e0b88)' }} title="Medium: 101–120 km/h" />
                  <div style={{ position: 'absolute', left: `${(120/200)*100}%`, right: 0, height: '100%', background: 'linear-gradient(90deg,#ef4444,#dc2626)' }} title="High: 121+ km/h" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
                  {[0, 50, 100, 120, 150, 200].map(v => <span key={v}>{v}</span>)}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                  {[{ color: '#10b981', label: 'Safe (0–100)' }, { color: '#f59e0b', label: 'Medium (101–120)' }, { color: '#ef4444', label: 'Critical (121+)' }].map(z => (
                    <span key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: z.color, display: 'inline-block' }} />{z.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );

          // ── TAB: SYSTEM HEALTH ────────────────────────────────────────────
          if (activeTab === 'health') return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Server Stats */}
              <SectionCard title="Server Runtime" icon="◆" color="#10b981">
                {[
                  { label: 'Process Uptime',  value: fmtUptime(systemHealth.uptime),    color: '#10b981' },
                  { label: 'Node.js Version', value: systemHealth.nodeVersion,           color: '#38bdf8' },
                  { label: 'Platform',        value: systemHealth.cpuPlatform,           color: '#64748b' },
                  { label: 'Heap Used',       value: `${systemHealth.memoryUsedMB} MB`,  color: '#818cf8' },
                  { label: 'Heap Total',      value: `${systemHealth.memoryTotalMB} MB`, color: '#818cf8' },
                  { label: 'Server Time',     value: new Date(systemHealth.serverTime).toLocaleString(), color: '#64748b' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>{item.label}</span>
                    <span style={{ color: item.color, fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}>{item.value}</span>
                  </div>
                ))}
              </SectionCard>

              {/* Service Status */}
              <SectionCard title="Service Status" icon="◉" color="#38bdf8">
                {[
                  { name: 'HTTP API Server',      status: 'Operational', port: '3002', color: '#10b981' },
                  { name: 'MongoDB Database',      status: systemHealth.dbStatus === 'Connected' ? 'Connected' : 'Disconnected', port: '27017', color: systemHealth.dbStatus === 'Connected' ? '#10b981' : '#ef4444' },
                  { name: 'RFID Event Processor',  status: 'Active', port: '—', color: '#10b981' },
                  { name: 'Mobile Alert Service',  status: 'Active', port: '—', color: '#10b981' },
                  { name: 'Speed Analysis Engine', status: 'Active', port: '—', color: '#10b981' },
                  { name: 'React Frontend',        status: 'Running', port: '3000', color: '#10b981' },
                ].map(svc => (
                  <div key={svc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0' }}>{svc.name}</div>
                      {svc.port !== '—' && <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>:{svc.port}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: `${svc.color}12`, border: `1px solid ${svc.color}30`, borderRadius: '20px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: svc.color, animation: svc.color === '#10b981' ? 'pulse 2s infinite' : 'none' }} />
                      <span style={{ color: svc.color, fontSize: '11px', fontWeight: '800' }}>{svc.status}</span>
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* Memory chart */}
              <SectionCard title="Memory Usage" icon="▲" color="#818cf8" style={{ gridColumn: '1 / -1' }}>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Heap Usage</span>
                    <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: '700' }}>{systemHealth.memoryUsedMB} MB / {systemHealth.memoryTotalMB} MB ({Math.round((systemHealth.memoryUsedMB / systemHealth.memoryTotalMB) * 100)}%)</span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((systemHealth.memoryUsedMB / systemHealth.memoryTotalMB) * 100)}%`, background: 'linear-gradient(90deg,#818cf8,#38bdf8)', borderRadius: '5px', transition: 'width 1s ease', boxShadow: '0 0 8px rgba(129,140,248,0.4)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Heap Used',     value: `${systemHealth.memoryUsedMB} MB`,  pct: Math.round((systemHealth.memoryUsedMB / systemHealth.memoryTotalMB) * 100), color: '#818cf8' },
                    { label: 'Heap Total',    value: `${systemHealth.memoryTotalMB} MB`,  pct: 100, color: '#475569' },
                    { label: 'Available',     value: `${systemHealth.memoryTotalMB - systemHealth.memoryUsedMB} MB`, pct: Math.round(((systemHealth.memoryTotalMB - systemHealth.memoryUsedMB) / systemHealth.memoryTotalMB) * 100), color: '#10b981' },
                  ].map(m => (
                    <div key={m.label} style={{ background: `${m.color}10`, border: `1px solid ${m.color}20`, borderRadius: '10px', padding: '14px' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{m.pct}% of heap</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          );

          return null;
        })()}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          ::-webkit-scrollbar { width:4px }
          ::-webkit-scrollbar-thumb { background:rgba(129,140,248,0.3); border-radius:2px }
        `}</style>
      </div>
    </Layout>
  );
};

export default Admin;
