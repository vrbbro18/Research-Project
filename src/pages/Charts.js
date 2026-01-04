import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getViolations } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ userRole, onLogout }) => {
  const navigate = useNavigate();
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

  // Process violations data for bar chart by violation type
  const processViolationsByType = () => {
    const typeCounts = {};
    
    violations.forEach((violation) => {
      const type = violation.violationType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Violations',
          data: data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Process violations data for line chart over time
  const processViolationsOverTime = () => {
    // Sort violations by timestamp
    const sortedViolations = [...violations].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Group by hour
    const timeGroups = {};
    
    sortedViolations.forEach((violation) => {
      const date = new Date(violation.timestamp);
      const hour = date.getHours();
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = 0;
      }
      timeGroups[timeKey] += 1;
    });

    const labels = Object.keys(timeGroups).sort();
    const data = labels.map(label => timeGroups[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Violations Count',
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Violation Count by Violation Type',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Violations Over Time',
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const barChartData = processViolationsByType();
  const lineChartData = processViolationsOverTime();

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        >
          <span>←</span> Back
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Charts & Analytics</h1>
        <div>
          <span style={{ marginRight: '20px' }}>Role: <strong>{userRole}</strong></span>
          {userRole !== 'ANALYST' && (
            <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
          )}
          <button onClick={onLogout} style={{ padding: '8px 16px' }}>
            Logout
          </button>
        </div>
      </div>
      
      {userRole === 'ANALYST' && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '4px',
          border: '2px solid #ffc107',
          marginBottom: '20px'
        }}>
          <strong>⚠️ Restricted Access:</strong> As an ANALYST, you can only access the Charts page.
        </div>
      )}

      {loading && <p>Loading violations data...</p>}
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>Error: {error}</div>}

      {!loading && !error && violations.length > 0 && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button onClick={fetchViolations} style={{ padding: '8px 16px', marginRight: '10px' }}>
              Refresh Data
            </button>
            <span style={{ color: '#666' }}>
              Total Violations: {violations.length}
            </span>
          </div>

          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>

          <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </>
      )}

      {!loading && !error && violations.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>No violations data available.</p>
        </div>
      )}
    </div>
  );
};

export default Charts;
