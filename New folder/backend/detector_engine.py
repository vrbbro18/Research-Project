# ── detector_engine.py ──────────────────────────────────────
# Headless driver monitoring engine designed to run inside Flask.
#
# DetectorEngine owns cv2.VideoCapture, runs MediaPipe FaceLandmarker
# on every frame (EAR / MAR / blink-safe alert / yawn visualisation),
# and fires Keras model inference every 3 seconds in a background thread.
#
# Thread-safe API consumed by Flask routes:
#   engine.get_latest_frame()  -> JPEG bytes (or None)
#   engine.get_status()        -> dict with current detection state
#
# No cv2.imshow — all output goes through get_latest_frame().

import os
import threading
import queue
import time
import datetime

import cv2
import numpy as np

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python.vision import (
        FaceLandmarker, FaceLandmarkerOptions, RunningMode,
    )
    _mp_available = True
except ImportError:
    _mp_available = False

import models as _models                 # uses singletons set by load_all_models()
from config import (
    EAR_THRESHOLD, MAR_THRESHOLD,
    INFERENCE_INTERVAL, EAR_CLOSED_SECONDS,
    EMOTION_LABELS,
)
from research import add_record
from hybrid_fusion import register_live_observation

# ── File paths ───────────────────────────────────────────────
_HERE           = os.path.dirname(os.path.abspath(__file__))
LOG_FILE        = os.path.join(_HERE, "driver_log.txt")
_FACE_TASK_PATH = os.path.join(_HERE, "face_landmarker.task")

# ── MediaPipe landmark index groups ─────────────────────────
_LEFT_EYE  = [362, 385, 387, 263, 373, 380]
_RIGHT_EYE = [33,  160, 158, 133, 153, 144]
_MOUTH     = [61, 291, 39, 181, 0, 17, 269, 405]
_UPPER_LIP = 13    # upper-lip centre landmark
_LOWER_LIP = 14    # lower-lip centre landmark
_LIP_LEFT  = 61    # left mouth corner
_LIP_RIGHT = 291   # right mouth corner

_FONT = cv2.FONT_HERSHEY_SIMPLEX
LOG_THROTTLE_S = 2.0


# ── Maths ────────────────────────────────────────────────────
def _ear(pts: np.ndarray) -> float:
    A = np.linalg.norm(pts[1] - pts[5])
    B = np.linalg.norm(pts[2] - pts[4])
    C = np.linalg.norm(pts[0] - pts[3])
    return float((A + B) / (2.0 * C)) if C > 0 else 1.0


def _mar(pts: np.ndarray) -> float:
    A = np.linalg.norm(pts[2] - pts[3])
    B = np.linalg.norm(pts[6] - pts[7])
    C = np.linalg.norm(pts[4] - pts[5])
    D = np.linalg.norm(pts[0] - pts[1])
    return float((A + B + C) / (2.0 * D)) if D > 0 else 0.0


def _lm_px(lm, indices, w, h) -> np.ndarray:
    return np.array([[lm[i].x * w, lm[i].y * h] for i in indices],
                    dtype=np.float32)


# ── Preprocessing (background thread) ───────────────────────
def _pre_drowsiness(eye_region: np.ndarray) -> np.ndarray:
    img = (cv2.cvtColor(eye_region, cv2.COLOR_GRAY2RGB)
           if len(eye_region.shape) == 2
           else cv2.cvtColor(eye_region, cv2.COLOR_BGR2RGB))
    img = cv2.resize(img, (128, 128)).astype("float32") / 255.0
    return np.expand_dims(img, axis=0)


def _pre_emotion(face_gray: np.ndarray) -> np.ndarray:
    img = cv2.resize(face_gray, (48, 48)).astype("float32") / 255.0
    return np.expand_dims(np.expand_dims(img, axis=0), axis=-1)


def _detect_face_eye(frame: np.ndarray):
    """Haar-cascade face+eye detection for the background inference thread."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    fc = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    ec = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_eye.xml")
    faces = fc.detectMultiScale(gray, 1.1, 4, minSize=(30, 30))
    if len(faces) == 0:
        return gray, frame
    x, y, w, h = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
    fg = gray[y:y+h, x:x+w]
    fc_ = frame[y:y+h, x:x+w]
    ez = fg[0:int(h*0.6), :]
    eyes = ec.detectMultiScale(ez, 1.1, 3, minSize=(20, 20))
    if len(eyes) >= 2:
        eyes = sorted(eyes, key=lambda e: e[0])
        x1, y1, w1, h1 = eyes[0]; x2, y2, w2, h2 = eyes[1]
        ex = min(x1, x2); ey = min(y1, y2)
        ew = max(x1+w1, x2+w2) - ex; eh = max(y1+h1, y2+h2) - ey
        px, py = int(ew*0.2), int(eh*0.2)
        ex = max(0, ex-px); ey = max(0, ey-py)
        ew = min(fc_.shape[1]-ex, ew+2*px); eh = min(fc_.shape[0]-ey, eh+2*py)
        return fg, fc_[ey:ey+eh, ex:ex+ew]
    return fg, fc_[0:int(h*0.6), :]


# ── Drawing helpers ──────────────────────────────────────────
def _rounded_rect(img, pt1, pt2, color, radius=14, thickness=2):
    x1, y1 = pt1; x2, y2 = pt2; r = radius
    cv2.line(img, (x1+r, y1), (x2-r, y1), color, thickness)
    cv2.line(img, (x1+r, y2), (x2-r, y2), color, thickness)
    cv2.line(img, (x1, y1+r), (x1, y2-r), color, thickness)
    cv2.line(img, (x2, y1+r), (x2, y2-r), color, thickness)
    cv2.ellipse(img, (x1+r, y1+r), (r, r), 180,  0, 90, color, thickness)
    cv2.ellipse(img, (x2-r, y1+r), (r, r), 270,  0, 90, color, thickness)
    cv2.ellipse(img, (x1+r, y2-r), (r, r),  90,  0, 90, color, thickness)
    cv2.ellipse(img, (x2-r, y2-r), (r, r),   0,  0, 90, color, thickness)


def _crosshair(img, center, size=12, color=(0, 255, 220), thick=1):
    cx, cy = int(center[0]), int(center[1])
    cv2.line(img, (cx-size, cy), (cx+size, cy), color, thick, cv2.LINE_AA)
    cv2.line(img, (cx, cy-size), (cx, cy+size), color, thick, cv2.LINE_AA)
    cv2.circle(img, (cx, cy), size//2, color, 1, cv2.LINE_AA)


def _text_bg(img, text, pos, scale=0.55, color=(255, 255, 255),
             bg=(8, 8, 28), thick=1):
    (tw, th), _ = cv2.getTextSize(text, _FONT, scale, thick)
    x, y = pos
    cv2.rectangle(img, (x-3, y-th-5), (x+tw+3, y+5), bg, -1)
    cv2.putText(img, text, (x, y), _FONT, scale, color, thick, cv2.LINE_AA)


# ── Engine ───────────────────────────────────────────────────
class DetectorEngine:
    """
    Headless, thread-safe driver monitoring engine.
    Call start() once after Flask has called load_all_models().
    """

    def __init__(self):
        if not _mp_available:
            raise RuntimeError("mediapipe is not installed.")
        if not os.path.exists(_FACE_TASK_PATH):
            raise RuntimeError(
                f"face_landmarker.task not found at {_FACE_TASK_PATH}. "
                "Download it first — see README."
            )

        self._frame_lock  = threading.Lock()
        self._status_lock = threading.Lock()

        self._latest_jpeg: bytes | None = None

        # Real-time status dict exposed via get_status()
        self._status = {
            "ear":          1.0,
            "mar":          0.0,
            "model_status": "Initializing...",
            "model_conf":   0.0,
            "emotion":      "neutral",
            "emotion_conf": 0.0,
            "ear_alert":    False,
            "model_alert":  False,
            "alert":        False,
            "yawn":         False,
            "face_detected": False,
        }

        self._tally_lock         = threading.Lock()
        self._frames_evaluated   = 0
        self._frames_eyes_closed = 0
        self._frames_yawning     = 0

        self._stop        = threading.Event()
        self._frame_queue = queue.Queue(maxsize=1)   # newest frame only
        self._last_log    = 0.0

    # ── Public API ───────────────────────────────────────────

    def start(self) -> None:
        """Starts the main capture loop and background inference thread."""
        threading.Thread(
            target=self._inference_worker,
            name="InferenceThread", daemon=True).start()
        threading.Thread(
            target=self._main_loop,
            name="DetectorMain", daemon=True).start()
        print("[DetectorEngine] Started.")

    def stop(self) -> None:
        self._stop.set()

    def get_latest_frame(self) -> bytes | None:
        with self._frame_lock:
            return self._latest_jpeg

    def get_status(self) -> dict:
        with self._status_lock:
            return dict(self._status)

    # ── Internal helpers ─────────────────────────────────────

    def _upd(self, patch: dict) -> None:
        with self._status_lock:
            self._status.update(patch)

    def _log_alert(self, reason: str, ear: float,
                   status: str, emotion: str) -> None:
        ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = (f"[{ts}] ALERT | {reason} | "
                f"EAR:{ear:.3f} | Model:{status} | Emotion:{emotion}\n")
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as fh:
                fh.write(line)
        except Exception:
            pass
        print(f"[LOG] {line.strip()}")

    # ── Background inference thread ──────────────────────────

    def _inference_worker(self) -> None:
        """Runs Keras model every 3 s and feeds research history."""
        while not self._stop.is_set():
            try:
                frame = self._frame_queue.get(timeout=3.5)
            except queue.Empty:
                continue
            try:
                face_gray, eye_region = _detect_face_eye(frame)

                # Drowsiness
                pred = _models.drowsiness_model.predict(
                    _pre_drowsiness(eye_region), verbose=0)[0][0]
                new_status = "Awake" if pred > 0.5 else "Drowsy"
                new_conf   = float(pred if pred > 0.5 else 1.0 - pred)

                # Emotion
                if _models.emotion_model_available and _models.emotion_model:
                    probs       = _models.emotion_model.predict(
                        _pre_emotion(face_gray), verbose=0)[0]
                    emo_idx = int(np.argmax(probs))
                    new_emotion = EMOTION_LABELS[emo_idx].lower()
                    new_emotion_conf = float(probs[emo_idx])
                else:
                    new_emotion = "neutral"
                    new_emotion_conf = 0.50

                self._upd({
                    "model_status": new_status,
                    "model_conf":   new_conf,
                    "emotion":      new_emotion,
                    "emotion_conf": new_emotion_conf,
                })

                # Calculate PERCLOS and Yawn percentages from the 30Hz high-speed loop
                with self._tally_lock:
                    f_eval   = self._frames_evaluated
                    f_closed = self._frames_eyes_closed
                    f_yawn   = self._frames_yawning
                    self._frames_evaluated   = 0
                    self._frames_eyes_closed = 0
                    self._frames_yawning     = 0
                
                perclos  = (f_closed / max(1, f_eval)) * 100.0
                yawn_pct = (f_yawn / max(1, f_eval)) * 100.0

                # Feed research timeline (Hybrid Decision Engine)
                now_ts = time.time()
                add_record(new_status, new_emotion, now_ts, perclos, yawn_pct)

                with self._status_lock:
                    cur_ear = float(self._status.get("ear", 1.0))
                    cur_mar = float(self._status.get("mar", 0.0))
                    cur_face = bool(self._status.get("face_detected", False))

                register_live_observation({
                    "timestamp": now_ts,
                    "status": new_status,
                    "confidence": new_conf,
                    "emotion": new_emotion,
                    "emotion_confidence": new_emotion_conf,
                    "perclos": perclos,
                    "yawn_pct": yawn_pct,
                    "ear": cur_ear,
                    "mar": cur_mar,
                    "yawn": yawn_pct >= 25.0,
                    "face_detected": cur_face,
                })

                print(f"[BG] {new_status} ({new_conf:.0%}) | {new_emotion} | PERCLOS: {perclos:.1f}% | Yawn: {yawn_pct:.1f}%")

            except Exception as exc:
                print(f"[BG] Inference error: {exc}")

    # ── Main capture loop ────────────────────────────────────

    def _main_loop(self) -> None:
        """Runs on its own thread. Captures → MediaPipe → annotate → JPEG."""
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[DetectorEngine] ERROR: Cannot open webcam.")
            return

        cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        # Build MediaPipe FaceLandmarker
        base_opts = mp_python.BaseOptions(model_asset_path=_FACE_TASK_PATH)
        fl_opts   = FaceLandmarkerOptions(
            base_options=base_opts,
            running_mode=RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=0.5,
            min_face_presence_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        face_lm = FaceLandmarker.create_from_options(fl_opts)

        last_infer_t   = 0.0
        eyes_closed_t  = None   # timestamp when eyes first went below threshold
        ear_alert      = False
        alert_active   = False

        while not self._stop.is_set():
            ret, frame = cap.read()
            if not ret:
                break
            h, w = frame.shape[:2]

            # ── MediaPipe (every frame) ──────────────────────
            mp_img    = mp.Image(image_format=mp.ImageFormat.SRGB,
                                 data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            detection = face_lm.detect(mp_img)

            ear = 1.0; mar = 0.0; yawn = False; face_detected = False

            if detection.face_landmarks:
                face_detected = True
                lm = detection.face_landmarks[0]

                left_pts  = _lm_px(lm, _LEFT_EYE,  w, h)
                right_pts = _lm_px(lm, _RIGHT_EYE, w, h)
                mouth_pts = _lm_px(lm, _MOUTH,     w, h)

                ear  = (_ear(left_pts) + _ear(right_pts)) / 2.0
                mar  = _mar(mouth_pts)
                yawn = mar > MAR_THRESHOLD

                with self._tally_lock:
                    self._frames_evaluated += 1
                    if ear < EAR_THRESHOLD:
                        self._frames_eyes_closed += 1
                    if yawn:
                        self._frames_yawning += 1

                # ── Face bounding box ────────────────────────
                all_x = [pt.x * w for pt in lm]
                all_y = [pt.y * h for pt in lm]
                bx1 = max(0, int(min(all_x)) - 12)
                by1 = max(0, int(min(all_y)) - 16)
                bx2 = min(w, int(max(all_x)) + 12)
                by2 = min(h, int(max(all_y)) + 12)
                bbox_col = (0, 60, 220) if alert_active else (0, 210, 90)
                _rounded_rect(frame, (bx1, by1), (bx2, by2), bbox_col, 12, 2)

                # ── Eye crosshairs ───────────────────────────
                _crosshair(frame, np.mean(left_pts,  axis=0))
                _crosshair(frame, np.mean(right_pts, axis=0))

                # ── Yawn visualisation ───────────────────────
                # Draw horizontal upper-lip line, lower-lip line, and a
                # vertical connector that changes colour green→red as MAR rises.
                ul_pt = (int(lm[_UPPER_LIP].x * w), int(lm[_UPPER_LIP].y * h))
                ll_pt = (int(lm[_LOWER_LIP].x * w), int(lm[_LOWER_LIP].y * h))
                lft   = (int(lm[_LIP_LEFT ].x * w), int(lm[_LIP_LEFT ].y * h))
                rgt   = (int(lm[_LIP_RIGHT].x * w), int(lm[_LIP_RIGHT].y * h))

                lip_gap   = abs(ll_pt[1] - ul_pt[1])
                lip_width = max(1, abs(rgt[0] - lft[0]))
                ratio     = min(1.0, lip_gap / max(1, lip_width * 0.6))

                r_c  = int(255 * min(1.0, ratio * 2))
                g_c  = int(255 * max(0.0, 1.0 - ratio))
                lcol = (0, g_c, r_c)            # BGR

                # Upper-lip line
                cv2.line(frame, (lft[0], ul_pt[1]), (rgt[0], ul_pt[1]),
                         lcol, 2, cv2.LINE_AA)
                # Lower-lip line
                cv2.line(frame, (lft[0], ll_pt[1]), (rgt[0], ll_pt[1]),
                         lcol, 2, cv2.LINE_AA)
                # Vertical connector
                cx_m = (lft[0] + rgt[0]) // 2
                cv2.line(frame, (cx_m, ul_pt[1]), (cx_m, ll_pt[1]),
                         lcol, 2, cv2.LINE_AA)
                # Tick marks
                cv2.line(frame, (cx_m-6, ul_pt[1]), (cx_m+6, ul_pt[1]),
                         lcol, 2, cv2.LINE_AA)
                cv2.line(frame, (cx_m-6, ll_pt[1]), (cx_m+6, ll_pt[1]),
                         lcol, 2, cv2.LINE_AA)

                if yawn:
                    _text_bg(frame, "YAWNING",
                             (rgt[0] + 8, (ul_pt[1] + ll_pt[1]) // 2),
                             0.55, (0, 80, 255), (8, 8, 28), 2)

            # ── Time-based EAR alert (blink-safe) ───────────
            now = time.time()
            if face_detected and ear < EAR_THRESHOLD:
                if eyes_closed_t is None:
                    eyes_closed_t = now
                elif now - eyes_closed_t >= EAR_CLOSED_SECONDS:
                    ear_alert = True
            else:
                eyes_closed_t = None
                ear_alert     = False

            # Read model state (lock held < 1 µs)
            with self._status_lock:
                m_status  = self._status["model_status"]
                m_conf    = self._status["model_conf"]
                m_emotion = self._status["emotion"]

            model_alert  = (m_status == "Drowsy")
            alert_active = ear_alert or model_alert

            self._upd({
                "ear":          round(ear, 3),
                "mar":          round(mar, 3),
                "ear_alert":    ear_alert,
                "model_alert":  model_alert,
                "alert":        alert_active,
                "yawn":         yawn,
                "face_detected": face_detected,
            })

            # ── Alert overlay + log ──────────────────────────
            if alert_active:
                reasons = []
                if ear_alert:   reasons.append(f"EAR={ear:.3f}<{EAR_THRESHOLD}")
                if model_alert: reasons.append("Model=Drowsy")
                if now - self._last_log >= LOG_THROTTLE_S:
                    self._log_alert(", ".join(reasons), ear, m_status, m_emotion)
                    self._last_log = now

                ov = frame.copy()
                cv2.rectangle(ov, (0, 0), (w, h), (0, 0, 180), -1)
                cv2.addWeighted(ov, 0.18, frame, 0.82, 0, frame)

                banner = "DROWSINESS ALERT!"
                (bw2, bh2), _ = cv2.getTextSize(banner, _FONT, 1.3, 3)
                bx = (w - bw2) // 2; by = h // 2 + bh2 // 2
                cv2.putText(frame, banner, (bx+2, by+2),
                            _FONT, 1.3, (0, 0, 60),  4, cv2.LINE_AA)
                cv2.putText(frame, banner, (bx,   by),
                            _FONT, 1.3, (0, 60, 255), 3, cv2.LINE_AA)

            # ── HUD top bar ──────────────────────────────────
            panel = frame.copy()
            cv2.rectangle(panel, (0, 0), (w, 72), (8, 8, 28), -1)
            cv2.addWeighted(panel, 0.70, frame, 0.30, 0, frame)

            ear_col = (0, 60, 220) if ear < EAR_THRESHOLD else (0, 200, 80)
            _text_bg(frame, f"EAR: {ear:.3f}", (12, 30), 0.68, ear_col, (8,8,28), 2)

            mar_col = (0, 100, 255) if yawn else (160, 160, 160)
            _text_bg(frame, f"MAR: {mar:.3f}", (12, 58), 0.52, mar_col, (8,8,28), 1)

            ms_col = ((0, 60, 220) if m_status == "Drowsy" else
                      (0, 200, 80) if m_status == "Awake" else (160, 160, 160))
            ms_txt = (f"Model: {m_status} ({m_conf:.0%})"
                      if m_conf > 0 else f"Model: {m_status}")
            (mw2, _), _ = cv2.getTextSize(ms_txt, _FONT, 0.68, 2)
            _text_bg(frame, ms_txt, ((w-mw2)//2, 30), 0.68, ms_col, (8,8,28), 2)

            emo_txt = f"Emotion: {m_emotion}"
            (ew2, _), _ = cv2.getTextSize(emo_txt, _FONT, 0.48, 1)
            _text_bg(frame, emo_txt, ((w-ew2)//2, 58), 0.48, (190,190,190), (8,8,28), 1)

            if not face_detected:
                _text_bg(frame, "No Face Detected",
                         (w-210, 30), 0.58, (0, 200, 255), (8,8,28), 1)

            # Next-scan countdown
            next_inf = max(0.0, INFERENCE_INTERVAL - (now - last_infer_t))
            _text_bg(frame, f"Next scan: {next_inf:.1f}s",
                     (w-175, h-12), 0.45, (130,130,130), (8,8,28), 1)

            # ── Queue frame for background inference ─────────
            if now - last_infer_t >= INFERENCE_INTERVAL:
                try:
                    self._frame_queue.put_nowait(frame.copy())
                    last_infer_t = now
                except queue.Full:
                    pass

            # ── JPEG-encode and publish ──────────────────────
            _, jpeg = cv2.imencode(
                '.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            with self._frame_lock:
                self._latest_jpeg = jpeg.tobytes()

        # Cleanup
        face_lm.close()
        cap.release()
        print("[DetectorEngine] Stopped.")
