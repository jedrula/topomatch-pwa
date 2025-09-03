<template>
  <div class="video-frame-matcher-component">
    <!-- Video File Selection -->
    <div v-if="!selectedVideo" class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div class="text-center">
        <svg
          class="w-12 h-12 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          ></path>
        </svg>
        <div class="mb-4">
          <h4 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h4>
          <p class="text-sm text-gray-500">{{ subtitle }}</p>
        </div>

        <!-- File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          @change="handleVideoSelect"
          class="hidden"
        />

        <button
          type="button"
          @click="$refs.fileInput.click()"
          :disabled="isProcessing"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Choose Video File
        </button>

        <p class="text-xs text-gray-500 mt-2">MP4, WebM, MOV up to 100MB</p>
      </div>
    </div>

    <!-- Video Selected and Processing -->
    <div v-else class="space-y-6">
      <!-- Video Info -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg
              class="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
            <div>
              <h3 class="text-sm font-medium text-gray-900">{{ selectedVideo.name }}</h3>
              <p class="text-xs text-gray-500">{{ formatFileSize(selectedVideo.size) }}</p>
            </div>
          </div>
          <button @click="clearVideo" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Processing Status -->
      <div v-if="isProcessing" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div>
            <h4 class="text-sm font-medium text-blue-900">{{ processingStatus }}</h4>
            <p class="text-xs text-blue-700 mt-1">{{ processingDetails }}</p>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            ></path>
          </svg>
          <div>
            <h4 class="text-sm font-medium text-red-900">Processing Error</h4>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Pose Detection Summary -->
      <div v-if="extractedFrames.length > 0 && !isProcessing" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-2">Pose Detection Summary</h4>
        <div class="text-sm text-gray-600">
          <p>Successful detections: {{ extractedFrames.filter(f => f.poseData).length }} / {{ extractedFrames.length }} frames</p>
          <div v-if="extractedFrames.some(f => f.poseError)" class="mt-2">
            <p class="text-red-600 font-medium">Common issues found:</p>
            <ul class="list-disc list-inside mt-1 space-y-1">
              <li v-for="error in uniquePoseErrors" :key="error" class="text-red-600">{{ error }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Extracted Frames -->
      <div v-if="extractedFrames.length > 0" class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Extracted Frames with Pose Data</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="(frame, index) in extractedFrames"
            :key="index"
            class="bg-white border rounded-lg p-3"
          >
            <div class="flex items-center space-x-3">
              <img
                :src="frame.url"
                alt="Extracted frame"
                class="w-20 h-20 object-cover rounded border"
              />
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900">Frame {{ index + 1 }}</h4>
                <p class="text-xs text-gray-500">
                  {{ Math.round(frame.percentage * 100) }}% through video
                </p>
                <p class="text-xs text-gray-500" v-if="frame.poseData">
                  Pose detected ({{ frame.poseData.confidence.toFixed(2) }} confidence)
                </p>
                <p class="text-xs text-red-500" v-else-if="frame.poseError">
                  {{ frame.poseError }}
                </p>
                <p class="text-xs text-red-500" v-else>No pose detected!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Matching Results -->
      <div v-if="bestMatch" class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Best Matching Image</h3>
        <div class="bg-white border rounded-lg p-4">
          <div class="flex items-center space-x-4 mb-4">
            <img
              :src="bestMatch.url"
              alt="Best match"
              class="w-24 h-24 object-cover rounded border"
            />
            <div>
              <h4 class="text-sm font-medium text-gray-900">{{ bestMatch.name }}</h4>
              <p class="text-xs text-gray-500">
                {{ matchedImageBoulderProblems.length }} boulder problems
              </p>
            </div>
          </div>

          <!-- Pose Visualization -->
          <div v-if="transformedPoses.length > 0" class="relative">
            <h4 class="text-sm font-medium text-gray-900 mb-2">Climber Pose Projection</h4>
            <div class="relative inline-block">
              <img
                ref="visualizationImage"
                :src="bestMatch.url"
                alt="Pose visualization"
                class="max-w-full h-auto border rounded"
                @load="onImageLoad"
              />
              <canvas
                ref="poseCanvas"
                class="absolute top-0 left-0 pointer-events-none border-2 border-red-500 bg-transparent"
                style="z-index: 10;"
              ></canvas>
            </div>
            <div class="mt-2 text-xs text-gray-600">
              <p>Showing projected hand and foot positions from 3 video frames</p>
              <div class="flex space-x-4 mt-1">
                <span class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  Frame 1 (25%)
                </span>
                <span class="flex items-center">
                  <div class="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  Frame 2 (50%)
                </span>
                <span class="flex items-center">
                  <div class="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  Frame 3 (75%)
                </span>
              </div>
            </div>

            <!-- Keypoints Detail Table -->
            <div class="mt-4">
              <h5 class="text-sm font-medium text-gray-900 mb-2">Detected Keypoints</h5>
              <div class="overflow-x-auto">
                <table class="min-w-full text-xs border border-gray-200 rounded">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-2 py-1 text-left border-b border-gray-200">Frame</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">Keypoint</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">Original Coords</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">
                        Transformed Coords
                      </th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">Confidence</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">1st Closest Hold</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">2nd Closest Hold</th>
                      <th class="px-2 py-1 text-left border-b border-gray-200">3rd Closest Hold</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(frame, frameIndex) in transformedPoses" :key="frameIndex">
                      <tr
                        v-for="(keypoint, keypointIndex) in getKeypointRows(frame)"
                        :key="`${frameIndex}-${keypointIndex}`"
                        class="border-b border-gray-100"
                      >
                        <td class="px-2 py-1">
                          <div class="flex items-center">
                            <div
                              :class="`w-2 h-2 rounded-full mr-1 ${
                                frame.color === 'red'
                                  ? 'bg-red-500'
                                  : frame.color === 'blue'
                                  ? 'bg-blue-500'
                                  : 'bg-green-500'
                              }`"
                            ></div>
                            {{
                              frameIndex === 0
                                ? "Frame 1 (25%)"
                                : frameIndex === 1
                                ? "Frame 2 (50%)"
                                : "Frame 3 (75%)"
                            }}
                          </div>
                        </td>
                        <td class="px-2 py-1 font-medium">{{ keypoint.name }}</td>
                        <td class="px-2 py-1 font-mono text-gray-600">
                          ({{ Math.round(keypoint.original.x) }},
                          {{ Math.round(keypoint.original.y) }})
                        </td>
                        <td class="px-2 py-1 font-mono text-gray-600">
                          ({{ Math.round(keypoint.transformed.x) }},
                          {{ Math.round(keypoint.transformed.y) }})
                        </td>
                        <td class="px-2 py-1">
                          <span
                            :class="`px-1 py-0.5 rounded text-xs ${
                              keypoint.confidence > 0.7
                                ? 'bg-green-100 text-green-800'
                                : keypoint.confidence > 0.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`"
                          >
                            {{ (keypoint.confidence * 100).toFixed(0) }}%
                          </span>
                        </td>
                        <td class="px-2 py-1">
                          <div v-if="keypoint.closestProblem" class="text-xs">
                            <div class="font-medium text-gray-900">
                              {{ keypoint.closestProblem.name }}
                            </div>
                            <div class="text-gray-500">
                              Hold #{{
                                keypoint.closestHold?.holdIndex || keypoint.closestHold?.id || "?"
                              }}
                            </div>
                            <div class="text-gray-400">{{ keypoint.distanceToHold }}px away</div>
                            <div class="text-green-600 font-medium">
                              Score: {{ keypoint.closestScore.toFixed(3) }}
                            </div>
                          </div>
                          <div v-else class="text-xs text-gray-400">No holds found</div>
                        </td>
                        <td class="px-2 py-1">
                          <div v-if="keypoint.secondClosestProblem" class="text-xs">
                            <div class="font-medium text-gray-900">
                              {{ keypoint.secondClosestProblem.name }}
                            </div>
                            <div class="text-gray-500">
                              Hold #{{
                                keypoint.secondClosestHold?.holdIndex || keypoint.secondClosestHold?.id || "?"
                              }}
                            </div>
                            <div class="text-gray-400">{{ keypoint.secondClosestDistance }}px away</div>
                            <div class="text-blue-600 font-medium">
                              Score: {{ keypoint.secondClosestScore.toFixed(3) }}
                            </div>
                          </div>
                          <div v-else class="text-xs text-gray-400">-</div>
                        </td>
                        <td class="px-2 py-1">
                          <div v-if="keypoint.thirdClosestProblem" class="text-xs">
                            <div class="font-medium text-gray-900">
                              {{ keypoint.thirdClosestProblem.name }}
                            </div>
                            <div class="text-gray-500">
                              Hold #{{
                                keypoint.thirdClosestHold?.holdIndex || keypoint.thirdClosestHold?.id || "?"
                              }}
                            </div>
                            <div class="text-gray-400">{{ keypoint.thirdClosestDistance }}px away</div>
                            <div class="text-orange-600 font-medium">
                              Score: {{ keypoint.thirdClosestScore.toFixed(3) }}
                            </div>
                          </div>
                          <div v-else class="text-xs text-gray-400">-</div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Original coordinates are from the video frame. Transformed coordinates are projected
                onto the boulder image using homography.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Matcher Component -->
      <ImageMatcher
        v-if="extractedFrames.length > 0 && comparisonImages.length > 0"
        :source-image="extractedFrames[1]?.file"
        :comparison-images="comparisonImages"
        :auto-start="autoStartMatching"
        @match-found="handleMatchFound"
        @analysis-complete="handleAnalysisComplete"
        @analysis-error="handleAnalysisError"
      />

      <!-- No Comparison Images Warning -->
      <div
        v-if="extractedFrames.length > 0 && comparisonImages.length === 0"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
      >
        <div class="flex items-start space-x-3">
          <svg
            class="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h4 class="text-sm font-medium text-yellow-900">No Comparison Images</h4>
            <p class="text-sm text-yellow-700 mt-1">
              No images available for comparison. Add some boulder problem images to enable matching
              analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import ImageMatcher from './ImageMatcher.vue';
import { validateVideoFile } from '@/utils/videoFrameUtils';
import {
  extractVideoFrames,
  calculateHomographyMatrix,
  transformPoints,
} from '@/utils/homographyUtils';
import { usePoseDetection } from '@/composables/usePoseDetection';
import { useInferenceStore } from '@/stores/inferenceStore';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';

// Props
defineProps({
  comparisonImages: {
    type: Array,
    default: () => [],
  },
  locationId: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: 'Upload Beta Video',
  },
  subtitle: {
    type: String,
    default: 'Upload a climbing video to analyze your movement and match against reference images',
  },
  autoStartMatching: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'video-selected',
  'frames-extracted',
  'pose-detected',
  'match-found',
  'analysis-complete',
  'processing-error',
  'video-cleared',
]);

// Reactive state
const fileInput = ref(null);
const selectedVideo = ref(null);
const extractedFrames = ref([]);
const isProcessing = ref(false);
const processingStatus = ref('');
const processingDetails = ref('');
const error = ref(null);
const bestMatch = ref(null);
const transformedPoses = ref([]);
const visualizationImage = ref(null);
const poseCanvas = ref(null);
const visualizationDimensions = ref({ width: 0, height: 0 });
const isDrawing = ref(false); // Add flag to prevent concurrent drawing

// Store instances
const boulderProblemsStore = useBoulderProblemsStore();

// Get boulder problems for the matched image
const matchedImageBoulderProblems = computed(() => {
  if (!bestMatch.value?.id) return [];
  // Use the same filtering logic as LocationDetailView that works
  return boulderProblemsStore.boulderProblems.filter(
    (problem) => problem.imageId === bestMatch.value.id
  );
});

// Computed property for unique pose errors
const uniquePoseErrors = computed(() => {
  const errors = extractedFrames.value
    .filter(f => f.poseError)
    .map(f => f.poseError);
  return [...new Set(errors)]; // Remove duplicates
});

// Use the working pose detection composable
const { runPoseDetection, poseResults, sessionReady, isAnalyzing, error: poseDetectionError } = usePoseDetection();

// Watch for pose detection errors and display them
watch(poseDetectionError, (newError) => {
  if (newError) {
    console.error('Pose detection initialization error:', newError);
    error.value = newError;
  }
});

// Frame timestamps for extraction (25%, 50%, 75%)
const FRAME_TIMESTAMPS = [0.25, 0.5, 0.75];

// Colors for different frames
const FRAME_COLORS = ['#ef4444', '#3b82f6', '#22c55e']; // red, blue, green

// Methods
const findClosestHolds = (keypointX, keypointY) => {
  if (!bestMatch.value || !bestMatch.value.name) {
    return { 
      closest: { hold: null, problem: null, distance: Infinity, score: 0 },
      secondClosest: { hold: null, problem: null, distance: Infinity, score: 0 },
      thirdClosest: { hold: null, problem: null, distance: Infinity, score: 0 }
    };
  }

  // Get all boulder problems for the matched image
  const matchedImageId = bestMatch.value.id;
  const proximityThreshold = 300; // Doubled threshold for wider matching range

  const problemsForImage = boulderProblemsStore.boulderProblems.filter(
    (problem) => problem.imageId === matchedImageId
  );

  const allHoldsWithDistances = [];

  // Check all holds across all problems for this image
  problemsForImage.forEach((problem) => {
    if (problem.holds && Array.isArray(problem.holds)) {
      problem.holds.forEach((holdData, index) => {
        const hold = holdData.hold;

        // Extract hold coordinates - handle different possible formats (same logic as runHoldAnalysis)
        let holdX, holdY;

        if (hold.coordinates) {
          holdX = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
          holdY = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
        } else if (hold.bbox && Array.isArray(hold.bbox)) {
          holdX = hold.bbox[0] + hold.bbox[2] / 2;
          holdY = hold.bbox[1] + hold.bbox[3] / 2;
        } else if (hold.x !== undefined && hold.y !== undefined) {
          holdX = hold.x + (hold.width || 0) / 2;
          holdY = hold.y + (hold.height || 0) / 2;
        } else if (hold.center_x !== undefined && hold.center_y !== undefined) {
          holdX = hold.center_x;
          holdY = hold.center_y;
        } else {
          console.warn('Unknown hold coordinate format:', hold);
          return; // Skip this hold
        }

        // Calculate Euclidean distance
        const distance = Math.sqrt(Math.pow(keypointX - holdX, 2) + Math.pow(keypointY - holdY, 2));
        
        // Calculate potential score (without keypoint weighting and confidence for now)
        const score = distance <= proximityThreshold ? 
          Math.round(((proximityThreshold - distance) / proximityThreshold) * 1000) / 1000 : 0;

        allHoldsWithDistances.push({
          hold: {
            ...hold,
            holdIndex: holdData.holdIndex || index,
            id: hold.id || `hold_${index}`,
          },
          problem: problem,
          distance: Math.round(distance),
          score: score
        });
      });
    }
  });

  // Sort by distance and get top 3
  allHoldsWithDistances.sort((a, b) => a.distance - b.distance);
  
  const closest = allHoldsWithDistances[0] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const secondClosest = allHoldsWithDistances[1] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const thirdClosest = allHoldsWithDistances[2] || { hold: null, problem: null, distance: Infinity, score: 0 };

  return { closest, secondClosest, thirdClosest };
};

const getKeypointRows = (frame) => {
  const keypointNames = ['Left Wrist', 'Right Wrist', 'Left Ankle', 'Right Ankle'];
  const keypointData = [];

  // Get confidence values from the original pose data
  const originalFrame = extractedFrames.value[frame.frameIndex];
  const poseKeypoints = originalFrame?.poseData?.keypoints;

  if (frame.originalPoints && frame.transformedPoints) {
    frame.originalPoints.forEach((originalPoint, index) => {
      if (index < keypointNames.length) {
        // Get confidence for this specific keypoint
        let confidence = 0.5; // default
        if (poseKeypoints) {
          switch (index) {
            case 0:
              confidence = poseKeypoints.leftWrist?.confidence || 0;
              break;
            case 1:
              confidence = poseKeypoints.rightWrist?.confidence || 0;
              break;
            case 2:
              confidence = poseKeypoints.leftAnkle?.confidence || 0;
              break;
            case 3:
              confidence = poseKeypoints.rightAnkle?.confidence || 0;
              break;
          }
        }

        // Find the closest, second closest, and third closest holds for this keypoint
        const holdsInfo = findClosestHolds(
          frame.transformedPoints[index].x,
          frame.transformedPoints[index].y
        );

        keypointData.push({
          name: keypointNames[index],
          original: originalPoint,
          transformed: frame.transformedPoints[index],
          confidence: confidence,
          closestHold: holdsInfo.closest.hold,
          closestProblem: holdsInfo.closest.problem,
          distanceToHold: holdsInfo.closest.distance,
          closestScore: holdsInfo.closest.score,
          // Add second and third closest data
          secondClosestHold: holdsInfo.secondClosest.hold,
          secondClosestProblem: holdsInfo.secondClosest.problem,
          secondClosestDistance: holdsInfo.secondClosest.distance,
          secondClosestScore: holdsInfo.secondClosest.score,
          thirdClosestHold: holdsInfo.thirdClosest.hold,
          thirdClosestProblem: holdsInfo.thirdClosest.problem,
          thirdClosestDistance: holdsInfo.thirdClosest.distance,
          thirdClosestScore: holdsInfo.thirdClosest.score,
        });
      }
    });
  }

  return keypointData;
};

const handleVideoSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Clear previous state
  clearState();

  // Validate video file
  const validation = validateVideoFile(file);
  if (!validation.isValid) {
    error.value = validation.errors.join(', ');
    return;
  }

  // Set selected video
  selectedVideo.value = file;
  emit('video-selected', file);

  // Start processing pipeline
  await processVideo();

  // Clear the input so the same file can be selected again
  event.target.value = '';
};

const processVideo = async () => {
  try {
    isProcessing.value = true;
    error.value = null;

    // Step 1: Extract frames
    processingStatus.value = 'Extracting video frames...';
    processingDetails.value = `Extracting frames at ${FRAME_TIMESTAMPS.map(
      (t) => t * 100 + '%'
    ).join(', ')}`;

    const frames = await extractVideoFrames(selectedVideo.value, FRAME_TIMESTAMPS);

    // Convert frames to display format
    const processedFrames = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const file = await createFileFromImageData(frame.imageData, `frame_${i + 1}.jpg`);
      const url = createImageUrlFromImageData(frame.imageData);

      processedFrames.push({
        ...frame,
        file,
        url,
      });
    }

    extractedFrames.value = processedFrames;

    emit('frames-extracted', extractedFrames.value);

    // Step 2: Run pose detection on each frame
    processingStatus.value = 'Detecting poses...';

    for (let i = 0; i < extractedFrames.value.length; i++) {
      processingDetails.value = `Analyzing pose in frame ${i + 1} of ${
        extractedFrames.value.length
      }`;

      try {
        const poseResult = await extractPoseKeypoints(frames[i].imageData);
        
        if (poseResult && poseResult.error) {
          // Pose detection failed with specific error
          extractedFrames.value[i].poseData = null;
          extractedFrames.value[i].poseError = poseResult.message;
          console.warn(`Frame ${i + 1} pose detection failed:`, poseResult.message);
        } else if (poseResult) {
          // Pose detection succeeded
          extractedFrames.value[i].poseData = poseResult;
          extractedFrames.value[i].poseError = null;
        } else {
          // No poses found (not an error)
          extractedFrames.value[i].poseData = null;
          extractedFrames.value[i].poseError = 'No person visible in frame';
        }
      } catch (err) {
        // Unexpected error in pose detection
        console.error(`Unexpected error in frame ${i + 1}:`, err);
        extractedFrames.value[i].poseData = null;
        extractedFrames.value[i].poseError = `Detection failed: ${err.message}`;
      }

      // Add small delay and memory cleanup hint for mobile devices
      if (i < extractedFrames.value.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between frames
        
        // Suggest garbage collection on mobile (helps with memory pressure)
        if (typeof window !== 'undefined' && window.gc) {
          window.gc();
        }
      }
    }

    // Check if we got any successful pose detections
    const successfulDetections = extractedFrames.value.filter(f => f.poseData).length;
    const totalFrames = extractedFrames.value.length;
    
    console.log(`Pose detection summary: ${successfulDetections}/${totalFrames} frames successful`);

    emit(
      'pose-detected',
      extractedFrames.value.map((f) => f.poseData)
    );

    processingStatus.value = 'Ready for image matching';
    if (successfulDetections === 0) {
      processingDetails.value = 'No poses detected in any frame - try better lighting or positioning';
    } else if (successfulDetections < totalFrames) {
      processingDetails.value = `Poses detected in ${successfulDetections}/${totalFrames} frames`;
    } else {
      processingDetails.value = 'Frames extracted and poses detected successfully';
    }
  } catch (err) {
    console.error('Video processing error:', err);
    error.value = 'Failed to process video: ' + err.message;
    emit('processing-error', err);
  } finally {
    isProcessing.value = false;
  }
};

// Pose detection function using the working composable
const extractPoseKeypoints = async (imageData) => {
  try {
    // Check if there's a pose detection error first
    if (poseDetectionError.value) {
      throw new Error(`Pose detection system error: ${poseDetectionError.value}`);
    }

    // Wait for pose detection session to be ready
    if (!sessionReady.value) {
      console.log('Waiting for pose detection session to be ready...');
      const maxWait = 30000; // 30 seconds
      const startTime = Date.now();
      
      // Wait a bit for session to initialize
      await new Promise((resolve, reject) => {
        const checkReady = () => {
          if (sessionReady.value) {
            resolve();
          } else if (poseDetectionError.value) {
            reject(new Error(`Pose detection initialization failed: ${poseDetectionError.value}`));
          } else if (Date.now() - startTime > maxWait) {
            reject(new Error('Pose detection session initialization timed out'));
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    // Convert ImageData to File (which is what runPoseDetection expects)
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to blob then to file
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    const imageFile = new File([blob], 'frame.jpg', { type: 'image/jpeg' });

    // Run pose detection using the working composable
    await runPoseDetection(imageFile);

    // Wait for results
    while (isAnalyzing.value) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (poseResults.value && poseResults.value.length > 0) {
      const firstPose = poseResults.value[0];

      // Helper function to safely extract keypoint or return default
      const getKeypoint = (index) => {
        const kp = firstPose.keypoints[index];
        return kp && kp.x !== undefined && kp.y !== undefined && kp.confidence !== undefined
          ? kp
          : { x: 0, y: 0, confidence: 0 };
      };

      // Convert to the format expected by the UI
      return {
        keypoints: {
          leftWrist: getKeypoint(9), // left wrist
          rightWrist: getKeypoint(10), // right wrist
          leftAnkle: getKeypoint(15), // left ankle
          rightAnkle: getKeypoint(16), // right ankle
        },
        // Add full keypoints array for debugging
        allKeypoints: firstPose.keypoints || [],
        confidence: firstPose.confidence || 0,
      };
    } else {
      // Return null instead of throwing - let the caller handle this gracefully
      return null;
    }
  } catch (error) {
    console.error('Pose detection failed:', error);
    // Return error information instead of throwing
    return {
      error: true,
      message: error.message || 'Unknown pose detection error',
      details: error.stack ? error.stack.split('\n')[0] : 'No additional details'
    };
  }
};

const handleMatchFound = async (matchedImage) => {
  // Calculate homography matrix for the matched image
  try {
    // Check if OpenCV is loaded
    if (!window.cv) {
      console.warn('⚠️ OpenCV.js not loaded yet, skipping homography calculation');
      emit('match-found', {
        video: selectedVideo.value,
        frames: extractedFrames.value,
        match: matchedImage,
      });
      return;
    }

    const inferenceStore = useInferenceStore();
    const matchUrl = matchedImage.url;
    const inferenceResult = inferenceStore.inferenceResults[matchUrl];

    if (inferenceResult && inferenceResult.rawData) {
      // Extract matching points from inference results
      const matches = [];
      const rawData = inferenceResult.rawData;
      const maxMatches = Math.min(rawData.matches.dims[0], 100);

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

      if (matches.length >= 4) {
        const homographyResult = await calculateHomographyMatrix(matches);

        // Add homography matrix to the matched image
        matchedImage.homographyMatrix = homographyResult.matrix;
        matchedImage.homographyInliers = homographyResult.inliers;
      } else {
        console.warn('Not enough matches for homography calculation:', matches.length);
      }
    } else {
      console.warn('⚠️ No inference results found for matched image:', matchUrl);
    }
  } catch (error) {
    console.error('❌ Error calculating homography for match:', error);
  }

  emit('match-found', {
    video: selectedVideo.value,
    frames: extractedFrames.value,
    match: matchedImage,
  });
};

const handleAnalysisComplete = async (bestMatchResult) => {
  bestMatch.value = bestMatchResult;

  // Step 3: Get inference results and calculate homography matrix
  try {
    // Check if OpenCV is loaded
    if (!window.cv) {
      console.warn(
        '⚠️ OpenCV.js not loaded yet, skipping homography calculation for analysis complete'
      );
      emit('analysis-complete', {
        video: selectedVideo.value,
        frames: extractedFrames.value,
        match: bestMatchResult,
      });
      return;
    }

    const inferenceStore = useInferenceStore();
    const matchUrl = bestMatchResult.url;
    const inferenceResult = inferenceStore.inferenceResults[matchUrl];

    if (inferenceResult && inferenceResult.rawData) {
      // Extract matching points from inference results
      const matches = [];
      const rawData = inferenceResult.rawData;
      const maxMatches = Math.min(rawData.matches.dims[0], 100); // Limit for performance

      // SuperPoint/LightGlue uses 256x256 inference size - need to scale keypoints back to original image coordinates
      const inferenceSize = 256; // From inferenceWorker.js: imgWidth = imgHeight = 256

      // Get original image dimensions from inference result
      const userImageDims = inferenceResult.userImageDims || {
        width: inferenceSize,
        height: inferenceSize,
      };
      const topoImageDims = inferenceResult.topoImageDims || {
        width: inferenceSize,
        height: inferenceSize,
      };

      // Calculate scaling factors
      const userScaleX = userImageDims.width / inferenceSize;
      const userScaleY = userImageDims.height / inferenceSize;
      const topoScaleX = topoImageDims.width / inferenceSize;
      const topoScaleY = topoImageDims.height / inferenceSize;

      for (let i = 0; i < maxMatches; i++) {
        const matchBaseIndex = i * rawData.matches.dims[1];
        const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
        const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

        // Raw keypoints in 256x256 inference coordinate space
        const x0_raw = Number(rawData.keypoints.cpuData[img0Idx * 2]);
        const y0_raw = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
        const x1_raw = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]);
        const y1_raw = Number(
          rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]
        );

        // Scale keypoints back to original image coordinate space
        const x0 = x0_raw * userScaleX;
        const y0 = y0_raw * userScaleY;
        const x1 = x1_raw * topoScaleX;
        const y1 = y1_raw * topoScaleY;

        matches.push({
          point1: { x: x0, y: y0 },
          point2: { x: x1, y: y1 },
        });
      }

      if (matches.length >= 4) {
        const homographyResult = await calculateHomographyMatrix(matches);

        // Add homography matrix to the match result
        bestMatchResult.homographyMatrix = homographyResult.matrix;
        bestMatchResult.homographyInliers = homographyResult.inliers;
      } else {
        console.warn('Not enough matches for homography calculation:', matches.length);
      }
    } else {
      console.warn('No inference results found for matched image:', matchUrl);
    }
  } catch (error) {
    console.error('Error calculating homography:', error);
  }

  emit('analysis-complete', {
    video: selectedVideo.value,
    frames: extractedFrames.value,
    match: bestMatchResult,
  });

  // Step 4: Transform poses if homography is available
  if (bestMatchResult && bestMatchResult.homographyMatrix) {
    await transformPosesToMatchedImage(bestMatchResult);
  }
};

const transformPosesToMatchedImage = async (matchResult) => {
  try {
    processingStatus.value = 'Transforming poses to matched image...';
    isProcessing.value = true;

    const { homographyMatrix } = matchResult;
    const transformedFrames = [];

    for (let i = 0; i < extractedFrames.value.length; i++) {
      const frame = extractedFrames.value[i];
      if (!frame.poseData) continue;

      const pose = frame.poseData.keypoints;

      // Extract wrist and ankle points
      const sourcePoints = [
        { x: pose.leftWrist.x, y: pose.leftWrist.y },
        { x: pose.rightWrist.x, y: pose.rightWrist.y },
        { x: pose.leftAnkle.x, y: pose.leftAnkle.y },
        { x: pose.rightAnkle.x, y: pose.rightAnkle.y },
      ];

      // Transform points using homography
      const transformedPoints = transformPoints(sourcePoints, homographyMatrix);

      transformedFrames.push({
        frameIndex: i,
        originalPoints: sourcePoints,
        transformedPoints,
        color: FRAME_COLORS[i],
        confidence: frame.poseData.confidence,
      });
    }

    transformedPoses.value = transformedFrames;

    // Trigger visualization redraw
    await nextTick();
    // Use setTimeout to ensure image is fully rendered before drawing
    setTimeout(() => {
      drawPoseVisualization();
    }, 200);
  } catch (err) {
    console.error('Pose transformation error:', err);
    error.value = 'Failed to transform poses: ' + err.message;
  } finally {
    isProcessing.value = false;
  }
};

const drawPoseVisualization = () => {
  // Prevent concurrent drawing calls
  if (isDrawing.value) {
    return;
  }
  
  isDrawing.value = true;
  
  if (!visualizationImage.value || !poseCanvas.value || transformedPoses.value.length === 0) {
    console.warn('Pose visualization skipped:', {
      hasVisualizationImage: !!visualizationImage.value,
      hasPoseCanvas: !!poseCanvas.value,
      transformedPosesLength: transformedPoses.value.length
    });
    isDrawing.value = false;
    return;
  }

  const img = visualizationImage.value;
  const canvas = poseCanvas.value;
  const ctx = canvas.getContext('2d');

  // Check if image is properly loaded
  if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
    console.warn('Image not fully loaded yet, skipping pose visualization');
    isDrawing.value = false;
    return;
  }

  // Set canvas size to match image EXACTLY
  canvas.width = img.clientWidth;
  canvas.height = img.clientHeight;
  
  // Also set the CSS dimensions to match
  canvas.style.width = img.clientWidth + 'px';
  canvas.style.height = img.clientHeight + 'px';

  visualizationDimensions.value = {
    width: img.clientWidth,
    height: img.clientHeight,
  };

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate scale factors
  const scaleX = img.clientWidth / img.naturalWidth;
  const scaleY = img.clientHeight / img.naturalHeight;

  // Validate scale factors
  if (isNaN(scaleX) || isNaN(scaleY) || !isFinite(scaleX) || !isFinite(scaleY) || scaleX <= 0 || scaleY <= 0) {
    console.error('Invalid scale factors, aborting pose visualization');
    isDrawing.value = false;
    return;
  }

  // Draw poses for each frame
  transformedPoses.value.forEach((frame, index) => {
    const { transformedPoints, color } = frame;

    if (transformedPoints.length !== 4) {
      console.warn(`Frame ${index} has ${transformedPoints.length} points, expected 4`);
      return;
    }

    // Scale points to display size
    const scaledPoints = transformedPoints.map((point) => ({
      x: point.x * scaleX,
      y: point.y * scaleY,
    }));

    // Validate scaled points
    const validPoints = scaledPoints.filter(p => 
      !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y)
    );

    if (validPoints.length !== scaledPoints.length) {
      console.warn(`Frame ${index} has invalid points, skipping`);
      return;
    }

    // Draw with high visibility
    ctx.save();

    // Draw wrists (first two points)
    scaledPoints.slice(0, 2).forEach((point, pointIndex) => {
      
      // Draw large, visible circles for wrists
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      
      // White outline
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Colored fill
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Label
      ctx.fillStyle = 'black';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`H${pointIndex + 1}`, point.x + 15, point.y);
    });

    // Draw ankles (last two points)
    scaledPoints.slice(2, 4).forEach((point, pointIndex) => {
      
      // Draw large, visible squares for ankles
      ctx.fillStyle = color;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      
      // White outline
      ctx.strokeRect(point.x - 10, point.y - 10, 20, 20);
      
      // Colored fill
      ctx.fillRect(point.x - 8, point.y - 8, 16, 16);

      // Label
      ctx.fillStyle = 'black';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`F${pointIndex + 1}`, point.x + 15, point.y);
    });

    // Draw connecting lines
    if (scaledPoints.length === 4) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      
      // Connect wrists
      ctx.beginPath();
      ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
      ctx.lineTo(scaledPoints[1].x, scaledPoints[1].y);
      ctx.stroke();

      // Connect ankles
      ctx.beginPath();
      ctx.moveTo(scaledPoints[2].x, scaledPoints[2].y);
      ctx.lineTo(scaledPoints[3].x, scaledPoints[3].y);
      ctx.stroke();
    }

    ctx.restore();
  });

  isDrawing.value = false;
};

// New function to handle image load and ensure proper timing
const onImageLoad = async () => {
  await nextTick();
  setTimeout(() => {
    drawPoseVisualization();
  }, 100); // Small delay to ensure everything is rendered
};

const handleAnalysisError = (analysisError) => {
  error.value = 'Image analysis failed: ' + analysisError.message;
  emit('processing-error', analysisError);
};

const clearVideo = () => {
  clearState();
  emit('video-cleared');
};

const clearState = () => {
  selectedVideo.value = null;
  extractedFrames.value = [];
  isProcessing.value = false;
  processingStatus.value = '';
  processingDetails.value = '';
  error.value = null;
  bestMatch.value = null;
  transformedPoses.value = [];

  // Clean up any object URLs
  extractedFrames.value.forEach((frame) => {
    if (frame.url) {
      URL.revokeObjectURL(frame.url);
    }
  });
};

// Utility functions
const createFileFromImageData = async (imageData, fileName) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.8
    );
  });
};

const createImageUrlFromImageData = (imageData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
};

const formatFileSize = (bytes) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Expose methods for parent component
defineExpose({
  clearVideo,
  processVideo,
});
</script>

<style scoped>
/* Enhanced video frame matcher component styles */
.video-frame-matcher-component {
  width: 100%;
}
</style>
