# ── config.py ──────────────────────────────────────────────
# Central configuration for model paths, labels, and constants.

DROWSINESS_MODEL_PATH = 'models/drowsiness_model.h5'
EMOTION_MODEL_PATH    = 'models/emotion_model.h5'

# Map model output indices → human-readable labels
DROWSINESS_LABELS = {0: 'Closed', 1: 'Open'}
EMOTION_LABELS    = {0: 'Angry', 1: 'Disgust', 2: 'Fear',
                     3: 'Happy', 4: 'Sad', 5: 'Surprise', 6: 'Neutral'}

# Research history window
RECORDS_PER_MINUTE = 20   # at ~3-second capture intervals
MAX_HISTORY        = RECORDS_PER_MINUTE * 5   # keep last 5 minutes
PREDICTION_MINUTES = 5    # how many future minutes to forecast

# ── Standalone detector thresholds ─────────────────────────
EAR_THRESHOLD      = 0.22   # Eye Aspect Ratio — below this = eyes closed
MAR_THRESHOLD      = 0.65   # Mouth Aspect Ratio — above this = yawning
INFERENCE_INTERVAL = 3.0    # Seconds between background model inferences
EAR_CONSEC_FRAMES  = 15     # Legacy frame counter (15 @ 30fps ≈ 500ms, used by detector.py)
EAR_CLOSED_SECONDS = 0.5    # Time-based blink filter: alert only if eyes closed > 500ms
ALERT_COOLDOWN_S   = 3.0    # Minimum seconds between repeated alert sounds

# ── Hybrid fusion parameters ───────────────────────────────
# Weighted source fusion
HYBRID_WEIGHT_LIVE     = 0.60
HYBRID_WEIGHT_SNAPSHOT = 0.40

# Logistic fusion + temporal smoothing
HYBRID_SIGMOID_GAIN  = 2.40
HYBRID_TEMPORAL_GAMMA = 0.35
HYBRID_PHYS_DELTA     = 0.20

# Hysteresis thresholds (reduces alert flapping)
HYBRID_ON_THRESHOLD  = 0.68
HYBRID_OFF_THRESHOLD = 0.42

# Uncertainty / staleness controls
HYBRID_DISAGREEMENT_TAU   = 0.45
HYBRID_STALE_SECONDS      = 8.0
HYBRID_UNCERTAIN_WINDOWS  = 2

# Emotion stabilization (live + snapshot)
HYBRID_EMOTION_WINDOW            = 5
HYBRID_EMOTION_CONFIDENCE_MIN    = 0.55
HYBRID_EMOTION_HOLD_SECONDS      = 12.0

# Live analytics stream
LIVE_ANALYTICS_MAX_POINTS = 180
