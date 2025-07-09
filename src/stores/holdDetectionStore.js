import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useHoldDetectionStore = defineStore("holdDetection", () => {
  // TODO: We'll create a separate worker for hold detection model
  // For now, using a placeholder that we'll implement once we have the ONNX model
  const holdDetectionWorker = null;

  const sessionTime = ref(null);
  const isLoading = ref(false);
  const loadingMessage = ref("");
  const detectionResults = ref(null);
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  // Placeholder initialization - we'll implement this once we have the ONNX model
  const initializeSession = () => {
    console.log("Hold detection model not yet implemented");
    // For now, we'll simulate readiness
    sessionReady.value = true;
  };

  // Start session creation immediately
  initializeSession();

  const runHoldDetection = async (imageFile) => {
    // Check if session is ready before starting detection
    if (!sessionReady.value) {
      errorString.value = "Hold detection session is not ready yet. Please wait.";
      return;
    }

    isLoading.value = true;
    loadingMessage.value = "Detecting climbing holds...";
    currentlyProcessingImage.value = imageFile.name;
    errorString.value = null;

    try {
      // TODO: Implement actual hold detection inference
      // For now, we'll create mock data that simulates detected holds
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

      // Mock detection results - replace with actual model inference
      const mockResults = {
        holds: [
          { x: 150, y: 200, width: 40, height: 40, confidence: 0.95, type: "jug" },
          { x: 300, y: 180, width: 35, height: 35, confidence: 0.87, type: "crimp" },
          { x: 450, y: 220, width: 45, height: 30, confidence: 0.91, type: "sloper" },
          { x: 200, y: 350, width: 38, height: 42, confidence: 0.83, type: "pinch" },
          { x: 380, y: 380, width: 33, height: 36, confidence: 0.89, type: "pocket" },
          { x: 120, y: 450, width: 41, height: 39, confidence: 0.76, type: "jug" },
          { x: 350, y: 480, width: 37, height: 34, confidence: 0.92, type: "crimp" },
        ],
        imageWidth: 600,
        imageHeight: 800,
        processingTime: 1850,
      };

      detectionResults.value = mockResults;
      console.log("Hold detection completed:", mockResults);

    } catch (error) {
      console.error("Hold detection error:", error);
      errorString.value = error.message || "Failed to detect holds. Please try again.";
    } finally {
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

  // Computed property to get hold count by type
  const holdCounts = computed(() => {
    if (!detectionResults.value?.holds) return {};
    
    const counts = {};
    detectionResults.value.holds.forEach(hold => {
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
  };
});
