<template>
  <div class="min-h-screen bg-gray-100 relative overflow-hidden">
    <!-- Background Image with Crop -->
    <div
      v-if="problem && croppedImageStyle"
      class="absolute inset-0 bg-cover bg-center filter blur-sm opacity-60"
      :style="croppedImageStyle"
    ></div>

    <!-- Content Overlay -->
    <div class="relative z-10 min-h-screen flex flex-col">
      <!-- Main Content -->
      <div class="flex-1 p-2 sm:p-4">
        <div v-if="loading" class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading boulder problem...</p>
        </div>

        <div v-else-if="error" class="text-center">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h3 class="font-bold">Error</h3>
            <p>{{ error }}</p>
          </div>
        </div>

        <!-- Grid Layout: Image + Info on top, Videos below -->
        <div v-else-if="problem" class="max-w-7xl mx-auto space-y-3">
          <!-- Top Row: Problem Image (left) + Combined Info (right) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <!-- Left: Problem Image -->
            <div 
              v-if="image"
              class="bg-white bg-opacity-90 rounded-lg shadow-lg overflow-hidden"
            >
              <div class="relative aspect-[4/3] bg-gray-100">
                <img 
                  :src="image.url" 
                  :alt="problem.name"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Right: Combined Info + Statistics -->
            <div class="bg-white bg-opacity-90 rounded-lg shadow-lg p-4">
              <!-- Problem Header with Icons -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h2 class="text-xl font-bold text-gray-900">{{ problem.name }}</h2>
                  <div class="text-lg font-semibold text-gray-700 mt-1">
                    {{ getGradeLabel(problem.grade) }}
                  </div>
                  <p v-if="problem.description" class="text-sm text-gray-600 mt-2">
                    {{ problem.description }}
                  </p>
                </div>
                
                <!-- Action Icons -->
                <div class="flex items-center gap-2 ml-3">
                  <button
                    v-if="userStore.isAdmin"
                    @click="editProblem"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Problem"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    @click="viewOnImage"
                    class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Back to Location"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Statistics (if logged in) -->
              <div v-if="userStore.isLoggedIn && ascentStore.ascentStats" class="border-t pt-3 mt-3">
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="bg-gray-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-blue-600">
                      {{ ascentStore.ascentStats.totalAscents }}
                    </div>
                    <div class="text-xs text-gray-600">Sends</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-green-600">
                      {{ ascentStore.ascentStats.uniqueClimbers }}
                    </div>
                    <div class="text-xs text-gray-600">Climbers</div>
                  </div>
                  <div v-if="ascentStore.ascentStats.averageUserGrade" class="bg-gray-50 rounded-lg p-2">
                    <div class="text-2xl font-bold text-purple-600">
                      {{ ascentStore.ascentStats.averageUserGrade }}
                    </div>
                    <div class="text-xs text-gray-600">Grade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Beta Videos (full width) -->
          <LocationVideos 
            v-if="userStore.isLoggedIn"
            :videos="betaVideos" 
            :loading="videosLoading"
            @video-click="openVideoGallery"
            @video-deleted="handleVideoDeleted"
          />
        </div>
      </div>
    </div>

    <!-- Video Gallery Modal -->
    <VideoGallery
      :videos="betaVideos"
      :initial-index="videoGalleryIndex"
      :is-open="isVideoGalleryOpen"
      @close="closeVideoGallery"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useAscentStore } from '@/stores/ascentStore';
import { useUserStore } from '@/stores/userStore';
import { locationService } from '@/services/locationService';
import { videoService } from '@/services/videoService';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import LocationVideos from '@/components/LocationVideos.vue';
import VideoGallery from '@/components/VideoGallery.vue';

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
const ascentStore = useAscentStore();
const userStore = useUserStore();

const loading = ref(true);
const error = ref(null);
const problem = ref(null);
const image = ref(null);
const isVideoGalleryOpen = ref(false);
const videoGalleryIndex = ref(0);
const betaVideos = ref([]);
const videosLoading = ref(false);

// Video gallery handlers
const openVideoGallery = (index = 0) => {
  videoGalleryIndex.value = index;
  isVideoGalleryOpen.value = true;
};

const closeVideoGallery = () => {
  isVideoGalleryOpen.value = false;
};

// Load beta videos from the new /climbVideos collection
const loadBetaVideos = async () => {
  if (!route.params.locationId || !route.params.problemId) return;
  
  try {
    videosLoading.value = true;
    const videos = await videoService.getProblemVideos(
      route.params.locationId,
      route.params.problemId
    );
    
    // Transform to match the expected format for LocationVideos and VideoGallery
    betaVideos.value = videos.map(video => ({
      id: video.videoId,
      name: video.uploadedBy || 'Unknown User',
      downloadUrl: video.downloadUrl, // Fixed: was video.url
      uploadedBy: video.uploadedBy,
      uploadedAt: video.uploadedAt, // Fixed: was video.createdAt
      userId: video.userId, // Important for delete permissions
      problemName: problem.value?.name || 'Unknown Problem',
      size: video.size,
      metadata: {
        problemName: problem.value?.name || 'Unknown Problem',
        uploadedBy: video.uploadedBy,
        duration: null,
      }
    }));
  } catch (err) {
    console.error('Error loading beta videos:', err);
  } finally {
    videosLoading.value = false;
  }
};

// Handle video deletion
const handleVideoDeleted = async (videoId) => {
  // Remove the deleted video from the list
  betaVideos.value = betaVideos.value.filter(v => v.id !== videoId);
};

// Calculate cropped image style based on hold bounding boxes
const croppedImageStyle = computed(() => {
  if (!problem.value || !image.value || !problem.value.holds.length) {
    return null;
  }

  const holds = problem.value.holds;

  // Find bounding box of all holds
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  holds.forEach((problemHold) => {
    const hold = problemHold.hold;
    minX = Math.min(minX, hold.x);
    maxX = Math.max(maxX, hold.x + hold.width);
    minY = Math.min(minY, hold.y);
    maxY = Math.max(maxY, hold.y + hold.height);
  });

  // Add padding around the bounding box (20% of the dimensions)
  const padding = 50; // pixels
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = maxX - minX + padding * 2;
  const cropHeight = maxY - minY + padding * 2;

  // Calculate background position and size
  const scaleX = window.innerWidth / cropWidth;
  const scaleY = window.innerHeight / cropHeight;
  const scale = Math.max(scaleX, scaleY);

  return {
    backgroundImage: `url(${image.value.url})`,
    backgroundPosition: `-${cropX * scale}px -${cropY * scale}px`,
    backgroundSize: `${image.value.naturalWidth * scale}px ${image.value.naturalHeight * scale}px`,
  };
});

const viewOnImage = async () => {
  // Navigate back to the image gallery with this image selected
  try {
    const locationId = route.params.locationId;
    const imageId = problem.value.imageId;

    router.push({
      path: `/location/${locationId}`,
      query: { imageId },
    });
  } catch (error) {
    console.error('Error navigating to image:', error);
    // Fallback to location without image query
    router.push(`/location/${route.params.locationId}`);
  }
};

const editProblem = () => {
  // Navigate to holds-server for editing with proper query params
  const queryParams = {
    imageId: problem.value.imageId,
    editingProblemId: route.params.problemId,
  };

  // Add image name if available
  if (image.value?.name) {
    queryParams.imageName = image.value.name;
  }

  router.push({
    path: `/location/${route.params.locationId}/holds-server`,
    query: queryParams,
  });
};

const loadProblemData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const problemId = route.params.problemId;
    const locationId = route.params.locationId;

    // Initialize store for location
    await boulderProblemsStore.initializeForLocation(locationId);

    // Load boulder problems if not already loaded
    if (!boulderProblemsStore.boulderProblems.length) {
      await boulderProblemsStore.loadBoulderProblems(locationId);
    }

    // Check if the store encountered an error
    if (boulderProblemsStore.error) {
      error.value = boulderProblemsStore.error;
      return;
    }

    // Find the specific problem
    problem.value = boulderProblemsStore.boulderProblems.find((p) => p.id === problemId);

    if (!problem.value) {
      error.value = 'Boulder problem not found';
      return;
    }

    // Initialize and load ascent data
    ascentStore.initializeForProblem(locationId, problemId);
    await ascentStore.loadAscents(locationId, problemId);

    // Load beta videos from new /climbVideos collection
    if (userStore.isLoggedIn) {
      await loadBetaVideos();
    }

    // Load the associated image
    const imageId = problem.value.imageId;
    if (imageId) {
      try {
        const imageRecords = await locationService.getLocationImages(locationId);
        const imageRecord = imageRecords.find((img) => img.id === imageId);

        if (imageRecord) {
          image.value = {
            id: imageRecord.id,
            url: imageRecord.downloadUrl,
            name: imageRecord.fileName,
            naturalWidth: 1920, // Default values - will be updated when image loads
            naturalHeight: 1080,
          };

          // Load image to get natural dimensions
          const img = new Image();
          img.onload = () => {
            if (image.value) {
              image.value.naturalWidth = img.naturalWidth;
              image.value.naturalHeight = img.naturalHeight;
            }
          };
          img.src = image.value.url;
        }
      } catch (imgError) {
        console.error('Error loading image:', imgError);
        // Continue without image - the view will still work
      }
    }
  } catch (err) {
    console.error('Error loading boulder problem:', err);
    error.value = 'Failed to load boulder problem';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProblemData();
});
</script>

<style scoped>
/* Additional styles if needed */
</style>
