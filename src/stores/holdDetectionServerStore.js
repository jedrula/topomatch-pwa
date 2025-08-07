import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { holdDetectionServerService } from "../services/holdDetectionServerService.js";
import { 
  getCachedDetectionResult, 
  setCachedDetectionResult, 
  clearAllDetectionCache,
  clearExpiredDetectionCache 
} from "../services/detectionCacheService.js";

export const useHoldDetectionServerStore = defineStore("holdDetectionServer", () => {
  // Core state
  const isProcessing = ref(false);
  const currentJobId = ref(null);
  const processingStatus = ref("ready"); // ready, fetching, uploading, processing, completed, error
  const statusMessage = ref("Ready to process images");
  const error = ref(null);

  // API configuration
  const apiUrl = ref("http://192.168.0.243:8000");
  const apiHealthy = ref(false);

  // Processing progress
  const currentStep = ref(0);
  const totalSteps = ref(4);
  const progressPercent = ref(0);
  const detailedProgress = ref(null);

  // Results
  const results = ref(null);
  const processingMetrics = ref(null);

  // Compression settings
  const compressionSettings = ref({
    enabled: true,
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  // Computed properties
  const isReady = computed(() => processingStatus.value === "ready" && apiHealthy.value);
  const hasResults = computed(() => results.value !== null);
  const isLoading = computed(() => isProcessing.value);

  const holdCount = computed(() => {
    return results.value?.yolo_results?.total_detections || 0;
  });

  const processingTime = computed(() => {
    return results.value?.processing_time || 0;
  });

  const svgCount = computed(() => {
    return results.value?.svg_files?.length || 0;
  });

  // Actions
  const setApiUrl = (url) => {
    apiUrl.value = url;
    holdDetectionServerService.setApiUrl(url);
  };

  const testApiHealth = async () => {
    try {
      console.log("🔍 Testing API health with URL:", apiUrl.value);
      statusMessage.value = "Testing API connection...";

      const healthResult = await holdDetectionServerService.testHealth();

      if (healthResult.success) {
        apiHealthy.value = true;
        statusMessage.value = "API is ready";
        console.log("✅ API Health check successful");
        return { success: true, data: healthResult.data };
      } else {
        apiHealthy.value = false;
        error.value = healthResult.error;
        statusMessage.value = healthResult.message;
        console.log("❌ API Health check failed:", healthResult.error);
        return { success: false, error: healthResult.error };
      }
    } catch (err) {
      apiHealthy.value = false;
      error.value = err.message;
      statusMessage.value = `API connection failed: ${err.message}`;
      console.log("❌ API Health exception:", err.message);
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
      error.value = "No image URL provided";
      return { success: false, error: "No image URL provided" };
    }

    if (!apiHealthy.value) {
      error.value = "API is not healthy. Please test connection first.";
      return { success: false, error: "API is not healthy" };
    }

    // Check cache first using the cache service
    const cachedResult = getCachedDetectionResult(imageUrl, compressionSettings.value);
    if (cachedResult) {
      console.log("🚀 Using cached detection results");
      
      // Simulate quick processing for user feedback
      isProcessing.value = true;
      processingStatus.value = "completed";
      statusMessage.value = "Using cached results...";
      updateProgress(4, 100, "Loaded from cache!");
      
      // Set results and complete
      results.value = cachedResult.result;
      processingMetrics.value = cachedResult.metrics;
      
      // Brief delay to show cache feedback
      setTimeout(() => {
        isProcessing.value = false;
        statusMessage.value = "Processing completed (cached)";
      }, 500);

      return {
        success: true,
        result: cachedResult.result,
        metrics: cachedResult.metrics,
        fromCache: true
      };
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
      processingStatus.value = "uploading";
      updateProgress(1, 10, "Starting image processing...");

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
      processingStatus.value = "processing";
      updateProgress(4, 30, "Processing image on server...");

      const pollResult = await pollWithProgress(processResult.jobId);

      if (!pollResult.success) {
        throw new Error(pollResult.error);
      }

      // Success!
      results.value = pollResult.result;
      processingStatus.value = "completed";
      updateProgress(4, 100, "Processing completed successfully!");

      console.log("Processing completed:", results.value);

      // Cache the successful result using the cache service
      const resultToCache = {
        result: pollResult.result,
        metrics: processingMetrics.value
      };
      setCachedDetectionResult(imageUrl, compressionSettings.value, resultToCache);

      return {
        success: true,
        result: results.value,
        metrics: processingMetrics.value,
        fromCache: false
      };
    } catch (err) {
      error.value = err.message;
      processingStatus.value = "error";
      statusMessage.value = `Processing failed: ${err.message}`;
      console.error("Processing failed:", err);

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
        throw new Error("Processing timeout: Maximum attempts exceeded");
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

      if (status === "completed") {
        return {
          success: true,
          result,
          message: "Processing completed successfully",
        };
      }

      if (status === "failed") {
        const errorMsg = result?.error_message || "Unknown error";
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
    processingStatus.value = "ready";
    statusMessage.value = "Ready to process images";
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

    // Computed
    isReady,
    hasResults,
    isLoading,
    holdCount,
    processingTime,
    svgCount,

    // Actions
    setApiUrl,
    testApiHealth,
    processImage,
    clearResults,
    resetState,
    
    // Cache management (delegated to cache service)
    clearAllCache: clearAllDetectionCache,
    clearExpiredCache: clearExpiredDetectionCache,
  };
});
