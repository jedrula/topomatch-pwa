/**
 * Pose Detection Worker - Best Practices Implementation
 * Following ONNX Runtime Web best practices
 * Based on FatemeZamanian/YOLOv8-pose-onnxruntime-web
 * 
 * Key improvements:
 * - Uses ES modules instead of concatenated files
 * - Imports ONNX Runtime Web directly
 * - Cleaner architecture following official docs
 */

import * as ort from 'onnxruntime-web';
import { getONNXSessionConfig } from '../utils/wasmConfig.js';

// Worker state
let yolov8Session = null;
let nmsSession = null;

// YOLOv8n-pose configuration
const MODEL_PATH = '/yolov8n-pose.onnx';
const NMS_PATH = '/modified-nms-yolov8-pose.onnx';
const INPUT_SIZE = 640;
const MODEL_INPUT_SHAPE = [1, 3, 640, 640];

// Detection configuration
const topk = 50;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;

// Message handler
self.onmessage = async (event) => {
  const { type, imageData } = event.data;

  if (type === 'createSession') {
    try {
      const startTime = performance.now();

      // Universal optimized threading for all devices
      const hardwareCores = navigator.hardwareConcurrency || 4;
      const optimalThreads = Math.max(1, Math.min(4, hardwareCores - 2));

      console.log(`🧵 [PoseWorker] Creating sessions with ${optimalThreads} threads (hardware: ${hardwareCores}, reserved: 2)`);

      // Get optimized session config for this platform
      const sessionConfig = getONNXSessionConfig(optimalThreads);

      console.log(`⚙️ [PoseWorker] Config:`, {
        optimization: sessionConfig.graphOptimizationLevel,
        memPattern: sessionConfig.enableMemPattern,
        cpuArena: sessionConfig.enableCpuMemArena
      });

      // Create main YOLOv8 session
      console.log(`📦 [PoseWorker] Loading YOLOv8 model from ${MODEL_PATH}...`);
      yolov8Session = await ort.InferenceSession.create(MODEL_PATH, sessionConfig);
      console.log(`✅ [PoseWorker] YOLOv8 session created successfully`);

      // Create NMS session
      console.log(`📦 [PoseWorker] Loading NMS model from ${NMS_PATH}...`);
      nmsSession = await ort.InferenceSession.create(NMS_PATH, sessionConfig);
      console.log(`✅ [PoseWorker] NMS session created successfully`);

      // Warmup the model
      console.log(`🔥 [PoseWorker] Warming up model...`);
      const tensor = new ort.Tensor(
        'float32',
        new Float32Array(MODEL_INPUT_SHAPE.reduce((a, b) => a * b)),
        MODEL_INPUT_SHAPE
      );
      await yolov8Session.run({ images: tensor });
      console.log(`✅ [PoseWorker] Warmup complete`);

      const endTime = performance.now();

      self.postMessage({
        type: 'sessionCreated',
        data: {
          sessionTime: endTime - startTime,
        },
      });

    } catch (error) {
      console.error('Failed to create pose detection sessions:', error);
      self.postMessage({
        type: 'error',
        data: { message: 'Failed to load pose detection models: ' + error.message },
      });
    }
  }

  if (type === 'dispose' || type === 'terminate') {
    try {
      if (yolov8Session) {
        await yolov8Session.dispose();
        yolov8Session = null;
      }
      
      if (nmsSession) {
        await nmsSession.dispose();
        nmsSession = null;
      }
      
      self.postMessage({
        type: 'disposed',
        data: { message: 'Sessions disposed successfully' }
      });
    } catch (error) {
      console.error('Error disposing sessions:', error);
      self.postMessage({
        type: 'error',
        data: { message: 'Error disposing sessions: ' + error.message }
      });
    }
  }

  if (type === 'runPoseDetection') {
    if (!yolov8Session || !nmsSession) {
      self.postMessage({
        type: 'error',
        data: { message: 'Pose detection sessions are not initialized.' },
      });
      return;
    }

    let imageBitmap = null;

    try {
      if (!imageData || !imageData.data) {
        self.postMessage({
          type: 'error',
          data: { message: 'Image data must be provided.' },
        });
        return;
      }

      // Raw ImageData - no JPEG compression!
      const { data, width, height } = imageData;
      
      // Create ImageData from raw buffer
      const rawImageData = new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
      );
      
      // Create bitmap directly from ImageData (no quality loss!)
      imageBitmap = await createImageBitmap(rawImageData);

      const startTime = performance.now();

      // Preprocess image
      const { tensor, xRatio, yRatio, xOffset, yOffset } = preprocessImageYOLOv8(imageBitmap);

      // Run main YOLOv8 inference
      const { output0 } = await yolov8Session.run({ images: tensor });

      // Create NMS config tensor
      const config = new ort.Tensor(
        'float32',
        new Float32Array([
          topk,
          iouThreshold,
          scoreThreshold,
        ])
      );

      // Run NMS post-processing
      const { selected } = await nmsSession.run({
        detection: output0,
        config: config,
      });

      // Process results
      const poses = processYOLOv8Results(
        selected,
        xRatio,
        yRatio,
        xOffset,
        yOffset,
        imageBitmap.width,
        imageBitmap.height
      );

      const endTime = performance.now();
      
      self.postMessage({
        type: 'poseDetectionComplete',
        data: {
          inferenceTime: endTime - startTime,
          results: { poses },
          imageInfo: {
            originalWidth: imageBitmap.width,
            originalHeight: imageBitmap.height,
            xRatio,
            yRatio,
          },
        },
      });
    } catch (error) {
      console.error('Pose detection inference error:', error);
      
      let errorMessage = 'Pose detection failed: ' + error.message;
      
      if (error.message.includes('out of memory') || error.message.includes('OOM')) {
        errorMessage = 'Not enough memory available - try closing other apps or using a smaller video';
      } else if (error.message.includes('session') || error.message.includes('model')) {
        errorMessage = 'Detection model error - try refreshing the page';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Detection timed out - your device may be overloaded';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Failed to load detection model - check your internet connection';
      }
      
      self.postMessage({
        type: 'error',
        data: { message: errorMessage, originalError: error.message },
      });
    } finally {
      // Clean up resources
      if (imageBitmap && typeof imageBitmap.close === 'function') {
        imageBitmap.close();
      }
      imageBitmap = null;
    }
  }
};

/**
 * Preprocess image for YOLOv8
 */
function preprocessImageYOLOv8(imageBitmap) {
  // Calculate padding to square
  const maxSize = Math.max(imageBitmap.width, imageBitmap.height);
  const xPad = maxSize - imageBitmap.width;
  const yPad = maxSize - imageBitmap.height;

  const xRatio = maxSize / imageBitmap.width;
  const yRatio = maxSize / imageBitmap.height;

  // Create padded canvas
  const paddedCanvas = new OffscreenCanvas(maxSize, maxSize);
  const paddedCtx = paddedCanvas.getContext('2d');

  paddedCtx.fillStyle = 'black';
  paddedCtx.fillRect(0, 0, maxSize, maxSize);

  let xOffset = 0,
    yOffset = 0;
  if (imageBitmap.height > imageBitmap.width) {
    xOffset = xPad / 2;
    paddedCtx.drawImage(imageBitmap, xOffset, 0, imageBitmap.width, imageBitmap.height);
  } else {
    yOffset = yPad / 2;
    paddedCtx.drawImage(imageBitmap, 0, yOffset, imageBitmap.width, imageBitmap.height);
  }

  // Resize to model input size
  const modelCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const modelCtx = modelCanvas.getContext('2d', { willReadFrequently: true });
  modelCtx.drawImage(paddedCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);

  const imageData = modelCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const data = imageData.data;

  // Convert to tensor format (RGB, CHW, normalized)
  const float32Array = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const pixelIndex = i * 4;
    float32Array[i] = data[pixelIndex] / 255.0;
    float32Array[i + INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 1] / 255.0;
    float32Array[i + 2 * INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 2] / 255.0;
  }

  const tensor = new ort.Tensor('float32', float32Array, MODEL_INPUT_SHAPE);

  return { tensor, xRatio, yRatio, xOffset, yOffset };
}

/**
 * Process YOLOv8 results into pose data
 */
function processYOLOv8Results(
  selected,
  xRatio,
  yRatio,
  xOffset,
  yOffset,
  originalWidth,
  originalHeight
) {
  const poses = [];

  for (let idx = 0; idx < selected.dims[1]; idx++) {
    const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2]);

    const box = data.slice(0, 4);
    const score = data.slice(4, 5)[0];
    const landmarks = data.slice(5);

    const maxSize = Math.max(originalWidth, originalHeight);
    const modelToOriginalScale = maxSize / INPUT_SIZE;

    const [x, y, w, h] = [
      box[0] * modelToOriginalScale - xOffset,
      box[1] * modelToOriginalScale - yOffset,
      box[2] * modelToOriginalScale,
      box[3] * modelToOriginalScale,
    ];

    // Process keypoints
    const keypoints = [];
    for (let k = 0; k < 17; k++) {
      const modelKpX = landmarks[k * 3];
      const modelKpY = landmarks[k * 3 + 1];
      const kpConf = landmarks[k * 3 + 2];

      let kpX = modelKpX * modelToOriginalScale - xOffset;
      let kpY = modelKpY * modelToOriginalScale - yOffset;

      keypoints.push({
        x: Math.max(0, Math.min(originalWidth, kpX)),
        y: Math.max(0, Math.min(originalHeight, kpY)),
        confidence: kpConf,
      });
    }

    poses.push({
      bbox: {
        x: Math.max(0, x - w / 2),
        y: Math.max(0, y - h / 2),
        width: Math.min(originalWidth, w),
        height: Math.min(originalHeight, h),
      },
      confidence: score,
      keypoints,
    });
  }
  
  return poses;
}
