# ── app.py ───────────────────────────────────────────────────
# Flask application entry point.
# Responsibilities:
#   1. Load Keras models once (shared by both /analyze and DetectorEngine)
#   2. Start the DetectorEngine (owns webcam, runs MediaPipe + inference)
#   3. Register blueprints

from flask import Flask
from flask_cors import CORS

from models import load_all_models
from routes.analyze import analyze_bp
from routes.stream import stream_bp, set_engine


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Load ML models once — sets models.drowsiness_model and models.emotion_model
    # (both the /analyze route and DetectorEngine use these singletons)
    load_all_models()

    # Start the headless detector engine (owns the webcam exclusively)
    try:
        from detector_engine import DetectorEngine
        engine = DetectorEngine()
        engine.start()
        set_engine(engine)
        print("[App] DetectorEngine started — webcam owned by Python backend.")
    except Exception as exc:
        print(f"[App] WARNING: DetectorEngine failed to start: {exc}")
        print("[App] Falling back to upload-only mode (/video_feed unavailable).")

    # Register blueprints
    app.register_blueprint(analyze_bp)    # /analyze, /reset  (upload mode still works)
    app.register_blueprint(stream_bp)     # /video_feed, /status, /research

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=False, port=5000, threaded=True)