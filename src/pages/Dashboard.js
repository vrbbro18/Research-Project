import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { getDashboardStats } from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

// ─── Reusable StatCard ──────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, glow, icon, pulse }) => (
  <div style={{
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    border: `1px solid ${color}35`,
    borderRadius: '16px', padding: '20px 22px',
    boxShadow: `0 4px 24px ${glow || color + '10'}`,
    position: 'relative', overflow: 'hidden',
  }}>
    {pulse && (
      <div style={{
        position: 'absolute', top: '14px', right: '14px',
        width: '10px', height: '10px', borderRadius: '50%',
        background: color, animation: 'pulse 1.8s ease-in-out infinite',
        boxShadow: `0 0 12px ${color}`,
      }} />
    )}
    <div style={{ fontSize: '22px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '34px', fontWeight: '900', color, lineHeight: 1, textShadow: `0 0 20px ${color}60`, marginBottom: '6px' }}>{value}</div>
    {sub && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{sub}</div>}
  </div>
);

// ─── Speed Badge ─────────────────────────────────────────────────────────────
const SpeedBadge = ({ cat, speed }) => {
  const cfg = cat === 'High'
    ? { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', label: '⚡ HIGH' }
    : { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: '◈ MED' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '20px', color: cfg.color, fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>
      {cfg.label} {speed && <span style={{ opacity: 0.8 }}>{speed}km/h</span>}
    </span>
  );
};

// ─── Hourly Heatmap ──────────────────────────────────────────────────────────
const HourlyHeatmap = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '3px' }}>
        {data.map((count, h) => {
          const intensity = count / max;
          const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f97316' : intensity > 0.15 ? '#f59e0b' : '#1e293b';
          return (
            <div key={h} title={`${h}:00 — ${count} events`} style={{
              height: '28px', borderRadius: '4px', background: color,
              opacity: intensity > 0 ? 0.3 + intensity * 0.7 : 0.15,
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.3)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} style={{ fontSize: '10px', color: '#475569' }}>{h}:00</span>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({ userRole, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats(userRole);
      if (res.success) { setStats(res.stats); setLastRefresh(new Date()); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [userRole]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const darkChart = {
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
      tooltip: { backgroundColor: 'rgba(10,14,26,0.95)', titleColor: '#f1f5f9', bodyColor: '#94a3b8', padding: 12, borderColor: 'rgba(56,189,248,0.2)', borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
      y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
    },
    responsive: true, maintainAspectRatio: false,
  };

  const s = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #060a14 0%, #0a0f1e 100%)', padding: '28px', color: '#e2e8f0', fontFamily: "'Inter','Segoe UI',sans-serif" },
    sectionTitle: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
    card: { background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(56,189,248,0.1)', borderRadius: '16px', padding: '22px', backdropFilter: 'blur(10px)' },
  };

  return (
    <Layout userRole={userRole} onLogout={onLogout}>
      <div style={s.page}>
        {/* ── Top Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '900', background: 'linear-gradient(135deg, #f1f5f9 0%, #38bdf8 60%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Highway Speed Monitoring
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: '500' }}>
              RFID-based real-time speed violation detection · Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>SYSTEM LIVE</span>
            </div>
            <button onClick={fetchStats} style={{ padding: '8px 16px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', color: '#38bdf8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px' }}>
              ↺ REFRESH
            </button>
          </div>
        </div>

        {/* ── Error / Loading ── */}
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#f87171', marginBottom: '20px' }}>⚠ {error}</div>}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(56,189,248,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', letterSpacing: '3px' }}>LOADING HIGHWAY DATA...</div>
          </div>
        )}

        {!loading && stats && (() => {
          const { overview, dailyCounts, speedBuckets, hotspots, hourly, topOffenders, recentCritical, latestViolations } = stats;
          return (
            <>
              {/* ── KPI Strip ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <StatCard label="Total Violations" value={overview.total}       color="#38bdf8" icon="⬡" sub={`${overview.today} today`} />
                <StatCard label="High Speed (>120)" value={overview.highSpeed}   color="#ef4444" icon="⚡" sub="Critical alerts" pulse glow="rgba(239,68,68,0.15)" />
                <StatCard label="Medium (101-120)"   value={overview.mediumSpeed} color="#f97316" icon="◈" sub="Warning zone" />
                <StatCard label="This Week"          value={overview.thisWeek}   color="#818cf8" icon="◆" sub="Last 7 days" />
                <StatCard label="Alerts Sent"        value={overview.alertsSent} color="#10b981" icon="◉" sub="Mobile notifications" />
                <StatCard label="Max Speed"          value={`${overview.maxSpeed}`} color="#f59e0b" icon="▲" sub="km/h recorded" />
                <StatCard label="Avg Speed"          value={`${overview.avgSpeed}`} color="#64748b" icon="~" sub="km/h average" />
                <StatCard label="Critical Drivers"   value={overview.criticalDrivers} color="#ef4444" icon="⚑" sub="Score < 40" />
              </div>

              {/* ── Row 1: Trend Chart + Donut ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Daily Trend */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#38bdf8' }}>◈</span> 14-Day Violation Trend</div>
                  <div style={{ height: '220px' }}>
                    <Line
                      data={{
                        labels: dailyCounts.map(d => d.label),
                        datasets: [
                          {
                            label: 'All Violations', data: dailyCounts.map(d => d.count),
                            borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.08)',
                            borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3,
                            pointBackgroundColor: '#38bdf8', pointBorderColor: '#0a0e1a', pointBorderWidth: 2,
                          },
                          {
                            label: 'High Speed', data: dailyCounts.map(d => d.highCount),
                            borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)',
                            borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3,
                            pointBackgroundColor: '#ef4444', pointBorderColor: '#0a0e1a', pointBorderWidth: 2,
                          },
                        ],
                      }}
                      options={{ ...darkChart, plugins: { ...darkChart.plugins, legend: { display: true, labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } } } }}
                    />
                  </div>
                </div>

                {/* Speed Category Donut */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#818cf8' }}>◆</span> Speed Categories</div>
                  <div style={{ height: '180px' }}>
                    <Doughnut
                      data={{
                        labels: ['Medium (101-120)', 'High (>120)'],
                        datasets: [{
                          data: [overview.mediumSpeed, overview.highSpeed],
                          backgroundColor: ['rgba(249,115,22,0.8)', 'rgba(239,68,68,0.85)'],
                          borderColor: ['#f97316', '#ef4444'], borderWidth: 2, hoverOffset: 8,
                        }],
                      }}
                      options={{ ...darkChart, cutout: '65%', plugins: { ...darkChart.plugins, legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 10 } } } }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#f1f5f9' }}>{overview.total}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TOTAL VIOLATIONS</div>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Speed Distribution + Heatmap ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Speed Bucket Bar */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#f97316' }}>⬡</span> Speed Distribution (km/h)</div>
                  <div style={{ height: '200px' }}>
                    <Bar
                      data={{
                        labels: Object.keys(speedBuckets),
                        datasets: [{
                          label: 'Violations',
                          data: Object.values(speedBuckets),
                          backgroundColor: ['rgba(56,189,248,0.7)','rgba(96,165,250,0.7)','rgba(249,115,22,0.7)','rgba(239,68,68,0.7)','rgba(239,68,68,0.85)','rgba(220,38,38,0.9)'],
                          borderColor: ['#38bdf8','#60a5fa','#f97316','#ef4444','#ef4444','#dc2626'],
                          borderWidth: 1.5, borderRadius: 6,
                        }],
                      }}
                      options={{ ...darkChart, plugins: { ...darkChart.plugins, legend: { display: false } } }}
                    />
                  </div>
                </div>

                {/* Hourly Heatmap */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#f59e0b' }}>◉</span> Activity Heatmap (by Hour)</div>
                  <HourlyHeatmap data={hourly} />
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {[['#ef4444','70%+ peak'], ['#f97316','40-70%'], ['#f59e0b','15-40%'], ['#1e293b','Low']].map(([c, l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, display: 'inline-block' }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Row 3: Hotspots + Top Offenders ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* RFID Hotspots */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#ef4444' }}>⚠</span> RFID Hotspot Checkpoints</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hotspots.map((h, i) => {
                      const maxCount = hotspots[0]?.count || 1;
                      const pct = (h.count / maxCount) * 100;
                      const colors = ['#ef4444','#f97316','#f59e0b','#38bdf8','#818cf8'];
                      return (
                        <div key={h.checkpoint}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', fontFamily: 'monospace' }}>{h.checkpoint}</span>
                            <span style={{ fontSize: '12px', color: colors[i], fontWeight: '700' }}>{h.count} events</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}aa)`, borderRadius: '3px', boxShadow: `0 0 8px ${colors[i]}60`, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Offenders */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#818cf8' }}>◆</span> Top Repeat Offenders</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {topOffenders.map((v, i) => (
                      <div key={v.vehicleNumber} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(15,23,42,0.5)', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.06)' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(100,116,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: i === 0 ? 'white' : '#64748b', flexShrink: 0 }}>
                          {i === 0 ? '⚑' : `#${i+1}`}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: '800', color: '#38bdf8', fontSize: '13px' }}>{v.vehicleNumber}</div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{v.count} violations · Last: {v.latestSpeed}km/h</div>
                        </div>
                        <SpeedBadge cat={v.speedCategory} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Row 4: Live Critical Feed + Recent Violations ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px' }}>
                {/* Critical Alerts */}
                <div style={{ ...s.card, border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={s.sectionTitle}>
                    <span style={{ color: '#ef4444', animation: 'pulse 1.5s infinite' }}>⚡</span>
                    Recent Critical Alerts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                    {recentCritical.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>No critical alerts</div>
                    ) : recentCritical.map((v, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 8px #ef4444', animation: 'pulse 2s infinite' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#38bdf8', fontSize: '13px' }}>{v.vehicleNumber}</span>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>{v.speed}<span style={{ fontSize: '10px', fontWeight: '400', color: '#64748b' }}> km/h</span></span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>📡 {v.checkpoint || 'Unknown'}</span>
                            <span>{v.alertSent ? <span style={{ color: '#10b981' }}>✓ Notified</span> : <span style={{ color: '#f59e0b' }}>⚑ Pending</span>}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Violations Table */}
                <div style={s.card}>
                  <div style={s.sectionTitle}><span style={{ color: '#38bdf8' }}>⬡</span> Latest Violation Feed</div>
                  <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          {['Vehicle', 'Speed', 'Category', 'Checkpoint', 'Time'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(10,14,26,0.9)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {latestViolations.map((v, i) => (
                          <tr key={i}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontWeight: '700', color: '#38bdf8', fontSize: '12px' }}>{v.vehicleNumber}</td>
                            <td style={{ padding: '9px 10px', fontWeight: '800', fontSize: '14px', color: v.speedCategory === 'High' ? '#ef4444' : '#f97316' }}>{v.speed}<span style={{ fontSize: '10px', color: '#64748b', fontWeight: '400' }}>km/h</span></td>
                            <td style={{ padding: '9px 10px' }}><SpeedBadge cat={v.speedCategory} /></td>
                            <td style={{ padding: '9px 10px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{v.checkpoint || '—'}</td>
                            <td style={{ padding: '9px 10px', fontSize: '11px', color: '#475569' }}>{new Date(v.timestamp).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
          @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          ::-webkit-scrollbar { width:4px; height:4px }
          ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02) }
          ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.3); border-radius:2px }
        `}</style>
      </div>
    </Layout>
  );
};

export default Dashboard;
