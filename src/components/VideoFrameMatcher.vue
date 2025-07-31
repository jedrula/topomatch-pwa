<template>
  <div class="video-frame-matcher-component">
    <!-- Video File Selection -->
    <div v-if="!selectedVideo" class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div class="text-center">
        <svg
          class="w-12 h-12 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          ></path>
        </svg>
        <div class="mb-4">
          <h4 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h4>
          <p class="text-sm text-gray-500">{{ subtitle }}</p>
        </div>

        <!-- File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          @change="handleVideoSelect"
          class="hidden"
        />

        <button
          type="button"
          @click="$refs.fileInput.click()"
          :disabled="isProcessing"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Choose Video File
        </button>

        <p class="text-xs text-gray-500 mt-2">MP4, WebM, MOV up to 100MB</p>
      </div>
    </div>

    <!-- Video Selected - Show Processing Steps -->
    <div v-else class="space-y-4">
      <!-- Video Info -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900">{{ selectedVideo.name }}</h4>
            <p class="text-sm text-gray-500">{{ formatFileSize(selectedVideo.size) }}</p>
          </div>
          <button
            type="button"
            @click="clearVideo"
            :disabled="isProcessing"
            class="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Frame Extraction Status -->
      <div v-if="isExtractingFrame" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p class="text-sm font-medium text-blue-900">Extracting frame from video...</p>
        </div>
      </div>

      <!-- Extracted Frame Display -->
      <div v-if="extractedFrame" class="bg-white border border-gray-200 rounded-lg p-4">
        <div class="flex items-start space-x-4">
          <img
            :src="extractedFrame.url"
            alt="Extracted frame"
            class="w-24 h-24 object-cover rounded border"
          />
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900">Extracted Frame</h4>
            <p class="text-xs text-gray-500 mt-1">
              Frame at {{ formatTime(extractedFrame.timeExtracted) }} ({{
                Math.round((extractedFrame.timeExtracted / extractedFrame.videoDuration) * 100)
              }}% through video)
            </p>
            <p class="text-xs text-gray-500">Ready for image matching analysis</p>
          </div>
        </div>
      </div>

      <!-- Image Matcher Component -->
      <ImageMatcher
        v-if="extractedFrame && comparisonImages.length > 0"
        :source-image="extractedFrame.file"
        :comparison-images="comparisonImages"
        :auto-start="autoStartMatching"
        @match-found="handleMatchFound"
        @analysis-complete="handleAnalysisComplete"
        @analysis-error="handleAnalysisError"
      />

      <!-- No Comparison Images Warning -->
      <div
        v-if="extractedFrame && comparisonImages.length === 0"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
      >
        <div class="flex items-start space-x-3">
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
          <div>
            <h4 class="text-sm font-medium text-yellow-900">No Comparison Images</h4>
            <p class="text-sm text-yellow-700 mt-1">
              No images available for comparison. Add some boulder problem images to enable
              automatic matching.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 class="text-sm font-medium text-red-900">Processing Error</h4>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ImageMatcher from "./ImageMatcher.vue";
import { extractVideoFrame, validateVideoFile } from "@/utils/videoFrameUtils";

const props = defineProps({
  comparisonImages: {
    type: Array, // Array of {id, url, name} objects
    default: () => [],
  },
  title: {
    type: String,
    default: "Upload Climbing Video",
  },
  subtitle: {
    type: String,
    default: "Upload a video and let AI identify the boulder problem automatically",
  },
  frameExtractionTime: {
    type: Number,
    default: 5, // Extract frame at 5 seconds by default
  },
  autoStartMatching: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  "video-selected",
  "frame-extracted",
  "match-found",
  "analysis-complete",
  "processing-error",
  "video-cleared",
]);

// Reactive state
const fileInput = ref(null);
const selectedVideo = ref(null);
const extractedFrame = ref(null);
const isExtractingFrame = ref(false);
const error = ref(null);

// Computed
const isProcessing = computed(() => {
  return isExtractingFrame.value;
});

// Methods
const handleVideoSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Clear previous state
  clearState();

  // Validate video file
  const validation = validateVideoFile(file);
  if (!validation.isValid) {
    error.value = validation.errors.join(", ");
    return;
  }

  // Set selected video
  selectedVideo.value = file;
  emit("video-selected", file);

  // Start frame extraction
  await extractFrame();

  // Clear the input so the same file can be selected again
  event.target.value = "";
};

const extractFrame = async () => {
  if (!selectedVideo.value) return;

  try {
    isExtractingFrame.value = true;
    error.value = null;

    const frameData = await extractVideoFrame(selectedVideo.value, props.frameExtractionTime);

    extractedFrame.value = frameData;
    emit("frame-extracted", frameData);
  } catch (err) {
    console.error("Frame extraction error:", err);
    error.value = "Failed to extract frame from video: " + err.message;
    emit("processing-error", err);
  } finally {
    isExtractingFrame.value = false;
  }
};

const handleMatchFound = (matchedImage) => {
  emit("match-found", {
    video: selectedVideo.value,
    frame: extractedFrame.value,
    match: matchedImage,
  });
};

const handleAnalysisComplete = (bestMatch) => {
  emit("analysis-complete", {
    video: selectedVideo.value,
    frame: extractedFrame.value,
    match: bestMatch,
  });
};

const handleAnalysisError = (analysisError) => {
  error.value = "Image analysis failed: " + analysisError.message;
  emit("processing-error", analysisError);
};

const clearVideo = () => {
  clearState();
  emit("video-cleared");
};

const clearState = () => {
  selectedVideo.value = null;
  extractedFrame.value = null;
  isExtractingFrame.value = false;
  error.value = null;

  // Clean up any object URLs
  if (extractedFrame.value?.url) {
    URL.revokeObjectURL(extractedFrame.value.url);
  }
};

const formatFileSize = (bytes) => {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Expose methods for parent component
defineExpose({
  clearVideo,
  extractFrame,
});
</script>

<style scoped>
/* Video frame matcher component styles */
</style>
