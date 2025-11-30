/**
 * YOLO Pose Detection Service Adapter
 * 
 * Wraps the existing YOLO pose detection service to implement
 * the unified PoseDetectionService interface.
 * 
 * YOLO models detect 17 keypoi      // Check if keypoints is already an array of objects (new format)
    if (keypoints.length > 0 && typeof keypoints[0] === 'object' && 'x' in keypoints[0]) {
      // New format: array of {x, y, confidence} objects
      if (index < keypoints.length) {
        const kp = keypoints[index];
        console.log(`      Object format - kp:`, kp);
        
        // Lower threshold to 0.1 for YOLO (it tends to have lower confidence scores)
        if (kp.confidence > 0.1) {
          console.log(`      ✅ Confidence ${kp.confidence} > 0.1, returning keypoint`);
          return createKeypoint(kp.x, kp.y, kp.confidence);
        } else {
          console.log(`      ❌ Confidence ${kp.confidence} <= 0.1, returning null`);
        }mat):
 * - Keypoint 9: Left Wrist → maps to leftHand
 * - Keypoint 10: Right Wrist → maps to rightHand
 * - Keypoint 15: Left Ankle → maps to leftFoot
 * - Keypoint 16: Right Ankle → maps to rightFoot
 */

import { PoseDetectionService, createKeypoint, createEmptyResult, createPoseResult } from '../types/poseDetection.js';

// YOLO COCO keypoint indices
const YOLO_KEYPOINTS = {
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

export class YoloPoseService extends PoseDetectionService {
  constructor(modelPath) {
    super();
    if (!modelPath) {
      throw new Error('modelPath is required for YoloPoseService');
    }
    this.modelPath = modelPath;
    this.yoloSession = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        console.log('🚀 Initializing YOLO Pose with WASM backend (main thread)...');
        
        // Import ONNX Runtime (WASM CPU - universal compatibility)
        const ort = await import('onnxruntime-web');
        
        console.log('✅ WASM CPU backend - universal compatibility!');
        console.log('✅ Using JavaScript NMS - no separate NMS model needed!');
        
        const sessionConfig = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'basic',
          enableMemPattern: false,
          enableCpuMemArena: false,
          wasm: {
            numThreads: Math.max(1, Math.min(4, navigator.hardwareConcurrency - 2)),
            simd: true,
            threads: true,
          },
        };

        // Load YOLO model only (JavaScript NMS)
        console.log('📥 Loading YOLO model...');
        const startTime = performance.now();
        
        this.yoloSession = await ort.InferenceSession.create(this.modelPath, sessionConfig);
        
        const duration = performance.now() - startTime;
        console.log(`✅ YOLO session created in ${(duration / 1000).toFixed(1)}s`);
        console.log(`   YOLO Inputs: ${this.yoloSession.inputNames.join(', ')}`);
        console.log(`   YOLO Outputs: ${this.yoloSession.outputNames.join(', ')}`);
        
        this.initialized = true;
      } catch (error) {
        console.error('❌ Failed to initialize YOLO:', error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  async detectPose(image) {
    const startTime = performance.now();

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.yoloSession) {
      return createEmptyResult(this.modelPath, 'yolo', performance.now() - startTime);
    }

    try {
      // Convert image to ImageData
      const imageData = this._imageToImageData(image);
      
      // Run inference directly in main thread
      const poses = await this._runInference(imageData);
      
      const processingTime = performance.now() - startTime;
      
      // Convert to unified format
      const result = this._convertToUnifiedFormat(
        poses, 
        processingTime, 
        imageData.width, 
        imageData.height
      );
      
      return result;
    } catch (error) {
      console.error('Error in detectPose:', error);
      return createEmptyResult(this.modelPath, 'yolo', performance.now() - startTime);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async dispose() {
    if (this.yoloSession) {
      await this.yoloSession.release();
      this.yoloSession = null;
    }
    this.initialized = false;
    this.initializationPromise = null;
  }

  getModelInfo() {
    return {
      name: this.modelPath,
      provider: 'yolo',
      keypointCount: 17,
      format: 'COCO',
      trackedPoints: 'wrists + ankles',
    };
  }

  /**
   * Convert YOLO results to unified format
   * @private
   * @param {Array} poses - Raw pose data from YOLO worker
   * @param {number} processingTime - Processing time in ms
   * @param {number} imageWidth - Original image width for normalization
   * @param {number} imageHeight - Original image height for normalization
   */
  _convertToUnifiedFormat(poses, processingTime, imageWidth, imageHeight) {
    if (!poses || poses.length === 0) {
      console.log('❌ No poses detected');
      return createEmptyResult(this.modelPath, 'yolo', processingTime);
    }

    // Use the first (most confident) pose
    const pose = poses[0];
    const keypoints = pose.keypoints;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`YOLO - Image: ${imageWidth}x${imageHeight}, Detected ${keypoints.length} keypoints`);
    
    // Extract YOLO keypoints (wrists and ankles) with normalization
    const leftHand = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.LEFT_WRIST, 'LEFT_WRIST', imageWidth, imageHeight);
    const rightHand = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.RIGHT_WRIST, 'RIGHT_WRIST', imageWidth, imageHeight);
    const leftFoot = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.LEFT_ANKLE, 'LEFT_ANKLE', imageWidth, imageHeight);
    const rightFoot = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.RIGHT_ANKLE, 'RIGHT_ANKLE', imageWidth, imageHeight);

    console.log(`RESULT: LH=${leftHand?'✓':'✗'} RH=${rightHand?'✓':'✗'} LF=${leftFoot?'✓':'✗'} RF=${rightFoot?'✓':'✗'}`);
    console.log(`${'='.repeat(80)}\n`);

    return createPoseResult(
      { leftHand, rightHand, leftFoot, rightFoot },
      this.modelPath,
      'yolo',
      processingTime,
      poses // Include all raw poses
    );
  }

  /**
   * Extract a single keypoint from YOLO output
   * @private
   * @param {Array} keypoints - Raw keypoints from YOLO worker (absolute pixel coordinates)
   * @param {number} index - Keypoint index
   * @param {string} name - Keypoint name for logging
   * @param {number} imageWidth - Original image width for normalization
   * @param {number} imageHeight - Original image height for normalization
   */
  _extractKeypoint(keypoints, index, name = '', imageWidth = 640, imageHeight = 640) {
    // Check if keypoints is already an array of objects (new format)
    if (keypoints.length > 0 && typeof keypoints[0] === 'object' && 'x' in keypoints[0]) {
      // New format: array of {x, y, confidence} objects
      if (index < keypoints.length) {
        const kp = keypoints[index];
        
        if (kp.confidence > 0.1) {
          // SIMPLIFIED: Keep raw pixel coordinates (no normalization)
          console.log(`  ${name}: (${kp.x.toFixed(0)}, ${kp.y.toFixed(0)}) conf=${(kp.confidence*100).toFixed(0)}%`);
          return createKeypoint(kp.x, kp.y, kp.confidence);
        } else {
          console.log(`  ${name}: LOW CONFIDENCE ${(kp.confidence*100).toFixed(0)}%`);
        }
      }
    } else {
      // Old format: flat array [x1, y1, conf1, x2, y2, conf2, ...]
      if (index < keypoints.length / 3) {
        const x = keypoints[index * 3];
        const y = keypoints[index * 3 + 1];
        const confidence = keypoints[index * 3 + 2];
        
        console.log(`      Flat array format - x=${x}, y=${y}, confidence=${confidence}`);
        
        // Lower threshold to 0.1 for YOLO
        if (confidence > 0.1) {
          console.log(`      ✅ Confidence ${confidence} > 0.1, returning keypoint`);
          // SIMPLIFIED: Keep raw pixel coordinates (no normalization)
          return createKeypoint(x, y, confidence);
        } else {
          console.log(`      ❌ Confidence ${confidence} <= 0.1, returning null`);
        }
      } else {
        console.log(`      ❌ Index ${index} out of bounds (length/3: ${keypoints.length / 3})`);
      }
    }
    
    return null;
  }

  /**
   * Convert various image formats to ImageData
   * @private
   */
  _imageToImageData(image) {
    // If already ImageData, return it
    if (image instanceof ImageData) {
      return image;
    }

    // Create canvas to convert
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
      canvas.width = image.width || image.naturalWidth;
      canvas.height = image.height || image.naturalHeight;
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    throw new Error('Unsupported image format');
  }

  /**
   * Run YOLO inference on image (copied from working worker)
   * @private
   */
  async _runInference(imageData) {
    // This is the exact working logic from poseDetectionWorker.js
    const ort = await import('onnxruntime-web');
    
    const INPUT_SIZE = 640;
    const { width, height } = imageData;
    
    // Calculate padding to square (matching worker approach)
    const maxSize = Math.max(width, height);
    const xPad = maxSize - width;
    const yPad = maxSize - height;

    const xRatio = maxSize / width;
    const yRatio = maxSize / height;

    // Create padded canvas (make it square)
    const paddedCanvas = document.createElement('canvas');
    paddedCanvas.width = maxSize;
    paddedCanvas.height = maxSize;
    const paddedCtx = paddedCanvas.getContext('2d');

    // Fill with black
    paddedCtx.fillStyle = 'black';
    paddedCtx.fillRect(0, 0, maxSize, maxSize);

    // Draw image with proper padding
    let xOffset = 0, yOffset = 0;
    if (height > width) {
      xOffset = xPad / 2;
      paddedCtx.drawImage(
        await createImageBitmap(imageData),
        xOffset, 0, width, height
      );
    } else {
      yOffset = yPad / 2;
      paddedCtx.drawImage(
        await createImageBitmap(imageData),
        0, yOffset, width, height
      );
    }

    // Resize to model input size
    const modelCanvas = document.createElement('canvas');
    modelCanvas.width = INPUT_SIZE;
    modelCanvas.height = INPUT_SIZE;
    const modelCtx = modelCanvas.getContext('2d', { willReadFrequently: true });
    modelCtx.drawImage(paddedCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);

    const resizedData = modelCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
    const data = resizedData.data;

    // Convert to tensor format (RGB, CHW, normalized)
    const float32Array = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);

    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
      const pixelIndex = i * 4;
      float32Array[i] = data[pixelIndex] / 255.0; // R
      float32Array[i + INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 1] / 255.0; // G
      float32Array[i + 2 * INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 2] / 255.0; // B
    }

    const tensor = new ort.Tensor('float32', float32Array, [1, 3, INPUT_SIZE, INPUT_SIZE]);

    // Run YOLO inference
    const { output0 } = await this.yoloSession.run({ images: tensor });

    // JavaScript NMS post-processing
    const scale = maxSize / INPUT_SIZE;
    const poses = this._processYoloWithJsNMS(output0, scale, xOffset, yOffset, width, height);
    
    return poses;
  }

  /**
   * Process YOLO output with JavaScript NMS
   * @private
   */
  _processYoloWithJsNMS(yoloOutput, scale, xOffset, yOffset, originalWidth, originalHeight) {
    const scoreThreshold = 0.25;
    const iouThreshold = 0.45;
    const maxDetections = 50;

    // Parse YOLO output: [1, 56, num_anchors]
    const data = yoloOutput.data;
    const numAnchors = yoloOutput.dims[2];
    
    const detections = [];
    
    // Extract all detections above threshold
    for (let i = 0; i < numAnchors; i++) {
      // Column-major format: data[row * numAnchors + col]
      const confidence = data[4 * numAnchors + i];
      
      if (confidence < scoreThreshold) continue;
      
      // Extract bbox (center_x, center_y, width, height)
      const cx = data[0 * numAnchors + i];
      const cy = data[1 * numAnchors + i];
      const w = data[2 * numAnchors + i];
      const h = data[3 * numAnchors + i];
      
      // Convert to x1, y1, x2, y2
      const x1 = cx - w / 2;
      const y1 = cy - h / 2;
      const x2 = cx + w / 2;
      const y2 = cy + h / 2;
      
      // Extract keypoints (17 keypoints × 3 values)
      const keypoints = [];
      for (let k = 0; k < 17; k++) {
        const kptX = data[(5 + k * 3) * numAnchors + i];
        const kptY = data[(5 + k * 3 + 1) * numAnchors + i];
        let kptConf = data[(5 + k * 3 + 2) * numAnchors + i];
        
        // Normalize confidence if > 1 (YOLO outputs 0-100 range)
        if (kptConf > 1) kptConf = kptConf / 100;
        
        keypoints.push({ x: kptX, y: kptY, confidence: kptConf });
      }
      
      detections.push({
        box: [x1, y1, x2, y2],
        confidence,
        keypoints
      });
    }
    
    // Apply NMS
    const selected = this._applyNMS(detections, iouThreshold, maxDetections);
    
    // Transform to original image space
    const poses = [];
    for (const det of selected) {
      const transformedKeypoints = [];
      
      for (const kp of det.keypoints) {
        let x = kp.x * scale - xOffset;
        let y = kp.y * scale - yOffset;
        
        // Clamp to image bounds
        x = Math.max(0, Math.min(originalWidth, x));
        y = Math.max(0, Math.min(originalHeight, y));
        
        transformedKeypoints.push({
          x,
          y,
          confidence: kp.confidence
        });
      }
      
      poses.push({
        keypoints: transformedKeypoints,
        confidence: det.confidence
      });
    }
    
    return poses;
  }

  /**
   * Apply Non-Maximum Suppression
   * @private
   */
  _applyNMS(detections, iouThreshold, maxDetections) {
    // Sort by confidence (highest first)
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    
    const selected = [];
    const suppressed = new Set();
    
    for (let i = 0; i < sorted.length && selected.length < maxDetections; i++) {
      if (suppressed.has(i)) continue;
      
      selected.push(sorted[i]);
      
      // Suppress overlapping boxes
      for (let j = i + 1; j < sorted.length; j++) {
        if (suppressed.has(j)) continue;
        
        const iou = this._calculateIoU(sorted[i].box, sorted[j].box);
        if (iou > iouThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return selected;
  }

  /**
   * Calculate Intersection over Union
   * @private
   */
  _calculateIoU(box1, box2) {
    const [x1_1, y1_1, x2_1, y2_1] = box1;
    const [x1_2, y1_2, x2_2, y2_2] = box2;
    
    // Calculate intersection
    const x1_i = Math.max(x1_1, x1_2);
    const y1_i = Math.max(y1_1, y1_2);
    const x2_i = Math.min(x2_1, x2_2);
    const y2_i = Math.min(y2_1, y2_2);
    
    const intersectionArea = Math.max(0, x2_i - x1_i) * Math.max(0, y2_i - y1_i);
    
    // Calculate union
    const box1Area = (x2_1 - x1_1) * (y2_1 - y1_1);
    const box2Area = (x2_2 - x1_2) * (y2_2 - y1_2);
    const unionArea = box1Area + box2Area - intersectionArea;
    
    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }
}
