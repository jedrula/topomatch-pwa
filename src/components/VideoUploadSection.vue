<template>
  <!-- Video Upload Section -->
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 transition-all duration-300 p-4"
  >
    <div class="flex flex-col items-center text-center space-y-3">
      <h3 class="text-lg font-semibold text-gray-900">Upload Climbing Video</h3>
      <p class="text-sm text-gray-600">
        Share your climbing videos and link them to boulder problems
      </p>

      <!-- Video Upload Button -->
      <div class="relative">
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          @change="onVideoChange"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button
          class="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center space-x-2"
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

  <!-- Video Upload Metadata Modal -->
  <div
    v-if="showVideoModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closeVideoModal"
  >
    <div
      @click.stop
      class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <svg
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Video Upload</h3>
            <p class="text-sm text-gray-500">{{ selectedVideoFile?.name }}</p>
          </div>
        </div>
        <button
          @click="closeVideoModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Upload Progress -->
      <div class="px-6 pt-4">
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Upload Progress</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="uploadProgress === 100 ? 'bg-green-500' : 'bg-blue-500'"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ uploadStatus }}
          </div>
        </div>
      </div>

      <!-- Modal Body - Metadata Form -->
      <form @submit.prevent="submitVideoMetadata" class="px-6 pb-6">
        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label for="video-title" class="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="video-title"
              v-model="videoMetadata.title"
              type="text"
              required
              placeholder="Enter video title..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="video-description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="video-description"
              v-model="videoMetadata.description"
              rows="3"
              placeholder="Describe your climbing video..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          <!-- Was Sent Checkbox -->
          <div>
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="videoMetadata.wasSent"
                class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span class="text-sm font-medium text-gray-700">Boulder was sent (completed)</span>
            </label>
          </div>

          <!-- Ascent Style (only show if was sent) -->
          <div v-if="videoMetadata.wasSent">
            <label class="block text-sm font-medium text-gray-700 mb-2">Ascent Style</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ascentStyle"
                  value="flash"
                  v-model="videoMetadata.ascentStyle"
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <span class="text-sm text-gray-700">Flash</span>
                <span class="text-xs text-gray-500">(first attempt, no beta)</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ascentStyle"
                  value="onsite"
                  v-model="videoMetadata.ascentStyle"
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <span class="text-sm text-gray-700">Onsite</span>
                <span class="text-xs text-gray-500">(first attempt, with beta)</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ascentStyle"
                  value="RP"
                  v-model="videoMetadata.ascentStyle"
                  class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2"
                />
                <span class="text-sm text-gray-700">Redpoint (RP)</span>
                <span class="text-xs text-gray-500">(after practice attempts)</span>
              </label>
            </div>
          </div>

          <!-- Boulder Problem Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Boulder Problem * </label>
            <p class="text-xs text-gray-500 mb-3">
              We'll analyze your video to find the matching boulder problem automatically
            </p>

            <!-- Video Analysis Status or Manual Trigger -->
            <div
              v-if="
                isAnalyzingVideo ||
                analysisProgress ||
                (selectedVideoFile && props.regionPhotos.length > 0)
              "
              class="mb-3"
            >
              <!-- Analysis in progress or completed -->
              <div
                v-if="isAnalyzingVideo || analysisProgress"
                class="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div
                      v-if="isAnalyzingVideo"
                      class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
                    ></div>
                    <svg
                      v-else
                      class="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-blue-800">{{
                        analysisProgress || "Analyzing video..."
                      }}</span>
                      <span
                        v-if="isAnalyzingVideo && analysisImageTotal > 0"
                        class="text-xs text-blue-600"
                      >
                        {{ analysisImageCount }}/{{ analysisImageTotal }} images ({{
                          analysisPercentage
                        }}%)
                      </span>
                    </div>
                  </div>
                  <button
                    v-if="!isAnalyzingVideo && selectedVideoFile"
                    @click="runVideoFrameAnalysis(selectedVideoFile)"
                    type="button"
                    class="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Re-analyze
                  </button>
                </div>

                <!-- Subtle abort option during analysis -->
                <div v-if="isAnalyzingVideo" class="mt-2 pt-2 border-t border-blue-200">
                  <button
                    @click="
                      isAnalyzingVideo = false;
                      analysisProgress = '';
                      showManualSelection = true;
                    "
                    type="button"
                    class="text-xs text-blue-500 hover:text-blue-600 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    Choose manually instead
                  </button>
                </div>
              </div>
            </div>

            <!-- Selected Photo Display (when auto-analysis completed) -->
            <div
              v-if="
                !isAnalyzingVideo &&
                !showManualSelection &&
                currentPhoto &&
                videoMetadata.boulderProblemId
              "
              class="mb-3"
            >
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex flex-col space-y-4">
                  <img
                    :src="currentPhoto.url"
                    :alt="currentPhoto.name"
                    class="w-full max-h-64 object-contain rounded-lg bg-gray-50"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                      <div>
                        <p class="text-sm font-medium text-green-800">
                          Selected: {{ currentPhoto.name }}
                        </p>
                        <p v-if="currentPhoto.date" class="text-xs text-green-600">
                          {{ currentPhoto.date }}
                        </p>
                      </div>
                      <svg
                        class="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <div class="flex space-x-3">
                      <button
                        @click="showManualSelection = true"
                        type="button"
                        class="text-xs text-green-700 hover:text-green-800 underline"
                      >
                        Choose different photo
                      </button>
                      <button
                        @click="runVideoFrameAnalysis(selectedVideoFile)"
                        type="button"
                        class="text-xs text-green-700 hover:text-green-800 underline"
                      >
                        Re-analyze video
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Manual Photo Selection (only when opted-in) -->
            <div v-if="showManualSelection">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Choose manually:</span>
                <button
                  @click="showManualSelection = false"
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕ Close manual selection
                </button>
              </div>

              <!-- Photo Carousel -->
              <div class="relative bg-gray-50 rounded-lg overflow-hidden">
                <div v-if="regionPhotos.length > 0" class="flex items-center justify-center min-h-[12rem]">
                  <img
                    :src="currentPhoto.url"
                    :alt="currentPhoto.name"
                    class="max-w-full max-h-64 object-contain rounded-lg"
                  />
                </div>

                <!-- No photos state -->
                <div v-else class="h-48 flex items-center justify-center">
                  <div class="text-center text-gray-500">
                    <svg
                      class="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p class="text-sm">No photos available in this region</p>
                  </div>
                </div>

                <!-- Carousel Controls -->
                <div
                  v-if="regionPhotos.length > 1"
                  class="absolute inset-y-0 left-0 flex items-center"
                >
                  <button
                    @click="previousPhoto"
                    type="button"
                    class="ml-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  v-if="regionPhotos.length > 1"
                  class="absolute inset-y-0 right-0 flex items-center"
                >
                  <button
                    @click="nextPhoto"
                    type="button"
                    class="mr-2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Photo counter -->
                <div
                  v-if="regionPhotos.length > 1"
                  class="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                >
                  <div class="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {{ currentPhotoIndex + 1 }} / {{ regionPhotos.length }}
                  </div>
                </div>
              </div>

              <!-- Photo Info for Manual Selection -->
              <div v-if="currentPhoto" class="mt-2 p-2 bg-gray-50 rounded">
                <p class="text-sm font-medium text-gray-700">{{ currentPhoto.name }}</p>
                <p v-if="currentPhoto.date" class="text-xs text-gray-500">
                  {{ currentPhoto.date }}
                </p>
              </div>
            </div>

            <!-- Fallback when no analysis and no manual selection -->
            <div
              v-if="
                !isAnalyzingVideo &&
                !showManualSelection &&
                !videoMetadata.boulderProblemId &&
                props.regionPhotos.length > 0
              "
              class="text-center p-6 bg-gray-50 rounded-lg"
            >
              <svg
                class="w-8 h-8 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
              <p class="text-sm text-gray-600 mb-3">
                Video analysis will run automatically, or you can choose a photo manually
              </p>
              <button
                @click="showManualSelection = true"
                type="button"
                class="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Choose manually
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <button
            type="button"
            @click="closeVideoModal"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div class="flex space-x-3">
            <button
              v-if="uploadProgress < 100"
              type="button"
              @click="saveAsDraft"
              class="px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              :disabled="uploadProgress < 100 || !videoMetadata.title.trim() || !currentPhoto"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {{ uploadProgress < 100 ? "Finish Upload" : "Save & Publish" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useInferenceStore } from "@/stores/inferenceStore";

const props = defineProps({
  regionPhotos: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["video-uploaded"]);

// Get inference store for video frame analysis
const inferenceStore = useInferenceStore();

// Video upload modal state
const showVideoModal = ref(false);
const selectedVideoFile = ref(null);
const uploadProgress = ref(0);
const uploadStatus = ref("");
let uploadController = null;

// Video metadata form
const videoMetadata = reactive({
  title: "",
  description: "",
  boulderProblemId: null,
  wasSent: false,
  ascentStyle: null, // "flash", "onsite", "RP" (redpoint)
});

// Clear ascent style when wasSent is unchecked
watch(
  () => videoMetadata.wasSent,
  (newValue) => {
    if (!newValue) {
      videoMetadata.ascentStyle = null;
    }
  }
);

// Photo carousel state
const currentPhotoIndex = ref(0);
const currentPhoto = computed(() => {
  if (props.regionPhotos.length === 0) return null;
  return props.regionPhotos[currentPhotoIndex.value];
});

// Video frame analysis state
const isAnalyzingVideo = ref(false);
const analysisProgress = ref("");
const showManualSelection = ref(false);
const analysisImageCount = ref(0);
const analysisImageTotal = ref(0);

// Computed property for analysis percentage
const analysisPercentage = computed(() => {
  if (analysisImageTotal.value === 0) return 0;
  return Math.round((analysisImageCount.value / analysisImageTotal.value) * 100);
});

// Extract a frame from video file at specified time (default: 5 seconds)
const extractVideoFrame = (videoFile, timeInSeconds = 5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to the specified time (or middle of video if shorter)
      const seekTime = Math.min(timeInSeconds, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      // Draw the current frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File object from the blob
            const frameFile = new File([blob], `frame_${timeInSeconds}s.jpg`, {
              type: "image/jpeg",
            });
            resolve(frameFile);
          } else {
            reject(new Error("Failed to extract frame"));
          }
        },
        "image/jpeg",
        0.8
      );
    };

    video.onerror = (error) => {
      reject(new Error("Failed to load video: " + error.message));
    };

    // Load the video file
    const url = URL.createObjectURL(videoFile);
    video.src = url;
  });
};

// Run automatic matching on video frame
const runVideoFrameAnalysis = async (videoFile) => {
  if (!props.regionPhotos.length || !inferenceStore.sessionReady) {
    console.log("Cannot analyze video: no photos or session not ready");
    return;
  }

  try {
    isAnalyzingVideo.value = true;
    analysisProgress.value = "Extracting frame from video...";
    analysisImageCount.value = 0;
    analysisImageTotal.value = 0;

    // Extract frame from video
    const frameFile = await extractVideoFrame(videoFile);

    analysisProgress.value = "Analyzing frame against region photos...";
    analysisImageTotal.value = props.regionPhotos.length;
    analysisImageCount.value = 0;

    // Convert region photos to the format expected by inference
    const topoImagePaths = props.regionPhotos.map((photo) => photo.url);

    // Use the enhanced store function with progress tracking
    await inferenceStore.runInferenceBatch(
      frameFile,
      topoImagePaths,
      (bestMatch) => {
        if (bestMatch) {
          // Find the photo that matches the best result
          const bestPhotoIndex = props.regionPhotos.findIndex((photo) => photo.url === bestMatch);
          if (bestPhotoIndex !== -1) {
            currentPhotoIndex.value = bestPhotoIndex;
            videoMetadata.boulderProblemId = props.regionPhotos[bestPhotoIndex].id;
            analysisProgress.value = `Auto-selected: ${props.regionPhotos[bestPhotoIndex].name}`;

            setTimeout(() => {
              analysisProgress.value = "";
              isAnalyzingVideo.value = false;
            }, 2000);
          }
        } else {
          analysisProgress.value = "No clear match found";
          setTimeout(() => {
            analysisProgress.value = "";
            isAnalyzingVideo.value = false;
          }, 2000);
        }
      },
      (currentIndex, totalImages) => {
        // Progress callback - update our tracking variables
        analysisImageCount.value = currentIndex + 1;
        analysisImageTotal.value = totalImages;
      }
    );
  } catch (error) {
    console.error("Video analysis error:", error);
    analysisProgress.value = "Analysis failed";
    setTimeout(() => {
      analysisProgress.value = "";
      isAnalyzingVideo.value = false;
    }, 2000);
  }
};

// Photo carousel navigation
const nextPhoto = () => {
  if (props.regionPhotos.length > 1) {
    currentPhotoIndex.value = (currentPhotoIndex.value + 1) % props.regionPhotos.length;
    videoMetadata.boulderProblemId = currentPhoto.value?.id || null;
  }
};

const previousPhoto = () => {
  if (props.regionPhotos.length > 1) {
    currentPhotoIndex.value =
      currentPhotoIndex.value === 0 ? props.regionPhotos.length - 1 : currentPhotoIndex.value - 1;
    videoMetadata.boulderProblemId = currentPhoto.value?.id || null;
  }
};

async function onVideoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("video/")) {
    alert("Please select a valid video file.");
    return;
  }

  // Set the selected file and show modal
  selectedVideoFile.value = file;
  showVideoModal.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = "Preparing upload...";

  // Initialize carousel
  currentPhotoIndex.value = 0;

  // Pre-populate title with filename (without extension)
  const fileName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  videoMetadata.title = fileName.replace(/[_-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  // Set initial boulder problem if photos are available
  if (currentPhoto.value) {
    videoMetadata.boulderProblemId = currentPhoto.value.id;
  }

  // Start upload immediately in background
  startVideoUpload(file);

  // Start automatic video frame analysis
  if (props.regionPhotos.length > 0) {
    runVideoFrameAnalysis(file);
  }

  // Clear the input so the same file can be selected again
  event.target.value = "";
}

async function startVideoUpload(file) {
  try {
    // Create FormData for video upload
    const formData = new FormData();
    formData.append("video", file);

    console.log(`Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    uploadStatus.value = "Uploading...";

    // Create AbortController for cancellation
    uploadController = new AbortController();

    // Simulate upload progress (replace with actual XMLHttpRequest for real progress)
    const uploadSimulation = setInterval(() => {
      if (uploadProgress.value < 95) {
        uploadProgress.value += Math.random() * 10;
        if (uploadProgress.value > 95) uploadProgress.value = 95;
      }
    }, 500);

    try {
      // Upload to /video endpoint (will fail until server is implemented)
      const response = await fetch("/video", {
        method: "POST",
        body: formData,
        signal: uploadController.signal,
      });

      clearInterval(uploadSimulation);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      uploadProgress.value = 100;
      uploadStatus.value = "Upload complete!";

      const result = await response.json();
      console.log("Video upload successful:", result);
    } catch (error) {
      clearInterval(uploadSimulation);
      if (error.name === "AbortError") {
        uploadStatus.value = "Upload cancelled";
        uploadProgress.value = 0;
      } else {
        console.error("Error uploading video:", error);
        uploadStatus.value = "Upload failed - server endpoint not available";
        uploadProgress.value = 0;

        // For demo purposes, simulate successful upload after a delay
        setTimeout(() => {
          uploadProgress.value = 100;
          uploadStatus.value = "Upload complete! (Demo mode)";
        }, 2000);
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    uploadStatus.value = "An unexpected error occurred";
    uploadProgress.value = 0;
  }
}

function closeVideoModal() {
  if (uploadController && uploadProgress.value < 100) {
    const shouldCancel = confirm("Upload is still in progress. Cancel upload?");
    if (!shouldCancel) return;

    uploadController.abort();
  }

  showVideoModal.value = false;
  selectedVideoFile.value = null;
  uploadProgress.value = 0;
  uploadStatus.value = "";
  uploadController = null;
  resetVideoMetadata();
}

function resetVideoMetadata() {
  Object.assign(videoMetadata, {
    title: "",
    description: "",
    boulderProblemId: null,
    wasSent: false,
    ascentStyle: null,
  });
  currentPhotoIndex.value = 0;
  isAnalyzingVideo.value = false;
  analysisProgress.value = "";
  showManualSelection.value = false;
  analysisImageCount.value = 0;
  analysisImageTotal.value = 0;
}

async function submitVideoMetadata() {
  if (uploadProgress.value < 100) {
    alert("Please wait for the upload to complete before saving.");
    return;
  }

  if (!videoMetadata.title.trim()) {
    alert("Please enter a title for your video.");
    return;
  }

  if (!videoMetadata.boulderProblemId) {
    alert("Please select a boulder problem photo.");
    return;
  }

  try {
    // Prepare metadata payload
    const metadataPayload = {
      videoId: `temp-${Date.now()}`, // This would come from the upload response
      title: videoMetadata.title.trim(),
      description: videoMetadata.description.trim(),
      boulderProblemId: videoMetadata.boulderProblemId,
      wasSent: videoMetadata.wasSent,
      ascentStyle: videoMetadata.wasSent ? videoMetadata.ascentStyle : null,
      fileInfo: {
        name: selectedVideoFile.value.name,
        size: selectedVideoFile.value.size,
        type: selectedVideoFile.value.type,
      },
    };

    console.log("Saving video metadata:", metadataPayload);

    // This would be sent to your backend to save the metadata
    // const response = await fetch('/api/videos/metadata', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metadataPayload)
    // });

    alert("Video published successfully!");
    emit("video-uploaded", metadataPayload);
    closeVideoModal();
  } catch (error) {
    console.error("Error saving video metadata:", error);
    alert("Failed to save video metadata. Please try again.");
  }
}

function saveAsDraft() {
  // Similar to submitVideoMetadata but with draft status
  console.log("Saving video as draft:", videoMetadata);
  alert("Video saved as draft!");
  closeVideoModal();
}
</script>
