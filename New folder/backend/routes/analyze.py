# ── routes/analyze.py ───────────────────────────────────────
# Blueprint for the /analyze endpoint.

import os
import time

from flask import Blueprint, request, jsonify
import numpy as np

from config import EMOTION_LABELS, EAR_THRESHOLD, MAR_THRESHOLD
import models as _models
from image_processing import cv2_available, detect_face_and_eyes, preprocess_for_drowsiness, preprocess_for_emotion
from hybrid_fusion import register_snapshot_observation, get_fused_decision, reset_hybrid_state
from research import (
    add_record, get_minute_by_minute_analysis, 
    predict_future_drowsiness, predict_current_minute, 
    clear_session, get_current_minute_metrics,
    generate_insights, generate_structured_analysis,
    determine_music_action
)

analyze_bp = Blueprint('analyze', __name__)

TEMP_IMAGE_PATH = 'temp.jpg'


@analyze_bp.route('/reset', methods=['POST'])
def reset():
    clear_session()
    reset_hybrid_state()
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
    source            = request.form.get('source', 'upload').strip().lower()

    file.save(TEMP_IMAGE_PATH)

    try:
        if not cv2_available:
            raise RuntimeError("OpenCV not available for image processing.")

        face_region, eye_region = detect_face_and_eyes(TEMP_IMAGE_PATH)

        # ── Step 1: Drowsiness ───────────────────────────────
        frontend_ear_str = request.form.get('frontend_ear')
        frontend_mar_str = request.form.get('frontend_mar')
        frontend_yawn_str = request.form.get('frontend_yawn')
        frontend_ear = None
        frontend_mar = None
        frontend_yawn = False
        pred = None

        if manual_drowsiness and manual_drowsiness != 'Detect Automatically':
            status     = manual_drowsiness
            risk_level = 'HIGH' if status == 'Drowsy' else 'MEDIUM/LOW'
            print(f"🔧 Manual override → drowsiness='{status}'")

        elif _models.drowsiness_model is None:
            status     = 'Unknown'
            risk_level = 'UNKNOWN'
            print("⚠️  Drowsiness model unavailable → status Unknown")

        else:
            pred = _models.drowsiness_model.predict(preprocess_for_drowsiness(eye_region))[0][0]
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

        if frontend_mar_str:
            try:
                frontend_mar = float(frontend_mar_str)
            except ValueError:
                frontend_mar = None

        if frontend_yawn_str:
            frontend_yawn = str(frontend_yawn_str).lower() in ('1', 'true', 'yes', 'y')

        # ── Step 2: Emotion ──────────────────────────────────
        if manual_emotion and manual_emotion != 'Detect Automatically':
            emotion = manual_emotion.lower()
            print(f"🔧 Manual override → emotion='{emotion}'")

        elif _models.emotion_model_available and _models.emotion_model is not None:
            probs         = _models.emotion_model.predict(preprocess_for_emotion(face_region))[0]
            emotion_index = int(np.argmax(probs))
            emotion       = EMOTION_LABELS[emotion_index].lower()
            emotion_conf  = float(probs[emotion_index])
            print("📊 Emotion probabilities:")
            for idx, label in EMOTION_LABELS.items():
                print(f"   {label}: {probs[idx]:.4f}")
            print(f"🎯 Final: {emotion} (p={probs[emotion_index]:.4f})")
        else:
            emotion = 'neutral'
            emotion_conf = 0.50
            print("Emotion model unavailable → 'neutral'")

        if manual_emotion and manual_emotion != 'Detect Automatically':
            emotion_conf = 1.00

        if manual_drowsiness and manual_drowsiness != 'Detect Automatically':
            drowsy_prob = 1.00 if status == 'Drowsy' else 0.00
            model_conf = 1.00
        elif pred is not None:
            drowsy_prob = float(1.0 - pred)
            model_conf = float(max(pred, 1.0 - pred))
        else:
            drowsy_prob = 1.00 if status == 'Drowsy' else 0.00 if status == 'Awake' else 0.50
            model_conf = 0.50

        perclos_proxy = 0.0
        if frontend_ear is not None:
            perclos_proxy = float(np.clip((EAR_THRESHOLD - frontend_ear) / 0.08, 0.0, 1.0) * 100.0)

        yawn_proxy = 100.0 if frontend_yawn else 0.0
        if frontend_mar is not None and frontend_mar > MAR_THRESHOLD:
            yawn_proxy = max(yawn_proxy, float(np.clip(((frontend_mar - MAR_THRESHOLD) / 0.20) + 0.50, 0.0, 1.0) * 100.0))

        # ── Step 3: Research tracking & Intelligence ─────────
        # Add current frame to history before deciding action
        now_ts = time.time()
        register_snapshot_observation({
            'timestamp': now_ts,
            'status': status,
            'confidence': model_conf,
            'emotion': emotion,
            'emotion_confidence': emotion_conf,
            'risk_prob': drowsy_prob,
            'ear': frontend_ear,
            'mar': frontend_mar,
            'yawn': frontend_yawn,
            'perclos': perclos_proxy,
            'yawn_pct': yawn_proxy,
            'source': source,
        })

        # Avoid doubling timeline frequency in webcam hybrid mode.
        if source != 'webcam_snapshot':
            add_record(status, emotion, now_ts, perclos_proxy, yawn_proxy)

        minute_analysis          = get_minute_by_minute_analysis()
        current_minute_pred      = predict_current_minute(minute_analysis)
        future_predictions       = predict_future_drowsiness(minute_analysis, current_minute_pred)
        
        structured_analysis = generate_structured_analysis()
        insights = generate_insights()

        fused = get_fused_decision()
        decision_status = fused.get('status', status) if fused else status
        decision_emotion = fused.get('emotion', emotion) if fused else emotion
        decision_risk = fused.get('risk_level', risk_level) if fused else risk_level

        # Keep Unknown fallback unchanged.
        if decision_status == 'Uncertain':
            decision_risk = 'MEDIUM/LOW'

        # ── Step 4: Action decision matrix ───────────────────
        action = determine_music_action(
            'Awake' if decision_status == 'Uncertain' else decision_status,
            decision_emotion,
            structured_analysis,
            future_predictions,
        )

        print(f"Decision: {decision_status} + {decision_emotion} → {action}")

        message = f"Driver is {decision_status} with {decision_emotion} emotion. Risk: {decision_risk}. Action: {action}"

        return jsonify({
            'status':                   decision_status,
            'emotion':                  decision_emotion,
            'emotion_raw':              fused.get('emotion_raw', emotion) if fused else emotion,
            'emotion_reason':           fused.get('emotion_reason', 'raw') if fused else 'raw',
            'action':                   action,
            'risk_level':               decision_risk,
            'frontend_ear':             frontend_ear,
            'frontend_mar':             frontend_mar,
            'message':                  message,
            'minute_analysis':          minute_analysis,
            'current_minute_prediction': current_minute_pred,
            'current_minute_metrics':    get_current_minute_metrics(),
            'future_predictions':       future_predictions,
            'insights':                 generate_insights(),
            'structured_analysis':      generate_structured_analysis(),
            'snapshot_model_status':    status,
            'snapshot_model_emotion':   emotion,
            'snapshot_model_conf':      round(model_conf, 4),
            'hybrid_decision':          fused,
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if os.path.exists(TEMP_IMAGE_PATH):
            os.remove(TEMP_IMAGE_PATH)
