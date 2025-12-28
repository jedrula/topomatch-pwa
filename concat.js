import { readFileSync, writeFileSync } from 'fs';

// Read the shared ONNX runtime once
const onnxCode = readFileSync('src/workers/inferenceWorkerOnnxCode.js', 'utf-8');

// Build inference worker (for image matching between video frames and boulder images)
const inferenceWorker = readFileSync('src/workers/inferenceWorker.js', 'utf-8');
writeFileSync('public/inferenceWorker.combined.js', onnxCode + '\n' + inferenceWorker);

// Build pose detection worker (for keypoint detection from video frames)
const poseDetectionWorker = readFileSync('src/workers/poseDetectionWorker.js', 'utf-8');
writeFileSync('public/poseDetectionWorker.combined.js', onnxCode + '\n' + poseDetectionWorker);

console.log('✅ Image matching and pose detection workers built successfully (OLD concatenated versions with iOS optimizations)');
