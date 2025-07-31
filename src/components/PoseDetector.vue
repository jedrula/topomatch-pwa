<template>
  <div class="pose-detector">
    <!-- Image Upload Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Upload Climbing Image</h2>

      <div class="flex items-center justify-center w-full">
        <label
          for="image-upload"
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          :class="{ 'border-blue-400 bg-blue-50': isDragOver }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
        >
          <div v-if="!selectedImage" class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              class="w-8 h-8 mb-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p class="mb-2 text-sm text-gray-500">
              <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">PNG, JPG or JPEG</p>
          </div>

          <div v-else class="relative">
            <img
              :src="imagePreviewUrl"
              alt="Selected climbing image"
              class="max-h-48 max-w-full object-contain rounded-lg"
            />
            <button
              @click.stop="clearImage"
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>

          <input
            id="image-upload"
            type="file"
            class="hidden"
            accept="image/*"
            @change="handleFileSelect"
          />
        </label>
      </div>
    </div>

    <!-- Analysis Section -->
    <div v-if="selectedImage" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Pose Detection</h2>
        <button
          @click="runPoseDetection"
          :disabled="isAnalyzing"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <div
            v-if="isAnalyzing"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
          ></div>
          <span>{{ isAnalyzing ? "Analyzing..." : "Detect Poses" }}</span>
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
    </div>

    <!-- Results Section -->
    <div v-if="poseResults" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Detection Results</h2>

      <!-- Results Canvas -->
      <div class="relative mb-4">
        <canvas
          ref="resultsCanvas"
          class="max-w-full border border-gray-300 rounded-lg"
          style="min-height: 300px; background-color: #f9fafb"
        ></canvas>
        <div
          v-if="!poseResults?.length"
          class="absolute inset-0 flex items-center justify-center text-gray-500"
        >
          Results will appear here after detection
        </div>
      </div>

      <!-- Key Points Summary -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-medium text-gray-900 mb-2">Detected Key Points</h3>
          <div class="space-y-1 text-sm">
            <div v-for="point in keyPointsSummary" :key="point.name" class="flex justify-between">
              <span class="text-gray-600">{{ point.name }}:</span>
              <span :class="point.detected ? 'text-green-600' : 'text-gray-400'">
                {{ point.detected ? `(${point.x}, ${point.y})` : "Not detected" }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="font-medium text-gray-900 mb-2">Analysis Summary</h3>
          <div class="space-y-1 text-sm text-gray-600">
            <p>Persons detected: {{ poseResults.length }}</p>
            <p>Confidence threshold: {{ confidenceThreshold }}</p>
            <p>Total key points: {{ totalKeyPoints }}</p>
            <p>Detected key points: {{ detectedKeyPoints }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from "vue";
import { usePoseDetection } from "@/composables/usePoseDetection";

// Component state
const selectedImage = ref(null);
const imagePreviewUrl = ref("");
const isDragOver = ref(false);
const resultsCanvas = ref(null);

// Pose detection
const {
  isAnalyzing,
  analysisStatus,
  error,
  poseResults,
  runPoseDetection: detectPoses,
  confidenceThreshold,
} = usePoseDetection();

// Computed properties
const keyPointsSummary = computed(() => {
  if (!poseResults.value || poseResults.value.length === 0) return [];

  // YOLO11n-pose key point names (COCO format)
  const keyPointNames = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];

  // Focus on climbing-relevant points (hands and feet)
  const relevantPoints = ["left_wrist", "right_wrist", "left_ankle", "right_ankle"];

  const firstPerson = poseResults.value[0];
  console.log("keyPointsSummary - firstPerson:", firstPerson);

  return relevantPoints.map((pointName) => {
    const actualIndex = keyPointNames.indexOf(pointName);
    const keypoint = firstPerson.keypoints[actualIndex];

    const result = {
      name: pointName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      detected: keypoint && keypoint.confidence > confidenceThreshold.value,
      x: keypoint ? Math.round(keypoint.x) : null,
      y: keypoint ? Math.round(keypoint.y) : null,
      confidence: keypoint ? keypoint.confidence : 0,
    };

    console.log(`keypoint ${pointName}:`, { actualIndex, keypoint, result });
    return result;
  });
});

const totalKeyPoints = computed(() => {
  if (!poseResults.value || poseResults.value.length === 0) return 0;
  return poseResults.value[0].keypoints.length;
});

const detectedKeyPoints = computed(() => {
  if (!poseResults.value || poseResults.value.length === 0) return 0;
  return poseResults.value[0].keypoints.filter((kp) => kp.confidence > confidenceThreshold.value)
    .length;
});

// File handling methods
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    setSelectedImage(file);
  }
};

const handleDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    setSelectedImage(file);
  }
};

const setSelectedImage = (file) => {
  selectedImage.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);

  // Clear previous results
  poseResults.value = null;
  error.value = null;
};

const clearImage = () => {
  selectedImage.value = null;
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = "";
  }
  poseResults.value = null;
  error.value = null;
};

// Pose detection method
const runPoseDetection = async () => {
  if (!selectedImage.value) return;

  try {
    await detectPoses(selectedImage.value);
    // Note: drawResults() will be called automatically when poseResults changes
  } catch (err) {
    console.error("Pose detection failed:", err);
  }
};

// Watch for poseResults changes and draw automatically
watch(
  poseResults,
  async (newResults) => {
    if (newResults && newResults.length > 0) {
      console.log("🎯 poseResults changed, triggering draw");
      await nextTick();
      drawResults();
    }
  },
  { immediate: false }
);

// Draw results on canvas
const drawResults = () => {
  const debugInfo = {
    hasCanvas: !!resultsCanvas.value,
    hasPoseResults: !!poseResults.value,
    hasImageUrl: !!imagePreviewUrl.value,
    poseResultsLength: poseResults.value?.length,
  };

  console.log("🎨 drawResults called", debugInfo);

  if (!resultsCanvas.value || !poseResults.value || !imagePreviewUrl.value) {
    console.log("❌ drawResults early return - missing requirements");
    return;
  }

  const canvas = resultsCanvas.value;
  const ctx = canvas.getContext("2d");

  // Load and draw the image
  const img = new Image();
  img.onload = () => {
    const imageInfo = {
      imgWidth: img.width,
      imgHeight: img.height,
      posesCount: poseResults.value.length,
    };
    console.log("🖼️ Image loaded for canvas", imageInfo);

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    console.log("📐 Canvas size set", {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    });

    // Draw the original image
    ctx.drawImage(img, 0, 0);
    console.log("✅ Image drawn on canvas");

    // Draw pose keypoints
    poseResults.value.forEach((person, personIndex) => {
      console.log(`🔴 Drawing person ${personIndex}:`, {
        confidence: person.confidence,
        keypointCount: person.keypoints.length,
      });
      drawPoseKeypoints(ctx, person.keypoints, personIndex);
    });

    console.log("🎨 Canvas drawing completed");
  };
  img.onerror = (error) => {
    console.error("❌ Failed to load image for canvas:", error);
  };
  img.src = imagePreviewUrl.value;
};

// Draw pose keypoints on canvas
const drawPoseKeypoints = (ctx, keypoints, personIndex = 0) => {
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
  const color = colors[personIndex % colors.length];

  // YOLO11n-pose key point names for reference
  const keyPointNames = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];

  // Draw keypoints
  keypoints.forEach((keypoint, index) => {
    if (keypoint.confidence > confidenceThreshold.value) {
      const isClimbingPoint = ["left_wrist", "right_wrist", "left_ankle", "right_ankle"].includes(
        keyPointNames[index]
      );

      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, isClimbingPoint ? 8 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isClimbingPoint ? "#ff4444" : color;
      ctx.fill();

      // Add label for climbing-relevant points
      if (isClimbingPoint) {
        ctx.fillStyle = "#000000";
        ctx.font = "12px Arial";
        ctx.fillText(keyPointNames[index].replace("_", " "), keypoint.x + 10, keypoint.y - 10);
      }
    }
  });

  // Draw pose skeleton connections (basic connections)
  const connections = [
    [5, 6],
    [5, 7],
    [7, 9],
    [6, 8],
    [8, 10], // arms
    [5, 11],
    [6, 12],
    [11, 12], // torso
    [11, 13],
    [13, 15],
    [12, 14],
    [14, 16], // legs
  ];

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  connections.forEach(([startIdx, endIdx]) => {
    const startPoint = keypoints[startIdx];
    const endPoint = keypoints[endIdx];

    if (
      startPoint.confidence > confidenceThreshold.value &&
      endPoint.confidence > confidenceThreshold.value
    ) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    }
  });
};
</script>
