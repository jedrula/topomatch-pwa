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
        <BoulderProblemsGradeList 
          :problems="boulderProblemsStore.boulderProblems"
          :location-id="locationId"
        >
          <template #empty-state-actions>
            <!-- Custom actions for empty state could go here if needed -->
          </template>
        </BoulderProblemsGradeList>

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
            :location-id="route.params.locationId"
            title="Upload Beta Video"
            subtitle="Upload a climbing video and let AI identify the boulder problem automatically"
            :frame-extraction-time="5"
            :auto-start-matching="true"
            @video-selected="handleBetaVideoSelected"
            @analysis-complete="handleBetaAnalysisComplete"
            @processing-error="handleBetaProcessingError"
            @video-cleared="handleBetaVideoCleared"
          />

          <!-- Analysis in Progress -->
          <div
            v-if="isAnalyzing && !videoAnalysisResult"
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
                      ? "AI is comparing your video frame with boulder images"
                      : analysisPhase === "extracting-frames"
                      ? "Getting multiple frames from your video"
                      : analysisPhase === "detecting-poses"
                      ? "Using AI to detect your body position"
                      : analysisPhase === "analyzing-holds"
                      ? "Determining which holds you're using"
                      : "Enhanced AI analysis in progress"
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
                  class="w-full max-w-xs h-32 object-cover rounded-lg border mx-auto"
                />
              </div>

              <!-- Action Buttons -->
              <div class="mt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  @click="
                    videoAnalysisResult = null;
                    extractedFrame = null;
                    matchedBoulderImage = null;
                    allFrames = [];
                    poseResults = [];
                    analysisPhase = '';
                  "
                  class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Try Another Video
                </button>
                <button
                  type="button"
                  @click="showBetaUploadModal = false"
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
import BoulderProblemsGradeList from "../components/BoulderProblemsGradeList.vue";
import VideoFrameMatcher from "../components/VideoFrameMatcherEnhanced.vue";
import { formatDate, isSameDateTime } from "../utils/dateUtils.js";
import { useUserStore } from "../stores/userStore.js";
import { transformPoint } from "../utils/homographyUtils.js";

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

// Video analysis state
const videoAnalysisResult = ref(null);
const extractedFrame = ref(null);
const isAnalyzing = ref(false);

// Enhanced workflow state
const matchedBoulderImage = ref(null);
const allFrames = ref([]); // Will store 3 frames after match found
const poseResults = ref([]); // Will store pose detection results
const analysisPhase = ref(""); // 'matching', 'extracting-frames', 'detecting-poses', 'analyzing-holds'

const locationId = route.params.locationId;

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
  // Reset previous results and start matching phase
  videoAnalysisResult.value = null;
  extractedFrame.value = null;
  matchedBoulderImage.value = null;
  allFrames.value = [];
  poseResults.value = [];
  isAnalyzing.value = true;
  analysisPhase.value = "matching";
};

const handleBetaAnalysisComplete = async (analysisData) => {
  console.log("🎉 Enhanced analysis complete:", analysisData);

  // The Enhanced component provides complete analysis including:
  // - video: the selected video file
  // - frames: extracted frames with pose data
  // - match: matched image with homography matrix

  if (!analysisData.match) {
    console.log("❌ No match found in analysis");
    videoAnalysisResult.value = {
      success: false,
      error: true,
      message: "No matching boulder found in the uploaded video.",
    };
    isAnalyzing.value = false;
    return;
  }

  // Store basic results
  matchedBoulderImage.value = analysisData.match;
  allFrames.value = analysisData.frames || [];
  extractedFrame.value = analysisData.frames?.[1] || null; // Middle frame for display

  // Convert Enhanced component frame data to our expected format
  const frameResults = [];
  if (analysisData.frames) {
    for (let i = 0; i < analysisData.frames.length; i++) {
      const frame = analysisData.frames[i];

      console.log(`🔍 Processing frame ${i}:`, {
        hasPoseData: !!frame.poseData,
        poseDataStructure: frame.poseData ? Object.keys(frame.poseData) : "none",
      });

      if (frame.poseData && frame.poseData.keypoints) {
        // Convert Enhanced component keypoints format to array format expected by hold analysis
        const keypoints = [];

        // Initialize array with 17 keypoints (COCO format)
        for (let j = 0; j < 17; j++) {
          keypoints[j] = { x: 0, y: 0, confidence: 0 };
        }

        // Map the Enhanced component keypoints to COCO pose format
        if (frame.poseData.keypoints.leftWrist) {
          keypoints[9] = frame.poseData.keypoints.leftWrist; // left wrist
        }
        if (frame.poseData.keypoints.rightWrist) {
          keypoints[10] = frame.poseData.keypoints.rightWrist; // right wrist
        }
        if (frame.poseData.keypoints.leftAnkle) {
          keypoints[15] = frame.poseData.keypoints.leftAnkle; // left ankle
        }
        if (frame.poseData.keypoints.rightAnkle) {
          keypoints[16] = frame.poseData.keypoints.rightAnkle; // right ankle
        }

        frameResults.push({
          frameIndex: i,
          frame: frame,
          poses: [
            {
              keypoints: keypoints,
              confidence: frame.poseData.confidence || 1.0,
            },
          ],
        });

        console.log(`✅ Frame ${i} converted with keypoints:`, {
          leftWrist: keypoints[9],
          rightWrist: keypoints[10],
          leftAnkle: keypoints[15],
          rightAnkle: keypoints[16],
        });
      } else {
        console.log(`⚠️ Frame ${i} has no valid pose data`);
        frameResults.push({
          frameIndex: i,
          frame: frame,
          poses: [],
        });
      }
    }
  }

  poseResults.value = frameResults;
  analysisPhase.value = "analyzing-holds";

  // Phase 4: Analyze holds using homography and boulder problem data
  console.log("🧗 Analyzing hold usage...");
  console.log("🔗 Homography matrix available:", !!analysisData.match?.homographyMatrix);

  let holdAnalysisResult = null;
  try {
    holdAnalysisResult = await runHoldAnalysis(frameResults, analysisData.match?.homographyMatrix);

    if (holdAnalysisResult?.bestMatch) {
      console.log("🎯 Best matching problem:", holdAnalysisResult.bestMatch.problem.name);
      analysisPhase.value = "complete";

      // Redirect to problem page with video data
      await redirectToProblemPageWithVideo(analysisData, holdAnalysisResult.bestMatch.problem);
      return; // Early return to avoid setting additional state
    } else if (holdAnalysisResult) {
      console.log("⚠️ Hold analysis completed but no matches found");
      analysisPhase.value = "complete";
    } else {
      console.log("❌ Hold analysis failed to return results");
      analysisPhase.value = "hold-analysis-failed";
    }
  } catch (error) {
    console.error("❌ Hold analysis error:", error);
    analysisPhase.value = "hold-analysis-error";
  }

  // Store complete result
  videoAnalysisResult.value = {
    success: true,
    match: analysisData.match,
    frame: analysisData.frames?.[1] || null, // Middle frame for display
    video: analysisData.video,
    allFrames: analysisData.frames || [],
    poseResults: frameResults,
    holdAnalysis: holdAnalysisResult,
    phase: analysisPhase.value,
  };

  isAnalyzing.value = false;
  console.log("✅ Complete video analysis finished!");
};

const handleBetaProcessingError = (error) => {
  console.error("Beta processing error:", error);
  isAnalyzing.value = false;
  videoAnalysisResult.value = {
    success: false,
    error: true,
    message: "Error processing video: " + error.message,
  };
};

const handleBetaVideoCleared = () => {
  console.log("Beta video cleared");
  // Reset all state when video is cleared
  videoAnalysisResult.value = null;
  extractedFrame.value = null;
  isAnalyzing.value = false;
  matchedBoulderImage.value = null;
  allFrames.value = [];
  poseResults.value = [];
  analysisPhase.value = "";
};

// Phase 4: Hold Analysis - Compare poses with boulder problems
const runHoldAnalysis = async (frameResults, homographyMatrix) => {
  console.log("🎯 Phase 4: Starting hold analysis...");
  console.log("📊 Input data:", {
    frameResultsLength: frameResults?.length || 0,
    hasHomography: !!homographyMatrix,
    locationId: route.params.id,
  });

  if (!homographyMatrix) {
    console.log("⚠️ No homography matrix available for hold analysis");
    return {
      error: "No homography matrix available",
      bestMatch: null,
      allScores: [],
      transformedFrames: [],
    };
  }

  try {
    // Get all boulder problems for this location
    const problemsForLocation = boulderProblemsStore.sortedProblems.filter(
      (problem) => problem.locationId === route.params.id
    );

    console.log(
      `🔍 Found ${problemsForLocation.length} boulder problems for location ${route.params.id}`
    );

    if (problemsForLocation.length === 0) {
      console.log("ℹ️ No boulder problems found for this location");
      return {
        error: "No boulder problems found for this location",
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }

    console.log(
      "🏔️ Boulder problems:",
      problemsForLocation.map((p) => ({
        id: p.id,
        name: p.name,
        nameType: typeof p.name,
        nameLength: p.name?.length,
        grade: p.grade,
        holdsCount: p.holds?.length || 0,
        allKeys: Object.keys(p).slice(0, 10), // Show first 10 keys to avoid huge logs
      }))
    );

    // Transform pose keypoints to boulder image space
    const transformedFrames = [];

    for (const frameResult of frameResults) {
      console.log(`🔍 Processing frame ${frameResult.frameIndex}:`, {
        hasPoses: !!(frameResult.poses && frameResult.poses.length > 0),
        posesCount: frameResult.poses?.length || 0,
      });

      if (!frameResult.poses || frameResult.poses.length === 0) {
        console.log(`⚠️ Frame ${frameResult.frameIndex} has no poses`);
        continue;
      }

      // Use the first pose from the frame
      const firstPose = frameResult.poses[0];
      console.log(`👤 First pose keypoints:`, {
        hasKeypoints: !!firstPose.keypoints,
        keypointsLength: firstPose.keypoints?.length || 0,
        confidence: firstPose.confidence,
      });

      if (!firstPose.keypoints) {
        console.log(`⚠️ Frame ${frameResult.frameIndex} pose has no keypoints`);
        continue;
      }

      // Extract relevant keypoints for climbing analysis (wrists and ankles)
      const climbingKeypoints = [
        { type: "leftWrist", point: firstPose.keypoints[9] }, // left wrist
        { type: "rightWrist", point: firstPose.keypoints[10] }, // right wrist
        { type: "leftAnkle", point: firstPose.keypoints[15] }, // left ankle
        { type: "rightAnkle", point: firstPose.keypoints[16] }, // right ankle
      ].filter((kp) => {
        // Lower confidence threshold to be more inclusive
        const hasPoint = kp.point && kp.point.confidence > 0.3;
        if (!hasPoint) {
          console.log(
            `❌ ${kp.type} keypoint missing or low confidence:`,
            kp.point?.confidence || "undefined"
          );
        }
        return hasPoint;
      });

      console.log(`📊 Frame ${frameResult.frameIndex} keypoint summary:`, {
        totalKeypoints: firstPose.keypoints?.length || 0,
        validClimbingKeypoints: climbingKeypoints.length,
        requiredMinimum: 2, // We need at least 2 keypoints for meaningful analysis
      });

      // Skip frame if we don't have enough valid keypoints
      if (climbingKeypoints.length < 2) {
        console.log(
          `⚠️ Frame ${frameResult.frameIndex} skipped: insufficient valid keypoints (${climbingKeypoints.length}/2 minimum)`
        );
        continue;
      }

      console.log(
        `🎯 Frame ${frameResult.frameIndex} valid keypoints:`,
        climbingKeypoints.map((kp) => ({
          type: kp.type,
          x: kp.point.x,
          y: kp.point.y,
          confidence: kp.point.confidence,
        }))
      );

      // Transform each keypoint to boulder image coordinates using homography
      const transformedKeypoints = [];

      for (const keypoint of climbingKeypoints) {
        const transformed = transformPoint(keypoint.point.x, keypoint.point.y, homographyMatrix);

        if (transformed) {
          transformedKeypoints.push({
            type: keypoint.type,
            x: transformed.x,
            y: transformed.y,
            confidence: keypoint.point.confidence,
          });
          console.log(
            `✅ Transformed ${keypoint.type}: (${keypoint.point.x}, ${
              keypoint.point.y
            }) → (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`
          );
        } else {
          console.log(`❌ Failed to transform ${keypoint.type}`);
        }
      }

      if (transformedKeypoints.length > 0) {
        transformedFrames.push({
          frameIndex: frameResult.frameIndex,
          timePercent: frameResult.frame.timePercent,
          keypoints: transformedKeypoints,
        });
      }
    }

    console.log(`✅ Transformed ${transformedFrames.length} frames with valid poses`);

    if (transformedFrames.length === 0) {
      console.log("⚠️ No valid poses to analyze");
      return {
        error: "No valid poses found for analysis",
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }

    // Score each boulder problem based on hold proximity
    const problemScores = [];

    for (const problem of problemsForLocation) {
      console.log(`🔍 Scoring problem "${problem.name}" with ${problem.holds?.length || 0} holds`);
      const score = calculateProblemScore(problem, transformedFrames);

      // Include ALL problems in the results, not just those with score > 0
      problemScores.push({
        problem,
        score,
        confidence: Math.min(score, 1.0), // Cap at 1.0
      });

      if (score > 0) {
        console.log(`✅ Problem "${problem.name}" scored: ${score.toFixed(3)}`);
      } else {
        console.log(`❌ Problem "${problem.name}" scored: 0 (no matches)`);
      }
    }

    // Sort by score (highest first)
    problemScores.sort((a, b) => b.score - a.score);

    console.log(
      "🏆 Final problem scores:",
      problemScores.map((p) => ({
        name: p.problem.name,
        score: p.score.toFixed(3),
        confidence: `${Math.round(p.confidence * 100)}%`,
      }))
    );

    const result = {
      bestMatch: problemScores[0] || null,
      allScores: problemScores,
      transformedFrames,
      debugInfo: {
        totalProblems: problemsForLocation.length,
        validFrames: transformedFrames.length,
        totalScores: problemScores.length,
      },
    };

    console.log("🎯 Hold analysis complete:", {
      hasBestMatch: !!result.bestMatch,
      bestMatchName: result.bestMatch?.problem?.name,
      totalCandidates: result.allScores.length,
    });

    return result;
  } catch (error) {
    console.error("❌ Hold analysis error:", error);
    return {
      error: error.message,
      bestMatch: null,
      allScores: [],
      transformedFrames: [],
    };
  }
};

// Calculate how well pose keypoints match with problem holds
const calculateProblemScore = (problem, transformedFrames) => {
  if (!problem.holds || problem.holds.length === 0) {
    console.log(`❌ Problem "${problem.name}" has no holds defined`);
    return 0;
  }

  let totalScore = 0;
  let totalMeasurements = 0;
  const proximityThreshold = 150; // pixels - how close keypoint needs to be to hold
  const usedHolds = new Set(); // Track which holds were matched
  const holdMatches = []; // Track specific matches for debugging
  const debugInfo = {
    problemName: problem.name?.substring(0, 30) + "...",
    holdsCount: problem.holds?.length || 0,
    holdsWithCoords: 0,
    keypointCount: 0,
    closestDistances: [],
    coordFormats: new Set(),
  };

  // Get hold center positions from the problem
  const holdCenters = problem.holds
    .map((holdData, index) => {
      const hold = holdData.hold;

      // Handle different coordinate formats from detection results
      let x, y;

      if (hold.coordinates) {
        x = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
        y = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
        debugInfo.coordFormats.add("coordinates");
      } else if (hold.bbox && Array.isArray(hold.bbox)) {
        x = hold.bbox[0] + hold.bbox[2] / 2;
        y = hold.bbox[1] + hold.bbox[3] / 2;
        debugInfo.coordFormats.add("bbox");
      } else if (hold.x !== undefined && hold.y !== undefined) {
        x = hold.x + (hold.width || 0) / 2;
        y = hold.y + (hold.height || 0) / 2;
        debugInfo.coordFormats.add("x_y");
      } else {
        console.warn("Unknown hold coordinate format:", hold);
        debugInfo.coordFormats.add("unknown");
        return null;
      }

      debugInfo.holdsWithCoords++;
      return { x, y, holdIndex: holdData.holdIndex || index, id: hold.id };
    })
    .filter(Boolean);

  console.log(`📍 Problem "${debugInfo.problemName}" hold analysis:`);
  console.log(`   • Raw holds count: ${problem.holds?.length || 0}`);
  console.log(`   • Valid holdCenters: ${holdCenters.length}`);
  console.log(
    `   • Coordinate formats found: ${Array.from(debugInfo.coordFormats).join(", ") || "none"}`
  );

  if (problem.holds?.length > 0 && holdCenters.length === 0) {
    console.log(`   • 🚨 ISSUE: ${problem.holds.length} holds defined but 0 valid coordinates!`);
    console.log(`   • Sample hold structure:`, problem.holds[0]);
  }

  if (holdCenters.length > 0) {
    console.log(`   • Sample holdCenter:`, holdCenters[0]);
  }

  // Skip analysis if no valid holds
  if (holdCenters.length === 0) {
    console.log(`⚠️ Skipping analysis - no valid hold coordinates found`);
    return 0;
  }

  // For each transformed frame, check proximity to holds
  for (const frame of transformedFrames) {
    console.log(`🎯 Analyzing frame ${frame.frameIndex} with ${frame.keypoints.length} keypoints`);

    for (const keypoint of frame.keypoints) {
      debugInfo.keypointCount++;

      // Find closest hold to this keypoint
      let closestDistance = Infinity;
      let closestHold = null;

      for (const hold of holdCenters) {
        const distance = Math.sqrt(
          Math.pow(keypoint.x - hold.x, 2) + Math.pow(keypoint.y - hold.y, 2)
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestHold = hold;
        }
      }

      debugInfo.closestDistances.push(Math.round(closestDistance));

      // Score based on proximity (closer = higher score)
      if (closestDistance <= proximityThreshold && closestHold) {
        const proximityScore = (proximityThreshold - closestDistance) / proximityThreshold;
        const confidenceScore = keypoint.confidence;
        const keypointScore = proximityScore * confidenceScore;

        totalScore += keypointScore;
        totalMeasurements++;
        usedHolds.add(closestHold.holdIndex);

        holdMatches.push({
          keypoint: keypoint.type,
          holdIndex: closestHold.holdIndex,
          distance: Math.round(closestDistance),
          score: Math.round(keypointScore * 100) / 100,
        });

        console.log(
          `✅ ${keypoint.type} matches hold #${closestHold.holdIndex} (distance: ${Math.round(
            closestDistance
          )}px, score: ${keypointScore.toFixed(3)})`
        );
      } else {
        console.log(
          `❌ ${keypoint.type} at (${Math.round(keypoint.x)}, ${Math.round(
            keypoint.y
          )}) - closest hold ${Math.round(
            closestDistance
          )}px away (threshold: ${proximityThreshold}px)`
        );
      }
    }
  }

  // Calculate average score
  const finalScore = totalMeasurements > 0 ? totalScore / totalMeasurements : 0;
  const holdUsagePercentage =
    problem.holds.length > 0 ? (usedHolds.size / problem.holds.length) * 100 : 0;

  console.log(`📊 Problem "${debugInfo.problemName}" FINAL ANALYSIS:`);
  console.log(
    `   • Holds: ${debugInfo.holdsWithCoords}/${debugInfo.holdsCount} with valid coordinates`
  );
  console.log(`   • Coordinate formats: ${Array.from(debugInfo.coordFormats).join(", ")}`);
  console.log(`   • Keypoints analyzed: ${debugInfo.keypointCount}`);
  console.log(
    `   • Closest distances: ${debugInfo.closestDistances.slice(0, 5).join("px, ")}px... (first 5)`
  );
  console.log(`   • Distance threshold: ${proximityThreshold}px`);
  console.log(`   • Total measurements: ${totalMeasurements}`);
  console.log(
    `   • Holds used: ${usedHolds.size}/${problem.holds.length} (${Math.round(
      holdUsagePercentage
    )}%)`
  );
  console.log(`   • Average score: ${finalScore.toFixed(3)}`);
  console.log(`   • Matches:`, holdMatches);

  return finalScore;
};

// Redirect to problem page with video data
const redirectToProblemPageWithVideo = async (analysisData, problem) => {
  console.log("🚀 Redirecting to problem page with video data:", {
    problemId: problem.id,
    problemName: problem.name,
    hasVideo: !!analysisData.video,
    hasFrames: !!(analysisData.frames && analysisData.frames.length > 0),
  });

  try {
    // Store only minimal essential data in sessionStorage
    const minimalData = {
      videoFile: {
        name: analysisData.video.name,
        size: analysisData.video.size,
        type: analysisData.video.type,
      },
      analysisResult: {
        matchFound: !!analysisData.match,
        matchedProblemId: problem.id,
        matchedProblemName: problem.name,
        timestamp: Date.now(),
      },
    };

    sessionStorage.setItem("prefilledVideoData", JSON.stringify(minimalData));
    console.log("📁 Stored minimal data in sessionStorage:", minimalData);
  } catch (storageError) {
    console.warn("⚠️ Could not store data in sessionStorage:", storageError);
    // Continue without sessionStorage - we'll rely on window.tempVideoFile
  }

  // Store the actual File object in a temporary variable
  // that the target page can access
  window.tempVideoFile = analysisData.video;
  console.log("📁 Stored video file in window.tempVideoFile");

  // Navigate to the problem page
  await router.push({
    name: "boulder-problem-detail",
    params: {
      locationId: route.params.locationId || route.params.id,
      problemId: problem.id,
    },
    query: {
      action: "log-ascent",
      hasPrefilledVideo: "true",
    },
  });
};

onMounted(async () => {
  console.log("🔄 Loading OpenCV.js for homography calculations...");
  try {
    // Import OpenCV.js - required for homography matrix calculation
    const cvReadyPromise = await import("@techstark/opencv-js");
    window.cv = await cvReadyPromise.default;
    console.log("✅ OpenCV.js loaded successfully for LocationDetailView");
  } catch (err) {
    console.error("❌ Failed to load OpenCV.js:", err);
    console.warn("⚠️ Homography calculations will not be available");
  }

  loadLocation();
});
</script>
