import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { holdDetectionServerService } from '../services/holdDetectionServerService.js';
import { configService } from '../services/configService.js';
import {
  getCachedDetectionResult,
  setCachedDetectionResult,
  clearAllDetectionCache,
  clearExpiredDetectionCache,
  clearDetectionCacheForImage,
  hasCachedDetectionResult,
} from '../services/detectionCacheService.js';
import { manualHoldsService } from '../services/manualHoldsService.js';
import { ensureHoldHasSvgMarkup } from '../utils/svgUtils.js';

export const useHoldDetectionServerStore = defineStore('holdDetectionServer', () => {
  // Core state
  const isProcessing = ref(false);
  const currentJobId = ref(null);
  const processingStatus = ref('ready'); // ready, fetching, uploading, processing, completed, error
  const statusMessage = ref('Ready to process images');
  const error = ref(null);

  // API configuration - now using configService
  const apiUrl = ref(configService.getHoldDetectionServerUrl());
  const apiHealthy = ref(false);

  // Set up listener for configuration changes
  configService.setupConfigListener((newConfig) => {
    const newUrl = newConfig.holdDetectionServer.apiUrl;
    if (newUrl !== apiUrl.value) {
      console.log(`🔄 Store: Hold Detection Server URL updated: ${apiUrl.value} → ${newUrl}`);
      apiUrl.value = newUrl;
      // Re-check health with new URL (will be defined below)
      setTimeout(() => testApiHealth(), 100);
    }
  });

  // Processing progress
  const currentStep = ref(0);
  const totalSteps = ref(4);
  const progressPercent = ref(0);
  const detailedProgress = ref(null);

  // Results
  const results = ref(null);
  const processingMetrics = ref(null);

  // Manual holds
  const manualHolds = ref([]);
  const isDrawingMode = ref(false);
  const isDeleteMode = ref(false);
  const isQuickDrawMode = ref(false); // Auto drawing mode for boulder problem creation

  // Compression settings
  const compressionSettings = ref({
    enabled: true,
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  // Computed properties
  const isReady = computed(() => processingStatus.value === 'ready' && apiHealthy.value);
  const hasResults = computed(() => results.value !== null);
  const isLoading = computed(() => isProcessing.value);

  // Can process either via API (when healthy) or cache (when available)
  const canProcessImage = (imageUrl) => {
    if (!imageUrl) return false;
    return apiHealthy.value || hasCachedDetectionResult(imageUrl, compressionSettings.value);
  };

  const holdCount = computed(() => {
    return results.value?.yolo_results?.total_detections || 0;
  });

  const processingTime = computed(() => {
    return results.value?.processing_time || 0;
  });

  const svgCount = computed(() => {
    return results.value?.svg_files?.length || 0;
  });

  // Combined holds (AI + manual) for unified display
  const combinedHolds = computed(() => {
    const aiHolds = results.value?.holds || [];
    // Ensure manual holds have svgMarkup for consistent display
    const enrichedManualHolds = manualHolds.value.map(ensureHoldHasSvgMarkup);
    return [...aiHolds, ...enrichedManualHolds];
  });

  const combinedSvgMarkups = computed(() => {
    const aiSvgs = results.value?.svg_markups || [];
    // Ensure manual holds have svgMarkup, convert from pathPoints if needed
    const manualSvgs = manualHolds.value.map((hold) => {
      const enrichedHold = ensureHoldHasSvgMarkup(hold);
      return enrichedHold.svgMarkup;
    });
    return [...aiSvgs, ...manualSvgs];
  });

  const totalHoldCount = computed(() => {
    return combinedHolds.value.length;
  });

  // Actions
  const setApiUrl = (url) => {
    apiUrl.value = url;
    holdDetectionServerService.setApiUrl(url);
  };

  const testApiHealth = async () => {
    try {
      console.log('🔍 Testing API health with URL:', apiUrl.value);
      statusMessage.value = 'Testing API connection...';

      const healthResult = await holdDetectionServerService.testHealth();

      if (healthResult.success) {
        apiHealthy.value = true;
        statusMessage.value = 'API is ready';
        console.log('✅ API Health check successful');
        return { success: true, data: healthResult.data };
      } else {
        apiHealthy.value = false;
        error.value = healthResult.error;
        statusMessage.value = healthResult.message;
        console.log('❌ API Health check failed:', healthResult.error);
        return { success: false, error: healthResult.error };
      }
    } catch (err) {
      apiHealthy.value = false;
      error.value = err.message;
      statusMessage.value = `API connection failed: ${err.message}`;
      console.log('❌ API Health exception:', err.message);
      return { success: false, error: err.message };
    }
  };

  const updateProgress = (step, percent, message) => {
    currentStep.value = step;
    progressPercent.value = percent;
    if (message) {
      statusMessage.value = message;
    }
  };

  const processImage = async (imageUrl) => {
    if (!imageUrl) {
      error.value = 'No image URL provided';
      return { success: false, error: 'No image URL provided' };
    }

    // Check cache first - we can load cached results even if API is down
    console.log('🔍 Checking cache for image:', imageUrl);
    console.log('🔧 Cache settings:', compressionSettings.value);

    const cachedResult = getCachedDetectionResult(imageUrl, compressionSettings.value);
    if (cachedResult) {
      console.log('✅ Using cached detection results for:', imageUrl);
      console.log('📦 Cached result contains:', Object.keys(cachedResult.result || {}));

      // Set results immediately with compression info
      results.value = {
        ...cachedResult.result,
        // Include compression info for overlay coordinate adjustment
        compressionRatio: cachedResult.metrics?.compressionRatio,
        originalSize: cachedResult.metrics?.originalSize,
      };
      processingMetrics.value = cachedResult.metrics;

      // Update status to show cached results
      processingStatus.value = 'completed';
      statusMessage.value = 'Results loaded from cache';
      error.value = null;

      return {
        success: true,
        result: cachedResult.result,
        metrics: cachedResult.metrics,
        fromCache: true,
      };
    }

    // Only check API health if we need to make a server request
    if (!apiHealthy.value) {
      error.value = 'API is not healthy. Please test connection first.';
      return { success: false, error: 'API is not healthy' };
    }

    try {
      // Reset state
      isProcessing.value = true;
      error.value = null;
      results.value = null;
      processingMetrics.value = null;
      currentJobId.value = null;
      detailedProgress.value = null;

      // Step 1-3: Upload workflow
      processingStatus.value = 'uploading';
      updateProgress(1, 10, 'Starting image processing...');

      const processResult = await holdDetectionServerService.processImage(imageUrl, {
        compression: compressionSettings.value,
      });

      if (!processResult.success) {
        throw new Error(processResult.error);
      }

      // Store job ID and metrics
      currentJobId.value = processResult.jobId;
      processingMetrics.value = {
        originalSize: processResult.fetchInfo.originalSize,
        compressionRatio: processResult.fetchInfo.compressionRatio,
      };

      // Step 4: Poll for results
      processingStatus.value = 'processing';
      updateProgress(4, 30, 'Processing image on server...');

      const pollResult = await pollWithProgress(processResult.jobId);

      if (!pollResult.success) {
        throw new Error(pollResult.error);
      }

      // Success!
      results.value = {
        ...pollResult.result,
        // Include compression info for overlay coordinate adjustment
        compressionRatio: processingMetrics.value.compressionRatio,
        originalSize: processingMetrics.value.originalSize,
      };
      processingStatus.value = 'completed';
      updateProgress(4, 100, 'Processing completed successfully!');

      console.log('Processing completed:', results.value);

      // Cache the successful result using the cache service
      const resultToCache = {
        result: pollResult.result,
        metrics: processingMetrics.value,
      };
      console.log('💾 Caching new detection results for:', imageUrl);
      setCachedDetectionResult(imageUrl, compressionSettings.value, resultToCache);

      return {
        success: true,
        result: results.value,
        metrics: processingMetrics.value,
        fromCache: false,
      };
    } catch (err) {
      error.value = err.message;
      processingStatus.value = 'error';
      statusMessage.value = `Processing failed: ${err.message}`;
      console.error('Processing failed:', err);

      return { success: false, error: err.message };
    } finally {
      isProcessing.value = false;
    }
  };

  // Internal polling function with progress updates
  const pollWithProgress = async (jobId) => {
    const maxAttempts = 60;
    const intervalMs = 2000;
    let attempts = 0;

    const poll = async () => {
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error('Processing timeout: Maximum attempts exceeded');
      }

      const statusResult = await holdDetectionServerService.getJobStatus(jobId);

      if (!statusResult.success) {
        throw new Error(statusResult.error);
      }

      const { status, result, detailedProgress: progress } = statusResult;

      // Update detailed progress if available
      if (progress) {
        detailedProgress.value = progress;
      }

      // Update progress percentage
      const baseProgress = 30;
      const processingProgress = Math.min(60, baseProgress + attempts * 1);
      updateProgress(4, processingProgress, `Processing... (${status})`);

      if (status === 'completed') {
        return {
          success: true,
          result,
          message: 'Processing completed successfully',
        };
      }

      if (status === 'failed') {
        const errorMsg = result?.error_message || 'Unknown error';
        throw new Error(`Server processing failed: ${errorMsg}`);
      }

      // Still processing, wait and retry
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      return poll();
    };

    return poll();
  };

  const clearResults = (clearCache = false) => {
    results.value = null;
    error.value = null;
    currentJobId.value = null;
    processingMetrics.value = null;
    detailedProgress.value = null;
    processingStatus.value = 'ready';
    statusMessage.value = 'Ready to process images';
    currentStep.value = 0;
    progressPercent.value = 0;

    if (clearCache) {
      clearAllDetectionCache();
    }
  };

  const resetState = () => {
    isProcessing.value = false;
    clearResults();
  };

  // Manual hold management actions
  const addManualHold = async (hold, locationId, imageUrl) => {
    // Generate unique ID for manual hold
    const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const manualHold = {
      ...hold,
      id,
      confidence: 1.0, // Manual holds have 100% confidence
      type: 'manual',
      timestamp: new Date().toISOString(),
    };

    try {
      // Add to local state immediately for responsive UI
      manualHolds.value.push(manualHold);
      console.log('✅ Added manual hold locally:', manualHold);

      // Save to Firestore if locationId and imageUrl are provided
      if (locationId && imageUrl) {
        await manualHoldsService.addManualHold(locationId, imageUrl, manualHold);
        console.log('☁️ Saved manual hold to Firestore');
      }

      return manualHold;
    } catch (error) {
      // If Firestore save fails, remove from local state
      const index = manualHolds.value.findIndex((hold) => hold.id === id);
      if (index !== -1) {
        manualHolds.value.splice(index, 1);
      }
      console.error('❌ Error adding manual hold:', error);
      throw error;
    }
  };

  const removeManualHold = async (holdId, locationId, imageUrl) => {
    try {
      // Remove from local state immediately for responsive UI
      const index = manualHolds.value.findIndex((hold) => hold.id === holdId);
      let removedHold = null;

      if (index !== -1) {
        removedHold = manualHolds.value.splice(index, 1)[0];
        console.log('🗑️ Removed manual hold locally:', holdId);
      }

      // Remove from Firestore if locationId and imageUrl are provided
      if (locationId && imageUrl) {
        await manualHoldsService.removeManualHold(locationId, imageUrl, holdId);
        console.log('☁️ Removed manual hold from Firestore');
      }
    } catch (error) {
      // If Firestore removal fails, reload from Firestore to sync state
      if (locationId && imageUrl) {
        await loadManualHolds(locationId, imageUrl);
      }
      console.error('❌ Error removing manual hold:', error);
      throw error;
    }
  };

  const clearManualHolds = async (locationId, imageUrl) => {
    try {
      // Clear local state immediately
      manualHolds.value = [];
      console.log('🧹 Cleared all manual holds locally');

      // Clear from Firestore if locationId and imageUrl are provided
      if (locationId && imageUrl) {
        await manualHoldsService.clearManualHolds(locationId, imageUrl);
        console.log('☁️ Cleared manual holds from Firestore');
      }
    } catch (error) {
      console.error('❌ Error clearing manual holds:', error);
      throw error;
    }
  };

  const setDrawingMode = (enabled) => {
    isDrawingMode.value = enabled;
    if (enabled) {
      isDeleteMode.value = false; // Disable delete mode when drawing
      isQuickDrawMode.value = false; // Disable quick draw mode when in explicit drawing
    }
    console.log('✏️ Drawing mode:', enabled ? 'enabled' : 'disabled');
  };

  const setDeleteMode = (enabled) => {
    isDeleteMode.value = enabled;
    if (enabled) {
      isDrawingMode.value = false; // Disable drawing mode when deleting
      isQuickDrawMode.value = false; // Disable quick draw mode when deleting
    }
    console.log('🗑️ Delete mode:', enabled ? 'enabled' : 'disabled');
  };

  const setQuickDrawMode = (enabled) => {
    isQuickDrawMode.value = enabled;
    if (enabled) {
      isDrawingMode.value = false; // Disable explicit drawing mode
      isDeleteMode.value = false; // Disable delete mode
    }
    console.log('⚡ Quick draw mode:', enabled ? 'enabled' : 'disabled');
  };

  // Load manual holds from Firestore
  const loadManualHolds = async (locationId, imageUrl) => {
    try {
      if (!locationId || !imageUrl) {
        console.log('📥 No location or image URL provided, skipping manual holds load');
        manualHolds.value = [];
        return;
      }

      const holds = await manualHoldsService.loadManualHolds(locationId, imageUrl);
      manualHolds.value = holds;
      console.log('📥 Loaded manual holds from Firestore:', holds.length);
    } catch (error) {
      console.error('❌ Error loading manual holds:', error);
      // Don't throw error - just log it and continue with empty holds
      manualHolds.value = [];
    }
  };

  // Save all current manual holds to Firestore
  const saveManualHolds = async (locationId, imageUrl) => {
    try {
      if (!locationId || !imageUrl) {
        console.log('💾 No location or image URL provided, skipping manual holds save');
        return;
      }

      await manualHoldsService.saveManualHolds(locationId, imageUrl, manualHolds.value);
      console.log('💾 Saved manual holds to Firestore:', manualHolds.value.length);
    } catch (error) {
      console.error('❌ Error saving manual holds:', error);
      throw error;
    }
  };

  // Initialize service with URL and clean up expired cache
  holdDetectionServerService.setApiUrl(apiUrl.value);
  clearExpiredDetectionCache(); // Clean up on store initialization

  return {
    // State
    isProcessing,
    currentJobId,
    processingStatus,
    statusMessage,
    error,
    apiUrl,
    apiHealthy,
    currentStep,
    totalSteps,
    progressPercent,
    detailedProgress,
    results,
    processingMetrics,
    compressionSettings,
    manualHolds,
    isDrawingMode,
    isDeleteMode,
    isQuickDrawMode,

    // Computed
    isReady,
    hasResults,
    isLoading,
    holdCount,
    processingTime,
    svgCount,
    canProcessImage,
    combinedHolds,
    combinedSvgMarkups,
    totalHoldCount,

    // Actions
    setApiUrl,
    testApiHealth,
    processImage,
    clearResults,
    resetState,
    addManualHold,
    removeManualHold,
    clearManualHolds,
    setDrawingMode,
    setDeleteMode,
    setQuickDrawMode,
    loadManualHolds,
    saveManualHolds,

    // Cache management (delegated to cache service)
    clearAllCache: clearAllDetectionCache,
    clearExpiredCache: clearExpiredDetectionCache,
    clearCacheForImage: clearDetectionCacheForImage,
    hasCachedResults: (imageUrl) => hasCachedDetectionResult(imageUrl, compressionSettings.value),
  };
});
