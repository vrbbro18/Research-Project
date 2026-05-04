# Backend Setup Instructions

## Prerequisites
- Python 3.8 or higher installed on your system
- pip package manager

## Setting Up Virtual Environment

### Windows

1. **Create and activate virtual environment:**
   ```bash
   # Run the setup script
   setup_venv.bat
   
   # Or manually:
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask server:**
   ```bash
   python app.py
   ```

### Linux/Mac

1. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask server:**
   ```bash
   python app.py
   ```

## Deactivating Virtual Environment

To deactivate the virtual environment when you're done:
```bash
deactivate
```

## Models Required

Ensure the following models are present in the `models/` directory:
- `drowsiness_model.h5` - Drowsiness detection model (RGB, 128x128 input)
- `emotion_model.h5` - Emotion detection model (Grayscale, 48x48 input)

## Testing the API

Once the server is running, you can test it at:
- API endpoint: `http://localhost:5000/analyze`
- Method: POST with multipart/form-data
- File field: `file` (image file)
- Optional field: `manual_emotion` (for manual emotion override)
