# Testing the Driver Safety API with Postman

## Setup

1. **Ensure the backend is running:**
   ```bash
   cd backend
   python app.py
   ```
   Server should be running at: `http://127.0.0.1:5000`

## Test Case 1: Basic Image Analysis (Auto-detect Emotion)

### Request Configuration:
- **Method:** `POST`
- **URL:** `http://127.0.0.1:5000/analyze`
- **Headers:** (automatically set by Postman for multipart/form-data)

### Body:
1. Select **Body** tab
2. Choose **form-data**
3. Add the following key-value pair:
   - **Key:** `file` (change type to "File" using dropdown)
   - **Value:** Click "Select Files" and choose an image file

### Send & Verify Response:
Expected JSON response:
```json
{
  "status": "Awake",
  "emotion": "Happy",
  "action": "NO_ACTION",
  "risk_level": "MEDIUM/LOW",
  "message": "Driver is Awake with Happy emotion. Risk: MEDIUM/LOW. Action: NO_ACTION"
}
```

---

## Test Case 2: Manual Emotion Override

### Request Configuration:
- **Method:** `POST`
- **URL:** `http://127.0.0.1:5000/analyze`

### Body (form-data):
Add two key-value pairs:
1. **Key:** `file` (type: File)
   - **Value:** Select an image file

2. **Key:** `manual_emotion` (type: Text)
   - **Value:** `sad` (or any of: `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`)

### Send & Verify Response:
The emotion in the response should match your manual override:
```json
{
  "status": "Awake",
  "emotion": "sad",
  "action": "PLAY_UPBEAT_MUSIC",
  "risk_level": "MEDIUM/LOW",
  "message": "Driver is Awake with sad emotion. Risk: MEDIUM/LOW. Action: PLAY_UPBEAT_MUSIC"
}
```

---

## Test Case 3: Testing Different Scenarios

### Scenario A: Drowsy + Sad (Should trigger PLAY_FAST_HAPPY)
- **file:** Upload an image that looks drowsy (closed eyes)
- **manual_emotion:** `sad`

Expected action: `PLAY_FAST_HAPPY`

### Scenario B: Drowsy + Any other emotion (Should trigger PLAY_ALARM)
- **file:** Upload a drowsy image
- **manual_emotion:** `angry` or `happy` or `neutral`

Expected action: `PLAY_ALARM`

### Scenario C: Awake + Sad (Should trigger PLAY_UPBEAT_MUSIC)
- **file:** Upload an awake image (open eyes)
- **manual_emotion:** `sad`

Expected action: `PLAY_UPBEAT_MUSIC`

### Scenario D: Awake + Angry (Should trigger PLAY_CALM_MUSIC)
- **file:** Upload an awake image
- **manual_emotion:** `angry`

Expected action: `PLAY_CALM_MUSIC`

### Scenario E: Awake + Safe emotion (Should be NO_ACTION)
- **file:** Upload an awake image
- **manual_emotion:** `happy` or `neutral`

Expected action: `NO_ACTION`

---

## Common Errors & Solutions

### Error 400: "No file provided"
- **Cause:** Missing or incorrect file parameter
- **Solution:** Ensure key name is exactly `file` and type is set to "File"

### Error 500: "OpenCV not available"
- **Cause:** Required libraries not installed
- **Solution:** Install dependencies: `pip install opencv-python numpy tensorflow`

### Error: Model loading failed
- **Cause:** Model files missing from `models/` directory
- **Solution:** Ensure `drowsiness_model.h5` and `emotion_model.h5` exist in backend/models/

---

## Testing Tips

1. **Save Test Cases:** Save your Postman requests in a collection for easy reuse
2. **Use Environment Variables:** Set `{{base_url}}` = `http://127.0.0.1:5000` 
3. **Test with Various Images:** Try different facial expressions and eye states
4. **Check Terminal Output:** The backend logs detailed decision-making in the terminal
5. **Response Time:** Initial request may be slower due to model warm-up

---

## Sample Terminal Output

When you send a request, you should see output like this in your terminal:

```
Decision: Drowsiness prediction 0.8234 >= 0.5 → Status: Awake (MEDIUM/LOW Risk)
🔧 Manual Override: Using emotion 'sad' (skipping model prediction)
Decision: Awake + Sad → PLAY_UPBEAT_MUSIC (Mood boost)
127.0.0.1 - - [05/Jan/2026 14:51:23] "POST /analyze HTTP/1.1" 200 -
```

---

## Emotion Labels Reference

The model recognizes these 7 emotions:
- `Angry` (0)
- `Disgust` (1)
- `Fear` (2)
- `Happy` (3)
- `Sad` (4)
- `Surprise` (5)
- `Neutral` (6)

When using manual_emotion, you can send lowercase versions: `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`
