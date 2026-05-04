# ── models.py ───────────────────────────────────────────────
# Loads the Keras models once at startup and exposes them as
# module-level singletons so every other module can import them.

from config import DROWSINESS_MODEL_PATH, EMOTION_MODEL_PATH

# ── Optional dependency guards ──────────────────────────────
try:
    from tensorflow.keras.models import load_model
    _tf_available = True
except ImportError:
    load_model = None
    _tf_available = False
    print("⚠️  TensorFlow not available – models will not be loaded.")

# ── Public singletons ───────────────────────────────────────
drowsiness_model        = None
emotion_model           = None
emotion_model_available = False

def load_all_models():
    """Call once from app.py at startup."""
    global drowsiness_model, emotion_model, emotion_model_available

    if not _tf_available:
        print("TensorFlow unavailable – skipping model load.")
        return

    print("Loading models... please wait.")

    try:
        drowsiness_model = load_model(DROWSINESS_MODEL_PATH)
        print("[OK] Drowsiness model loaded successfully!")
    except Exception as e:
        print(f"[ERR] Error loading drowsiness model: {e}")
        print("Drowsiness model is required. Exiting.")
        raise SystemExit(1)

    try:
        emotion_model           = load_model(EMOTION_MODEL_PATH)
        emotion_model_available = True
        print("[OK] Emotion model loaded successfully!")
    except Exception as e:
        print(f"[WARN] Emotion model not found: {e}")
        print("Defaulting to 'neutral' emotion.")
        emotion_model_available = False


def load_drowsiness_only():
    """
    Lightweight loader for the standalone detector.py script.
    Returns (drowsiness_model, emotion_model_or_None).
    Raises RuntimeError if TensorFlow is absent.
    """
    if not _tf_available:
        raise RuntimeError("TensorFlow not available — install tensorflow first.")

    print("Loading models for standalone detector...")

    drw_model = None
    try:
        drw_model = load_model(DROWSINESS_MODEL_PATH)
        print("[OK] Drowsiness model loaded.")
    except Exception as e:
        raise RuntimeError(f"Cannot load drowsiness model: {e}") from e

    emo_model = None
    try:
        emo_model = load_model(EMOTION_MODEL_PATH)
        print("[OK] Emotion model loaded.")
    except Exception as e:
        print(f"[WARN] Emotion model unavailable: {e}. Defaulting to 'neutral'.")

    return drw_model, emo_model

