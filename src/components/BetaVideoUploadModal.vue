<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 flex items-center justify-center p-4 z-50"
    :class="isMinimized ? 'pointer-events-none' : 'bg-black bg-opacity-50'"
  >
    <div 
      v-show="!isMinimized"
      class="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] flex flex-col py-4 pointer-events-auto"
    >
      <div class="flex items-center justify-between px-6 pb-4 flex-shrink-0">
        <div>
          <h3 class="text-lg font-semibold">Upload Beta Video</h3>
          <p class="text-xs text-gray-600">
            Upload a climbing video and we'll identify the problem automatically
          </p>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="px-6 flex-1 overflow-y-auto">
        <VideoFrameMatcherEnhanced
          ref="videoMatcherRef"
          :comparison-images="comparisonImages"
          :location-id="locationId"
          :location-name="locationName"
          :session-id="sessionId"
          :current-routesetting="currentRoutesetting"
          title="Upload Beta Video"
          subtitle="Upload a climbing video and we'll identify the boulder problem automatically"
          :auto-start-matching="true"
          @video-selected="$emit('video-selected', $event)"
          @analysis-complete="$emit('analysis-complete', $event)"
          @table-scores-ready="$emit('table-scores-ready', $event)"
          @processing-error="$emit('processing-error', $event)"
          @ascent-form-submit="$emit('ascent-form-submit', $event)"
          @ascent-created="handleAscentCreated"
        />

        <!-- Analysis in Progress -->
        <div
          v-if="isAnalyzing && !videoAnalysisResult && debugMode"
          class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div class="flex items-center space-x-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p class="text-sm font-medium text-blue-900">
                {{
                  analysisPhase === "matching"
                    ? "Finding matching boulder..."
                    : analysisPhase === "extracting-frames"
                    ? "Extracting video frames..."
                    : analysisPhase === "detecting-poses"
                    ? "Detecting climbing poses..."
                    : analysisPhase === "analyzing-holds"
                    ? "Analyzing hold usage..."
                    : "Analyzing your video..."
                }}
              </p>
              <p class="text-xs text-blue-700 mt-1">
                {{
                  analysisPhase === "matching"
                    ? "Comparing your video frame with boulder images"
                    : analysisPhase === "extracting-frames"
                    ? "Getting multiple frames from your video"
                    : analysisPhase === "detecting-poses"
                    ? "Detecting your body position"
                    : analysisPhase === "analyzing-holds"
                    ? "Determining which holds you're using"
                    : "Enhanced analysis in progress"
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Video Analysis Results -->
        <div v-if="videoAnalysisResult" class="mt-6">
          <!-- Failure Result -->
          <div
            v-if="!videoAnalysisResult.success"
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div class="flex items-start space-x-3 mb-4">
              <div class="flex-shrink-0">
                <svg
                  class="w-6 h-6 text-yellow-600"
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
              </div>
              <div>
                <h4 class="text-lg font-medium text-yellow-900">
                  {{ videoAnalysisResult.error ? "Processing Error" : "No Match Found" }}
                </h4>
                <p class="text-sm text-yellow-700 mt-1">{{ videoAnalysisResult.message }}</p>
              </div>
            </div>

            <!-- Show extracted frame if available -->
            <div v-if="extractedFrame && !videoAnalysisResult.error" class="text-center mb-4">
              <p class="text-sm font-medium text-gray-700 mb-2">Extracted Frame</p>
              <img
                :src="extractedFrame.url"
                alt="Extracted video frame"
                class="w-full max-w-xs h-32 object-contain rounded-lg border mx-auto"
              />
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex justify-center space-x-3">
              <button
                type="button"
                @click="$emit('try-another-video')"
                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Try Another Video
              </button>
              <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <!-- Success Result with Manual Continue (Debug Mode Only) -->
          <div
            v-if="debugMode && videoAnalysisResult.success && pendingRedirectData"
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div class="flex items-start space-x-3 mb-4">
              <div class="flex-shrink-0">
                <svg
                  class="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="flex-1">
                <h4 class="text-lg font-medium text-green-900">Analysis Complete!</h4>
                <p class="text-sm text-green-700 mt-1">
                  We successfully identified the boulder problem from your video.
                </p>
              </div>
            </div>

            <!-- Analysis Results -->
            <div class="space-y-4">
              <!-- Identified Problem(s) -->
              <div class="bg-white border border-green-200 rounded-lg p-4">
                <h5 class="text-md font-medium text-gray-900 mb-2">
                  Identified Boulder Problem{{ videoAnalysisResult?.holdAnalysis?.allScores?.length > 1 ? 's' : '' }}
                </h5>
                
                <!-- Primary match (best score) -->
                <div class="space-y-3">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: getGradeColor(pendingRedirectData.problem.grade) }"
                    ></div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <span class="font-semibold text-gray-900">{{
                          pendingRedirectData.problem.name
                        }}</span>
                        <span class="text-sm text-gray-600">{{
                          getGradeLabel(pendingRedirectData.problem.grade)
                        }}</span>
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Best Match
                        </span>
                      </div>
                      <div v-if="videoAnalysisResult?.holdAnalysis?.bestMatch" class="text-xs text-gray-500 mt-1">
                        Score: {{ (videoAnalysisResult.holdAnalysis.bestMatch.score * 100).toFixed(1) }}%
                      </div>
                    </div>
                  </div>
                  <p
                    v-if="pendingRedirectData.problem.description"
                    class="text-sm text-gray-600 ml-6"
                  >
                    {{ pendingRedirectData.problem.description }}
                  </p>
                </div>

                <!-- Alternative matches (2nd and 3rd place) -->
                <div
                  v-if="videoAnalysisResult?.holdAnalysis?.allScores?.length > 1"
                  class="mt-4 pt-3 border-t border-gray-100"
                >
                  <h6 class="text-sm font-medium text-gray-700 mb-2">Alternative Matches</h6>
                  <div
                    v-for="(candidate, index) in videoAnalysisResult.holdAnalysis.allScores.slice(1, 3)"
                    :key="candidate.problem.id"
                    class="flex items-center space-x-3 py-2"
                  >
                    <div class="flex items-center space-x-2 text-xs text-gray-500">
                      <span class="w-4 text-center">#{{ index + 2 }}</span>
                    </div>
                    <div
                      class="w-2.5 h-2.5 rounded-full"
                      :style="{ backgroundColor: getGradeColor(candidate.problem.grade) }"
                    ></div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-900 truncate">{{ candidate.problem.name }}</span>
                        <span class="text-xs text-gray-500">{{ getGradeLabel(candidate.problem.grade) }}</span>
                      </div>
                      <div class="text-xs text-gray-500">
                        Score: {{ (candidate.score * 100).toFixed(1) }}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                @click="$emit('continue-to-upload')"
                class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Continue to Upload Video
              </button>
              <button
                type="button"
                @click="$emit('try-another-video')"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Another Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import VideoFrameMatcherEnhanced from './VideoFrameMatcherEnhanced.vue';
import { useVideoAnalysisQueueStore } from '@/stores/videoAnalysisQueueStore';

const videoMatcherRef = ref(null);

// Access the analysis queue store
const analysisQueue = useVideoAnalysisQueueStore();

// Derive analysis state from store (getActiveJob is already a computed ref)
const isAnalyzing = computed(() => {
  const job = analysisQueue.getActiveJob;
  return job && (job.status === 'processing' || job.status === 'matching');
});

const analysisPhase = computed(() => {
  const job = analysisQueue.getActiveJob;
  if (!job) return '';
  
  // Map store status to phase names
  if (job.status === 'processing') {
    if (job.progress < 33) return 'extracting-frames';
    if (job.progress < 66) return 'detecting-poses';
    return 'analyzing-holds';
  }
  if (job.status === 'matching') return 'matching';
  return '';
});

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  isMinimized: {
    type: Boolean,
    default: false
  },
  sessionId: {
    type: String,
    default: null
  },
  comparisonImages: {
    type: Array,
    required: true
  },
  locationId: {
    type: String,
    required: true
  },
  locationName: {
    type: String,
    default: null
  },
  currentRoutesetting: {
    type: String,
    default: null
  },
  // Legacy props - kept for backward compatibility but not actively used
  videoAnalysisResult: {
    type: Object,
    default: null
  },
  extractedFrame: {
    type: Object,
    default: null
  },
  pendingRedirectData: {
    type: Object,
    default: null
  },
  getGradeColor: {
    type: Function,
    required: true
  },
  getGradeLabel: {
    type: Function,
    required: true
  },
  debugMode: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'close',
  'video-selected',
  'analysis-complete',
  'table-scores-ready',
  'processing-error',
  'try-another-video',
  'continue-to-upload',
  'ascent-form-submit'
]);

/**
 * Handle ascent creation - already minimized, just log
 * Upload and analysis continue in background while user browses
 */
const handleAscentCreated = ({ ascentId }) => {
  console.log(`🎉 Ascent created: ${ascentId} - processing in background`);
};

/**
 * Handle video selected from parent (LocationDetailView)
 */
const handleVideoSelected = (video) => {
  if (videoMatcherRef.value && videoMatcherRef.value.handleVideoSelected) {
    videoMatcherRef.value.handleVideoSelected(video);
  }
};

/**
 * Re-process an existing video (skip upload, start analysis)
 */
const reprocessExistingVideo = (video) => {
  if (videoMatcherRef.value && videoMatcherRef.value.analyzeExistingVideo) {
    videoMatcherRef.value.analyzeExistingVideo(video);
  }
};

// Expose methods for parent component
defineExpose({
  handleVideoSelected,
  reprocessExistingVideo
});
</script>
