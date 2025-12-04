// Pose Detection Service
// Wraps the YOLOv8 pose detection worker for easy integration

import { createPoseResult, createEmptyResult, createKeypoint } from '../types/poseDetection.js';

// YOLO COCO keypoint indices (matching yoloPoseService.js)
const YOLO_KEYPOINTS = {
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

class PoseDetectionService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.modelPath = 'yolo11n-pose'; // Default model
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        // Choose worker based on env flag
        const useNewWorker = import.meta.env.VITE_USE_NEW_WORKER === 'true';
        
        if (useNewWorker) {
          console.log('🚀 Using NEW pose detection worker (ES modules)');
          this.worker = new Worker(
            new URL('../workers/poseDetectionWorkerNew.js', import.meta.url),
            { type: 'module' }
          );
        } else {
          console.log('👷 Using OLD pose detection worker (concatenated)');
          this.worker = new Worker(new URL('/poseDetectionWorker.combined.js', import.meta.url));
        }
        
        // Set up message handling
        const handleMessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'sessionCreated') {
            this.isInitialized = true;
            this.worker.removeEventListener('message', handleMessage);
            resolve();
          } else if (type === 'error') {
            this.worker.removeEventListener('message', handleMessage);
            reject(new Error(data.message));
          }
        };

        this.worker.addEventListener('message', handleMessage);
        
        // Start initialization
        this.worker.postMessage({ type: 'createSession' });
        
      } catch (error) {
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  // Alias for compatibility with YoloPoseService API
  async detectPose(imageData) {
    return this.detectPoses(imageData);
  }

  async detectPoses(imageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const width = imageData.width;
    const height = imageData.height;

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Send raw ImageData buffer directly - NO COMPRESSION! 🎯
      // This eliminates JPEG quality loss and improves pose detection accuracy
      const handleMessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'poseDetectionComplete') {
          this.worker.removeEventListener('message', handleMessage);
          // Format the raw poses into the unified format expected by the pipeline
          resolve(this.formatPoseResults(data.results.poses, width, height));
        } else if (type === 'error') {
          this.worker.removeEventListener('message', handleMessage);
          reject(new Error(data.message));
        }
      };

      this.worker.addEventListener('message', handleMessage);
      
      // Clone the buffer before sending to avoid detaching the original
      const dataClone = new Uint8ClampedArray(imageData.data);
      
      // Send raw pixel data directly to worker (no JPEG compression)
      this.worker.postMessage({
        type: 'runPoseDetection',
        imageData: {
          data: dataClone.buffer, // ArrayBuffer of raw RGBA pixels
          width: width,
          height: height
        }
      }, [dataClone.buffer]); // Transfer ownership for better performance
    });
  }

  formatPoseResults(poses, imageWidth, imageHeight) {
    if (!poses || poses.length === 0) {
      console.log('❌ No poses detected');
      return createEmptyResult(this.modelPath, 'yolo', 0);
    }

    // Use the first (most confident) pose
    const pose = poses[0];
    const keypoints = pose.keypoints;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`YOLO Worker - Image: ${imageWidth}x${imageHeight}, Detected ${keypoints.length} keypoints`);
    
    // Extract YOLO keypoints (wrists and ankles)
    const leftHand = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.LEFT_WRIST, 'LEFT_WRIST');
    const rightHand = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.RIGHT_WRIST, 'RIGHT_WRIST');
    const leftFoot = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.LEFT_ANKLE, 'LEFT_ANKLE');
    const rightFoot = this._extractKeypoint(keypoints, YOLO_KEYPOINTS.RIGHT_ANKLE, 'RIGHT_ANKLE');

    console.log(`RESULT: LH=${leftHand?'✓':'✗'} RH=${rightHand?'✓':'✗'} LF=${leftFoot?'✓':'✗'} RF=${rightFoot?'✓':'✗'}`);
    console.log(`${'='.repeat(80)}\n`);

    return createPoseResult(
      { leftHand, rightHand, leftFoot, rightFoot },
      this.modelPath,
      'yolo',
      0,
      poses // Include all raw poses
    );
  }

  _extractKeypoint(keypoints, index, name = '') {
    // Check if keypoints is already an array of objects (new format)
    if (keypoints.length > 0 && typeof keypoints[0] === 'object' && 'x' in keypoints[0]) {
      // New format: array of {x, y, confidence} objects
      if (index < keypoints.length) {
        const kp = keypoints[index];
        
        if (kp.confidence > 0.1) {
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
        
        if (confidence > 0.1) {
          return createKeypoint(x, y, confidence);
        }
      }
    }
    
    return null;
  }

  terminate() {
    if (this.worker) {
      // Send disposal message before terminating
      this.worker.postMessage({ type: 'dispose' });
      
      // Give it a moment to dispose sessions, then terminate
      setTimeout(() => {
        this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        this.initializationPromise = null;
      }, 100);
    }
  }
}

// Export singleton instance
export const poseDetectionService = new PoseDetectionService();
export default poseDetectionService;
