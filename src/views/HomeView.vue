<template>
  <main>
    <div style="margin-bottom: 2em">
      <RegionPicker v-model="selectedRegionId" @regionChange="onRegionChange" />
    </div>

    <template v-if="selectedRegionId">
      <p v-if="sessionTime">Session Time: {{ sessionTime }}</p>
      <p>WebAssembly Threads Supported: {{ wasmThreadsSupported }}</p>
      <p>WebAssembly SIMD Supported: {{ wasmSimdSupported }}</p>
      <p>Browser Info: {{ browserInfo }}</p>
      <p v-if="errorString" style="color: red">Error: {{ errorString }}</p>

      <div v-if="isLoading" class="spinner">
        <p>{{ loadingMessage }}</p>
        <div class="spinner-icon"></div>
      </div>

      <div style="margin-top: 2em">
        <label for="user-image">Select image to match:</label>
        <input id="user-image" type="file" accept="image/*" @change="onFileChange" />
        <button @click="onRunInferenceClick" :disabled="!userImageFile || topoImages.length === 0">
          Run Inference
        </button>
      </div>

      <p v-if="matchCount !== null">Number of Matches: {{ matchCount }}</p>

      <RegionGallery
        :key="selectedRegionId"
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
            style="cursor: pointer; position: relative"
          >
            <button
              class="visualize-btn"
              v-if="inferenceResults[img]"
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
              <span v-if="currentlyProcessingImage === img" class="mini-spinner"></span>
            </div>
            <div class="region-gallery-filename">{{ img.split("/").pop() }}</div>
          </div>
        </template>
      </RegionGallery>
    </template>

    <dialog
      ref="visualizationDialog"
      class="visualization-modal"
      @close="onDialogClose"
      :open="currentlyVisualizedImage !== null"
    >
      <button class="close-modal-btn" @click="closeVisualizationModal">×</button>
      <canvas ref="visualizationCanvas" class="visualization-canvas"></canvas>
    </dialog>
  </main>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import * as wasmFeatureDetect from "wasm-feature-detect";
import Bowser from "bowser";
import RegionGallery from "@/components/RegionGallery.vue";
import RegionPicker from "@/components/RegionPicker.vue";

const inferenceTimes = ref({}); // { [imgPath]: timeInMs }
const matchCounts = ref({}); // { [imgPath]: matchCount }
const sessionTime = ref(null);
const errorString = ref(null);
const wasmThreadsSupported = ref(null);
const wasmSimdSupported = ref(null);
const browserInfo = ref(null);
const isLoading = ref(false);
const loadingMessage = ref("");
const userImageFile = ref(null);
const topoImages = ref([]); // array of selected topo images
const allTopoImages = ref([]); // all available topo images
const matchCount = ref(null);
const currentlyProcessingImage = ref(null);
const currentlyVisualizedImage = ref(null);
const inferenceResults = ref({}); // { [imgPath]: { rawData, images, imgWidth, imgHeight } }
const inferenceWorker = new Worker(new URL("/inferenceWorker.combined.js", import.meta.url), {
  type: "module",
});
const visualizationDialog = ref(null);
const visualizationCanvas = ref(null);
const workerMemoryInfo = ref("");

inferenceWorker.onmessage = (event) => {
  const { type, data } = event.data;
  if (type === "inferenceComplete") {
    console.log("Inference results:", data.results);
    matchCount.value = data.results.matches?.dims?.[0] ?? null;
    // visualizeMatches(data.results, data.images, data.imgWidth, data.imgHeight);
  } else if (type === "sessionCreated") {
    sessionTime.value = `${data.sessionTime.toFixed(2)} ms`;
    isLoading.value = false;
    console.log("Session created in:", sessionTime.value);
  } else if (type === "workerMemoryInfo") {
    workerMemoryInfo.value = data && data.memory ? data.memory : "";
  }
};

function checkBrowser() {
  const browser = Bowser.getParser(window.navigator.userAgent);
  browserInfo.value = {
    name: browser.getBrowserName(),
    version: browser.getBrowserVersion(),
    os: browser.getOSName(),
    osVersion: browser.getOSVersion(),
  };
}

async function checkWasmFeatures() {
  wasmThreadsSupported.value = await wasmFeatureDetect.threads();
  wasmSimdSupported.value = await wasmFeatureDetect.simd();
}

async function createSession() {
  isLoading.value = true;
  loadingMessage.value = "Creating session...";
  inferenceWorker.postMessage({ type: "createSession" });
}

function onFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    userImageFile.value = file;
  }
}

function onTopoSelected(images) {
  topoImages.value = images;
}

// Called by RegionGallery when it loads all images
function onTopoListLoaded(images) {
  allTopoImages.value = images;
  topoImages.value = [...images]; // select all by default
}

function onRunInferenceClick() {
  if (userImageFile.value && topoImages.value.length > 0) {
    runInferenceBatch(userImageFile.value, topoImages.value);
  } else {
    errorString.value = "Please select an image to match and at least one topo image.";
  }
}

async function runInferenceBatch(userFile, topoImagePaths) {
  isLoading.value = true;
  loadingMessage.value = `Inferencing with user image and ${topoImagePaths.length} topo images...`;
  matchCount.value = null;
  let bestResult = null;
  let bestMatches = -Infinity;
  let bestImgPath = null;
  // Read user image buffer once
  const userArrayBuffer = await userFile.arrayBuffer();
  for (let i = 0; i < topoImagePaths.length; i++) {
    const imgPath = topoImagePaths[i];
    currentlyProcessingImage.value = imgPath;
    loadingMessage.value = `Comparing with ${imgPath.split("/").pop()} (${i + 1}/${
      topoImagePaths.length
    })...`;
    const resp = await fetch(imgPath);
    const topoBlob = await resp.blob();
    const topoArrayBuffer = await topoBlob.arrayBuffer();
    // Clone the userArrayBuffer for each transfer to avoid DataCloneError
    const userArrayBufferCopy = userArrayBuffer.slice(0);
    const start = performance.now();
    await new Promise((resolve) => {
      const handler = (event) => {
        const { type, data } = event.data;
        if (type === "inferenceComplete") {
          const elapsed = performance.now() - start;
          inferenceTimes.value[imgPath] = elapsed;
          const matches = data.results.matches?.dims?.[0] ?? null;
          matchCounts.value[imgPath] = matches;
          if (matches !== null && matches > bestMatches) {
            bestMatches = matches;
            bestResult = {
              rawData: data.results,
              images: data.images,
              imgWidth: data.imgWidth,
              imgHeight: data.imgHeight,
            };
            bestImgPath = imgPath;
          }
          matchCount.value = matches;
          inferenceWorker.removeEventListener("message", handler);
          resolve();
        }
      };
      inferenceWorker.addEventListener("message", handler);
      inferenceWorker.postMessage(
        {
          type: "runInference",
          userImageBuffer: userArrayBufferCopy,
          topoImageBuffer: topoArrayBuffer,
        },
        [userArrayBufferCopy, topoArrayBuffer]
      );
    });
  }
  // Only keep the best result for visualization
  inferenceResults.value = {};
  if (bestResult && bestImgPath) {
    inferenceResults.value[bestImgPath] = bestResult;
  }
  currentlyProcessingImage.value = null;
  isLoading.value = false;
  loadingMessage.value = "";
  // Optionally: show summary or best match
  console.log("Best result:", bestResult);
}

onMounted(async () => {
  checkBrowser();
  await checkWasmFeatures();
  await createSession();
});

const selectedRegionId = ref("");
const regionManifestPath = computed(() =>
  selectedRegionId.value ? `/topos/${selectedRegionId.value}/manifest.json` : ""
);

function onRegionChange() {
  // Reset all state on region change
  userImageFile.value = null;
  topoImages.value = [];
  allTopoImages.value = [];
  matchCount.value = null;
  inferenceResults.value = {};
  matchCounts.value = {};
  inferenceTimes.value = {};
  currentlyProcessingImage.value = null;
  currentlyVisualizedImage.value = null;
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
  const result = inferenceResults.value[img];
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
    matchCounts.value && matchCounts.value[img] !== undefined ? matchCounts.value[img] : undefined;
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
  if (inferenceTimes.value && inferenceTimes.value[img] !== undefined) {
    content += `<div class='inference-time'>Inference: ${inferenceTimes.value[img].toFixed(
      2
    )} ms</div>`;
  }
  if (matchCounts.value && matchCounts.value[img] !== undefined) {
    content += `<div class='match-count'>Number of Matches: ${matchCounts.value[img]}</div>`;
  }
  return content || "<em>No data</em>";
}

const sortedTopoImages = computed(() => {
  if (topoImages.value.length === 0) return [];
  return [...topoImages.value].sort((a, b) => {
    const aMatches = matchCounts.value[a] || 0;
    const bMatches = matchCounts.value[b] || 0;
    return bMatches - aMatches; // sort descending
  });
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

  &:open {
    display: flex;
  }
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
</style>
