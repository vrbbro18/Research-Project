import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getViolations } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = ({ userRole, onLogout }) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchViolations();
  }, []);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await getViolations(userRole);
      if (response.success) {
        setViolations(response.violations);
      }
    } catch (err) {
      setError(err.message || 'Failed to load violations');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const total = violations.length;
    const warnings = violations.filter(v => v.alertLevel === 'WARNING').length;
    const criticals = violations.filter(v => v.alertLevel === 'CRITICAL').length;
    const normal = violations.filter(v => v.alertLevel === 'NORMAL').length;
    const avgViolationCount = violations.length > 0
      ? (violations.reduce((sum, v) => sum + v.violationCount, 0) / violations.length).toFixed(1)
      : 0;
    return { total, warnings, criticals, normal, avgViolationCount };
  };

  // Process data for charts
  const processTypeDistribution = () => {
    const typeCounts = {};
    violations.forEach((v) => {
      typeCounts[v.violationType] = (typeCounts[v.violationType] || 0) + 1;
    });
    return {
      labels: Object.keys(typeCounts),
      data: Object.values(typeCounts)
    };
  };

  const processTimeSeries = () => {
    const sorted = [...violations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const timeGroups = {};
    sorted.forEach((v) => {
      const date = new Date(v.timestamp);
      const hour = date.getHours();
      const key = `${hour.toString().padStart(2, '0')}:00`;
      timeGroups[key] = (timeGroups[key] || 0) + 1;
    });
    return {
      labels: Object.keys(timeGroups).sort(),
      data: Object.keys(timeGroups).sort().map(k => timeGroups[k])
    };
  };

  const processAlertDistribution = () => {
    const summary = calculateSummary();
    return {
      labels: ['Normal', 'Warning', 'Critical'],
      data: [summary.normal, summary.warnings, summary.criticals],
      colors: [
        'rgba(40, 167, 69, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(220, 53, 69, 0.8)'
      ]
    };
  };

  const summary = calculateSummary();
  const typeData = processTypeDistribution();
  const timeData = processTimeSeries();
  const alertData = processAlertDistribution();

  // Chart configurations
  const typeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { stepSize: 1, font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  const timeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { stepSize: 1, font: { size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  };

  const alertChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    }
  };

  const getAvailablePages = () => {
    const pages = [];
    if (userRole === 'SUPER_ADMIN') {
      pages.push({ path: '/admin', name: 'Admin Settings', icon: '⚙️' });
      pages.push({ path: '/violations', name: 'Violations', icon: '📋' });
      pages.push({ path: '/charts', name: 'Analytics', icon: '📊' });
    } else if (userRole === 'OFFICER') {
      pages.push({ path: '/violations', name: 'Violations', icon: '📋' });
      pages.push({ path: '/charts', name: 'Analytics', icon: '📊' });
    }
    return pages;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      padding: '0'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e0e6ed',
        padding: '20px 30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#1a202c',
              letterSpacing: '-0.5px'
            }}>
              Traffic Violation Monitoring
            </h1>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '14px',
              color: '#718096',
              fontWeight: '400'
            }}>
              Real-time dashboard and analytics
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: userRole === 'SUPER_ADMIN' ? '#e3f2fd' : userRole === 'OFFICER' ? '#fff3e0' : '#f3e5f5',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              color: userRole === 'SUPER_ADMIN' ? '#1976d2' : userRole === 'OFFICER' ? '#f57c00' : '#7b1fa2'
            }}>
              {userRole}
            </div>
            <button onClick={onLogout} style={{
              padding: '10px 20px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '30px'
      }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#3182ce',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '20px', color: '#718096' }}>Loading dashboard data...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#fed7d7',
            color: '#c53030',
            borderRadius: '8px',
            marginBottom: '30px',
            border: '1px solid #feb2b2'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              {/* Total Violations Card */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '28px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: 0.9,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Violations
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    lineHeight: '1'
                  }}>
                    {summary.total}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.8
                  }}>
                    All recorded violations
                  </div>
                </div>
              </div>

              {/* WARNING Alerts Card */}
              <div style={{
                background: summary.warnings > 0 
                  ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                  : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                borderRadius: '12px',
                padding: '28px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: 0.9,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Warning Alerts
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    lineHeight: '1'
                  }}>
                    {summary.warnings}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.8,
                    marginBottom: '12px'
                  }}>
                    Violations with 3+ counts
                  </div>
                  {summary.warnings > 0 && (
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ⚠️ Active
                    </div>
                  )}
                </div>
              </div>

              {/* CRITICAL Alerts Card */}
              <div style={{
                background: summary.criticals > 0
                  ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                  : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                borderRadius: '12px',
                padding: '28px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: 0.9,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Critical Alerts
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    lineHeight: '1'
                  }}>
                    {summary.criticals}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.8,
                    marginBottom: '12px'
                  }}>
                    Violations with 5+ counts
                  </div>
                  {summary.criticals > 0 && (
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      🚨 Urgent
                    </div>
                  )}
                </div>
              </div>

              {/* Average Violation Count Card */}
              <div style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '12px',
                padding: '28px',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%'
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: 0.9,
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Avg Count
                  </div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    lineHeight: '1'
                  }}>
                    {summary.avgViolationCount}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    opacity: 0.8
                  }}>
                    Average per violation
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              {/* Violations by Type Chart */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>📊</span> Violations by Type
                </div>
                <div style={{ height: '280px' }}>
                  {typeData.labels.length > 0 ? (
                    <Bar
                      data={{
                        labels: typeData.labels,
                        datasets: [{
                          label: 'Count',
                          data: typeData.data,
                          backgroundColor: [
                            'rgba(99, 102, 241, 0.8)',
                            'rgba(236, 72, 153, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(249, 115, 22, 0.8)',
                            'rgba(139, 92, 246, 0.8)'
                          ],
                          borderColor: [
                            'rgba(99, 102, 241, 1)',
                            'rgba(236, 72, 153, 1)',
                            'rgba(251, 191, 36, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(249, 115, 22, 1)',
                            'rgba(139, 92, 246, 1)'
                          ],
                          borderWidth: 2,
                          borderRadius: 6
                        }]
                      }}
                      options={typeChartOptions}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Violations Over Time Chart */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>📈</span> Violations Over Time
                </div>
                <div style={{ height: '280px' }}>
                  {timeData.labels.length > 0 ? (
                    <Line
                      data={{
                        labels: timeData.labels,
                        datasets: [{
                          label: 'Violations',
                          data: timeData.data,
                          borderColor: 'rgba(99, 102, 241, 1)',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          borderWidth: 3,
                          tension: 0.4,
                          fill: true,
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          pointBackgroundColor: '#ffffff',
                          pointBorderColor: 'rgba(99, 102, 241, 1)',
                          pointBorderWidth: 2
                        }]
                      }}
                      options={timeChartOptions}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alert Distribution Chart */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>🎯</span> Alert Distribution
                </div>
                <div style={{ height: '280px' }}>
                  {alertData.data.some(v => v > 0) ? (
                    <Doughnut
                      data={{
                        labels: alertData.labels,
                        datasets: [{
                          data: alertData.data,
                          backgroundColor: alertData.colors,
                          borderColor: '#ffffff',
                          borderWidth: 3,
                          hoverOffset: 10
                        }]
                      }}
                      options={alertChartOptions}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#718096' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a202c',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>⚡</span> Quick Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {getAvailablePages().map((page) => (
                    <Link
                      key={page.path}
                      to={page.path}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#2d3748',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                        border: '1px solid #e2e8f0'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#edf2f7';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f7fafc';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{page.icon}</span>
                      <span>{page.name}</span>
                      <span style={{ marginLeft: 'auto', color: '#718096' }}>→</span>
                    </Link>
                  ))}
                  <button
                    onClick={fetchViolations}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: '#3182ce',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <span>🔄</span>
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
