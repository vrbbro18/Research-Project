# ── app.py ───────────────────────────────────────────────────
# Flask application entry point.
# Responsibilities: create the app, load models, register blueprints.

from flask import Flask
from flask_cors import CORS

from models import load_all_models
from routes.analyze import analyze_bp

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Load ML models once at startup
    load_all_models()

    # Register blueprints (routes)
    app.register_blueprint(analyze_bp)

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)