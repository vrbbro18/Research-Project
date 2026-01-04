import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

// API Response Interface
interface ApiResponse {
  status: 'Drowsy' | 'Awake' | string;
  emotion: string;
  risk_level: string;
  action: string;
  message: string;
}

function App() {
  const [mode, setMode] = useState<'webcam' | 'upload'>('webcam');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [manualEmotion, setManualEmotion] = useState<string>('Detect Automatically');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefsMap = useRef<{ [key: string]: HTMLAudioElement }>({});
  const intervalRef = useRef<number | null>(null);

  const API_URL = 'http://127.0.0.1:5000/analyze';

  // Pre-load and initialize audio files
  useEffect(() => {
    const audioMap = {
      PLAY_ALARM: '/assets/alarm.mp3',
      PLAY_FAST_HAPPY: '/assets/happy.mp3',
      PLAY_CALM_MUSIC: '/assets/calm.mp3',
      PLAY_UPBEAT_MUSIC: '/assets/upbeat.mp3',
    };

    Object.entries(audioMap).forEach(([key, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      if (key === 'PLAY_ALARM') {
        audio.loop = true;
      }
      
      // Handle successful loading
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Audio loaded: ${key} - ${path}`);
      });
      
      // Handle loading errors gracefully
      audio.addEventListener('error', (e) => {
        console.error(`❌ Audio load error for ${key}:`, e);
        console.warn(`Audio file issue: ${path}. Check if file exists and is valid MP3.`);
      });
      
      audio.src = path;
      audioRefsMap.current[key] = audio;
    });

    return () => {
      // Cleanup all audio on unmount
      Object.values(audioRefsMap.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  // Enable audio on user interaction
  const enableAudio = () => {
    setAudioEnabled(true);
    console.log('🔓 Audio enabled by user');
    console.log('Audio elements:', Object.keys(audioRefsMap.current));
    
    // Try to play and immediately pause to unlock audio
    Object.entries(audioRefsMap.current).forEach(([key, audio]) => {
      console.log(`Testing ${key}: readyState=${audio.readyState}, src=${audio.src}`);
      audio.play()
        .then(() => {
          console.log(`${key} unlocked successfully`);
          audio.pause();
        })
        .catch((err) => {
          console.error(`${key} unlock failed:`, err.message);
        });
    });
  };

  // Audio playback function with enhanced logic
  const playAudio = useCallback((action: string) => {
    if (!audioEnabled) {
      console.warn('Audio not enabled. User interaction required.');
      return;
    }

    console.log(`🔊 Attempting to play: ${action}`);

    // Stop all currently playing audio
    Object.values(audioRefsMap.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    const audioToPlay = audioRefsMap.current[action];
    if (audioToPlay) {
      console.log(`Audio element found for ${action}, readyState:`, audioToPlay.readyState);
      audioToPlay.currentTime = 0;
      const playPromise = audioToPlay.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`✅ Playing: ${action}`);
          })
          .catch((err: Error) => {
            console.error(`❌ Playback failed for ${action}:`, err);
            if (err.message.includes('no supported sources') || audioToPlay.error) {
              setError(`Audio file error for ${action}. File may be corrupted or in wrong format.`);
            }
          });
      }
    } else {
      console.error(`No audio element found for action: ${action}`);
    }
  }, [audioEnabled]);

  // Effect to handle audio based on action changes
  useEffect(() => {
    if (responseData?.action) {
      if (responseData.action === 'NO_ACTION') {
        // Stop any playing audio
        Object.values(audioRefsMap.current).forEach(audio => {
          audio.pause();
          audio.currentTime = 0;
        });
      } else {
        // Play the corresponding audio
        playAudio(responseData.action);
      }
    }
  }, [responseData?.action, playAudio]);

  // Send image to backend with manual emotion
  const analyzeImage = useCallback(async (imageBlob: Blob) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'image.jpg');
      formData.append('manual_emotion', manualEmotion);

      const response = await axios.post<ApiResponse>(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponseData(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to analyze image');
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [playAudio, manualEmotion]);

  // Capture from webcam
  const captureFromWebcam = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to blob
        fetch(imageSrc)
          .then((res) => res.blob())
          .then((blob) => {
            analyzeImage(blob);
          })
          .catch((err: Error) => {
            console.error('Failed to capture image:', err);
            setError('Failed to capture image from webcam');
          });
      }
    }
  }, [analyzeImage]);

  // Auto-capture effect for webcam mode
  useEffect(() => {
    if (mode === 'webcam') {
      // Start auto-capture every 3 seconds
      intervalRef.current = window.setInterval(() => {
        captureFromWebcam();
      }, 3000);
    } else {
      // Clear interval when switching modes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, captureFromWebcam]);

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle analyze button for upload mode
  const handleAnalyzeUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      analyzeImage(file);
    }
  };

  // Toggle mode handler
  const handleModeToggle = () => {
    setMode((prev: 'webcam' | 'upload') => (prev === 'webcam' ? 'upload' : 'webcam'));
    setSelectedImage(null);
    setResponseData(null);
    setError(null);
  };

  // Get risk level color
  const getRiskColor = (riskLevel: string): string => {
    if (riskLevel.includes('HIGH')) return 'danger';
    if (riskLevel.includes('MEDIUM')) return 'warning';
    return 'success';
  };

  return (
    <div className="container-fluid min-vh-100 bg-light py-4">
      <div className="container">
        <h1 className="text-center mb-4">Driver Safety System</h1>

        {/* Audio Enable Banner */}
        {!audioEnabled && (
          <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
            <strong>🔊 Audio Alerts Disabled</strong>
            <p className="mb-2">Click the button below to enable audio alerts for driver safety warnings.</p>
            <button 
              className="btn btn-warning btn-sm"
              onClick={enableAudio}
            >
              🔓 Enable Audio Alerts
            </button>
          </div>
        )}

        {audioEnabled && (
          <div className="alert alert-success mb-4" role="alert">
            <strong>✅ Audio Alerts Enabled</strong> - You will hear warnings when needed.
          </div>
        )}

        {/* Mode Toggle */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="modeSwitch"
                checked={mode === 'upload'}
                onChange={handleModeToggle}
              />
              <label className="form-check-label" htmlFor="modeSwitch">
                {mode === 'webcam' ? '📹 Live Webcam Mode' : '📁 Upload Image Mode'}
              </label>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Left Side - Camera/Upload */}
          <div className="col-md-7 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  {mode === 'webcam' ? 'Live Camera Feed' : 'Upload Image'}
                </h5>
              </div>
              <div className="card-body text-center">
                {mode === 'webcam' ? (
                  <div>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-100 rounded"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: 'user',
                      }}
                    />
                    <div className="mt-3">
                      <span className="badge bg-info">
                        Auto-capturing every 3 seconds...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="form-control mb-3"
                    />
                    {selectedImage && (
                      <div className="mb-3">
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="img-fluid rounded"
                          style={{ maxHeight: '400px' }}
                        />
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleAnalyzeUpload}
                      disabled={!selectedImage || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Analyzing...
                        </>
                      ) : (
                        '🔍 Analyze Image'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Dashboard */}
          <div className="col-md-5">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">📊 Analysis Dashboard</h5>
              </div>
              <div className="card-body">
                {/* Manual Emotion Override Dropdown */}
                <div className="mb-3">
                  <label className="form-label fw-bold">🔧 Test Emotion Mode:</label>
                  <select
                    className="form-select"
                    value={manualEmotion}
                    onChange={(e) => setManualEmotion(e.target.value)}
                  >
                    <option value="Detect Automatically">Detect Automatically</option>
                    <option value="sad">Sad</option>
                    <option value="angry">Angry</option>
                    <option value="happy">Happy</option>
                    <option value="neutral">Neutral</option>
                  </select>
                  <small className="text-muted">
                    {manualEmotion === 'Detect Automatically'
                      ? 'Using AI model prediction'
                      : `Testing with "${manualEmotion}" emotion`}
                  </small>
                </div>

                {loading && mode === 'webcam' && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Analyzing...</p>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    ❌ {error}
                  </div>
                )}

                {responseData ? (
                  <div>
                    {/* Status */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Driver Status:</label>
                      <div
                        className={`alert ${
                          responseData.status === 'Drowsy'
                            ? 'alert-danger'
                            : 'alert-success'
                        } mb-0`}
                      >
                        <h4 className="mb-0">
                          {responseData.status === 'Drowsy' ? '😴' : '👁️'}{' '}
                          {responseData.status}
                        </h4>
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Risk Level:</label>
                      <div
                        className={`alert alert-${getRiskColor(
                          responseData.risk_level
                        )} mb-0`}
                      >
                        <h5 className="mb-0">{responseData.risk_level}</h5>
                      </div>
                    </div>

                    {/* Emotion */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Emotion:</label>
                      <div className="alert alert-info mb-0">
                        <h5 className="mb-0">
                          {responseData.emotion.charAt(0).toUpperCase() +
                            responseData.emotion.slice(1)}
                        </h5>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Recommended Action:</label>
                      <div
                        className={`alert ${
                          responseData.action === 'NO_ACTION'
                            ? 'alert-secondary'
                            : 'alert-warning'
                        } mb-0`}
                      >
                        <h6 className="mb-0">
                          {responseData.action === 'NO_ACTION'
                            ? '✅ No Action Needed'
                            : `🔊 ${responseData.action.replace(/_/g, ' ')}`}
                        </h6>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="alert alert-light border">
                      <small className="text-muted">{responseData.message}</small>
                    </div>
                  </div>
                ) : (
                  !loading && (
                    <div className="text-center text-muted py-5">
                      <p>
                        {mode === 'webcam'
                          ? '⏳ Waiting for analysis...'
                          : '📷 Upload an image to begin'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
