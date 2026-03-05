# Quick Fix: Use Your Trained Model

## The Problem

Your system is using **simulated (demo) data** because:
1. ❌ **Model file not found** - No `.h5` or `.keras` file in the `ai` folder
2. ❌ **Python not installed** - Python is not in your system PATH

## Quick Solution

### Step 1: Find Your Model File

**Where did you save your trained model?**
- Check where you ran the training script
- Look in the folder where training output was saved
- Check if it's named something other than `driver_safety_model.h5`

**To search for it:**
```bash
cd backend
node scripts/find-model.js
```

### Step 2: Copy Model to ai Folder

Once you find your model file (`.h5` or `.keras`), copy it to:

```
Research-Project/
  └── ai/
      └── driver_safety_model.h5  ← Copy your model here and rename if needed
```

**Or if it has a different name, add to `backend/.env`:**
```bash
MODEL_PATH=ai/your_actual_model_name.h5
```

### Step 3: Install Python

**Windows:**
1. Download Python from: https://www.python.org/downloads/
2. **IMPORTANT:** During installation, check ✅ **"Add Python to PATH"**
3. Restart your terminal/command prompt
4. Verify: `python --version` or `py --version`

**Alternative (if Python Launcher is available):**
- The system now tries `py` command first (Python Launcher)
- This might work even if `python` doesn't

### Step 4: Install Python Libraries

```bash
cd ai
pip install -r requirements.txt
```

Or:
```bash
pip install tensorflow keras numpy pillow
```

### Step 5: Test Your Model

Test if it works:
```bash
cd ai
python inference.py path/to/test/image.jpg ai/driver_safety_model.h5 --json
```

### Step 6: Restart Backend

```bash
cd backend
npm start
```

**Look for:**
```
[AI SERVICE] ✅ Model file found! Using: [path]
[INFERENCE] Model loaded successfully
```

**NOT:**
```
[SIMULATED DETECTION] ⚠️  Using random fallback detection
```

## What Changed

I've updated the system to:
- ✅ Auto-search for model files in `ai` folder
- ✅ Use `py` command on Windows (Python Launcher)
- ✅ Better error messages showing where to place model
- ✅ Script to find your model: `node backend/scripts/find-model.js`

## Current Status

- ❌ Model file: **Not found** (need to place it in `ai/` folder)
- ❌ Python: **Not installed** (need to install Python)
- ✅ System: **Ready to use model once above is fixed**

## Next Steps

1. **Find your model file** - Where did you save it after training?
2. **Copy to `ai/driver_safety_model.h5`**
3. **Install Python** - Download from python.org
4. **Install dependencies** - `pip install tensorflow keras numpy pillow`
5. **Restart server** - `npm start` in backend folder

Once done, the system will use your **real trained model** instead of simulated data!





