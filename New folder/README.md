# Driver Drowsiness and Emotion Detection System

This project implements a Flask-based backend for detecting driver drowsiness and emotions from images, providing accident reduction recommendations.

For a full research explanation (charts, formulas, fusion math, prediction logic, and decision rules), read [RESEARCH_README.md](RESEARCH_README.md).

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



### 2. Backend setup (Python + models)

1. Go to backend folder:

```bash
cd backend
```

2. Create virtual environment:

```bash
python -m venv venv
```

3. Activate virtual environment:

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Windows CMD:

```bat
venv\Scripts\activate.bat
```

macOS/Linux:

```bash
source venv/bin/activate
```

4. Install backend dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

5. Confirm model files exist in `backend/models/`:

- `drowsiness_model.h5`
- `emotion_model.h5`

6. Start backend:

```bash
python app.py
```

Expected output includes:

- model load success logs
- `Running on http://127.0.0.1:5000`

### 3. Frontend setup (React + Vite)

Open a **new terminal** (keep backend running), then:

```bash
cd frontend
npm install
npm run dev
```

Open the URL shown by Vite (often `http://localhost:5173`, but it may switch to another port like `3002` if default ports are occupied).

### 4. First-run verification checklist

1. Backend health endpoints:

- `http://127.0.0.1:5000/status`
- `http://127.0.0.1:5000/research`
- `http://127.0.0.1:5000/live_analytics`

2. Frontend checks:

- Live camera stream visible
- Live analytics charts update
- Hybrid explanation panel appears
- No red compile/runtime errors in browser console

### 5. Daily run commands (after initial setup)

Backend terminal:

```powershell
Set-Location "<repo>/backend"
.\venv\Scripts\python.exe app.py
```

Frontend terminal:

```powershell
Set-Location "<repo>/frontend"
npm run dev
```

### 6. Common setup issues

- `ModuleNotFoundError: flask`:
   - Usually means backend was started with the wrong Python interpreter.
   - Use the backend venv interpreter: `backend/venv/Scripts/python.exe app.py`.

- Frontend starts on a different port:
   - This is normal when default ports are busy.
   - Use the exact URL printed by Vite.

- Models not found:
   - Ensure both `.h5` files are present in `backend/models/`.

- Webcam unavailable:
   - Close other apps using camera and restart backend.

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

## Hardware Architecture Rationale (SDV Deployment Strategy)

This project follows a **Software-Defined Vehicle (SDV)** architecture strategy.

### Why this system is not built around external IoT boards

In legacy prototypes, developers often connect an external microcontroller or low-power IoT board (for example Arduino or entry-level Raspberry Pi) to run a driver-monitoring feature. We intentionally avoid that approach for this system because the workload is safety-relevant and computationally intensive.

This solution combines:
- Deep learning inference (drowsiness and emotion models)
- Real-time face landmark geometry (MediaPipe)
- Continuous multi-signal fusion (EAR, MAR, PERCLOS/yawn proxies, temporal smoothing, uncertainty logic)
- Live visual analytics and prediction overlays

These operations require stable, higher compute throughput and low-latency execution that aligns better with modern in-vehicle compute platforms than with constrained external IoT add-ons.

### Why a typical IoT device is not sufficient for this workload

To explicitly validate the architecture decision, below are the practical constraints of typical low-power IoT-class boards for this specific system:

- **Compute headroom limitation**: This pipeline runs deep CNN inference plus real-time landmark geometry and signal fusion together. Typical IoT boards can run parts of the stack, but often struggle to keep all tasks at stable real-time rates simultaneously.
- **Latency instability under concurrent tasks**: Our design performs continuous video processing, periodic snapshot inference, fusion logic, and live analytics updates. On low-power devices, contention can cause variable latency spikes that are risky for safety-relevant alert timing.
- **Memory and model runtime pressure**: TensorFlow model loading, intermediate tensors, and MediaPipe processing create sustained CPU/RAM pressure. IoT-class memory budgets are commonly tighter, which can increase slowdown risk and reduce runtime stability.
- **Thermal throttling risk**: Sustained camera + AI workloads are continuous, not bursty. Small passive cooling setups typical of IoT boards are more likely to throttle over time, reducing deterministic performance.
- **I/O and camera pipeline overhead**: Real-time frame ingest, preprocessing, and overlay generation create non-trivial bandwidth and compute overhead. In practice, this can reduce effective throughput on low-end hardware.
- **Safety margin requirement**: Driver monitoring is a time-sensitive feature; detection that is sometimes late is not equivalent to detection that is consistently on time. Centralized vehicle compute provides larger performance margin for worst-case conditions.

Because of these constraints, this project is intentionally engineered as an SDV software module targeting central in-vehicle compute, where deterministic performance and safety-oriented latency are more realistic.

### Intended deployment target in modern vehicles

The intended production target is the vehicle's **Central Compute Unit** (for example infotainment/ADAS domain computer), where software modules are deployed directly as part of the in-vehicle software stack.

In other words, this project is engineered as a **high-performance software module**, not as a peripheral hardware gadget.

### Why the current laptop + webcam setup is valid

The current development setup deliberately simulates the in-vehicle architecture:

- **Laptop** -> vehicle dashboard compute node / central ADAS computer
- **Webcam** -> built-in cabin-facing camera

This mirrors current industry direction (for example cabin-monitoring pipelines running on centralized in-car compute), and is conceptually similar to architectures used in modern connected vehicles.

### Safety and performance rationale

For a driver-monitoring system, delayed or unstable inference can reduce practical safety value. Running the pipeline on stronger central compute enables:

- Lower end-to-end latency for alert generation
- Better frame-to-frame consistency under load
- Capacity to run heavier models and geometry processing without severe frame drops
- More reliable real-time fusion and prediction updates

This architecture choice is therefore a technical and safety decision aligned with current SDV engineering practice, not only a convenience choice for development.

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