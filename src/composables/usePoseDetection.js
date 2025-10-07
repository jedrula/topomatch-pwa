import { ref, onUnmounted } from 'vue';
import poseDetectionService from '@/services/poseDetectionService';

/**
 * Composable for pose detection using singleton service
 * This ensures only one ONNX session exists across the entire app
 */
export function usePoseDetection() {
  const isAnalyzing = ref(false);
  const analysisStatus = ref('');
  const error = ref(null);
  const poseResults = ref(null);
  const confidenceThreshold = ref(0.1);
  const sessionReady = ref(false);

  // Initialize service and track ready state
  const initializeService = async () => {
    try {
      await poseDetectionService.initialize();
      sessionReady.value = true;
      error.value = null;
      analysisStatus.value = 'Pose detection model ready';
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

    try {
      isAnalyzing.value = true;
      error.value = null;
      analysisStatus.value = 'Analyzing poses...';

      // Handle different input types and convert to HTMLImageElement
      if (imageInput instanceof File) {
        // If it's a File, create an Image element
        actualImageElement = new Image();
        await new Promise((resolve, reject) => {
          actualImageElement.onload = resolve;
          actualImageElement.onerror = reject;
          actualImageElement.src = URL.createObjectURL(imageInput);
        });
      } else if (typeof imageInput === 'string') {
        // If it's a URL string, create an Image element
        actualImageElement = new Image();
        await new Promise((resolve, reject) => {
          actualImageElement.onload = resolve;
          actualImageElement.onerror = reject;
          actualImageElement.src = imageInput;
        });
      } else if (imageInput instanceof HTMLImageElement) {
        // Already an image element, use as-is
        actualImageElement = imageInput;
      } else if (!imageInput || typeof imageInput.naturalWidth === 'undefined') {
        console.error('Invalid image input:', imageInput, 'Type:', typeof imageInput, 'Constructor:', imageInput?.constructor?.name);
        throw new Error(`Invalid image input provided. Expected HTMLImageElement, File, or image URL string. Got: ${typeof imageInput} (${imageInput?.constructor?.name})`);
      }

      // Convert image element to ImageData
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = actualImageElement.naturalWidth || actualImageElement.width;
      canvas.height = actualImageElement.naturalHeight || actualImageElement.height;
      ctx.drawImage(actualImageElement, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use the correct service method
      const results = await poseDetectionService.detectPoses(imageData);
      
      // Results should be an array of poses now
      if (!Array.isArray(results)) {
        console.error('Expected array from detectPoses, got:', typeof results, results);
        throw new Error('Invalid results format from pose detection service');
      }
      
      // Filter and process results
      const filteredResults = filterResultsByConfidence(results);
      poseResults.value = filteredResults.map(pose => ({
        ...pose,
        id: Math.random().toString(36).substr(2, 9)
      }));
      
      analysisStatus.value = `Detection complete! Found ${filteredResults.length} person(s)`;
      
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

  // Filter results by confidence threshold
  const filterResultsByConfidence = (results) => {
    return results.filter(pose => pose.confidence >= confidenceThreshold.value);
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
    
    // Methods
    runPoseDetection,
    clearResults
  };
}