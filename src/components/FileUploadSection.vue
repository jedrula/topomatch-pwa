<template>
  <!-- File Upload Section -->
  <div
    v-if="!hasCompletedInference || showUploadSection"
    class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 transition-all duration-300"
    :class="{
      'p-3': inferenceStore.currentlyProcessingImage || inferenceStore.isLoading,
      'p-4': !inferenceStore.currentlyProcessingImage && !inferenceStore.isLoading,
    }"
  >
    <!-- Processing State -->
    <div
      v-if="inferenceStore.currentlyProcessingImage || inferenceStore.isLoading"
      class="flex items-center justify-center py-2"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"
        ></div>
        <span class="text-sm font-medium text-gray-700">
          {{ inferenceStore.loadingMessage || "Analyzing your photo..." }}
        </span>
      </div>
    </div>

    <!-- Upload State -->
    <div v-else class="flex flex-col items-center text-center space-y-3">
      <!-- Initialization Status -->
      <div v-if="!inferenceStore.sessionReady" class="flex items-center space-x-2 text-amber-600">
        <div
          class="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"
        ></div>
        <span class="text-sm font-medium">Loading detection system...</span>
      </div>

      <!-- Photo Upload -->
      <div v-else class="relative">
        <div class="flex justify-center">
          <div class="relative">
            <input
              id="user-image"
              type="file"
              accept="image/*"
              @change="onFileChange"
              :disabled="!inferenceStore.sessionReady"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button
              :disabled="!inferenceStore.sessionReady"
              class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Try Again Section (shown after inference is complete) -->
  <div
    v-if="hasCompletedInference && !showUploadSection"
    class="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-6"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2 text-sm text-gray-600">
        <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>Analysis complete! Click on images below to see matches.</span>
      </div>
      <button
        @click="resetForNewUpload"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
      >
        Try another photo
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStore';

defineProps({
  hasCompletedInference: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['file-selected', 'reset-upload']);

const inferenceStore = useInferenceStore();
const showUploadSection = ref(false);

function onFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    showUploadSection.value = false; // Hide upload section during processing
    emit('file-selected', file);
  }
}

function resetForNewUpload() {
  showUploadSection.value = true;
  // Clear file input
  const fileInput = document.getElementById('user-image');
  if (fileInput) {
    fileInput.value = '';
  }
  emit('reset-upload');
}
</script>