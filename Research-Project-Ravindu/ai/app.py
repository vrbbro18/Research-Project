from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from inference import predict_driver_posture, load_model

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.getenv('MODEL_PATH', 'models/driver_safety_model.h5')
PORT = int(os.getenv('PORT', 5000))

print(f"[API] Initializing Flask server...")
print(f"[API] Model path: {MODEL_PATH}")
try:
    model = load_model(MODEL_PATH)
    print(f"[API] Model pre-loaded successfully")
except Exception as e:
    print(f"[API] WARNING: Could not pre-load model: {e}")
    print(f"[API] Model will be loaded on first prediction request")


def posture_to_risk_level(posture):
    posture_lower = posture.lower()
    mapping = {
        'normal': 'low',
        'abnormal': 'medium',
        'unresponsive': 'high'
    }
    return mapping.get(posture_lower, 'medium')  # Default to medium for unknown


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Driver Risk Detection AI Service',
        'model_path': MODEL_PATH,
        'model_loaded': os.path.exists(MODEL_PATH)
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'message': 'Please upload an image file in the "image" field'
            }), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({
                'error': 'Empty filename',
                'message': 'Please provide a valid image file'
            }), 400
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            image_file.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        try:
            result = predict_driver_posture(tmp_path, MODEL_PATH)
            risk_level = posture_to_risk_level(result['label'])
            
            response = {
                'riskLevel': risk_level,
                'confidence': result['confidence'],
                'category': result['label'],  # 'normal', 'abnormal', 'unresponsive'
                'probabilities': result['probabilities'],
                'details': {
                    'model_info': result['model_info']
                }
            }
            
            return jsonify(response)
            
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except FileNotFoundError as e:
        return jsonify({
            'error': 'Model file not found',
            'message': str(e)
        }), 500
        
    except ValueError as e:
        return jsonify({
            'error': 'Inference error',
            'message': str(e)
        }), 500
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    print(f"\n{'='*60}")
    print("Driver Risk Detection AI Service")
    print(f"{'='*60}")
    print(f"Starting server on port {PORT}...")
    print(f"Health check: http://localhost:{PORT}/health")
    print(f"Predict endpoint: http://localhost:{PORT}/predict")
    print(f"{'='*60}\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=False)

