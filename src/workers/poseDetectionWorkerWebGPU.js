// Pose Detection Worker - YOLOv8 with WebGPU
// ES Module worker using onnxruntime-web/webgpu

// ✨ CRITICAL: Import from /webgpu for GPU acceleration
import * as ort from 'onnxruntime-web/webgpu';

// Worker state
let yolov8Session = null;
let nmsSession = null;

// YOLO-pose configuration
const MODEL_PATH = '/yolo11m-pose.onnx';
const NMS_PATH = '/modified-nms-yolov8-pose.onnx';
const INPUT_SIZE = 640;
const MODEL_INPUT_SHAPE = [1, 3, 640, 640];

// Detection configuration
const topk = 50;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;

// Enable WebGPU profiling for debugging
ort.env.webgpu.profilingMode = 'default';

console.log('🚀 [PoseWorkerWebGPU] Module loaded, ONNX Runtime WebGPU available');

// Message handler
self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'createSession') {
    try {
      const startTime = performance.now();

      // Check WebGPU support
      if (!navigator.gpu) {
        throw new Error('WebGPU not supported in this browser. Use Chrome 113+ or Edge 113+');
      }

      console.log('🎮 [PoseWorkerWebGPU] WebGPU supported, creating sessions...');

      // ✨ CRITICAL: Use WebGPU execution provider
      const sessionConfig = {
        executionProviders: ['webgpu'],
        graphOptimizationLevel: 'all',
        enableMemPattern: false,
        enableCpuMemArena: false,
      };

      console.log('📥 [PoseWorkerWebGPU] Loading YOLO model...');
      
      // Load YOLO model
      const modelResponse = await fetch(MODEL_PATH);
      if (!modelResponse.ok) {
        throw new Error(`Failed to load model: ${modelResponse.status} ${modelResponse.statusText}`);
      }
      const modelBuffer = await modelResponse.arrayBuffer();
      
      yolov8Session = await ort.InferenceSession.create(
        new Uint8Array(modelBuffer),
        sessionConfig
      );

      console.log('📥 [PoseWorkerWebGPU] Loading NMS model...');
      
      // Load NMS model  
      const nmsResponse = await fetch(NMS_PATH);
      if (!nmsResponse.ok) {
        throw new Error(`Failed to load NMS model: ${nmsResponse.status} ${nmsResponse.statusText}`);
      }
      const nmsBuffer = await nmsResponse.arrayBuffer();
      
      nmsSession = await ort.InferenceSession.create(
        new Uint8Array(nmsBuffer),
        sessionConfig
      );

      const duration = performance.now() - startTime;
      
      console.log(`✅ [PoseWorkerWebGPU] Sessions created in ${duration.toFixed(0)}ms using WebGPU`);
      console.log(`   YOLO inputs: ${yolov8Session.inputNames.join(', ')}`);
      console.log(`   YOLO outputs: ${yolov8Session.outputNames.join(', ')}`);
      console.log(`   NMS inputs: ${nmsSession.inputNames.join(', ')}`);
      console.log(`   NMS outputs: ${nmsSession.outputNames.join(', ')}`);
      console.log(`   ⚡ First inference will be slower (shader compilation)`);
      console.log(`   ⚡ Subsequent inferences will be 5-10x faster than CPU!`);

      self.postMessage({
        type: 'sessionCreated',
        duration,
        backend: 'webgpu'
      });

    } catch (error) {
      console.error('❌ [PoseWorkerWebGPU] Session creation failed:', error);
      self.postMessage({
        type: 'error',
        error: `Failed to create session: ${error.message}`
      });
    }
    return;
  }

  if (type === 'runPoseDetection') {
    if (!yolov8Session || !nmsSession) {
      self.postMessage({
        type: 'error',
        error: 'Sessions not initialized. Call createSession first.'
      });
      return;
    }

    try {
      const startTime = performance.now();

      // Preprocess image data to YOLO format
      const input = preprocessImage(imageData);

      // Run YOLO inference
      const yoloStartTime = performance.now();
      const inputTensor = new ort.Tensor('float32', input, MODEL_INPUT_SHAPE);
      const feeds = {};
      feeds[yolov8Session.inputNames[0]] = inputTensor;
      
      const yoloResults = await yolov8Session.run(feeds);
      const yoloDuration = performance.now() - yoloStartTime;
      
      console.log(`⚡ [PoseWorkerWebGPU] YOLO inference: ${yoloDuration.toFixed(0)}ms`);

      // Get YOLO output
      const yoloOutput = yoloResults[yolov8Session.outputNames[0]];

      // Run NMS
      const nmsStartTime = performance.now();
      
      // Create NMS config tensor [topk, iouThreshold, scoreThreshold]
      const config = new ort.Tensor(
        'float32',
        new Float32Array([topk, iouThreshold, scoreThreshold])
      );
      
      const nmsFeeds = {
        detection: yoloOutput,
        config: config
      };
      
      const nmsResults = await nmsSession.run(nmsFeeds);
      const nmsDuration = performance.now() - nmsStartTime;
      
      console.log(`⚡ [PoseWorkerWebGPU] NMS inference: ${nmsDuration.toFixed(0)}ms`);

      // Parse results
      const poses = parseDetections(nmsResults, imageData.width, imageData.height);

      const totalDuration = performance.now() - startTime;
      console.log(`✅ [PoseWorkerWebGPU] Total: ${totalDuration.toFixed(0)}ms, Found ${poses.length} pose(s)`);

      self.postMessage({
        type: 'detectionComplete',
        poses,
        inferenceTime: totalDuration,
        yoloTime: yoloDuration,
        nmsTime: nmsDuration
      });

    } catch (error) {
      console.error('❌ [PoseWorkerWebGPU] Detection failed:', error);
      self.postMessage({
        type: 'error',
        error: `Detection failed: ${error.message}`
      });
    }
    return;
  }
};

// Preprocess image for YOLO with letterboxing (NCHW format: [batch, channels, height, width])
function preprocessImage(imageData) {
  // Calculate padding to make square (letterboxing like OpenCV)
  const maxSize = Math.max(imageData.width, imageData.height);
  
  // Create padded canvas (square)
  const paddedCanvas = new OffscreenCanvas(maxSize, maxSize);
  const paddedCtx = paddedCanvas.getContext('2d');
  
  // Fill with black (like OpenCV BORDER_CONSTANT)
  paddedCtx.fillStyle = 'black';
  paddedCtx.fillRect(0, 0, maxSize, maxSize);
  
  // Create source canvas from ImageData
  const srcCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.putImageData(imageData, 0, 0);
  
  // Calculate offsets to center the image
  const xOffset = imageData.width < maxSize ? (maxSize - imageData.width) / 2 : 0;
  const yOffset = imageData.height < maxSize ? (maxSize - imageData.height) / 2 : 0;
  
  // Draw image centered in padded canvas
  paddedCtx.drawImage(srcCanvas, xOffset, yOffset, imageData.width, imageData.height);
  
  // Resize to model input size
  const modelCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const modelCtx = modelCanvas.getContext('2d', { willReadFrequently: true });
  modelCtx.drawImage(paddedCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);
  
  const resized = modelCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const pixels = resized.data;

  // Convert to NCHW format and normalize to [0, 1]
  const inputData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
  const pixelCount = INPUT_SIZE * INPUT_SIZE;

  for (let i = 0; i < pixelCount; i++) {
    inputData[i] = pixels[i * 4] / 255.0;                    // R channel
    inputData[pixelCount + i] = pixels[i * 4 + 1] / 255.0;   // G channel  
    inputData[pixelCount * 2 + i] = pixels[i * 4 + 2] / 255.0; // B channel
  }

  return inputData;
}

// Parse NMS output to pose objects
function parseDetections(nmsResults, originalWidth, originalHeight) {
  // NMS output: 'selected' tensor with shape [batch, num_detections, 56]
  // Each detection: [x, y, w, h, score, ...51 keypoint values]
  const selected = nmsResults.selected;
  const poses = [];
  
  const numDetections = selected.dims[1];
  const valuesPerDetection = selected.dims[2]; // Should be 56

  // Calculate scaling from 640x640 to original image
  const maxSize = Math.max(originalWidth, originalHeight);
  const modelToOriginalScale = maxSize / INPUT_SIZE;
  
  // Calculate padding offsets
  const xOffset = originalWidth < originalHeight ? (maxSize - originalWidth) / 2 : 0;
  const yOffset = originalHeight < originalWidth ? (maxSize - originalHeight) / 2 : 0;

  for (let i = 0; i < numDetections; i++) {
    const detectionStart = i * valuesPerDetection;
    const data = selected.data.slice(detectionStart, detectionStart + valuesPerDetection);

    // Extract box and score
    const [modelX, modelY, modelW, modelH] = data.slice(0, 4);
    const score = data[4];
    
    if (score < scoreThreshold) continue;

    // Convert from model space (640x640 padded) to original image space
    const x = modelX * modelToOriginalScale - xOffset;
    const y = modelY * modelToOriginalScale - yOffset;
    const width = modelW * modelToOriginalScale;
    const height = modelH * modelToOriginalScale;

    const box = {
      x: Math.max(0, Math.min(originalWidth, x)),
      y: Math.max(0, Math.min(originalHeight, y)),
      width,
      height
    };

    // Extract keypoints (51 values: 17 keypoints × 3)
    const keypointData = data.slice(5, 56);
    const keypoints = [];
    
    for (let k = 0; k < 17; k++) {
      const modelKpX = keypointData[k * 3];
      const modelKpY = keypointData[k * 3 + 1];
      const confidence = keypointData[k * 3 + 2];

      // Convert from model space to original image space
      const kpX = modelKpX * modelToOriginalScale - xOffset;
      const kpY = modelKpY * modelToOriginalScale - yOffset;

      keypoints.push({
        x: Math.max(0, Math.min(originalWidth, kpX)),
        y: Math.max(0, Math.min(originalHeight, kpY)),
        confidence
      });
    }

    poses.push({
      box,
      keypoints,
      score
    });
  }

  return poses;
}

// Send ready message
self.postMessage({ type: 'ready' });
console.log('✅ [PoseWorkerWebGPU] Worker ready');
