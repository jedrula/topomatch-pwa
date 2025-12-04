/**
 * Pose Detection Factory
 * 
 * Creates the appropriate pose detection service based on the active configuration.
 * This is the only file that imports and instantiates specific pose services.
 */

import { ACTIVE_POSE_MODEL, getActiveModelConfig, PoseModel } from '../config/poseDetection.js';
import { YoloPoseService } from './yoloPoseService.js';
import { MediaPipePoseService } from './mediapipePoseService.js';
import poseDetectionService from './poseDetectionService.js';

/**
 * Singleton instance of the active pose detection service
 */
let activeService = null;

/**
 * Check if we should use worker-based pose detection
 */
const useWorkerPose = import.meta.env.VITE_USE_NEW_WORKER === 'true';

/**
 * Create a pose detection service based on model identifier
 * @param {string} modelId - Model identifier from PoseModel enum
 * @returns {PoseDetectionService}
 */
function createPoseService(modelId) {
  const config = getActiveModelConfig();

  // Use worker-based service if flag is enabled and using YOLO
  if (useWorkerPose && config.provider === 'yolo') {
    console.log('🚀 Using worker-based pose detection (non-blocking)');
    return poseDetectionService;
  }

  switch (config.provider) {
    case 'yolo':
      console.log('👷 Using main thread pose detection (blocks UI)');
      return new YoloPoseService(config.modelPath);

    case 'mediapipe':
      return new MediaPipePoseService(config.modelComplexity);

    default:
      throw new Error(`Unknown pose detection provider: ${config.provider}`);
  }
}

/**
 * Get the active pose detection service
 * Creates a new instance if needed
 * 
 * @returns {PoseDetectionService}
 */
export function getPoseDetectionService() {
  if (!activeService) {
    const config = getActiveModelConfig();
    console.log(`🎯 Creating pose detection service: ${ACTIVE_POSE_MODEL}`);
    console.log(`   Provider: ${config.provider}`);
    console.log(`   Keypoints: ${config.keypoints} (${config.keypointCount} total)`);
    activeService = createPoseService(ACTIVE_POSE_MODEL);
  }
  return activeService;
}

/**
 * Reset the pose detection service
 * Useful when switching models (requires app reload)
 */
export async function resetPoseDetectionService() {
  if (activeService) {
    console.log('🔄 Disposing current pose detection service');
    await activeService.dispose();
    activeService = null;
  }
}

/**
 * Get information about the active model
 * @returns {Object}
 */
export function getActiveModelInfo() {
  const service = getPoseDetectionService();
  const config = getActiveModelConfig();
  
  return {
    model: ACTIVE_POSE_MODEL,
    ...config,
    ...service.getModelInfo(),
  };
}

/**
 * Check if the current model is initialized
 * @returns {boolean}
 */
export function isPoseDetectionReady() {
  return activeService && activeService.isInitialized();
}

// Export for convenience
export { PoseModel, ACTIVE_POSE_MODEL } from '../config/poseDetection.js';
