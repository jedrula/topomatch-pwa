/**
 * Inference Store - Worker-based (Best Practices)
 * Following ONNX Runtime Web deployment best practices
 * 
 * Key improvements over old implementation:
 * - Uses ES modules for worker (no concatenation)
 * - Proper worker loading as per ONNX Runtime docs
 * - Same API as inferenceStoreMainThread for easy switching
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { imageCacheService } from '@/services/imageCacheService';

export const useInferenceStore = defineStore('inference', () => {
  let inferenceWorker;
  
  try {
    // Load worker as ES module (best practice)
    inferenceWorker = new Worker(
      new URL('../workers/inferenceWorkerNew.js', import.meta.url),
      { type: 'module' }
    );
  } catch (error) {
    console.error('❌ Failed to create inference worker:', error);
  }

  const sessionTime = ref(null);
  const isLoading = ref(true);
  const loadingMessage = ref('Creating inference session...');
  const inferenceResults = ref({});
  const matchCounts = ref({});
  const inferenceTimes = ref({});
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  // Add error handler for worker failures
  if (inferenceWorker) {
    inferenceWorker.onerror = (error) => {
      console.error('❌ Inference worker error:', error);
      errorString.value = `Worker failed: ${error.message || 'Unknown error'}`;
      isLoading.value = false;
      sessionReady.value = false;
    };
  }

  if (!inferenceWorker) {
    console.error('❌ Could not create inference worker - feature matching disabled');
    errorString.value = 'Failed to initialize inference worker';
    isLoading.value = false;
    sessionReady.value = false;
  }

  // Listen for worker messages
  if (inferenceWorker) {
    inferenceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      
      if (type === 'sessionReady') {
        sessionTime.value = data.sessionTime;
        isLoading.value = false;
        sessionReady.value = true;
        loadingMessage.value = '';
        console.log('✅ Inference session ready');
      } else if (type === 'error') {
        errorString.value = data.message;
        isLoading.value = false;
        sessionReady.value = false;
        console.error('❌ Worker error:', data.message);
      }
    });

    // Start session creation immediately
    inferenceWorker.postMessage({ type: 'createSession' });
  }

  const sortedMatchCounts = computed(() => {
    return Object.entries(matchCounts.value)
      .filter(([_, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA);
  });

  const runInferenceBatch = async (
    userFile,
    topoImagePaths,
    onComplete = null,
    progressCallback = null
  ) => {
    // Check if session is ready before starting inference
    if (!sessionReady.value) {
      console.warn('⚠️ Session not ready yet, waiting...');
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (sessionReady.value || errorString.value) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      if (errorString.value) {
        throw new Error(`Cannot run inference: ${errorString.value}`);
      }
    }

    if (isLoading.value) {
      throw new Error('Session is still loading, please wait...');
    }

    if (!userFile) {
      throw new Error('User file is required for inference.');
    }

    if (!topoImagePaths || topoImagePaths.length === 0) {
      throw new Error('At least one topo image path is required for inference.');
    }

    matchCounts.value = {};
    inferenceResults.value = {};
    inferenceTimes.value = {};

    const userArrayBuffer = await userFile.arrayBuffer();
    const MATCH_THRESHOLD = 50;
    const allResults = {};
    let bestResult = null;
    let bestMatches = -Infinity;
    let bestImgPath = null;

    for (let i = 0; i < topoImagePaths.length; i++) {
      const imgPath = topoImagePaths[i];
      currentlyProcessingImage.value = imgPath;

      if (progressCallback) {
        progressCallback(i, topoImagePaths.length);
      }

      // Fetch image (cache-first strategy)
      const resp = await imageCacheService.fetchImage(imgPath);
      const topoBlob = await resp.blob();
      const topoArrayBuffer = await topoBlob.arrayBuffer();

      // Clone the user buffer for transfer
      const userArrayBufferCopy = userArrayBuffer.slice(0);
      const start = performance.now();

      await new Promise((resolve) => {
        const handler = (event) => {
          const { type, data } = event.data;
          if (type === 'inferenceComplete') {
            const elapsed = performance.now() - start;
            inferenceTimes.value[imgPath] = elapsed;
            const matches = data.results.matches?.dims?.[0] ?? null;
            matchCounts.value[imgPath] = matches;

            const currentResult = {
              rawData: data.results,
              // images removed - not used and causes memory leak
              imgWidth: data.imgWidth,
              imgHeight: data.imgHeight,
              userImageDims: data.userImageDims,
              topoImageDims: data.topoImageDims,
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

            inferenceWorker.removeEventListener('message', handler);
            resolve();
          }
        };

        if (inferenceWorker) {
          inferenceWorker.addEventListener('message', handler);
          inferenceWorker.postMessage(
            {
              type: 'runInference',
              userImageBuffer: userArrayBufferCopy,
              topoImageBuffer: topoArrayBuffer,
            },
            [userArrayBufferCopy, topoArrayBuffer]
          );
        } else {
          resolve();
        }
      });
    }

    // Store results
    inferenceResults.value = { ...allResults };
    if (bestResult && bestImgPath && !inferenceResults.value[bestImgPath]) {
      inferenceResults.value[bestImgPath] = bestResult;
    }

    currentlyProcessingImage.value = null;

    if (onComplete && bestImgPath) {
      onComplete(bestImgPath);
    }
  };

  const getTopMatch = (userImagePath, topoImagePaths) => {
    if (!topoImagePaths || topoImagePaths.length === 0) {
      return null;
    }

    let maxCount = 0;
    let topMatch = null;

    for (const imagePath of topoImagePaths) {
      const count = matchCounts.value[imagePath] || 0;
      if (count > maxCount) {
        maxCount = count;
        topMatch = imagePath;
      }
    }

    return topMatch;
  };

  const resetInferenceState = () => {
    inferenceResults.value = {};
    matchCounts.value = {};
    inferenceTimes.value = {};
    currentlyProcessingImage.value = null;
    errorString.value = null;
  };

  const ensureSessionReady = async (timeout = 60000) => {
    if (sessionReady.value) return;
    
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (sessionReady.value) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Inference session failed to initialize within timeout'));
        } else if (errorString.value) {
          clearInterval(checkInterval);
          reject(new Error(`Inference session initialization failed: ${errorString.value}`));
        }
      }, 500);
    });
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
    runInferenceBatch,
    getTopMatch,
    resetInferenceState,
    ensureSessionReady,
  };
});
