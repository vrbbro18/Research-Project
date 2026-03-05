const fs = require('fs');
const path = require('path');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          FIND YOUR TRAINED MODEL FILE                   ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const projectRoot = path.join(__dirname, '..', '..');
const searchPaths = [
  path.join(projectRoot, 'ai'),
  path.join(projectRoot, 'models'),
  path.join(projectRoot, 'ai', 'models'),
  projectRoot
];

const modelExtensions = ['.h5', '.keras', '.pkl', '.pt', '.pth', '.onnx', '.tflite'];

function findModelFiles(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];
  
  const files = [];
  try {
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (modelExtensions.includes(ext)) {
            files.push({
              path: fullPath,
              name: item,
              size: stat.size,
              relative: path.relative(projectRoot, fullPath)
            });
          }
        } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...findModelFiles(fullPath, depth + 1, maxDepth));
        }
      } catch (e) {
        // Skip files we can't access
      }
    }
  } catch (e) {
    // Skip directories we can't access
  }
  
  return files;
}

console.log('🔍 Searching for model files...\n');

const allModels = [];
for (const searchPath of searchPaths) {
  if (fs.existsSync(searchPath)) {
    const models = findModelFiles(searchPath);
    allModels.push(...models);
  }
}

if (allModels.length > 0) {
  console.log(`✅ Found ${allModels.length} model file(s):\n`);
  allModels.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model.name}`);
    console.log(`      Location: ${model.relative}`);
    console.log(`      Full Path: ${model.path}`);
    console.log(`      Size: ${(model.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
  });
  
  const recommendedModel = allModels[0];
  console.log('💡 RECOMMENDATION:');
  console.log(`   Use this model: ${recommendedModel.relative}`);
  console.log(`\n   Add to backend/.env file:`);
  console.log(`   MODEL_PATH=${recommendedModel.relative.replace(/\\/g, '/')}`);
  console.log('');
} else {
  console.log('❌ No model files found!\n');
  console.log('📋 Please check:');
  console.log('   1. Your model file should have extension: .h5, .keras, or .pkl');
  console.log('   2. Place it in one of these locations:');
  console.log('      - ai/driver_safety_model.h5');
  console.log('      - ai/models/driver_safety_model.h5');
  console.log('      - models/driver_safety_model.h5');
  console.log('   3. Or set MODEL_PATH in backend/.env file\n');
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  After placing your model, restart the backend server   ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');





