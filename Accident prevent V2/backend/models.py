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

    print("Loading models… please wait.")

    try:
        drowsiness_model = load_model(DROWSINESS_MODEL_PATH)
        print("[SUCCESS] Drowsiness model loaded successfully!")
    except Exception as e:
        print(f"[ERROR] Error loading drowsiness model: {e}")
        print("Drowsiness model is required. Exiting.")
        raise SystemExit(1)

    try:
        emotion_model           = load_model(EMOTION_MODEL_PATH)
        emotion_model_available = True
        print("[SUCCESS] Emotion model loaded successfully!")
    except Exception as e:
        print(f"[ERROR] Emotion model not found: {e}")
        print("Defaulting to 'neutral' emotion.")
        emotion_model_available = False
