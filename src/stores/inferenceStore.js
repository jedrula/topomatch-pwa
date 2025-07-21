import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { imageCacheService } from "@/services/imageCacheService";

export const useInferenceStore = defineStore("inference", () => {
  const inferenceWorker = new Worker(new URL("/inferenceWorker.combined.js", import.meta.url), {
    type: "module",
  });

  const sessionTime = ref(null);
  const isLoading = ref(true); // Start loading immediately
  const loadingMessage = ref("Creating inference session...");
  const inferenceResults = ref({});
  const matchCounts = ref({});
  const inferenceTimes = ref({});
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  inferenceWorker.onmessage = (event) => {
    const { type, data } = event.data;
    if (type === "inferenceComplete") {
      console.log("Inference results:", data.results);
    } else if (type === "sessionCreated") {
      sessionTime.value = `${data.sessionTime.toFixed(2)} ms`;
      sessionReady.value = true;
      isLoading.value = false;
      loadingMessage.value = "";
      console.log("Session created in:", sessionTime.value);
    } else if (type === "error") {
      errorString.value = data.message;
      isLoading.value = false;
      loadingMessage.value = "";
      console.error("Inference worker error:", data.message);
    } else if (type === "workerMemoryInfo") {
      console.log("Worker memory info:", data.memory);
    }
  };

  // Create session immediately when store is initialized
  const initializeSession = () => {
    console.log("Initializing inference session...");
    inferenceWorker.postMessage({ type: "createSession" });
  };

  // Start session creation immediately
  initializeSession();

  // Computed property to get match counts sorted by value (descending)
  const sortedMatchCounts = computed(() => {
    return Object.entries(matchCounts.value)
      .sort(([, a], [, b]) => b - a) // sort by match count descending
      .reduce((acc, [imagePath, count]) => {
        acc[imagePath] = count;
        return acc;
      }, {});
  });

  const runInferenceBatch = async (
    userFile,
    topoImagePaths,
    onComplete = null,
    progressCallback = null
  ) => {
    // Check if session is ready before starting inference
    if (!sessionReady.value) {
      errorString.value = "Inference session is not ready yet. Please wait.";
      return;
    }

    isLoading.value = true;
    loadingMessage.value = `Inferencing with user image and ${topoImagePaths.length} topo images...`;
    const MATCH_THRESHOLD = 50; // Store results if matches >= 50
    const allResults = {}; // Store all results temporarily
    let bestResult = null;
    let bestMatches = -Infinity;
    let bestImgPath = null;

    // Read user image buffer once
    const userArrayBuffer = await userFile.arrayBuffer();

    for (let i = 0; i < topoImagePaths.length; i++) {
      const imgPath = topoImagePaths[i];
      currentlyProcessingImage.value = imgPath;
      loadingMessage.value = `Comparing with ${imgPath.split("/").pop()} (${i + 1}/${
        topoImagePaths.length
      })...`;

      // Call progress callback if provided
      if (progressCallback) {
        progressCallback(i, topoImagePaths.length);
      }

      const resp = await imageCacheService.fetchImage(imgPath);
      const topoBlob = await resp.blob();
      const topoArrayBuffer = await topoBlob.arrayBuffer();

      // Clone the userArrayBuffer for each transfer to avoid DataCloneError
      const userArrayBufferCopy = userArrayBuffer.slice(0);
      const start = performance.now();

      await new Promise((resolve) => {
        const handler = (event) => {
          const { type, data } = event.data;
          if (type === "inferenceComplete") {
            const elapsed = performance.now() - start;
            inferenceTimes.value[imgPath] = elapsed;
            const matches = data.results.matches?.dims?.[0] ?? null;
            matchCounts.value[imgPath] = matches;

            const currentResult = {
              rawData: data.results,
              images: data.images,
              imgWidth: data.imgWidth,
              imgHeight: data.imgHeight,
            };

            // Store result if it meets threshold or is the best so far
            if (matches !== null && matches >= MATCH_THRESHOLD) {
              allResults[imgPath] = currentResult;
            }

            // Track the best result regardless of threshold
            if (matches !== null && matches > bestMatches) {
              bestMatches = matches;
              bestResult = currentResult;
              bestImgPath = imgPath;
            }

            // Remove the event listener after handling this specific inference
            inferenceWorker.removeEventListener("message", handler);
            resolve();
          }
        };

        inferenceWorker.addEventListener("message", handler);
        inferenceWorker.postMessage(
          {
            type: "runInference",
            userImageBuffer: userArrayBufferCopy,
            topoImageBuffer: topoArrayBuffer,
          },
          [userArrayBufferCopy, topoArrayBuffer]
        );
      });
    }

    // Store results: all above threshold + ensure best match is included
    inferenceResults.value = { ...allResults };
    if (bestResult && bestImgPath && !inferenceResults.value[bestImgPath]) {
      inferenceResults.value[bestImgPath] = bestResult;
    }

    currentlyProcessingImage.value = null;
    isLoading.value = false;
    loadingMessage.value = "";

    console.log("Results stored for", Object.keys(inferenceResults.value).length, "images");
    console.log("Best result:", bestResult, "with", bestMatches, "matches");

    // Call the completion callback if provided
    if (onComplete && bestImgPath) {
      onComplete(bestImgPath);
    }
  };

  const resetInferenceState = () => {
    inferenceResults.value = {};
    matchCounts.value = {};
    inferenceTimes.value = {};
    currentlyProcessingImage.value = null;
    errorString.value = null;
  };

  return {
    sessionTime,
    isLoading,
    loadingMessage,
    inferenceResults,
    matchCounts,
    sortedMatchCounts,
    inferenceTimes,
    currentlyProcessingImage,
    errorString,
    sessionReady,
    inferenceWorker,
    runInferenceBatch,
    resetInferenceState,
  };
});
