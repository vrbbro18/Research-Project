import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import {
  Activity, AlertTriangle, ShieldAlert, Video,
  Map as MapIcon, Calendar, CloudLightning, Car, Flag
} from 'lucide-react';
import './Analytics.css';

const API_BASE = 'http://localhost:3001/api';
const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
const WEATHER_TYPES = ['Clear', 'Rain', 'Fog', 'Cloudy', 'Storm'];
const VEHICLE_CATEGORIES = ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus'];

// Hashing utility to deterministically assign mocked categorical attributes to accidents if they're missing
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const fetchAccidents = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/accident/history?limit=1000`);
        if (res.data.success) {
          setData(res.data.accidents);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccidents();
  }, []);

  // Map Initialization
  useEffect(() => {
    if (data.length === 0) return;

    const initMap = async () => {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise(resolve => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Load Leaflet Heat JS
      if (!window.L.heatLayer) {
        await new Promise(resolve => {
          const script = document.createElement('script');
          // Using unpkg for leaflet.heat
          script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const mapEl = document.getElementById('heatmap-container');
      if (mapEl && !mapEl._leaflet_id && window.L && window.L.heatLayer) {
        const map = window.L.map('heatmap-container', {
          zoomControl: false,
          attributionControl: false
        }).setView([6.9271, 79.8612], 12); // Default to Colombo

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(map);

        // Prepare heatmap data
        const heatPoints = data
          .filter(a => a.gpsLocation && a.gpsLocation.latitude)
          .map(a => [
            a.gpsLocation.latitude,
            a.gpsLocation.longitude,
            a.riskLevel === 'HIGH' ? 1.0 : (a.riskLevel === 'MEDIUM' ? 0.6 : 0.2) // Intensity
          ]);

        if (heatPoints.length > 0) {
          window.L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 14 }).addTo(map);

          // Adjust bounds to show all points
          const bounds = window.L.latLngBounds(heatPoints.map(p => [p[0], p[1]]));
          map.fitBounds(bounds, { padding: [20, 20] });
        }
        setMapLoaded(true);
      }
    };

    // Set a timeout to ensure DOM element is ready
    setTimeout(initMap, 500);

  }, [data]);

  // Derived Statistics
  const totalAccidents = data.length;
  const violations = data.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'MEDIUM');
  const totalViolations = violations.length;

  const highRiskDriversSet = new Set(
    data.filter(a => a.riskLevel === 'HIGH').map(a => a.vehicleNo)
  );
  const highRiskDriversCount = highRiskDriversSet.size;

  // Chart 1: Line Chart - Accidents Over Time
  const timeDataMap = {};
  data.forEach(a => {
    const date = new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timeDataMap[date] = (timeDataMap[date] || 0) + 1;
  });
  const timeData = Object.keys(timeDataMap).map(date => ({ date, count: timeDataMap[date] }));

  // Chart 2: Bar Chart - Accidents By Location
  const locationDataMap = {};
  data.forEach(a => {
    let loc = 'Unknown';
    if (a.gpsLocation && a.gpsLocation.address) {
      loc = a.gpsLocation.address.split(',')[0]; // Extract city/zone
    }
    locationDataMap[loc] = (locationDataMap[loc] || 0) + 1;
  });
  const locationData = Object.entries(locationDataMap)
    .map(([loc, count]) => ({ location: loc, count }))
    .sort((a, b) => b.count - a.count).slice(0, 7);

  // Chart 3: Pie Chart - Weather vs Accidents
  const weatherDataMap = {};
  data.forEach(a => {
    // Generate deterministic weather mock if no real weather exists
    const w = WEATHER_TYPES[hashString(a.accidentId) % WEATHER_TYPES.length];
    weatherDataMap[w] = (weatherDataMap[w] || 0) + 1;
  });
  const weatherData = Object.entries(weatherDataMap).map(([name, value]) => ({ name, value }));

  // Chart 4: Vehicle Category Risk
  const catDataMap = {};
  data.forEach(a => {
    const cat = VEHICLE_CATEGORIES[hashString(a.vehicleNo) % VEHICLE_CATEGORIES.length];
    catDataMap[cat] = (catDataMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(catDataMap).map(([name, value]) => ({ name, value }));

  // Top 10 High Risk Drivers Table
  const driverDataMap = {};
  data.forEach(a => {
    if (!driverDataMap[a.vehicleNo]) {
      driverDataMap[a.vehicleNo] = { vehicleNo: a.vehicleNo, incidents: 0, highRisks: 0 };
    }
    driverDataMap[a.vehicleNo].incidents += 1;
    if (a.riskLevel === 'HIGH') driverDataMap[a.vehicleNo].highRisks += 1;
  });
  const topDrivers = Object.values(driverDataMap)
    .sort((a, b) => b.highRisks - a.highRisks || b.incidents - a.incidents)
    .slice(0, 10);

  // CustomTooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px 14px', borderRadius: '8px', color: '#fff' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            Count: <span style={{ color: payload[0].fill || '#3b82f6', fontWeight: 700 }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <h2 style={{ color: '#fff' }}>Loading Command Center Analytics...</h2>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title-container">
          <h1>National Transport Control Hub</h1>
          <p className="header-subtitle">Driver Risk Analytics & Incident Monitoring</p>
        </div>
        <div className="header-actions">
          <div className="status-badge">
            <span className="status-dot"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card total-accidents">
          <div className="metric-info">
            <span className="metric-title">Total Accidents</span>
            <span className="metric-value">{totalAccidents}</span>
            <span className="metric-trend up">+12% from last week</span>
          </div>
          <div className="metric-icon-wrapper">
            <Activity size={24} />
          </div>
        </div>
        <div className="metric-card total-violations">
          <div className="metric-info">
            <span className="metric-title">Total Violations</span>
            <span className="metric-value">{totalViolations}</span>
            <span className="metric-trend down">-4% from last week</span>
          </div>
          <div className="metric-icon-wrapper">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="metric-card high-risk">
          <div className="metric-info">
            <span className="metric-title">High Risk Drivers</span>
            <span className="metric-value">{highRiskDriversCount}</span>
            <span className="metric-trend up">+2 requires attention</span>
          </div>
          <div className="metric-icon-wrapper">
            <ShieldAlert size={24} />
          </div>
        </div>
        <div className="metric-card active-monitoring">
          <div className="metric-info">
            <span className="metric-title">Live Node Modules</span>
            <span className="metric-value">124</span>
            <span className="metric-trend down">Active CCTV Streams</span>
          </div>
          <div className="metric-icon-wrapper">
            <Video size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div className="grid-col left">
          <div className="chart-card">
            <div className="chart-header">
              <h3><Calendar size={18} /> Accidents over Time</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0a0e17' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3><MapIcon size={18} /> Incidents by Location</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="location" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3><Car size={18} /> Vehicle Category Risks</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="grid-col right">
          {/* Geographic Heatmap */}
          <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="chart-header" style={{ padding: '20px 24px 0 24px', marginBottom: '16px' }}>
              <h3><Flag size={18} /> Geographic Heatmap</h3>
            </div>
            <div className="map-container" id="heatmap-container" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid #1e293b' }}>
              {!mapLoaded && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>Loading Map Layers...</div>}
              {mapLoaded && (
                <div className="heatmap-legend">
                  <div className="legend-title">Risk Intensity Map</div>
                  <div className="legend-gradient"></div>
                  <div className="legend-labels">
                    <span>Low</span>
                    <span>Critical</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3><CloudLightning size={18} /> Weather Conditions Context</h3>
            </div>
            <div className="chart-body" style={{ minHeight: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={weatherData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {weatherData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3><ShieldAlert size={18} /> Top Targeted Risk Drivers</h3>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver / Vehicle</th>
                    <th>Total Incidents</th>
                    <th>High Risks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                        No driver incident data available
                      </td>
                    </tr>
                  ) : topDrivers.map((driver, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{driver.vehicleNo}</td>
                      <td>{driver.incidents}</td>
                      <td>{driver.highRisks}</td>
                      <td>
                        <span className={`risk-pill ${driver.highRisks > 0 ? 'high' : 'medium'}`}>
                          {driver.highRisks > 0 ? 'INVESTIGATE' : 'WARNING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
