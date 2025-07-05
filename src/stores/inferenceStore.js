import { defineStore } from "pinia";
import { ref } from "vue";

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
  const matchCount = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  inferenceWorker.onmessage = (event) => {
    const { type, data } = event.data;
    if (type === "inferenceComplete") {
      console.log("Inference results:", data.results);
      matchCount.value = data.results.matches?.dims?.[0] ?? null;
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

  const runInferenceBatch = async (userFile, topoImagePaths) => {
    // Check if session is ready before starting inference
    if (!sessionReady.value) {
      errorString.value = "Inference session is not ready yet. Please wait.";
      return;
    }

    isLoading.value = true;
    loadingMessage.value = `Inferencing with user image and ${topoImagePaths.length} topo images...`;
    matchCount.value = null;
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

      const resp = await fetch(imgPath);
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

            if (matches !== null && matches > bestMatches) {
              bestMatches = matches;
              bestResult = {
                rawData: data.results,
                images: data.images,
                imgWidth: data.imgWidth,
                imgHeight: data.imgHeight,
              };
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

    // Only keep the best result for visualization
    inferenceResults.value = {};
    if (bestResult && bestImgPath) {
      inferenceResults.value[bestImgPath] = bestResult;
      matchCount.value = bestMatches; // Update global matchCount with best result
    }

    currentlyProcessingImage.value = null;
    isLoading.value = false;
    loadingMessage.value = "";

    console.log("Best result:", bestResult);
  };

  const resetInferenceState = () => {
    matchCount.value = null;
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
    inferenceTimes,
    currentlyProcessingImage,
    matchCount,
    errorString,
    sessionReady,
    runInferenceBatch,
    resetInferenceState,
  };
});
