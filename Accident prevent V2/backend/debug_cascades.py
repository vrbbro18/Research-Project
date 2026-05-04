import cv2
import os

face_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
eye_path = os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')

print(f"Haarcascades data path: {cv2.data.haarcascades}")
print(f"Face path: {face_path}")
print(f"Eye path: {eye_path}")
print(f"Face exists: {os.path.exists(face_path)}")
print(f"Eye exists: {os.path.exists(eye_path)}")

try:
    face_cascade = cv2.CascadeClassifier(face_path)
    if face_cascade.empty():
        print("Face cascade is empty!")
    else:
        print("Face cascade loaded successfully.")
except Exception as e:
    print(f"Error loading face cascade: {e}")
