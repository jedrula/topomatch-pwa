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
      <div class="flex-1 p-4">
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

        <div
          v-else-if="problem"
          class="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 sm:p-8 w-full"
        >
          <!-- Boulder Problem Info -->
          <div class="text-center mb-6">
            <div
              class="w-4 h-4 rounded-full mx-auto mb-3"
              :style="{ backgroundColor: problem.color }"
            ></div>
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{{ problem.name }}</h2>
            <div class="text-xl sm:text-2xl font-semibold text-gray-700 mb-1">
              Grade {{ getGradeLabel(problem.grade) }}
            </div>
            <div class="text-gray-500">{{ problem.holds.length }} holds</div>
          </div>

          <!-- Additional Info -->
          <div class="space-y-4">
            <div v-if="problem.description" class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-2">Description</h3>
              <p class="text-gray-700">{{ problem.description }}</p>
            </div>

            <div class="border-t pt-4">
              <h3 class="font-semibold text-gray-900 mb-2">Details</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500">Created:</span>
                  <span class="block">{{ formatDate(problem.createdAt) }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Updated:</span>
                  <span class="block">{{ formatDate(problem.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="border-t pt-4 space-y-3">
              <button
                @click="viewOnImage"
                class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                View on Image
              </button>
              <button
                v-if="userStore.isAdmin"
                @click="editProblem"
                class="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Edit Problem
              </button>
            </div>

            <!-- Ascent Section - Always show but require login for functionality -->
            <div class="border-t pt-4">
              <div class="mb-4">
                <button
                  @click="handleLogSendClick"
                  class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    ></path>
                  </svg>
                  <span>{{
                    userStore.isLoggedIn && showAscentLogger ? "Cancel" : "Log Send"
                  }}</span>
                </button>
              </div>

              <!-- Ascent Logger - Only show if logged in -->
              <div v-if="userStore.isLoggedIn && showAscentLogger" class="mb-4">
                <AscentLogger
                  :location-id="route.params.locationId"
                  :problem-id="route.params.problemId"
                  @ascent-logged="onAscentLogged"
                />
              </div>

              <!-- Quick Status - Only show for logged in users -->
              <div
                v-if="userStore.isLoggedIn && ascentStore.hasUserSent && !showAscentLogger"
                class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div class="flex items-center space-x-2">
                  <svg
                    class="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span class="font-medium text-green-800">You've sent this problem!</span>
                </div>
                <div class="text-sm text-green-700 mt-1">
                  Total sends: {{ ascentStore.userSentCount }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ascent History Panel - Full width underneath main content -->
      <div v-if="userStore.isLoggedIn && problem" class="w-full px-4 pb-8">
        <div class="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 sm:p-6">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Ascent History</h3>
          <AscentHistory 
            @edit-ascent="editAscent" 
            :compact="true"
            @video-fullscreen="openVideoFullscreen"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useAscentStore } from '@/stores/ascentStore';
import { useUserStore } from '@/stores/userStore';
import { locationService } from '@/services/locationService';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import AscentLogger from '@/components/AscentLogger.vue';
import AscentHistory from '@/components/AscentHistory.vue';

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
const ascentStore = useAscentStore();
const userStore = useUserStore();

// Inject auth modal controls
const authModal = inject('authModal');

const loading = ref(true);
const error = ref(null);
const problem = ref(null);
const image = ref(null);
const showAscentLogger = ref(false);

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

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

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

// Handle Log Send button click - show auth modal if not logged in
const handleLogSendClick = () => {
  if (!userStore.isLoggedIn) {
    // User not logged in, show auth modal
    authModal.open();
  } else {
    // User is logged in, toggle ascent logger
    showAscentLogger.value = !showAscentLogger.value;
  }
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

const onAscentLogged = () => {
  showAscentLogger.value = false;
  // The ascent store will automatically update with the new data
};

const editAscent = (ascent) => {
  // For now, just show the logger with the ascent data
  // In a more complex implementation, you could pre-populate the form
  showAscentLogger.value = true;
};

const openVideoFullscreen = (videoUrl) => {
  // Create a modal or redirect to fullscreen video
  // For now, let's open in a new window/tab
  window.open(videoUrl, '_blank');
};

onMounted(() => {
  loadProblemData();

  // Check if we should auto-open ascent logger with prefilled video
  if (route.query.action === 'log-ascent' && route.query.hasPrefilledVideo === 'true') {

    // Auto-open the ascent logger
    showAscentLogger.value = true;

    // The AscentLogger component will handle checking for prefilled video data
  }
});
</script>

<style scoped>
/* Additional styles if needed */
</style>
