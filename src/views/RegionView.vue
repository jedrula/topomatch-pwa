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

      <!-- Video Upload Section -->
      <VideoUploadSection
        @video-uploaded="onVideoUploaded"
      />

      <!-- Region Cache Manager -->
      <RegionCacheManager
        :region-id="regionId"
        :image-paths="allTopoImages"
      />

      <!-- Region Gallery -->
      <RegionGallery
        :key="regionId"
        :images="sortedTopoImages"
        @topo-selected="onTopoSelected"
        @topo-list-loaded="onTopoListLoaded"
        :regionId="regionId"
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
      <VisualizationModal
        ref="visualizationModalRef"
        :modal-mode="modalMode"
        :preview-image="previewImage"
        :can-visualize="canVisualize"
        :is-winner="currentlyVisualizedImage === winnerImage"
        :visualization-data="currentVisualizationData"
        :image-list="sortedTopoImages"
        :current-image-index="currentImageIndex"
        :visualization-availability="visualizationAvailability"
        :is-processing="inferenceStore.isLoading"
        :match-count="currentImageMatchCount"
        :analyzed-images-count="analyzedImagesCount"
        :current-image-position="currentImageAnalysisPosition"
        @close="onDialogClose"
        @toggle-mode="toggleModalMode"
        @navigate="onNavigateImage"
      />

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import AppHeader from "@/components/AppHeader.vue";
import FileUploadSection from "@/components/FileUploadSection.vue";
import VideoUploadSection from "@/components/VideoUploadSection.vue";
import GalleryTile from "@/components/GalleryTile.vue";
import RegionGallery from "@/components/RegionGallery.vue";
import RegionCacheManager from "@/components/RegionCacheManager.vue";
import VisualizationModal from "@/components/VisualizationModal.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useInferenceStore } from "@/stores/inferenceStore";
import { imageCacheService } from "@/services/imageCacheService";

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
const visualizationModalRef = ref(null);
const modalMode = ref(""); // 'visualization' or 'preview'
const previewImage = ref(null);

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

const currentVisualizationData = computed(() => {
  if (!currentlyVisualizedImage.value) return null;
  return inferenceStore.inferenceResults[currentlyVisualizedImage.value] || null;
});

const currentImageIndex = computed(() => {
  if (!currentlyVisualizedImage.value) return 0;
  return sortedTopoImages.value.indexOf(currentlyVisualizedImage.value);
});

const visualizationAvailability = computed(() => {
  const availability = {};
  for (const image of sortedTopoImages.value) {
    availability[image] = !!inferenceStore.inferenceResults[image];
  }
  return availability;
});

const currentImageMatchCount = computed(() => {
  if (!currentlyVisualizedImage.value) return null;
  return inferenceStore.matchCounts[currentlyVisualizedImage.value] ?? null;
});

const analyzedImagesCount = computed(() => {
  return Object.keys(inferenceStore.matchCounts).length;
});

const currentImageAnalysisPosition = computed(() => {
  if (!currentlyVisualizedImage.value || currentImageMatchCount.value === null) return null;

  // Get all analyzed images sorted by match count (descending)
  const analyzedImages = Object.entries(inferenceStore.matchCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([imagePath]) => imagePath);

  const position = analyzedImages.indexOf(currentlyVisualizedImage.value);
  return position >= 0 ? position + 1 : null;
});

function onFileChange(file) {
  if (file) {
    userImageFile.value = file;
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
  // The FileUploadSection component handles its own state reset
  // Clear the file input is now handled by the component
  // Just reset our local state if needed
}

function onVideoUploaded(videoMetadata) {
  // Handle the video upload completion
  console.log("Video uploaded with metadata:", videoMetadata);
  // Here you could update a store, refresh a list of videos, etc.
  // For now, just log the successful upload
}

// Callback for when inference completes - auto-open visualization of best match
// function onInferenceComplete(bestImagePath) {
//   onTileVisualize(bestImagePath);
// }

function toggleModalMode() {
  if (modalMode.value === "preview") {
    modalMode.value = "visualization";
  } else {
    modalMode.value = "preview";
    previewImage.value = currentlyVisualizedImage.value;
  }
}

function onTileVisualize(img) {
  modalMode.value = "visualization";
  currentlyVisualizedImage.value = img;
  if (visualizationModalRef.value) {
    visualizationModalRef.value.showModal();
  }
}

function onTileClick(img) {
  // Show large image preview
  modalMode.value = "preview";
  previewImage.value = img;
  currentlyVisualizedImage.value = img;
  if (visualizationModalRef.value) {
    visualizationModalRef.value.showModal();
  }
}

function onDialogClose() {
  currentlyVisualizedImage.value = null;
  modalMode.value = "";
  previewImage.value = null;
}

function onNavigateImage(navigationData) {
  // Handle both old format (just index) and new format (object with index and mode)
  const newIndex = typeof navigationData === "number" ? navigationData : navigationData.index;
  const suggestedMode = typeof navigationData === "object" ? navigationData.mode : modalMode.value;

  const newImage = sortedTopoImages.value[newIndex];
  if (newImage) {
    currentlyVisualizedImage.value = newImage;

    // Switch mode if suggested and different from current
    if (suggestedMode !== modalMode.value) {
      modalMode.value = suggestedMode;
    }

    // Update preview image for preview mode
    if (modalMode.value === "preview") {
      previewImage.value = newImage;
    }
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
  
  // Trigger cache status refresh for all components
  setTimeout(() => {
    imageCacheService.refreshCacheStatus();
  }, 200);
});

onUnmounted(() => {
  // Reset state when leaving the region
  inferenceStore.resetInferenceState();
});
</script>
