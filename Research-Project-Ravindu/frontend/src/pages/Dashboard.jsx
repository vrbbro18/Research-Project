import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_BASE = 'http://localhost:3001/api';

function Dashboard() {
  const [liveDetections, setLiveDetections] = useState([]);
  const [accidentAlerts, setAccidentAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedHighway, setSelectedHighway] = useState('all');
  
  // Sri Lanka Highways with coordinates and vehicle positions
  const highways = {
    all: {
      name: 'All Highways',
      center: [7.8731, 80.7718], // Center of Sri Lanka
      zoom: 8,
      bounds: [[5.5, 79.5], [10.0, 82.0]],
      vehiclePositions: []
    },
    e01: {
      name: 'E01 - Southern Expressway',
      center: [6.8271, 80.0612],
      zoom: 11,
      bounds: [[6.5, 79.8], [7.2, 80.3]],
      vehiclePositions: [
        [6.7500, 79.9500], // Start point
        [6.8500, 80.1000], // Mid point
        [6.9500, 80.2000]  // End point
      ]
    },
    e02: {
      name: 'E02 - Outer Circular Expressway',
      center: [6.9271, 79.8612],
      zoom: 12,
      bounds: [[6.7, 79.7], [7.1, 80.0]],
      vehiclePositions: [
        [6.8500, 79.8000], // Start point
        [6.9271, 79.8612], // Mid point (Colombo)
        [7.0000, 79.9200]  // End point
      ]
    },
    e03: {
      name: 'E03 - Colombo-Kandy Expressway',
      center: [7.1271, 80.0612],
      zoom: 10,
      bounds: [[6.9, 79.8], [7.4, 80.3]],
      vehiclePositions: [
        [6.9500, 79.9000], // Start point (Colombo)
        [7.0500, 79.9800], // Mid point
        [7.2000, 80.1500]  // End point (Kandy)
      ]
    },
    a01: {
      name: 'A1 - Colombo-Kandy Road',
      center: [7.2271, 80.1612],
      zoom: 10,
      bounds: [[7.0, 79.9], [7.5, 80.4]],
      vehiclePositions: [
        [7.0500, 80.0000], // Start point
        [7.1500, 80.0800], // Mid point
        [7.3000, 80.2000]  // End point
      ]
    },
    a02: {
      name: 'A2 - Colombo-Galle Road',
      center: [6.5271, 80.0612],
      zoom: 11,
      bounds: [[6.2, 79.8], [6.9, 80.3]],
      vehiclePositions: [
        [6.3000, 79.9000], // Start point (Galle)
        [6.4500, 80.0000], // Mid point
        [6.7000, 80.1000]  // End point (Colombo)
      ]
    },
    a04: {
      name: 'A4 - Colombo-Negombo Road',
      center: [7.2271, 79.8612],
      zoom: 12,
      bounds: [[7.0, 79.7], [7.5, 80.0]],
      vehiclePositions: [
        [7.0500, 79.7500], // Start point (Colombo)
        [7.1500, 79.8000], // Mid point
        [7.3000, 79.9000]  // End point (Negombo)
      ]
    },
    a09: {
      name: 'A9 - Kandy-Jaffna Road',
      center: [7.6271, 80.3612],
      zoom: 9,
      bounds: [[7.3, 80.1], [8.0, 80.6]],
      vehiclePositions: [
        [7.4000, 80.2000], // Start point (Kandy)
        [7.6000, 80.4000], // Mid point
        [7.8500, 80.5500]  // End point
      ]
    }
  };

  // Fetch live detections
  useEffect(() => {
    const fetchLiveDetections = async () => {
      try {
        const response = await axios.get(`${API_BASE}/detection/history?limit=10`);
        if (response.data.success) {
          setLiveDetections(response.data.detections || []);
        }
      } catch (error) {
        console.error('Error fetching live detections:', error);
        setIsConnected(false);
      }
    };

    fetchLiveDetections();
    const interval = setInterval(fetchLiveDetections, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch accident alerts - Only HIGH risk
  useEffect(() => {
    const fetchAccidentAlerts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/accident/history?limit=20`);
        if (response.data.success) {
          const alerts = (response.data.accidents || [])
            .filter(acc => acc.riskLevel === 'HIGH') // Only HIGH risk alerts
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAccidentAlerts(alerts);
        }
      } catch (error) {
        console.error('Error fetching accident alerts:', error);
      }
    };

    fetchAccidentAlerts();
    const interval = setInterval(fetchAccidentAlerts, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_BASE}/notifications`);
        console.log('Notifications API response:', response.data);
        if (response.data.success) {
          const allNotifications = response.data.notifications || [];
          console.log(`Fetched ${allNotifications.length} total notifications`);
          
          // Filter and sort notifications
          const recentNotifications = allNotifications
            .filter(n => n.type === 'emergency' || n.type === 'warning')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
          
          console.log(`Displaying ${recentNotifications.length} filtered notifications`);
          setNotifications(recentNotifications);
        } else {
          console.warn('Notifications API returned unsuccessful response');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        console.error('Error details:', error.response?.data || error.message);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const response = await axios.get(`${API_BASE}/weather/current`);
        console.log('Weather API response:', response.data);
        if (response.data.success && response.data.weather) {
          setWeather(response.data.weather);
        } else {
          // Set demo data if response format is unexpected
          setWeather({
            location: 'Colombo, LK',
            temperature: 28,
            feelsLike: 30,
            description: 'Partly Cloudy',
            icon: '02d',
            humidity: 75,
            windSpeed: 12,
            pressure: 1013,
            visibility: 10,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Set demo weather data on error so widget still shows
        setWeather({
          location: 'Colombo, LK',
          temperature: 28,
          feelsLike: 30,
          description: 'Partly Cloudy',
          icon: '02d',
          humidity: 75,
          windSpeed: 12,
          pressure: 1013,
          visibility: 10,
          timestamp: new Date().toISOString()
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    // Update weather every 5 minutes for real-time updates (300000ms)
    const interval = setInterval(fetchWeather, 300000);
    return () => clearInterval(interval);
  }, []);

  // Generate vehicles for selected highway
  const generateVehiclesForHighway = (highwayId) => {
    const highway = highways[highwayId];
    if (!highway || !highway.vehiclePositions || highway.vehiclePositions.length === 0) {
      return [];
    }

    const vehicleTypes = ['patrol', 'patrol', 'emergency'];
    const statuses = ['active', 'active', 'responding'];
    const vehicleNumbers = ['WP-ABC-1234', 'WP-XYZ-5678', 'WP-DEF-9012'];
    
    return highway.vehiclePositions.map((position, index) => ({
      id: `POL-${highwayId}-${index + 1}`,
      vehicleNo: vehicleNumbers[index],
      type: vehicleTypes[index],
      status: statuses[index],
      highway: highwayId,
      latitude: position[0],
      longitude: position[1],
      speed: 50 + Math.random() * 50, // 50-100 km/h
      heading: 45 + (index * 45),
      lastUpdate: new Date().toISOString()
    }));
  };

  // Initialize GPS Map and Vehicles
  useEffect(() => {
    // Generate vehicles for default highway (E02)
    const initialVehicles = generateVehiclesForHighway('e02');
    setVehicles(initialVehicles);
    
    // Initialize map after DOM is ready
    const initMap = () => {
      const mapElement = document.getElementById('gps-map');
      if (mapElement && mapElement.offsetHeight > 0) {
        initializeMap(initialVehicles);
      } else {
        // Retry if element not ready
        setTimeout(initMap, 200);
      }
    };
    
    // Wait for component to render
    setTimeout(initMap, 1000);
  }, []);

  // Update vehicle positions (simulate movement)
  useEffect(() => {
    if (vehicles.length === 0 || !mapInitialized) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => {
        const updated = prevVehicles.map(vehicle => {
          // Simulate small movement along highway
          const latOffset = (Math.random() - 0.5) * 0.001;
          const lngOffset = (Math.random() - 0.5) * 0.001;
          
          return {
            ...vehicle,
            latitude: Math.max(6.90, Math.min(6.95, vehicle.latitude + latOffset)),
            longitude: Math.max(79.84, Math.min(79.88, vehicle.longitude + lngOffset)),
            speed: Math.max(40, Math.min(120, vehicle.speed + (Math.random() - 0.5) * 5)),
            lastUpdate: new Date().toISOString()
          };
        });
        updateMapMarkers(updated);
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [vehicles.length, mapInitialized, selectedHighway]);

  const initializeMap = (vehicleList) => {
    // Load Leaflet CSS and JS if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        createMap(vehicleList);
      };
      document.body.appendChild(script);
    } else {
      createMap(vehicleList);
    }
  };

  const createMap = (vehicleList) => {
    const mapElement = document.getElementById('gps-map');
    if (!mapElement) {
      console.error('GPS map element not found');
      return;
    }

    if (!window.L) {
      console.error('Leaflet not loaded');
      return;
    }

    const L = window.L;
    
    // Remove existing map if any
    if (window.mapInstance) {
      try {
        window.mapInstance.remove();
      } catch (e) {
        console.warn('Error removing existing map:', e);
      }
    }

    // Get initial highway (default to E02 - Outer Circular)
    const initialHighway = highways[selectedHighway] || highways.e02;
    
    // Center on selected highway
    const mapInstance = L.map('gps-map', {
      zoomControl: true,
      attributionControl: true
    }).setView(initialHighway.center, initialHighway.zoom);
    
    // Set bounds if available
    if (initialHighway.bounds) {
      mapInstance.fitBounds(initialHighway.bounds);
    }
    
    // Force map to invalidate size after a brief delay
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 100);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    // Store map instance
    window.mapInstance = mapInstance;

    // Add vehicle markers
    vehicleList.forEach(vehicle => {
      addVehicleMarker(mapInstance, vehicle);
    });

    setMapInitialized(true);
  };

  const addVehicleMarker = (mapInstance, vehicle) => {
    if (!window.L) return;
    const L = window.L;

    const icon = L.divIcon({
      className: 'vehicle-marker',
      html: `<div class="vehicle-icon ${vehicle.type} ${vehicle.status}">🚔</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const popupContent = `
      <div class="vehicle-popup">
        <div class="popup-header">
          <strong>🚔 ${vehicle.vehicleNo}</strong>
        </div>
        <div class="popup-details">
          <div class="popup-row">
            <span class="popup-label">Highway:</span>
            <span class="popup-value">${highways[vehicle.highway]?.name || vehicle.highway}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Type:</span>
            <span class="popup-value">${vehicle.type.toUpperCase()}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Status:</span>
            <span class="popup-value status-${vehicle.status}">${vehicle.status.toUpperCase()}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Speed:</span>
            <span class="popup-value">${vehicle.speed.toFixed(0)} km/h</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Location:</span>
            <span class="popup-value">${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">Last Update:</span>
            <span class="popup-value">${new Date(vehicle.lastUpdate).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    `;

    const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
      .addTo(mapInstance)
      .bindPopup(popupContent)
      .bindTooltip(`
        <div class="vehicle-tooltip">
          <strong>${vehicle.vehicleNo}</strong><br>
          ${vehicle.type} • ${vehicle.speed.toFixed(0)} km/h
        </div>
      `, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'vehicle-tooltip-container'
      });

    // Add hover events for better interactivity
    marker.on('mouseover', function() {
      this.openPopup();
    });

    marker.on('mouseout', function() {
      // Don't close on mouseout, let user click to close
    });

    return marker;
  };

  const updateMapMarkers = (vehicleList) => {
    if (!window.mapInstance || !window.L) return;
    const L = window.L;
    const mapInstance = window.mapInstance;

    // Remove old markers
    mapInstance.eachLayer(layer => {
      if (layer instanceof L.Marker && layer.options.icon?.options?.className === 'vehicle-marker') {
        mapInstance.removeLayer(layer);
      }
    });

    // Filter vehicles based on selected highway
    const filteredVehicles = selectedHighway === 'all' 
      ? vehicleList 
      : vehicleList.filter(v => v.highway === selectedHighway);

    // Add updated markers
    filteredVehicles.forEach(vehicle => {
      addVehicleMarker(mapInstance, vehicle);
    });
  };

  // Handle highway filter change
  const handleHighwayChange = (highwayId) => {
    setSelectedHighway(highwayId);
    
    if (window.mapInstance && window.L) {
      const L = window.L;
      const highway = highways[highwayId];
      
      if (highway) {
        // Zoom to selected highway
        window.mapInstance.setView(highway.center, highway.zoom);
        
        if (highway.bounds) {
          window.mapInstance.fitBounds(highway.bounds, { padding: [50, 50] });
        }
        
        // Update markers for filtered vehicles
        const filteredVehicles = highwayId === 'all' 
          ? vehicles 
          : vehicles.filter(v => v.highway === highwayId);
        updateMapMarkers(filteredVehicles);
      }
    }
  };

  const refreshVehicles = () => {
    // Refresh vehicle positions
    setVehicles(prev => prev.map(v => ({
      ...v,
      lastUpdate: new Date().toISOString()
    })));
    if (window.mapInstance && vehicles.length > 0) {
      const filteredVehicles = selectedHighway === 'all' 
        ? vehicles 
        : vehicles.filter(v => v.highway === selectedHighway);
      updateMapMarkers(filteredVehicles);
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'HIGH':
        return 'risk-high';
      case 'MEDIUM':
        return 'risk-medium';
      case 'LOW':
        return 'risk-low';
      default:
        return 'risk-low';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'HIGH':
        return '🚨';
      case 'MEDIUM':
        return '⚠️';
      case 'LOW':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleString();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🚔 Police Command Center</h1>
            <p>Driver Risk Detection & Monitoring System</p>
          </div>
          <div className="header-right">
            {/* Weather Widget */}
            {weather && (
              <div className="header-weather-widget">
                <div className="weather-widget-icon">
                  {weather.icon && (
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                      alt={weather.description}
                      className="weather-icon-small"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="weather-widget-content">
                  <div className="weather-widget-temp">{weather.temperature}°C</div>
                  <div className="weather-widget-details">
                    <span className="weather-widget-desc">{weather.description}</span>
                    <span className="weather-widget-location">{weather.location}</span>
                  </div>
                </div>
              </div>
            )}
            {weatherLoading && !weather && (
              <div className="header-weather-widget weather-loading-state">
                <div className="weather-widget-icon">🌤️</div>
                <div className="weather-widget-content">
                  <div className="weather-widget-temp">--°C</div>
                  <div className="weather-widget-details">
                    <span className="weather-widget-desc">Loading...</span>
                  </div>
                </div>
              </div>
            )}
            {/* <div className="header-status">
              <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                <span>{isConnected ? 'System Online' : 'System Offline'}</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Live Feed Section */}
        <div className="dashboard-card live-feed-card">
          <div className="card-header">
            <h2>📡 Live Detection Feed</h2>
            <span className="live-indicator">
              <span className="pulse"></span>
              LIVE
            </span>
          </div>
          <div className="card-content">
            {/* Live CCTV Stream */}
            <div className="cctv-stream-container">
              <div className="cctv-header">
                <span className="cctv-label">🔴 LIVE CCTV STREAM</span>
                <span className="cctv-status"> Live</span>
              </div>
              <div className="cctv-video-wrapper">
                {videoError ? (
                  <div className="video-error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">
                      <strong>Video not found</strong>
                      <p>Please ensure your video file is named <code>cctv-stream.mp4</code></p>
                      <p>Location: <code>backend/videos/cctv-stream.mp4</code></p>
                      <p>Error: {videoError}</p>
                    </div>
                  </div>
                ) : (
                  <video 
                    className="cctv-video"
                    autoPlay
                    muted
                    playsInline
                    controls
                    loop
                    onError={(e) => {
                      const error = e.target.error;
                      let errorMsg = 'Unknown error';
                      if (error) {
                        switch(error.code) {
                          case error.MEDIA_ERR_ABORTED:
                            errorMsg = 'Video loading aborted';
                            break;
                          case error.MEDIA_ERR_NETWORK:
                            errorMsg = 'Network error - check if server is running';
                            break;
                          case error.MEDIA_ERR_DECODE:
                            errorMsg = 'Video format not supported';
                            break;
                          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMsg = 'Video file not found or format not supported';
                            break;
                          default:
                            errorMsg = `Error code: ${error.code}`;
                        }
                      }
                      console.error('Video error:', errorMsg);
                      console.error('Video source attempted:', e.target.currentSrc);
                      setVideoError(errorMsg);
                    }}
                    onLoadStart={() => {
                      console.log('Video loading started');
                      setVideoError(null);
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully');
                      setVideoError(null);
                    }}
                  >
                    <source src="http://localhost:3001/videos/cctv-stream.mp4" type="video/mp4" />
                    <source src="http://localhost:3001/videos/cctv-stream.webm" type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="cctv-overlay">
                  <div className="cctv-info">
                    <span className="cctv-time">{new Date().toLocaleTimeString()}</span>
                    <span className="cctv-location">📍 Camera 01 - Main Road</span>
                  </div>
                </div>
              </div>
              <div className="cctv-controls">
                <button className="cctv-btn">📹 Record</button>
                <button className="cctv-btn">📸 Capture</button>
                <button className="cctv-btn">🔍 Zoom</button>
                <select className="cctv-select">
                  <option>Camera 01 - Main Road</option>
                  <option>Camera 02 - Highway</option>
                  <option>Camera 03 - Intersection</option>
                </select>
              </div>
            </div>

            {/* Detection List */}
            <div className="detection-list-header">
              <h3>Recent Detections</h3>
            </div>
            <div className="live-feed-list">
              {liveDetections.length > 0 ? (
                liveDetections.map((detection) => (
                  <div key={detection.id} className="feed-item">
                    <div className="feed-icon">{getRiskIcon(detection.riskLevel)}</div>
                    <div className="feed-content">
                      <div className="feed-header">
                        <span className={`risk-badge ${getRiskBadgeClass(detection.riskLevel)}`}>
                          {detection.riskLevel || 'UNKNOWN'}
                        </span>
                        <span className="feed-time">{formatTime(detection.timestamp)}</span>
                      </div>
                      <div className="feed-details">
                        <span className="feed-category">{detection.category || 'Unknown'}</span>
                        <span className="feed-confidence">
                          {(detection.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No detections available</div>
              )}
            </div>
          </div>
        </div>

        {/* Accident Alerts Section */}
        <div className="dashboard-card alerts-card">
          <div className="card-header">
            <h2>🚨 Accident Alerts</h2>
            <span className="alert-count">{accidentAlerts.length}</span>
          </div>
          <div className="card-content">
            <div className="alerts-list">
              {accidentAlerts.length > 0 ? (
                accidentAlerts.map((alert) => (
                  <div key={alert.accidentId} className={`alert-item ${getRiskBadgeClass(alert.riskLevel)}`}>
                    <div className="alert-icon">{getRiskIcon(alert.riskLevel)}</div>
                    <div className="alert-content">
                      <div className="alert-header">
                        <span className="alert-id">{alert.accidentId}</span>
                        <span className="alert-time">{formatTime(alert.timestamp)}</span>
                      </div>
                      <div className="alert-details">
                        <span className="alert-vehicle">Vehicle: {alert.vehicleNo || 'N/A'}</span>
                        {alert.gpsLocation && (
                          <span className="alert-location">
                            📍 {alert.gpsLocation.latitude?.toFixed(4)}, {alert.gpsLocation.longitude?.toFixed(4)}
                          </span>
                        )}
                      </div>
                      {alert.alertSent && (
                        <div className="alert-status">
                          <span className="status-badge sent">✓ Alert Sent</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No active alerts</div>
              )}
            </div>
          </div>
        </div>

        {/* GPS Tracking Map - Full Page */}
        <div className="dashboard-card gps-tracking-card full-width">
          <div className="card-header">
            <h2>🗺️ GPS Vehicle Tracking - Highway Patrol</h2>
            <div className="map-controls">
              <div className="highway-filter">
                <label htmlFor="highway-select" className="filter-label">📍 Highway:</label>
                <select 
                  id="highway-select"
                  className="highway-select"
                  value={selectedHighway}
                  onChange={(e) => handleHighwayChange(e.target.value)}
                >
                  {Object.entries(highways).map(([key, highway]) => (
                    <option key={key} value={key}>{highway.name}</option>
                  ))}
                </select>
              </div>
              <span className="vehicle-count">
                🚔 {selectedHighway === 'all' ? vehicles.length : vehicles.filter(v => v.highway === selectedHighway).length} Vehicles
              </span>
              <button className="map-refresh-btn" onClick={refreshVehicles}>🔄 Refresh</button>
            </div>
          </div>
          <div className="card-content map-content">
            <div id="gps-map" className="gps-map-container"></div>
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-icon patrol active"></div>
                <span>Patrol Vehicle</span>
              </div>
              <div className="legend-item">
                <div className="legend-icon emergency responding"></div>
                <span>Emergency Response</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

