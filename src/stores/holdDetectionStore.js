import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useHoldDetectionStore = defineStore("holdDetection", () => {
  // Initialize the hold detection worker
  const holdDetectionWorker = ref(null);

  // Initialize the SAM segmentation worker
  const samWorker = ref(null);

  const sessionTime = ref(null);
  const samSessionTime = ref(null);
  const isLoading = ref(false);
  const loadingMessage = ref("");
  const detectionResults = ref(null);
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);
  const samSessionReady = ref(false);

  // SAM configuration
  const useSAMSegmentation = ref(true); // Enable SAM by default

  // Initialize the worker and create session
  const initializeSession = () => {
    console.log("Initializing hold detection and SAM workers...");

    // Initialize YOLO hold detection worker
    if (holdDetectionWorker.value) {
      holdDetectionWorker.value.terminate();
    }

    // Initialize SAM segmentation worker
    if (samWorker.value) {
      samWorker.value.terminate();
    }

    // Create new YOLO worker
    console.log("Creating new hold detection worker...");
    holdDetectionWorker.value = new Worker(
      new URL("/holdDetectionWorker.combined.js", import.meta.url),
      { type: "module" }
    );

    // Create new SAM worker
    console.log("Creating new SAM segmentation worker...");
    samWorker.value = new Worker(new URL("../workers/samSegmentationWorker.js", import.meta.url), {
      type: "module",
    });

    // Set up YOLO worker message handling
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
          // YOLO detection completed, now decide whether to use SAM
          if (useSAMSegmentation.value && samSessionReady.value) {
            // Convert YOLO detections to SAM input format
            const holdCenters = data.detections.map((hold, index) => ({
              x: (hold.x + hold.width / 2) / currentlyProcessingImage.value.imageWidth, // Normalize to [0,1]
              y: (hold.y + hold.height / 2) / currentlyProcessingImage.value.imageHeight, // Normalize to [0,1]
              originalHold: { ...hold, id: `hold_${index}_${Date.now()}` },
            }));

            console.log(`Sending ${holdCenters.length} hold centers to SAM for segmentation...`);
            loadingMessage.value = "Generating precise hold segments...";

            // Send to SAM worker for segmentation
            samWorker.value.postMessage({
              type: "generateMasks",
              data: {
                imageBuffer: currentlyProcessingImage.value.imageBuffer,
                holdCenters: holdCenters,
              },
            });
          } else {
            // Use YOLO results without SAM segmentation
            processYoloResults(data);
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

    // Set up SAM worker message handling
    samWorker.value.onmessage = (event) => {
      const { type, data } = event.data;
      console.log("Received message from SAM worker:", type, data);

      switch (type) {
        case "samSessionCreated":
          samSessionReady.value = true;
          samSessionTime.value = data.sessionTime;
          console.log(`SAM session created in ${data.sessionTime.toFixed(2)}ms`);
          break;

        case "segment_result":
          if (data === "start") {
            loadingMessage.value = "Processing image for segmentation...";
          } else if (data === "done") {
            loadingMessage.value = "Image embeddings computed, ready for segmentation...";
          }
          break;

        case "masksGenerated": {
          // SAM segmentation completed
          console.log(
            `SAM segmentation completed: ${data.successfulSegmentations}/${data.totalHolds} holds segmented`
          );

          const segmentedResults = {
            detections: data.masks,
            processingTime: data.processingTime,
            imageWidth: currentlyProcessingImage.value.imageWidth,
            imageHeight: currentlyProcessingImage.value.imageHeight,
            pipelineInfo: {
              totalDetections: data.masks.length,
              segmentedHolds: data.successfulSegmentations,
              usedSAM: true,
            },
          };

          processYoloResults(segmentedResults);
          break;
        }

        case "error":
          console.error("SAM worker error:", data.message);
          errorString.value = `SAM segmentation failed: ${data.message}`;
          currentlyProcessingImage.value = null;
          isLoading.value = false;
          loadingMessage.value = "";
          break;

        default:
          console.warn("Unknown message type from SAM worker:", type);
      }
    };

    // Helper function to process final results (from YOLO or SAM)
    const processYoloResults = (data) => {
      const holds = data.detections.map((hold, index) => {
        return {
          ...hold,
          // Add unique ID for tracking if not already present
          id: hold.id || `hold_${index}_${Date.now()}`,
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
    };

    holdDetectionWorker.value.onerror = (error) => {
      console.error("Hold detection worker error:", error);
      errorString.value = "Hold detection worker error occurred. Please refresh and try again.";
      sessionReady.value = false;
      isLoading.value = false;
    };

    samWorker.value.onerror = (error) => {
      console.error("SAM worker error:", error);
      errorString.value = "SAM segmentation worker error occurred. Please refresh and try again.";
      samSessionReady.value = false;
      isLoading.value = false;
    };

    // Request session creation from both workers
    console.log("Requesting session creation from YOLO worker...");
    holdDetectionWorker.value.postMessage({ type: "createSession" });

    console.log("Requesting session creation from SAM worker...");
    samWorker.value.postMessage({ type: "initializeSAM" });
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
    errorString.value = null;

    try {
      // Convert image file to array buffer
      const imageBuffer = await imageFile.arrayBuffer();

      // Create ImageBitmap to get dimensions
      const imageBlob = new Blob([imageBuffer]);
      const imageBitmap = await createImageBitmap(imageBlob);

      // Store image data for potential SAM processing
      currentlyProcessingImage.value = {
        name: imageFile.name,
        imageBuffer: imageBuffer,
        imageWidth: imageBitmap.width,
        imageHeight: imageBitmap.height,
      };

      // Clean up ImageBitmap
      if (imageBitmap && typeof imageBitmap.close === "function") {
        imageBitmap.close();
      }

      // Send detection request to YOLO worker
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

    if (samWorker.value) {
      samWorker.value.terminate();
      samWorker.value = null;
      samSessionReady.value = false;
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
    samSessionTime,
    isLoading,
    loadingMessage,
    detectionResults,
    currentlyProcessingImage,
    errorString,
    sessionReady,
    samSessionReady,
    useSAMSegmentation,
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
