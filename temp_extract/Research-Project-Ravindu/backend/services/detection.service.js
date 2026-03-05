const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PYTHON_INFERENCE_SCRIPT = path.join(__dirname, '../../ai/inference.py');
// Function to find model file
function findModelFile() {
  // Check multiple possible model locations
  const possibleModelPaths = [
    process.env.MODEL_PATH, // From environment variable
    path.join(__dirname, '../../ai/driver_safety_model.h5'), // In ai folder
    path.join(__dirname, '../../models/driver_safety_model.h5'), // In models folder
    path.join(__dirname, '../../ai/models/driver_safety_model.h5'), // In ai/models subfolder
  ].filter(Boolean); // Remove undefined values

  // Find the first existing model file
  let foundModel = possibleModelPaths.find(p => fs.existsSync(p));
  
  // If not found, search in ai folder for any .h5 or .keras file
  if (!foundModel) {
    const aiFolder = path.join(__dirname, '../../ai');
    if (fs.existsSync(aiFolder)) {
      const files = fs.readdirSync(aiFolder);
      const modelFiles = files.filter(f => /\.(h5|keras|pkl)$/i.test(f));
      if (modelFiles.length > 0) {
        foundModel = path.join(aiFolder, modelFiles[0]);
      } else {
        // Check subdirectories
        const subdirs = files.filter(f => {
          const fullPath = path.join(aiFolder, f);
          return fs.statSync(fullPath).isDirectory();
        });
        
        for (const subdir of subdirs) {
          const subdirPath = path.join(aiFolder, subdir);
          const subFiles = fs.readdirSync(subdirPath);
          const subModelFiles = subFiles.filter(f => /\.(h5|keras|pkl)$/i.test(f));
          if (subModelFiles.length > 0) {
            foundModel = path.join(subdirPath, subModelFiles[0]);
            break;
          }
        }
      }
    }
  }
  
  return foundModel || possibleModelPaths[0] || path.join(__dirname, '../../ai/driver_safety_model.h5');
}

// Get model path (will be resolved when needed)
let MODEL_PATH = findModelFile();

// On Windows, try 'py' (Python Launcher) first, then 'python', then 'python3'
// Python Launcher is more reliable on Windows
let PYTHON_COMMAND = process.env.PYTHON_COMMAND;
if (!PYTHON_COMMAND) {
  if (process.platform === 'win32') {
    PYTHON_COMMAND = 'py'; // Python Launcher (most reliable on Windows)
  } else {
    PYTHON_COMMAND = 'python3';
  }
}
const INFERENCE_TIMEOUT = 60000;

function labelToRiskLevel(label) {
  const labelLower = (label || '').toLowerCase();
  const mapping = {
    'normal': 'low',
    'abnormal': 'medium',
    'unresponsive': 'high'
  };
  return mapping[labelLower] || 'medium';
}

async function analyzeImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    if (!fs.existsSync(PYTHON_INFERENCE_SCRIPT)) {
      throw new Error(`Python inference script not found: ${PYTHON_INFERENCE_SCRIPT}`);
    }

    console.log(`[AI SERVICE] Calling Python inference script: ${PYTHON_INFERENCE_SCRIPT}`);
    console.log(`[AI SERVICE] Image path: ${imagePath}`);
    console.log(`[AI SERVICE] Model path: ${MODEL_PATH}`);
    console.log(`[AI SERVICE] Model file exists: ${fs.existsSync(MODEL_PATH)}`);
    console.log(`[AI SERVICE] Python command: ${PYTHON_COMMAND}`);
    
    // Auto-detect model file if not found
    if (!fs.existsSync(MODEL_PATH)) {
      console.warn(`[AI SERVICE] ⚠️  Model file not found at: ${MODEL_PATH}`);
      console.warn(`[AI SERVICE] ⚠️  Searching for model files in ai folder...`);
      
      const aiFolder = path.join(__dirname, '../../ai');
      if (fs.existsSync(aiFolder)) {
        const files = fs.readdirSync(aiFolder);
        const modelFiles = files.filter(f => /\.(h5|keras|pkl)$/i.test(f));
        if (modelFiles.length > 0) {
          const foundModel = path.join(aiFolder, modelFiles[0]);
          console.log(`[AI SERVICE] ✅ Found model file: ${foundModel}`);
          MODEL_PATH = foundModel;
        } else {
          // Check subdirectories
          const subdirs = files.filter(f => {
            const fullPath = path.join(aiFolder, f);
            return fs.statSync(fullPath).isDirectory();
          });
          
          for (const subdir of subdirs) {
            const subdirPath = path.join(aiFolder, subdir);
            const subFiles = fs.readdirSync(subdirPath);
            const subModelFiles = subFiles.filter(f => /\.(h5|keras|pkl)$/i.test(f));
            if (subModelFiles.length > 0) {
              const foundModel = path.join(subdirPath, subModelFiles[0]);
              console.log(`[AI SERVICE] ✅ Found model file: ${foundModel}`);
              MODEL_PATH = foundModel;
              break;
            }
          }
        }
      }
      
      if (!fs.existsSync(MODEL_PATH)) {
        throw new Error(`Model file not found. Please place your trained model (.h5 or .keras file) in the ai folder:\n  - ai/driver_safety_model.h5\n  - ai/models/driver_safety_model.h5\n\nOr set MODEL_PATH environment variable in backend/.env file.`);
      }
    }

    const result = await runPythonInference(imagePath);

    if (!result.label || result.confidence === undefined) {
      throw new Error('Invalid response from Python inference script');
    }

    const riskLevel = labelToRiskLevel(result.label);

    console.log(`[AI SERVICE] Detection result: ${result.label} -> ${riskLevel} (confidence: ${result.confidence.toFixed(4)})`);

    return {
      riskLevel: riskLevel,
      confidence: result.confidence || 0,
      category: result.label || 'unknown',
      details: {
        probabilities: result.probabilities || {},
        model_info: result.model_info || {},
        method: 'python_inference'
      }
    };

  } catch (error) {
    console.error(`\n❌ [AI SERVICE] Python inference failed: ${error.message}`);
    console.error(`[AI SERVICE] Error details:`, error);
    console.warn('\n⚠️  [AI SERVICE] Falling back to simulated detection');
    console.warn('⚠️  NOTE: Simulated detection returns random results.');
    console.warn('⚠️  To use real AI detection, you need to:');
    console.warn('    1. Train a model using your dataset');
    console.warn('    2. Place the model file at: models/driver_safety_model.h5');
    console.warn('    3. Ensure Python and TensorFlow are properly installed\n');
    const simulated = simulateDetection(imagePath);
    return {
      riskLevel: simulated.riskLevel,
      confidence: simulated.confidence,
      category: simulated.category,
      details: {
        ...simulated.details,
        warning: 'Using simulated detection - AI model not available',
        originalError: error.message
      }
    };
  }
}

/**
 * Execute Python inference script and parse output
 * 
 * RESEARCH NOTE: Uses child_process.spawn() to execute Python script as subprocess.
 * Reads stdout/stderr and parses JSON output. Implements timeout to prevent hanging.
 * 
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Parsed inference result
 */
function runPythonInference(imagePath) {
  return new Promise((resolve, reject) => {
    // Build command arguments
    // python3 inference.py <image_path> <model_path> --json
    // Get current model path (may have been updated)
    const currentModelPath = findModelFile();
    
    const args = [
      PYTHON_INFERENCE_SCRIPT,
      imagePath,
      currentModelPath,
      '--json'
    ];

    console.log(`[AI SERVICE] Executing: ${PYTHON_COMMAND} ${args.join(' ')}`);

    // Spawn Python process
    const pythonProcess = spawn(PYTHON_COMMAND, args, {
      cwd: path.dirname(PYTHON_INFERENCE_SCRIPT),
      stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
    });

    let stdout = '';
    let stderr = '';

    // Collect stdout data
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr data (for error messages)
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Helper function to filter out known TensorFlow/Keras warnings
    function isKnownWarning(stderrText) {
      if (!stderrText) return false;
      const warningPatterns = [
        /oneDNN custom operations are on/i,
        /This TensorFlow binary is optimized/i,
        /FutureWarning.*np\.object/i,
        /TensorFlow.*CPU instructions/i,
        /oneDNN.*round-off errors/i
      ];
      return warningPatterns.some(pattern => pattern.test(stderrText));
    }

    // Handle process completion
    pythonProcess.on('close', (code) => {
      // Log warnings but don't treat them as errors if process succeeded
      if (stderr && !isKnownWarning(stderr) && code === 0) {
        console.warn(`[AI SERVICE] Python stderr (non-fatal): ${stderr.substring(0, 200)}`);
      }

      try {
        // Parse JSON output from stdout (even if exit code is non-zero, as Python script outputs errors as JSON)
        if (!stdout.trim()) {
          // If no stdout and non-zero exit code, use stderr as error
          if (code !== 0) {
            const errorMsg = stderr || `Python process exited with code ${code}`;
            console.error(`[AI SERVICE] Python process error (exit code ${code}):`);
            console.error(`[AI SERVICE] stderr: ${stderr || '(empty)'}`);
            return reject(new Error(errorMsg));
          }
          throw new Error('No output from Python script');
        }

        // Try to extract JSON from stdout (in case warnings/print statements got mixed in)
        let jsonOutput = stdout.trim();
        
        // Find JSON object in output - look for the last complete JSON object
        // This handles cases where print statements precede the JSON
        const jsonMatches = jsonOutput.match(/\{[\s\S]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Use the last match (most likely the actual response)
          jsonOutput = jsonMatches[jsonMatches.length - 1];
        } else {
          // Fallback: try to find JSON on the last line
          const lines = jsonOutput.split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const trimmedLine = lines[i].trim();
            if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
              jsonOutput = trimmedLine;
              break;
            }
          }
        }

        const result = JSON.parse(jsonOutput);

        // Check if result indicates error (even if exit code is 0, JSON might indicate failure)
        if (result.error || result.success === false) {
          const errorMsg = result.error || 'Python inference failed';
          console.error(`[AI SERVICE] Python inference error: ${errorMsg}`);
          if (code !== 0) {
            console.error(`[AI SERVICE] Exit code: ${code}`);
            console.error(`[AI SERVICE] stderr: ${stderr || '(empty)'}`);
          }
          return reject(new Error(errorMsg));
        }

        // Validate required fields
        if (!result.label && !result.success) {
          throw new Error('Invalid JSON structure from Python script');
        }

        // Success - resolve with result
        resolve(result);

      } catch (parseError) {
        // If we couldn't parse JSON and exit code is non-zero, provide detailed error
        if (code !== 0) {
          console.error(`[AI SERVICE] Python process error (exit code ${code}):`);
          console.error(`[AI SERVICE] JSON parse error: ${parseError.message}`);
          console.error(`[AI SERVICE] stdout: ${stdout.substring(0, 500)}`);
          console.error(`[AI SERVICE] stderr: ${stderr.substring(0, 500)}`);
          
          // Try to extract error from stdout if it contains JSON (fallback extraction)
          try {
            const jsonMatches = stdout.match(/\{[\s\S]*\}/g);
            if (jsonMatches && jsonMatches.length > 0) {
              // Try the last match first (most likely the actual response)
              for (let i = jsonMatches.length - 1; i >= 0; i--) {
                try {
                  const errorResult = JSON.parse(jsonMatches[i]);
                  if (errorResult.error) {
                    return reject(new Error(errorResult.error));
                  }
                } catch (e) {
                  // Try next match if this one fails
                  continue;
                }
              }
            }
          } catch (e) {
            // Ignore JSON parse errors here, use original error
          }
          
          const errorMsg = stderr || stdout || `Python process exited with code ${code}`;
          return reject(new Error(errorMsg));
        }
        
        // If exit code is 0 but we can't parse, it's a different issue
        console.error(`[AI SERVICE] JSON parse error: ${parseError.message}`);
        console.error(`[AI SERVICE] stdout: ${stdout.substring(0, 500)}`);
        console.error(`[AI SERVICE] stderr: ${stderr.substring(0, 500)}`);
        reject(new Error(`Failed to parse Python output: ${parseError.message}`));
      }
    });

    // Handle process errors (e.g., Python not found)
    pythonProcess.on('error', (error) => {
      console.error(`[AI SERVICE] Process spawn error: ${error.message}`);
      reject(new Error(`Failed to execute Python script: ${error.message}`));
    });

    // Implement timeout
    const timeout = setTimeout(() => {
      pythonProcess.kill(); // Kill the process
      reject(new Error(`Python inference timeout after ${INFERENCE_TIMEOUT}ms`));
    }, INFERENCE_TIMEOUT);

    // Clear timeout on successful completion
    pythonProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

function simulateDetection(imagePath) {
  const filename = path.basename(imagePath).toLowerCase();
  
  if (filename.includes('unresponsive') || filename.includes('sleep')) {
    return {
      riskLevel: 'high',
      category: 'unresponsive',
      confidence: 0.85 + (Math.random() * 0.1 - 0.05),
      details: {
        method: 'simulated',
        note: 'Using simulated detection - matched filename pattern (unresponsive)'
      }
    };
  }
  
  if (filename.includes('abnormal') || filename.includes('drowsy')) {
    return {
      riskLevel: 'medium',
      category: 'abnormal',
      confidence: 0.78 + (Math.random() * 0.1 - 0.05),
      details: {
        method: 'simulated',
        note: 'Using simulated detection - matched filename pattern (abnormal)'
      }
    };
  }
  
  if (filename.includes('normal')) {
    return {
      riskLevel: 'low',
      category: 'normal',
      confidence: 0.82 + (Math.random() * 0.1 - 0.05),
      details: {
        method: 'simulated',
        note: 'Using simulated detection - matched filename pattern (normal)'
      }
    };
  }

  // For testing: You can modify these probabilities to test different scenarios
  // Current: 15% high, 25% medium, 60% low (normal)
  const random = Math.random();
  let riskLevel, category, baseConfidence;

  if (random < 0.15) {
    riskLevel = 'high';
    category = 'unresponsive';
    baseConfidence = 0.80;
  } else if (random < 0.40) {
    riskLevel = 'medium';
    category = 'abnormal';
    baseConfidence = 0.75;
  } else {
    riskLevel = 'low';
    category = 'normal';
    baseConfidence = 0.80;
  }

  const confidence = Math.min(1, Math.max(0, baseConfidence + (Math.random() * 0.15 - 0.075)));

  console.log(`\n[SIMULATED DETECTION] ⚠️  Using random fallback detection`);
  console.log(`[SIMULATED DETECTION] Result: ${category} (${riskLevel}) - ${(confidence * 100).toFixed(1)}% confidence`);
  console.log(`[SIMULATED DETECTION] Random value: ${random.toFixed(3)} (High: <0.15, Medium: 0.15-0.40, Low: >0.40)`);
  console.log(`[SIMULATED DETECTION] This is NOT real AI detection - model file missing!\n`);

  return {
    riskLevel,
    category,
    confidence,
    details: {
      method: 'simulated',
      note: 'Using simulated detection - AI service unavailable'
    }
  };
}

module.exports = {
  analyzeImage
};

