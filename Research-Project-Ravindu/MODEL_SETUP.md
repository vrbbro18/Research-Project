# AI Model Setup Guide

## Current Issue: Getting "Normal" and "Low" Risk for All Images

### Problem
You're seeing "category: normal" and "risk level: Low" for all images because:

1. **The AI model file is missing** (`models/driver_safety_model.h5`)
2. The system falls back to **simulated detection** which randomly returns results
3. Simulated detection has a 60% chance of returning "normal" (low risk)

### Solution Options

#### Option 1: Train Your Model (Recommended)

You have a dataset ready at `driver_dataset/` with:
- `train/` - Training images (normal, abnormal, unresponsive)
- `test/` - Test images
- `val/` - Validation images

**Steps to train:**

1. Create a training script (`ai/train.py`) or use an existing one
2. Train the model using your dataset
3. Save the model to `models/driver_safety_model.h5`

**Example training script structure:**
```python
# ai/train.py
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Load and preprocess your dataset
# Build model (MobileNetV2 based)
# Train the model
# Save to models/driver_safety_model.h5
```

#### Option 2: Use Pre-trained Model

If you have a pre-trained model:
1. Place it at: `models/driver_safety_model.h5`
2. Ensure it matches the expected format (3 classes: normal, abnormal, unresponsive)
3. Restart the server

#### Option 3: Test with Different Risk Levels (Temporary)

For testing purposes, you can modify the simulated detection probabilities in:
`backend/services/detection.service.js` (line ~204-219)

Change the random thresholds:
```javascript
if (random < 0.33) {  // 33% high risk
  riskLevel = 'high';
  category = 'unresponsive';
} else if (random < 0.66) {  // 33% medium risk
  riskLevel = 'medium';
  category = 'abnormal';
} else {  // 33% low risk
  riskLevel = 'low';
  category = 'normal';
}
```

### Checking Model Status

When you start the server, check the console logs:

**If model is working:**
```
[AI SERVICE] Calling Python inference script
[AI SERVICE] Model loaded successfully
[AI SERVICE] Detection result: abnormal -> medium (confidence: 0.9234)
```

**If model is missing (current situation):**
```
❌ [AI SERVICE] Python inference failed: Model file not found
⚠️  [AI SERVICE] Falling back to simulated detection
[SIMULATED DETECTION] ⚠️  Using random fallback detection
```

### Model Requirements

- **Format:** Keras H5 model (`.h5` file)
- **Input:** Images resized to 224x224, normalized [0-1]
- **Output:** 3 classes: `['normal', 'abnormal', 'unresponsive']`
- **Architecture:** Should match MobileNetV2 or compatible architecture

### File Structure Expected

```
Research-Project/
├── models/
│   └── driver_safety_model.h5  ← Model file should be here
├── ai/
│   ├── inference.py
│   ├── train.py (if you create it)
│   └── requirements.txt
└── backend/
    └── services/
        └── detection.service.js
```

### Python Requirements

Make sure you have installed:
```bash
cd ai
pip install -r requirements.txt
```

Required packages:
- tensorflow
- keras
- numpy
- Pillow

### Testing After Model Setup

1. Restart the backend server
2. Upload a test image
3. Check console logs - should see `[AI SERVICE] Detection result` instead of `[SIMULATED DETECTION]`
4. The risk level should now be based on actual AI prediction, not random

### Need Help?

If you need help creating a training script, let me know and I can create one based on your dataset structure.

