<template>
  <div class="playground-view">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <h1 class="text-3xl font-bold text-gray-900">Image Matching Playground</h1>
          <p class="mt-2 text-gray-600">
            Experimental space for testing image matching and homography algorithms
          </p>
        </div>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Image Upload Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Image 1 Upload -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Source Image</h2>
          <ImageUploadBox
            v-model="sourceImage"
            :preview-url="sourceImageUrl"
            placeholder="Upload or drag source image"
            @file-selected="onSourceImageSelected"
            @clear="clearSourceImage"
          />
          <div v-if="sourceImageInfo" class="mt-3 text-sm text-gray-600">
            {{ sourceImageInfo.width }}×{{ sourceImageInfo.height }} - {{ sourceImageInfo.size }}
          </div>
        </div>

        <!-- Image 2 Upload -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Target Image</h2>
          <ImageUploadBox
            v-model="targetImage"
            :preview-url="targetImageUrl"
            placeholder="Upload or drag target image"
            @file-selected="onTargetImageSelected"
            @clear="clearTargetImage"
          />
          <div v-if="targetImageInfo" class="mt-3 text-sm text-gray-600">
            {{ targetImageInfo.width }}×{{ targetImageInfo.height }} - {{ targetImageInfo.size }}
          </div>
        </div>
      </div>

      <!-- Analysis Controls -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Image Matching Analysis</h2>
          <button
            @click="runImageMatching"
            :disabled="!canRunAnalysis || isAnalyzing"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <div
              v-if="isAnalyzing"
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
            ></div>
            <span>{{ isAnalyzing ? "Analyzing..." : "Run Matching" }}</span>
          </button>
        </div>

        <!-- Analysis Status -->
        <div v-if="analysisStatus" class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-800">{{ analysisStatus }}</p>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <!-- Results Summary -->
        <div v-if="matchResults" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Matches Found</h3>
            <p class="text-2xl font-bold text-blue-600">{{ matchResults.matchCount }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Processing Time</h3>
            <p class="text-2xl font-bold text-green-600">{{ matchResults.processingTime }}ms</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Match Quality</h3>
            <p class="text-2xl font-bold" :class="getQualityColor(matchResults.matchCount)">
              {{ getQualityLabel(matchResults.matchCount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Visualization Section -->
      <div
        v-if="matchResults && matchResults.matchCount > 0"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Match Visualization</h2>
          <button
            @click="toggleVisualization"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span>{{ showVisualization ? "Hide" : "Show" }} Matches</span>
          </button>
        </div>

        <!-- Match Visualization Canvas -->
        <div v-if="showVisualization" class="flex justify-center">
          <canvas
            ref="visualizationCanvas"
            class="max-w-full border border-gray-300 rounded-lg shadow-lg"
            style="max-height: 70vh"
          ></canvas>
        </div>

        <!-- Homography Controls (Future Feature) -->
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 class="font-medium text-yellow-800 mb-2">🚧 Coming Soon: Homography Analysis</h3>
          <p class="text-sm text-yellow-700">
            This section will include point transformation tools and local homography functions based
            on the detected matches.
          </p>
          <div class="mt-3 flex space-x-2">
            <button
              disabled
              class="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm cursor-not-allowed"
            >
              Calculate Global Homography
            </button>
            <button
              disabled
              class="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm cursor-not-allowed"
            >
              Local Homography Regions
            </button>
            <button
              disabled
              class="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm cursor-not-allowed"
            >
              Point Transform Tool
            </button>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div
        v-if="matchResults && matchResults.matchCount === 0"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
      >
        <svg
          class="w-12 h-12 text-yellow-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 class="text-lg font-medium text-yellow-800 mb-2">No Matches Found</h3>
        <p class="text-yellow-700">
          The images don't appear to have sufficient matching features. Try with images that share
          similar content or perspective.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useInferenceStore } from "@/stores/inferenceStore";
import ImageUploadBox from "@/components/ImageUploadBox.vue";

// Store
const inferenceStore = useInferenceStore();

// Component state
const sourceImage = ref(null);
const targetImage = ref(null);
const sourceImageUrl = ref(null);
const targetImageUrl = ref(null);
const sourceImageInfo = ref(null);
const targetImageInfo = ref(null);

// Analysis state
const isAnalyzing = ref(false);
const analysisStatus = ref("");
const error = ref(null);
const matchResults = ref(null);
const showVisualization = ref(false);

// Canvas reference
const visualizationCanvas = ref(null);

// Computed properties
const canRunAnalysis = computed(() => {
  return sourceImage.value && targetImage.value && inferenceStore.sessionReady;
});

// Helper functions
const getQualityLabel = (matchCount) => {
  if (matchCount >= 100) return "Excellent";
  if (matchCount >= 50) return "Good";
  if (matchCount >= 20) return "Fair";
  if (matchCount > 0) return "Poor";
  return "None";
};

const getQualityColor = (matchCount) => {
  if (matchCount >= 100) return "text-green-600";
  if (matchCount >= 50) return "text-blue-600";
  if (matchCount >= 20) return "text-yellow-600";
  if (matchCount > 0) return "text-red-600";
  return "text-gray-600";
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Image handling methods
const getImageInfo = async (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: formatFileSize(file.size),
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

const onSourceImageSelected = async (file) => {
  sourceImage.value = file;
  if (sourceImageUrl.value) {
    URL.revokeObjectURL(sourceImageUrl.value);
  }
  sourceImageUrl.value = URL.createObjectURL(file);
  sourceImageInfo.value = await getImageInfo(file);
  
  // Clear previous results
  matchResults.value = null;
  showVisualization.value = false;
  error.value = null;
};

const onTargetImageSelected = async (file) => {
  targetImage.value = file;
  if (targetImageUrl.value) {
    URL.revokeObjectURL(targetImageUrl.value);
  }
  targetImageUrl.value = URL.createObjectURL(file);
  targetImageInfo.value = await getImageInfo(file);
  
  // Clear previous results
  matchResults.value = null;
  showVisualization.value = false;
  error.value = null;
};

const clearSourceImage = () => {
  sourceImage.value = null;
  if (sourceImageUrl.value) {
    URL.revokeObjectURL(sourceImageUrl.value);
    sourceImageUrl.value = null;
  }
  sourceImageInfo.value = null;
  matchResults.value = null;
  showVisualization.value = false;
  error.value = null;
};

const clearTargetImage = () => {
  targetImage.value = null;
  if (targetImageUrl.value) {
    URL.revokeObjectURL(targetImageUrl.value);
    targetImageUrl.value = null;
  }
  targetImageInfo.value = null;
  matchResults.value = null;
  showVisualization.value = false;
  error.value = null;
};

// Image matching analysis
const runImageMatching = async () => {
  if (!canRunAnalysis.value) return;

  isAnalyzing.value = true;
  error.value = null;
  analysisStatus.value = "Waiting for inference session...";

  try {
    // Wait for session to be ready if needed
    if (!inferenceStore.sessionReady) {
      const maxWait = 30000; // 30 seconds
      const checkInterval = 100;
      let waited = 0;

      while (!inferenceStore.sessionReady && waited < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (!inferenceStore.sessionReady) {
        throw new Error("Inference session failed to initialize");
      }
    }

    analysisStatus.value = "Preprocessing images...";

    // Prepare image buffers
    const sourceBuffer = await sourceImage.value.arrayBuffer();
    const targetBuffer = await targetImage.value.arrayBuffer();

    analysisStatus.value = "Running image matching...";

    // Run inference using the same worker as the region view
    const result = await new Promise((resolve, reject) => {
      const startTime = performance.now();

      const handler = (event) => {
        const { type, data } = event.data;
        if (type === "inferenceComplete") {
          const endTime = performance.now();
          
          const result = {
            matchCount: data.results.matches?.dims?.[0] ?? 0,
            processingTime: Math.round(endTime - startTime),
            rawData: data.results,
            images: data.images,
            imgWidth: data.imgWidth,
            imgHeight: data.imgHeight,
          };

          inferenceStore.inferenceWorker.removeEventListener("message", handler);
          resolve(result);
        } else if (type === "error") {
          inferenceStore.inferenceWorker.removeEventListener("message", handler);
          reject(new Error(data.message));
        }
      };

      inferenceStore.inferenceWorker.addEventListener("message", handler);
      inferenceStore.inferenceWorker.postMessage(
        {
          type: "runInference",
          userImageBuffer: sourceBuffer,
          topoImageBuffer: targetBuffer,
        },
        [sourceBuffer, targetBuffer]
      );
    });

    matchResults.value = result;
    analysisStatus.value = `Analysis complete! Found ${result.matchCount} matches in ${result.processingTime}ms`;

  } catch (err) {
    console.error("Image matching error:", err);
    error.value = err.message || "Image matching analysis failed";
  } finally {
    isAnalyzing.value = false;
  }
};

// Visualization methods
const toggleVisualization = () => {
  showVisualization.value = !showVisualization.value;
  if (showVisualization.value && matchResults.value) {
    nextTick(() => {
      drawMatchVisualization();
    });
  }
};

const drawMatchVisualization = () => {
  if (!visualizationCanvas.value || !matchResults.value) return;

  const canvas = visualizationCanvas.value;
  const ctx = canvas.getContext("2d");
  const { rawData, images, imgWidth, imgHeight } = matchResults.value;

  // Set canvas size
  canvas.width = imgWidth * 2;
  canvas.height = imgHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw both images side by side
  ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
  ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);

  // Draw match lines (limit to first 20 for clarity)
  const maxMatches = Math.min(20, rawData.matches.dims[0]);
  
  for (let i = 0; i < maxMatches; i++) {
    const matchBaseIndex = i * rawData.matches.dims[1];
    const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
    const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

    // Get keypoint coordinates
    const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
    const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
    const x1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) + imgWidth;
    const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);

    // Draw match line
    ctx.strokeStyle = `hsl(${(i * 360) / maxMatches}, 70%, 50%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Draw keypoints
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.arc(x0, y0, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x1, y1, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
};
</script>
