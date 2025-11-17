<template>
  <div class="video-frame-matcher-component">
    <!-- Fixed Debug Button (Bottom Right) -->
    <button
      v-if="selectedVideo"
      @click="debugMode = !debugMode"
      class="fixed bottom-4 right-4 z-50 text-lg px-3 py-2 rounded-lg shadow-lg transition-all hover:scale-105"
      :class="debugMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'"
      title="Toggle debug information"
    >
      �
    </button>

    <!-- Video Upload/Record Selector -->
    <VideoUploadSelector
      v-if="!selectedVideo"
      :title="title"
      :subtitle="subtitle"
      :is-disabled="isProcessing"
      @video-selected="handleVideoSelected"
    />

    <!-- Video Selected and Processing -->
    <div v-else class="space-y-6">
      <!-- Video Info -->
      <div v-if="debugMode" class="bg-gray-50 rounded-lg p-4">
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
        </div>
      </div>

      <!-- Processing Status -->
      <div v-if="isProcessing && debugMode" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

      <!-- Concise Pose Detection Status -->
      <div v-if="extractedFrames.length > 0 && !isProcessing" class="text-sm text-gray-600 px-1 py-2">
        <!-- Success message only shown in debug mode -->
        <span v-if="debugMode && extractedFrames.filter(f => f.poseData).length === extractedFrames.length" class="text-green-600">
          ✓ All {{ extractedFrames.length }} frames analyzed successfully
        </span>
        <!-- Warning messages always shown -->
        <span v-if="extractedFrames.filter(f => f.poseData).length === 0" class="text-red-600">
          ⚠ No poses detected in {{ extractedFrames.length }} frames
        </span>
        <span v-else-if="extractedFrames.filter(f => f.poseData).length < extractedFrames.length" class="text-yellow-600">
          ⚠ {{ extractedFrames.filter(f => f.poseData).length }}/{{ extractedFrames.length }} frames detected
        </span>
      </div>

      <!-- Extracted Frames Debug Section -->
      <div v-if="debugMode && extractedFrames.length > 0" class="bg-gray-50 rounded-lg p-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-3">
          Extracted Frames ({{ extractedFrames.length }})
          <span v-if="bestFrameForMatching" class="text-xs text-blue-600 ml-2">
            ⭐ Frame {{ extractedFrames.indexOf(bestFrameForMatching) + 1 }} selected for matching
          </span>
        </h4>
        <div v-if="framesUsedForTransformation.length > 0" class="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-xs">
          <span class="font-semibold text-blue-900">📊 Frame used for hold detection:</span>
          <span class="text-blue-700 ml-2">
            {{ framesUsedForTransformation.map(i => `Frame ${i + 1}`).join(', ') }}
          </span>
          <span class="text-blue-600 ml-2">(Single best frame - camera movement optimization)</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="(frame, index) in extractedFrames"
            :key="index"
            class="relative group"
          >
            <div
              :class="[
                'border-2 rounded overflow-hidden transition-all relative',
                frame === bestFrameForMatching ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
              ]"
            >
              <!-- Base image -->
              <img
                v-if="frame.url"
                :src="frame.url"
                :alt="`Frame ${index + 1}`"
                class="w-full h-auto object-cover"
                crossorigin="anonymous"
              />
              <div v-else class="w-full h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                No preview
              </div>
              
              <!-- Pose keypoints overlay -->
              <svg
                v-if="frame.url && frame.poseData && frame.imageData"
                class="absolute inset-0 pointer-events-none"
                :viewBox="`0 0 ${frame.imageData.width} ${frame.imageData.height}`"
                preserveAspectRatio="none"
              >
                <!-- Left Wrist (Red) -->
                <circle
                  v-if="frame.poseData.keypoints.leftWrist"
                  :cx="frame.poseData.keypoints.leftWrist.x"
                  :cy="frame.poseData.keypoints.leftWrist.y"
                  r="8"
                  fill="#ef4444"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.leftWrist.confidence"
                />
                <!-- Right Wrist (Blue) -->
                <circle
                  v-if="frame.poseData.keypoints.rightWrist"
                  :cx="frame.poseData.keypoints.rightWrist.x"
                  :cy="frame.poseData.keypoints.rightWrist.y"
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.rightWrist.confidence"
                />
                <!-- Left Ankle (Green) -->
                <circle
                  v-if="frame.poseData.keypoints.leftAnkle"
                  :cx="frame.poseData.keypoints.leftAnkle.x"
                  :cy="frame.poseData.keypoints.leftAnkle.y"
                  r="8"
                  fill="#22c55e"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.leftAnkle.confidence"
                />
                <!-- Right Ankle (Amber) -->
                <circle
                  v-if="frame.poseData.keypoints.rightAnkle"
                  :cx="frame.poseData.keypoints.rightAnkle.x"
                  :cy="frame.poseData.keypoints.rightAnkle.y"
                  r="8"
                  fill="#f59e0b"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.rightAnkle.confidence"
                />
              </svg>
            </div>
            <div class="mt-1 text-xs text-center">
              <div class="font-medium text-gray-700">Frame {{ index + 1 }}</div>
              <div v-if="frame.poseData" class="text-green-600">✓ Pose detected</div>
              <div v-else-if="frame.poseError" class="text-red-600">✗ {{ frame.poseError }}</div>
              <div v-if="frame === bestFrameForMatching" class="text-blue-600 font-semibold">⭐ Best</div>
              <div v-if="framesUsedForTransformation.includes(index)" class="text-purple-600 font-semibold">📊 Used</div>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Left Wrist</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Right Wrist</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Left Ankle</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Right Ankle</span>
          </div>
        </div>
      </div>

      <!-- Video Frames Animator + Ascent Form (shown as soon as frames are extracted) -->
      <div class="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <!-- 🎯 MEMORY OPTIMIZATION: Hide PoseFrameAnimator to save memory -->
        <!-- Keeping 10 full-res frames in memory for animation is expensive (~80-100 MB) -->
        <!-- We only need frames for pose detection, not display -->
        
        <!-- Just show the Ascent Form -->
        <div>
          <AscentForm
            :detected-problem="detectedProblemForForm"
            :top3-scores="top3Scores"
            :is-submitting="isSubmittingAscent"
            @submit="handleAscentFormSubmit"
          />
        </div>
      </div>

      <!-- Image Matching Results -->
      <div v-if="bestMatch" class="space-y-4">
        <div>
          <div v-if="debugMode" class="flex items-center space-x-4 mb-4">
            <img
              :src="bestMatch.url"
              alt="Best match"
              class="w-24 h-24 object-cover rounded border"
              crossorigin="anonymous"
            />
            <div>
              <h4 class="text-sm font-medium text-gray-900">{{ bestMatch.name }}</h4>
              <p class="text-xs text-gray-500">
                {{ matchedImageBoulderProblems.length }} boulder problems
              </p>
            </div>
          </div>

          <!-- Enhanced Pose Visualization -->
          <div v-if="transformedPoses.length > 0" class="space-y-4">
            <!-- Homography Quality Visualization -->
            <CollapsibleSection
              v-if="bestMatch.homographyMatrix && debugMode"
              title="Homography Quality Analysis"
              :default-expanded="false"
              class="mt-6"
            >
              <!-- Quality Metrics -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ bestMatch.homographyInliers || 0 }}</div>
                  <div class="text-xs text-gray-600">Inlier Matches</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-600">{{ bestMatch.totalMatches || 0 }}</div>
                  <div class="text-xs text-gray-600">Total Matches</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold" :class="getHomographyQualityColor()">
                    {{ getHomographySuccessRate() }}%
                  </div>
                  <div class="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>

              <!-- Quality Assessment -->
              <div class="mb-3">
                <div class="flex items-center space-x-2">
                  <div :class="`w-3 h-3 rounded-full ${getHomographyQualityColor().replace('text-', 'bg-')}`"></div>
                  <span class="text-sm font-medium">{{ getHomographyQualityMessage() }}</span>
                </div>
                <p class="text-xs text-gray-600 mt-1">
                  Higher success rates (>70%) indicate better homography quality and more reliable keypoint transformations.
                  If success rate is low, keypoint projections may be inaccurate.
                </p>
              </div>

              <!-- Feature Match Distribution Hint -->
              <div class="text-xs text-gray-500 bg-white p-2 rounded border">
                💡 <strong>Tip:</strong> Poor keypoint alignment often indicates that feature matches are concentrated 
                in areas away from where the climber's hands and feet are located, or that the camera perspective 
                differs significantly between the video and reference image.
              </div>
            </CollapsibleSection>

            <!-- Feature Match Visualization -->
            <FeatureMatchVisualization
              v-if="featureMatches.length > 0 && debugMode"
              :source-image-url="bestFrameForMatching?.url"
              :target-image-url="bestMatch.url"
              :feature-matches="featureMatches"
              :homography-inliers="bestMatch.homographyInliers || 0"
              :pose-keypoints="getAllPoseKeypointsArray()"
              :homography-matrix="bestMatch.homographyMatrix"
              :reference-image-dimensions="bestMatch.referenceImageDimensions"
              :detection-space-dimensions="bestMatch.detectionResults?.imageMetadata?.viewBox ? 
                parseViewBoxDimensions(bestMatch.detectionResults.imageMetadata.viewBox) : null"
              :transformed-poses="transformedPoses"
              :extracted-frames="extractedFrames"
              :boulder-problems="matchedImageBoulderProblems"
              :best-match-image="bestMatch"
            />
          </div>
        </div>
      </div>

      <!-- Image Matcher Component -->
      <ImageMatcher
        v-if="bestFrameForMatching && comparisonImages.length > 0 && isPoseDetectionComplete"
        :source-image="bestFrameForMatching.file"
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
import { ref, computed, watch, onUnmounted } from 'vue';
import ImageMatcher from './ImageMatcher.vue';
import VideoUploadSelector from './VideoUploadSelector.vue';
import FeatureMatchVisualization from './FeatureMatchVisualization.vue';
// import PoseFrameAnimator from './PoseFrameAnimator.vue'; // Commented out - hidden for memory optimization
import CollapsibleSection from './CollapsibleSection.vue';
import AscentForm from './AscentForm.vue';
import { validateVideoFile } from '@/utils/videoFrameUtils';
import {
  extractVideoFrames,
  calculateHomographyMatrix,
  transformPoints,
} from '@/utils/homographyUtils';
import { convertProjectedPointsForDistanceCalculation } from '@/utils/coordinateScaling';
import { parseViewBoxDimensions } from '@/utils/coordinateScaling';
import { usePoseDetection } from '@/composables/usePoseDetection';
import { useInferenceStore } from '@/stores/inferenceStore';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { holdDetectionService } from '@/services/holdDetectionService';
import { manualHoldsService } from '@/services/manualHoldsService';
import { calculateProblemScores, formatScore } from '@/utils/problemScoringUtils';
import { 
  extractHoldCoordinates, 
  findClosestHolds,
  getKeypointRows
} from '@/composables/useHoldMatching';

// Props
const props = defineProps({
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
  'table-scores-ready', // New event for table-based problem scores
  'processing-error',
  'ascent-form-submit', // New event for ascent form submission
]);

// 🎯 MEMORY STRATEGY: Keep all frames in memory until cleanup
// Frames are kept so users can toggle debug mode AFTER analysis completes
// Cleanup happens only when: starting new video OR component unmount

// Reactive state
const selectedVideo = ref(null);
const extractedFrames = ref([]);
const isProcessing = ref(false);
const processingStatus = ref('');
const processingDetails = ref('');
const error = ref(null);
const bestMatch = ref(null);
const transformedPoses = ref([]);
const imageNaturalDimensions = ref({ width: 0, height: 0 }); // Track natural image dimensions for SVG
const storedViewBox = ref(null); // Store the viewBox from Firestore
const featureMatches = ref([]); // Store feature match data for visualization

// Ascent submission state
const isSubmittingAscent = ref(false);

// Debug mode state
const debugMode = ref(false);

// Store instances
const boulderProblemsStore = useBoulderProblemsStore();

// Get boulder problems for the matched image
const matchedImageBoulderProblems = computed(() => {
  const imageId = bestMatch.value?.imageId || bestMatch.value?.id;
  
  if (!imageId) return [];
  
  // Use the same filtering logic as LocationDetailView that works
  return boulderProblemsStore.boulderProblems.filter(
    (problem) => problem.imageId === imageId
  );
});

// Check if pose detection is complete and ready for image matching
const isPoseDetectionComplete = computed(() => {
  return processingStatus.value === 'Ready for image matching';
});

// Get frames used for pose transformation (best ± 1)
const framesUsedForTransformation = computed(() => {
  if (!bestFrameForMatching.value || extractedFrames.value.length === 0) return [];
  
  // 🎯 EXTREME OPTIMIZATION: Use ONLY the single best frame (camera movement mitigation)
  const bestIndex = extractedFrames.value.indexOf(bestFrameForMatching.value);
  return bestIndex >= 0 && extractedFrames.value[bestIndex]?.poseData ? [bestIndex] : [];
});

// 🎯 MEMORY OPTIMIZATION: Select single best frame for image matching
// We keep all 10 frames for pose detection/display, but only use ONE for expensive image matching
const bestFrameForMatching = computed(() => {
  if (extractedFrames.value.length === 0) return null;
  
  // Find frame with highest confidence pose detection
  const framesWithPoses = extractedFrames.value.filter(f => f.poseData);
  
  if (framesWithPoses.length === 0) {
    // No poses detected, use first frame as fallback
    return extractedFrames.value[0];
  }
  
  // Select frame with highest average keypoint confidence
  const frameWithBestPose = framesWithPoses.reduce((best, current) => {
    const currentConfidence = Object.values(current.poseData.keypoints || {})
      .filter(kp => kp && typeof kp.confidence === 'number')
      .reduce((sum, kp) => sum + kp.confidence, 0) / 17; // 17 keypoints
    
    const bestConfidence = Object.values(best.poseData.keypoints || {})
      .filter(kp => kp && typeof kp.confidence === 'number')
      .reduce((sum, kp) => sum + kp.confidence, 0) / 17;
    
    return currentConfidence > bestConfidence ? current : best;
  });
  
  console.log(`🎯 Selected frame for image matching: Frame ${extractedFrames.value.indexOf(frameWithBestPose) + 1} (best pose confidence)`);
  return frameWithBestPose;
});

// Detected problem for the ascent form (from top scoring problem)
const detectedProblemForForm = computed(() => {
  if (aggregatedProblemScores.value.length === 0) return null;
  
  const topScore = aggregatedProblemScores.value[0];
  return {
    id: topScore.id,
    name: topScore.name,
    grade: topScore.name.match(/\((.*?)\)/)?.[1] || '', // Extract grade from name if present
    score: topScore.totalScore,
    displayScore: topScore.displayScore
  };
});

// Top 3 scores for ranking display
const top3Scores = computed(() => {
  return aggregatedProblemScores.value.slice(0, 3).map(score => ({
    name: score.name,
    score: score.totalScore,
    displayScore: score.displayScore
  }));
});

// 📊 Calculate problem scores using the shared utility (single source of truth)
const aggregatedProblemScores = computed(() => {
  if (!transformedPoses.value || transformedPoses.value.length === 0) return [];
  if (!matchedImageBoulderProblems.value || matchedImageBoulderProblems.value.length === 0) return [];
  
  // Use the canonical scoring function with local wrapper
  const scores = calculateProblemScores(transformedPoses.value, localGetKeypointRows);
  
  // Format for display compatibility
  return scores.map(problemScore => ({
    id: problemScore.problem.id,
    name: problemScore.problem.name,
    totalScore: problemScore.score,
    displayScore: formatScore(problemScore.score, 'percentage'),
    matchCount: problemScore.matchCount,
    uniqueHoldsCount: problemScore.uniqueHoldsMatched,
    averageScore: problemScore.averageScorePerHold.toFixed(3)
  }));
});

// Compute and display aggregated scores whenever they change
watch(aggregatedProblemScores, (scores) => {
  if (scores.length > 0) {
    // ✅ Emit table scores to parent components
    // This is the CORRECT scoring that should be displayed in the UI
    emit('table-scores-ready', {
      scores: scores, // All scores sorted by best first
      winner: scores[0], // Best match
      allProblems: matchedImageBoulderProblems.value // All problems for context
    });
  }
});

// Homography quality helper methods
const getHomographySuccessRate = () => {
  if (!bestMatch.value?.homographyInliers || !bestMatch.value?.totalMatches) return 0;
  return Math.round((bestMatch.value.homographyInliers / bestMatch.value.totalMatches) * 100);
};

const getHomographyQualityColor = () => {
  const rate = getHomographySuccessRate();
  if (rate >= 70) return 'text-green-600';
  if (rate >= 50) return 'text-yellow-600';
  if (rate >= 30) return 'text-orange-600';
  return 'text-red-600';
};

const getHomographyQualityMessage = () => {
  const rate = getHomographySuccessRate();
  if (rate >= 70) return 'Excellent homography quality - keypoint projections should be very accurate';
  if (rate >= 50) return 'Good homography quality - keypoint projections should be fairly accurate';
  if (rate >= 30) return 'Fair homography quality - keypoint projections may have some inaccuracy';
  return 'Poor homography quality - keypoint projections may be significantly inaccurate';
};

// Use the working pose detection composable
const { runPoseDetection, poseResults, sessionReady, isAnalyzing, error: poseDetectionError } = usePoseDetection();

// Watch for pose detection errors and display them
watch(poseDetectionError, (newError) => {
  if (newError) {
    console.error('Pose detection initialization error:', newError);
    error.value = newError;
  }
});

// Watch for pose visibility changes to debug checkbox behavior

// Frame timestamps for extraction - keep all 10 for good pose detection coverage
const FRAMES_FOR_ANALYSIS = 10;
const FRAME_TIMESTAMPS = FRAMES_FOR_ANALYSIS === 1 
  ? [0.2] // Just extract one frame for debugging
  : [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]; // 10 samples evenly distributed

// Colors for different frames - 10 distinct colors for better visualization
const FRAME_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue  
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red (repeated)
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899'  // pink
];

// Helper function to convert pose keypoints object to array (single frame)
const getPoseKeypointsArray = (poseData) => {
  if (!poseData || !poseData.keypoints) return [];
  
  const keypoints = poseData.keypoints;
  const keypointArray = [];
  
  // Convert object properties to array
  const keypointNames = [
    'leftWrist', 'rightWrist', 
    'leftAnkle', 'rightAnkle',
  ];
  
  for (const name of keypointNames) {
    if (keypoints[name] && keypoints[name].x !== undefined && keypoints[name].y !== undefined) {
      keypointArray.push({
        x: keypoints[name].x,
        y: keypoints[name].y,
        confidence: keypoints[name].confidence || 0,
        name: name
      });
    }
  }
  
  return keypointArray;
};

// Helper function to get ALL pose keypoints from ALL frames
const getAllPoseKeypointsArray = () => {
  const allKeypoints = [];
  
  // Iterate through all extracted frames
  extractedFrames.value.forEach((frame, frameIndex) => {
    if (frame.poseData && frame.poseData.keypoints) {
      const frameKeypoints = getPoseKeypointsArray(frame.poseData);
      
      // Add frame index to each keypoint for identification
      frameKeypoints.forEach(kp => {
        allKeypoints.push({
          ...kp,
          frameIndex: frameIndex,
          // Name will be like "Frame 0 - leftWrist", "Frame 1 - rightAnkle", etc.
          frameName: `Frame ${frameIndex}`
        });
      });
    }
  });
  
  return allKeypoints;
};

// Wrapper functions for the composable that use local refs
// These are needed because the composable functions require parameters but the code expects to call them without params
const localFindClosestHolds = (keypointX, keypointY) => {
  return findClosestHolds(keypointX, keypointY, bestMatch.value, matchedImageBoulderProblems.value);
};

const localGetKeypointRows = (frame) => {
  return getKeypointRows(frame, extractedFrames.value, bestMatch.value, matchedImageBoulderProblems.value);
};

// Handle video selection from VideoUploadSelector component
const handleVideoSelected = async (file) => {
  if (!file) return;

  // Validate video file
  const validation = validateVideoFile(file);
  if (!validation.isValid) {
    error.value = validation.errors.join(', ');
    return;
  }

  // Clear previous state
  clearState();
  
  // Set selected video
  selectedVideo.value = file;
  
  // Reset processing status to prevent early image matching
  processingStatus.value = '';
  bestMatch.value = null;
  transformedPoses.value = [];
  featureMatches.value = [];
  
  emit('video-selected', file);

  // Start processing pipeline
  await processVideo();
};

const processVideo = async () => {
  const totalStartTime = performance.now();
  console.log('🎬 Starting video processing pipeline...');
  
  try {
    isProcessing.value = true;
    error.value = null;

    // 🧹 Clean up old frame URLs before extracting new frames
    // This prevents memory leaks while keeping URLs accessible after analysis completes
    cleanupFrameUrls();
    extractedFrames.value = [];

    // Step 1: Extract frames
    const extractStartTime = performance.now();
    processingStatus.value = 'Extracting video frames...';
    processingDetails.value = `Extracting frames at ${FRAME_TIMESTAMPS.map(
      (t) => t * 100 + '%'
    ).join(', ')}`;

    const frames = await extractVideoFrames(selectedVideo.value, FRAME_TIMESTAMPS);
    const extractTime = performance.now() - extractStartTime;
    console.log(`  ✅ Frame extraction: ${(extractTime / 1000).toFixed(2)}s`);

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
    const poseStartTime = performance.now();
    processingStatus.value = 'Detecting poses...';

    for (let i = 0; i < extractedFrames.value.length; i++) {
      processingDetails.value = `Analyzing pose in frame ${i + 1} of ${
        extractedFrames.value.length
      }`;

      try {
        const poseResult = await extractPoseKeypoints(frames[i].imageData);
        
        // DIAGNOSTIC: Log frame and pose data to detect anomalies
        if (i === 9 || (poseResult?.keypoints?.leftWrist?.y > 640)) {
          console.warn(`🔍 FRAME ${i} DIAGNOSTIC:`, {
            frameIndex: i,
            imageDataDims: `${frames[i].imageData.width}×${frames[i].imageData.height}`,
            leftWristCoords: poseResult?.keypoints?.leftWrist ? 
              `(${poseResult.keypoints.leftWrist.x}, ${poseResult.keypoints.leftWrist.y})` : 'N/A',
            suspicious: poseResult?.keypoints?.leftWrist?.y > 640 ? '⚠️ Y > 640!' : 'OK'
          });
        }
        
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
    const poseTime = performance.now() - poseStartTime;
    console.log(`  ✅ Pose detection: ${(poseTime / 1000).toFixed(2)}s (${successfulDetections}/${totalFrames} frames)`);

    // 🖼️ KEEP ALL FRAMES after pose detection
    // Frames remain in memory for potential debug viewing via "Toggle debug information"
    // They will be cleaned up when:
    // 1. User starts processing a new video (processVideo function)
    // 2. Component unmounts (onUnmounted hook)
    // This allows users to toggle debug mode AFTER analysis completes and still see frames
    console.log(`🖼️ Keeping all ${extractedFrames.value.length} frames in memory for potential debug viewing`);

    emit(
      'pose-detected',
      extractedFrames.value.map((f) => f.poseData)
    );

    const totalTime = performance.now() - totalStartTime;
    processingStatus.value = 'Ready for image matching';
    if (successfulDetections === 0) {
      processingDetails.value = 'No poses detected in any frame - try better lighting or positioning';
    } else if (successfulDetections < totalFrames) {
      processingDetails.value = `Poses detected in ${successfulDetections}/${totalFrames} frames`;
    } else {
      processingDetails.value = 'Frames extracted and poses detected successfully';
    }
    
    // Get memory usage
    let memoryInfo = '';
    try {
      // Try new Memory API first (includes workers, requires Cross-Origin Isolation)
      if (performance.measureUserAgentSpecificMemory) {
        const memoryMeasurement = await performance.measureUserAgentSpecificMemory();
        const totalBytes = memoryMeasurement.bytes;
        const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
        
        // Break down by attribution (main thread, workers, etc.)
        const breakdown = memoryMeasurement.breakdown || [];
        let workerMemory = 0;
        let mainMemory = 0;
        
        breakdown.forEach(entry => {
          const bytes = entry.bytes;
          if (entry.types?.includes('Worker') || entry.attribution?.[0]?.scope === 'DedicatedWorkerGlobalScope') {
            workerMemory += bytes;
          } else {
            mainMemory += bytes;
          }
        });
        
        const workerMB = (workerMemory / 1024 / 1024).toFixed(1);
        const mainMB = (mainMemory / 1024 / 1024).toFixed(1);
        
        memoryInfo = `
║  Memory Total:      ${totalMB} MB
║  ├─ Main Thread:    ${mainMB} MB
║  └─ Workers:        ${workerMB} MB`;
      } else if (performance.memory) {
        // Fallback to legacy API (Chrome-only, main thread only)
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
        const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
        const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
        memoryInfo = `
║  Memory Used:       ${usedMB} MB / ${totalMB} MB (main thread only)
║  Memory Limit:      ${limitMB} MB`;
      }
    } catch (err) {
      console.warn('Could not measure memory:', err.message);
    }
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  📹 VIDEO PROCESSING COMPLETE                              ║
╔════════════════════════════════════════════════════════════╗
║  Total Time:        ${(totalTime / 1000).toFixed(2)}s
║  Frame Extraction:  ${(extractTime / 1000).toFixed(2)}s
║  Pose Detection:    ${(poseTime / 1000).toFixed(2)}s
║  Frames Processed:  ${totalFrames}
║  Poses Detected:    ${successfulDetections}/${totalFrames}${memoryInfo}
║  Status:            Ready for image matching
╚════════════════════════════════════════════════════════════╝
    `);
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
      const maxWait = 300000; // 5 minutes (13MB model download + WASM compilation can be slow on first load)
      const startTime = Date.now();
      
      // Wait a bit for session to initialize
      await new Promise((resolve, reject) => {
        const checkReady = () => {
          if (sessionReady.value) {
            resolve();
          } else if (poseDetectionError.value) {
            reject(new Error(`Pose detection initialization failed: ${poseDetectionError.value}`));
          } else if (Date.now() - startTime > maxWait) {
            reject(new Error('Pose detection session initialization timed out after 5 minutes - check your internet connection (13MB model needs to download)'));
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
  console.log('🎯 Match found:', matchedImage?.name || 'Unknown');
  // Just emit the match found event - homography will be calculated in handleAnalysisComplete
  emit('match-found', {
    video: selectedVideo.value,
    frames: extractedFrames.value,
    match: matchedImage,
  });
};

const handleAnalysisComplete = async (bestMatchResult) => {
  console.log('✅ Image analysis complete, processing results...');
  bestMatch.value = bestMatchResult;

  // Load the actual image to get its natural dimensions as a fallback
  // This ensures referenceImageDimensions is always available
  if (!bestMatchResult.referenceImageDimensions) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Enable CORS for Cross-Origin Isolation
      await new Promise((resolve, reject) => {
        img.onload = () => {
          bestMatch.value.referenceImageDimensions = {
            width: img.naturalWidth,
            height: img.naturalHeight
          };
          resolve();
        };
        img.onerror = reject;
        img.src = bestMatchResult.url;
      });
    } catch (error) {
      console.warn('❌ Failed to load reference image dimensions:', error);
      // Continue anyway - not critical for analysis
    }
  }

  // Fetch both the stored viewBox AND detection results from Firestore
  try {
    // Use imageId for Firestore lookups (images have imageId, not id)
    const imageId = bestMatchResult.imageId || bestMatchResult.id;
    
    if (imageId && props.locationId) {
      // Try to get viewBox from hold detection service using the correct locationId
      const imageViewBox = await holdDetectionService.getViewBox(props.locationId, imageId);
      if (imageViewBox) {
        storedViewBox.value = imageViewBox;
      }

      // CRITICAL FIX: Also load AI detection results for this image
      const holdDetectionData = await holdDetectionService.getHoldDetection(props.locationId, imageId);
      if (holdDetectionData && holdDetectionData.detectionResults) {
        // Attach detection results to bestMatch so findClosestHolds can use them
        // Include BOTH results and metadata (which contains viewBox)
        bestMatch.value.detectionResults = {
          results: holdDetectionData.detectionResults.aiHolds || [],
          imageMetadata: holdDetectionData.detectionResults.metadata || {}
        };
      }

      // CONSISTENCY FIX: Also load standalone manual holds for this image
      // This ensures manual holds are treated the same as AI holds (all standalone holds considered)
      try {
        const manualHolds = await manualHoldsService.loadManualHolds(props.locationId, imageId);
        if (manualHolds && manualHolds.length > 0) {
          bestMatch.value.manualHolds = manualHolds;
          console.log(`✅ Loaded ${manualHolds.length} standalone manual holds for matching`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load manual holds:', error);
      }
    }
  } catch (error) {
    console.warn('❌ Failed to fetch stored data:', error);
  }

  // Calculate homography matrix for the best match (only once here)
  try {
    // Check if OpenCV is loaded
    if (!window.cv) {
      console.warn('⚠️ OpenCV.js not loaded yet, skipping homography calculation');
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
      const maxMatches = Math.min(rawData.matches.dims[0], 100);

      // SuperPoint/LightGlue uses 256x256 inference size - need to scale keypoints back to original image coordinates
      const inferenceSize = 256;
      const userImageDims = inferenceResult.userImageDims || { width: inferenceSize, height: inferenceSize };
      const topoImageDims = inferenceResult.topoImageDims || { width: inferenceSize, height: inferenceSize };

      // Calculate scaling factors
      const userScaleX = userImageDims.width / inferenceSize;
      const userScaleY = userImageDims.height / inferenceSize;
      const topoScaleX = topoImageDims.width / inferenceSize;
      const topoScaleY = topoImageDims.height / inferenceSize;

      for (let i = 0; i < maxMatches; i++) {
        const matchBaseIndex = i * rawData.matches.dims[1];
        const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
        const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

        // Scale keypoints back to original image coordinates
        const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]) * userScaleX;
        const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]) * userScaleY;
        const x1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) * topoScaleX;
        const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]) * topoScaleY;

        matches.push({
          point1: { x: x0, y: y0 },
          point2: { x: x1, y: y1 },
        });
      }

      if (matches.length >= 4) {
        const homographyResult = await calculateHomographyMatrix(matches);
        bestMatchResult.homographyMatrix = homographyResult.matrix;
        bestMatchResult.homographyInliers = homographyResult.inliers;
        bestMatchResult.totalMatches = matches.length;
        
        // CRITICAL: Store the reference image dimensions that homography was calculated against
        // These are the actual loaded image dimensions (e.g., 1200x1600)
        // NOT the AI detection dimensions (1080x1440)
        // We need these to correctly scale transformed keypoints to match hold coordinate space
        bestMatchResult.referenceImageDimensions = topoImageDims;
        
        // Store feature matches for visualization (limit to first 100 for performance)
        featureMatches.value = matches.slice(0, 100);
      } else {
        console.warn('Not enough matches for homography calculation:', matches.length);
      }
    } else {
      console.warn('No inference results found for matched image:', matchUrl);
    }
  } catch (error) {
    console.error('❌ Error calculating homography:', error);
  }

  emit('analysis-complete', {
    video: selectedVideo.value,
    frames: extractedFrames.value,
    match: bestMatchResult,
  });

  // 🖼️ KEEP ALL FRAMES for debug UI display
  // Frame URLs will be cleaned up later:
  // 1. When starting new video processing (processVideo)
  // 2. When component unmounts (onUnmounted)
  // This allows the "Extracted Frames" debug section to display all frames

  // Transform poses to matched image coordinates
  if (bestMatchResult.homographyMatrix) {
    await transformPosesToMatchedImage(bestMatchResult);
  }
};

const transformPosesToMatchedImage = async (matchResult) => {
  try {
    processingStatus.value = 'Transforming poses to matched image...';
    isProcessing.value = true;

    const { homographyMatrix } = matchResult;
    const transformedFrames = [];

    // 🎯 EXTREME CAMERA MOVEMENT MITIGATION: Use ONLY the single best frame
    // Camera movement between frames causes too many false matches - use only the peak moment
    const bestFrameIndex = extractedFrames.value.findIndex(f => f === bestFrameForMatching.value);
    
    console.log(`🎯 Using ONLY best frame ${bestFrameIndex + 1} for pose transformation (camera movement optimization)`);

    for (let i = 0; i < extractedFrames.value.length; i++) {
      const frame = extractedFrames.value[i];
      
      // Skip frames without pose data OR skip all frames except the best one
      if (!frame.poseData || i !== bestFrameIndex) {
        continue;
      }

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

      // Find closest holds for each transformed keypoint
      const closestHolds = transformedPoints.map((point, pointIndex) => {
        // COORDINATE SYSTEM FIX: Scale projected points to match stored hold coordinates
        let searchPoint = point;
        
        // Use DRY utility to convert coordinates for distance calculation
        if (bestMatch.value.detectionResults?.imageMetadata?.viewBox && imageNaturalDimensions.value.width > 0) {
          const convertedPoints = convertProjectedPointsForDistanceCalculation(
            [point], // Convert single point
            imageNaturalDimensions.value, // Natural dimensions
            bestMatch.value.detectionResults.imageMetadata.viewBox // Stored viewBox
          );
          
          if (convertedPoints.length > 0) {
            searchPoint = convertedPoints[0];
          }
        }
        
        const holdInfo = localFindClosestHolds(searchPoint.x, searchPoint.y);
        const coords = holdInfo.closest.hold ? extractHoldCoordinates(holdInfo.closest.hold) : null;
        
        return {
          keypoint: ['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'][pointIndex],
          hold: holdInfo.closest.hold,
          problem: holdInfo.closest.problem,
          distance: holdInfo.closest.distance,
        score: holdInfo.closest.score,
        coordinates: coords
      };
    });

    const transformedFrame = {
      frameIndex: i,
      originalPoints: sourcePoints,
      transformedPoints,
      closestHolds, // Add the closest holds data
      color: FRAME_COLORS[i],
      confidence: frame.poseData.confidence,
    };
    
    transformedFrames.push(transformedFrame);
    }

    transformedPoses.value = transformedFrames;
  } catch (err) {
    console.error('Pose transformation error:', err);
    error.value = 'Failed to transform poses: ' + err.message;
  } finally {
    isProcessing.value = false;
  }
};

const handleAnalysisError = (analysisError) => {
  error.value = 'Image analysis failed: ' + analysisError.message;
  emit('processing-error', analysisError);
};



const clearState = (clearFrames = false) => {
  selectedVideo.value = null;
  
  // Clear extracted frames only when explicitly requested (e.g., on unmount or new video)
  if (clearFrames) {
    extractedFrames.value = [];
  }
  
  isProcessing.value = false;
  processingStatus.value = '';
  processingDetails.value = '';
  error.value = null;
  bestMatch.value = null;
  transformedPoses.value = [];
  featureMatches.value = [];

  // Note: Frame URLs are cleaned up separately:
  // 1. Non-best-match frames: After analysis completes (handleAnalysisComplete)
  // 2. All frames: When component unmounts (onUnmounted) or when starting new video (processVideo)
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
      0.85 // Balanced quality - good compression without sacrificing model accuracy
    );
  });
};

const createImageUrlFromImageData = (imageData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.85); // Balanced quality
};

const formatFileSize = (bytes) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 🧹 DRY Helper: Revoke blob URL if it's a blob (not data URL)
const revokeFrameUrl = (frame) => {
  if (!frame.url) return;
  
  // Data URLs don't need cleanup, only blob URLs
  if (frame.url.startsWith('blob:')) {
    URL.revokeObjectURL(frame.url);
  }
};

// 🧹 Memory cleanup: Revoke blob URLs to free memory
const cleanupFrameUrls = () => {
  extractedFrames.value.forEach(revokeFrameUrl);
};

// Handle ascent form submission
const handleAscentFormSubmit = (formData) => {
  isSubmittingAscent.value = true;
  
  // Emit the form data along with video and analysis results
  // Note: Parent handler is async and will handle navigation
  emit('ascent-form-submit', {
    formData,
    video: selectedVideo.value,
    detectedProblem: detectedProblemForForm.value,
    analysisScores: aggregatedProblemScores.value,
    bestMatch: bestMatch.value
  });
  
  // Keep loading state until navigation happens
  // (will be reset when component unmounts on navigation)
};

// Cleanup on component unmount
onUnmounted(() => {
  console.log('🧹 Component unmounting: cleaning up all frames');
  cleanupFrameUrls(); // Release blob URLs
  clearState(true); // Clear all state including frames
});

// Expose methods for parent component
defineExpose({
  processVideo,
});
</script>

<style scoped>
/* Enhanced video frame matcher component styles */
.video-frame-matcher-component {
  width: 100%;
}
</style>
