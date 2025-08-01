<template>
  <div class="pose-detector">
    <!-- Video Upload Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Upload Climbing Video</h2>

      <div class="flex items-center justify-center w-full">
        <label
          for="video-upload"
          class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          :class="{ 'border-blue-400 bg-blue-50': isDragOver }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
        >
          <div v-if="!selectedVideo" class="flex flex-col items-center justify-center pt-5 pb-6">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p class="mb-2 text-sm text-gray-500">
              <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">MP4, MOV, or WebM</p>
          </div>

          <div v-else class="relative">
            <video
              :src="videoPreviewUrl"
              class="max-h-48 max-w-full object-contain rounded-lg"
              controls
              muted
            ></video>
            <button
              @click.stop="clearVideo"
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>

          <input
            id="video-upload"
            type="file"
            class="hidden"
            accept="video/*"
            @change="handleFileSelect"
          />
        </label>
      </div>

      <!-- Frame Extraction Preview -->
      <div v-if="extractedFrames.length > 0" class="mt-4">
        <h3 class="text-sm font-medium text-gray-900 mb-2">Extracted Frames</h3>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="(frame, index) in extractedFrames" :key="index" class="text-center">
            <img
              :src="frame.dataUrl"
              :alt="`Frame at ${frame.timePercent}%`"
              class="w-full object-cover rounded border"
            />
            <p class="text-xs text-gray-500 mt-1">
              {{ frame.timePercent }}% ({{ frame.width }}x{{ frame.height }})
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Analysis Section -->
    <div v-if="selectedVideo" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Video Pose Analysis</h2>
        <button
          @click="runVideoAnalysis"
          :disabled="isAnalyzing || extractedFrames.length === 0"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <div
            v-if="isAnalyzing"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
          ></div>
          <span>{{ isAnalyzing ? "Analyzing..." : "Analyze Poses" }}</span>
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
    <div
      v-if="frameResults.length > 0"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Video Analysis Results</h2>

      <!-- Frame Results in Row Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          v-for="(frameResult, frameIndex) in frameResults"
          :key="frameIndex"
          class="border rounded-lg p-4"
        >
          <h3 class="font-medium text-gray-900 mb-3 text-center">
            Frame {{ frameIndex + 1 }} ({{ frameResult.timePercent }}%)
          </h3>

          <!-- Canvas for this frame -->
          <div class="relative mb-4">
            <canvas
              :ref="(el) => (frameCanvases[frameIndex] = el)"
              class="w-full border border-gray-300 rounded-lg"
              style="min-height: 200px; background-color: #f9fafb"
            ></canvas>
          </div>

          <!-- Key points for this frame -->
          <div class="space-y-3">
            <div class="bg-gray-50 p-3 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2 text-xs">Detected Key Points</h4>
              <div class="space-y-1 text-xs">
                <div
                  v-for="point in getFrameKeyPointsSummary(frameResult)"
                  :key="point.name"
                  class="flex justify-between"
                >
                  <span class="text-gray-600">{{ point.name }}:</span>
                  <span :class="point.detected ? 'text-green-600' : 'text-gray-400'">
                    {{ point.detected ? `(${point.x}, ${point.y})` : "Not detected" }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 p-3 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2 text-xs">Frame Summary</h4>
              <div class="space-y-1 text-xs text-gray-600">
                <p>Persons: {{ frameResult.poses.length }}</p>
                <p>Total keypoints: {{ frameResult.poses[0]?.keypoints.length || 0 }}</p>
                <p>Detected: {{ getDetectedKeyPointsCount(frameResult) }}</p>
              </div>
            </div>
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
const selectedVideo = ref(null);
const videoPreviewUrl = ref("");
const isDragOver = ref(false);
const extractedFrames = ref([]);
const frameResults = ref([]);
const frameCanvases = ref([]);

// Pose detection
const {
  isAnalyzing,
  analysisStatus,
  error,
  poseResults,
  runPoseDetection: detectPoses,
  confidenceThreshold,
} = usePoseDetection();

// Track current frame being processed
const currentFrameIndex = ref(-1);
const isProcessingVideo = ref(false);

// Watch for pose results and collect them for video analysis
watch(poseResults, (newResults) => {
  if (isProcessingVideo.value && currentFrameIndex.value >= 0 && newResults) {
    const frameIndex = currentFrameIndex.value;
    const frame = extractedFrames.value[frameIndex];

    console.log(`🎯 Received results for frame ${frameIndex + 1}:`, newResults);

    // Store results for this frame
    frameResults.value[frameIndex] = {
      frameIndex,
      timePercent: frame.timePercent,
      poses: newResults || [],
      frameData: frame,
    };

    // Check if we're done with all frames
    const completedFrames = frameResults.value.filter((f) => f !== undefined).length;
    if (completedFrames === extractedFrames.value.length) {
      isProcessingVideo.value = false;
      currentFrameIndex.value = -1;
      nextTick().then(() => drawAllFrameResults());
    }
  }
});

// Frame extraction utility
const extractVideoFrames = async (videoFile, framePercentages = [15, 50, 85]) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const frames = [];
    let currentFrameIndex = 0;

    video.onloadedmetadata = () => {
      console.log(`📹 Video metadata:`, {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });

      // Ensure minimum size for better detection
      const scale = Math.max(640 / video.videoWidth, 640 / video.videoHeight);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      console.log(`🖼️ Canvas size:`, { width: canvas.width, height: canvas.height });

      const processNextFrame = () => {
        if (currentFrameIndex >= framePercentages.length) {
          resolve(frames);
          return;
        }

        const timePercent = framePercentages[currentFrameIndex];
        const seekTime = (video.duration * timePercent) / 100;

        video.onseeked = () => {
          // Clear canvas before drawing
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw video frame scaled to canvas size
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Use higher quality for better detection
          const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

          console.log(`✅ Extracted frame ${currentFrameIndex + 1} at ${timePercent}%:`, {
            seekTime: seekTime.toFixed(2),
            dataUrlSize: Math.round(dataUrl.length / 1024) + "KB",
          });

          frames.push({
            dataUrl,
            timePercent,
            width: canvas.width,
            height: canvas.height,
          });

          currentFrameIndex++;
          processNextFrame();
        };

        video.onerror = () => {
          reject(new Error("Video seeking failed"));
        };

        video.currentTime = seekTime;
      };

      processNextFrame();
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

// File handling methods
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith("video/")) {
    setSelectedVideo(file);
  }
};

const handleDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith("video/")) {
    setSelectedVideo(file);
  }
};

const setSelectedVideo = async (file) => {
  selectedVideo.value = file;
  videoPreviewUrl.value = URL.createObjectURL(file);

  // Clear previous results
  frameResults.value = [];
  error.value = null;

  // Extract frames
  try {
    const frames = await extractVideoFrames(file);
    extractedFrames.value = frames;
  } catch (err) {
    console.error("Frame extraction failed:", err);
    error.value = "Failed to extract frames from video";
  }
};

const clearVideo = () => {
  selectedVideo.value = null;
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value);
    videoPreviewUrl.value = "";
  }
  extractedFrames.value = [];
  frameResults.value = [];
  error.value = null;
};

// Video analysis method
const runVideoAnalysis = async () => {
  if (!selectedVideo.value || extractedFrames.value.length === 0) return;

  isProcessingVideo.value = true;
  frameResults.value = new Array(extractedFrames.value.length); // Pre-allocate array
  currentFrameIndex.value = 0;

  try {
    // Process frames sequentially to avoid overwhelming the worker
    for (let i = 0; i < extractedFrames.value.length; i++) {
      const frame = extractedFrames.value[i];
      currentFrameIndex.value = i;

      // Convert data URL to blob more carefully
      const response = await fetch(frame.dataUrl);
      const blob = await response.blob();

      // Create a proper File object with correct MIME type
      const imageFile = new File([blob], `frame-${i}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      // Debug: Log file details
      console.log(`🖼️ Processing frame ${i + 1}:`, {
        size: imageFile.size,
        type: imageFile.type,
        name: imageFile.name,
        timePercent: frame.timePercent,
      });

      // Run pose detection on this frame (results will be handled by watcher)
      await detectPoses(imageFile);

      // Wait for this frame to be processed before moving to next
      let timeout = 0;
      while (frameResults.value[i] === undefined && timeout < 10000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        timeout += 100;
      }

      if (frameResults.value[i] === undefined) {
        console.warn(`⚠️ Frame ${i + 1} timed out`);
        frameResults.value[i] = {
          frameIndex: i,
          timePercent: frame.timePercent,
          poses: [],
          frameData: frame,
        };
      }
    }
  } catch (err) {
    console.error("Video analysis failed:", err);
    error.value = `Video analysis failed: ${err.message}`;
    isProcessingVideo.value = false;
    currentFrameIndex.value = -1;
  }
};

// Helper functions for frame results
const getFrameKeyPointsSummary = (frameResult) => {
  if (!frameResult.poses || frameResult.poses.length === 0) return [];

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

  const relevantPoints = ["left_wrist", "right_wrist", "left_ankle", "right_ankle"];
  const firstPerson = frameResult.poses[0];

  return relevantPoints.map((pointName) => {
    const actualIndex = keyPointNames.indexOf(pointName);
    const keypoint = firstPerson.keypoints[actualIndex];

    return {
      name: pointName.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      detected: keypoint && keypoint.confidence > confidenceThreshold.value,
      x: keypoint ? Math.round(keypoint.x) : null,
      y: keypoint ? Math.round(keypoint.y) : null,
      confidence: keypoint ? keypoint.confidence : 0,
    };
  });
};

const getDetectedKeyPointsCount = (frameResult) => {
  if (!frameResult.poses || frameResult.poses.length === 0) return 0;
  return frameResult.poses[0].keypoints.filter((kp) => kp.confidence > confidenceThreshold.value)
    .length;
};

// Draw results for all frames
const drawAllFrameResults = () => {
  frameResults.value.forEach((frameResult, index) => {
    const canvas = frameCanvases.value[index];
    if (!canvas || !frameResult.poses.length) return;

    drawFrameResult(canvas, frameResult);
  });
};

// Draw result for a single frame
const drawFrameResult = (canvas, frameResult) => {
  const ctx = canvas.getContext("2d");
  const frame = frameResult.frameData;

  // Load and draw the frame image
  const img = new Image();
  img.onload = () => {
    // Set canvas size to match frame
    canvas.width = frame.width;
    canvas.height = frame.height;

    // Draw the frame image
    ctx.drawImage(img, 0, 0);

    // Draw pose keypoints for each person
    frameResult.poses.forEach((person, personIndex) => {
      drawPoseKeypoints(ctx, person.keypoints, personIndex);
    });
  };
  img.src = frame.dataUrl;
};

// Draw pose keypoints on canvas (reused from original)
const drawPoseKeypoints = (ctx, keypoints, personIndex = 0) => {
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
  const color = colors[personIndex % colors.length];

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

  // Draw pose skeleton connections
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
