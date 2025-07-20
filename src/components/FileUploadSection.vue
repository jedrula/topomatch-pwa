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
        <span class="text-sm font-medium">Initializing AI model...</span>
      </div>

      <!-- File Input Buttons -->
      <div v-else class="relative">
        <!-- Photo Upload -->
        <div class="flex flex-col sm:flex-row gap-3 items-center">
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

          <!-- Video Upload -->
          <div class="relative">
            <input
              id="user-video"
              type="file"
              accept="video/*"
              @change="onVideoChange"
              :disabled="!inferenceStore.sessionReady"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button
              :disabled="!inferenceStore.sessionReady"
              class="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Upload Video</span>
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
import { ref } from "vue";
import { useInferenceStore } from "@/stores/inferenceStore";

defineProps({
  hasCompletedInference: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["file-selected", "reset-upload"]);

const inferenceStore = useInferenceStore();
const showUploadSection = ref(false);

function onFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    showUploadSection.value = false; // Hide upload section during processing
    emit("file-selected", file);
  }
}

async function onVideoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("video/")) {
    alert("Please select a valid video file.");
    return;
  }

  try {
    // Create FormData for video upload
    const formData = new FormData();
    formData.append("video", file);

    console.log(`Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to /video endpoint (will fail until server is implemented)
    const response = await fetch("/video", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Video upload successful:", result);

    // Handle the response based on server implementation
    // This could include video processing results, thumbnails, etc.
    alert("Video uploaded successfully!");
  } catch (error) {
    console.error("Error uploading video:", error);
    alert("Failed to upload video. Server endpoint not available yet.");
  }

  // Clear the input so the same file can be selected again
  event.target.value = "";
}

function resetForNewUpload() {
  showUploadSection.value = true;
  // Clear both file inputs
  const fileInput = document.getElementById("user-image");
  if (fileInput) {
    fileInput.value = "";
  }
  const videoInput = document.getElementById("user-video");
  if (videoInput) {
    videoInput.value = "";
  }
  emit("reset-upload");
}
</script>
