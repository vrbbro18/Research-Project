# How to Use Your Trained Model

## Current Issue

The system is using **simulated (demo) detection** because:
1. ❌ Model file not found in expected locations
2. ❌ Python may not be installed or configured

## Step-by-Step Solution

### Step 1: Locate Your Trained Model

Your trained model file should be a `.h5` or `.keras` file. Find where you saved it after training.

**Common locations:**
- Where you ran the training script
- `ai/models/` folder
- `models/` folder
- Your training output directory

**To find it, run:**
```bash
cd backend
node scripts/find-model.js
```

This will search your entire project for model files.

### Step 2: Place Model in Correct Location

Once you find your model file, place it in one of these locations:

**Option 1: In `ai` folder (Recommended)**
```
Research-Project/
  └── ai/
      └── driver_safety_model.h5  ← Copy your model here
```

**Option 2: In `ai/models` subfolder**
```
Research-Project/
  └── ai/
      └── models/
          └── driver_safety_model.h5  ← Or here
```

**Option 3: Custom location**
If your model has a different name or location, add to `backend/.env`:
```bash
MODEL_PATH=ai/your_model_name.h5
```

### Step 3: Install Python (If Not Installed)

**Check if Python is installed:**
```bash
python --version
```

**If not installed:**
1. Download from: https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart your terminal/command prompt

### Step 4: Install Python Dependencies

```bash
cd ai
pip install -r requirements.txt
```

Or install manually:
```bash
pip install tensorflow keras numpy pillow
```

### Step 5: Test Python Script

Test if your model works:

```bash
cd ai
python inference.py path/to/test/image.jpg path/to/your/model.h5 --json
```

**Expected output:**
```json
{
  "success": true,
  "label": "normal",
  "confidence": 0.95,
  "probabilities": {
    "normal": 0.95,
    "abnormal": 0.03,
    "unresponsive": 0.02
  }
}
```

### Step 6: Configure Backend

**Option A: Model in default location**
- Place model at: `ai/driver_safety_model.h5`
- No configuration needed

**Option B: Custom model path**
Add to `backend/.env`:
```bash
MODEL_PATH=ai/your_model_name.h5
PYTHON_COMMAND=python
```

### Step 7: Restart Backend Server

```bash
cd backend
npm start
```

**Look for these messages:**
```
[AI SERVICE] ✅ Model file found! Using: [path]
[INFERENCE] Loading model from: [path]
[INFERENCE] Model loaded successfully
```

### Step 8: Test with Image Upload

Upload an image through the frontend. You should see:

```
[AI SERVICE] ✅ Model file found! Using: [path]
[INFERENCE] Loading model from: [path]
[INFERENCE] Model loaded successfully
[AI SERVICE] Detection result: [category] -> [risk level] (confidence: [value])
```

**Instead of:**
```
[SIMULATED DETECTION] ⚠️  Using random fallback detection
```

## Troubleshooting

### "Python was not found"

**Windows:**
- Install Python from python.org
- Make sure "Add to PATH" is checked during installation
- Or set in `backend/.env`: `PYTHON_COMMAND=py` (if using Python Launcher)

**Verify:**
```bash
python --version
# or
py --version
```

### "Model file not found"

1. Run: `node backend/scripts/find-model.js`
2. Check the exact path where your model is
3. Either move it to `ai/driver_safety_model.h5` or set `MODEL_PATH` in `.env`

### "ModuleNotFoundError: No module named 'tensorflow'"

```bash
cd ai
pip install tensorflow keras numpy pillow
```

### Model loads but gives errors

**Check:**
1. Model input shape should be `(224, 224, 3)`
2. Model should output 3 classes: `['normal', 'abnormal', 'unresponsive']`
3. Model format should be `.h5` (Keras) or `.keras`

### Still using simulated detection?

1. Check server logs for model path
2. Verify model file exists at that path
3. Check Python is working: `python --version`
4. Test inference script manually
5. Restart backend server

## Quick Checklist

- [ ] Model file exists (`.h5` or `.keras`)
- [ ] Model is in `ai/` folder or path set in `.env`
- [ ] Python is installed and in PATH
- [ ] Python dependencies installed (`tensorflow`, `keras`, etc.)
- [ ] Backend server restarted
- [ ] Check logs for "Model loaded successfully"

## Need Help?

1. Run: `node backend/scripts/find-model.js` to locate your model
2. Check server logs when uploading an image
3. Look for `[AI SERVICE]` messages in logs
4. Verify Python works: `python inference.py [image] [model] --json`





