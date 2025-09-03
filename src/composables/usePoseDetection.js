import { ref, onUnmounted } from 'vue';

/**
 * Composable for YOLO11n-pose detection
 * Uses a dedicated worker for pose detection inference
 */
export function usePoseDetection() {
  // State
  const isAnalyzing = ref(false);
  const analysisStatus = ref('');
  const error = ref(null);
  const poseResults = ref(null);
  const confidenceThreshold = ref(0.1); // Lower threshold to catch more detections
  const sessionReady = ref(false);

  // Create dedicated pose detection worker
  console.log('Loading pose detection worker...');
   const poseWorker = new Worker(new URL('/poseDetectionWorker.combined.js', import.meta.url));

  // Handle worker loading errors
  poseWorker.onerror = (event) => {
    console.error('Pose detection worker loading error:', event);
    error.value = 'Failed to load pose detection worker. Please refresh the page.';
    sessionReady.value = false;
  };

  // Cleanup worker on component unmount
  onUnmounted(() => {
    console.log('Cleaning up pose detection worker...');
    if (poseWorker) {
      poseWorker.terminate();
    }
  });

  // Handle worker messages
  poseWorker.onmessage = (event) => {
    const { type, data } = event.data;

    if (type === 'sessionCreated') {
      sessionReady.value = true;
      analysisStatus.value = 'Pose detection model ready';
      console.log('Pose detection session created in:', data.sessionTime.toFixed(2), 'ms');
    } else if (type === 'poseDetectionComplete') {
      console.log('🎯 Raw pose detection data:', data);
      const detections = processPoseResults(data.results, data.imageInfo);
      poseResults.value = detections;
      analysisStatus.value = `Detection complete! Found ${detections.length} person(s)`;
      isAnalyzing.value = false;
      console.log('📊 Processed pose results:', {
        count: detections.length,
        firstPose: detections[0]
          ? {
              confidence: detections[0].confidence,
              keypointCount: detections[0].keypoints.length,
              sampleKeypoints: detections[0].keypoints.slice(0, 3),
            }
          : null,
      });
    } else if (type === 'error') {
      console.error('Pose detection worker error details:', {
        message: data.message,
        originalError: data.originalError,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      error.value = data.message;
      isAnalyzing.value = false;
      analysisStatus.value = '';
    }
  };

  // Initialize session immediately
  const initializeSession = () => {
    console.log('Initializing pose detection session...');
    analysisStatus.value = 'Loading pose detection model...';
    poseWorker.postMessage({ type: 'createSession' });
  };

  // Start session creation immediately
  initializeSession();

  /**
   * Process YOLOv8 pose results into our display format
   */
  const processPoseResults = (rawResults, imageInfo) => {
    if (!rawResults || !rawResults.poses) {
      console.error('No poses found in results');
      return [];
    }

    console.log('Processing YOLOv8 poses:', rawResults.poses.length);

    // The results are already processed by the worker
    return rawResults.poses.map((pose) => ({
      bbox: pose.bbox,
      confidence: pose.confidence,
      keypoints: pose.keypoints,
    }));
  };

  /**
   * Run pose detection on an image
   */
  const runPoseDetection = async (imageFile) => {
    if (!imageFile) {
      error.value = 'No image file provided';
      return;
    }

    // Wait for session to be ready
    if (!sessionReady.value) {
      analysisStatus.value = 'Waiting for pose detection model to load...';

      const maxWait = 30000; // 30 seconds for model loading
      const checkInterval = 100;
      let waited = 0;

      while (!sessionReady.value && waited < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (!sessionReady.value) {
        error.value = 'Pose detection model failed to load';
        return;
      }
    }

    isAnalyzing.value = true;
    error.value = null;
    poseResults.value = null;
    analysisStatus.value = 'Preprocessing image...';

    try {
      // Get image dimensions
      const imageInfo = await getImageInfo(imageFile);

      // Convert to array buffer for worker
      const imageBuffer = await imageFile.arrayBuffer();

      analysisStatus.value = 'Running pose detection...';

      // Send to worker
      poseWorker.postMessage(
        {
          type: 'runPoseDetection',
          imageBuffer: imageBuffer,
          imageInfo: imageInfo,
        },
        [imageBuffer] // Transfer buffer to worker
      );
    } catch (err) {
      console.error('Pose detection error:', err);
      error.value = err.message || 'Pose detection failed';
      isAnalyzing.value = false;
    }
  };

  /**
   * Get image dimensions without loading into canvas
   */
  const getImageInfo = async (imageFile) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          originalWidth: img.width,
          originalHeight: img.height,
        });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(imageFile);
    });
  };

  return {
    // State
    isAnalyzing,
    analysisStatus,
    error,
    poseResults,
    confidenceThreshold,
    sessionReady,

    // Methods
    runPoseDetection,
  };
}
