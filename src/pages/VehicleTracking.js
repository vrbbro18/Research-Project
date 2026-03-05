import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getVehicles, updateVehicleStatus } from '../services/api';

const statusConfig = {
  Active:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  icon: '●' },
  Flagged:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',  icon: '⚑' },
  Suspended: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',   icon: '⊘' },
};

const typeIcons = { Sedan: '🚗', SUV: '🚙', Pickup: '🛻', Hybrid: '⚡', Van: '🚐', Motorcycle: '🏍️', Other: '🚘' };

const VehicleTracking = ({ userRole, onLogout }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await getVehicles(userRole);
      if (res.success) setVehicles(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (vehicleNumber, newStatus) => {
    if (userRole === 'ANALYST') return;
    try {
      setUpdating(vehicleNumber);
      await updateVehicleStatus(userRole, vehicleNumber, newStatus);
      setVehicles(prev => prev.map(v => v.vehicleNumber === vehicleNumber ? { ...v, status: newStatus } : v));
      if (selected?.vehicleNumber === vehicleNumber) setSelected(prev => ({ ...prev, status: newStatus }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = vehicles.filter(v => {
    const matchSearch = v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.driverName || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.make || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchType = filterType === 'All' || v.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'Active').length,
    flagged: vehicles.filter(v => v.status === 'Flagged').length,
    suspended: vehicles.filter(v => v.status === 'Suspended').length,
    totalViolations: vehicles.reduce((s, v) => s + (v.totalViolations || 0), 0),
  };

  const s = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #060a14 0%, #0d1117 100%)', padding: '28px', color: '#e2e8f0' },
    title: { fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '24px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '24px' },
    controls: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' },
    input: { flex: 1, minWidth: '200px', padding: '10px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
    select: { padding: '10px 14px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer', outline: 'none' },
    th: { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', background: 'rgba(15,23,42,0.4)', borderBottom: '1px solid rgba(56,189,248,0.08)' },
    td: { padding: '14px 16px', fontSize: '13px', verticalAlign: 'middle' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' },
    modalBox: { background: 'linear-gradient(135deg, #0d1117 0%, #0a0e1a 100%)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '20px', padding: '32px', maxWidth: '580px', width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', maxHeight: '88vh', overflowY: 'auto' },
  };

  const VehicleGridCard = ({ v }) => {
    const cfg = statusConfig[v.status] || statusConfig.Active;
    return (
      <div
        onClick={() => setSelected(v)}
        style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(15,23,42,0.6) 100%)`, border: `1px solid ${cfg.border}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.25s ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${cfg.color}20`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span style={{ fontSize: '32px' }}>{typeIcons[v.type] || '🚘'}</span>
          <span style={{ padding: '4px 10px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px', color: cfg.color, fontSize: '11px', fontWeight: '700' }}>{cfg.icon} {v.status}</span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '1px', marginBottom: '4px' }}>{v.vehicleNumber}</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>{v.year} {v.make} {v.model} · {v.color}</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>Driver</div>
            <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>{v.driverName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>Violations</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: v.totalViolations > 5 ? '#ef4444' : v.totalViolations > 2 ? '#f97316' : '#10b981' }}>{v.totalViolations}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout userRole={userRole} onLogout={onLogout}>
      <div style={s.page}>
        <h1 style={s.title}>◉ Vehicle Tracking</h1>
        <p style={s.subtitle}>Police authority vehicle registry with status management and violation history</p>

        {/* Stats */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Vehicles',     value: stats.total,           color: '#38bdf8' },
            { label: '● Active',           value: stats.active,          color: '#10b981' },
            { label: '⚑ Flagged',         value: stats.flagged,         color: '#f59e0b' },
            { label: '⊘ Suspended',        value: stats.suspended,       color: '#ef4444' },
            { label: '⚠ Total Violations', value: stats.totalViolations, color: '#f97316' },
          ].map(stat => (
            <div key={stat.label} style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}30`, borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, textShadow: `0 0 16px ${stat.color}60` }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <input style={s.input} placeholder="🔍 Search vehicle, driver, make..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['All', 'Active', 'Flagged', 'Suspended'].map(x => <option key={x}>{x}</option>)}
          </select>
          <select style={s.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
            {['All', 'Sedan', 'SUV', 'Pickup', 'Hybrid', 'Van', 'Motorcycle'].map(x => <option key={x}>{x}</option>)}
          </select>
          <div style={{ display: 'flex', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
            {['table', 'grid'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '10px 14px', background: viewMode === mode ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.8)', border: 'none', color: viewMode === mode ? '#38bdf8' : '#64748b', cursor: 'pointer', fontSize: '16px' }}>
                {mode === 'table' ? '≡' : '⊞'}
              </button>
            ))}
          </div>
          <button onClick={fetchVehicles} style={{ padding: '10px 16px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', color: '#38bdf8', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>↺ Refresh</button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px', color: '#f87171', marginBottom: '16px' }}>⚠ {error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>◉</div>
            <div style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '2px' }}>Loading vehicles...</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map(v => <VehicleGridCard key={v.vehicleNumber} v={v} />)}
          </div>
        ) : (
          <div style={{ background: 'rgba(10,14,26,0.6)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <thead>
                <tr>{['Vehicle', 'Type', 'Details', 'Driver', 'Violations', 'Last Violation', 'Status', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const cfg = statusConfig[v.status] || statusConfig.Active;
                  return (
                    <tr key={v.vehicleNumber}
                      style={{ background: 'rgba(15,23,42,0.4)', transition: 'all 0.2s ease', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.4)'; }}
                    >
                      <td style={s.td} onClick={() => setSelected(v)}>
                        <div style={{ fontFamily: 'monospace', fontWeight: '800', color: '#38bdf8', fontSize: '14px', letterSpacing: '1px' }}>{v.vehicleNumber}</div>
                      </td>
                      <td style={s.td}><span style={{ fontSize: '20px' }} title={v.type}>{typeIcons[v.type] || '🚘'}</span></td>
                      <td style={s.td} onClick={() => setSelected(v)}>
                        <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{v.year} {v.make} {v.model}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{v.color} · {v.type}</div>
                      </td>
                      <td style={s.td} onClick={() => setSelected(v)}>
                        <div style={{ fontWeight: '600', color: '#94a3b8' }}>{v.driverName}</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>Score: {v.driverRating ?? '—'}</div>
                      </td>
                      <td style={s.td} onClick={() => setSelected(v)}>
                        <span style={{ fontWeight: '800', fontSize: '20px', color: v.totalViolations > 5 ? '#ef4444' : v.totalViolations > 2 ? '#f97316' : '#10b981' }}>{v.totalViolations}</span>
                      </td>
                      <td style={s.td} onClick={() => setSelected(v)}>
                        <div style={{ fontSize: '12px', color: v.lastViolationType ? '#94a3b8' : '#475569' }}>{v.lastViolationType || 'None'}</div>
                        {v.lastViolationDate && <div style={{ fontSize: '11px', color: '#475569' }}>{new Date(v.lastViolationDate).toLocaleDateString()}</div>}
                      </td>
                      <td style={s.td}>
                        <span style={{ padding: '5px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px', color: cfg.color, fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {cfg.icon} {v.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                          <select
                            value={v.status}
                            onChange={e => handleStatusChange(v.vehicleNumber, e.target.value)}
                            disabled={updating === v.vehicleNumber}
                            style={{ padding: '6px 10px', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer', outline: 'none' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="Active">Active</option>
                            <option value="Flagged">Flag</option>
                            <option value="Suspended">Suspend</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>No vehicles found</div>}
          </div>
        )}

        {/* Vehicle Detail Modal */}
        {selected && (() => {
          const v = selected;
          const cfg = statusConfig[v.status] || statusConfig.Active;
          return (
            <div style={s.modal} onClick={() => setSelected(null)}>
              <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '48px' }}>{typeIcons[v.type] || '🚘'}</span>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '2px' }}>{v.vehicleNumber}</div>
                      <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>{v.year} {v.make} {v.model} · {v.color}</div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'rgba(100,116,139,0.2)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>

                {/* Status Banner */}
                <div style={{ padding: '14px 20px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ color: cfg.color, fontWeight: '700', fontSize: '15px' }}>{cfg.icon} {v.status}</span>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'OFFICER') && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Active', 'Flagged', 'Suspended'].filter(s => s !== v.status).map(newStatus => {
                        const nc = statusConfig[newStatus];
                        return (
                          <button key={newStatus}
                            onClick={() => handleStatusChange(v.vehicleNumber, newStatus)}
                            disabled={updating === v.vehicleNumber}
                            style={{ padding: '6px 14px', background: nc.bg, border: `1px solid ${nc.border}`, borderRadius: '8px', color: nc.color, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                            {newStatus}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Driver',    value: v.driverName },
                    { label: 'Driver Score', value: v.driverRating !== null ? `${v.driverRating}/100` : '—' },
                    { label: 'Total Violations', value: v.totalViolations },
                    { label: 'Last Violation', value: v.lastViolationType || 'None' },
                    { label: 'Vehicle Type', value: v.type },
                    { label: 'Last Seen', value: v.lastViolationDate ? new Date(v.lastViolationDate).toLocaleString() : 'No record' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(56,189,248,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
};

export default VehicleTracking;
