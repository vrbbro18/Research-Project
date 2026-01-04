from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# Try to import optional modules
try:
    import cv2
    cv2_available = True
except ImportError:
    cv2 = None
    cv2_available = False
    print("OpenCV not available. Image processing will fail.")

try:
    import numpy as np
    numpy_available = True
except ImportError:
    np = None
    numpy_available = False
    print("NumPy not available. Numerical operations will fail.")

try:
    from tensorflow.keras.models import load_model
    tensorflow_available = True
except ImportError:
    load_model = None
    tensorflow_available = False
    print("TensorFlow not available. Model loading will be skipped.")

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
DROWSINESS_MODEL_PATH = 'models/drowsiness_model.h5'
EMOTION_MODEL_PATH = 'models/emotion_model.h5'

# Load models robustly
print("Loading models... Please wait.")
drowsiness_model = None
emotion_model = None
emotion_model_available = False

if tensorflow_available:
    try:
        drowsiness_model = load_model(DROWSINESS_MODEL_PATH)
        print("✅ Drowsiness model loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading drowsiness model: {e}")
        print("Drowsiness model is required. Exiting.")
        exit(1)

    try:
        emotion_model = load_model(EMOTION_MODEL_PATH)
        emotion_model_available = True
        print("✅ Emotion model loaded successfully!")
    except Exception as e:
        print(f"❌ Emotion model not found: {e}")
        print("Using default emotion 'neutral' for demo purposes.")
        emotion_model_available = False
else:
    print("TensorFlow not available. Models cannot be loaded. Using defaults.")

# Labels
drowsiness_labels = {0: 'Closed', 1: 'Open'}
emotion_labels = ['angry', 'disgusted', 'fearful', 'happy', 'neutral', 'sad', 'surprised']

def preprocess_image(image_path):
    if not cv2_available or not numpy_available:
        raise Exception("OpenCV or NumPy not available for image processing.")
    
    img = cv2.imread(image_path)
    
    # Convert BGR to RGB (OpenCV fix)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize to (128, 128)
    img = cv2.resize(img, (128, 128))
    
    # Normalize pixel values (1./255)
    img = img / 255.0
    
    # Expand dimensions to match model input (1, 128, 128, 3)
    img = np.expand_dims(img, axis=0)
    return img

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check for manual emotion override
    manual_emotion = request.form.get('manual_emotion', '').strip()
    
    # Save temporarily
    temp_path = 'temp.jpg'
    file.save(temp_path)
    
    try:
        # Preprocess
        if not cv2_available:
            raise Exception("OpenCV not available for image processing.")
        
        processed_img = preprocess_image(temp_path)
        
        # Step 1: Check Drowsiness (High Risk)
        if drowsiness_model is None:
            status = 'Unknown'
            risk_level = 'UNKNOWN'
            print("Decision: Drowsiness model not available, status Unknown")
        else:
            drowsiness_pred = drowsiness_model.predict(processed_img)[0][0]
            if drowsiness_pred < 0.5:
                status = 'Drowsy'
                risk_level = 'HIGH'
                print(f"Decision: Drowsiness prediction {drowsiness_pred:.4f} < 0.5 → Status: Drowsy (HIGH Risk)")
            else:
                status = 'Awake'
                risk_level = 'MEDIUM/LOW'
                print(f"Decision: Drowsiness prediction {drowsiness_pred:.4f} >= 0.5 → Status: Awake (MEDIUM/LOW Risk)")
        
        # Step 2: Predict Emotion (with Manual Override)
        if manual_emotion and manual_emotion != 'Detect Automatically':
            emotion = manual_emotion.lower()
            print(f"🔧 Manual Override: Using emotion '{emotion}' (skipping model prediction)")
        else:
            # Run Emotion Model
            if emotion_model_available and emotion_model is not None:
                emotion_pred = emotion_model.predict(processed_img)[0]
                if numpy_available:
                    emotion_index = np.argmax(emotion_pred)
                    emotion = emotion_labels[emotion_index]
                    print(f"Emotion prediction: {emotion} (prob: {emotion_pred[emotion_index]:.4f})")
                else:
                    emotion = 'neutral'
                    print("NumPy not available, defaulting to 'neutral'")
            else:
                emotion = 'neutral'
                print("Emotion model not available, defaulting to 'neutral'")
        
        # Step 3: Refined Decision Matrix (Strict Logic)
        action = "NO_ACTION"
        
        if status == 'Drowsy':
            # Case 1: Drowsy (High Risk)
            if emotion == 'sad':
                action = 'PLAY_FAST_HAPPY'
                print("Decision: Drowsy + Sad → PLAY_FAST_HAPPY (Wake up + Cheer up)")
            else:
                action = 'PLAY_ALARM'
                print("Decision: Drowsy + Not Sad → PLAY_ALARM (Immediate wake up)")
        elif status == 'Awake':
            # Case 2: Awake (Medium/Low Risk)
            if emotion == 'sad':
                action = 'PLAY_UPBEAT_MUSIC'
                print("Decision: Awake + Sad → PLAY_UPBEAT_MUSIC (Mood boost)")
            elif emotion == 'angry':
                action = 'PLAY_CALM_MUSIC'
                print("Decision: Awake + Angry → PLAY_CALM_MUSIC (Relax)")
            else:
                action = 'NO_ACTION'
                print("Decision: Awake + Safe emotion → NO_ACTION")
        elif status == 'Unknown':
            action = 'NO_ACTION'
            print("Decision: Status unknown → NO_ACTION")
        
        message = f"Driver is {status} with {emotion} emotion. Risk: {risk_level}. Action: {action}"
        
        return jsonify({
            'status': status,
            'emotion': emotion,
            'action': action,
            'risk_level': risk_level,
            'message': message
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)