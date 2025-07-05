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
      <FileUploadSection
        :has-completed-inference="hasCompletedInference"
        @file-selected="onFileChange"
        @reset-upload="resetForNewUpload"
      />

      <!-- Region Gallery -->
      <RegionGallery
        :key="regionId"
        :images="sortedTopoImages"
        @topo-selected="onTopoSelected"
        @topo-list-loaded="onTopoListLoaded"
        :manifestPath="regionManifestPath"
      >
        <template #default="{ img, selected }">
          <GalleryTile
            :img="img"
            :selected="selected"
            :is-currently-visualized="currentlyVisualizedImage === img"
            @visualize="onTileVisualize"
            @click="onTileClick"
          />
        </template>
      </RegionGallery>

      <!-- Visualization Modal -->
      <dialog
        ref="visualizationDialog"
        class="fixed inset-0 w-full h-full max-w-none max-h-none bg-black/95 backdrop-blur-sm hidden flex-col items-center justify-center border-0 p-0 m-0 overflow-hidden z-50 open:flex"
        @close="onDialogClose"
      >
        <!-- Close button -->
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

        <!-- Toggle between Preview/Visualization button -->
        <button
          v-if="canVisualize"
          @click="toggleModalMode"
          class="absolute top-4 left-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-200"
        >
          <svg
            v-if="modalMode === 'preview'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <span class="text-sm">
            {{ modalMode === "preview" ? "Show Matches" : "Show Image" }}
          </span>
        </button>

        <!-- Visualization Canvas (for match visualization) -->
        <canvas
          v-if="modalMode === 'visualization'"
          ref="visualizationCanvas"
          class="max-w-[90vw] max-h-[80vh] bg-gray-800 rounded-lg shadow-2xl border border-gray-600"
        ></canvas>

        <!-- Winner indicator for best match visualization -->
        <div
          v-if="modalMode === 'visualization' && currentlyVisualizedImage === winnerImage"
          class="absolute top-16 left-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg px-3 py-2 text-green-100 text-sm font-medium"
        >
          🏆 Best Match
        </div>

        <!-- Image Preview (for large image view) -->
        <div
          v-if="modalMode === 'preview'"
          class="max-w-[90vw] max-h-[80vh] flex items-center justify-center"
        >
          <img
            :src="previewImage"
            alt="Large image preview"
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </dialog>

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import FileUploadSection from "@/components/FileUploadSection.vue";
import GalleryTile from "@/components/GalleryTile.vue";
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
const modalMode = ref(""); // 'visualization' or 'preview'
const previewImage = ref(null);

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

const winnerImage = computed(() => {
  if (!hasCompletedInference.value) return null;

  // Get the image with the highest match count
  const sortedEntries = Object.entries(inferenceStore.sortedMatchCounts);
  if (sortedEntries.length === 0) return null;

  return sortedEntries[0][0]; // Return the image path of the top match
});

const canVisualize = computed(() => {
  return (
    currentlyVisualizedImage.value &&
    inferenceStore.inferenceResults[currentlyVisualizedImage.value]
  );
});

function onFileChange(file) {
  if (file) {
    userImageFile.value = file;
    // Automatically run inference when image is selected
    if (topoImages.value.length > 0 && inferenceStore.sessionReady) {
      inferenceStore.runInferenceBatch(file, topoImages.value, onInferenceComplete);
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
    inferenceStore.runInferenceBatch(userImageFile.value, topoImages.value, onInferenceComplete);
  }
}

function onTopoSelected(selectedImages) {
  topoImages.value = selectedImages;
}

function resetForNewUpload() {
  // The FileUploadSection component handles its own state reset
  // Clear the file input is now handled by the component
  // Just reset our local state if needed
}

// Callback for when inference completes - auto-open visualization of best match
function onInferenceComplete(bestImagePath) {
  onTileVisualize(bestImagePath);
}

function toggleModalMode() {
  if (modalMode.value === "preview") {
    modalMode.value = "visualization";
    // Draw the visualization when switching to it
    const result = inferenceStore.inferenceResults[currentlyVisualizedImage.value];
    if (result) {
      setTimeout(() => {
        drawVisualization(result.rawData, result.images, result.imgWidth, result.imgHeight);
      }, 0);
    }
  } else {
    modalMode.value = "preview";
    previewImage.value = currentlyVisualizedImage.value;
  }
}

function onTileVisualize(img) {
  modalMode.value = "visualization";
  currentlyVisualizedImage.value = img;
  const result = inferenceStore.inferenceResults[img];
  if (result) {
    // Open the dialog first
    if (visualizationDialog.value) {
      visualizationDialog.value.showModal();
    }
    // Use nextTick equivalent with setTimeout
    setTimeout(() => {
      drawVisualization(result.rawData, result.images, result.imgWidth, result.imgHeight);
    }, 0);
  }
}

function onTileClick(img) {
  // Show large image preview
  modalMode.value = "preview";
  previewImage.value = img;
  currentlyVisualizedImage.value = img;
  if (visualizationDialog.value) {
    visualizationDialog.value.showModal();
  }
}

function closeVisualizationModal() {
  if (visualizationDialog.value) {
    visualizationDialog.value.close();
  }
}

function onDialogClose() {
  currentlyVisualizedImage.value = null;
  modalMode.value = "";
  previewImage.value = null;
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
