import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { holdDetectionServerService } from "../services/holdDetectionServerService.js";

export const useHoldDetectionServerStore = defineStore("holdDetectionServer", () => {
  // Store instance ID for debugging
  const storeInstanceId = Math.random().toString(36).substr(2, 9);
  console.log("🏗️ Creating hold detection server store instance:", storeInstanceId);

  // Core state
  const isProcessing = ref(false);
  const currentJobId = ref(null);
  const processingStatus = ref("ready"); // ready, fetching, uploading, processing, completed, error
  const statusMessage = ref("Ready to process images");
  const error = ref(null);

  // API configuration - CRITICAL: This ref must be the single source of truth
  const apiUrl = ref("http://192.168.0.243:8000");
  const apiHealthy = ref(false);

  console.log(
    "🏗️ Store",
    storeInstanceId,
    "- Initial apiHealthy:",
    apiHealthy.value,
    "ref:",
    apiHealthy
  );

  // Debug: Track apiHealthy changes
  const _debugApiHealthyHistory = ref([]);
  const _setApiHealthy = (value, reason = "unknown") => {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;
    _debugApiHealthyHistory.value.push({
      timestamp,
      oldValue: apiHealthy.value,
      newValue: value,
      reason,
      stackTrace: stackTrace?.split("\n").slice(0, 5).join("\n"), // First 5 lines of stack
    });

    console.log(
      `🔄 API_HEALTHY_CHANGE [${storeInstanceId}]: ${apiHealthy.value} → ${value} (${reason}) at ${timestamp}`
    );
    apiHealthy.value = value;

    // Keep only last 10 entries to prevent memory leaks
    if (_debugApiHealthyHistory.value.length > 10) {
      _debugApiHealthyHistory.value = _debugApiHealthyHistory.value.slice(-10);
    }
  };

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
    console.log("🔧 API URL changed to:", url);
  };

  const testApiHealth = async () => {
    try {
      console.log("🔍 Store: Testing API health with URL:", apiUrl.value);
      console.log("🔍 Store: Current apiHealthy value before test:", apiHealthy.value);
      console.log("🔍 Store: apiHealthy ref identity:", apiHealthy);
      statusMessage.value = "Testing API connection...";

      const healthResult = await holdDetectionServerService.testHealth();
      console.log("🔍 Store: Health result received:", healthResult);

      if (healthResult.success) {
        console.log("🔍 Store: Setting apiHealthy to true...");
        _setApiHealthy(true, "health_check_success");
        statusMessage.value = "API is ready";
        console.log("✅ Store: API Health successful:", healthResult.data);
        console.log("✅ Store: apiHealthy value after setting:", apiHealthy.value);
        console.log("✅ Store: isReady computed:", isReady.value);

        return { success: true, data: healthResult.data };
      } else {
        console.log("🔍 Store: Setting apiHealthy to false...");
        _setApiHealthy(false, "health_check_failed");
        error.value = healthResult.error;
        statusMessage.value = healthResult.message;
        console.log("❌ Store: API Health failed:", healthResult.error);
        console.log("❌ Store: apiHealthy value after setting:", apiHealthy.value);
        return { success: false, error: healthResult.error };
      }
    } catch (err) {
      console.log("🔍 Store: Exception caught, setting apiHealthy to false...");
      _setApiHealthy(false, "health_check_exception");
      error.value = err.message;
      statusMessage.value = `API connection failed: ${err.message}`;
      console.log("❌ Store: API Health exception:", err.message);
      console.log("❌ Store: apiHealthy value after exception:", apiHealthy.value);
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

      return {
        success: true,
        result: results.value,
        metrics: processingMetrics.value,
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

  const clearResults = () => {
    results.value = null;
    error.value = null;
    currentJobId.value = null;
    processingMetrics.value = null;
    detailedProgress.value = null;
    processingStatus.value = "ready";
    statusMessage.value = "Ready to process images";
    currentStep.value = 0;
    progressPercent.value = 0;
  };

  const resetState = () => {
    isProcessing.value = false;
    clearResults();
    // Note: Don't reset apiHealthy here as it's connection state, not processing state
  };

  // Debug function to check apiHealthy history
  const getApiHealthyDebugInfo = () => {
    return {
      storeInstanceId,
      currentValue: apiHealthy.value,
      refIdentity: apiHealthy,
      history: _debugApiHealthyHistory.value,
      computedIsReady: isReady.value,
      processingStatus: processingStatus.value,
    };
  };

  // Initialize service with URL only once
  console.log("🏗️ Initializing hold detection server store with URL:", apiUrl.value);
  holdDetectionServerService.setApiUrl(apiUrl.value);

  // Watch for unexpected apiHealthy changes
  watch(
    apiHealthy,
    (newVal, oldVal) => {
      console.log("🚨 WATCH: apiHealthy changed!", {
        oldValue: oldVal,
        newValue: newVal,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack?.split("\n").slice(0, 10).join("\n"),
      });
    },
    { immediate: true }
  );

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

    // Debug
    getApiHealthyDebugInfo,
  };
});
