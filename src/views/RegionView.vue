<template>
  <main>
    <p v-if="inferenceStore.errorString" style="color: red">
      Error: {{ inferenceStore.errorString }}
    </p>

    <div v-if="inferenceStore.isLoading" class="spinner">
      <p>{{ inferenceStore.loadingMessage }}</p>
      <div class="spinner-icon"></div>
    </div>

    <div style="margin-top: 2em">
      <label for="user-image">Select image to match:</label>
      <input
        id="user-image"
        type="file"
        accept="image/*"
        @change="onFileChange"
        :disabled="!inferenceStore.sessionReady"
      />
      <p v-if="!inferenceStore.sessionReady" class="session-status">
        Initializing inference session...
      </p>
    </div>

    <RegionGallery
      :key="regionId"
      :images="sortedTopoImages"
      @topo-selected="onTopoSelected"
      @topo-list-loaded="onTopoListLoaded"
      :manifestPath="regionManifestPath"
    >
      <template #default="{ img, selected }">
        <div
          class="region-gallery-content"
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
          <button
            class="visualize-btn"
            v-if="inferenceStore.inferenceResults[img]"
            @click.stop="onTileVisualize(img)"
            :aria-pressed="currentlyVisualizedImage === img"
            title="Visualize matches"
            style="
              position: absolute;
              top: 6px;
              left: 6px;
              background: rgba(255, 255, 255, 0.85);
              border: none;
              border-radius: 50%;
              padding: 2px;
              cursor: pointer;
              z-index: 2;
              transition: background 0.2s;
              box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
            "
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse
                cx="10"
                cy="10"
                rx="8"
                ry="5"
                stroke="#1976d2"
                stroke-width="2"
                fill="none"
              />
              <circle cx="10" cy="10" r="2.5" fill="#1976d2" />
            </svg>
          </button>
          <div class="region-gallery-image-wrapper">
            <img :src="img" alt="region image" />
            <span
              v-if="inferenceStore.currentlyProcessingImage === img"
              class="mini-spinner"
            ></span>
          </div>
          <div class="region-gallery-filename">{{ img.split("/").pop() }}</div>
        </div>
      </template>
    </RegionGallery>

    <dialog
      ref="visualizationDialog"
      class="visualization-modal"
      @close="onDialogClose"
      :open="currentlyVisualizedImage !== null"
    >
      <button class="close-modal-btn" @click="closeVisualizationModal">×</button>
      <canvas ref="visualizationCanvas" class="visualization-canvas"></canvas>
    </dialog>

    <MainFooter />
  </main>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
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

const regionManifestPath = computed(() => {
  const baseUrl = import.meta.env.BASE_URL;
  return `${baseUrl}topos/${regionId}/manifest.json`;
});

function onFileChange(event) {
  const file = event.target.files[0];
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

<style scoped>
/* Add your styles here */
.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
}

.spinner-icon {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.region-gallery-content {
  position: relative;
  overflow: hidden;
}

.region-gallery-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.region-gallery-image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.region-gallery-filename {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  color: white;
  font-size: 0.8em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
}

.mini-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  margin-top: -12px;
  margin-left: -12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.visualization-modal {
  position: fixed;
  top: 0;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  padding: 0;
  margin: 0;
  border: none;
  background: rgba(0, 0, 0, 0.95);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 10000;
}

.visualization-modal:open {
  display: flex;
}

.close-modal-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
}

.visualization-canvas {
  display: block;
  max-width: 90vw;
  max-height: 80vh;
  margin: 2em auto 1em auto;
  background: #222;
  border-radius: 8px;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5);
}

.session-status {
  color: #666;
  font-style: italic;
  margin-top: 0.5em;
  font-size: 0.9em;
}
</style>
