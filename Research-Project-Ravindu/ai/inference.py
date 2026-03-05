import os
import sys
import warnings

# Suppress TensorFlow warnings and info messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # 0=all, 1=info, 2=warnings, 3=errors
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN warnings
warnings.filterwarnings('ignore', category=FutureWarning)

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing import image
from PIL import Image

# Class labels (must match training configuration)
CLASS_LABELS = ['normal', 'abnormal', 'unresponsive']

# Image preprocessing parameters (must match training configuration)
IMAGE_SIZE = (224, 224)  # MobileNetV2 input size
NORMALIZATION_VALUE = 255.0  # Divide by 255 to normalize [0, 255] -> [0, 1]

# Global variable to store loaded model (loaded once for efficiency)
_loaded_model = None
_model_path = None


def load_model(model_path='models/driver_safety_model.h5'):
    global _loaded_model, _model_path
    
    if _loaded_model is not None and _model_path == model_path:
        return _loaded_model
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found: {model_path}\n"
            "Please ensure the trained model exists at the specified path."
        )
    
    try:
        print(f"[INFERENCE] Loading model from: {model_path}")
        # Load the trained model
        # RESEARCH NOTE: This loads the entire model including architecture and weights
        model = keras.models.load_model(model_path)
        print(f"[INFERENCE] Model loaded successfully")
        print(f"[INFERENCE] Model input shape: {model.input_shape}")
        print(f"[INFERENCE] Model output shape: {model.output_shape}")
        
        _loaded_model = model
        _model_path = model_path
        
        return model
        
    except Exception as e:
        error_msg = str(e)
        # Provide helpful error messages for common issues
        if "expects" in error_msg and "input" in error_msg.lower():
            raise ValueError(
                f"Model architecture error: {error_msg}\n"
                "This usually means the model was saved incorrectly or has a structural issue.\n"
                "Please retrain the model or use a correctly saved model file."
            )
        elif "FileNotFoundError" in str(type(e).__name__):
            raise FileNotFoundError(
                f"Model file not found: {model_path}\n"
                "Please ensure the trained model exists at the specified path."
            )
        else:
            raise ValueError(f"Failed to load model: {error_msg}")


def preprocess_image(image_path):
    try:
        img = Image.open(image_path)
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        img = img.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
        img_array = np.array(img, dtype=np.float32)
        img_array = img_array / NORMALIZATION_VALUE
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
        
    except FileNotFoundError:
        raise FileNotFoundError(f"Image file not found: {image_path}")
    except Exception as e:
        raise ValueError(f"Failed to preprocess image: {str(e)}")


def predict_driver_posture(image_path, model_path='models/driver_safety_model.h5'):
    model = load_model(model_path)
    preprocessed_image = preprocess_image(image_path)
    
    try:
        predictions = model.predict(preprocessed_image, verbose=0)
        probabilities = predictions[0]
        
        predicted_index = np.argmax(probabilities)
        predicted_label = CLASS_LABELS[predicted_index]
        confidence = float(probabilities[predicted_index])
        
        probability_dict = {
            label: float(prob) 
            for label, prob in zip(CLASS_LABELS, probabilities)
        }
        
        result = {
            'label': predicted_label,
            'confidence': confidence,
            'probabilities': probability_dict,
            'model_info': {
                'input_shape': str(model.input_shape),
                'output_shape': str(model.output_shape),
                'num_classes': len(CLASS_LABELS)
            }
        }
        
        print(f"[INFERENCE] Prediction: {predicted_label} (confidence: {confidence:.4f})")
        
        return result
        
    except Exception as e:
        raise ValueError(f"Inference failed: {str(e)}")


def classify_image(image_path, model_path='models/driver_safety_model.h5'):
    result = predict_driver_posture(image_path, model_path)
    return result['label'], result['confidence']


if __name__ == '__main__':
    import sys
    import json
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python inference.py <image_path> [model_path] [--json]"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 'models/driver_safety_model.h5'
    output_json = '--json' in sys.argv
    
    try:
        result = predict_driver_posture(image_path, model_path)
        
        if output_json:
            output = {
                "success": True,
                "label": result['label'],
                "confidence": result['confidence'],
                "probabilities": result['probabilities'],
                "model_info": result['model_info']
            }
            print(json.dumps(output))
        else:
            print("\n" + "="*60)
            print("INFERENCE RESULT")
            print("="*60)
            print(f"Image: {image_path}")
            print(f"Predicted Label: {result['label']}")
            print(f"Confidence: {result['confidence']:.4f}")
            print("\nProbability Distribution:")
            for label, prob in result['probabilities'].items():
                print(f"  {label}: {prob:.4f}")
            print("="*60)
        
    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)

