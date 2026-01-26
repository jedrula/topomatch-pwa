/**
 * Pose Detection Factory
 * 
 * Creates the appropriate pose detection service based on the active configuration.
 * This is the only file that imports and instantiates specific pose services.
 */

import { ACTIVE_POSE_MODEL, getActiveModelConfig, PoseModel } from '../config/poseDetection.js';
import { YoloPoseService } from './yoloPoseService.js';
import { MediaPipePoseService } from './mediapipePoseService.js';
import { isMobile } from '@/utils/platform';
// import { IosVisionPoseService } from './iosVisionPoseService.js'; // Moved to dynamic import
import poseDetectionService from './poseDetectionService.js';
// import { Capacitor } from '@capacitor/core'; // Moved to dynamic import

/**
 * Singleton instance of the active pose detection service
 */
let activeService = null;

/**
 * Check if we should use worker-based pose detection
 */
const useWorkerPose = import.meta.env.VITE_USE_NEW_WORKER === 'true';

/**
 * Create a dummy pose detection service (used on mobile web)
 */
function createDummyService() {
  return {
    initialize: async () => {
      console.log('  DUMMY: Skipping model initialization');
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    detectPose: async (imageData) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        detected: false,
        keypoints: {},
        confidence: 0,
        error: false
      };
    },
    isInitialized: () => true,
    dispose: async () => {},
    getModelInfo: () => ({
      name: 'Dummy (Mobile Web)',
      provider: 'dummy',
      keypointCount: 0,
      format: 'none',
    })
  };
}

/**
 * Create a pose detection service based on model identifier
 * @param {string} modelId - Model identifier from PoseModel enum
 * @returns {Promise<PoseDetectionService>}
 */
async function createPoseService(modelId) {
  // Dynamic import of Capacitor - only loads when actually checking platform
  const { Capacitor } = await import('@capacitor/core');
  const isNative = Capacitor.isNativePlatform();
  const isMobileDevice = isMobile();
  
  console.log('Platform detection:');
  console.log('  isNativePlatform:', isNative);
  console.log('  isMobile:', isMobileDevice);
  console.log('  platform:', Capacitor.getPlatform());
  
  // Auto-detect native iOS (Capacitor) and use Vision Framework
  if (isNative && Capacitor.getPlatform() === 'ios') {
    console.log('🍎 Native iOS detected - using Vision Framework for pose detection');
    const { IosVisionPoseService } = await import('./iosVisionPoseService.js');
    return new IosVisionPoseService();
  }
  
  // Mobile web: Use dummy service (skip heavy model loading)
  if (isMobileDevice && !isNative) {
    console.log('📱 Mobile web detected - using DUMMY pose detection service (skip model loading)');
    return createDummyService();
  }

  // Desktop web: Use configured model from config
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
 * @returns {Promise<PoseDetectionService>}
 */
export async function getPoseDetectionService() {
  if (!activeService) {
    const config = getActiveModelConfig();
    console.log(`🎯 Creating pose detection service: ${ACTIVE_POSE_MODEL}`);
    console.log(`   Provider: ${config.provider}`);
    console.log(`   Keypoints: ${config.keypoints} (${config.keypointCount} total)`);
    activeService = await createPoseService(ACTIVE_POSE_MODEL);
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
 * @returns {Promise<Object>}
 */
export async function getActiveModelInfo() {
  const service = await getPoseDetectionService();
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
