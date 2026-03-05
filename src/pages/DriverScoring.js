import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getScoreboard } from '../services/api';

const riskConfig = {
  'Safe':      { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.2)',  icon: '✦', bar: '#10b981' },
  'Moderate':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.2)', icon: '◈', bar: '#f59e0b' },
  'High Risk': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', glow: 'rgba(249,115,22,0.2)', icon: '⚠', bar: '#f97316' },
  'Critical':  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  glow: 'rgba(239,68,68,0.2)',  icon: '☢', bar: '#ef4444' },
};

const ScoreRing = ({ score }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const cfg = score >= 80 ? riskConfig['Safe'] : score >= 60 ? riskConfig['Moderate'] : score >= 40 ? riskConfig['High Risk'] : riskConfig['Critical'];

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={cfg.color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ filter: `drop-shadow(0 0 6px ${cfg.color})` }}
      />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central" fill={cfg.color} fontSize="14" fontWeight="800">{score}</text>
    </svg>
  );
};

const DriverScoring = ({ userRole, onLogout }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [sortBy, setSortBy] = useState('rank');
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => { fetchScoreboard(); }, []);

  const fetchScoreboard = async () => {
    try {
      setLoading(true);
      const res = await getScoreboard(userRole);
      if (res.success) setDrivers(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = drivers
    .filter(d => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.driverId.toLowerCase().includes(search.toLowerCase()) ||
        (d.licenseNumber || '').toLowerCase().includes(search.toLowerCase());
      const matchRisk = filterRisk === 'All' || d.riskLevel === filterRisk;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      if (sortBy === 'rank') return a.rank - b.rank;
      if (sortBy === 'score-asc') return a.rating - b.rating;
      if (sortBy === 'violations') return b.totalViolations - a.totalViolations;
      return 0;
    });

  const stats = {
    total: drivers.length,
    safe: drivers.filter(d => d.riskLevel === 'Safe').length,
    moderate: drivers.filter(d => d.riskLevel === 'Moderate').length,
    highRisk: drivers.filter(d => d.riskLevel === 'High Risk').length,
    critical: drivers.filter(d => d.riskLevel === 'Critical').length,
    avgScore: drivers.length ? Math.round(drivers.reduce((s, d) => s + d.rating, 0) / drivers.length) : 0,
  };

  const s = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #060a14 0%, #0d1117 100%)', padding: '28px', color: '#e2e8f0' },
    header: { marginBottom: '28px' },
    title: { fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '13px', color: '#64748b', fontWeight: '500' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' },
    statCard: (color, glow) => ({
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: '14px',
      padding: '16px',
      boxShadow: `0 4px 20px ${glow}`,
    }),
    controls: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' },
    input: { flex: 1, minWidth: '200px', padding: '10px 16px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' },
    select: { padding: '10px 14px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer', outline: 'none' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' },
    th: { padding: '12px 16px', fontsize: '11px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left', background: 'rgba(15,23,42,0.4)', borderBottom: '1px solid rgba(56,189,248,0.08)' },
    tr: (cfg) => ({
      background: `linear-gradient(90deg, ${cfg.bg} 0%, rgba(15,23,42,0.6) 100%)`,
      border: `1px solid ${cfg.border}`,
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
    td: { padding: '14px 16px', fontSize: '13px', verticalAlign: 'middle' },
    modal: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(6px)',
    },
    modalBox: {
      background: 'linear-gradient(135deg, #0d1117 0%, #0a0e1a 100%)',
      border: '1px solid rgba(56,189,248,0.2)',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '540px',
      width: '100%',
      boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      maxHeight: '85vh',
      overflowY: 'auto',
    },
  };

  return (
    <Layout userRole={userRole} onLogout={onLogout}>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>⬡ Driver Scoring System</h1>
          <p style={s.subtitle}>Behavioral risk analysis and compliance scoring for all registered drivers</p>
        </div>

        {/* Stats Grid */}
        <div style={s.statsGrid}>
          {[
            { label: 'Total Drivers', value: stats.total,    color: '#38bdf8', glow: 'rgba(56,189,248,0.1)' },
            { label: 'Avg Score',     value: stats.avgScore, color: '#818cf8', glow: 'rgba(129,140,248,0.1)' },
            { label: '✦ Safe',        value: stats.safe,     color: '#10b981', glow: 'rgba(16,185,129,0.1)'  },
            { label: '◈ Moderate',   value: stats.moderate, color: '#f59e0b', glow: 'rgba(245,158,11,0.1)'  },
            { label: '⚠ High Risk',   value: stats.highRisk, color: '#f97316', glow: 'rgba(249,115,22,0.1)'  },
            { label: '☢ Critical',    value: stats.critical, color: '#ef4444', glow: 'rgba(239,68,68,0.1)'   },
          ].map(stat => (
            <div key={stat.label} style={s.statCard(stat.color, stat.glow)}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color, textShadow: `0 0 16px ${stat.color}60` }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={s.controls}>
          <input
            style={s.input}
            placeholder="🔍 Search by name, ID, or license..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.select} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
            {['All', 'Safe', 'Moderate', 'High Risk', 'Critical'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select style={s.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="rank">Sort: Rank</option>
            <option value="score-asc">Sort: Lowest Score</option>
            <option value="violations">Sort: Most Violations</option>
          </select>
          <button onClick={fetchScoreboard} style={{ padding: '10px 16px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', color: '#38bdf8', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
            ↺ Refresh
          </button>
        </div>

        {/* Error */}
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px 18px', color: '#f87171', marginBottom: '16px' }}>⚠ {error}</div>}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⬡</div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Loading scoreboard...</div>
          </div>
        ) : (
          <div style={{ background: 'rgba(10,14,26,0.6)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Rank', 'Score', 'Driver', 'License', 'Violations', 'Risk Level', 'Status', 'Vehicles'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(driver => {
                  const cfg = riskConfig[driver.riskLevel] || riskConfig['Safe'];
                  return (
                    <tr key={driver.driverId}
                      style={s.tr(cfg)}
                      onClick={() => setSelectedDriver(driver)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 4px 24px ${cfg.glow}`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <td style={s.td}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: driver.rank <= 3 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(100,116,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: driver.rank <= 3 ? 'white' : '#64748b' }}>
                          {driver.rank <= 3 ? ['🥇','🥈','🥉'][driver.rank-1] : `#${driver.rank}`}
                        </div>
                      </td>
                      <td style={s.td}><ScoreRing score={driver.rating} /></td>
                      <td style={s.td}>
                        <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '14px' }}>{driver.name}</div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>{driver.driverId}</div>
                      </td>
                      <td style={s.td}><span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '12px' }}>{driver.licenseNumber || '—'}</span></td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '18px', color: driver.totalViolations > 5 ? '#ef4444' : driver.totalViolations > 2 ? '#f97316' : '#e2e8f0' }}>{driver.totalViolations}</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({driver.speedingCount} speed)</span>
                        </div>
                      </td>
                      <td style={s.td}>
                        <span style={{ padding: '5px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px', color: cfg.color, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                          {cfg.icon} {driver.riskLevel}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ padding: '4px 10px', background: driver.status === 'Active' ? 'rgba(16,185,129,0.12)' : driver.status === 'Flagged' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${driver.status === 'Active' ? 'rgba(16,185,129,0.3)' : driver.status === 'Flagged' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '20px', color: driver.status === 'Active' ? '#10b981' : driver.status === 'Flagged' ? '#f59e0b' : '#ef4444', fontSize: '11px', fontWeight: '700' }}>
                          {driver.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(driver.vehicles || []).map(v => (
                            <span key={v} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>{v}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#475569' }}>No drivers match your filters</div>
            )}
          </div>
        )}

        {/* Driver Detail Modal */}
        {selectedDriver && (() => {
          const driver = selectedDriver;
          const cfg = riskConfig[driver.riskLevel] || riskConfig['Safe'];
          return (
            <div style={s.modal} onClick={() => setSelectedDriver(null)}>
              <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9' }}>{driver.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{driver.driverId} · License: {driver.licenseNumber || 'N/A'}</div>
                  </div>
                  <button onClick={() => setSelectedDriver(null)} style={{ background: 'rgba(100,116,139,0.2)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>

                {/* Score Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '14px', marginBottom: '20px' }}>
                  <ScoreRing score={driver.rating} />
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: cfg.color, textShadow: `0 0 20px ${cfg.color}60` }}>{driver.rating}<span style={{ fontSize: '14px', fontWeight: '400', color: '#64748b' }}>/100</span></div>
                    <div style={{ fontSize: '14px', color: cfg.color, fontWeight: '700', marginTop: '4px' }}>{cfg.icon} {driver.riskLevel}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    {/* Score bar */}
                    <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${driver.rating}%`, height: '100%', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}aa)`, borderRadius: '4px', boxShadow: `0 0 8px ${cfg.color}80` }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>Compliance Score</div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Phone',       value: driver.phoneNumber || '—' },
                    { label: 'License Class', value: `Class ${driver.licenseNumber ? driver.licenseNumber[0] : '—'}` },
                    { label: 'Total Violations', value: driver.totalViolations },
                    { label: 'Speeding Violations', value: driver.speedingCount },
                    { label: 'Rank',        value: `#${driver.rank} of ${drivers.length}` },
                    { label: 'Status',      value: driver.status },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(56,189,248,0.08)', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{item.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Vehicles */}
                <div>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Registered Vehicles</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(driver.vehicles || []).length === 0 ? <span style={{ color: '#475569', fontSize: '13px' }}>None registered</span> :
                      (driver.vehicles || []).map(v => (
                        <span key={v} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: '600' }}>{v}</span>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
};

export default DriverScoring;
