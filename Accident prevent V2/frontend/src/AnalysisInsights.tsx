import React from 'react';

interface AnalysisInsightsProps {
    insights: string[];
    structured?: {
        drowsiness: { status: string; description: string };
        risk: { status: string; description: string };
        trend: { status: string; description: string };
    };
    frontendEar?: number;
}

const AnalysisInsights: React.FC<AnalysisInsightsProps> = ({ insights, structured, frontendEar }) => {
    if ((!insights || insights.length === 0) && !structured && frontendEar === undefined) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICAL': case 'DANGER': case 'WORSENING': return '#e53e3e'; // Soft red
            case 'WARNING': case 'CAUTION': return '#d69e2e'; // Soft gold
            case 'GOOD': case 'MINIMAL': case 'IMPROVING': return '#38a169'; // Soft green
            default: return '#718096';
        }
    };

    const getStatusTagBg = (status: string) => {
        switch (status) {
            case 'CRITICAL': case 'DANGER': case 'WORSENING': return '#fff5f5';
            case 'WARNING': case 'CAUTION': return '#fffaf0';
            case 'GOOD': case 'MINIMAL': case 'IMPROVING': return '#f0fff4';
            default: return '#f7fafc';
        }
    };

    return (
        <div className="card shadow-sm border-0 mt-3 overflow-hidden" style={{ borderRadius: '10px' }}>
            {/* Header with smaller font */}
            <div className="card-header bg-dark text-white py-2 px-3 d-flex align-items-center">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="me-2 text-warning" viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.75c-1.03 0-1.9-.4-2.59-1.17l-.347-.35z" />
                </svg>
                <span className="mb-0 fw-bold" style={{ letterSpacing: '0.8px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Intelligent Pattern Analysis & Driver Metrics
                </span>
            </div>

            <div className="card-body p-3 bg-white">
                <div className="row g-4">
                    {/* Column 1: Performance Alerts (Existing Insights) */}
                    <div className="col-12 col-md-5 border-end pe-md-4">
                        <h6 className="text-muted fw-bold mb-3 d-flex align-items-center" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span className="me-2">📢</span> Live Security Alerts
                        </h6>
                        <div className="d-flex flex-column gap-2">
                            {/* Dual Way Local FaceLandmarker Verification Alert */}
                            {frontendEar !== undefined && frontendEar !== null && (
                                <div className="p-2 rounded d-flex align-items-start transition-all"
                                    style={{
                                        backgroundColor: frontendEar < 0.22 ? '#fff5f5' : (frontendEar > 0.26 ? '#f0fff4' : '#f7fafc'),
                                        fontSize: '0.75rem',
                                        borderLeft: `3px solid ${frontendEar < 0.22 ? '#fc8181' : (frontendEar > 0.26 ? '#68d391' : '#e2e8f0')}`,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                    }}>
                                    <span className="me-2" style={{ fontSize: '0.9rem' }}>👁️</span>
                                    <span className="text-dark-50" style={{ fontWeight: 500, lineHeight: '1.4' }}>
                                        {frontendEar < 0.22 ? (
                                            <><strong className="text-danger">Dual-Way Vision Override:</strong> Local camera explicitly detected closed eyes! (EAR: {frontendEar.toFixed(3)})</>
                                        ) : frontendEar > 0.26 ? (
                                            <><strong className="text-success">Dual-Way Vision Override:</strong> Local camera explicitly detected awake open eyes. (EAR: {frontendEar.toFixed(3)})</>
                                        ) : (
                                            <><strong className="text-secondary">Dual-Way Vision:</strong> Local camera sensing normal eye status. (EAR: {frontendEar.toFixed(3)})</>
                                        )}
                                    </span>
                                </div>
                            )}

                            {insights.map((insight, index) => {
                                const isCritical = insight.includes('🚨') || insight.includes('🛑') || insight.includes('❗');
                                return (
                                    <div key={index}
                                        className="p-2 rounded d-flex align-items-start transition-all"
                                        style={{
                                            backgroundColor: isCritical ? '#fff5f5' : '#f8f9fa',
                                            fontSize: '0.75rem',
                                            borderLeft: `3px solid ${isCritical ? '#fc8181' : '#e2e8f0'}`,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                        }}>
                                        <span className="me-2" style={{ fontSize: '0.9rem' }}>{insight.split(' ')[0]}</span>
                                        <span className="text-dark-50" style={{ fontWeight: 500, lineHeight: '1.4' }}>
                                            {insight.substring(insight.indexOf(' ') + 1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Column 2: Dashboard Summary (Chart Interpretations) */}
                    <div className="col-12 col-md-7 ps-md-4">
                        <h6 className="text-muted fw-bold mb-3 d-flex align-items-center" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <span className="me-2">📈</span> Data Interpretations
                        </h6>
                        {structured ? (
                            <div className="d-flex flex-column gap-2">
                                {[
                                    { title: 'Drowsiness Trend', data: structured.drowsiness, icon: '👤', help: 'Current alertness vs. fatigue' },
                                    { title: 'Anomalous Patterns', data: structured.risk, icon: '⚠️', help: 'Microsleeps & closing eye streaks' },
                                    { title: 'Alertness Velocity', data: structured.trend, icon: '🌊', help: 'Minute-by-minute performance change' }
                                ].map((item, i) => (
                                    <div key={i} className="p-2 border rounded-3 d-flex align-items-center"
                                        style={{ backgroundColor: getStatusTagBg(item.data.status), borderColor: '#edf2f7' }}>

                                        <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center me-3"
                                            style={{ width: '32px', height: '32px', minWidth: '32px', fontSize: '1rem' }}>
                                            {item.icon}
                                        </div>

                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="fw-bold" style={{ fontSize: '0.65rem', color: '#4a5568' }}>{item.title.toUpperCase()}</span>
                                                <span className="px-2 py-0 rounded-pill fw-bold"
                                                    style={{ backgroundColor: getStatusColor(item.data.status), color: 'white', fontSize: '0.55rem' }}>
                                                    {item.data.status}
                                                </span>
                                            </div>
                                            <div className="text-dark fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '-0.2px' }}>
                                                {item.data.description}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.6rem', fontStyle: 'italic' }}>{item.help}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted p-4 border rounded-3 border-dashed" style={{ fontSize: '0.75rem', backgroundColor: '#fcfcfc' }}>
                                Analyzing behavioral data to generate chart summaries...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .border-dashed { border-style: dashed !important; }
        .transition-all { transition: all 0.2s ease-in-out; }
        .transition-all:hover { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
      `}</style>
        </div>
    );
};

export default AnalysisInsights;
