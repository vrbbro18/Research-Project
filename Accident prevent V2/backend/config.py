import os

# Central configuration for model paths, labels, and constants.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DROWSINESS_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'drowsiness_model.h5')
EMOTION_MODEL_PATH    = os.path.join(BASE_DIR, 'models', 'emotion_model.h5')


# Map model output indices → human-readable labels
DROWSINESS_LABELS = {0: 'Closed', 1: 'Open'}
EMOTION_LABELS    = {0: 'Angry', 1: 'Disgust', 2: 'Fear',
                     3: 'Happy', 4: 'Sad', 5: 'Surprise', 6: 'Neutral'}

# Research history window
RECORDS_PER_MINUTE = 20   # at ~3-second capture intervals
MAX_HISTORY        = RECORDS_PER_MINUTE * 5   # keep last 5 minutes
PREDICTION_MINUTES = 5    # how many future minutes to forecast
