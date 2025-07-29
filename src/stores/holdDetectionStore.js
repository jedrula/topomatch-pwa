import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useHoldDetectionStore = defineStore("holdDetection", () => {
  // Initialize the hold detection worker
  const holdDetectionWorker = ref(null);

  const sessionTime = ref(null);
  const isLoading = ref(false);
  const loadingMessage = ref("");
  const detectionResults = ref(null);
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  // Initialize the worker and create session
  const initializeSession = () => {
    console.log("Initializing hold detection worker...");

    if (holdDetectionWorker.value) {
      holdDetectionWorker.value.terminate();
    }

    // Create new worker
    console.log("Creating new hold detection worker...");
    holdDetectionWorker.value = new Worker(
      new URL("/holdDetectionWorker.combined.js", import.meta.url),
      { type: "module" }
    );

    // Set up worker message handling
    holdDetectionWorker.value.onmessage = (event) => {
      const { type, data } = event.data;
      console.log("Received message from hold detection worker:", type, data);

      switch (type) {
        case "sessionCreated":
          sessionReady.value = true;
          sessionTime.value = data.sessionTime;
          console.log(`Hold detection session created in ${data.sessionTime.toFixed(2)}ms`);
          break;

        case "detectionComplete": {
          // Simple hold detection results with basic bounding boxes
          const holds = data.detections.map((hold, index) => {
            return {
              ...hold,
              // Add unique ID for tracking
              id: `hold_${index}_${Date.now()}`,
              // Ensure type is set
              type: hold.type || "hold",
            };
          });

          detectionResults.value = {
            holds: holds,
            imageWidth: data.imageWidth,
            imageHeight: data.imageHeight,
            processingTime: data.processingTime,
            pipelineInfo: data.pipelineInfo || {},
          };
          currentlyProcessingImage.value = null;
          isLoading.value = false;
          loadingMessage.value = "";
          console.log(`Hold detection completed in ${data.processingTime.toFixed(2)}ms`);
          console.log(`Found ${holds.length} holds`);
          if (data.pipelineInfo) {
            console.log("Pipeline info:", data.pipelineInfo);
          }
          break;
        }

        case "error":
          console.error("Hold detection worker error:", data.message);
          errorString.value = data.message;
          currentlyProcessingImage.value = null;
          isLoading.value = false;
          loadingMessage.value = "";
          break;

        default:
          console.warn("Unknown message type from hold detection worker:", type);
      }
    };

    holdDetectionWorker.value.onerror = (error) => {
      console.error("Hold detection worker error:", error);
      errorString.value = "Worker error occurred. Please refresh and try again.";
      sessionReady.value = false;
      isLoading.value = false;
    };

    // Request session creation
    console.log("Requesting session creation from worker...");
    holdDetectionWorker.value.postMessage({ type: "createSession" });
  };

  // Start session creation immediately
  initializeSession();

  const runHoldDetection = async (imageFile) => {
    // Check if session is ready before starting detection
    if (!sessionReady.value) {
      errorString.value = "Hold detection session is not ready yet. Please wait.";
      return;
    }

    if (!holdDetectionWorker.value) {
      errorString.value = "Hold detection worker is not available. Please refresh and try again.";
      return;
    }

    isLoading.value = true;
    loadingMessage.value = "Detecting climbing holds...";
    currentlyProcessingImage.value = imageFile.name;
    errorString.value = null;

    try {
      // Convert image file to array buffer
      const imageBuffer = await imageFile.arrayBuffer();

      // Send detection request to worker
      holdDetectionWorker.value.postMessage({
        type: "runDetection",
        imageBuffer: imageBuffer,
      });
    } catch (error) {
      console.error("Hold detection error:", error);
      errorString.value = error.message || "Failed to detect holds. Please try again.";
      currentlyProcessingImage.value = null;
      isLoading.value = false;
      loadingMessage.value = "";
    }
  };

  const resetDetectionState = () => {
    detectionResults.value = null;
    currentlyProcessingImage.value = null;
    errorString.value = null;
  };

  const terminateWorker = () => {
    if (holdDetectionWorker.value) {
      holdDetectionWorker.value.terminate();
      holdDetectionWorker.value = null;
      sessionReady.value = false;
    }
  };

  // Computed property to get hold count by type
  const holdCounts = computed(() => {
    if (!detectionResults.value?.holds) return {};

    const counts = {};
    detectionResults.value.holds.forEach((hold) => {
      counts[hold.type] = (counts[hold.type] || 0) + 1;
    });
    return counts;
  });

  // Computed property to get holds sorted by confidence
  const sortedHolds = computed(() => {
    if (!detectionResults.value?.holds) return [];

    return [...detectionResults.value.holds].sort((a, b) => b.confidence - a.confidence);
  });

  // Computed property to get hold groups by color
  const holdGroups = computed(() => {
    return detectionResults.value?.holdGroups || [];
  });

  // Computed property to get color distribution
  const colorDistribution = computed(() => {
    if (!detectionResults.value?.holds) return {};

    const distribution = {};
    detectionResults.value.holds.forEach((hold) => {
      if (hold.color) {
        const colorName = hold.color.name;
        distribution[colorName] = (distribution[colorName] || 0) + 1;
      }
    });
    return distribution;
  });

  // Computed property to get pipeline statistics
  const pipelineInfo = computed(() => {
    return detectionResults.value?.pipelineInfo || {};
  });

  return {
    sessionTime,
    isLoading,
    loadingMessage,
    detectionResults,
    currentlyProcessingImage,
    errorString,
    sessionReady,
    holdCounts,
    sortedHolds,
    holdGroups,
    colorDistribution,
    pipelineInfo,
    runHoldDetection,
    resetDetectionState,
    terminateWorker,
  };
});
