<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
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
      <div v-else-if="location" class="space-y-6">
        <!-- Header with edit button -->
        <div class="flex items-center justify-end">
          <!-- Edit button - only show for admins -->
          <button
            v-if="userStore.canEditLocations"
            @click="editLocation"
            class="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Edit Location
          </button>
        </div>

        <!-- Hero image or placeholder -->
        <div class="relative h-64 rounded-lg overflow-hidden bg-gray-200">
          <img
            v-if="location.heroImageUrl"
            :src="location.heroImageUrl"
            :alt="location.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex items-center justify-center h-full text-gray-500">
            <div class="text-center">
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p class="text-lg font-medium">No hero image</p>
              <p class="text-sm">Upload an image to showcase this location</p>
            </div>
          </div>
        </div>

        <!-- Location info -->
        <div class="bg-white rounded-lg shadow p-6">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ location.name }}</h1>
          <p v-if="location.description" class="text-gray-700 text-lg leading-relaxed mb-6">
            {{ location.description }}
          </p>
          <p v-else class="text-gray-500 italic mb-6">No description provided</p>

          <!-- Upload Beta Video CTA -->
          <div class="border-t pt-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Share Your Beta</h3>
                <p class="text-sm text-gray-600">
                  Upload a climbing video and let AI identify the problem automatically
                </p>
              </div>
              <button
                type="button"
                @click="handleBetaUploadClick"
                class="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Upload Beta Video
              </button>
            </div>
          </div>
        </div>

        <!-- Boulder Problems Summary -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Boulder Problems</h2>
              <p v-if="totalProblems > 0" class="text-sm text-gray-600">
                {{ totalProblems }} problems total
              </p>
            </div>
          </div>

          <!-- Grade distribution -->
          <div
            v-if="totalProblems > 0"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
          >
            <div
              v-for="gradeGroup in boulderProblemsSummary"
              :key="gradeGroup.label"
              class="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer"
              @click="viewProblemsOfGrade(gradeGroup)"
            >
              <div class="text-2xl font-bold text-gray-900 mb-1">
                {{ gradeGroup.count }}
              </div>
              <div class="text-sm font-medium text-gray-700 mb-1">Grade {{ gradeGroup.label }}</div>
              <div class="text-xs text-gray-500">
                {{ gradeGroup.count === 1 ? "problem" : "problems" }}
              </div>
            </div>
          </div>

          <!-- No problems message -->
          <div v-else class="text-center py-8">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-gray-400"
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
            <h3 class="text-lg font-medium text-gray-900 mb-2">No boulder problems yet</h3>
            <p class="text-gray-500 mb-4">
              Upload images and use the hold detection tool to create boulder problems
            </p>
          </div>
        </div>

        <!-- Images section -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Images</h2>
            <button
              v-if="userStore.canUploadImages"
              @click="showUploadModal = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Images
            </button>
          </div>

          <!-- No images placeholder -->
          <div v-if="images.length === 0" class="text-center py-12">
            <svg
              class="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p class="text-gray-500 mb-4">
              Upload photos of boulder problems, routes, or the location itself
            </p>
            <button
              @click="showUploadModal = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Your First Images
            </button>
          </div>

          <!-- Images grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="image in images"
              :key="image.id"
              class="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group"
            >
              <!-- Check if it's a HEIC file -->
              <div
                v-if="isHeicFile(image.name)"
                class="w-full h-full flex items-center justify-center text-gray-500 bg-gray-200 cursor-pointer hover:bg-gray-300 transition-colors"
                @click="openImageModal(image)"
              >
                <div class="text-center">
                  <svg
                    class="w-8 h-8 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p class="text-xs font-medium">HEIC</p>
                  <p class="text-xs text-gray-500">{{ image.name.split("-").pop() }}</p>
                </div>
              </div>
              <img
                v-else
                :src="image.url"
                :alt="image.name"
                class="w-full h-full object-cover hover:opacity-75 transition-opacity cursor-pointer"
                @click="openImageModal(image)"
              />

              <!-- Admin Edit Icon (only for admins, only for non-HEIC images) -->
              <button
                v-if="userStore.canEditLocations && !isHeicFile(image.name)"
                @click.stop="openHoldDetection(image)"
                class="absolute top-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-green-600 rounded-full shadow-sm transition-all duration-200 z-10"
                title="Analyze holds and create boulder problems"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Subtle metadata at bottom -->
        <div class="mt-8 pt-4 border-t border-gray-100">
          <div class="text-xs text-gray-400 space-y-1">
            <div>Created on {{ formatDate(location.createdAt) }}</div>
            <div
              v-if="location.updatedAt && !isSameDateTime(location.createdAt, location.updatedAt)"
            >
              Last updated on {{ formatDate(location.updatedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal (placeholder) -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 class="text-lg font-semibold">Upload Images</h3>
          <button @click="showUploadModal = false" class="text-gray-400 hover:text-gray-600">
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
          <ImageUpload
            :location-id="route.params.locationId"
            @uploaded="handleImageUploadComplete"
            @error="handleImageUploadError"
          />
        </div>

        <div class="flex gap-2 p-6 pt-4 flex-shrink-0 border-t">
          <button
            @click="showUploadModal = false"
            class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Beta Video Upload Modal -->
    <div
      v-if="showBetaUploadModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col py-4">
        <div class="flex items-center justify-between px-6 pb-4 flex-shrink-0">
          <div>
            <h3 class="text-lg font-semibold">Upload Beta Video</h3>
            <p class="text-sm text-gray-600 mt-1">
              Upload a climbing video and let AI identify the problem automatically
            </p>
          </div>
          <button
            type="button"
            @click="showBetaUploadModal = false"
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
          <VideoFrameMatcher
            :comparison-images="images"
            title="Upload Beta Video"
            subtitle="Upload a climbing video and let AI identify the boulder problem automatically"
            :frame-extraction-time="5"
            :auto-start-matching="true"
            @video-selected="handleBetaVideoSelected"
            @frame-extracted="handleBetaFrameExtracted"
            @match-found="handleBetaMatchFound"
            @analysis-complete="handleBetaAnalysisComplete"
            @processing-error="handleBetaProcessingError"
            @video-cleared="handleBetaVideoCleared"
          />
        </div>
      </div>
    </div>

    <!-- Image Gallery Modal -->
    <ImageGallery
      :images="images"
      :initial-index="initialImageIndex"
      :is-open="isGalleryOpen"
      :location-id="locationId"
      @close="closeGallery"
      @navigate="onGalleryNavigate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import { useBoulderProblemsStore } from "../stores/boulderProblemsStore.js";
import ImageUpload from "../components/ImageUpload.vue";
import ImageGallery from "../components/ImageGallery.vue";
import VideoFrameMatcher from "../components/VideoFrameMatcher.vue";
import { formatDate, isSameDateTime } from "../utils/dateUtils.js";
import { getGradeLabel, getGradeDifficulty } from "../utils/gradingUtils.js";
import { useUserStore } from "../stores/userStore.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Inject auth modal controls
const authModal = inject("authModal");

const location = ref(null);
const images = ref([]); // Placeholder for location images
const isLoading = ref(true);
const error = ref("");
const showUploadModal = ref(false);
const showBetaUploadModal = ref(false);

const locationId = route.params.locationId;

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
    error.value = "";

    location.value = await locationService.getLocation(locationId);

    // Initialize boulder problems store for this location
    await boulderProblemsStore.initializeForLocation(locationId);

    // Load boulder problems
    await boulderProblemsStore.loadBoulderProblems(locationId);

    // Load images for this location from the backend
    await loadLocationImages();
  } catch (err) {
    console.error("Error loading location:", err);
    error.value = "Failed to load location. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

const loadLocationImages = async () => {
  try {
    const imageRecords = await locationService.getLocationImages(locationId);

    // Transform the records to the format expected by the template
    images.value = imageRecords.map((record) => ({
      id: record.id,
      url: record.downloadUrl,
      name: record.fileName,
    }));

    console.log("Loaded location images:", images.value);
  } catch (err) {
    console.error("Error loading location images:", err);
    // Don't set error here, just keep images empty
    images.value = [];
  }
};

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
  router.push(`/location/${locationId}/edit`);
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
    path: `/location/${locationId}/holds-server`,
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

const onGalleryNavigate = () => {
  // This is called when the gallery navigates to a different image
  // The ImageGallery component handles the URL update
};

const isHeicFile = (fileName) => {
  if (!fileName) return false;
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
};

const handleImageUploadComplete = async (uploadResult) => {
  console.log("Image uploaded successfully:", uploadResult);

  try {
    // Save image metadata to Firestore via backend function
    const imageRecord = await locationService.addLocationImage(
      uploadResult.locationId,
      uploadResult.fileName,
      uploadResult.downloadUrl
    );
    console.log("Image metadata saved:", imageRecord);

    // Add the new image to the images array for immediate display
    images.value.push({
      id: imageRecord.id,
      url: uploadResult.downloadUrl,
      name: uploadResult.fileName,
    });
  } catch (error) {
    console.error("Error saving image metadata:", error);
    // Still close modal even if metadata save fails
  }

  // Close the modal after successful upload
  showUploadModal.value = false;
};

const handleImageUploadError = (error) => {
  console.error("Image upload failed:", error);
  // Handle upload error (show notification, etc.)
};

const handleBetaVideoSelected = (videoFile) => {
  console.log("Beta video selected:", videoFile.name);
};

const handleBetaFrameExtracted = (frameData) => {
  console.log("Beta frame extracted:", frameData);
};

const handleBetaMatchFound = (matchData) => {
  console.log("Beta match found:", matchData);
  // Could show a success notification or navigate to the matched image
};

const handleBetaAnalysisComplete = (result) => {
  console.log("Beta analysis complete:", result);
  if (!result.match) {
    // No match found
    alert("No clear match found. You may need to manually identify the boulder problem.");
  }
};

const handleBetaProcessingError = (error) => {
  console.error("Beta processing error:", error);
  alert("Error processing video: " + error.message);
};

const handleBetaVideoCleared = () => {
  console.log("Beta video cleared");
};

const viewProblemsOfGrade = (gradeGroup) => {
  // For now, just show an alert with the problems of this grade
  // In the future, this could navigate to a filtered view or show a modal
  const problemNames = gradeGroup.problems.map((p) => p.name).join(", ");
  alert(`Grade ${gradeGroup.label} problems (${gradeGroup.count}):\n${problemNames}`);
};

onMounted(() => {
  loadLocation();
});
</script>
