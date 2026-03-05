import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AccidentHistory.css';

function AccidentHistory() {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'LOW', 'MEDIUM', 'HIGH'

  // Load accident history from backend
  useEffect(() => {
    loadAccidentHistory();
  }, []);

  const loadAccidentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/accident/history', {
        params: {
          limit: 100 // Get up to 100 records
        }
      });
      
      setAccidents(response.data.accidents || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load accident history';
      setError(errorMessage);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter accidents by risk level
  const filteredAccidents = filter === 'all' 
    ? accidents 
    : accidents.filter(acc => acc.riskLevel === filter);

  // Get risk level badge class
  const getRiskLevelClass = (riskLevel) => {
    const level = (riskLevel || '').toUpperCase();
    switch (level) {
      case 'LOW':
        return 'risk-badge low';
      case 'MEDIUM':
        return 'risk-badge medium';
      case 'HIGH':
        return 'risk-badge high';
      default:
        return 'risk-badge';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get statistics
  const stats = {
    total: accidents.length,
    low: accidents.filter(a => a.riskLevel === 'LOW').length,
    medium: accidents.filter(a => a.riskLevel === 'MEDIUM').length,
    high: accidents.filter(a => a.riskLevel === 'HIGH').length
  };

  return (
    <div className="accident-history">
      <div className="page-header">
        <h2>Accident History</h2>
        <p className="subtitle">
          View all accident and incident records
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card low">
          <div className="stat-value">{stats.low}</div>
          <div className="stat-label">Low Risk</div>
        </div>
        <div className="stat-card medium">
          <div className="stat-value">{stats.medium}</div>
          <div className="stat-label">Medium Risk</div>
        </div>
        <div className="stat-card high">
          <div className="stat-value">{stats.high}</div>
          <div className="stat-label">High Risk</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-container">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-button ${filter === 'LOW' ? 'active' : ''}`}
          onClick={() => setFilter('LOW')}
        >
          Low Risk
        </button>
        <button
          className={`filter-button ${filter === 'MEDIUM' ? 'active' : ''}`}
          onClick={() => setFilter('MEDIUM')}
        >
          Medium Risk
        </button>
        <button
          className={`filter-button ${filter === 'HIGH' ? 'active' : ''}`}
          onClick={() => setFilter('HIGH')}
        >
          High Risk
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={loadAccidentHistory} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading accident history...</p>
        </div>
      )}

      {/* Accident Records Table */}
      {!loading && !error && (
        <div className="history-container">
          {filteredAccidents.length === 0 ? (
            <div className="empty-state">
              <p>No accident records found</p>
              {filter !== 'all' && (
                <button
                  className="clear-filter-button"
                  onClick={() => setFilter('all')}
                >
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="accidents-table">
              <table>
                <thead>
                  <tr>
                    <th>Accident ID</th>
                    <th>Vehicle No</th>
                    <th>Risk Level</th>
                    <th>GPS Location</th>
                    <th>Alert Sent</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccidents.map((accident) => {
                    const isHighRisk = accident.riskLevel === 'HIGH';
                    return (
                    <tr key={accident.accidentId} className={isHighRisk ? 'high-risk-row' : ''}>
                      <td className="accident-id-cell">
                        {accident.accidentId}
                      </td>
                      <td className="vehicle-no-cell">
                        <strong>{accident.vehicleNo}</strong>
                      </td>
                      <td>
                        <span className={getRiskLevelClass(accident.riskLevel)}>
                          {accident.riskLevel}
                        </span>
                      </td>
                      <td className="gps-cell">
                        <div className="gps-coordinates">
                          <span className="lat">
                            {accident.gpsLocation?.latitude?.toFixed(4)}
                          </span>
                          <span className="separator">,</span>
                          <span className="lng">
                            {accident.gpsLocation?.longitude?.toFixed(4)}
                          </span>
                        </div>
                        {accident.gpsLocation?.address && (
                          <div className="gps-address">
                            {accident.gpsLocation.address}
                          </div>
                        )}
                      </td>
                      <td className="alert-cell">
                        {(() => {
                          const alertWasSent = accident.alertSent === true || accident.notificationStatus?.triggered === true;
                          return alertWasSent ? (
                            <span className="alert-badge sent">
                              ✓ Sent
                            </span>
                          ) : (
                            <span className="alert-badge not-sent">
                              — Not Sent
                            </span>
                          );
                        })()}
                      </td>
                      <td className="timestamp-cell">
                        {formatTimestamp(accident.timestamp)}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Refresh Button */}
          <div className="actions-container">
            <button
              onClick={loadAccidentHistory}
              className="refresh-button"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccidentHistory;

