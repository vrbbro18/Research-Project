# Model Setup Guide - Using Your Trained Model

## Quick Setup

### Step 1: Place Your Model File

Place your trained model file in one of these locations:

**Option 1: In `ai` folder (Recommended)**
```
Research-Project/
  └── ai/
      └── driver_safety_model.h5  ← Place your model here
```

**Option 2: In `ai/models` subfolder**
```
Research-Project/
  └── ai/
      └── models/
          └── driver_safety_model.h5  ← Or here
```

**Option 3: In `models` folder (root)**
```
Research-Project/
  └── models/
      └── driver_safety_model.h5  ← Or here
```

### Step 2: Configure Model Path (Optional)

If your model has a different name or location, add to `backend/.env`:

```bash
MODEL_PATH=ai/your_model_name.h5
```

### Step 3: Install Python Dependencies

Make sure Python and required libraries are installed:

```bash
cd ai
pip install -r requirements.txt
```

Or install manually:
```bash
pip install tensorflow keras numpy pillow
```

### Step 4: Fix Python Command (Windows)

On Windows, the system now automatically uses `python` instead of `python3`.

If you still have issues, add to `backend/.env`:
```bash
PYTHON_COMMAND=python
```

### Step 5: Test the Model

Restart your backend server and upload an image. You should see:

```
[AI SERVICE] ✅ Found model file: [path to your model]
[INFERENCE] Loading model from: [path]
[INFERENCE] Model loaded successfully
[AI SERVICE] Detection result: [category] -> [risk level] (confidence: [value])
```

## Supported Model Formats

- `.h5` (Keras HDF5 format) ✅ Recommended
- `.keras` (Keras SavedModel format) ✅
- `.pkl` (Pickle format) ⚠️ May need adjustments

## Model Requirements

Your model should:
1. Accept input shape: `(224, 224, 3)` (RGB images)
2. Output 3 classes: `['normal', 'abnormal', 'unresponsive']`
3. Return probabilities for each class

## Troubleshooting

### Issue: "Python was not found"

**Solution:**
1. Install Python from python.org
2. Make sure Python is in your PATH
3. Or set `PYTHON_COMMAND=python` in `backend/.env`

### Issue: "Model file not found"

**Solution:**
1. Check the model file location
2. Make sure the file extension is `.h5` or `.keras`
3. Set `MODEL_PATH` in `backend/.env` with the full path

### Issue: "ModuleNotFoundError: No module named 'tensorflow'"

**Solution:**
```bash
cd ai
pip install tensorflow keras numpy pillow
```

### Issue: Model loads but gives wrong results

**Check:**
1. Model input shape matches `(224, 224, 3)`
2. Model outputs 3 classes in order: `['normal', 'abnormal', 'unresponsive']`
3. Model was trained with the same preprocessing (resize to 224x224, normalize by 255)

## Current Configuration

The system will automatically:
- ✅ Search for model files in `ai` folder
- ✅ Use `python` command on Windows (instead of `python3`)
- ✅ Show detailed logs when model is found/not found
- ✅ Fall back to simulated detection if model not available

## Verify Your Setup

Run this to check if everything is configured:

```bash
cd backend
node -e "
const fs = require('fs');
const path = require('path');
const aiFolder = path.join(__dirname, '../ai');
console.log('Checking for model files...');
if (fs.existsSync(aiFolder)) {
  const files = fs.readdirSync(aiFolder);
  const models = files.filter(f => /\.(h5|keras|pkl)$/i.test(f));
  if (models.length > 0) {
    console.log('✅ Found model files:', models);
  } else {
    console.log('❌ No model files found in ai folder');
  }
} else {
  console.log('❌ ai folder not found');
}
"
```

## Next Steps

Once your model is in place:
1. Restart the backend server
2. Upload a test image
3. Check the logs - you should see real AI detection instead of simulated
4. The system will use your trained model for all predictions





