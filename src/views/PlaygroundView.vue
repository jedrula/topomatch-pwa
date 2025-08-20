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
          <h2 class="text-lg font-semibold text-gray-900">Match Visualization & Homography</h2>
          <div class="flex space-x-2">
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
            <button
              @click="calculateHomography"
              :disabled="!matchResults || homographyCalculating"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center space-x-2"
            >
              <div
                v-if="homographyCalculating"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
              ></div>
              <span>{{ homographyCalculating ? "Calculating..." : "Calculate Homography" }}</span>
            </button>
          </div>
        </div>

        <!-- Homography Results -->
        <div
          v-if="homographyMatrix"
          class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <h3 class="font-medium text-green-800 mb-2">✅ Homography Matrix Calculated</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-green-700 mb-1">
                Inliers: {{ homographyInliers }}/{{ matchResults.matchCount }}
              </p>
              <p class="text-green-700">
                Success Rate: {{ Math.round((homographyInliers / matchResults.matchCount) * 100) }}%
              </p>
            </div>
            <div>
              <p class="text-green-700 mb-1">Click Mode Active</p>
              <p class="text-green-700 text-xs">
                Click on either image to see corresponding points
              </p>
            </div>
          </div>
        </div>

        <!-- Interactive Canvas -->
        <div v-if="showVisualization || homographyMatrix" class="relative">
          <canvas
            ref="interactiveCanvas"
            @click="onCanvasClick"
            :style="{ cursor: homographyMatrix ? 'crosshair' : 'default' }"
            class="max-w-full border border-gray-300 rounded-lg shadow-lg"
          ></canvas>

          <!-- Click instructions -->
          <div
            v-if="homographyMatrix && !clickedPoints.length"
            class="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded"
          >
            Click anywhere on either image to see corresponding points
          </div>

          <!-- Clear points button -->
          <button
            v-if="clickedPoints.length > 0"
            @click="clearClickedPoints"
            class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
          >
            Clear Points ({{ clickedPoints.length }})
          </button>
        </div>

        <!-- Point Transformation Results -->
        <div
          v-if="clickedPoints.length > 0"
          class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h3 class="font-medium text-blue-800 mb-2">Point Transformations</h3>
          <div class="space-y-2 text-sm">
            <div
              v-for="(point, index) in clickedPoints"
              :key="index"
              class="flex justify-between items-center"
            >
              <span class="text-blue-700">
                Point {{ index + 1 }}: ({{ Math.round(point.source.x) }},
                {{ Math.round(point.source.y) }}) → ({{ Math.round(point.transformed.x) }},
                {{ Math.round(point.transformed.y) }})
              </span>
              <span class="text-xs text-blue-600">
                {{ point.sourceImage === 1 ? "Source → Target" : "Target → Source" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Homography Matrix Display -->
        <div v-if="homographyMatrix" class="mt-4">
          <details class="bg-gray-50 border border-gray-200 rounded-lg">
            <summary class="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
              View Homography Matrix (3x3)
            </summary>
            <div class="p-4 border-t border-gray-200">
              <div class="grid grid-cols-3 gap-2 text-sm font-mono bg-white p-3 rounded border">
                <div
                  v-for="(value, index) in homographyMatrix"
                  :key="index"
                  class="text-center p-1"
                >
                  {{ value.toFixed(6) }}
                </div>
              </div>
            </div>
          </details>
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
import { ref, computed, nextTick, onMounted } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStore';
import ImageUploadBox from '@/components/ImageUploadBox.vue';

// OpenCV.js reference
let cv = null;

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
const analysisStatus = ref('');
const error = ref(null);
const matchResults = ref(null);
const showVisualization = ref(false);

// Homography state
const homographyMatrix = ref(null);
const homographyInliers = ref(0);
const homographyCalculating = ref(false);
const clickedPoints = ref([]);

// Canvas references
const interactiveCanvas = ref(null);

// Computed properties
const canRunAnalysis = computed(() => {
  return sourceImage.value && targetImage.value && inferenceStore.sessionReady;
});

// Helper functions
const getQualityLabel = (matchCount) => {
  if (matchCount >= 100) return 'Excellent';
  if (matchCount >= 50) return 'Good';
  if (matchCount >= 20) return 'Fair';
  if (matchCount > 0) return 'Poor';
  return 'None';
};

const getQualityColor = (matchCount) => {
  if (matchCount >= 100) return 'text-green-600';
  if (matchCount >= 50) return 'text-blue-600';
  if (matchCount >= 20) return 'text-yellow-600';
  if (matchCount > 0) return 'text-red-600';
  return 'text-gray-600';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Initialize OpenCV
onMounted(async () => {
  try {
    // Import OpenCV.js - version >=4.11 returns a Promise
    const cvReadyPromise = await import('@techstark/opencv-js');
    cv = await cvReadyPromise.default;

    console.log('✅ OpenCV.js loaded successfully', cv);
    console.log('Available OpenCV methods:', Object.keys(cv).slice(0, 20).join(', '));
  } catch (err) {
    console.error('❌ Failed to load OpenCV.js:', err);
    error.value = 'Failed to load OpenCV.js library';
  }
});

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
  resetResults();
};

const onTargetImageSelected = async (file) => {
  targetImage.value = file;
  if (targetImageUrl.value) {
    URL.revokeObjectURL(targetImageUrl.value);
  }
  targetImageUrl.value = URL.createObjectURL(file);
  targetImageInfo.value = await getImageInfo(file);

  // Clear previous results
  resetResults();
};

const clearSourceImage = () => {
  sourceImage.value = null;
  if (sourceImageUrl.value) {
    URL.revokeObjectURL(sourceImageUrl.value);
    sourceImageUrl.value = null;
  }
  sourceImageInfo.value = null;
  resetResults();
};

const clearTargetImage = () => {
  targetImage.value = null;
  if (targetImageUrl.value) {
    URL.revokeObjectURL(targetImageUrl.value);
    targetImageUrl.value = null;
  }
  targetImageInfo.value = null;
  resetResults();
};

const resetResults = () => {
  matchResults.value = null;
  showVisualization.value = false;
  homographyMatrix.value = null;
  homographyInliers.value = 0;
  clickedPoints.value = [];
  error.value = null;
};

// Image matching analysis
const runImageMatching = async () => {
  if (!canRunAnalysis.value) return;

  isAnalyzing.value = true;
  error.value = null;
  analysisStatus.value = 'Waiting for inference session...';

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
        throw new Error('Inference session failed to initialize');
      }
    }

    analysisStatus.value = 'Preprocessing images...';

    // Prepare image buffers
    const sourceBuffer = await sourceImage.value.arrayBuffer();
    const targetBuffer = await targetImage.value.arrayBuffer();

    analysisStatus.value = 'Running image matching...';

    // Run inference using the same worker as the region view
    const result = await new Promise((resolve, reject) => {
      const startTime = performance.now();

      const handler = (event) => {
        const { type, data } = event.data;
        if (type === 'inferenceComplete') {
          const endTime = performance.now();

          const result = {
            matchCount: data.results.matches?.dims?.[0] ?? 0,
            processingTime: Math.round(endTime - startTime),
            rawData: data.results,
            images: data.images,
            imgWidth: data.imgWidth,
            imgHeight: data.imgHeight,
          };

          inferenceStore.inferenceWorker.removeEventListener('message', handler);
          resolve(result);
        } else if (type === 'error') {
          inferenceStore.inferenceWorker.removeEventListener('message', handler);
          reject(new Error(data.message));
        }
      };

      inferenceStore.inferenceWorker.addEventListener('message', handler);
      inferenceStore.inferenceWorker.postMessage(
        {
          type: 'runInference',
          userImageBuffer: sourceBuffer,
          topoImageBuffer: targetBuffer,
        },
        [sourceBuffer, targetBuffer]
      );
    });

    matchResults.value = result;
    analysisStatus.value = `Analysis complete! Found ${result.matchCount} matches in ${result.processingTime}ms`;
  } catch (err) {
    console.error('Image matching error:', err);
    error.value = err.message || 'Image matching analysis failed';
  } finally {
    isAnalyzing.value = false;
  }
};

// Homography calculation using OpenCV.js
const calculateHomography = async () => {
  if (!cv) {
    error.value = 'OpenCV.js not loaded yet';
    return;
  }

  if (!matchResults.value || matchResults.value.matchCount < 4) {
    error.value = 'Need at least 4 matches to calculate homography';
    return;
  }

  homographyCalculating.value = true;

  try {
    console.log('Starting homography calculation with cv:', typeof cv);
    console.log('cv.Mat available:', typeof cv.Mat);
    console.log('cv.findHomography available:', typeof cv.findHomography);

    const { rawData } = matchResults.value;

    // Extract matching points
    const matches = [];
    const maxMatches = Math.min(rawData.matches.dims[0], 100); // Limit for performance

    for (let i = 0; i < maxMatches; i++) {
      const matchBaseIndex = i * rawData.matches.dims[1];
      const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
      const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

      const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
      const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
      const x1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]);
      const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);

      matches.push({
        point1: { x: x0, y: y0 },
        point2: { x: x1, y: y1 },
      });
    }

    console.log(`Extracted ${matches.length} matches for homography`);

    // Create OpenCV point arrays using the correct API
    const srcMat = new cv.Mat(matches.length, 1, cv.CV_32FC2);
    const dstMat = new cv.Mat(matches.length, 1, cv.CV_32FC2);

    console.log('Created matrices:', srcMat.rows, 'x', srcMat.cols);

    // Fill the matrices with point data
    for (let i = 0; i < matches.length; i++) {
      srcMat.data32F[i * 2] = matches[i].point1.x;
      srcMat.data32F[i * 2 + 1] = matches[i].point1.y;
      dstMat.data32F[i * 2] = matches[i].point2.x;
      dstMat.data32F[i * 2 + 1] = matches[i].point2.y;
    }

    const mask = new cv.Mat();

    console.log('Calling cv.findHomography...');

    // Calculate homography using RANSAC
    const homography = cv.findHomography(srcMat, dstMat, cv.RANSAC, 5.0, mask);

    console.log('Homography calculated:', homography.rows, 'x', homography.cols);

    // Count inliers
    let inlierCount = 0;
    for (let i = 0; i < mask.rows; i++) {
      if (mask.ucharPtr(i, 0)[0] === 1) inlierCount++;
    }

    // Store homography matrix as flat array
    const matrixData = [];
    for (let i = 0; i < 9; i++) {
      matrixData.push(homography.data64F[i]);
    }

    homographyMatrix.value = matrixData;
    homographyInliers.value = inlierCount;

    console.log('✅ Homography calculated:', {
      inliers: inlierCount,
      total: matches.length,
      matrix: matrixData.slice(0, 6).map((v) => v.toFixed(4)),
    });

    // Clean up OpenCV matrices
    srcMat.delete();
    dstMat.delete();
    mask.delete();
    homography.delete();

    // Auto-show visualization
    if (!showVisualization.value) {
      showVisualization.value = true;
      await nextTick();
    }
    drawInteractiveCanvas();
  } catch (err) {
    console.error('Homography calculation error:', err);
    error.value = 'Failed to calculate homography: ' + err.message;
  } finally {
    homographyCalculating.value = false;
  }
};

// Point transformation using homography
const transformPoint = (x, y, inverse = false) => {
  if (!cv || !homographyMatrix.value) {
    console.log('Transform point failed: cv or homography not available');
    return null;
  }

  try {
    // Create homography matrix from stored data
    const H = new cv.Mat(3, 3, cv.CV_64F);
    for (let i = 0; i < 9; i++) {
      H.data64F[i] = homographyMatrix.value[i];
    }

    // Invert if needed
    const transformMatrix = inverse ? H.inv() : H;

    // Create point matrix
    const pointMat = new cv.Mat(1, 1, cv.CV_64FC2);
    pointMat.data64F[0] = x;
    pointMat.data64F[1] = y;

    const resultMat = new cv.Mat();

    // Apply perspective transform
    cv.perspectiveTransform(pointMat, resultMat, transformMatrix);

    const result = {
      x: resultMat.data64F[0],
      y: resultMat.data64F[1],
    };

    // Clean up
    H.delete();
    if (inverse) transformMatrix.delete();
    pointMat.delete();
    resultMat.delete();

    return result;
  } catch (err) {
    console.error('Point transformation error:', err);
    return null;
  }
};

// Canvas interaction
const onCanvasClick = (event) => {
  if (!homographyMatrix.value || !interactiveCanvas.value) return;

  const canvas = interactiveCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // Determine which image was clicked
  const { imgWidth } = matchResults.value;
  const sourceImage = x < imgWidth;

  // Calculate relative coordinates
  const relativeX = sourceImage ? x : x - imgWidth;
  const relativeY = y;

  // Transform point to other image
  const transformed = transformPoint(relativeX, relativeY, !sourceImage);

  if (transformed) {
    clickedPoints.value.push({
      source: { x: relativeX, y: relativeY },
      transformed: transformed,
      sourceImage: sourceImage ? 1 : 2,
      canvasX: x,
      canvasY: y,
    });

    // Redraw canvas to show new points
    drawInteractiveCanvas();
  }
};

const clearClickedPoints = () => {
  clickedPoints.value = [];
  drawInteractiveCanvas();
};

// Visualization methods
const toggleVisualization = () => {
  showVisualization.value = !showVisualization.value;
  if (showVisualization.value && matchResults.value) {
    nextTick(() => {
      drawInteractiveCanvas();
    });
  }
};

const drawInteractiveCanvas = () => {
  if (!interactiveCanvas.value || !matchResults.value) return;

  const canvas = interactiveCanvas.value;
  const ctx = canvas.getContext('2d');
  const { rawData, images, imgWidth, imgHeight } = matchResults.value;

  // Set canvas size
  canvas.width = imgWidth * 2;
  canvas.height = imgHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw both images side by side
  ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
  ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);

  // Draw match lines if requested (limit to first 20 for clarity)
  if (showVisualization.value) {
    const maxMatches = Math.min(20, rawData.matches.dims[0]);

    for (let i = 0; i < maxMatches; i++) {
      const matchBaseIndex = i * rawData.matches.dims[1];
      const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
      const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

      // Get keypoint coordinates
      const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
      const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
      const x1 =
        Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) + imgWidth;
      const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);

      // Draw match line with color based on index
      ctx.strokeStyle = `hsl(${(i * 360) / maxMatches}, 70%, 50%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Draw keypoints
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(x0, y0, 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x1, y1, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Draw clicked points and their transformations
  clickedPoints.value.forEach((point, index) => {
    const color = `hsl(${(index * 60) % 360}, 80%, 60%)`;

    // Draw source point
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;

    const sourceX = point.sourceImage === 1 ? point.source.x : point.source.x + imgWidth;
    const sourceY = point.source.y;

    ctx.beginPath();
    ctx.arc(sourceX, sourceY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw number label
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText((index + 1).toString(), sourceX + 12, sourceY - 8);

    // Draw transformed point
    ctx.fillStyle = color;
    const targetX = point.sourceImage === 1 ? point.transformed.x + imgWidth : point.transformed.x;
    const targetY = point.transformed.y;

    ctx.beginPath();
    ctx.arc(targetX, targetY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.fillText((index + 1).toString(), targetX + 12, targetY - 8);

    // Draw connection line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  });
};
</script>
