/**
 * Pose Detection Model Configuration
 * 
 * Change ACTIVE_POSE_MODEL to switch between different pose detection models.
 * This is the ONLY line you need to change to test different models end-to-end.
 */

/**
 * Available pose detection models
 * 
 * YOLO Models (17 keypoints - wrists & ankles):
 * - YOLO11N: 11MB, fastest, lowest accuracy
 * - YOLO11S: 38MB, medium speed/accuracy
 * - YOLO11M: 80MB, slowest YOLO, best YOLO accuracy
 * 
 * MediaPipe Models (33 keypoints - index fingers & toes):
 * - MEDIAPIPE_LITE: Fastest, good for real-time
 * - MEDIAPIPE_FULL: Balanced speed/accuracy
 * - MEDIAPIPE_HEAVY: Most accurate, recommended for climbing
 */
export const PoseModel = {
  dummy: 'dummy',

  // YOLO models (wrists + ankles only)
  YOLO11N: 'yolo11n',
  YOLO11S: 'yolo11s',
  YOLO11M: 'yolo11m',
  
  // MediaPipe models (index fingers + toes)
  MEDIAPIPE_LITE: 'mediapipe-lite',
  MEDIAPIPE_FULL: 'mediapipe-full',
  MEDIAPIPE_HEAVY: 'mediapipe-heavy',
};

/**
 * Active pose detection model
 * 
 * 🎯 Desktop web uses this model (mobile web uses dummy, iOS uses Vision Framework)
 * 
 * TODO: MediaPipe models currently broken - stick with YOLO for now
 * 
 * YOLO11S gives significantly better wrist/ankle detection than YOLO11N (38 MB vs 11 MB)
 */
export const ACTIVE_POSE_MODEL = PoseModel.YOLO11S;

/**
 * Model metadata for runtime use
 */
export const MODEL_CONFIG = {
  [PoseModel.dummy]: {
    provider: 'dummy',
    keypoints: 'none',
    keypointCount: 0,
  },
  [PoseModel.YOLO11N]: {
    provider: 'yolo',
    modelPath: '/yolo11n-pose.onnx',
    size: '11MB',
    keypoints: 'wrists + ankles',
    keypointCount: 17,
  },
  [PoseModel.YOLO11S]: {
    provider: 'yolo',
    modelPath: '/yolo11s-pose.onnx',
    size: '38MB',
    keypoints: 'wrists + ankles',
    keypointCount: 17,
  },
  [PoseModel.YOLO11M]: {
    provider: 'yolo',
    modelPath: '/yolo11m-pose.onnx',
    size: '80MB',
    keypoints: 'wrists + ankles',
    keypointCount: 17,
  },
  [PoseModel.MEDIAPIPE_LITE]: {
    provider: 'mediapipe',
    modelComplexity: 0,
    keypoints: 'index fingers + toes',
    keypointCount: 33,
  },
  [PoseModel.MEDIAPIPE_FULL]: {
    provider: 'mediapipe',
    modelComplexity: 1,
    keypoints: 'index fingers + toes',
    keypointCount: 33,
  },
  [PoseModel.MEDIAPIPE_HEAVY]: {
    provider: 'mediapipe',
    modelComplexity: 2,
    keypoints: 'index fingers + toes',
    keypointCount: 33,
  },
};

/**
 * Get configuration for the active model
 */
export function getActiveModelConfig() {
  return MODEL_CONFIG[ACTIVE_POSE_MODEL];
}

/**
 * Check if current model is YOLO
 */
export function isYoloModel() {
  return getActiveModelConfig().provider === 'yolo';
}

/**
 * Check if current model is MediaPipe
 */
export function isMediaPipeModel() {
  return getActiveModelConfig().provider === 'mediapipe';
}
