<template>
  <div class="min-h-screen">
    <!-- Toast Notification -->
    <ToastNotification />

    <div class="container py-6 sm:py-8">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md mb-6">
        {{ error }}
      </div>

      <!-- Location content -->
      <div v-else-if="location" class="space-y-6">

        <!-- Location info -->
        <div class="card">
          <!-- Grid layout with template areas -->
          <div class="grid gap-6 location-grid">
            <!-- Hero Image -->
            <div v-if="location.heroImageUrl" class="hero-image relative h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-50">
              <img
                :src="fixLocalhostUrl(location.heroImageUrl)"
                :alt="location.name"
                class="w-full h-full object-cover"
                crossorigin="anonymous"
              />
            </div>
            
            <!-- Location Name -->
            <h1 class="location-name text-xl sm:text-2xl font-semibold text-gray-900">
              {{ location.name }}
            </h1>
            
            <!-- Action buttons -->
            <div class="action-buttons flex gap-2">
              <button
                v-if="userStore.canEditLocations"
                @click="editLocation"
                class="btn-secondary h-8 px-3 text-[13px]"
              >
                Edit
              </button>
              <router-link
                :to="`/location/${locationId}/jobs`"
                class="btn-secondary h-8 px-3 text-[13px] inline-flex items-center"
                title="View background analysis jobs"
              >
                Jobs
              </router-link>
            </div>
            
            <!-- Description -->
            <div class="description">
              <p 
                v-if="location.description" 
                class="text-[14px] text-gray-700 leading-relaxed"
              >
                {{ location.description }}
              </p>
              <p 
                v-else 
                class="text-[13px] text-gray-500 italic"
              >
                No description provided
              </p>
            </div>
          </div>

          <!-- Upload Beta Video CTA -->
          <div class="border-t border-gray-200/60 pt-6 mt-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex-1">
                <h3 class="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Share Your Beta
                </h3>
                <p class="text-[13px] text-gray-600 mt-1">
                  Upload a climbing video and we'll identify the problem automatically
                </p>
              </div>
              <button
                type="button"
                @click="handleBetaUploadClick"
                class="h-10 px-4 sm:px-5 bg-green-600 text-white text-[14px] font-medium rounded-md hover:bg-green-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 flex-shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Upload Beta
              </button>
            </div>
          </div>
        </div>

        <!-- Routesetting Selector -->
        <RoutesettingSelector
          v-if="allRoutesettings.length > 0"
          :location-id="locationId"
          :all-routesettings="allRoutesettings"
          :current-routesetting="currentRoutesetting"
          :can-edit="userStore.canEditLocations"
          @routesetting-changed="handleRoutesettingChanged"
        />

        <!-- Images section -->
        <LocationImages
          :images="images"
          :location-name="location?.name"
          :can-upload="userStore.canUploadImages"
          :can-edit-holds="userStore.canEditLocations"
          :get-resized-image-url="getResizedImageUrl"
          @upload="handleUploadClick"
          @image-click="openImageModal"
          @analyze-holds="openHoldDetection"
          @delete-image="handleDeleteImage"
        />

        <!-- Videos/Betas section -->
        <LocationVideos
          :videos="displayVideos"
          :loading="videosLoading"
          @video-deleted="handleVideoDeleted"
          @reprocess-video="handleReprocessVideo"
        />

        <!-- Boulder Problems Summary -->
        <LocationBoulderProblems
          :boulder-problems-summary="boulderProblemsSummary"
          :total-problems="totalProblems"
          :location-id="route.params.locationId"
          :get-grade-color="getGradeColor"
          :get-problem-video-count="getProblemVideoCount"
          @open-problem-videos="openProblemVideos"
        />

        <!-- Subtle metadata at bottom -->
        <div class="pt-4 border-t border-gray-200/60">
          <div class="text-[12px] text-gray-500 space-y-0.5 text-center sm:text-left">
            <div>Created {{ formatDate(location.createdAt) }}</div>
            <div
              v-if="location.updatedAt && !isSameDateTime(location.createdAt, location.updatedAt)"
            >
              Updated {{ formatDate(location.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <ImageUploadModal
      v-if="currentRoutesetting"
      :is-open="showUploadModal"
      :location-id="route.params.locationId"
      :routesetting="currentRoutesetting"
      :pending-metadata-saves="pendingMetadataSaves"
      :total-uploads-expected="totalUploadsExpected"
      @close="handleUploadModalClose"
      @uploaded="handleImageUploadComplete"
      @error="handleImageUploadError"
      @uploads-started="handleUploadsStarted"
      @all-complete="handleAllUploadsComplete"
    />

    <!-- Beta Video Upload Modal -->
    <BetaVideoUploadModal
      ref="betaUploadModalRef"
      :key="currentUploadSessionId"
      :is-open="showBetaUploadModal"
      :is-minimized="isBetaModalMinimized"
      :session-id="currentUploadSessionId"
      :comparison-images="filteredComparisonImages"
      :location-id="route.params.locationId"
      :current-routesetting="currentRoutesetting"
      :pending-redirect-data="pendingRedirectData"
      :get-grade-color="getGradeColor"
      :get-grade-label="getGradeLabel"
      @close="showBetaUploadModal = false; isBetaModalMinimized = false"
      @video-selected="(event) => { handleBetaVideoSelected(event); isBetaModalMinimized = true; }"
      @analysis-complete="handleBetaAnalysisComplete"
      @table-scores-ready="handleTableScoresReady"
      @processing-error="handleBetaProcessingError"
      @try-another-video="handleTryAnotherVideo"
      @continue-to-upload="continueToUpload"
      @ascent-form-submit="handleAscentFormSubmitWrapper"
    />

    <!-- Image Gallery Modal -->
    <ImageGallerySimplified
      :images="images"
      :initial-index="initialImageIndex"
      :is-open="isGalleryOpen"
      :location-id="locationId"
      :boulder-problems="boulderProblemsStore.boulderProblems || []"
      @close="closeGallery"
      @navigate-next="navigateNext"
      @navigate-previous="navigatePrevious"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { locationService } from '../services/locationService.js';
import { routesettingService } from '../services/routesettingService.js';
import { useBoulderProblemsStore } from '../stores/boulderProblemsStore.js';
import { useVideoAnalysis } from '../composables/useVideoAnalysis.js';
import { useToast } from '../composables/useToast.js';
import ImageUploadModal from '../components/ImageUploadModal.vue';
import ImageGallerySimplified from '../components/ImageGallerySimplified.vue';
import BetaVideoUploadModal from '../components/BetaVideoUploadModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import LocationImages from '../components/LocationImages.vue';
import LocationVideos from '../components/LocationVideos.vue';
import LocationBoulderProblems from '../components/LocationBoulderProblems.vue';
import RoutesettingSelector from '../components/RoutesettingSelector.vue';
import { formatDate, isSameDateTime } from '../utils/dateUtils.js';
import { getGradeLabel, getGradeDifficulty, getGradeColor } from '../utils/gradingUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { generateUUID } from '../utils/uuid.js';
import { useVideoAnalysisQueueStore, getCurrentStep } from '../stores/videoAnalysisQueueStore.js';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';
import { videoService } from '../services/videoService.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';
import { getResizedImageUrl } from '../utils/imageResize.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const boulderProblemsStore = useBoulderProblemsStore();
const analysisStore = useVideoAnalysisQueueStore();
const uploadQueue = useVideoUploadQueueStore();
const toast = useToast();

// Video analysis composable
const {
  pendingRedirectData,
  handleBetaVideoSelected,
  handleBetaAnalysisComplete,
  handleTableScoresReady,
  handleBetaProcessingError,
  handleTryAnotherVideo,
  handleAscentFormSubmit,
  continueToUpload
} = useVideoAnalysis();

// Inject auth modal controls
const authModal = inject('authModal');

const betaUploadModalRef = ref(null);
const location = ref(null);
const allRoutesettings = ref([]); // All routesettings for this location
const images = ref([]); // Placeholder for location images
const videos = ref([]); // Beta videos for location
const videosLoading = ref(false);
const problemVideoCounts = ref({}); // Cache for video counts per problem
const isLoading = ref(true);
const error = ref('');
const showUploadModal = ref(false);
const showBetaUploadModal = ref(false);
const isBetaModalMinimized = ref(false); // Track if modal is minimized
const currentUploadSessionId = ref(null); // Each upload session gets unique ID for component reset

// Upload tracking state
const pendingMetadataSaves = ref(0);
const totalUploadsExpected = ref(0);

const locationId = computed(() => route.params.locationId);

// Current routesetting from query param (or latest if not specified)
const currentRoutesetting = computed(() => {
  const queryRoutesetting = route.query.routesetting;
  if (queryRoutesetting) {
    return queryRoutesetting;
  }
  // Default to latest (first in array, since sorted newest first)
  return allRoutesettings.value.length > 0 
    ? allRoutesettings.value[0] 
    : null;
});

// Separate display for uploads (0-100% file upload) and analysis (0-100% processing)
// Filter comparison images by current routesetting
const filteredComparisonImages = computed(() => {
  if (!currentRoutesetting.value) {
    return images.value;
  }
  
  return images.value.filter(img => 
    img.routesettings && 
    Array.isArray(img.routesettings) && 
    img.routesettings.includes(currentRoutesetting.value)
  );
});

const displayVideos = computed(() => {
  // 1. Get ANALYSIS progress first (to filter uploads)
  const activeJobs = analysisStore.getActiveJobsForLocation(locationId.value);
  const analyzingAscentIds = new Set(activeJobs.map(job => job.ascentId));
  
  // 2. Get UPLOAD progress and create INSTANT video objects from local files
  const allUploads = uploadQueue.uploads;
  const locationUploads = Object.values(allUploads).filter(
    upload => upload.locationId === locationId.value
  );
  
  // Create video objects from uploading files (show immediately with local blob URL!)
  const uploadingVideos = locationUploads
    .filter(upload => 
      // Show video during upload AND after completion (until server video loads)
      (upload.status === 'uploading' || upload.status === 'pending' || upload.status === 'completed')
    )
    .map(upload => {
      // Get current step for progress message
      const currentStep = analyzingAscentIds.has(upload.ascentId)
        ? getCurrentStep(activeJobs.find(j => j.ascentId === upload.ascentId)?.progress || 0)
        : null;
      
      return {
        id: upload.ascentId,
        ascentId: upload.ascentId,
        url: upload.localUrl,  // ✨ Reuse blob URL from upload queue!
        thumbnailBase64: upload.thumbnailBase64,  // ✨ Use extracted thumbnail as poster!
        isLocalVideo: true,  // Flag to know this is temporary
        isUploading: true,
        isAnalyzing: analyzingAscentIds.has(upload.ascentId),
        progress: analyzingAscentIds.has(upload.ascentId) 
          ? activeJobs.find(j => j.ascentId === upload.ascentId)?.progress || 0
          : upload.progress || 0,
        status: upload.status,
        statusMessage: currentStep?.message || 'Uploading video...',
        metadata: {
          duration: null,
          problemName: upload.problemId ? 
            boulderProblemsStore.boulderProblems.find(p => p.id === upload.problemId)?.name : null
        }
      };
    });
  
  // 3. Get completed jobs that we should keep visible until server video loads
  const completedJobs = analysisStore.getCompletedJobsForLocation(locationId.value);
  
  const completedPlaceholders = completedJobs.map(job => ({
    id: job.ascentId,
    ascentId: job.ascentId,
    isUploading: true,
    isAnalyzing: true,
    progress: 100,
    status: 'complete',
    statusMessage: 'Processing complete',
    metadata: {
      duration: null,
      problemName: job.detectedProblemId ? 
        boulderProblemsStore.boulderProblems.find(p => p.id === job.detectedProblemId)?.name : null
    }
  }));
  
  // Mark all loaded videos as loaded in store (so we can hide their placeholders)
  videos.value.forEach(video => {
    if (video.ascentId) {
      analysisStore.markAscentLoaded(locationId.value, video.ascentId);
    }
  });
  
  // Clean up completed uploads when server video arrives
  const serverAscentIds = new Set(videos.value.map(v => v.ascentId).filter(Boolean));
  locationUploads.forEach(upload => {
    if (upload.status === 'completed' && serverAscentIds.has(upload.ascentId)) {
      // Server video is here, remove the upload record
      uploadQueue.cancelUpload(upload.ascentId);
    }
  });
  
  // Filter out server videos that are still uploading (show local version instead)
  const uploadingAscentIds = new Set(locationUploads.map(u => u.ascentId));
  const serverVideos = videos.value.filter(video => 
    !uploadingAscentIds.has(video.ascentId) && !completedJobs.some(j => j.ascentId === video.ascentId)
  );
  
  // 4. Filter videos by current routesetting
  // - Assigned videos: show if problem's image is in current routesetting
  // - Unassigned videos: show if video's routesetting matches current routesetting
  const filteredImageIds = new Set(filteredComparisonImages.value.map(img => img.id));
  const filteredServerVideos = currentRoutesetting.value
    ? serverVideos.filter(video => {
        // If video has a problemId, check if that problem's image is in current routesetting
        if (video.problemId) {
          const problem = boulderProblemsStore.boulderProblems.find(p => p.id === video.problemId);
          return problem && filteredImageIds.has(problem.imageId);
        }
        // If no problemId, filter by routesetting timestamp
        return video.routesetting === currentRoutesetting.value;
      })
    : serverVideos;
  
  // Merge: uploading videos (with local URLs!) first, then completed placeholders, then server videos
  // This way you see your video INSTANTLY, then it seamlessly switches to server version when ready
  return [...uploadingVideos, ...completedPlaceholders, ...filteredServerVideos];
});

// Boulder problems summary grouped by grade
// Filtering is now done server-side based on routesetting
const boulderProblemsSummary = computed(() => {
  if (!boulderProblemsStore.boulderProblems.length) return [];

  // Group problems by grade
  const gradeGroups = {};

  boulderProblemsStore.boulderProblems.forEach((problem) => {
    const gradeLabel = getGradeLabel(problem.grade);
    const difficulty = getGradeDifficulty(problem.grade);

    if (!gradeGroups[gradeLabel]) {
      gradeGroups[gradeLabel] = {
        label: gradeLabel,
        difficulty: difficulty,
        count: 0,
        problems: [],
      };
    }

    gradeGroups[gradeLabel].count++;
    gradeGroups[gradeLabel].problems.push(problem);
  });

  // Convert to array and sort by difficulty
  return Object.values(gradeGroups).sort((a, b) => a.difficulty - b.difficulty);
});

const totalProblems = computed(() => {
  // Problems are already filtered server-side by routesetting
  return boulderProblemsStore.boulderProblems.length;
});

// Gallery state
const isGalleryOpen = computed(() => {
  return route.query.imageId !== undefined;
});

const initialImageIndex = computed(() => {
  if (!route.query.imageId || !images.value.length) return 0;

  const index = images.value.findIndex((img) => img.imageId === route.query.imageId);
  return index !== -1 ? index : 0;
});

const loadLocation = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    // Load location data first (needed for display)
    location.value = await locationService.getLocation(locationId.value);
    
    // Load all routesettings for this location
    allRoutesettings.value = await routesettingService.getRoutesettings(locationId.value);

    // Initialize boulder problems store (quick operation)
    await boulderProblemsStore.initializeForLocation(locationId.value);

    // Load everything else in parallel - they don't depend on each other
    await Promise.all([
      boulderProblemsStore.loadBoulderProblems(locationId.value, null, currentRoutesetting.value),
      loadLocationImages(),
    ]);
  } catch (err) {
    console.error('Error loading location:', err);
    error.value = 'Failed to load location. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const loadLocationImages = async () => {
  try {
    // Filter images by current routesetting
    const imageRecords = await locationService.getLocationImages(locationId.value, currentRoutesetting.value);

    // Transform the records to the format expected by the template
    images.value = imageRecords.map((record) => ({
      id: record.imageId,
      imageId: record.imageId,
      url: record.downloadUrl,
      name: record.fileName,
      routesettings: record.routesettings || [],
    }));

  } catch (err) {
    console.error('Error loading location images:', err);
    // Don't set error here, just keep images empty
    images.value = [];
  }
};

// Load videos for location
const loadLocationVideos = async () => {
  videosLoading.value = true;
  try {
    const locationVideos = await videoService.getLocationVideos(locationId.value);
    videos.value = locationVideos;

    // Also load video counts for each problem
    await loadProblemVideoCounts();
  } catch (err) {
    console.error('Error loading location videos:', err);
    videos.value = [];
  } finally {
    videosLoading.value = false;
  }
};

// Load video counts for all problems
const loadProblemVideoCounts = async () => {
  try {
    const counts = {};

    // Get video counts for each boulder problem
    for (const problem of boulderProblemsStore.boulderProblems) {
      try {
        const count = await videoService.getProblemVideoCount(locationId.value, problem.id);
        counts[problem.id] = count;
      } catch (err) {
        console.warn(`Failed to load video count for problem ${problem.id}:`, err);
        counts[problem.id] = 0;
      }
    }

    problemVideoCounts.value = counts;
  } catch (err) {
    console.error('Error loading problem video counts:', err);
  }
};

// Handle video deletion
const handleVideoDeleted = async (videoId) => {
  // Find the video to get its problemId before removing it
  const deletedVideo = videos.value.find(v => v.id === videoId);
  
  // Remove the deleted video from the list
  videos.value = videos.value.filter(v => v.id !== videoId);
  
  // Decrement the video count for this problem
  if (deletedVideo?.problemId && problemVideoCounts.value[deletedVideo.problemId]) {
    problemVideoCounts.value[deletedVideo.problemId] = Math.max(
      0, 
      problemVideoCounts.value[deletedVideo.problemId] - 1
    );
  }
};

// Handle video re-processing (for unclassified videos)
const handleReprocessVideo = async (video) => {
  try {
    console.log('🔄 Re-processing video:', video.id);
    
    // Open the beta upload modal minimized (same as short circuit mode)
    currentUploadSessionId.value = generateUUID();
    showBetaUploadModal.value = true;
    isBetaModalMinimized.value = true;
    
    // Wait for modal to mount, then trigger analysis with the existing video
    await nextTick();
    await nextTick();
    
    if (betaUploadModalRef.value && betaUploadModalRef.value.reprocessExistingVideo) {
      console.log('📹 Triggering re-analysis for existing video');
      betaUploadModalRef.value.reprocessExistingVideo(video);
    } else {
      console.error('❌ Modal ref or reprocessExistingVideo method not available');
    }
  } catch (error) {
    console.error('❌ Error re-processing video:', error);
    alert('Failed to re-process video: ' + error.message);
  }
};

// Method to get video count for a specific problem
const getProblemVideoCount = (problemId) => {
  return problemVideoCounts.value[problemId] || 0;
};

// Method to open videos filtered by specific problem
const openProblemVideos = async (problem) => {
  try {
    // Get videos for this specific problem
    const problemVideos = await videoService.getProblemVideos(locationId.value, problem.id);

    if (problemVideos.length === 0) {
      // No videos for this problem
      return;
    }

    // TODO: Open VideoPlayerShorts with filtered videos for this problem
    console.log('Open problem videos:', problem.name, problemVideos);
  } catch (error) {
    console.error('Error loading problem videos:', error);
  }
};

const handleBetaUploadClick = () => {
  try {
    console.log('🎬 Beta upload clicked');
    
    if (!userStore.user) {
      console.log('❌ User not authenticated, opening auth modal');
      authModal.open();
      return;
    }

    // 🎯 SHORT CIRCUIT MODE: Controlled by VITE_BETA_UPLOAD_SHORT_CIRCUIT env variable
    // When true: Open modal minimized and trigger file input directly (hides Record Video feature)
    // When false: Show full modal with "Upload File" / "Record Video" toggle
    const useShortCircuit = import.meta.env.VITE_BETA_UPLOAD_SHORT_CIRCUIT === 'true';
    console.log('⚙️ Short circuit mode:', useShortCircuit);
    
    currentUploadSessionId.value = generateUUID();
    console.log('🆔 Session ID:', currentUploadSessionId.value);
    
    showBetaUploadModal.value = true;
    console.log('✅ Modal opened');

    nextTick(() => {
      if (useShortCircuit) {
        console.log('🔄 Minimizing modal (short circuit)');
        isBetaModalMinimized.value = true;
        
        // Trigger file input after modal is mounted and minimized
        nextTick(() => {
          if (betaUploadModalRef.value) {
            console.log('📁 Triggering file input');
            betaUploadModalRef.value.triggerFileInput();
          } else {
            console.error('❌ Modal ref not available');
          }
        });
      }
    });
  } catch (error) {
    console.error('❌ Error in handleBetaUploadClick:', error);
  }
};

const handleRoutesettingChanged = async (newRoutesetting) => {
  // Reload routesettings (in case a new one was created)
  allRoutesettings.value = await routesettingService.getRoutesettings(locationId.value);
  
  // Update URL query parameter (source of truth)
  await router.push({
    query: {
      ...route.query,
      routesetting: newRoutesetting
    }
  });
  
  // Reload images for new routesetting (currentRoutesetting computed will update automatically)
  await loadLocationImages();
};

// Wrapper to minimize modal instead of closing when detection needed
const handleAscentFormSubmitWrapper = async (submitData) => {
  if (submitData.detectedProblem) {
    // Problem already detected - create ascent immediately
    const result = await handleAscentFormSubmit(submitData);
    showBetaUploadModal.value = false;
    isBetaModalMinimized.value = false;
    
    if (result?.success) {
      // Show success toast with link to problem
      toast.show(
        `✅ Ascent logged for ${result.problem.name}!`,
        'success',
        5000,
        {
          label: 'View Problem',
          onClick: () => {
            router.push({
              name: 'boulder-problem-detail',
              params: {
                locationId: result.locationId,
                problemId: result.problem.id,
              },
            });
          }
        }
      );
    } else {
      toast.error('❌ Failed to log ascent');
    }
  }
};

// Maximize modal (can be called from toast)
const maximizeBetaModal = () => {
  isBetaModalMinimized.value = false;
};

// Expose globally for toast
if (typeof window !== 'undefined') {
  window.maximizeBetaModal = maximizeBetaModal;
}

const editLocation = () => {
  // Navigate to edit form (could be same AddLocationView in edit mode)
  router.push(`/location/${locationId.value}/edit`);
};

const openImageModal = (image) => {
  // Navigate to the image gallery with the specific imageId
  router.push({
    query: { ...route.query, imageId: image.imageId },
  });
};

const openHoldDetection = (image) => {
  // Navigate to hold detection page with image and location information
  router.push({
    path: `/location/${locationId.value}/holds-server`,
    query: {
      imageId: image.imageId,
      imageName: image.name,
    },
  });
};

const handleDeleteImage = async (image) => {
  const confirmMessage = `Delete this image?\n\nThis will permanently delete:\n• The image "${image.name}"\n• All boulder problems using this image\n• All hold detection data\n\nThis action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    await locationService.deleteLocationImage(image.imageId);
    
    // Remove from local array
    images.value = images.value.filter(img => img.imageId !== image.imageId);
    
    // Refresh boulder problems since some may have been deleted
    await boulderProblemsStore.loadProblemsForLocation(locationId.value, currentRoutesetting.value);
  } catch (error) {
    console.error('Error deleting image:', error);
    alert('Failed to delete image. Please try again.');
  }
};

const closeGallery = () => {
  // Remove imageId query parameter to close gallery
  const query = { ...route.query };
  delete query.imageId;
  router.push({ query });
};

const navigateToImage = (direction) => {
  if (!images.value.length) return;
  
  const currentIndex = initialImageIndex.value;
  let newIndex;
  
  if (direction === 'next') {
    newIndex = currentIndex >= images.value.length - 1 ? 0 : currentIndex + 1;
  } else {
    newIndex = currentIndex <= 0 ? images.value.length - 1 : currentIndex - 1;
  }
  
  const newImageId = images.value[newIndex].imageId;
  router.push({
    query: { ...route.query, imageId: newImageId }
  });
};

const navigateNext = () => navigateToImage('next');
const navigatePrevious = () => navigateToImage('previous');

const handleUploadClick = () => {
  if (!currentRoutesetting.value) {
    alert('⚠️ No active routesetting found.\n\nPlease create a routesetting for this location before uploading images.\n\nRoutesettings organize images by reset date (e.g., when new boulder problems are set).');
    return;
  }
  showUploadModal.value = true;
};

const handleUploadModalClose = () => {
  if (pendingMetadataSaves.value > 0) {
    // Don't close modal while uploads are in progress
    // You could show a warning here if desired
    return;
  }
  showUploadModal.value = false;
};

const handleImageUploadComplete = async (uploadResult) => {

  try {
    // Save image metadata to Firestore via backend function
    // Use client-generated imageId (same as Storage folder name)
    // Pass routesetting timestamp for version control
    await locationService.addLocationImage(
      uploadResult.imageId,
      uploadResult.locationId,
      uploadResult.fileName,
      uploadResult.downloadUrl,
      uploadResult.routesetting
    );

    // Add the new image to the images array for immediate display
    // Use Date.now() since we know it was just uploaded (Cloud Function timestamps get serialized)
    images.value.push({
      imageId: uploadResult.imageId, // Use same imageId from client
      url: uploadResult.downloadUrl,
      name: uploadResult.fileName,
      uploadedAt: Date.now(), // Use current timestamp - we just uploaded it!
    });
  } catch (error) {
    console.error('Error saving image metadata:', error);
    // Still continue - don't fail the entire upload for one metadata save failure
  }

  // Decrement pending counter
  pendingMetadataSaves.value--;

  // Check if all uploads and metadata saves are complete
  if (pendingMetadataSaves.value <= 0 && totalUploadsExpected.value > 0) {
    
    // Close modal after a short delay to show completion
    setTimeout(() => {
      showUploadModal.value = false;
      // Reset counters
      pendingMetadataSaves.value = 0;
      totalUploadsExpected.value = 0;
    }, 1000);
  }
};

const handleImageUploadError = (error) => {
  console.error('Image upload failed:', error);
  // Note: We don't increment pendingMetadataSaves for failed uploads
  // because failed uploads don't trigger metadata saves

  // The totalUploadsExpected is set correctly in handleAllUploadsComplete
  // based on successful uploads only, so we don't need to decrement anything here
};

const handleUploadsStarted = (uploadInfo) => {
  // Initialize counters when uploads begin
  totalUploadsExpected.value = uploadInfo.totalUploads;
  pendingMetadataSaves.value = uploadInfo.totalUploads;
};

const handleAllUploadsComplete = (uploadStats) => {

  // Update counters to reflect actual successful uploads
  if (uploadStats.completedUploads !== uploadStats.totalUploads) {
    totalUploadsExpected.value = uploadStats.completedUploads;
    // Adjust pending counter based on how many failed
    const failedUploads = uploadStats.totalUploads - uploadStats.completedUploads;
    pendingMetadataSaves.value = Math.max(0, pendingMetadataSaves.value - failedUploads);
  }

  // If no successful uploads, close modal immediately
  if (uploadStats.completedUploads === 0) {
    showUploadModal.value = false;
    pendingMetadataSaves.value = 0;
    totalUploadsExpected.value = 0;
  }
};

// Listen for global maximize event from VideoAnalysisIndicator
const handleMaximizeModal = () => {
  if (showBetaUploadModal.value && isBetaModalMinimized.value) {
    isBetaModalMinimized.value = false;
  } else if (!showBetaUploadModal.value) {
    // If modal isn't open, open it (and reset it)
    currentUploadSessionId.value = generateUUID(); // New session = fresh modal state
    showBetaUploadModal.value = true;
    isBetaModalMinimized.value = false;
  }
};

// Handle job completion - load the video when analysis finishes
const handleJobComplete = async (ascentId) => {
  console.log(`🎬 Job completed for ascent ${ascentId}, loading video...`);
  
  // Load just this specific video
  const video = await videoService.getVideoByAscentId(ascentId);
  
  if (video) {
    // Add to videos list if not already there
    const existingIndex = videos.value.findIndex(v => v.ascentId === ascentId);
    if (existingIndex === -1) {
      // Prepend to list (most recent first)
      videos.value.unshift(video);
      console.log(`✅ Added video for ascent ${ascentId} to list`);
    } else {
      // Update existing entry
      videos.value[existingIndex] = video;
      console.log(`✅ Updated video for ascent ${ascentId}`);
    }
    
    // Mark as loaded in store so placeholder disappears
    analysisStore.markAscentLoaded(locationId.value, ascentId);
  } else {
    console.warn(`⚠️ Could not load video for ascent ${ascentId}`);
  }
};

// Load OpenCV.js library (lazy loaded via dynamic import)
const loadOpenCV = async () => {
  try {
    // Dynamic import - only loads when this function is called
    const { loadOpenCV: initOpenCV } = await import('../utils/opencv.js');
    await initOpenCV();
    console.log('✅ OpenCV loaded for homography calculations');
  } catch (err) {
    console.error('❌ Failed to load OpenCV.js:', err);
    console.warn('⚠️ Homography calculations will not be available');
  }
};

// Store unregister function for cleanup
let unregisterJobCallback = null;

// Watch currentRoutesetting and reload problems when it changes
watch(currentRoutesetting, async (newRoutesetting, oldRoutesetting) => {
  if (newRoutesetting !== oldRoutesetting && locationId.value) {
    await boulderProblemsStore.loadProblemsForLocation(locationId.value, newRoutesetting);
  }
});

onMounted(async () => {
  // Load location data, videos, and OpenCV in parallel - they're independent
  await Promise.all([
    loadLocation(),
    loadLocationVideos(),
    loadOpenCV(),
  ]);

  // Register callback for job completions at this location
  unregisterJobCallback = analysisStore.onJobComplete(locationId.value, handleJobComplete);

  // Listen for maximize event from global indicator
  window.addEventListener('maximize-analysis-modal', handleMaximizeModal);
});

onUnmounted(() => {
  // Unregister job completion callback
  if (unregisterJobCallback) {
    unregisterJobCallback();
  }

  // Clean up event listener
  window.removeEventListener('maximize-analysis-modal', handleMaximizeModal);
});
</script>

<style scoped>
/* Mobile layout - Stack vertically */
.location-grid {
  grid-template-areas:
    "heroimage heroimage"
    "locationname editbutton"
    "description description";
  grid-template-columns: 1fr auto;
}

/* Desktop layout - Name left, edit right, hero center, description full width */
@media (min-width: 640px) {
  .location-grid {
    grid-template-areas:
      "locationname . editbutton"
      "heroimage heroimage heroimage"
      "description description description";
    grid-template-columns: 1fr 1fr 1fr;
    align-items: start;
  }
}

/* Assign grid areas to elements */
.hero-image {
  grid-area: heroimage;
}

.location-name {
  grid-area: locationname;
}

.action-buttons {
  grid-area: editbutton;
  justify-self: end;
}

.description {
  grid-area: description;
}
</style>
