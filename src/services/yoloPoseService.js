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
    this.modelPath = modelPath;
    this.worker = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Create YOLO worker
        this.worker = new Worker(new URL('/poseDetectionWorker.combined.js', import.meta.url));
        
        const handleMessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'sessionCreated') {
            this.initialized = true;
            this.worker.removeEventListener('message', handleMessage);
            resolve();
          } else if (type === 'error') {
            this.worker.removeEventListener('message', handleMessage);
            reject(new Error(data.message));
          }
        };

        this.worker.addEventListener('message', handleMessage);
        this.worker.postMessage({ type: 'createSession' });
        
      } catch (error) {
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  async detectPose(image) {
    const startTime = performance.now();

    if (!this.initialized) {
      await this.initialize();
    }

    // Convert image to ImageData
    const imageData = this._imageToImageData(image);

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        resolve(createEmptyResult(this.modelPath, 'yolo', performance.now() - startTime));
        return;
      }

      const handleMessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'poseDetectionComplete') {
          this.worker.removeEventListener('message', handleMessage);
          
          const processingTime = performance.now() - startTime;
          // Pass image dimensions for coordinate normalization
          const result = this._convertToUnifiedFormat(
            data.results.poses, 
            processingTime, 
            imageData.width, 
            imageData.height
          );
          resolve(result);
        } else if (type === 'error') {
          this.worker.removeEventListener('message', handleMessage);
          resolve(createEmptyResult(this.modelPath, 'yolo', performance.now() - startTime));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      
      // Clone and send ImageData
      const dataClone = new Uint8ClampedArray(imageData.data);
      this.worker.postMessage({
        type: 'runPoseDetection',
        imageData: {
          data: dataClone.buffer,
          width: imageData.width,
          height: imageData.height
        }
      }, [dataClone.buffer]);
    });
  }

  isInitialized() {
    return this.initialized;
  }

  async dispose() {
    if (this.worker) {
      this.worker.postMessage({ type: 'dispose' });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      this.initializationPromise = null;
    }
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
}
