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
          // Add some heuristics to classify holds since the model only outputs "hold"
          const classifiedHolds = data.detections.map((hold) => {
            let type = "hold"; // default

            // Simple heuristics based on size and aspect ratio
            const area = hold.width * hold.height;
            const aspectRatio = hold.width / hold.height;

            if (area > 2000) {
              type = "jug"; // Large holds
            } else if (area < 800) {
              type = "crimp"; // Small holds
            } else if (aspectRatio > 1.5) {
              type = "sloper"; // Wide holds
            } else if (aspectRatio < 0.7) {
              type = "pinch"; // Tall/narrow holds
            } else if (hold.confidence > 0.9) {
              type = "pocket"; // High confidence medium holds
            } else {
              type = "jug"; // Default to jug for medium holds
            }

            return { ...hold, type };
          });

          detectionResults.value = {
            holds: classifiedHolds,
            imageWidth: data.imageWidth,
            imageHeight: data.imageHeight,
            processingTime: data.processingTime,
          };
          currentlyProcessingImage.value = null;
          isLoading.value = false;
          loadingMessage.value = "";
          console.log(`Hold detection completed in ${data.processingTime.toFixed(2)}ms`);
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
    runHoldDetection,
    resetDetectionState,
    terminateWorker,
  };
});
