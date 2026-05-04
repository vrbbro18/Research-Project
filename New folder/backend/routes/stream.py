# ── routes/stream.py ─────────────────────────────────────────
# Flask blueprint: MJPEG live stream, real-time status, and research analytics.
#
# Endpoints:
#   GET /video_feed  — MJPEG multipart stream of annotated frames
#   GET /status      — JSON: real-time EAR / MAR / alert / emotion / yawn
#   GET /research    — JSON: full research analytics (same shape as /analyze)
#                      This is polled by React every 5 s to drive the charts
#                      and music-therapy decision logic.

import time
from collections import deque
import cv2
import numpy as np

from flask import Blueprint, Response, jsonify, request

from config import EMOTION_LABELS, EAR_THRESHOLD, MAR_THRESHOLD, LIVE_ANALYTICS_MAX_POINTS
import models as _models
from image_processing import cv2_available, detect_face_and_eyes_from_frame, preprocess_for_drowsiness, preprocess_for_emotion
from hybrid_fusion import register_snapshot_observation, get_fused_decision

from research import (
    get_minute_by_minute_analysis,
    predict_current_minute,
    predict_future_drowsiness,
    get_current_minute_metrics,
    generate_structured_analysis,
    generate_insights,
    determine_music_action,
)

stream_bp = Blueprint("stream", __name__)

# Will be set by app.py after the engine is created
_engine = None
_live_analytics_points = deque(maxlen=LIVE_ANALYTICS_MAX_POINTS)


def set_engine(engine) -> None:
    global _engine
    _engine = engine


def _push_live_point(point: dict) -> None:
    _live_analytics_points.append(point)


# ── /video_feed ──────────────────────────────────────────────

@stream_bp.route("/video_feed")
def video_feed():
    """
    MJPEG multipart stream consumed by React as:
        <img src="http://127.0.0.1:5000/video_feed" />
    Delivers the latest annotated frame at ~30 fps.
    """
    def _generate():
        while True:
            if _engine:
                jpeg = _engine.get_latest_frame()
                if jpeg:
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + jpeg + b"\r\n"
                    )
            time.sleep(0.033)   # cap at ~30 fps

    return Response(
        _generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


# ── /status ──────────────────────────────────────────────────

@stream_bp.route("/status")
def status():
    """
    Real-time detection snapshot (polled every 500 ms by React).
    Returns: ear, mar, model_status, model_conf, emotion,
             ear_alert, model_alert, alert, yawn, face_detected
    """
    if _engine is None:
        return jsonify({"error": "Detector engine not running"}), 503
    return jsonify(_engine.get_status())


# ── /research ────────────────────────────────────────────────

@stream_bp.route("/research")
def research():
    """
    Full research analytics payload (polled every 5 s by React).
    Returns the EXACT same JSON shape as the legacy /analyze endpoint
    so all existing Recharts components and music-therapy logic work
    without any changes to their data-consumption code.
    """
    if _engine is None:
        return jsonify({"error": "Detector engine not running"}), 503

    snap            = _engine.get_status()
    current_status  = snap.get("model_status", "Unknown")
    current_emotion = snap.get("emotion",       "neutral")
    current_ear     = snap.get("ear",           1.0)
    current_mar     = snap.get("mar",           0.0)
    current_yawn    = snap.get("yawn",          False)

    minute_analysis  = get_minute_by_minute_analysis()
    cur_min_pred     = predict_current_minute(minute_analysis)
    future_preds     = predict_future_drowsiness(minute_analysis, cur_min_pred)
    cur_metrics      = get_current_minute_metrics()
    structured       = generate_structured_analysis()
    insights         = generate_insights()
    fused            = get_fused_decision()

    decision_status = fused.get("status", current_status) if fused else current_status
    decision_emotion = fused.get("emotion", current_emotion) if fused else current_emotion
    risk_level = fused.get("risk_level", "HIGH" if current_status == "Drowsy" else "MEDIUM/LOW") if fused else ("HIGH" if current_status == "Drowsy" else "MEDIUM/LOW")

    action           = determine_music_action(
        "Awake" if decision_status == "Uncertain" else decision_status,
        decision_emotion,
        structured,
        future_preds,
    )

    return jsonify({
        # ── Core fields (same as /analyze) ────────────────
        "status":                     decision_status,
        "emotion":                    decision_emotion,
        "action":                     action,
        "risk_level":                 risk_level,
        "message": (
            f"Driver is {decision_status} with {decision_emotion} emotion. "
            f"Risk: {risk_level}. Action: {action}"
        ),
        "frontend_ear":               current_ear,
        "frontend_mar":               current_mar,
        "live_model_status":          current_status,
        "live_model_emotion":         current_emotion,
        "live_yawn":                  current_yawn,
        "emotion_raw":                fused.get("emotion_raw") if fused else current_emotion,
        "emotion_reason":             fused.get("emotion_reason") if fused else "raw",

        # ── Research / chart fields ────────────────────────
        "minute_analysis":            minute_analysis,
        "current_minute_prediction":  cur_min_pred,
        "current_minute_metrics":     cur_metrics,
        "future_predictions":         future_preds,
        "insights":                   insights,
        "structured_analysis":        structured,
        "hybrid_decision":            fused,
    })


@stream_bp.route("/live_analytics")
def live_analytics():
    """
    1-second analytics payload for advanced live frontend charts.
    Keeps a rolling in-memory second-level timeline while preserving
    existing minute summaries via /research.
    """
    if _engine is None:
        return jsonify({"error": "Detector engine not running"}), 503

    now_ts = time.time()
    snap = _engine.get_status()
    fused = get_fused_decision(now_ts)

    minute_analysis = get_minute_by_minute_analysis()
    cur_min_pred = predict_current_minute(minute_analysis)
    future_preds = predict_future_drowsiness(minute_analysis, cur_min_pred)

    point = {
        "ts": round(now_ts, 3),
        "label": time.strftime("%H:%M:%S", time.localtime(now_ts)),
        "risk_prob": fused.get("risk_prob", 0.0) if fused else 0.0,
        "status": fused.get("status", snap.get("model_status", "Unknown")) if fused else snap.get("model_status", "Unknown"),
        "uncertain": bool(fused.get("uncertain", False)) if fused else False,
        "disagreement": float(fused.get("disagreement", 0.0)) if fused else 0.0,
        "source_probs": fused.get("source_probs", {"live": None, "snapshot": None}) if fused else {"live": None, "snapshot": None},
        "ear": float(snap.get("ear", 1.0) or 1.0),
        "mar": float(snap.get("mar", 0.0) or 0.0),
        "yawn": bool(snap.get("yawn", False)),
        "emotion_raw": fused.get("emotion_raw", snap.get("emotion", "neutral")) if fused else snap.get("emotion", "neutral"),
        "emotion_display": fused.get("emotion", snap.get("emotion", "neutral")) if fused else snap.get("emotion", "neutral"),
        "emotion_reason": fused.get("emotion_reason", "raw") if fused else "raw",
    }
    _push_live_point(point)

    return jsonify({
        "point": point,
        "live_points": list(_live_analytics_points),
        "current_minute_prediction": cur_min_pred,
        "future_predictions": future_preds,
        "hybrid_decision": fused,
    })


@stream_bp.route("/snapshot_probe", methods=["POST"])
def snapshot_probe():
    """
    Run a 3-second snapshot inference on the latest live frame.
    Intended to be called by the frontend in webcam mode so both
    live-thread and snapshot-path signals are present for fusion.
    """
    if _engine is None:
        return jsonify({"error": "Detector engine not running"}), 503
    if not cv2_available:
        return jsonify({"error": "OpenCV not available"}), 503

    jpeg = _engine.get_latest_frame()
    if not jpeg:
        return jsonify({"error": "No live frame available"}), 503

    frame = cv2.imdecode(np.frombuffer(jpeg, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        return jsonify({"error": "Failed to decode frame"}), 500

    payload = request.get_json(silent=True) or {}
    manual_emotion = str(payload.get("manual_emotion", "")).strip()
    manual_drowsiness = str(payload.get("manual_drowsiness", "")).strip()

    frontend_ear = payload.get("frontend_ear")
    frontend_mar = payload.get("frontend_mar")
    frontend_yawn = bool(payload.get("frontend_yawn", False))

    try:
        frontend_ear = float(frontend_ear) if frontend_ear is not None else None
    except Exception:
        frontend_ear = None

    try:
        frontend_mar = float(frontend_mar) if frontend_mar is not None else None
    except Exception:
        frontend_mar = None

    face_region, eye_region = detect_face_and_eyes_from_frame(frame)

    # Drowsiness
    pred = None
    if manual_drowsiness and manual_drowsiness != "Detect Automatically":
        status = manual_drowsiness
        model_conf = 1.0
    elif _models.drowsiness_model is None:
        status = "Unknown"
        model_conf = 0.5
    else:
        pred = _models.drowsiness_model.predict(preprocess_for_drowsiness(eye_region), verbose=0)[0][0]
        if pred < 0.5:
            status = "Drowsy"
            model_conf = float(1.0 - pred)
        else:
            status = "Awake"
            model_conf = float(pred)

    # Emotion
    if manual_emotion and manual_emotion != "Detect Automatically":
        emotion = manual_emotion.lower()
        emotion_conf = 1.0
    elif _models.emotion_model_available and _models.emotion_model is not None:
        probs = _models.emotion_model.predict(preprocess_for_emotion(face_region), verbose=0)[0]
        idx = int(np.argmax(probs))
        emotion = EMOTION_LABELS[idx].lower()
        emotion_conf = float(probs[idx])
    else:
        emotion = "neutral"
        emotion_conf = 0.5

    if pred is not None:
        drowsy_prob = float(1.0 - pred)
    else:
        drowsy_prob = 1.0 if status == "Drowsy" else 0.0 if status == "Awake" else 0.5

    perclos_proxy = 0.0
    if frontend_ear is not None:
        perclos_proxy = float(np.clip((EAR_THRESHOLD - frontend_ear) / 0.08, 0.0, 1.0) * 100.0)

    yawn_proxy = 100.0 if frontend_yawn else 0.0
    if frontend_mar is not None and frontend_mar > MAR_THRESHOLD:
        yawn_proxy = max(yawn_proxy, float(np.clip(((frontend_mar - MAR_THRESHOLD) / 0.20) + 0.50, 0.0, 1.0) * 100.0))

    register_snapshot_observation({
        "timestamp": time.time(),
        "status": status,
        "confidence": model_conf,
        "emotion": emotion,
        "emotion_confidence": emotion_conf,
        "risk_prob": drowsy_prob,
        "ear": frontend_ear,
        "mar": frontend_mar,
        "yawn": frontend_yawn,
        "perclos": perclos_proxy,
        "yawn_pct": yawn_proxy,
        "source": "webcam_snapshot",
    })

    fused = get_fused_decision()

    return jsonify({
        "status": "ok",
        "snapshot": {
            "model_status": status,
            "model_conf": round(model_conf, 4),
            "emotion": emotion,
            "drowsy_prob": round(drowsy_prob, 4),
        },
        "hybrid_decision": fused,
    })
