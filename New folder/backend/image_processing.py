# ── image_processing.py ─────────────────────────────────────
# Face/eye detection and image preprocessing for both AI models.

import numpy as np

try:
    import cv2
    cv2_available = True
except ImportError:
    cv2 = None
    cv2_available = False
    print("⚠️  OpenCV not available – image processing will fail.")


# ── Face & Eye Detection ────────────────────────────────────

def detect_face_and_eyes(image_path: str):
    """
    Detect the primary face and eye region from a saved image file.
    Returns (face_region_gray, eye_region_bgr).
    Falls back to the full image when detection fails.
    """
    img  = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

    face_region = None
    eye_region  = None

    if len(faces) > 0:
        # Use the largest face
        (x, y, w, h) = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
        face_region_gray  = gray[y:y+h, x:x+w]
        face_region_color = img[y:y+h, x:x+w]
        print(f"✅ Face detected at ({x},{y}) size {w}×{h}")

        # Search for eyes only in the upper 60 % of the face
        eye_search_h  = int(face_region_gray.shape[0] * 0.6)
        eye_search    = face_region_gray[0:eye_search_h, :]
        eyes          = eye_cascade.detectMultiScale(eye_search, scaleFactor=1.1,
                                                     minNeighbors=3, minSize=(20, 20))

        if len(eyes) >= 2:
            eyes_sorted = sorted(eyes, key=lambda e: e[0])
            x1, y1, w1, h1 = eyes_sorted[0]
            x2, y2, w2, h2 = eyes_sorted[1]
            y_diff         = abs(y1 - y2)
            avg_eye_h      = (h1 + h2) / 2

            if y_diff > avg_eye_h:
                print(f"⚠️  Eye positions differ too much (diff={y_diff}) – using upper face fallback")
                eye_region = face_region_color[0:int(h * 0.5), :]
            else:
                eye_x = min(x1, x2)
                eye_y = min(y1, y2)
                eye_w = max(x1 + w1, x2 + w2) - eye_x
                eye_h = max(y1 + h1, y2 + h2) - eye_y
                # Add padding
                px = int(eye_w * 0.2);  py = int(eye_h * 0.2)
                eye_x = max(0, eye_x - px)
                eye_y = max(0, eye_y - py)
                eye_w = min(face_region_color.shape[1] - eye_x, eye_w + 2 * px)
                eye_h = min(face_region_color.shape[0] - eye_y, eye_h + 2 * py)
                eye_region = face_region_color[eye_y:eye_y+eye_h, eye_x:eye_x+eye_w]
                print(f"👀 Eye region {eye_w}×{eye_h}")
        else:
            print(f"⚠️  {len(eyes)} eye(s) detected – using upper face fallback")
            eye_region = face_region_color[0:int(h * 0.6), :]

        face_region = face_region_gray
    else:
        print("⚠️  No face detected – using full image as fallback")
        face_region = gray
        eye_region  = img

    return face_region, eye_region


def detect_face_and_eyes_from_frame(frame: np.ndarray):
    """
    Same detection logic as detect_face_and_eyes() but accepts a BGR
    numpy array directly. Used by the background inference thread to
    avoid disk I/O when working with live webcam frames.

    Returns (face_region_gray, eye_region_bgr).
    Falls back to the full image when detection fails.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

    if len(faces) == 0:
        return gray, frame  # fallback: full grayscale + full colour frame

    (x, y, w, h) = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    face_region_gray  = gray[y:y+h, x:x+w]
    face_region_color = frame[y:y+h, x:x+w]

    eye_search_h = int(face_region_gray.shape[0] * 0.6)
    eye_search   = face_region_gray[0:eye_search_h, :]
    eyes         = eye_cascade.detectMultiScale(eye_search, scaleFactor=1.1,
                                                minNeighbors=3, minSize=(20, 20))

    if len(eyes) >= 2:
        eyes_sorted = sorted(eyes, key=lambda e: e[0])
        x1, y1, w1, h1 = eyes_sorted[0]
        x2, y2, w2, h2 = eyes_sorted[1]
        y_diff         = abs(y1 - y2)
        avg_eye_h      = (h1 + h2) / 2

        if y_diff > avg_eye_h:
            eye_region = face_region_color[0:int(h * 0.5), :]
        else:
            eye_x = min(x1, x2)
            eye_y = min(y1, y2)
            eye_w = max(x1 + w1, x2 + w2) - eye_x
            eye_h = max(y1 + h1, y2 + h2) - eye_y
            px = int(eye_w * 0.2); py = int(eye_h * 0.2)
            eye_x = max(0, eye_x - px)
            eye_y = max(0, eye_y - py)
            eye_w = min(face_region_color.shape[1] - eye_x, eye_w + 2 * px)
            eye_h = min(face_region_color.shape[0] - eye_y, eye_h + 2 * py)
            eye_region = face_region_color[eye_y:eye_y+eye_h, eye_x:eye_x+eye_w]
    else:
        eye_region = face_region_color[0:int(h * 0.6), :]

    return face_region_gray, eye_region



# ── Preprocessing ───────────────────────────────────────────

def preprocess_for_drowsiness(eye_region) -> np.ndarray:
    """
    Resize and normalise the eye region for the drowsiness model.
    Input:  BGR or grayscale array
    Output: float32 array shaped (1, 128, 128, 3), values in [0, 1]
    """
    img = (cv2.cvtColor(eye_region, cv2.COLOR_GRAY2RGB)
           if len(eye_region.shape) == 2
           else cv2.cvtColor(eye_region, cv2.COLOR_BGR2RGB))
    img = cv2.resize(img, (128, 128))

    # Optional debug save
    try:
        cv2.imwrite('debug_drowsiness_input.jpg',
                    cv2.cvtColor((img).astype('uint8'), cv2.COLOR_RGB2BGR))
    except Exception:
        pass

    img = img / 255.0
    print(f"📊 Drowsiness input shape={img.shape} min={img.min():.3f} max={img.max():.3f}")
    return np.expand_dims(img, axis=0)


def preprocess_for_emotion(face_region) -> np.ndarray:
    """
    Resize and normalise the face region for the emotion model.
    Input:  grayscale array
    Output: float32 array shaped (1, 48, 48, 1), values in [0, 1]
    """
    img = cv2.resize(face_region, (48, 48))

    try:
        cv2.imwrite('debug_emotion_input.jpg', img)
    except Exception:
        pass

    img = img.astype('float32') / 255.0
    print(f"📊 Emotion input shape={img.shape} min={img.min():.3f} max={img.max():.3f}")
    img = np.expand_dims(img, axis=0)
    img = np.expand_dims(img, axis=-1)
    return img
