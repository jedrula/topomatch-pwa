/**
 * Unified Pose Detection Interface
 * 
 * Common interface for all pose detection models (YOLO and MediaPipe).
 * All pose services must implement this interface.
 */

/**
 * A single detected keypoint
 * @typedef {Object} Keypoint
 * @property {number} x - X coordinate (0-1, normalized)
 * @property {number} y - Y coordinate (0-1, normalized)
 * @property {number} confidence - Detection confidence (0-1)
 */

/**
 * Unified pose detection result
 * All models return this format regardless of their internal representation
 * 
 * @typedef {Object} PoseDetectionResult
 * @property {boolean} detected - Whether a pose was detected
 * @property {Object} keypoints - Detected keypoints
 * @property {Keypoint|null} keypoints.leftHand - Left hand position (wrist for YOLO, index finger for MediaPipe)
 * @property {Keypoint|null} keypoints.rightHand - Right hand position (wrist for YOLO, index finger for MediaPipe)
 * @property {Keypoint|null} keypoints.leftFoot - Left foot position (ankle for YOLO, toe for MediaPipe)
 * @property {Keypoint|null} keypoints.rightFoot - Right foot position (ankle for YOLO, toe for MediaPipe)
 * @property {Object} metadata - Additional model-specific data
 * @property {string} metadata.model - Model identifier
 * @property {string} metadata.provider - 'yolo' or 'mediapipe'
 * @property {number} metadata.processingTime - Time taken in milliseconds
 * @property {Array<Object>} [metadata.rawKeypoints] - Optional: all raw keypoints from model
 */

/**
 * Base interface for pose detection services
 */
export class PoseDetectionService {
  /**
   * Initialize the pose detection model
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented');
  }

  /**
   * Detect pose in an image
   * @param {HTMLImageElement|HTMLCanvasElement|ImageData} image - Input image
   * @returns {Promise<PoseDetectionResult>}
   */
  async detectPose(image) {
    throw new Error('detectPose() must be implemented');
  }

  /**
   * Check if service is initialized
   * @returns {boolean}
   */
  isInitialized() {
    throw new Error('isInitialized() must be implemented');
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async dispose() {
    throw new Error('dispose() must be implemented');
  }

  /**
   * Get model information
   * @returns {Object}
   */
  getModelInfo() {
    throw new Error('getModelInfo() must be implemented');
  }
}

/**
 * Create a keypoint object
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {number} confidence - Confidence score (0-1)
 * @returns {Keypoint}
 */
export function createKeypoint(x, y, confidence) {
  return { x, y, confidence };
}

/**
 * Create an empty pose detection result (no pose detected)
 * @param {string} model - Model identifier
 * @param {string} provider - Provider name
 * @param {number} processingTime - Processing time in ms
 * @returns {PoseDetectionResult}
 */
export function createEmptyResult(model, provider, processingTime = 0) {
  return {
    detected: false,
    keypoints: {
      leftHand: null,
      rightHand: null,
      leftFoot: null,
      rightFoot: null,
    },
    metadata: {
      model,
      provider,
      processingTime,
    },
  };
}

/**
 * Create a successful pose detection result
 * @param {Object} keypoints - Detected keypoints
 * @param {string} model - Model identifier
 * @param {string} provider - Provider name
 * @param {number} processingTime - Processing time in ms
 * @param {Array} [rawKeypoints] - Optional raw keypoints
 * @returns {PoseDetectionResult}
 */
export function createPoseResult(keypoints, model, provider, processingTime = 0, rawKeypoints = null) {
  return {
    detected: true,
    keypoints,
    metadata: {
      model,
      provider,
      processingTime,
      ...(rawKeypoints && { rawKeypoints }),
    },
  };
}
