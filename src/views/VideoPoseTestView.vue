<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Video Pose Analysis Test</h1>
        <p class="text-gray-600">
          Upload a climbing video to extract 3 frames, detect poses, and project them onto matched
          images
        </p>
      </div>

      <!-- Video Frame Matcher Component -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <!-- Loading state for comparison images -->
        <div v-if="isLoadingImages" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span class="text-blue-800">Loading comparison images from boulder problems...</span>
          </div>
        </div>

        <!-- No images warning -->
        <div
          v-else-if="comparisonImages.length === 0"
          class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              ></path>
            </svg>
            <div>
              <h4 class="text-sm font-medium text-yellow-800">No Comparison Images</h4>
              <p class="text-sm text-yellow-700 mt-1">
                No images with boulder problems found. Please create some locations with images and
                boulder problems first.
              </p>
              <p class="text-xs text-yellow-600 mt-2">
                Go to a location → Upload images → Use "Holds" button to create boulder problems
              </p>
            </div>
          </div>
        </div>

        <!-- Success state -->
        <div v-else class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span class="text-sm text-green-800">
              Found {{ comparisonImages.length }} images with boulder problems ready for matching
            </span>
          </div>
        </div>

        <VideoFrameMatcherEnhanced
          :comparison-images="comparisonImages"
          @frames-extracted="onFramesExtracted"
          @pose-detected="onPoseDetected"
          @match-found="onMatchFound"
          @processing-error="onProcessingError"
          @video-cleared="onVideoCleared"
        />
      </div>

      <!-- Results Display -->
      <div v-if="results.frames.length > 0" class="mt-8 space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Analysis Results</h2>

        <!-- Extracted Frames -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Extracted Frames</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="(frame, index) in results.frames" :key="index" class="space-y-2">
              <div class="relative">
                <!-- Canvas for pose visualization -->
                <div class="relative inline-block">
                  <img
                    :ref="(el) => (frameImages[index] = el)"
                    :src="frame.url"
                    :alt="`Frame ${index + 1}`"
                    class="w-full h-auto border rounded"
                    @load="() => drawPoseOnFrame(index)"
                  />
                  <canvas
                    :ref="(el) => (frameCanvases[index] = el)"
                    class="absolute top-0 left-0 pointer-events-none rounded"
                    :style="{ width: '100%', height: 'auto' }"
                  ></canvas>
                </div>
                <div
                  class="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded"
                >
                  {{ Math.round(frame.percentage * 100) }}%
                </div>
              </div>

              <!-- Pose Data Display -->
              <div v-if="frame.poseData" class="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div class="font-medium mb-1">Detected Poses:</div>
                <div class="grid grid-cols-2 gap-1">
                  <div>
                    L.Wrist:
                    {{
                      frame.poseData.keypoints.leftWrist
                        ? `(${Math.round(frame.poseData.keypoints.leftWrist.x)}, ${Math.round(
                            frame.poseData.keypoints.leftWrist.y
                          )}) ${(frame.poseData.keypoints.leftWrist.confidence * 100).toFixed(1)}%`
                        : "Not detected"
                    }}
                  </div>
                  <div>
                    R.Wrist:
                    {{
                      frame.poseData.keypoints.rightWrist
                        ? `(${Math.round(frame.poseData.keypoints.rightWrist.x)}, ${Math.round(
                            frame.poseData.keypoints.rightWrist.y
                          )}) ${(frame.poseData.keypoints.rightWrist.confidence * 100).toFixed(1)}%`
                        : "Not detected"
                    }}
                  </div>
                  <div>
                    L.Ankle:
                    {{
                      frame.poseData.keypoints.leftAnkle
                        ? `(${Math.round(frame.poseData.keypoints.leftAnkle.x)}, ${Math.round(
                            frame.poseData.keypoints.leftAnkle.y
                          )}) ${(frame.poseData.keypoints.leftAnkle.confidence * 100).toFixed(1)}%`
                        : "Not detected"
                    }}
                  </div>
                  <div>
                    R.Ankle:
                    {{
                      frame.poseData.keypoints.rightAnkle
                        ? `(${Math.round(frame.poseData.keypoints.rightAnkle.x)}, ${Math.round(
                            frame.poseData.keypoints.rightAnkle.y
                          )}) ${(frame.poseData.keypoints.rightAnkle.confidence * 100).toFixed(1)}%`
                        : "Not detected"
                    }}
                  </div>
                </div>
                <div class="mt-1">
                  Overall Confidence: {{ (frame.poseData.confidence * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Match Results -->
        <div v-if="results.match" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Best Matching Image with Projected Poses
          </h3>

          <!-- Debug Controls -->
          <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 class="font-medium text-yellow-800 mb-2">Debug Controls</h4>
            <button
              @click="drawProjectedPoses"
              class="bg-yellow-600 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-yellow-700"
            >
              Redraw Poses
            </button>
            <button
              @click="showDebugInfo"
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-blue-700"
            >
              Show Debug Info
            </button>
            <button
              @click="clearCanvas"
              class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Clear Canvas
            </button>
          </div>

          <div class="flex items-start space-x-6">
            <div class="flex-1">
              <div class="relative inline-block max-w-4xl">
                <img
                  ref="matchImage"
                  :src="results.match.url"
                  :alt="results.match.name"
                  class="w-full h-auto border rounded"
                  @load="drawProjectedPoses"
                />
                <canvas
                  ref="matchCanvas"
                  class="absolute top-0 left-0 pointer-events-none rounded border"
                  style="background: transparent"
                ></canvas>
              </div>
              <div class="mt-2 text-sm text-gray-600">
                <div class="font-medium">{{ results.match.name }}</div>
                <div>From: {{ results.match.locationName || "Unknown location" }}</div>
                <div>{{ results.match.boulderProblems || 0 }} boulder problems</div>
                <div class="mt-2 text-xs text-blue-600">
                  Poses projected using homography transformation
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Homography Testing -->
        <div v-if="results.match?.homographyMatrix" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Interactive Homography Testing</h3>
          <p class="text-sm text-gray-600 mb-4">
            Click on Frame 2 or the matched image to see corresponding points. This helps debug the
            homography transformation.
          </p>

          <!-- Clear points button -->
          <button
            v-if="clickedPoints.length > 0"
            @click="clearClickedPoints"
            class="mb-4 bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
          >
            Clear Points ({{ clickedPoints.length }})
          </button>

          <div class="flex items-start space-x-6">
            <!-- Frame 2 (source) -->
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Frame 2 (Click to project)</h4>
              <div class="relative inline-block">
                <img
                  ref="sourceFrameImage"
                  :src="results.frames[1]?.url"
                  alt="Frame 2"
                  class="w-full h-auto border rounded cursor-crosshair"
                  @click="onSourceImageClick"
                />
                <canvas
                  ref="sourceFrameCanvas"
                  class="absolute top-0 left-0 pointer-events-none rounded border"
                  style="background: transparent"
                ></canvas>
              </div>
            </div>

            <!-- Matched Image (target) -->
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Matched Image (Projections)</h4>
              <div class="relative inline-block">
                <img
                  ref="targetMatchImage"
                  :src="results.match.url"
                  :alt="results.match.name"
                  class="w-full h-auto border rounded cursor-crosshair"
                  @click="onTargetImageClick"
                />
                <canvas
                  ref="targetMatchCanvas"
                  class="absolute top-0 left-0 pointer-events-none rounded border"
                  style="background: transparent"
                ></canvas>
              </div>
            </div>
          </div>

          <!-- Point Transformation Results -->
          <div
            v-if="clickedPoints.length > 0"
            class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h4 class="font-medium text-blue-800 mb-2">Point Transformations</h4>
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
                  {{ point.sourceImage === "frame" ? "Frame → Match" : "Match → Frame" }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing Statistics -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Processing Statistics</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="bg-blue-50 p-3 rounded">
              <div class="font-medium text-blue-900">Frames Extracted</div>
              <div class="text-2xl font-bold text-blue-600">{{ results.frames.length }}</div>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <div class="font-medium text-green-900">Poses Detected</div>
              <div class="text-2xl font-bold text-green-600">
                {{ results.frames.filter((f) => f.poseData).length }}
              </div>
            </div>
            <div class="bg-purple-50 p-3 rounded">
              <div class="font-medium text-purple-900">Average Confidence</div>
              <div class="text-2xl font-bold text-purple-600">{{ averageConfidence }}%</div>
            </div>
          </div>
        </div>

        <!-- Available Comparison Images Debug Info -->
        <div v-if="comparisonImages.length > 0" class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Available Comparison Images</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="image in comparisonImages" :key="image.id" class="border rounded-lg p-3">
              <img
                :src="image.url"
                :alt="image.name"
                class="w-full h-32 object-cover rounded mb-2"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <div class="text-xs space-y-1">
                <div class="font-medium text-gray-900">{{ image.name }}</div>
                <div class="text-gray-600">{{ image.locationName }}</div>
                <div class="text-blue-600">{{ image.boulderProblems }} boulder problems</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mt-8">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg
              class="w-5 h-5 text-red-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Processing Error</h3>
              <p class="text-sm text-red-700 mt-1">{{ error.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import VideoFrameMatcherEnhanced from "@/components/VideoFrameMatcherEnhanced.vue";
import { locationService } from "@/services/locationService";
import { boulderProblemsService } from "@/services/boulderProblemsService";

// State
const results = ref({
  frames: [],
  match: null,
});
const error = ref(null);
const comparisonImages = ref([]);
const isLoadingImages = ref(false);

// Refs for pose visualization
const frameImages = ref([]);
const frameCanvases = ref([]);
const matchImage = ref(null);
const matchCanvas = ref(null);

// Refs for interactive homography testing
const sourceFrameImage = ref(null);
const sourceFrameCanvas = ref(null);
const targetMatchImage = ref(null);
const targetMatchCanvas = ref(null);
const clickedPoints = ref([]);

// Load comparison images from Firestore on component mount
onMounted(async () => {
  // Load OpenCV.js first
  try {
    console.log("🔄 Loading OpenCV.js...");
    const cvReadyPromise = await import("@techstark/opencv-js");
    window.cv = await cvReadyPromise.default;
    console.log("✅ OpenCV.js loaded successfully");
    console.log("Available OpenCV methods:", Object.keys(window.cv).slice(0, 10).join(", "));
  } catch (err) {
    console.error("❌ Failed to load OpenCV.js:", err);
    error.value = "Failed to load OpenCV.js library";
  }

  // Load comparison images
  await loadComparisonImages();
});

const loadComparisonImages = async () => {
  isLoadingImages.value = true;
  try {
    // Get all locations
    const locations = await locationService.getLocations();
    const allImages = [];

    // For each location, get images and their associated boulder problems
    for (const location of locations) {
      try {
        const locationImages = await locationService.getLocationImages(location.id);

        // For each image, check if it has boulder problems
        for (const image of locationImages) {
          try {
            const boulderProblems = await boulderProblemsService.getBoulderProblemsByImage(
              location.id,
              image.id
            );

            // Only include images that have boulder problems
            if (boulderProblems.length > 0) {
              allImages.push({
                id: image.id,
                name: image.fileName,
                url: image.downloadUrl,
                locationId: location.id,
                locationName: location.name,
                boulderProblems: boulderProblems.length,
                problems: boulderProblems, // Include the actual problems for debugging
              });
            }
          } catch (problemError) {
            console.warn(`Could not load boulder problems for image ${image.id}:`, problemError);
          }
        }
      } catch (imageError) {
        console.warn(`Could not load images for location ${location.id}:`, imageError);
      }
    }

    comparisonImages.value = allImages;
    console.log(`Loaded ${allImages.length} comparison images with boulder problems`);

    if (allImages.length === 0) {
      console.warn(
        "No images with boulder problems found. Make sure to add some boulder problems first."
      );
    }
  } catch (err) {
    console.error("Error loading comparison images:", err);
    error.value = new Error("Failed to load comparison images: " + err.message);
  } finally {
    isLoadingImages.value = false;
  }
};

// Project poses onto best matching image using homography
const drawProjectedPoses = () => {
  if (!matchCanvas.value || !results.value?.match || !results.value.match.homographyMatrix) {
    console.warn("⚠️ Missing requirements for pose projection:", {
      canvas: !!matchCanvas.value,
      match: !!results.value?.match,
      homography: !!results.value.match?.homographyMatrix,
    });
    return;
  }

  const canvas = matchCanvas.value;
  const ctx = canvas.getContext("2d");
  const image = matchImage.value;

  if (!image) {
    console.warn("⚠️ Match image not loaded");
    return;
  }

  console.log("🎨 Starting pose projection drawing...");
  console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
  console.log("Image dimensions:", image.naturalWidth, "x", image.naturalHeight);
  console.log("Displayed image dimensions:", image.width, "x", image.height);

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const homographyMatrix = results.value.match.homographyMatrix;
  console.log("🔄 Using homography matrix:", homographyMatrix);

  // Calculate scaling factors to map from matched image natural size to display size
  const scaleX = canvas.width / image.naturalWidth;
  const scaleY = canvas.height / image.naturalHeight;

  console.log("🔍 Scale factors:", {
    scaleX,
    scaleY,
    canvasSize: `${canvas.width}x${canvas.height}`,
    imageNaturalSize: `${image.naturalWidth}x${image.naturalHeight}`,
    imageDisplaySize: `${image.width}x${image.height}`,
  });

  const frameColors = ["#ff0000", "#00ff00", "#0000ff"];
  let totalPointsDrawn = 0;
  let debugPoints = [];

  // DEBUG: Draw canvas boundary and grid
  ctx.strokeStyle = "#ffff00";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Draw grid for reference
  ctx.strokeStyle = "#ffff00";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // DEBUG: Draw center point
  ctx.fillStyle = "#ff00ff";
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, 2 * Math.PI);
  ctx.fill();

  results.value.frames.forEach((frame, frameIndex) => {
    if (!frame.poseData || !frame.poseData.allKeypoints) {
      console.warn(`⚠️ No pose data for frame ${frameIndex + 1}`);
      return;
    }

    const frameColor = frameColors[frameIndex % frameColors.length];
    console.log(
      `🎯 Processing frame ${frameIndex + 1} with ${frame.poseData.allKeypoints.length} keypoints`
    );

    frame.poseData.allKeypoints.forEach((keypoint, keypointIndex) => {
      if (keypoint.confidence < 0.3) return; // Skip low-confidence keypoints

      const keypointName = `kp${keypointIndex}`; // Generic keypoint name

      console.log(
        `🔸 Processing ${keypointName}: (${keypoint.x}, ${
          keypoint.y
        }) conf: ${keypoint.confidence.toFixed(2)}`
      );

      const transformedPoint = transformPointWithHomography(
        keypoint.x,
        keypoint.y,
        homographyMatrix
      );

      console.log(
        `✨ Transformed ${keypointName}:`,
        `(${keypoint.x}, ${keypoint.y}) → ${
          transformedPoint
            ? `(${transformedPoint.x.toFixed(1)}, ${transformedPoint.y.toFixed(1)})`
            : "null"
        }`
      );

      if (transformedPoint) {
        // Use transformed coordinates directly (they're already in target image space)
        const x = transformedPoint.x;
        const y = transformedPoint.y;

        console.log(`🎨 Drawing keypoint at canvas coords: (${x.toFixed(1)}, ${y.toFixed(1)})`);

        debugPoints.push({
          original: { x: keypoint.x, y: keypoint.y },
          transformed: transformedPoint,
          canvas: { x, y },
          inBounds: x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height,
          frame: frameIndex + 1,
          name: keypointName,
        });

        // DEBUG: Draw ALL transformed points regardless of bounds, but mark out-of-bounds differently
        const isInBounds = x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height;

        if (isInBounds) {
          // Draw the projected keypoint with larger, more visible style
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = frameColor;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Add a second inner circle for better visibility
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "#ffffff";
          ctx.fill();

          totalPointsDrawn++;
        } else {
          // Draw out-of-bounds points as crosses at edge
          const clampedX = Math.max(0, Math.min(canvas.width, x));
          const clampedY = Math.max(0, Math.min(canvas.height, y));

          ctx.strokeStyle = frameColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(clampedX - 10, clampedY - 10);
          ctx.lineTo(clampedX + 10, clampedY + 10);
          ctx.moveTo(clampedX + 10, clampedY - 10);
          ctx.lineTo(clampedX - 10, clampedY + 10);
          ctx.stroke();
        }

        // Add label with background (for in-bounds points)
        if (isInBounds) {
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";

          // Draw text background
          const text = `F${frameIndex + 1}`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x - textWidth / 2 - 2, y - 20, textWidth + 4, 16);

          // Draw text
          ctx.fillStyle = "#ffffff";
          ctx.fillText(text, x, y - 8);
        }
      }
    });
  });

  console.log(`🎉 Total points drawn: ${totalPointsDrawn}`);
  console.log("🔍 Debug points summary:", debugPoints);

  // Add enhanced legend with debug info
  const legendHeight = 140;
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillRect(10, 10, 200, legendHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DEBUG - Projected Poses:", 15, 25);
  ctx.fillText(`Points drawn: ${totalPointsDrawn}`, 15, 40);
  ctx.fillText(`Total keypoints: ${debugPoints.length}`, 15, 55);
  ctx.fillText(`In bounds: ${debugPoints.filter((p) => p.inBounds).length}`, 15, 70);
  ctx.fillText(`Out of bounds: ${debugPoints.filter((p) => !p.inBounds).length}`, 15, 85);
  ctx.fillText("Canvas: Yellow grid", 15, 100);
  ctx.fillText("Center: Magenta dot", 15, 115);
  ctx.fillText("Out-bounds: X marks", 15, 130);

  frameColors.forEach((color, index) => {
    if (index < results.value.frames.length) {
      ctx.fillStyle = color;
      ctx.fillRect(15, 45 + index * 12, 10, 10);

      ctx.fillStyle = "#ffffff";
      ctx.font = "10px sans-serif";
      ctx.fillText(`F${index + 1}`, 30, 45 + index * 12 + 8);
    }
  });
};

// Helper function to transform a point using homography matrix
const transformPointWithHomography = (x, y, homographyMatrix) => {
  if (!homographyMatrix || homographyMatrix.length !== 9) {
    console.warn("Invalid homography matrix for transformation");
    return null;
  }

  try {
    // Homography transformation: [x', y', w'] = H * [x, y, 1]
    const h = homographyMatrix;

    const x_prime = h[0] * x + h[1] * y + h[2];
    const y_prime = h[3] * x + h[4] * y + h[5];
    const w_prime = h[6] * x + h[7] * y + h[8];

    if (Math.abs(w_prime) < 1e-10) {
      console.warn("Transformation resulted in invalid homogeneous coordinate");
      return null;
    }

    return {
      x: x_prime / w_prime,
      y: y_prime / w_prime,
    };
  } catch (error) {
    console.error("Error in homography transformation:", error);
    return null;
  }
};

// Pose visualization function
const drawPoseOnFrame = (frameIndex) => {
  const frame = results.value.frames[frameIndex];
  const imageEl = frameImages.value[frameIndex];
  const canvasEl = frameCanvases.value[frameIndex];

  if (!frame || !frame.poseData || !imageEl || !canvasEl) {
    return;
  }

  // Wait for image to be fully loaded
  if (!imageEl.complete || imageEl.naturalWidth === 0) {
    return;
  }

  // Set canvas size to match displayed image
  const rect = imageEl.getBoundingClientRect();
  canvasEl.width = rect.width;
  canvasEl.height = rect.height;

  const ctx = canvasEl.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  // Calculate scale factors from video resolution to display size
  const scaleX = rect.width / frame.imageData.width; // frame.imageData.width is the original video width
  const scaleY = rect.height / frame.imageData.height; // frame.imageData.height is the original video height

  console.log("Pose drawing debug:", {
    frameIndex,
    videoSize: { width: frame.imageData.width, height: frame.imageData.height },
    displaySize: { width: rect.width, height: rect.height },
    scale: { x: scaleX, y: scaleY },
  });

  // Use allKeypoints if available for full skeleton, otherwise fallback to simplified
  const keypoints = frame.poseData.allKeypoints || Object.values(frame.poseData.keypoints);

  if (frame.poseData.allKeypoints) {
    // Draw full COCO skeleton
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

    // COCO skeleton connections
    const connections = [
      [5, 6], // left_shoulder - right_shoulder
      [5, 7], // left_shoulder - left_elbow
      [7, 9], // left_elbow - left_wrist
      [6, 8], // right_shoulder - right_elbow
      [8, 10], // right_elbow - right_wrist
      [5, 11], // left_shoulder - left_hip
      [6, 12], // right_shoulder - right_hip
      [11, 12], // left_hip - right_hip
      [11, 13], // left_hip - left_knee
      [13, 15], // left_knee - left_ankle
      [12, 14], // right_hip - right_knee
      [14, 16], // right_knee - right_ankle
      [0, 1], // nose - left_eye
      [0, 2], // nose - right_eye
      [1, 3], // left_eye - left_ear
      [2, 4], // right_eye - right_ear
    ];

    // Draw skeleton connections first
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    connections.forEach(([startIdx, endIdx]) => {
      const startPoint = keypoints[startIdx];
      const endPoint = keypoints[endIdx];

      if (startPoint && endPoint && startPoint.confidence > 0.3 && endPoint.confidence > 0.3) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * scaleX, startPoint.y * scaleY);
        ctx.lineTo(endPoint.x * scaleX, endPoint.y * scaleY);
        ctx.stroke();
      }
    });

    // Draw all keypoints
    keypoints.forEach((keypoint, index) => {
      if (keypoint && keypoint.confidence > 0.3) {
        const x = keypoint.x * scaleX;
        const y = keypoint.y * scaleY;

        // Color code climbing-relevant points
        const isClimbingPoint = index === 9 || index === 10 || index === 15 || index === 16; // wrists and ankles

        ctx.beginPath();
        ctx.arc(x, y, isClimbingPoint ? 8 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isClimbingPoint ? "#ff4444" : "#00ff00";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add label for debugging
        if (isClimbingPoint) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(keyPointNames[index], x, y - 10);
        }

        console.log(`Keypoint ${index} (${keyPointNames[index]}):`, {
          original: { x: keypoint.x, y: keypoint.y },
          scaled: { x, y },
          confidence: keypoint.confidence,
          scaleFactors: { scaleX, scaleY },
        });
      }
    });
  } else {
    // Fallback: draw simplified keypoints only
    const keypointStyle = {
      leftWrist: { color: "#ef4444", label: "LW" },
      rightWrist: { color: "#3b82f6", label: "RW" },
      leftAnkle: { color: "#22c55e", label: "LA" },
      rightAnkle: { color: "#f59e0b", label: "RA" },
    };

    Object.entries(frame.poseData.keypoints).forEach(([name, point]) => {
      if (point && point.confidence > 0.3) {
        const x = point.x * scaleX;
        const y = point.y * scaleY;
        const style = keypointStyle[name];

        if (style) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = style.color;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(style.label, x, y + 3);
        }
      }
    });
  }

  // Draw connections between related points
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;

  // Connect wrists if both are visible
  if (
    keypoints.leftWrist &&
    keypoints.rightWrist &&
    keypoints.leftWrist.confidence > 0.3 &&
    keypoints.rightWrist.confidence > 0.3
  ) {
    ctx.beginPath();
    ctx.moveTo(keypoints.leftWrist.x * scaleX, keypoints.leftWrist.y * scaleY);
    ctx.lineTo(keypoints.rightWrist.x * scaleX, keypoints.rightWrist.y * scaleY);
    ctx.stroke();
  }

  // Connect ankles if both are visible
  if (
    keypoints.leftAnkle &&
    keypoints.rightAnkle &&
    keypoints.leftAnkle.confidence > 0.3 &&
    keypoints.rightAnkle.confidence > 0.3
  ) {
    ctx.beginPath();
    ctx.moveTo(keypoints.leftAnkle.x * scaleX, keypoints.leftAnkle.y * scaleY);
    ctx.lineTo(keypoints.rightAnkle.x * scaleX, keypoints.rightAnkle.y * scaleY);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
};

// Computed properties
const averageConfidence = computed(() => {
  const validFrames = results.value.frames.filter((f) => f.poseData && f.poseData.confidence);
  if (validFrames.length === 0) return 0;

  const total = validFrames.reduce((sum, frame) => sum + frame.poseData.confidence, 0);
  return Math.round((total / validFrames.length) * 100);
});

// Interactive homography testing functions
const onSourceImageClick = (event) => {
  if (!results.value.match?.homographyMatrix || !sourceFrameImage.value) return;

  const img = sourceFrameImage.value;
  const rect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  // Get click coordinates in original image space
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // 🐛 ENHANCED DEBUG INFO
  console.log("🖱️ SOURCE CLICK DEBUG:", {
    event: {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    },
    element: {
      boundingRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      naturalSize: {
        width: img.naturalWidth,
        height: img.naturalHeight,
      },
      displaySize: {
        width: img.width,
        height: img.height,
        offsetWidth: img.offsetWidth,
        offsetHeight: img.offsetHeight,
      },
    },
    frameData: results.value.frames.length > 0 ? {
      frameWidth: results.value.frames[0].imageData?.width,
      frameHeight: results.value.frames[0].imageData?.height,
    } : null,
    scales: {
      scaleX: scaleX,
      scaleY: scaleY,
    },
    coordinates: {
      clickRaw: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
      clickScaled: { x, y },
      bounds: {
        maxX: img.naturalWidth,
        maxY: img.naturalHeight,
        inBounds: x >= 0 && x <= img.naturalWidth && y >= 0 && y <= img.naturalHeight,
      },
    },
  });

  // Transform point to matched image space
  const transformed = transformPointWithHomography(x, y, results.value.match.homographyMatrix);

  if (transformed) {
    const pointIndex = clickedPoints.value.length + 1;
    console.log(`🔄 HOMOGRAPHY TRANSFORM ${pointIndex}:`, {
      input: { x, y },
      output: transformed,
      homographyMatrix: results.value.match.homographyMatrix,
    });

    clickedPoints.value.push({
      source: { x, y },
      transformed: transformed,
      sourceImage: "frame",
    });

    // Draw the points
    drawInteractivePoints();
  } else {
    console.error("❌ Homography transformation failed");
  }
};

const onTargetImageClick = (event) => {
  if (!results.value.match?.homographyMatrix || !targetMatchImage.value) return;

  const img = targetMatchImage.value;
  const rect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  // Get click coordinates in original image space
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  console.log("Target click:", { x, y, natural: `${img.naturalWidth}x${img.naturalHeight}` });

  // Transform point back to frame space (inverse)
  // For now, just record the click point
  clickedPoints.value.push({
    source: { x, y },
    transformed: null, // We'll implement inverse later if needed
    sourceImage: "match",
  });

  // Draw the points
  drawInteractivePoints();
};

const clearClickedPoints = () => {
  clickedPoints.value = [];
  drawInteractivePoints();
};

const drawInteractivePoints = () => {
  console.log("🎨 DRAW INTERACTIVE POINTS - START");
  console.log("🔧 OVERALL STATE CHECK:", JSON.stringify({
    clickedPoints: clickedPoints.value.length,
    match: !!results.value.match,
    homographyMatrix: !!results.value.match?.homographyMatrix,
    sourceFrameCanvas: !!sourceFrameCanvas.value,
    sourceFrameImage: !!sourceFrameImage.value,
    targetMatchCanvas: !!targetMatchCanvas.value,
    targetMatchImage: !!targetMatchImage.value,
  }, null, 2));

  // Clear both canvases
  if (sourceFrameCanvas.value && sourceFrameImage.value) {
    const canvas = sourceFrameCanvas.value;
    const img = sourceFrameImage.value;
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw points clicked on this image
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;

    console.log("📍 SOURCE CANVAS DEBUG:", JSON.stringify({
      canvas: {
        width: canvas.width,
        height: canvas.height,
      },
      image: {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        offsetWidth: img.offsetWidth,
        offsetHeight: img.offsetHeight,
        displayWidth: img.width,
        displayHeight: img.height,
      },
      scales: { scaleX, scaleY },
      totalPoints: clickedPoints.value.length,
      framePoints: clickedPoints.value.filter((p) => p.sourceImage === "frame").length,
    }, null, 2));

    clickedPoints.value.forEach((point, index) => {
      if (point.sourceImage === "frame") {
        const x = point.source.x * scaleX;
        const y = point.source.y * scaleY;

        console.log(`🔵 SOURCE Point ${index + 1}:`, JSON.stringify({
          original: point.source,
          canvasCoords: { x, y },
          inBounds: x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height,
        }, null, 2));

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${(index * 60) % 360}, 80%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.fillText((index + 1).toString(), x + 12, y - 8);
      }
    });
  }

  console.log("🔍 TARGET CANVAS CHECK:", JSON.stringify({
    targetMatchCanvas: {
      exists: !!targetMatchCanvas.value,
      element: targetMatchCanvas.value ? "Found" : "Missing",
    },
    targetMatchImage: {
      exists: !!targetMatchImage.value,
      element: targetMatchImage.value ? "Found" : "Missing",
    },
    condition: !!(targetMatchCanvas.value && targetMatchImage.value),
  }, null, 2));

  if (targetMatchCanvas.value && targetMatchImage.value) {
    const canvas = targetMatchCanvas.value;
    const img = targetMatchImage.value;
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw transformed points
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;

    console.log("🎯 TARGET CANVAS DEBUG:", JSON.stringify({
      canvas: {
        width: canvas.width,
        height: canvas.height,
      },
      image: {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        offsetWidth: img.offsetWidth,
        offsetHeight: img.offsetHeight,
        displayWidth: img.width,
        displayHeight: img.height,
      },
      scales: { scaleX, scaleY },
      totalPoints: clickedPoints.value.length,
      transformedPoints: clickedPoints.value.filter(
        (p) => p.sourceImage === "frame" && p.transformed
      ).length,
    }, null, 2));

    clickedPoints.value.forEach((point, index) => {
      if (point.sourceImage === "frame" && point.transformed) {
        // Use transformed coordinates directly (they're already in target image space)
        const x = point.transformed.x;
        const y = point.transformed.y;

        // Transform coordinates from natural image space to canvas display space
        const canvasX = x * scaleX;
        const canvasY = y * scaleY;

        console.log(`🟡 TARGET Point ${index + 1}:`, JSON.stringify({
          transformed: point.transformed,
          naturalCoords: { x, y },
          canvasCoords: { x: canvasX, y: canvasY },
          inBounds: canvasX >= 0 && canvasX <= canvas.width && canvasY >= 0 && canvasY <= canvas.height,
          scales: { scaleX, scaleY },
        }, null, 2));

        // Draw the point using canvas coordinates
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${(index * 60) % 360}, 80%, 60%)`;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.fillText((index + 1).toString(), canvasX + 12, canvasY - 8);
      }
    });
  }

  console.log("🎨 DRAW INTERACTIVE POINTS - END");
};

// Event handlers
const onFramesExtracted = (frames) => {
  console.log("Frames extracted:", frames);
  results.value.frames = frames;
  error.value = null;

  // Draw poses after frames are updated in DOM
  nextTick(() => {
    frames.forEach((_, index) => {
      setTimeout(() => drawPoseOnFrame(index), 100); // Small delay to ensure images are loaded
    });
  });
};

const onPoseDetected = (poses) => {
  console.log("Poses detected:", poses);
  // The poses are already attached to the frames
  // Redraw poses when pose data is updated
  nextTick(() => {
    results.value.frames.forEach((_, index) => {
      setTimeout(() => drawPoseOnFrame(index), 100);
    });
  });
};

const onMatchFound = (matchData) => {
  console.log("🎯 Match found in VideoPoseTestView:", matchData);
  console.log("🔍 Match object structure:", {
    video: !!matchData.video,
    frames: !!matchData.frames,
    match: !!matchData.match,
    matchHasHomography: !!matchData.match?.homographyMatrix,
  });
  console.log("🎛️ Homography matrix from match:", matchData.match?.homographyMatrix);

  results.value.match = matchData.match; // Store the match object, not the whole matchData
  results.value.frames = matchData.frames; // Also store frames

  // Trigger pose projection after match is found
  nextTick(() => {
    setTimeout(drawProjectedPoses, 100); // Small delay to ensure image loads
  });
};

const onProcessingError = (err) => {
  console.error("Processing error:", err);
  error.value = err;
};

const onVideoCleared = () => {
  console.log("Video cleared");
  results.value.frames = [];
  results.value.match = null;
  error.value = null;
};

// Debug methods
const showDebugInfo = () => {
  console.log("🔍 === DEBUG INFO ===");
  console.log("Results state:", {
    hasFrames: !!results.value.frames?.length,
    frameCount: results.value.frames?.length || 0,
    hasMatch: !!results.value.match,
    hasHomography: !!results.value.match?.homographyMatrix,
  });

  if (results.value.match) {
    console.log("Match details:", {
      url: results.value.match.url,
      name: results.value.match.name,
      score: results.value.match.score,
      homographyMatrix: results.value.match.homographyMatrix,
    });
  }

  if (results.value.frames?.length) {
    results.value.frames.forEach((frame, idx) => {
      console.log(`Frame ${idx + 1}:`, {
        hasPose: !!frame.poseData,
        hasAllKeypoints: frame.poseData?.allKeypoints?.length || 0,
        confidence: frame.poseData?.confidence || 0,
        keypointsSample: {
          leftWrist: frame.poseData?.keypoints?.leftWrist,
          rightWrist: frame.poseData?.keypoints?.rightWrist,
        },
      });
    });
  }

  if (matchCanvas.value) {
    console.log("Canvas state:", {
      exists: !!matchCanvas.value,
      width: matchCanvas.value.width,
      height: matchCanvas.value.height,
      hasContext: !!matchCanvas.value.getContext("2d"),
    });
  }

  if (matchImage.value) {
    console.log("Image state:", {
      exists: !!matchImage.value,
      naturalWidth: matchImage.value.naturalWidth,
      naturalHeight: matchImage.value.naturalHeight,
      displayWidth: matchImage.value.width,
      displayHeight: matchImage.value.height,
      loaded: matchImage.value.complete,
    });
  }

  console.log("OpenCV state:", {
    loaded: !!window.cv,
    hasMatMethods: !!(window.cv && window.cv.Mat),
  });
};

const clearCanvas = () => {
  if (matchCanvas.value) {
    const ctx = matchCanvas.value.getContext("2d");
    ctx.clearRect(0, 0, matchCanvas.value.width, matchCanvas.value.height);
    console.log("🧹 Canvas cleared");
  }
};
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>
