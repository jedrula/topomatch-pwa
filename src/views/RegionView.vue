<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
      <!-- Error Message -->
      <div
        v-if="inferenceStore.errorString"
        class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
      >
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-red-700 font-medium">{{ inferenceStore.errorString }}</p>
        </div>
      </div>

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
          <div
            v-if="!inferenceStore.sessionReady"
            class="flex items-center space-x-2 text-amber-600"
          >
            <div
              class="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"
            ></div>
            <span class="text-sm font-medium">Initializing AI model...</span>
          </div>

          <!-- File Input Button -->
          <div v-else class="relative">
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

      <!-- Try Again Section (shown after inference is complete) -->
      <div
        v-if="hasCompletedInference && !showUploadSection"
        class="bg-gray-50 rounded-lg border border-gray-200 p-3 mb-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 text-sm text-gray-600">
            <svg
              class="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

      <!-- Region Gallery -->
      <RegionGallery
        :key="regionId"
        :images="sortedTopoImages"
        @topo-selected="onTopoSelected"
        @topo-list-loaded="onTopoListLoaded"
        :manifestPath="regionManifestPath"
      >
        <template #default="{ img, selected }">
          <div
            class="relative overflow-hidden group"
            :style="getTileStyle(img, selected)"
            v-tooltip="{
              content: tooltipContent(img),
              html: true,
              placement: 'top',
              delay: { show: 100, hide: 100 },
              theme: 'tooltip',
              autoHide: true,
            }"
          >
            <!-- Visualize Button -->
            <button
              v-if="inferenceStore.inferenceResults[img]"
              @click.stop="onTileVisualize(img)"
              :aria-pressed="currentlyVisualizedImage === img"
              title="Visualize matches"
              class="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
            >
              <svg
                class="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>

            <!-- Image Container -->
            <div class="w-full h-full flex items-center justify-center relative">
              <img :src="img" alt="region image" class="max-w-full max-h-full object-cover" />

              <!-- Processing Spinner -->
              <div
                v-if="inferenceStore.currentlyProcessingImage === img"
                class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
              >
                <div
                  class="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"
                ></div>
              </div>
            </div>

            <!-- Filename -->
            <div
              class="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-sm rounded px-2 py-1"
            >
              <p class="text-white text-xs font-medium truncate">{{ img.split("/").pop() }}</p>
            </div>
          </div>
        </template>
      </RegionGallery>

      <!-- Visualization Modal -->
      <dialog
        ref="visualizationDialog"
        class="fixed inset-0 w-full h-full max-w-none max-h-none bg-black/95 backdrop-blur-sm hidden flex-col items-center justify-center border-0 p-0 m-0 overflow-hidden z-50 open:flex"
        @close="onDialogClose"
      >
        <button
          @click="closeVisualizationModal"
          class="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
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
        <canvas
          ref="visualizationCanvas"
          class="max-w-[90vw] max-h-[80vh] bg-gray-800 rounded-lg shadow-2xl border border-gray-600"
        ></canvas>
      </dialog>

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import RegionGallery from "@/components/RegionGallery.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useInferenceStore } from "@/stores/inferenceStore";

const props = defineProps({
  regionId: String,
});

const route = useRoute();
const regionId = props.regionId || route.params.regionId;
const inferenceStore = useInferenceStore();

const userImageFile = ref(null);
const topoImages = ref([]); // array of selected topo images
const allTopoImages = ref([]); // all available topo images
const currentlyVisualizedImage = ref(null);
const visualizationDialog = ref(null);
const visualizationCanvas = ref(null);
const showUploadSection = ref(false);

const regionManifestPath = computed(() => {
  const baseUrl = import.meta.env.BASE_URL;
  return `${baseUrl}topos/${regionId}/manifest.json`;
});

const hasCompletedInference = computed(() => {
  return (
    userImageFile.value &&
    Object.keys(inferenceStore.inferenceResults).length > 0 &&
    !inferenceStore.currentlyProcessingImage &&
    !inferenceStore.isLoading
  );
});

function onFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    userImageFile.value = file;
    showUploadSection.value = false; // Hide upload section during processing
    // Automatically run inference when image is selected
    if (topoImages.value.length > 0 && inferenceStore.sessionReady) {
      inferenceStore.runInferenceBatch(file, topoImages.value);
    } else if (topoImages.value.length === 0) {
      inferenceStore.errorString = "Please wait for topo images to load.";
    } else {
      inferenceStore.errorString = "Inference session is not ready yet.";
    }
  }
}

// Called by RegionGallery when it loads all images
function onTopoListLoaded(images) {
  allTopoImages.value = images;
  topoImages.value = [...images]; // select all by default

  // If user has already selected an image, run inference now
  if (userImageFile.value && inferenceStore.sessionReady) {
    inferenceStore.runInferenceBatch(userImageFile.value, topoImages.value);
  }
}

function onTopoSelected(selectedImages) {
  topoImages.value = selectedImages;
}

function resetForNewUpload() {
  showUploadSection.value = true;
  // Clear the file input
  const fileInput = document.getElementById("user-image");
  if (fileInput) {
    fileInput.value = "";
  }
}

// Helper to get border color based on number of matches
function getMatchBorderColor(matches) {
  if (typeof matches !== "number") return "#1976d2"; // default blue
  // Assume 0-100 is the range, interpolate from red to green
  const min = 0,
    max = 100;
  const clamped = Math.max(min, Math.min(max, matches));
  // Use color-mix if supported, else fallback
  // 0 = red, 100 = green
  const percent = (clamped - min) / (max - min);
  // Use HSL: 0deg (red) to 120deg (green)
  const hue = 0 + percent * 120;
  return `hsl(${hue}, 70%, 45%)`;
}

function onTileVisualize(img) {
  currentlyVisualizedImage.value = img;
  const result = inferenceStore.inferenceResults[img];
  if (result) {
    // Open the dialog first
    if (visualizationDialog.value) {
      visualizationDialog.value.showModal();
    }
    nextTick(() => {
      drawVisualization(result.rawData, result.images, result.imgWidth, result.imgHeight);
    });
  }
}

function closeVisualizationModal() {
  if (visualizationDialog.value) {
    visualizationDialog.value.close();
  }
}

function onDialogClose() {
  currentlyVisualizedImage.value = null;
}

function drawVisualization(rawData, images, imgWidth, imgHeight) {
  const canvas = visualizationCanvas.value;
  if (!canvas) return;
  canvas.width = imgWidth * 2;
  canvas.height = imgHeight;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
  ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);
  for (let i = 0; i < Math.min(20, rawData.matches.dims[0]); i++) {
    const matchBaseIndex = i * rawData.matches.dims[1];
    const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
    const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);
    const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
    const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
    const x1 =
      Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) + imgWidth;
    const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

function getTileStyle(img, selected) {
  const matches =
    inferenceStore.matchCounts && inferenceStore.matchCounts[img] !== undefined
      ? inferenceStore.matchCounts[img]
      : undefined;
  let border;
  if (matches !== undefined) {
    border = "2px solid " + getMatchBorderColor(matches);
  } else if (selected) {
    border = "1px solid #1976d2";
  } else {
    border = "1px solid transparent";
  }
  return { border };
}

function tooltipContent(img) {
  let content = "";
  if (inferenceStore.inferenceTimes && inferenceStore.inferenceTimes[img] !== undefined) {
    content += `<div class='inference-time'>Inference: ${inferenceStore.inferenceTimes[img].toFixed(
      2
    )} ms</div>`;
  }
  if (inferenceStore.matchCounts && inferenceStore.matchCounts[img] !== undefined) {
    content += `<div class='match-count'>Number of Matches: ${inferenceStore.matchCounts[img]}</div>`;
  }
  return content || "<em>No data</em>";
}

const sortedTopoImages = computed(() => {
  if (topoImages.value.length === 0) return [];

  // Get the sorted order from the store's sortedMatchCounts
  const sortedImagePaths = Object.keys(inferenceStore.sortedMatchCounts);

  // Return topoImages sorted by the order from sortedMatchCounts
  // Images with match counts come first, then remaining images
  const imagesWithoutMatches = topoImages.value.filter((img) => !sortedImagePaths.includes(img));

  return [
    ...sortedImagePaths.filter((img) => topoImages.value.includes(img)), // sorted by match count
    ...imagesWithoutMatches, // remaining images at the end
  ];
});

onMounted(() => {
  // Session is created eagerly when the store is initialized
  // No need to create session here anymore
  console.log("RegionView mounted, session ready:", inferenceStore.sessionReady);
});

onUnmounted(() => {
  // Reset state when leaving the region
  inferenceStore.resetInferenceState();
});
</script>
