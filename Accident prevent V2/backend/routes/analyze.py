# ── routes/analyze.py ───────────────────────────────────────
# Blueprint for the /analyze endpoint.

import os
import time

from flask import Blueprint, request, jsonify
import numpy as np

from config import EMOTION_LABELS
import models as _models
from image_processing import cv2_available, detect_face_and_eyes, preprocess_for_drowsiness, preprocess_for_emotion
from research import (
    add_record, get_minute_by_minute_analysis, 
    predict_future_drowsiness, predict_current_minute, 
    clear_session, get_current_minute_metrics,
    generate_insights, generate_structured_analysis,
    determine_music_action
)

analyze_bp = Blueprint('analyze', __name__)

# Use absolute path for Windows compatibility and to avoid Errno 22/13
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_IMAGE_PATH = os.path.join(BASE_DIR, 'temp_upload.jpg')


@analyze_bp.route('/reset', methods=['POST'])
def reset():
    clear_session()
    return jsonify({'status': 'success', 'message': 'Session history cleared'})


@analyze_bp.route('/analyze', methods=['POST'])
def analyze():
    # ── Validate request ─────────────────────────────────────
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    manual_emotion    = request.form.get('manual_emotion', '').strip()
    manual_drowsiness = request.form.get('manual_drowsiness', '').strip()

    try:
        # Save file to temp location
        file.save(TEMP_IMAGE_PATH)

        if not cv2_available:
            raise RuntimeError("OpenCV not available for image processing.")

        face_region, eye_region = detect_face_and_eyes(TEMP_IMAGE_PATH)

        # ── Step 1: Drowsiness ───────────────────────────────
        frontend_ear_str = request.form.get('frontend_ear')
        frontend_ear = None

        if manual_drowsiness and manual_drowsiness != 'Detect Automatically':
            status     = manual_drowsiness
            risk_level = 'HIGH' if status == 'Drowsy' else 'MEDIUM/LOW'
            print(f"🔧 Manual override → drowsiness='{status}'")

        elif _models.drowsiness_model is None:
            status     = 'Unknown'
            risk_level = 'UNKNOWN'
            print("⚠️  Drowsiness model unavailable → status Unknown")

        else:
            pred = _models.drowsiness_model.predict(preprocess_for_drowsiness(eye_region), verbose=0)[0][0]
            if pred < 0.5:
                status, risk_level = 'Drowsy', 'HIGH'
                print(f"Drowsiness pred={pred:.4f} → Drowsy (HIGH)")
            else:
                status, risk_level = 'Awake', 'MEDIUM/LOW'
                print(f"Drowsiness pred={pred:.4f} → Awake (MEDIUM/LOW)")

        # ── Step 1.5: Dual-Way Verification Override ──────────
        if frontend_ear_str:
            try:
                frontend_ear = float(frontend_ear_str)
                # If explicit closed eyes (EAR < 0.22), forcefully override to Drowsy
                if frontend_ear < 0.22 and status == 'Awake':
                    status = 'Drowsy'
                    risk_level = 'HIGH'
                    print(f"👁️ Dual-Way Vision: Frontend overriding backend, Eyes Closed! (EAR {frontend_ear:.3f})")
                # If explicit open eyes (EAR > 0.26), forcefully override to Awake
                elif frontend_ear > 0.26 and status == 'Drowsy':
                    status = 'Awake'
                    risk_level = 'MEDIUM/LOW'
                    print(f"👁️ Dual-Way Vision: Frontend overriding backend, Eyes Open! (EAR {frontend_ear:.3f})")
            except ValueError:
                pass

        # ── Step 2: Emotion ──────────────────────────────────
        if manual_emotion and manual_emotion != 'Detect Automatically':
            emotion = manual_emotion.lower()
            print(f"🔧 Manual override → emotion='{emotion}'")

        elif _models.emotion_model_available and _models.emotion_model is not None:
            probs         = _models.emotion_model.predict(preprocess_for_emotion(face_region), verbose=0)[0]
            emotion_index = int(np.argmax(probs))
            emotion       = EMOTION_LABELS[emotion_index].lower()
            print("📊 Emotion probabilities:")
            for idx, label in EMOTION_LABELS.items():
                print(f"   {label}: {probs[idx]:.4f}")
            print(f"🎯 Final: {emotion} (p={probs[emotion_index]:.4f})")
        else:
            emotion = 'neutral'
            print("Emotion model unavailable → 'neutral'")

        # ── Step 3: Research tracking & Intelligence ─────────
        # Add current frame to history before deciding action
        add_record(status, emotion, time.time())
        minute_analysis          = get_minute_by_minute_analysis()
        current_minute_pred      = predict_current_minute(minute_analysis)
        future_predictions       = predict_future_drowsiness(minute_analysis, current_minute_pred)
        
        structured_analysis = generate_structured_analysis()
        insights = generate_insights()

        # ── Step 4: Action decision matrix ───────────────────
        action = determine_music_action(status, emotion, structured_analysis, future_predictions)

        print(f"Decision: {status} + {emotion} → {action}")

        message = f"Driver is {status} with {emotion} emotion. Risk: {risk_level}. Action: {action}"

        return jsonify({
            'status':                   status,
            'emotion':                  emotion,
            'action':                   action,
            'risk_level':               risk_level,
            'frontend_ear':             frontend_ear,
            'message':                  message,
            'minute_analysis':          minute_analysis,
            'current_minute_prediction': current_minute_pred,
            'current_minute_metrics':    get_current_minute_metrics(),
            'future_predictions':       future_predictions,
            'insights':                 generate_insights(),
            'structured_analysis':      generate_structured_analysis()
        })

    except Exception as e:
        print(f"❌ Error in /analyze: {e}")
        return jsonify({'error': str(e)}), 500

    finally:
        # Robustly try to remove the temp file
        try:
            if os.path.exists(TEMP_IMAGE_PATH):
                os.remove(TEMP_IMAGE_PATH)
        except Exception as e:
            print(f"⚠️ Could not remove temp file: {e}")

