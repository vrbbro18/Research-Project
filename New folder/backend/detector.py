# ── detector.py ─────────────────────────────────────────────
# Standalone multithreaded driver drowsiness detector.
#
# Architecture:
#   Main Thread  — cv2.VideoCapture → MediaPipe FaceLandmarker → EAR/MAR/draw → display
#   Background   — Keras (drowsiness + emotion) inference every 3 seconds
#   Alert System — pygame MP3 (or winsound fallback) + driver_log.txt
#
# Run: python detector.py
# Quit: press 'q' in the video window

import sys
import os
import threading
import queue
import time
import datetime

import cv2
import numpy as np

# ── Optional audio backends ──────────────────────────────────
try:
    import pygame
    pygame.mixer.pre_init(44100, -16, 2, 512)
    pygame.mixer.init()
    _pygame_available = True
except Exception:
    _pygame_available = False

try:
    import winsound
    _winsound_available = True
except ImportError:
    _winsound_available = False

# ── MediaPipe (Tasks API — mediapipe >= 0.10.x) ─────────────
try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions, RunningMode
except ImportError:
    print("ERROR: mediapipe not installed. Run:  pip install mediapipe")
    sys.exit(1)

# ── Config ──────────────────────────────────────────────────
from config import (
    EAR_THRESHOLD,
    MAR_THRESHOLD,
    INFERENCE_INTERVAL,
    EAR_CONSEC_FRAMES,
    ALERT_COOLDOWN_S,
    EMOTION_LABELS,
)

# ── Load Keras models at startup ────────────────────────────
from models import load_drowsiness_only

try:
    _drowsiness_model, _emotion_model = load_drowsiness_only()
except RuntimeError as e:
    print(f"ERROR: {e}")
    sys.exit(1)

_emotion_available = _emotion_model is not None

# ── MediaPipe face landmarker model path ─────────────────────
_FACE_TASK_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
if not os.path.exists(_FACE_TASK_PATH):
    print(f"ERROR: face_landmarker.task not found at {_FACE_TASK_PATH}")
    print("Download it with:")
    print("  python -c \"import urllib.request; urllib.request.urlretrieve("
          "'https://storage.googleapis.com/mediapipe-models/face_landmarker/"
          "face_landmarker/float16/1/face_landmarker.task', 'face_landmarker.task')\"")
    sys.exit(1)

# ── Shared state (protected by state_lock) ──────────────────
state_lock   = threading.Lock()
model_status = "Initializing..."
model_conf   = 0.0
model_emotion = "neutral"

# ── Thread control ──────────────────────────────────────────
stop_event  = threading.Event()
frame_queue = queue.Queue(maxsize=1)   # maxsize=1 → always newest frame

# ── Alert state ─────────────────────────────────────────────
_SCRIPT_DIR       = os.path.dirname(os.path.abspath(__file__))
LOG_FILE          = os.path.join(_SCRIPT_DIR, "driver_log.txt")
ALERT_SOUND_PATH  = os.path.join(_SCRIPT_DIR, "alert.mp3")
_last_alert_sound = 0.0
_last_log_time    = 0.0
LOG_THROTTLE_S    = 2.0   # write to log at most every 2 s while alert is active

# ── MediaPipe Face Mesh landmark index groups ────────────────
# Standard 6-point EAR indices (same for new FaceLandmarker model)
_LEFT_EYE  = [362, 385, 387, 263, 373, 380]
_RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# 8-point MAR: left-corner, right-corner,
#              top-left, bottom-left, top-center, bottom-center, top-right, bottom-right
_MOUTH = [61, 291, 39, 181, 0, 17, 269, 405]

# ── Maths ───────────────────────────────────────────────────
def _ear(pts: np.ndarray) -> float:
    """Standard 6-point Eye Aspect Ratio."""
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return float((A + B) / (2.0 * C)) if C > 0 else 1.0


def _mar(pts: np.ndarray) -> float:
    """8-point Mouth Aspect Ratio."""
    A = np.linalg.norm(pts[2] - pts[3])
    B = np.linalg.norm(pts[6] - pts[7])
    C = np.linalg.norm(pts[4] - pts[5])
    D = np.linalg.norm(pts[0] - pts[1])
    return float((A + B + C) / (2.0 * D)) if D > 0 else 0.0


def _lm_px(norm_lm, indices, w, h) -> np.ndarray:
    """Convert NormalizedLandmark list + index list → pixel coords array."""
    return np.array([[norm_lm[i].x * w, norm_lm[i].y * h] for i in indices],
                    dtype=np.float32)


# ── Image preprocessing (for background thread) ─────────────
def _pre_drowsiness(eye_region: np.ndarray) -> np.ndarray:
    if len(eye_region.shape) == 2:
        img = cv2.cvtColor(eye_region, cv2.COLOR_GRAY2RGB)
    else:
        img = cv2.cvtColor(eye_region, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (128, 128)).astype("float32") / 255.0
    return np.expand_dims(img, axis=0)


def _pre_emotion(face_gray: np.ndarray) -> np.ndarray:
    img = cv2.resize(face_gray, (48, 48)).astype("float32") / 255.0
    return np.expand_dims(np.expand_dims(img, axis=0), axis=-1)


def _detect_face_eye(frame: np.ndarray):
    """
    Haar-cascade face+eye detection on a BGR numpy frame.
    Fully self-contained — no Flask/image_processing imports needed.
    Returns (face_gray, eye_bgr); falls back to full frame on failure.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml")

    faces = face_cascade.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
    if len(faces) == 0:
        return gray, frame

    x, y, w, h = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
    face_gray  = gray[y:y+h, x:x+w]
    face_color = frame[y:y+h, x:x+w]

    eye_zone = face_gray[0:int(h * 0.6), :]
    eyes = eye_cascade.detectMultiScale(eye_zone, 1.1, 3, minSize=(20, 20))

    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[0])
        x1, y1, w1, h1 = eyes[0]
        x2, y2, w2, h2 = eyes[1]
        ex = min(x1, x2); ey = min(y1, y2)
        ew = max(x1+w1, x2+w2) - ex
        eh = max(y1+h1, y2+h2) - ey
        px, py = int(ew*0.2), int(eh*0.2)
        ex = max(0, ex-px); ey = max(0, ey-py)
        ew = min(face_color.shape[1]-ex, ew+2*px)
        eh = min(face_color.shape[0]-ey, eh+2*py)
        eye_region = face_color[ey:ey+eh, ex:ex+ew]
    else:
        eye_region = face_color[0:int(h*0.6), :]

    return face_gray, eye_region


# ── Alert & Logging ─────────────────────────────────────────
def _log_alert(reason: str, ear_val: float, status: str, emotion: str) -> None:
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = (f"[{ts}] ALERT | Reason: {reason} | "
             f"EAR: {ear_val:.3f} | Model: {status} | Emotion: {emotion}\n")
    with open(LOG_FILE, "a", encoding="utf-8") as fh:
        fh.write(entry)
    print(f"[LOG] {entry.strip()}")


def _play_alert_sound() -> None:
    global _last_alert_sound
    now = time.time()
    if now - _last_alert_sound < ALERT_COOLDOWN_S:
        return
    _last_alert_sound = now

    if _pygame_available and os.path.exists(ALERT_SOUND_PATH):
        try:
            if not pygame.mixer.music.get_busy():
                pygame.mixer.music.load(ALERT_SOUND_PATH)
                pygame.mixer.music.play()
            return
        except Exception:
            pass  # fall through

    if _winsound_available:
        threading.Thread(
            target=lambda: winsound.Beep(1000, 600),
            daemon=True, name="AlertBeep").start()


# ── Drawing utilities ───────────────────────────────────────
_FONT = cv2.FONT_HERSHEY_SIMPLEX


def _rounded_rect(img, pt1, pt2, color, radius=14, thickness=2):
    x1, y1 = pt1;  x2, y2 = pt2;  r = radius
    cv2.line(img, (x1+r, y1), (x2-r, y1), color, thickness)
    cv2.line(img, (x1+r, y2), (x2-r, y2), color, thickness)
    cv2.line(img, (x1, y1+r), (x1, y2-r), color, thickness)
    cv2.line(img, (x2, y1+r), (x2, y2-r), color, thickness)
    cv2.ellipse(img, (x1+r, y1+r), (r, r), 180,  0, 90, color, thickness)
    cv2.ellipse(img, (x2-r, y1+r), (r, r), 270,  0, 90, color, thickness)
    cv2.ellipse(img, (x1+r, y2-r), (r, r),  90,  0, 90, color, thickness)
    cv2.ellipse(img, (x2-r, y2-r), (r, r),   0,  0, 90, color, thickness)


def _crosshair(img, center, size=12, color=(0, 255, 220), thickness=1):
    cx, cy = int(center[0]), int(center[1])
    cv2.line(img, (cx-size, cy), (cx+size, cy), color, thickness, cv2.LINE_AA)
    cv2.line(img, (cx, cy-size), (cx, cy+size), color, thickness, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), size//2, color, 1, cv2.LINE_AA)


def _text_bg(img, text, pos, scale=0.55, color=(255,255,255), bg=(8,8,28), thick=1):
    (tw, th), _ = cv2.getTextSize(text, _FONT, scale, thick)
    x, y = pos
    cv2.rectangle(img, (x-3, y-th-5), (x+tw+3, y+5), bg, -1)
    cv2.putText(img, text, (x, y), _FONT, scale, color, thick, cv2.LINE_AA)


# ── Background Inference Thread ─────────────────────────────
def _inference_worker() -> None:
    global model_status, model_conf, model_emotion

    while not stop_event.is_set():
        try:
            frame = frame_queue.get(timeout=3.5)
        except queue.Empty:
            continue

        try:
            face_gray, eye_region = _detect_face_eye(frame)

            # Drowsiness
            pred       = _drowsiness_model.predict(_pre_drowsiness(eye_region), verbose=0)[0][0]
            new_status = "Awake" if pred > 0.5 else "Drowsy"
            new_conf   = float(pred if pred > 0.5 else 1.0 - pred)

            # Emotion
            if _emotion_available:
                probs       = _emotion_model.predict(_pre_emotion(face_gray), verbose=0)[0]
                new_emotion = EMOTION_LABELS[int(np.argmax(probs))].lower()
            else:
                new_emotion = "neutral"

            with state_lock:
                model_status  = new_status
                model_conf    = new_conf
                model_emotion = new_emotion

            print(f"[BG] Drowsiness={new_status} ({new_conf:.0%}) | Emotion={new_emotion}")

        except Exception as exc:
            print(f"[BG] Inference error: {exc}")


# ── Main ────────────────────────────────────────────────────
def main() -> None:
    global _last_log_time

    # ── Start background thread ──────────────────────────────
    bg_thread = threading.Thread(
        target=_inference_worker, name="InferenceThread", daemon=True)
    bg_thread.start()
    print("[INFO] Background inference thread started.")

    # ── Open webcam ─────────────────────────────────────────
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Cannot open webcam.")
        stop_event.set()
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # ── MediaPipe FaceLandmarker (Tasks API) ─────────────────
    base_opts = mp_python.BaseOptions(model_asset_path=_FACE_TASK_PATH)
    fl_opts   = FaceLandmarkerOptions(
        base_options=base_opts,
        running_mode=RunningMode.IMAGE,   # one-shot per frame — no async callback
        num_faces=1,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    face_landmarker = FaceLandmarker.create_from_options(fl_opts)

    last_inference_time = 0.0
    ear_consec_count    = 0
    alert_active        = False

    print("[INFO] Detector running — press 'q' to quit.")
    print(f"[INFO] Alert log -> {LOG_FILE}")
    if os.path.exists(ALERT_SOUND_PATH):
        print(f"[INFO] Alert sound -> {ALERT_SOUND_PATH}")
    elif _winsound_available:
        print("[INFO] Alert sound -> winsound.Beep (fallback)")
    else:
        print("[WARN] No audio backend — visual alerts only.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        h, w = frame.shape[:2]

        # ── MediaPipe inference (every frame) ────────────────
        mp_image  = mp.Image(image_format=mp.ImageFormat.SRGB,
                             data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        detection = face_landmarker.detect(mp_image)

        ear           = 1.0
        mar           = 0.0
        face_detected = False

        if detection.face_landmarks:
            face_detected = True
            lm = detection.face_landmarks[0]   # list of NormalizedLandmark

            left_pts  = _lm_px(lm, _LEFT_EYE,  w, h)
            right_pts = _lm_px(lm, _RIGHT_EYE, w, h)
            mouth_pts = _lm_px(lm, _MOUTH,     w, h)

            ear = (_ear(left_pts) + _ear(right_pts)) / 2.0
            mar = _mar(mouth_pts)

            # ── Face bounding box ────────────────────────────
            all_x = [pt.x * w for pt in lm]
            all_y = [pt.y * h for pt in lm]
            bx1 = max(0,  int(min(all_x)) - 12)
            by1 = max(0,  int(min(all_y)) - 12)
            bx2 = min(w,  int(max(all_x)) + 12)
            by2 = min(h,  int(max(all_y)) + 12)

            bbox_color = (0, 60, 220) if alert_active else (0, 210, 90)
            _rounded_rect(frame, (bx1, by1), (bx2, by2), bbox_color, 12, 2)

            # ── Eye crosshairs ───────────────────────────────
            _crosshair(frame, np.mean(left_pts,  axis=0))
            _crosshair(frame, np.mean(right_pts, axis=0))

        # ── Read shared model state ──────────────────────────
        with state_lock:
            m_status  = model_status
            m_conf    = model_conf
            m_emotion = model_emotion

        # ── Consecutive-frame EAR counter ───────────────────
        if face_detected and ear < EAR_THRESHOLD:
            ear_consec_count += 1
        else:
            ear_consec_count = 0

        ear_alert    = (ear_consec_count >= EAR_CONSEC_FRAMES) and face_detected
        model_alert  = (m_status == "Drowsy")
        alert_active = ear_alert or model_alert

        # ── Alert: sound + log + visual overlay ─────────────
        if alert_active:
            reasons = []
            if ear_alert:   reasons.append(f"EAR={ear:.3f}<{EAR_THRESHOLD}")
            if model_alert: reasons.append("Model=Drowsy")

            _play_alert_sound()

            now = time.time()
            if now - _last_log_time >= LOG_THROTTLE_S:
                _log_alert(", ".join(reasons), ear, m_status, m_emotion)
                _last_log_time = now

            # Red semi-transparent overlay
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, h), (0, 0, 180), -1)
            cv2.addWeighted(overlay, 0.20, frame, 0.80, 0, frame)

            # Large alert banner
            banner = "DROWSINESS ALERT!"
            (bw2, bh2), _ = cv2.getTextSize(banner, _FONT, 1.3, 3)
            bx = (w - bw2) // 2;  by = h // 2 + bh2 // 2
            cv2.putText(frame, banner, (bx+2, by+2), _FONT, 1.3, (0,0,60),   4, cv2.LINE_AA)
            cv2.putText(frame, banner, (bx,   by),   _FONT, 1.3, (0,60,255), 3, cv2.LINE_AA)

            reason_str = " | ".join(reasons)
            (rw2, _), _ = cv2.getTextSize(reason_str, _FONT, 0.5, 1)
            cv2.putText(frame, reason_str, ((w-rw2)//2, by+34),
                        _FONT, 0.5, (220, 180, 180), 1, cv2.LINE_AA)

        # ── HUD: top status bar ──────────────────────────────
        panel = frame.copy()
        cv2.rectangle(panel, (0, 0), (w, 72), (8, 8, 28), -1)
        cv2.addWeighted(panel, 0.70, frame, 0.30, 0, frame)

        # EAR
        ear_col = (0, 60, 220) if ear < EAR_THRESHOLD else (0, 200, 80)
        _text_bg(frame, f"EAR: {ear:.3f}", (12, 30), 0.68, ear_col, (8,8,28), 2)

        # MAR
        mar_col = (0, 180, 255) if mar > MAR_THRESHOLD else (160, 160, 160)
        _text_bg(frame, f"MAR: {mar:.3f}", (12, 58), 0.52, mar_col, (8,8,28), 1)

        # Model status (centred)
        ms_col  = (0, 60, 220) if m_status == "Drowsy" else (
                   (0, 200, 80) if m_status == "Awake" else (160, 160, 160))
        ms_text = f"Model: {m_status} ({m_conf:.0%})" if m_conf > 0 else f"Model: {m_status}"
        (mw2, _), _ = cv2.getTextSize(ms_text, _FONT, 0.68, 2)
        _text_bg(frame, ms_text, ((w - mw2)//2, 30), 0.68, ms_col, (8,8,28), 2)

        # Emotion (smaller, below model status)
        emo_text = f"Emotion: {m_emotion}"
        (ew2, _), _ = cv2.getTextSize(emo_text, _FONT, 0.48, 1)
        _text_bg(frame, emo_text, ((w - ew2)//2, 58), 0.48, (190, 190, 190), (8,8,28), 1)

        # No-face indicator (top-right)
        if not face_detected:
            _text_bg(frame, "No Face Detected", (w - 210, 30), 0.58, (0,200,255), (8,8,28), 1)

        # Next-scan countdown (bottom-right)
        now2     = time.time()
        next_inf = max(0.0, INFERENCE_INTERVAL - (now2 - last_inference_time))
        _text_bg(frame, f"Next scan: {next_inf:.1f}s", (w - 175, h - 12),
                 0.45, (130, 130, 130), (8, 8, 28), 1)

        # ── Send frame to background thread every N seconds ──
        if now2 - last_inference_time >= INFERENCE_INTERVAL:
            try:
                frame_queue.put_nowait(frame.copy())
                last_inference_time = now2
            except queue.Full:
                pass

        cv2.imshow("Driver Drowsiness Monitor", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # ── Cleanup ─────────────────────────────────────────────
    print("[INFO] Shutting down...")
    stop_event.set()
    face_landmarker.close()
    bg_thread.join(timeout=6)
    cap.release()
    cv2.destroyAllWindows()
    if _pygame_available:
        pygame.mixer.quit()
    print("[INFO] Detector stopped.")


if __name__ == "__main__":
    main()
