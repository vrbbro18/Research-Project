# Driver Drowsiness and Emotion Detection System

This project implements a Flask-based backend for detecting driver drowsiness and emotions from images, providing accident reduction recommendations.

## Project Structure

```
driver/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx    # Main application
│   │   └── main.tsx   # Entry point
│   ├── public/
│   │   └── assets/    # Audio files for alerts
│   └── package.json
├── backend/
│   ├── app.py         # Main Flask application
│   ├── requirements.txt  # Python dependencies
│   └── models/        # Directory for ML models (.h5 files)
│       ├── drowsiness_model.h5  # Drowsiness detection model
│       └── emotion_model.h5     # Emotion detection model
└── README.md          # This file
```

## Prerequisites

- **Python 3.11** (required for TensorFlow compatibility)
- **Node.js 18+** (for frontend)
- Windows/Linux/macOS

## Installation

1. **Install Python 3.11**:
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify: `python --version` should show `Python 3.11.x`

2. **Clone or download the project** to your local machine.

3. **Navigate to the backend directory**:
   ```bash
   cd path/to/driver/backend
   ```

4. **Install dependencies**:
   ```bash
   python -m pip install -r requirements.txt
   ```

   This will install:
   - Flask (web framework)
   - flask-cors (CORS support)
   - TensorFlow (ML framework)
   - OpenCV (image processing)
   - NumPy (numerical operations)

## Model Setup

1. Place your trained models in the `backend/models/` directory:
   - `drowsiness_model.h5`: Binary classification model (0 = Drowsy, 1 = Awake)
   - `emotion_model.h5`: Multi-class classification model (7 emotions: angry, disgusted, fearful, happy, neutral, sad, surprised)

2. **Note**: Models must be trained on 128x128 RGB images. If models are missing, the app will use default values.

## Running the Backend

1. **Start the server**:
   ```bash
   cd backend
   py -3.11 app.py
   ```

2. The server will run on `http://localhost:5000` with debug mode enabled.

3. **API Endpoint**:
   - **URL**: `POST /analyze`
   - **Content-Type**: `multipart/form-data`
   - **Body**: 
     - `file` (image file, e.g., JPG/PNG)
     - `manual_emotion` (optional): Override emotion detection for testing
   - **Response**: JSON with status, emotion, action, risk_level, and message

   Example using curl:
   ```bash
   curl -X POST -F "file=@image.jpg" -F "manual_emotion=sad" http://localhost:5000/analyze
   ```

## Running the Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

3. **Add audio files** to `frontend/public/assets/`:
   - `alarm.mp3` - Alert sound for drowsy driver
   - `happy.mp3` - Fast happy music
   - `calm.mp3` - Calming music
   - `upbeat.mp3` - Upbeat music

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. Open browser at `http://localhost:5173`

## Features

### Backend
- **Drowsiness Detection**: Binary classification (Drowsy/Awake)
- **Emotion Detection**: 7-class classification with manual override
- **Manual Emotion Override**: Test specific emotions without model prediction
- **Refined Decision Logic**: Context-aware action recommendations

### Frontend
- **Live Webcam Mode**: Auto-capture every 3 seconds
- **Upload Image Mode**: Manual image analysis
- **Manual Emotion Override**: Dropdown to test specific emotions
- **Audio Alerts**: Automatic playback based on driver state
- **Real-time Dashboard**: Color-coded risk levels and status

## Decision Logic

The system implements a refined accident reduction algorithm:

### Drowsiness Detection (High Risk)
- **Drowsy + Sad**: PLAY_FAST_HAPPY (Wake up + Cheer up)
- **Drowsy + Other**: PLAY_ALARM (Immediate alert, loops continuously)

### Emotion-Based Prevention (Awake - Medium/Low Risk)
- **Awake + Sad**: PLAY_UPBEAT_MUSIC (Mood boost)
- **Awake + Angry**: PLAY_CALM_MUSIC (Reduce road rage)
- **Awake + Safe Emotions**: NO_ACTION

### Manual Override Testing
Use the frontend dropdown to test specific emotion scenarios without running the emotion model.

- **Drowsiness Detection**: High risk if prediction < 0.5
- **Emotion Detection**: 7-class classification
- **Actions**:
  - Drowsy + Sad → PLAY_FAST_HAPPY
  - Drowsy + Other → PLAY_ALARM
  - Awake + Angry → PLAY_CALM_MUSIC
  - Awake + Sad → PLAY_UPBEAT_MUSIC
  - Otherwise → NO_ACTION

## Troubleshooting

- **ModuleNotFoundError**: Ensure dependencies are installed with `pip install -r requirements.txt`
- **Model loading errors**: Check that .h5 files are in `backend/models/`
- **Port already in use**: Change port in `app.py` (line 175)
- **Python version issues**: Must use Python 3.11

## Development

- The app handles missing models gracefully (defaults to 'neutral' emotion)
- Logs decision steps to console for debugging
- CORS enabled for frontend integration

## License

This project is for educational/research purposes.