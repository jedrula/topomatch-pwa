import { ref, onUnmounted } from 'vue';
import { getPoseDetectionService, getActiveModelInfo } from '@/services/poseDetectionFactory';
import { generateUUID } from '@/utils/uuid';

/**
 * Composable for pose detection using configurable model factory
 * Model is selected in src/config/poseDetection.js (ACTIVE_POSE_MODEL)
 */
export function usePoseDetection() {
  const isAnalyzing = ref(false);
  const analysisStatus = ref('');
  const error = ref(null);
  const poseResults = ref(null);
  const confidenceThreshold = ref(0.1);
  const sessionReady = ref(false);
  const currentModel = ref(null);

  // Service loaded lazily when needed
  let service = null;

  // Initialize service and track ready state
  const initializeService = async () => {
    try {
      // Lazy load service on first use
      if (!service) {
        service = await getPoseDetectionService();
      }
      
      const modelInfo = await getActiveModelInfo();
      currentModel.value = modelInfo;
      console.log(`🎯 Initializing ${modelInfo.name}...`);
      
      await service.initialize();
      sessionReady.value = true;
      error.value = null;
      analysisStatus.value = `${modelInfo.name} ready`;
    } catch (err) {
      console.error('Failed to initialize pose detection service:', err);
      error.value = 'Failed to initialize pose detection. Please refresh the page.';
      sessionReady.value = false;
    }
  };

  // Initialize immediately
  initializeService();

  // Run pose detection
  const runPoseDetection = async (imageInput, fileName = '') => {
    if (!sessionReady.value) {
      error.value = 'Pose detection is not ready. Please wait...';
      return;
    }

    if (isAnalyzing.value) {
      console.warn('Pose detection already in progress');
      return;
    }

    let actualImageElement = imageInput;
    let imageData;

    try {
      isAnalyzing.value = true;
      error.value = null;
      analysisStatus.value = 'Analyzing poses...';

      // Handle different input types and convert to ImageData
      if (imageInput instanceof ImageData) {
        // NEW: Direct ImageData input - no conversion needed! 🎯
        imageData = imageInput;
      } else if (imageInput instanceof File) {
        // If it's a File, create an Image element
        actualImageElement = new Image();
        await new Promise((resolve, reject) => {
          actualImageElement.onload = resolve;
          actualImageElement.onerror = reject;
          actualImageElement.src = URL.createObjectURL(imageInput);
        });
        
        // Convert to ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = actualImageElement.naturalWidth || actualImageElement.width;
        canvas.height = actualImageElement.naturalHeight || actualImageElement.height;
        ctx.drawImage(actualImageElement, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else if (typeof imageInput === 'string') {
        // If it's a URL string, create an Image element
        actualImageElement = new Image();
        await new Promise((resolve, reject) => {
          actualImageElement.onload = resolve;
          actualImageElement.onerror = reject;
          actualImageElement.src = imageInput;
        });
        
        // Convert to ImageData
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = actualImageElement.naturalWidth || actualImageElement.width;
        canvas.height = actualImageElement.naturalHeight || actualImageElement.height;
        ctx.drawImage(actualImageElement, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else if (imageInput instanceof HTMLImageElement) {
        // Already an image element, convert to ImageData
        actualImageElement = imageInput;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = actualImageElement.naturalWidth || actualImageElement.width;
        canvas.height = actualImageElement.naturalHeight || actualImageElement.height;
        ctx.drawImage(actualImageElement, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        console.error('Invalid image input:', imageInput, 'Type:', typeof imageInput, 'Constructor:', imageInput?.constructor?.name);
        throw new Error(`Invalid image input provided. Expected ImageData, HTMLImageElement, File, or image URL string. Got: ${typeof imageInput} (${imageInput?.constructor?.name})`);
      }

      // Use the unified interface (detectPose returns PoseDetectionResult)
      console.log('🎯 Calling service.detectPose with imageData:', imageData.width, 'x', imageData.height);
      const result = await service.detectPose(imageData);
      console.log('📦 Got result from service:', result);
      console.log('  result.detected:', result.detected);
      console.log('  result.keypoints:', result.keypoints);
      console.log('  result.metadata:', result.metadata);
      
      if (result.detected) {
        // Return unified format directly (leftHand/rightHand/leftFoot/rightFoot)
        // Coordinates are already normalized 0-1 from the service
        poseResults.value = [{
          keypoints: result.keypoints, // Keep as object with leftHand/rightHand/leftFoot/rightFoot
          confidence: Math.max(
            result.keypoints.leftHand?.confidence || 0,
            result.keypoints.rightHand?.confidence || 0,
            result.keypoints.leftFoot?.confidence || 0,
            result.keypoints.rightFoot?.confidence || 0
          ),
          bbox: [0, 0, imageData.width, imageData.height], // Full image bbox
          metadata: result.metadata,
          detected: result.detected,
          id: generateUUID(),
        }];
        
        // Count detected keypoints for status
        const detectedCount = Object.values(result.keypoints).filter(kp => kp !== null).length;
        analysisStatus.value = `Detection complete! Found ${detectedCount}/4 keypoints (${result.metadata.model})`;
      } else {
        poseResults.value = [];
        analysisStatus.value = 'No pose detected';
      }
      
      // Cleanup object URLs if we created them
      if (imageInput instanceof File && actualImageElement.src && actualImageElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(actualImageElement.src);
      }
      
    } catch (err) {
      console.error('Pose detection failed:', err);
      error.value = 'Pose detection failed: ' + err.message;
      analysisStatus.value = 'Detection failed';
      
      // Cleanup object URLs on error too
      if (imageInput instanceof File && actualImageElement && actualImageElement.src && actualImageElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(actualImageElement.src);
      }
    } finally {
      isAnalyzing.value = false;
    }
  };

  // Convert unified format to legacy YOLO format
  // Legacy format: flat array of [x1, y1, conf1, x2, y2, conf2, ...]
  const convertToLegacyFormat = (result, width, height) => {
    const keypoints = new Array(17 * 3).fill(0); // 17 YOLO keypoints * 3 values
    
    // Map unified keypoints to YOLO indices
    // YOLO: 9=left wrist, 10=right wrist, 15=left ankle, 16=right ankle
    const mapping = {
      leftHand: 9,
      rightHand: 10,
      leftFoot: 15,
      rightFoot: 16,
    };
    
    for (const [key, yoloIndex] of Object.entries(mapping)) {
      const kp = result.keypoints[key];
      if (kp) {
        const baseIndex = yoloIndex * 3;
        keypoints[baseIndex] = kp.x;
        keypoints[baseIndex + 1] = kp.y;
        keypoints[baseIndex + 2] = kp.confidence;
      }
    }
    
    return keypoints;
  };

  // Clear results
  const clearResults = () => {
    poseResults.value = null;
    error.value = null;
    analysisStatus.value = '';
  };

  // Cleanup (service is singleton, no need to terminate)
  onUnmounted(() => {
    // Service handles its own lifecycle
  });

  return {
    // State
    isAnalyzing,
    analysisStatus,
    error,
    poseResults,
    sessionReady,
    confidenceThreshold,
    currentModel,
    
    // Methods
    runPoseDetection,
    clearResults
  };
}