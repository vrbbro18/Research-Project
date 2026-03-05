import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getViolations } from '../services/api';
import Layout from '../components/Layout';
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
    <Layout userRole={userRole} onLogout={onLogout}>
    <div style={{ padding: '28px', minHeight: '100vh', background: 'linear-gradient(135deg, #060a14 0%, #0d1117 100%)', color: '#e2e8f0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
          ◈ Analytics
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', margin: 0 }}>
          Violation trends and distribution charts
          {userRole === 'ANALYST' && <span style={{ marginLeft: '12px', color: '#f59e0b', fontWeight: '600' }}>⚑ Read-only access</span>}
        </p>
      </div>


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
    </Layout>
  );
};

export default Charts;
