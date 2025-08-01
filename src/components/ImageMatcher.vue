<template>
  <div class="image-matcher-component">
    <!-- Analysis Status -->
    <div v-if="isAnalyzing" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <div class="flex-1">
          <p class="text-sm font-medium text-blue-900">{{ analysisStatus }}</p>
          <div class="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${analysisProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-blue-700 mt-1">
            {{ currentImageIndex }}/{{ totalImages }} images analyzed
          </p>
        </div>
      </div>
    </div>

    <!-- Analysis Results -->
    <div v-else-if="bestMatch" class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-green-900">Best Match Found</h4>
          <p class="text-sm text-green-700 mt-1">{{ bestMatch.name || "Matched image" }}</p>
          <div class="mt-2 flex items-center space-x-4">
            <img
              v-if="sourceImageUrl"
              :src="sourceImageUrl"
              alt="Source image"
              class="w-16 h-16 object-cover rounded border"
            />
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <img
              :src="bestMatch.url"
              :alt="bestMatch.name"
              class="w-16 h-16 object-cover rounded border"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- No Match Found -->
    <div
      v-else-if="analysisComplete && !bestMatch"
      class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg
            class="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-medium text-yellow-900">No Clear Match</h4>
          <p class="text-sm text-yellow-700 mt-1">
            No strong match found among the comparison images. You may need to select manually.
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-medium text-red-900">Analysis Failed</h4>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Manual Trigger Button -->
    <div
      v-if="!isAnalyzing && !analysisComplete && sourceImage && comparisonImages.length > 0"
      class="text-center"
    >
      <button
        type="button"
        @click="startAnalysis"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Image Analysis
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useInferenceStore } from "@/stores/inferenceStore";
import { calculateHomographyMatrix } from "@/utils/homographyUtils";

const props = defineProps({
  sourceImage: {
    type: [File, String], // Can be File object or URL string
    default: null,
  },
  comparisonImages: {
    type: Array, // Array of {id, url, name} objects
    default: () => [],
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["match-found", "analysis-complete", "analysis-error"]);

// Get inference store for image analysis
const inferenceStore = useInferenceStore();

// Reactive state
const isAnalyzing = ref(false);
const analysisComplete = ref(false);
const analysisStatus = ref("");
const currentImageIndex = ref(0);
const totalImages = ref(0);
const bestMatch = ref(null);
const error = ref(null);
const sourceImageUrl = ref(null);

// Computed
const analysisProgress = computed(() => {
  if (totalImages.value === 0) return 0;
  return Math.round((currentImageIndex.value / totalImages.value) * 100);
});

// Methods
const resetAnalysis = () => {
  isAnalyzing.value = false;
  analysisComplete.value = false;
  analysisStatus.value = "";
  currentImageIndex.value = 0;
  totalImages.value = 0;
  bestMatch.value = null;
  error.value = null;
  sourceImageUrl.value = null;
};

const prepareSourceImage = async () => {
  if (!props.sourceImage) return null;

  if (props.sourceImage instanceof File) {
    // Create object URL for display
    sourceImageUrl.value = URL.createObjectURL(props.sourceImage);
    return props.sourceImage;
  } else if (typeof props.sourceImage === "string") {
    // It's already a URL
    sourceImageUrl.value = props.sourceImage;

    // Convert URL to File object for inference
    try {
      const response = await fetch(props.sourceImage);
      const blob = await response.blob();
      return new File([blob], "source-image.jpg", { type: blob.type });
    } catch (fetchError) {
      throw new Error("Failed to load source image from URL: " + fetchError.message);
    }
  }

  return null;
};

// Helper function to wait for inference session to be ready
const waitForInferenceSession = async (maxWaitTime = 10000) => {
  const checkInterval = 100; // Check every 100ms
  const maxAttempts = maxWaitTime / checkInterval;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkSession = () => {
      if (inferenceStore.sessionReady) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error("Timeout waiting for AI session to initialize"));
      } else {
        attempts++;
        setTimeout(checkSession, checkInterval);
      }
    };

    checkSession();
  });
};

const startAnalysis = async () => {
  if (!props.sourceImage || props.comparisonImages.length === 0) {
    error.value = "Missing source image or comparison images";
    return;
  }

  // Wait for inference session to be ready
  if (!inferenceStore.sessionReady) {
    try {
      resetAnalysis();
      isAnalyzing.value = true;
      analysisStatus.value = "Initializing AI session...";

      // Wait for session to be ready with timeout
      await waitForInferenceSession();
    } catch (sessionError) {
      error.value = "Failed to initialize AI session: " + sessionError.message;
      isAnalyzing.value = false;
      return;
    }
  }

  try {
    if (!isAnalyzing.value) {
      resetAnalysis();
      isAnalyzing.value = true;
    }
    analysisStatus.value = "Preparing source image...";

    // Prepare source image
    const sourceImageFile = await prepareSourceImage();
    if (!sourceImageFile) {
      throw new Error("Failed to prepare source image");
    }

    analysisStatus.value = "Analyzing against comparison images...";
    totalImages.value = props.comparisonImages.length;
    currentImageIndex.value = 0;

    // Convert comparison images to URLs array
    const comparisonUrls = props.comparisonImages.map((img) => img.url);

    // Run inference with progress tracking
    await inferenceStore.runInferenceBatch(
      sourceImageFile,
      comparisonUrls,
      (bestMatchUrl) => {
        // Find the comparison image that matches the best result
        const matchedImage = props.comparisonImages.find((img) => img.url === bestMatchUrl);

        if (matchedImage) {
          bestMatch.value = matchedImage;
          analysisStatus.value = `Best match: ${matchedImage.name || "Found match"}`;

          // Emit match found event
          emit("match-found", matchedImage);
        } else {
          analysisStatus.value = "No clear match found";
        }

        // Complete analysis
        analysisComplete.value = true;
        isAnalyzing.value = false;

        // Emit completion event
        emit("analysis-complete", bestMatch.value);
      },
      (currentIndex, totalCount) => {
        // Progress callback
        currentImageIndex.value = currentIndex + 1;
        totalImages.value = totalCount;
        analysisStatus.value = `Analyzing image ${currentIndex + 1} of ${totalCount}...`;
      }
    );
  } catch (err) {
    console.error("Image analysis error:", err);
    error.value = err.message || "Analysis failed";
    isAnalyzing.value = false;
    analysisComplete.value = true;

    // Emit error event
    emit("analysis-error", err);
  }
};

// Watch for changes in source image or comparison images
watch(
  () => [props.sourceImage, props.comparisonImages],
  async () => {
    resetAnalysis();
    if (props.autoStart && props.sourceImage && props.comparisonImages.length > 0) {
      // Use setTimeout to avoid blocking the watcher
      setTimeout(() => {
        startAnalysis().catch((err) => {
          console.error("Auto-analysis failed:", err);
          error.value = "Auto-analysis failed: " + err.message;
        });
      }, 100);
    }
  },
  { immediate: true }
);

// Expose methods for parent component
defineExpose({
  startAnalysis,
  resetAnalysis,
});
</script>

<style scoped>
/* Image matcher component styles */
</style>
