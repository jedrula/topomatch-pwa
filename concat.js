import { readFileSync, writeFileSync } from 'fs';

// Read the shared ONNX runtime once
const onnxCode = readFileSync('src/workers/inferenceWorkerOnnxCode.js', 'utf-8');

// Build inference worker
const inferenceWorker = readFileSync('src/workers/inferenceWorker.js', 'utf-8');
writeFileSync('public/inferenceWorker.combined.js', onnxCode + '\n' + inferenceWorker);

// Build hold detection worker
const holdDetectionWorker = readFileSync('src/workers/holdDetectionWorker.js', 'utf-8');
writeFileSync('public/holdDetectionWorker.combined.js', onnxCode + '\n' + holdDetectionWorker);

// Build pose detection worker (use the fixed version to avoid variable conflicts)
const poseDetectionWorker = readFileSync('src/workers/poseDetectionWorker.js', 'utf-8');
writeFileSync('public/poseDetectionWorker.combined.js', onnxCode + '\n' + poseDetectionWorker);

console.log('✅ All workers built successfully with appropriate ONNX runtime versions');
