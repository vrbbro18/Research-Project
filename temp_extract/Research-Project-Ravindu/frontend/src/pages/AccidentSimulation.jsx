import React, { useState } from 'react';
import axios from 'axios';
import './AccidentSimulation.css';

function AccidentSimulation() {
  const [formData, setFormData] = useState({
    image: null,
    vehicleNo: '',
    latitude: '6.9271', // Dummy GPS - Colombo, Sri Lanka
    longitude: '79.8612'
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Validate form
      if (!formData.image) {
        throw new Error('Please select an image file');
      }
      if (!formData.vehicleNo.trim()) {
        throw new Error('Please enter a vehicle number');
      }

      // Prepare form data for multipart/form-data
      const uploadData = new FormData();
      uploadData.append('image', formData.image);
      uploadData.append('vehicleNo', formData.vehicleNo);
      uploadData.append('latitude', formData.latitude);
      uploadData.append('longitude', formData.longitude);

      // Call backend API
      const response = await axios.post('/api/accident/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      console.log('Upload successful:', response.data);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Format notification status
  const formatNotificationStatus = (notificationStatus) => {
    if (!notificationStatus) return 'Not sent';
    
    if (notificationStatus.triggered) {
      return `✓ Sent (${notificationStatus.type || 'notification'})`;
    }
    
    return notificationStatus.message || 'Not sent';
  };

  return (
    <div className="accident-simulation">
      <div className="page-header">
        <h2>Accident Simulation</h2>
        <p className="subtitle">
          Simulate automatic dashcam capture and driver risk assessment
        </p>
      </div>

      <div className="simulation-container">
        <div className="form-section">
          <form onSubmit={handleSubmit} className="upload-form">
            {/* Image Upload */}
            <div className="form-group">
              <label htmlFor="image" className="form-label">
                Driver Image (Dashcam Capture)
              </label>
              <div className="image-upload-area">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleImageChange}
                  className="file-input"
                  disabled={loading}
                  required
                />
                {preview ? (
                  <div className="image-preview">
                    <img src={preview} alt="Preview" />
                    <p className="preview-label">Selected Image</p>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <p>Click to select driver image</p>
                    <p className="upload-hint">JPEG or PNG format</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="form-group">
              <label htmlFor="vehicleNo" className="form-label">
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicleNo"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., ABC-1234"
                disabled={loading}
                required
              />
            </div>

            {/* GPS Location (Auto-filled dummy values) */}
            <div className="form-group">
              <label className="form-label">GPS Location (Simulated)</label>
              <div className="gps-inputs">
                <div className="gps-input-group">
                  <label htmlFor="latitude" className="gps-label">Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="form-input"
                    step="any"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="gps-input-group">
                  <label htmlFor="longitude" className="gps-label">Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="form-input"
                    step="any"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <p className="form-hint">
                ℹ️ GPS location is auto-filled with dummy values for simulation
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !formData.image || !formData.vehicleNo}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                'Submit for Risk Assessment'
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {(result || error) && (
          <div className="results-section">
            {error && (
              <div className="error-message">
                <h3>❌ Error</h3>
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className="result-card">
                <h3>Risk Assessment Results</h3>
                
                <div className="result-grid">
                  {/* Risk Level */}
                  <div className="result-item">
                    <label>Driver Risk Level</label>
                    <div className={getRiskLevelClass(result.riskLevel)}>
                      {result.riskLevel}
                    </div>
                  </div>

                  {/* GPS Location */}
                  <div className="result-item">
                    <label>GPS Location</label>
                    <div className="gps-display">
                      <span className="gps-coord">
                        {result.gpsLocation?.latitude?.toFixed(4)}, {result.gpsLocation?.longitude?.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Notification Status */}
                  <div className="result-item full-width">
                    <label>Notification Status</label>
                    <div className="notification-status">
                      {result.notificationStatus?.triggered ? (
                        <span className="notification-sent">
                          ✓ {formatNotificationStatus(result.notificationStatus)}
                        </span>
                      ) : (
                        <span className="notification-not-sent">
                          {formatNotificationStatus(result.notificationStatus)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional Info */}
                  {result.aiClassification && (
                    <div className="result-item full-width">
                      <label>AI Classification</label>
                      <div className="ai-info">
                        <span>Category: <strong>{result.aiClassification.category}</strong></span>
                        <span>Confidence: <strong>{(result.aiClassification.confidence * 100).toFixed(1)}%</strong></span>
                      </div>
                    </div>
                  )}

                  {/* Accident ID */}
                  {result.accidentId && (
                    <div className="result-item full-width">
                      <label>Accident ID</label>
                      <div className="accident-id">{result.accidentId}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AccidentSimulation;

