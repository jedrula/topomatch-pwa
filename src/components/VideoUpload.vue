<template>
  <div class="video-upload-component">
    <!-- Video Upload Section -->
    <div v-if="!videoData" class="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
          <h4 class="text-lg font-medium text-gray-900 mb-2">Upload Beta Video</h4>
          <p class="text-sm text-gray-500">Share your climbing technique with others</p>
        </div>

        <!-- File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          @change="handleFileSelect"
          class="hidden"
        />

        <button
          type="button"
          @click="$refs.fileInput.click()"
          :disabled="isUploading"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
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

    <!-- File Selected/Preview -->
    <div v-else-if="selectedFile" class="border border-gray-300 rounded-lg p-4">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <svg
            class="w-10 h-10 text-blue-600"
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
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</h4>
          <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>

          <!-- Validation Messages -->
          <div v-if="validationResult && !validationResult.isValid" class="mt-2">
            <div v-for="error in validationResult.errors" :key="error" class="text-sm text-red-600">
              • {{ error }}
            </div>
          </div>
          <div v-if="validationResult && validationResult.warnings.length > 0" class="mt-2">
            <div
              v-for="warning in validationResult.warnings"
              :key="warning"
              class="text-sm text-yellow-600"
            >
              • {{ warning }}
            </div>
          </div>

          <!-- Upload Progress -->
          <div v-if="isUploading" class="mt-3">
            <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{{ Math.round(uploadProgress) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0">
          <button
            type="button"
            @click="clearFile"
            :disabled="isUploading"
            class="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Uploaded Video Display -->
    <div v-else-if="videoData" class="border border-gray-300 rounded-lg overflow-hidden">
      <!-- Video Player -->
      <div class="relative bg-black">
        <video
          ref="videoPlayer"
          :src="videoData.downloadUrl"
          controls
          preload="metadata"
          class="w-full max-h-64 object-contain"
          @loadedmetadata="updateVideoDuration"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <!-- Video Info -->
      <div class="p-4 bg-gray-50">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900">Beta Video</h4>
            <div class="text-xs text-gray-500 mt-1 space-y-1">
              <div>Duration: {{ formatDuration(videoDuration) }}</div>
              <div v-if="videoData.metadata">
                Size: {{ formatFileSize(videoData.metadata.fileSize) }}
              </div>
              <div>Uploaded: {{ formatUploadDate(videoData.metadata?.uploadedAt) }}</div>
            </div>
          </div>
          <button
            type="button"
            @click="removeVideo"
            class="text-gray-400 hover:text-red-600 transition-colors ml-2"
            title="Remove video"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Messages -->
    <div v-if="error" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { videoService } from '@/services/videoService';

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  locationId: {
    type: String,
    required: true,
  },
  problemId: {
    type: String,
    required: false,
    default: null,
  },
  ascentId: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'upload-start', 'upload-complete', 'upload-error']);

// Reactive state
const fileInput = ref(null);
const videoPlayer = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const error = ref(null);
const validationResult = ref(null);
const videoDuration = ref(0);

// Methods (need to be defined before watchers)
const clearFile = () => {
  selectedFile.value = null;
  validationResult.value = null;
  error.value = null;
  uploadProgress.value = 0;

  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Computed
const videoData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      clearFile();
    }
  },
  { immediate: true }
);

// Methods
const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile.value = file;
  error.value = null;

  // Validate file
  validationResult.value = videoService.validateVideoFile(file);

  if (!validationResult.value.isValid) {
    return;
  }

  // Auto-upload if we have locationId (problemId is optional for location-level uploads)
  if (props.locationId) {
    await uploadVideo();
  }
};

const uploadVideo = async () => {
  if (!selectedFile.value || isUploading.value) return;

  try {
    isUploading.value = true;
    error.value = null;
    uploadProgress.value = 0;

    // Emit upload start event
    emit('upload-start');

    let result;

    if (props.problemId) {
      // Problem-specific upload (existing flow)
      const ascentId = props.ascentId || `temp-${Date.now()}`;
      result = await videoService.uploadBetaVideo(
        props.locationId,
        props.problemId,
        ascentId,
        selectedFile.value,
        (progress) => {
          uploadProgress.value = progress;
        }
      );
    } else {
      // Location-level upload (new flow)
      // For now, we'll create a simple upload without problem association
      // TODO: This will be enhanced with AI problem detection
      result = await videoService.uploadLocationVideo(
        props.locationId,
        selectedFile.value,
        (progress) => {
          uploadProgress.value = progress;
        }
      );
    }

    videoData.value = result;
    selectedFile.value = null;

    emit('upload-complete', result);
  } catch (err) {
    console.error('Error uploading video:', err);
    error.value = err.message || 'Failed to upload video';
    emit('upload-error', err);
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const removeVideo = () => {
  videoData.value = null;
  clearFile();
};

const updateVideoDuration = () => {
  if (videoPlayer.value) {
    videoDuration.value = videoPlayer.value.duration || 0;
  }
};

const formatFileSize = (bytes) => {
  return videoService.formatFileSize(bytes);
};

const formatDuration = (duration) => {
  return videoService.formatDuration(duration);
};

const formatUploadDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

// Expose methods for parent component
defineExpose({
  uploadVideo,
  clearFile,
  removeVideo,
});
</script>

<style scoped>
/* Video upload component styles */
</style>
