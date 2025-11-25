/**
 * MediaPipe Pose Detection Service
 * 
 * Implements the unified PoseDetectionService interface using Google's MediaPipe Pose.
 * 
 * MediaPipe models detect 33 keypoints:
 * - Keypoint 19: Left Index Finger → maps to leftHand
 * - Keypoint 20: Right Index Finger → maps to rightHand
 * - Keypoint 31: Left Foot Index (toe) → maps to leftFoot
 * - Keypoint 32: Right Foot Index (toe) → maps to rightFoot
 */

import { PoseDetectionService, createKeypoint, createEmptyResult, createPoseResult } from '../types/poseDetection.js';

// MediaPipe keypoint indices
const MEDIAPIPE_KEYPOINTS = {
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

export class MediaPipePoseService extends PoseDetectionService {
  constructor(modelComplexity = 2) {
    super();
    this.modelComplexity = modelComplexity; // 0=Lite, 1=Full, 2=Heavy
    this.pose = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Dynamically import MediaPipe (loaded from CDN in index.html)
      /* global Pose */
      if (typeof Pose === 'undefined') {
        throw new Error('MediaPipe Pose library not loaded. Add CDN script to index.html');
      }

      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        }
      });

      this.pose.setOptions({
        modelComplexity: this.modelComplexity,
        smoothLandmarks: false, // Static image mode
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw error;
    }
  }

  async detectPose(image) {
    const startTime = performance.now();

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Send image to MediaPipe
      const results = await new Promise((resolve, reject) => {
        this.pose.onResults(resolve);
        
        // MediaPipe accepts HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
        const inputElement = this._prepareInputElement(image);
        this.pose.send({ image: inputElement }).catch(reject);
      });

      const processingTime = performance.now() - startTime;
      return this._convertToUnifiedFormat(results, processingTime);

    } catch (error) {
      console.error('MediaPipe pose detection failed:', error);
      const processingTime = performance.now() - startTime;
      return createEmptyResult(`mediapipe-complexity${this.modelComplexity}`, 'mediapipe', processingTime);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async dispose() {
    if (this.pose) {
      this.pose.close();
      this.pose = null;
      this.initialized = false;
    }
  }

  getModelInfo() {
    const complexityName = ['Lite', 'Full', 'Heavy'][this.modelComplexity];
    return {
      name: `MediaPipe Pose ${complexityName}`,
      provider: 'mediapipe',
      modelComplexity: this.modelComplexity,
      keypointCount: 33,
      trackedPoints: 'index fingers + toes',
    };
  }

  /**
   * Convert MediaPipe results to unified format
   * @private
   */
  _convertToUnifiedFormat(results, processingTime) {
    if (!results.poseLandmarks) {
      return createEmptyResult(`mediapipe-complexity${this.modelComplexity}`, 'mediapipe', processingTime);
    }

    const landmarks = results.poseLandmarks;

    // Extract MediaPipe keypoints (index fingers and toes)
    const leftHand = this._extractLandmark(landmarks, MEDIAPIPE_KEYPOINTS.LEFT_INDEX);
    const rightHand = this._extractLandmark(landmarks, MEDIAPIPE_KEYPOINTS.RIGHT_INDEX);
    const leftFoot = this._extractLandmark(landmarks, MEDIAPIPE_KEYPOINTS.LEFT_FOOT_INDEX);
    const rightFoot = this._extractLandmark(landmarks, MEDIAPIPE_KEYPOINTS.RIGHT_FOOT_INDEX);

    return createPoseResult(
      { leftHand, rightHand, leftFoot, rightFoot },
      `mediapipe-complexity${this.modelComplexity}`,
      'mediapipe',
      processingTime,
      landmarks // Include all raw landmarks
    );
  }

  /**
   * Extract a single landmark from MediaPipe output
   * @private
   */
  _extractLandmark(landmarks, index) {
    if (index < landmarks.length) {
      const landmark = landmarks[index];
      
      // MediaPipe provides visibility score
      if (landmark.visibility > 0.3) {
        return createKeypoint(
          landmark.x,
          landmark.y,
          landmark.visibility
        );
      }
    }
    
    return null;
  }

  /**
   * Prepare input element for MediaPipe
   * @private
   */
  _prepareInputElement(image) {
    // MediaPipe accepts HTMLImageElement, HTMLCanvasElement
    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
      return image;
    }

    // Convert ImageData to canvas
    if (image instanceof ImageData) {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(image, 0, 0);
      return canvas;
    }

    throw new Error('Unsupported image format for MediaPipe');
  }
}
