<template>
  <div class="min-h-screen">
    <!-- Toast Notification -->
    <ToastNotification />

    <div class="container py-2 sm:py-4">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md mb-6">
        {{ error }}
      </div>

      <!-- Location content -->
      <div v-else-if="location" class="space-y-8">

        <!-- Location Header -->
        <div class="flex gap-2 items-center">
          <!-- Location Image (true rectangle) -->
          <div class="w-28 aspect-[4/3] sm:w-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <img
              v-if="location.heroImageUrl"
              :src="fixLocalhostUrl(location.heroImageUrl)"
              :alt="location.name"
              class="w-full h-full object-cover"
              crossorigin="anonymous"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <!-- Location Info -->
          <div class="flex-1 min-w-0">
            <div class="text-lg font-semibold text-gray-900 line-clamp-1">
              {{ location.name }}
            </div>
            <p v-if="location.address" class="text-[11px] sm:text-[12px] text-gray-500 line-clamp-2 mt-0.5">
              {{ location.address }}
            </p>
            <p v-if="location.description" class="text-[11px] sm:text-[12px] text-gray-400 line-clamp-2 mt-1">
              {{ location.description }}
            </p>
          </div>
          
          <!-- Actions: Heart + Notify + Three Dots -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Like Button with count badge -->
            <div class="relative">
              <button
                @click="handleToggleLike"
                :disabled="!userStore.user"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:cursor-not-allowed"
                :title="userStore.user ? (isLocationLiked ? 'Unlike this location' : 'Like this location') : 'Sign in to like'"
              >
                <!-- Filled heart when liked -->
                <svg v-if="isLocationLiked" class="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <!-- Outline heart when not liked -->
                <svg v-else class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <!-- Like count badge (positioned absolutely) -->
              <span v-if="location.likesCount > 0" class="absolute -bottom-0.5 -right-0.5 text-[10px] text-gray-500 bg-white rounded-full px-1 min-w-[1rem] text-center border border-gray-200">
                {{ location.likesCount }}
              </span>
            </div>
            
            <!-- Notify Button (Bell Icon) -->
            <button
              v-if="userStore.canEditLocations"
              @click="publishRoutesetting"
              :disabled="isPublishing"
              class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Notify all users about new routesetting"
            >
              <svg v-if="!isPublishing" class="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
            
            <!-- More Menu -->
            <div class="relative" v-if="userStore.canEditLocations || allRoutesettings.length > 0">
              <button
                @click.stop="showMoreMenu = !showMoreMenu"
                class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                title="More options"
              >
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              <!-- Dropdown Menu -->
              <div
                v-if="showMoreMenu"
                @click.stop
                class="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              >
                <button
                  v-if="userStore.canEditLocations"
                  @click="editLocation(); showMoreMenu = false"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <router-link
                  v-if="allRoutesettings.length > 0"
                  :to="{ path: `/location/${locationId}/routesettings`, query: { routesetting: currentRoutesetting } }"
                  @click="showMoreMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History
                </router-link>
                <router-link
                  v-if="userStore.canEditLocations"
                  :to="`/location/${locationId}/jobs`"
                  @click="showMoreMenu = false"
                  class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Jobs
                </router-link>
              </div>
            </div>
          </div>
        </div>



        <!-- Historical Routesetting Banner (only shown when NOT viewing latest) -->
        <div 
          v-if="allRoutesettings.length > 0 && currentRoutesetting !== allRoutesettings[0]"
          class="border border-amber-200 bg-amber-50 rounded-lg p-4"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <div class="text-[13px] font-medium text-amber-900">
                  Viewing historical routesetting: <strong>{{ formatRoutesettingDate(currentRoutesetting) }}</strong>
                </div>
                <div class="text-[12px] text-amber-700 mt-0.5">
                  Go to <router-link :to="{ path: `/location/${locationId}/routesettings`, query: { routesetting: currentRoutesetting } }" class="underline hover:text-amber-900">routesetting management</router-link> to switch to latest or other versions
                </div>
              </div>
            </div>
            <router-link
              :to="{ path: `/location/${locationId}/routesettings`, query: { routesetting: currentRoutesetting } }"
              class="h-8 px-3 text-[13px] text-amber-700 border border-amber-700 rounded-md hover:bg-amber-100 transition-all flex-shrink-0 flex items-center"
            >
              Manage
            </router-link>
          </div>
        </div>

        <!-- Images section -->
        <LocationImages
          :images="images"
          :loading="imagesLoading"
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
          :location="location"
          :all-routesettings="allRoutesettings"
          @video-deleted="handleVideoDeleted"
          @reprocess-video="handleReprocessVideo"
          @open-manual-assign="handleOpenManualAssign"
          @routesetting-changed="handleRoutesettingChanged"
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
        <div class="pt-1 border-t border-gray-200/60 mb-12">
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
      :location-name="location?.name"
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

    <!-- Floating Action Button -->
    <FloatingActionButton 
      :isAuthenticated="!!userStore.user"
      @file-selected="handleVideoFileSelected"
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
import FloatingActionButton from '../components/FloatingActionButton.vue';
import ImageGallerySimplified from '../components/ImageGallerySimplified.vue';
import BetaVideoUploadModal from '../components/BetaVideoUploadModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import LocationImages from '../components/LocationImages.vue';
import LocationVideos from '../components/LocationVideos.vue';
import LocationBoulderProblems from '../components/LocationBoulderProblems.vue';
import { formatDate, isSameDateTime } from '../utils/dateUtils.js';
import { getGradeLabel, getGradeDifficulty, getGradeColor } from '../utils/gradingUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { useLocationLikesStore } from '../stores/locationLikesStore.js';
import { generateUUID } from '../utils/uuid.js';
import { useVideoAnalysisQueueStore, getCurrentStep } from '../stores/videoAnalysisQueueStore.js';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';
import { videoService } from '../services/videoService.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';
import { getResizedImageUrl } from '../utils/imageResize.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const locationLikesStore = useLocationLikesStore();
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
const imagesLoading = ref(false);
const problemVideoCounts = ref({}); // Cache for video counts per problem
const isLoading = ref(true);
const error = ref('');
const showUploadModal = ref(false);
const showBetaUploadModal = ref(false);
const isBetaModalMinimized = ref(false); // Track if modal is minimized
const currentUploadSessionId = ref(null); // Each upload session gets unique ID for component reset
const isPublishing = ref(false); // Track publishing state
const showMoreMenu = ref(false); // Track more menu visibility

// Upload tracking state
const pendingMetadataSaves = ref(0);
const totalUploadsExpected = ref(0);

const locationId = computed(() => route.params.locationId);

// Check if current user has liked this location
const isLocationLiked = computed(() => {
  return locationLikesStore.isLocationLiked(locationId.value);
});

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
  
  // Check completion registry for errors
  const completionRegistry = analysisStore.completionRegistry;
  
  // 2. Get UPLOAD progress and create INSTANT video objects from local files
  const allUploads = uploadQueue.uploads;
  const locationUploads = Object.values(allUploads).filter(
    upload => upload.locationId === locationId.value
  );
  
  // Create video objects from uploading files (show immediately with local blob URL!)
  const uploadingVideos = locationUploads
    .filter(upload => {
      // Check if this upload has errored in analysis
      const completion = completionRegistry[upload.ascentId];
      if (completion && completion.status === 'error') {
        // Check if server video has loaded for this ascent
        const serverVideoLoaded = videos.value.some(v => v.ascentId === upload.ascentId);
        if (serverVideoLoaded) {
          // Server video is here, hide the upload placeholder
          return false;
        }
        // Server video not loaded yet, KEEP showing upload even though it errored
        // (Otherwise video disappears between error and server load)
        return true;
      }
      
      // Show video during upload AND after completion (until server video loads)
      return upload.status === 'uploading' || upload.status === 'pending' || upload.status === 'completed';
    })
    .map(upload => {
      // Check if this upload has errored in analysis
      const completion = completionRegistry[upload.ascentId];
      const hasErrored = completion && completion.status === 'error';
      
      // Get current step for progress message
      const isCurrentlyAnalyzing = analyzingAscentIds.has(upload.ascentId) && !hasErrored;
      const currentStep = isCurrentlyAnalyzing
        ? getCurrentStep(activeJobs.find(j => j.ascentId === upload.ascentId)?.progress || 0)
        : null;
      
      return {
        id: upload.ascentId,
        ascentId: upload.ascentId,
        userId: userStore.user?.uid,  // Current user is the uploader
        problemId: upload.problemId || null,
        url: upload.localUrl,  // ✨ Reuse blob URL from upload queue!
        isLocalVideo: true,  // Flag to know this is temporary
        isUploading: upload.status === 'uploading' || upload.status === 'pending',
        isAnalyzing: isCurrentlyAnalyzing,
        progress: isCurrentlyAnalyzing 
          ? activeJobs.find(j => j.ascentId === upload.ascentId)?.progress || 0
          : upload.progress || 0,
        status: upload.status,
        statusMessage: currentStep?.message || 'Uploading video...',
        uploadedBy: userStore.user?.displayName || userStore.user?.email || 'Analyzing...',
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
    uploadedBy: userStore.user?.displayName || userStore.user?.email || 'Processing...',
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
    if (serverAscentIds.has(upload.ascentId)) {
      // Server video is here, remove the upload record (whether completed or errored)
      uploadQueue.cancelUpload(upload.ascentId);
    }
  });
  
  // Clean up error entries in completion registry when server video loads
  // (This allows failed videos to show up after refresh)
  serverAscentIds.forEach(ascentId => {
    if (completionRegistry[ascentId] && completionRegistry[ascentId].status === 'error') {
      delete completionRegistry[ascentId];
    }
  });
  
  // Filter out server videos that are still uploading (show local version instead)
  const uploadingAscentIds = new Set(locationUploads.map(u => u.ascentId));
  const serverVideos = videos.value
    .filter(video => 
      !uploadingAscentIds.has(video.ascentId) && !completedJobs.some(j => j.ascentId === video.ascentId)
    )
    .map(video => {
      // Check if this server video is currently being re-analyzed
      const isReanalyzing = analyzingAscentIds.has(video.ascentId);
      
      return {
        ...video,
        // Explicitly set these flags - check if re-analyzing
        isUploading: false,
        isAnalyzing: isReanalyzing,
      };
    });
  
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

// Load critical data needed for initial page render (just header)
// Manages isLoading state internally
const loadCriticalData = async () => {
  isLoading.value = true;
  
  try {
    // Load ONLY what's needed for the location header
    // (name, address, description, heroImage)
    await Promise.all([
      loadLocationMetadata(),
      loadRoutesettings(),
    ]);
  } finally {
    // Show page immediately with header - images/problems load in background
    isLoading.value = false;
  }
};

// Load images and problems after page is visible
const loadImagesAndProblems = async () => {
  imagesLoading.value = true;
  
  try {
    // Initialize boulder problems store (needs to be done once)
    await boulderProblemsStore.initializeForLocation(locationId.value);
    
    // Load images and problems in parallel (both use currentRoutesetting)
    await Promise.all([
      loadLocationImages(),
      boulderProblemsStore.loadBoulderProblems(locationId.value, null, currentRoutesetting.value),
    ]);
  } finally {
    imagesLoading.value = false;
  }
};

const loadLocationMetadata = async () => {
  location.value = await locationService.getLocation(locationId.value);
};

const loadRoutesettings = async () => {
  allRoutesettings.value = await routesettingService.getRoutesettings(locationId.value);
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

// Handle routesetting change
const handleRoutesettingChanged = async (videoId) => {
  console.log('📅 Routesetting changed for video:', videoId);
  // Reload videos to reflect the changes
  await loadLocationVideos();
};

// Handle video re-processing (for unclassified videos)
const handleReprocessVideo = async (video) => {
  try {
    console.log('🔄 Re-processing video:', video.id);
    
    // Clear any error state from previous analysis
    analysisStore.clearCompletionError(video.ascentId);
    
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

// Handle opening manual assignment mode
const handleOpenManualAssign = (videoId) => {
  // Get the first image to open the gallery
  const firstImage = images.value[0];
  if (!firstImage) {
    alert('No images available. Please upload images first.');
    return;
  }
  
  // Navigate to image gallery with assignVideoId and first image
  router.push({
    query: {
      ...route.query,
      assignVideoId: videoId,
      imageId: firstImage.imageId,
    },
  });
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

    // Open VideoPlayerShorts with the first video and problemId filter
    router.push({
      path: route.path,
      query: {
        ...route.query,
        videoId: problemVideos[0].id,
        problemId: problem.id, // Add problemId to filter videos in player
      },
    });
  } catch (error) {
    console.error('Error loading problem videos:', error);
  }
};

// Handle video file selection from FloatingActionButton
const handleVideoFileSelected = async (file) => {
  if (!file) return;
  
  try {
    console.log('📹 Video selected:', file.name);
    
    // Removed client-side thumbnail extraction to reduce memory usage
    // Thumbnails can be generated server-side during transcoding if needed
    
    // Generate new session ID
    currentUploadSessionId.value = generateUUID();
    console.log('🆔 Session ID:', currentUploadSessionId.value);
    
    // Open modal minimized
    showBetaUploadModal.value = true;
    isBetaModalMinimized.value = true;
    
    // Wait for modal to mount, then trigger video processing
    await nextTick();
    await nextTick();
    
    if (betaUploadModalRef.value && betaUploadModalRef.value.handleVideoSelected) {
      betaUploadModalRef.value.handleVideoSelected(file);
    } else {
      console.error('❌ Modal ref or handleVideoSelected method not available');
    }
  } catch (error) {
    console.error('❌ Error handling video selection:', error);
    alert('Failed to process video. Please try again.');
  } finally {
    // Clear input so same file can be selected again
    event.target.value = '';
  }
};

// Format routesetting date for display
const formatRoutesettingDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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

const handleToggleLike = async () => {
  if (!userStore.user) {
    authModal.open();
    return;
  }

  try {
    const result = await locationLikesStore.toggleLike(locationId.value);
    
    // Update local location object with new count
    if (location.value) {
      location.value.likesCount = result.likesCount;
    }
    
    // Show subtle feedback
    if (result.isLiked) {
      toast.success('❤️ Added to favorites');
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    toast.error('Failed to update like');
  }
};

const publishRoutesetting = async () => {
  if (!location.value) return;
  
  isPublishing.value = true;
  try {
    // Import the push notification service
    const { notifyNewRoutesetting } = await import('@/services/pushNotificationService');
    
    await notifyNewRoutesetting(locationId.value, location.value.name);
    
    toast.success('🔔 Routesetting announcement sent to all users!');
  } catch (error) {
    console.error('Error publishing routesetting:', error);
    toast.error('❌ Failed to send notification');
  } finally {
    isPublishing.value = false;
  }
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
  // Navigation is handled by the child component (ImageGallerySimplified)
  // This is just a placeholder for any parent-side cleanup if needed
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
  
  // WAIT for upload to complete first (race condition fix)
  // Analysis can finish before upload updates Firestore, so we need to wait
  const upload = uploadQueue.getUpload(ascentId);
  if (upload && (upload.status === 'uploading' || upload.status === 'pending')) {
    console.log(`⏳ Waiting for upload to complete for ascent ${ascentId}...`);
    await uploadQueue.waitForUpload(ascentId);
    console.log(`✅ Upload completed for ascent ${ascentId}, now loading video...`);
  }
  
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

// Centralized initialization function
const initializeLocationData = async () => {
  // Reset state
  location.value = null;
  videos.value = [];
  images.value = [];
  error.value = '';
  
  // Unregister old job callback if it exists
  if (unregisterJobCallback) {
    unregisterJobCallback();
    unregisterJobCallback = null;
  }
  
  try {
    // Load critical data (just header - manages isLoading internally)
    await loadCriticalData();
    
    // Load images and problems (shows empty states while loading)
    loadImagesAndProblems().catch(err => {
      console.error('Error loading images/problems:', err);
    });
    
    // Load non-critical resources in background
    loadLocationVideos().catch(err => {
      console.error('Error loading videos in background:', err);
    });
    
    loadOpenCV().catch(err => {
      console.error('Error loading OpenCV in background:', err);
    });
    
    // Register callback for job completions at this location
    unregisterJobCallback = analysisStore.onJobComplete(locationId.value, handleJobComplete);
  } catch (err) {
    console.error('Error loading location:', err);
    error.value = 'Failed to load location. Please try again.';
  }
};

// Watch currentRoutesetting and reload problems when it changes
watch(currentRoutesetting, async (newRoutesetting, oldRoutesetting) => {
  if (newRoutesetting !== oldRoutesetting && locationId.value) {
    await boulderProblemsStore.loadProblemsForLocation(locationId.value, newRoutesetting);
  }
});

// Watch for location ID changes (e.g., from notification navigation)
watch(() => route.params.locationId, async (newLocationId, oldLocationId) => {
  if (newLocationId && newLocationId !== oldLocationId) {
    console.log('[LocationDetailView] Location ID changed:', oldLocationId, '→', newLocationId);
    await initializeLocationData();
  }
});

onMounted(async () => {
  await initializeLocationData();

  // Load user's liked locations if authenticated
  if (userStore.user) {
    locationLikesStore.loadUserLikes();
  }

  // Listen for maximize event from global indicator
  window.addEventListener('maximize-analysis-modal', handleMaximizeModal);
  
  // Close more menu when clicking outside
  document.addEventListener('click', () => {
    showMoreMenu.value = false;
  });
});

onUnmounted(() => {
  // Unregister job completion callback
  if (unregisterJobCallback) {
    unregisterJobCallback();
  }

  // Clean up event listeners
  window.removeEventListener('maximize-analysis-modal', handleMaximizeModal);
  document.removeEventListener('click', () => {
    showMoreMenu.value = false;
  });
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
