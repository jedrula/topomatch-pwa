/**
 * Inference Store - Main Thread Version (No Worker)
 * 
 * Uses inferenceService.js directly in main thread
 * Based on ONNX Runtime Web best practices:
 * https://onnxruntime.ai/docs/tutorials/web/deploy.html
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { imageCacheService } from '@/services/imageCacheService';
import * as inferenceService from '@/services/inferenceService';

export const useInferenceStore = defineStore('inference', () => {
  const sessionTime = ref(null);
  const isLoading = ref(true); // Start loading immediately
  const loadingMessage = ref('Creating inference session...');
  const inferenceResults = ref({});
  const matchCounts = ref({});
  const inferenceTimes = ref({});
  const currentlyProcessingImage = ref(null);
  const errorString = ref(null);
  const sessionReady = ref(false);

  // Create session immediately when store is initialized
  const initializeSession = async () => {
    try {
      const result = await inferenceService.createSession();
      sessionTime.value = `${result.sessionTime.toFixed(2)} ms`;
      sessionReady.value = true;
      isLoading.value = false;
      loadingMessage.value = '';
    } catch (error) {
      errorString.value = error.message;
      isLoading.value = false;
      loadingMessage.value = '';
      console.error('Inference session creation error:', error);
    }
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
      console.warn('⚠️ Session not ready yet, waiting...');
      // Wait for session to be ready
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

    // Check if we're still loading (shouldn't happen but defensive)
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

    const userImageBuffer = await userFile.arrayBuffer();

    const totalImages = topoImagePaths.length;
    let processedImages = 0;

    for (const imagePath of topoImagePaths) {
      try {
        currentlyProcessingImage.value = imagePath;

        // Fetch image (uses cache-first strategy)
        const resp = await imageCacheService.fetchImage(imagePath);
        const topoBlob = await resp.blob();
        const topoImageBuffer = await topoBlob.arrayBuffer();

        // Run inference directly (no worker)
        const data = await inferenceService.runInference(userImageBuffer, topoImageBuffer);

        const { inferenceTime, results, imgWidth, imgHeight, userImageDims, topoImageDims } = data;

        // Process results - match worker store structure
        const matches = results.matches?.dims?.[0] ?? null;
        matchCounts.value[imagePath] = matches;

        inferenceResults.value[imagePath] = {
          rawData: results,
          images: data.images,
          imgWidth,
          imgHeight,
          userImageDims,
          topoImageDims,
        };
        inferenceTimes.value[imagePath] = inferenceTime;

        processedImages++;

        // Call progress callback if provided
        if (progressCallback) {
          progressCallback({
            processed: processedImages,
            total: totalImages,
            currentImage: imagePath,
            matchCount: matches,
          });
        }
      } catch (error) {
        console.error(`Error processing image ${imagePath}:`, error);
        matchCounts.value[imagePath] = 0;
        inferenceResults.value[imagePath] = null;
        inferenceTimes.value[imagePath] = 0;
      }
    }

    currentlyProcessingImage.value = null;

    if (onComplete) {
      onComplete();
    }

    return {
      matchCounts: matchCounts.value,
      inferenceResults: inferenceResults.value,
      inferenceTimes: inferenceTimes.value,
    };
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

  /**
   * Wait for the inference session to be ready
   * @param {number} timeout - Maximum wait time in milliseconds (default: 60000)
   * @returns {Promise<void>}
   * @throws {Error} If session fails to initialize within timeout
   */
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
      }, 500); // Check every 500ms
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
