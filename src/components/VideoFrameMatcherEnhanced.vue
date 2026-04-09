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
      🐛
    </button>

    <!-- Video Selected and Processing -->
    <div v-if="selectedVideo" class="space-y-6">
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
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="(frame, index) in extractedFrames"
            :key="index"
            class="relative group"
          >
            <div class="border-2 border-gray-300 rounded overflow-hidden transition-all relative">
              <!-- Base image -->
              <img
                v-if="frame.url"
                :src="frame.url"
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
                <!-- Left Hand (Red) - wrist for YOLO, index finger for MediaPipe -->
                <circle
                  v-if="frame.poseData.keypoints.leftHand"
                  :cx="frame.poseData.keypoints.leftHand.x"
                  :cy="frame.poseData.keypoints.leftHand.y"
                  r="8"
                  fill="#ef4444"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.leftHand.confidence"
                />
                <!-- Right Hand (Blue) - wrist for YOLO, index finger for MediaPipe -->
                <circle
                  v-if="frame.poseData.keypoints.rightHand"
                  :cx="frame.poseData.keypoints.rightHand.x"
                  :cy="frame.poseData.keypoints.rightHand.y"
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.rightHand.confidence"
                />
                <!-- Left Foot (Green) - ankle for YOLO, toe for MediaPipe -->
                <circle
                  v-if="frame.poseData.keypoints.leftFoot"
                  :cx="frame.poseData.keypoints.leftFoot.x"
                  :cy="frame.poseData.keypoints.leftFoot.y"
                  r="8"
                  fill="#22c55e"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.leftFoot.confidence"
                />
                <!-- Right Foot (Amber) - ankle for YOLO, toe for MediaPipe -->
                <circle
                  v-if="frame.poseData.keypoints.rightFoot"
                  :cx="frame.poseData.keypoints.rightFoot.x"
                  :cy="frame.poseData.keypoints.rightFoot.y"
                  r="8"
                  fill="#f59e0b"
                  stroke="white"
                  stroke-width="2"
                  :opacity="frame.poseData.keypoints.rightFoot.confidence"
                />
              </svg>
            </div>
            <div class="mt-1 text-xs text-center">
              <div class="font-medium text-gray-700">Frame {{ index + 1 }}</div>
              <div v-if="frame.poseData" class="text-green-600">✓ Pose detected</div>
              <div v-else-if="frame.poseError" class="text-red-600">✗ {{ frame.poseError }}</div>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Left Hand</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Right Hand</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Left Foot</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Right Foot</span>
          </div>
        </div>
      </div>

      <!-- Homography Debug Visualization (Debug Mode Only) -->
      <div v-if="debugMode && homographyDebugData" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              🎯 Interactive Homography Testing
            </h3>
            <p class="text-xs text-gray-600 mt-1">
              Using: <span class="font-mono font-semibold">{{ homographyDebugData.homographySource }}</span>
              <span v-if="homographyDebugData.serverHomographyQuality" class="ml-2">
                ({{ homographyDebugData.serverHomographyQuality.inlierMatches }} inliers, {{ (homographyDebugData.serverHomographyQuality.inlierRatio * 100).toFixed(1) }}%)
              </span>
            </p>
          </div>
          <span class="text-xs text-gray-500">Click on video frame to test projection</span>
        </div>
        <FeatureMatchVisualization
          :source-image-url="homographyDebugData.videoFrameUrl"
          :target-image-url="homographyDebugData.locationImageUrl"
          :homography-matrix="homographyDebugData.homographyMatrix"
          :feature-matches="homographyDebugData.featureMatches"
          :homography-inliers="homographyDebugData.homographyInliers"
          :best-match-image="homographyDebugData.bestMatchImage"
          :localized-transforms="homographyDebugData.localizedTransforms"
        />
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

      <!-- Analysis happens in background store - no UI needed here -->

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import AscentForm from './AscentForm.vue';
import FeatureMatchVisualization from './FeatureMatchVisualization.vue';
import { validateVideoFile } from '@/utils/videoFrameUtils';
import { extractVideoFrames } from '@/utils/homographyUtils';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { ascentService, generateAscentId } from '@/services/ascentService';
import { getCurrentUser } from '@/services/authService';
import { useVideoUploadQueueStore } from '@/stores/videoUploadQueueStore';
import { Capacitor } from '@capacitor/core';
import { useVideoAnalysisQueueStore } from '@/stores/videoAnalysisQueueStore';

// Props
const props = defineProps({
  comparisonImages: {
    type: Array,
    default: () => [],
  },
  locationId: {
    type: String,
    required: true,
  },
  locationName: {
    type: String,
    default: null,
  },
  sessionId: {
    type: String,
    default: null, // If not provided, will generate one
  },
  currentRoutesetting: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: 'Upload Beta Video',
  },
  subtitle: {
    type: String,
    default: 'Select a video to analyze',
  },
  autoStartMatching: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits([
  'video-selected',
  'frames-extracted',
  'pose-detected',
  'processing-error',
  'ascent-submitted',
  'upload-started',
]);

// State
const selectedVideo = ref(null);
const extractedFrames = ref([]);
const isProcessing = ref(false);
const processingStatus = ref('');
const processingDetails = ref('');
const error = ref(null);
const debugMode = ref(true);  // Default to true - minimal UI, debug info useful
const createdAscentId = ref(null);
const isSubmittingAscent = ref(false);

// Stores
const boulderProblemsStore = useBoulderProblemsStore();
const analysisQueueStore = useVideoAnalysisQueueStore();

// Homography debug data
const homographyDebugData = ref(null);

// Detected problem for the ascent form (will be populated by store analysis)
const detectedProblemForForm = computed(() => {
  // TODO: Get detected problem from videoAnalysisQueueStore once analysis completes
  return null;
});

// Top 3 scores for ranking display (will be populated by store analysis)
const top3Scores = computed(() => {
  // TODO: Get scores from videoAnalysisQueueStore once analysis completes
  return [];
});

// Frame timestamps for extraction (10 frames evenly distributed)
const FRAME_TIMESTAMPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

// Watch for analysis job completion to get homography data
watch(
  () => createdAscentId.value ? analysisQueueStore.jobs[createdAscentId.value] : null,
  (job) => {
    if (!job) return;
    
    // Once matching completes, we have homography matrix and matched image
    if (job.homographyMatrix && job.matchedImageId && extractedFrames.value.length > 0) {
      // Use the SAME best frame that was selected during analysis
      const bestFrame = job.bestFrameIndex !== undefined 
        ? extractedFrames.value[job.bestFrameIndex]
        : (extractedFrames.value.find(f => f.poseData) || extractedFrames.value[0]);
      
      // Find the matched image from comparisonImages
      const matchedImage = props.comparisonImages.find(img => img.imageId === job.matchedImageId);
      
      if (bestFrame && matchedImage) {
        // Use server homography if available (more accurate LoFTR), otherwise frontend (SuperPoint)
        const homographyMatrix = job.serverHomographyMatrix || job.homographyMatrix;
        const homographySource = job.serverHomographyMatrix ? 'LoFTR (server)' : 'SuperPoint (frontend)';
        
        console.log('🎯 Homography debug data ready:', {
          frame: bestFrame.timestamp,
          image: matchedImage.name,
          source: homographySource,
          matrix: homographyMatrix,
          matches: job.featureMatches?.length || 0,
          inliers: job.homographyInliers || 0,
          serverQuality: job.serverHomographyQuality
        });
        
        homographyDebugData.value = {
          videoFrameUrl: bestFrame.url,
          locationImageUrl: matchedImage.url,
          homographyMatrix: homographyMatrix,
          homographySource: homographySource,
          featureMatches: job.featureMatches || [],
          homographyInliers: job.homographyInliers || 0,
          bestMatchImage: matchedImage,
          videoFrameData: bestFrame.imageData,
          serverHomographyQuality: job.serverHomographyQuality,
          localizedTransforms: job.localizedTransforms || [],
        };
      }
    }
  },
  { deep: true }
);

// Utility functions
const createImageUrlFromImageData = (imageData) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Create ascent record and start video upload immediately
 * This makes the experience snappier - user doesn't have to wait for analysis
 */
const createAscentAndStartUpload = async (videoFile) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('⚠️ No user logged in, skipping ascent creation');
      return;
    }

    if (!props.locationId) {
      console.warn('⚠️ No locationId provided, skipping ascent creation');
      return;
    }

    // Use provided sessionId as ascentId, or generate new one if not provided
    const ascentId = props.sessionId || generateAscentId();
    createdAscentId.value = ascentId;

    console.log('📝 Creating ascent record:', ascentId, props.sessionId ? '(from session)' : '(generated)');

    // Create the ascent record in Firestore using logAscent
    const ascentData = {
      locationName: props.locationName || null, // Denormalize location name for display
      attemptType: 'flash', // Default, user can change later
      notes: '',
      routesetting: props.currentRoutesetting || null,
      // problemId and problemSnapshot will be added by analysis pipeline
      video: {
        status: 'uploading',
        uploadedAt: new Date().toISOString(),
        uploadedOn: Capacitor.getPlatform(),
      },
    };

    // logAscent signature: (locationId, problemId, ascentData, ascentId)
    await ascentService.logAscent(props.locationId, null, ascentData, ascentId);
    console.log('✅ Ascent record created');

    // Start video upload in background
    // startUpload signature: (file, locationId, problemId, ascentId, metadata)
    const uploadQueue = useVideoUploadQueueStore();
    uploadQueue.startUpload(videoFile, props.locationId, null, ascentId, {
      locationName: props.locationName,
      problemName: null, // Will be filled in after analysis detects problem
    });
    console.log('✅ Video upload started in background');
    
    // Emit event so parent can scroll to the video
    emit('upload-started', ascentId);

  } catch (err) {
    console.error('❌ Failed to create ascent or start upload:', err);
    // Don't throw - this is a background operation
  }
};

// Main video processing function
const processVideo = async (videoFile) => {
  try {
    isProcessing.value = true;
    error.value = null;
    processingStatus.value = 'Extracting frames...';

    // Clear previous frames
    extractedFrames.value.forEach(frame => {
      if (frame.url) {
        URL.revokeObjectURL(frame.url);
      }
    });
    extractedFrames.value = [];

    // Only create ascent and start upload for NEW videos (not re-processing)
    if (!videoFile.existingVideo) {
      // Create ascent and start upload immediately (non-blocking)
      await createAscentAndStartUpload(videoFile);
    } else {
      console.log('🔄 Re-processing existing video, skipping ascent creation and upload');
      createdAscentId.value = videoFile.ascentId; // Use existing ascent ID
    }

    const totalStartTime = performance.now();

    // Step 1: Extract frames
    const extractStartTime = performance.now();
    processingDetails.value = 'Reading video file...';

    // For existing videos, use URL; for new videos, use File object
    const videoSource = videoFile.existingVideo ? videoFile.url : videoFile;
    const frames = await extractVideoFrames(videoSource, FRAME_TIMESTAMPS);
    const extractTime = performance.now() - extractStartTime;
    console.log(`  ✅ Frame extraction: ${(extractTime / 1000).toFixed(2)}s (${frames.length} frames)`);

    // Create URL for each frame (for display in debug mode)
    const processedFrames = [];
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const url = createImageUrlFromImageData(frame.imageData);

      const processedFrame = {
        ...frame,
        url,
      };

      processedFrames.push(processedFrame);
    }

    extractedFrames.value = processedFrames;

    emit('frames-extracted', extractedFrames.value);

    // Push frames to analysis queue for background processing
    // Store will handle: pose detection → image matching → hold loading → scoring → Firestore update
    if (createdAscentId.value) {
      const analysisQueue = useVideoAnalysisQueueStore();
      
      // Pass images and problems separately (cleaner separation of concerns)
      // - comparisonImages: for Step 2 image matching (SuperPoint)
      // - boulderProblems: for Step 4 problem scoring
      // Note: comparisonImages are already filtered by routesetting at parent level
      console.log(`Frames: ${processedFrames.length}, Images: ${props.comparisonImages.length}, Problems: ${boulderProblemsStore.boulderProblems.length}`);
      await analysisQueue.setFrames(
        createdAscentId.value,
        processedFrames,
        props.comparisonImages,
        boulderProblemsStore.boulderProblems,
        props.locationId
      );
    }

    const totalTime = performance.now() - totalStartTime;
    processingStatus.value = 'Processing complete';
    processingDetails.value = 'Analysis continuing in background (pose detection, matching, scoring)';
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  📹 FRAME EXTRACTION COMPLETE                              ║
╔════════════════════════════════════════════════════════════╗
║  Total Time:        ${(totalTime / 1000).toFixed(2)}s
║  Frame Extraction:  ${(extractTime / 1000).toFixed(2)}s
║  Frames Extracted:  ${processedFrames.length}
║  Status:            Handed off to store for background analysis
║  Pipeline:          Pose detection → Matching → Scoring → Firestore
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

// Handle video selection
const handleVideoSelected = async (video) => {
  console.log('🎬 handleVideoSelected called with:', video);
  try {
    // Validate video file
    const validation = validateVideoFile(video);
    console.log('📋 Validation result:', validation);
    if (!validation.isValid) {  // Fixed: was checking .valid, should be .isValid
      error.value = validation.errors.join(', ');  // Fixed: show actual errors
      console.error('❌ Validation failed:', validation.errors);
      return;
    }

    selectedVideo.value = video;
    console.log('✅ Video selected, starting processing...');
    emit('video-selected', video);

    // Start processing
    await processVideo(video);
  } catch (err) {
    console.error('❌ Error handling video selection:', err);
    error.value = err.message;
  }
};

// Handle ascent form submission
const handleAscentFormSubmit = async (formData) => {
  if (!createdAscentId.value) {
    error.value = 'No ascent record found';
    return;
  }

  try {
    isSubmittingAscent.value = true;

    // Update the ascent with form data
    await ascentService.updateAscent(createdAscentId.value, {
      problemId: formData.problemId,
      problemSnapshot: formData.problemSnapshot,
      attemptType: formData.attemptType,
      userGrade: formData.userGrade,
      notes: formData.notes,
    });

    console.log('✅ Ascent updated with form data');
    
    emit('ascent-submitted', {
      ascentId: createdAscentId.value,
      ...formData
    });

    // Clear state
    selectedVideo.value = null;
    extractedFrames.value.forEach(frame => {
      if (frame.url) {
        URL.revokeObjectURL(frame.url);
      }
    });
    extractedFrames.value = [];
    createdAscentId.value = null;
    error.value = null;

  } catch (err) {
    console.error('Failed to submit ascent:', err);
    error.value = 'Failed to submit ascent: ' + err.message;
  } finally {
    isSubmittingAscent.value = false;
  }
};

// Cleanup on unmount
onUnmounted(() => {
  // Revoke all object URLs to prevent memory leaks
  extractedFrames.value.forEach(frame => {
    if (frame.url) {
      URL.revokeObjectURL(frame.url);
    }
  });
});

/**
 * Trigger file input programmatically (for short-circuit mode)
 */
const triggerFileInput = () => {
  if (videoSelectorRef.value && videoSelectorRef.value.triggerFileInput) {
    videoSelectorRef.value.triggerFileInput();
  }
};

// Expose method for parent component (for re-processing existing videos)
defineExpose({
  analyzeExistingVideo: async (video) => {
    try {
      console.log('🔄 Re-processing existing video:', video);
      
      // Create a pseudo-video object with download URL for analysis
      const videoForAnalysis = {
        file: null, // No file since it's already uploaded
        url: video.downloadUrl || video.url,
        name: video.fileName || 'Existing video',
        size: 0, // Unknown size
        type: 'video/mp4', // Assume mp4
        ascentId: video.id, // Use existing ascent ID
        existingVideo: true // Flag to skip upload
      };
      
      selectedVideo.value = videoForAnalysis;
      emit('video-selected', videoForAnalysis);
      
      // Start analysis directly
      await processVideo(videoForAnalysis);
    } catch (err) {
      console.error('❌ Error re-processing video:', err);
      error.value = err.message;
    }
  },
  // Expose handleVideoSelected for parent to call directly
  handleVideoSelected
});
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
