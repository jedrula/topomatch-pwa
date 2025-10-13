<template>
  <div class="min-h-screen bg-gray-50 px-3 sm:px-4 py-4 sm:py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-gray-600">Loading location...</div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
      >
        {{ error }}
      </div>

      <!-- Location content -->
      <div v-else-if="location" class="space-y-4 sm:space-y-6">

        <!-- Location info -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <!-- Grid layout with template areas -->
          <div class="grid gap-4 sm:gap-6 location-grid">
            <!-- Hero Image -->
            <div v-if="location.heroImageUrl" class="hero-image relative h-32 sm:h-48 rounded-lg overflow-hidden">
              <img
                :src="fixLocalhostUrl(location.heroImageUrl)"
                :alt="location.name"
                class="w-full h-full object-contain"
              />
            </div>
            
            <!-- Location Name -->
            <h1 class="location-name text-2xl sm:text-3xl font-bold leading-tight text-gray-900">
              {{ location.name }}
            </h1>
            
            <!-- Edit button - only show for admins -->
            <button
              v-if="userStore.canEditLocations"
              @click="editLocation"
              class="edit-button px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors self-start"
            >
              Edit
            </button>
            
            <!-- Description -->
            <div class="description">
              <p 
                v-if="location.description" 
                class="text-gray-700 text-base sm:text-lg leading-relaxed"
              >
                {{ location.description }}
              </p>
              <p 
                v-else 
                class="text-gray-500 italic"
              >
                No description provided
              </p>
            </div>
          </div>

          <!-- Upload Beta Video CTA -->
          <div class="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div class="flex-1">
                <h3 class="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span class="text-green-600">🎬</span>
                  Share Your Beta
                </h3>
                <p class="text-sm text-gray-600">
                  Upload a climbing video and we'll identify the problem automatically
                </p>
              </div>
              <button
                type="button"
                @click="handleBetaUploadClick"
                class="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center gap-2 flex-shrink-0 shadow-md hover:shadow-lg"
              >
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span class="text-sm sm:text-base">Upload Beta</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Images section -->
        <LocationImages
          :images="images"
          :location-name="location?.name"
          :can-upload="userStore.canUploadImages"
          :can-edit-holds="userStore.canEditLocations"
          :get-resized-image-url="getResizedImageUrl"
          @upload="showUploadModal = true"
          @image-click="openImageModal"
          @analyze-holds="openHoldDetection"
        />

        <!-- Videos/Betas section -->
        <LocationVideos
          :videos="videos"
          :loading="videosLoading"
          @video-click="openVideoGallery"
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
        <div class="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-gray-100">
          <div class="text-xs text-gray-400 space-y-1 text-center sm:text-left">
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
      :is-open="showUploadModal"
      :location-id="route.params.locationId"
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
      :is-open="showBetaUploadModal"
      :comparison-images="images"
      :location-id="route.params.locationId"
      :is-analyzing="isAnalyzing"
      :analysis-phase="analysisPhase"
      :video-analysis-result="videoAnalysisResult"
      :extracted-frame="extractedFrame"
      :pending-redirect-data="pendingRedirectData"
      :get-grade-color="getGradeColor"
      :get-grade-label="getGradeLabel"
      @close="showBetaUploadModal = false"
      @video-selected="handleBetaVideoSelected"
      @analysis-complete="handleBetaAnalysisComplete"
      @table-scores-ready="handleTableScoresReady"
      @processing-error="handleBetaProcessingError"
      @video-cleared="handleBetaVideoCleared"
      @try-another-video="handleTryAnotherVideo"
      @continue-to-upload="continueToUpload"
    />

    <!-- Image Gallery Modal -->
    <ImageGallerySimplified
      :images="images"
      :initial-index="initialImageIndex"
      :is-open="isGalleryOpen"
      :location-id="locationId"
      :boulder-problems="boulderProblemsStore.boulderProblems || []"
      @close="closeGallery"
      @navigate="onGalleryNavigate"
      @navigate-next="navigateNext"
      @navigate-previous="navigatePrevious"
    />

    <!-- Video Gallery Modal -->
    <VideoGallery
      :videos="filteredVideos"
      :initial-index="videoGalleryIndex"
      :is-open="isVideoGalleryOpen"
      @close="closeVideoGallery"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { locationService } from '../services/locationService.js';
import { useBoulderProblemsStore } from '../stores/boulderProblemsStore.js';
import { useVideoAnalysis } from '../composables/useVideoAnalysis.js';
import ImageUploadModal from '../components/ImageUploadModal.vue';
import ImageGallerySimplified from '../components/ImageGallerySimplified.vue';
import VideoGallery from '../components/VideoGallery.vue';
import BetaVideoUploadModal from '../components/BetaVideoUploadModal.vue';
import LocationImages from '../components/LocationImages.vue';
import LocationVideos from '../components/LocationVideos.vue';
import LocationBoulderProblems from '../components/LocationBoulderProblems.vue';
import { formatDate, isSameDateTime } from '../utils/dateUtils.js';
import { getGradeLabel, getGradeDifficulty, getGradeColor } from '../utils/gradingUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { videoService } from '../services/videoService.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';
import { getResizedImageUrl } from '../utils/imageResize.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Video analysis composable
const {
  videoAnalysisResult,
  extractedFrame,
  isAnalyzing,
  analysisPhase,
  pendingRedirectData,
  handleBetaVideoSelected,
  handleBetaAnalysisComplete,
  handleTableScoresReady, // ✅ NEW: Table-based scoring handler
  handleBetaProcessingError,
  handleBetaVideoCleared,
  handleTryAnotherVideo,
  continueToUpload
} = useVideoAnalysis();

// Inject auth modal controls
const authModal = inject('authModal');

const location = ref(null);
const images = ref([]); // Placeholder for location images
const videos = ref([]); // Beta videos for location
const videosLoading = ref(false);
const problemVideoCounts = ref({}); // Cache for video counts per problem
const isVideoGalleryOpen = ref(false);
const videoGalleryIndex = ref(0);
const currentVideoFilter = ref(null); // For filtering videos by problem;
const isLoading = ref(true);
const error = ref('');
const showUploadModal = ref(false);
const showBetaUploadModal = ref(false);

// Upload tracking state
const pendingMetadataSaves = ref(0);
const totalUploadsExpected = ref(0);

const locationId = computed(() => route.params.locationId);

// Boulder problems summary grouped by grade
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
  return boulderProblemsStore.boulderProblems.length;
});

// Gallery state
const isGalleryOpen = computed(() => {
  return route.query.imageId !== undefined;
});

const initialImageIndex = computed(() => {
  if (!route.query.imageId || !images.value.length) return 0;

  const index = images.value.findIndex((img) => img.id === route.query.imageId);
  return index !== -1 ? index : 0;
});

const loadLocation = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    location.value = await locationService.getLocation(locationId.value);

    // Initialize boulder problems store for this location
    await boulderProblemsStore.initializeForLocation(locationId.value);

    // Load boulder problems
    await boulderProblemsStore.loadBoulderProblems(locationId.value);

    // Load images for this location from the backend
    await loadLocationImages();
  } catch (err) {
    console.error('Error loading location:', err);
    error.value = 'Failed to load location. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const loadLocationImages = async () => {
  try {
    const imageRecords = await locationService.getLocationImages(locationId.value);

    // Transform the records to the format expected by the template
    images.value = imageRecords.map((record) => ({
      id: record.id,
      url: record.downloadUrl,
      name: record.fileName,
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

// Video gallery methods
const openVideoGallery = (index = 0) => {
  videoGalleryIndex.value = index;
  isVideoGalleryOpen.value = true;
};

const closeVideoGallery = () => {
  isVideoGalleryOpen.value = false;
  currentVideoFilter.value = null; // Clear filter when closing
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

    // Set filter and open gallery
    currentVideoFilter.value = problem;
    videoGalleryIndex.value = 0;
    isVideoGalleryOpen.value = true;
  } catch (error) {
    console.error('Error loading problem videos:', error);
  }
};

// Computed property for filtered videos
const filteredVideos = computed(() => {
  let videosToShow = currentVideoFilter.value
    ? videos.value.filter((video) => video.problemId === currentVideoFilter.value.id)
    : videos.value;

  // Add problem names to videos
  return videosToShow.map((video) => {
    const problem = boulderProblemsStore.boulderProblems.find((p) => p.id === video.problemId);

    return {
      ...video,
      problemName: problem?.name || 'Unknown Problem',
    };
  });
});

const handleBetaUploadClick = () => {
  if (!userStore.user) {
    // User is not authenticated, trigger sign-in
    authModal.open();
    return;
  }

  // User is authenticated, show the upload modal
  showBetaUploadModal.value = true;
};

const editLocation = () => {
  // Navigate to edit form (could be same AddLocationView in edit mode)
  router.push(`/location/${locationId.value}/edit`);
};

const openImageModal = (image) => {
  // Navigate to the image gallery with the specific imageId
  router.push({
    query: { ...route.query, imageId: image.id },
  });
};

const openHoldDetection = (image) => {
  // Navigate to hold detection page with image and location information
  router.push({
    path: `/location/${locationId.value}/holds-server`,
    query: {
      imageId: image.id,
      imageName: image.name,
    },
  });
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
  
  const newImageId = images.value[newIndex].id;
  router.push({
    query: { ...route.query, imageId: newImageId }
  });
};

const navigateNext = () => navigateToImage('next');
const navigatePrevious = () => navigateToImage('previous');

const onGalleryNavigate = () => {
  // This is called when the gallery navigates to a different image
  // The ImageGallery component handles the URL update
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
    const imageRecord = await locationService.addLocationImage(
      uploadResult.locationId,
      uploadResult.fileName,
      uploadResult.downloadUrl
    );

    // Add the new image to the images array for immediate display
    images.value.push({
      id: imageRecord.id,
      url: uploadResult.downloadUrl,
      name: uploadResult.fileName,
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
  
  console.log(`Upload stats: total=${uploadStats.totalUploads}, completed=${uploadStats.completedUploads}, failed=${uploadStats.failedUploads}`);
};

onMounted(async () => {
  try {
    // Import OpenCV.js - required for homography matrix calculation
    const cvReadyPromise = await import('@techstark/opencv-js');
    window.cv = await cvReadyPromise.default;
  } catch (err) {
    console.error('❌ Failed to load OpenCV.js:', err);
    console.warn('⚠️ Homography calculations will not be available');
  }

  loadLocation();
  loadLocationVideos();
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

.edit-button {
  grid-area: editbutton;
  justify-self: end;
}

.description {
  grid-area: description;
}
</style>
