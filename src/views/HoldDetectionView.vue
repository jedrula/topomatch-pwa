<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-4 mb-2">
              <h1 class="text-3xl font-bold text-gray-900">Hold Detection</h1>
              <!-- Back to Location Button (when coming from a location) -->
              <button
                v-if="route.params.locationId"
                @click="goBackToLocation"
                class="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center space-x-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back to Location</span>
              </button>
            </div>
            <p class="text-gray-600">AI-powered climbing hold identification and analysis</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Left Column: Image and Controls -->
        <div class="xl:col-span-2 space-y-6">
          <!-- Image Display Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6 border-b border-gray-100">
              <h2 class="text-xl font-semibold text-gray-900">Climbing Wall Analysis</h2>
              <p class="text-gray-600 mt-1">
                <span v-if="currentImage">Currently analyzing: {{ imageDisplayName }}</span>
                <span v-else-if="route.query.imageId">Loading image...</span>
                <span v-else>Currently analyzing: {{ imageDisplayName }}</span>
              </p>
              <!-- Error message for image loading -->
              <div
                v-if="imageLoadError"
                class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
              >
                Error loading image: {{ imageLoadError }}
              </div>
            </div>

            <div class="p-6">
              <!-- Image Container -->
              <div class="relative bg-gray-100 rounded-lg overflow-hidden">
                <!-- Loading state when no image is available -->
                <div
                  v-if="route.query.imageId && !currentImage && !imageLoadError"
                  class="w-full h-64 flex items-center justify-center"
                >
                  <div class="text-center">
                    <div
                      class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
                    ></div>
                    <p class="text-gray-600">Loading image...</p>
                  </div>
                </div>

                <!-- Image -->
                <img
                  v-else
                  ref="climbingImage"
                  :src="imageUrl"
                  alt="Climbing wall for hold detection"
                  class="w-full h-auto object-contain"
                  @load="onImageLoad"
                />

                <!-- Hold Detection Overlay -->
                <div
                  v-if="imageLoaded && (detectionResults || selectedProblemHolds.length > 0)"
                  class="absolute inset-0"
                >
                  <!-- Segmentation Canvas for precise hold masks -->
                  <HoldSegmentationCanvas
                    v-if="detectionResults?.holds && detectionResults.holds.length > 0"
                    :holds="detectionResults.holds"
                    :image-scale="imageScale"
                    :selected-hold-index="selectedHoldIndex"
                    :canvas-width="imageWidth * imageScale"
                    :canvas-height="imageHeight * imageScale"
                    @hold-click="selectHold"
                  />

                  <!-- Fallback: Traditional bounding boxes for problem holds or non-segmented holds -->
                  <div class="absolute inset-0 opacity-70 pointer-events-none">
                    <!-- Selected Problem Holds (when viewing an existing problem) -->
                    <div
                      v-for="(problemHold, index) in selectedProblemHolds"
                      :key="'problem-' + (problemHold.hold.id || index)"
                      class="absolute transition-all duration-200 group border-4"
                      :style="{
                        left: `${problemHold.hold.x * imageScale}px`,
                        top: `${problemHold.hold.y * imageScale}px`,
                        width: `${problemHold.hold.width * imageScale}px`,
                        height: `${problemHold.hold.height * imageScale}px`,
                        backgroundColor: boulderProblemsStore.activeProblem?.color + '80', // Add transparency
                        borderColor: boulderProblemsStore.activeProblem?.color,
                      }"
                    >
                      <!-- Problem Hold Label -->
                      <div
                        class="absolute -top-8 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                      >
                        <div>{{ boulderProblemsStore.activeProblem?.name }}</div>
                        <div class="text-gray-300">
                          {{ getGradeLabel(boulderProblemsStore.activeProblem?.grade) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Loading Overlay -->
                <div
                  v-if="holdDetectionStore.isLoading"
                  class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div class="bg-white rounded-lg p-6 text-center">
                    <div
                      class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
                    ></div>
                    <p class="text-gray-800 font-medium">{{ holdDetectionStore.loadingMessage }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  @click="runDetection"
                  :disabled="holdDetectionStore.isLoading || !holdDetectionStore.sessionReady"
                  class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <div
                    v-if="holdDetectionStore.isLoading"
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>{{ holdDetectionStore.isLoading ? "Detecting..." : "Detect Holds" }}</span>
                </button>

                <button
                  v-if="detectionResults"
                  @click="clearResults"
                  class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Clear Results</span>
                </button>
              </div>

              <!-- Scale Adjustment Input -->
              <div class="mt-6">
                <label for="scale-input" class="block text-sm font-medium text-gray-700"
                  >Adjust Scale</label
                >
                <input
                  id="scale-input"
                  type="number"
                  min="0.1"
                  max="3"
                  step="0.01"
                  v-model.number="imageScale"
                  class="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p class="text-sm text-gray-500 mt-1">Current Scale: {{ imageScale.toFixed(2) }}</p>
              </div>

              <!-- SAM Segmentation Toggle -->
              <div class="mt-6">
                <div class="flex items-center justify-between">
                  <label for="sam-toggle" class="text-sm font-medium text-gray-700">
                    Precise Segmentation
                  </label>
                  <button
                    id="sam-toggle"
                    @click="
                      holdDetectionStore.useSAMSegmentation = !holdDetectionStore.useSAMSegmentation
                    "
                    :class="{
                      'bg-blue-600': holdDetectionStore.useSAMSegmentation,
                      'bg-gray-200': !holdDetectionStore.useSAMSegmentation,
                    }"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span
                      :class="{
                        'translate-x-6': holdDetectionStore.useSAMSegmentation,
                        'translate-x-1': !holdDetectionStore.useSAMSegmentation,
                      }"
                      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    />
                  </button>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ holdDetectionStore.useSAMSegmentation ? "Enabled" : "Disabled" }} -
                  {{
                    holdDetectionStore.useSAMSegmentation
                      ? "Uses AI segmentation for precise hold shapes"
                      : "Uses simple bounding boxes for faster detection"
                  }}
                </p>
                <div v-if="holdDetectionStore.samSessionReady" class="text-xs text-green-600 mt-1">
                  ✓ SAM model ready
                </div>
                <div
                  v-else-if="holdDetectionStore.useSAMSegmentation"
                  class="text-xs text-yellow-600 mt-1"
                >
                  ⏳ Loading SAM model...
                </div>
                <a
                  href="/sam-playground.html"
                  target="_blank"
                  class="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  🔬 Debug SAM in Playground
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Results and Statistics -->
        <div class="space-y-6">
          <!-- Detection Status -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Detection Status</h3>

              <div class="space-y-4">
                <!-- Session Status -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">AI Model</span>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="holdDetectionStore.sessionReady ? 'bg-green-500' : 'bg-red-500'"
                    ></div>
                    <span
                      class="text-sm font-medium"
                      :class="holdDetectionStore.sessionReady ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ holdDetectionStore.sessionReady ? "Ready" : "Not Ready" }}
                    </span>
                  </div>
                </div>

                <!-- Results Status -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Detection Results</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{
                      detectionResults
                        ? `${detectionResults.holds.length} holds found`
                        : "No results"
                    }}
                  </span>
                </div>

                <!-- Processing Time -->
                <div v-if="detectionResults" class="flex items-center justify-between">
                  <span class="text-gray-600">Processing Time</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ detectionResults.processingTime }}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hold Statistics -->
          <div v-if="detectionResults" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Hold Statistics</h3>

              <!-- Hold Type Distribution -->
              <div class="space-y-3">
                <div
                  v-for="(count, type) in holdDetectionStore.holdCounts"
                  :key="type"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span class="text-gray-700 capitalize">{{ type }}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ count }}</span>
                </div>
              </div>

              <!-- Total Holds -->
              <div class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-gray-700">Total Holds</span>
                  <span class="text-lg font-bold text-blue-600">{{
                    detectionResults.holds.length
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Boulder Problems Manager -->
          <BoulderProblemsManager :hasDetectionResults="!!detectionResults" />

          <!-- Selected Hold Details -->
          <div v-if="selectedHold" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Selected Hold</h3>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Type</span>
                  <span class="text-sm font-medium text-gray-900 capitalize">{{
                    selectedHold.type
                  }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Confidence</span>
                  <span class="text-sm font-medium text-gray-900"
                    >{{ Math.round(selectedHold.confidence * 100) }}%</span
                  >
                </div>
                <div v-if="selectedHold.color" class="flex items-center justify-between">
                  <span class="text-gray-600">Color</span>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-3 h-3 rounded-full border border-gray-300"
                      :style="{ backgroundColor: selectedHold.color.hex }"
                    ></div>
                    <span class="text-sm font-medium text-gray-900 capitalize">{{
                      selectedHold.color.name
                    }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Position</span>
                  <span class="text-sm font-medium text-gray-900"
                    >{{ Math.round(selectedHold.x) }}, {{ Math.round(selectedHold.y) }}</span
                  >
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Size</span>
                  <span class="text-sm font-medium text-gray-900"
                    >{{ Math.round(selectedHold.width) }} ×
                    {{ Math.round(selectedHold.height) }}</span
                  >
                </div>
                <div v-if="selectedHold.shape" class="flex items-center justify-between">
                  <span class="text-gray-600">Shape</span>
                  <span class="text-sm font-medium text-gray-900 capitalize">{{
                    selectedHold.shape.type
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hold List -->
          <div v-if="detectionResults" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Detected Holds</h3>

              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div
                  v-for="(hold, index) in holdDetectionStore.sortedHolds"
                  :key="hold.id || index"
                  @click="selectHold(hold, index)"
                  class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  :class="{
                    'border-blue-500 bg-blue-50': selectedHoldIndex === index,
                  }"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      v-if="hold.color"
                      class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                      :style="{ backgroundColor: hold.color.hex }"
                    ></div>
                    <div>
                      <div class="font-medium text-gray-900 capitalize">{{ hold.type }}</div>
                      <div class="text-sm text-gray-500">
                        {{ Math.round(hold.x) }}, {{ Math.round(hold.y) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">
                      {{ Math.round(hold.confidence * 100) }}%
                    </div>
                    <div v-if="hold.color" class="text-xs text-gray-500 capitalize">
                      {{ hold.color.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="holdDetectionStore.errorString"
        class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4"
      >
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-red-700 font-medium">{{ holdDetectionStore.errorString }}</p>
        </div>
      </div>

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MainFooter from "@/components/MainFooter.vue";
import BoulderProblemsManager from "@/components/BoulderProblemsManager.vue";
import HoldSegmentationCanvas from "@/components/HoldSegmentationCanvas.vue";
import { useHoldDetectionStore } from "@/stores/holdDetectionStore";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore";
import { locationService } from "@/services/locationService";
import { getGradeLabel } from "@/utils/gradingUtils.js";

const route = useRoute();
const router = useRouter();
const holdDetectionStore = useHoldDetectionStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Reactive state
const climbingImage = ref(null);
const imageLoaded = ref(false);
const imageScale = ref(1);
const selectedHoldIndex = ref(null);
const currentImage = ref(null);
const imageLoadError = ref(null);

// Dynamic image loading based on query parameters
const imageUrl = computed(() => {
  if (currentImage.value) {
    return currentImage.value.url;
  }
  // Fallback to hardcoded image if no query parameter
  return "/topos/wibrem-23-may/WhatsApp Image 2025-05-24 at 00.15.17.jpeg";
});

const imageDisplayName = computed(() => {
  if (currentImage.value) {
    return currentImage.value.name;
  }
  return "WhatsApp Image 2025-05-24 at 00.15.17.jpeg";
});

// Computed properties
const detectionResults = computed(() => holdDetectionStore.detectionResults);
const selectedHold = computed(() => {
  if (selectedHoldIndex.value === null || !detectionResults.value) return null;
  return detectionResults.value.holds[selectedHoldIndex.value];
});

// Image dimensions for canvas sizing
const imageWidth = computed(() => {
  return detectionResults.value?.imageWidth || climbingImage.value?.naturalWidth || 0;
});

const imageHeight = computed(() => {
  return detectionResults.value?.imageHeight || climbingImage.value?.naturalHeight || 0;
});

// Computed property for holds from selected boulder problem
const selectedProblemHolds = computed(() => {
  const activeProblem = boulderProblemsStore.activeProblem;
  if (!activeProblem || boulderProblemsStore.isCreatingProblem) {
    return [];
  }
  return activeProblem.holds || [];
});

// Methods
const onImageLoad = () => {
  imageLoaded.value = true;
  calculateImageScale();
};

const calculateImageScale = () => {
  if (!climbingImage.value) {
    console.warn("climbingImage is not ready.");
    imageScale.value = 1;
    return;
  }

  const displayedWidth = climbingImage.value.clientWidth;
  const displayedHeight = climbingImage.value.clientHeight;
  const originalWidth = climbingImage.value.naturalWidth;
  const originalHeight = climbingImage.value.naturalHeight;

  if (!displayedWidth || !displayedHeight || !originalWidth || !originalHeight) {
    console.warn("Image dimensions are not properly set.", {
      displayedWidth,
      displayedHeight,
      originalWidth,
      originalHeight,
    });
    imageScale.value = 1;
    return;
  }

  // Calculate scale based on the original image dimensions
  const scaleX = displayedWidth / originalWidth;
  const scaleY = displayedHeight / originalHeight;

  // Use the smaller scale to maintain aspect ratio
  imageScale.value = Math.min(scaleX, scaleY);

  console.log("Image scale calculated:", {
    displayedWidth,
    displayedHeight,
    originalWidth,
    originalHeight,
    scaleX,
    scaleY,
    imageScale: imageScale.value,
  });

  // Debugging: Check if the calculated scale matches 0.57
  if (Math.abs(imageScale.value - 0.57) < 0.01) {
    console.log(
      "The calculated scale matches 0.57. This is likely due to the displayed dimensions:",
      {
        displayedWidth,
        displayedHeight,
        originalWidth,
        originalHeight,
      }
    );
  }
};

const runDetection = async () => {
  try {
    // Fetch the current image and create a proper file-like object
    const response = await fetch(imageUrl.value);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create a file-like object with the arrayBuffer method
    const imageFile = new File([blob], imageDisplayName.value, {
      type: blob.type || "image/jpeg",
    });

    await holdDetectionStore.runHoldDetection(imageFile);

    // Recalculate scale after detection results are available
    if (detectionResults.value) {
      calculateImageScale();
    }
  } catch (error) {
    console.error("Error loading image for detection:", error);
    // You could set an error state here if needed
  }
};

const selectHold = (hold, index) => {
  // If we have an active problem (either creating or editing), add/remove hold from it
  if (boulderProblemsStore.activeProblem) {
    boulderProblemsStore.addHoldToProblem(boulderProblemsStore.activeProblem.id, hold, index);
  }

  // Always handle selection state
  selectedHoldIndex.value = selectedHoldIndex.value === index ? null : index;
};

// Helper methods for hold styling based on boulder problems
const getHoldBackgroundColor = (hold, index) => {
  // If this hold is in the active problem, use the problem's color
  if (boulderProblemsStore.isHoldInActiveProblem(index)) {
    return boulderProblemsStore.activeProblemColor + "60"; // 60% opacity
  }
  // Otherwise use the hold's natural color or default
  return hold.color ? hold.color.hex + "40" : "#ef444440";
};

const getHoldBorderColor = (index) => {
  // If this hold is in the active problem, use a stronger border
  if (boulderProblemsStore.isHoldInActiveProblem(index)) {
    return boulderProblemsStore.activeProblemColor;
  }
  return "transparent";
};

const isHoldInActiveProblem = (index) => {
  return boulderProblemsStore.isHoldInActiveProblem(index);
};

// Load image based on query parameters
const loadImageFromQuery = async () => {
  const imageId = route.query.imageId;
  const locationId = route.params.locationId; // Changed from route.query to route.params

  if (imageId && locationId) {
    try {
      // Initialize boulder problems store for this location and image
      boulderProblemsStore.initializeForLocation(locationId, imageId);

      // Load location data to get grading system
      try {
        const location = await locationService.getLocation(locationId);
        if (location && location.gradingSystem) {
          boulderProblemsStore.setLocationGradingSystem(location.gradingSystem);
          console.log("🎚️ Loaded location grading system:", location.gradingSystem);
        } else {
          console.log("🎚️ No custom grading system found for location, using default");
          boulderProblemsStore.setLocationGradingSystem(null);
        }
      } catch (error) {
        console.warn("⚠️ Error loading location grading system:", error);
        // Continue with default system
        boulderProblemsStore.setLocationGradingSystem(null);
      }

      // Load existing boulder problems for this image
      await boulderProblemsStore.loadBoulderProblems(locationId, imageId);

      // Load image data from the location service
      const imageRecords = await locationService.getLocationImages(locationId);
      const imageRecord = imageRecords.find((record) => record.id === imageId);

      if (imageRecord) {
        currentImage.value = {
          id: imageRecord.id,
          url: imageRecord.downloadUrl,
          name: imageRecord.fileName,
        };
        console.log("Loaded image for hold detection:", currentImage.value);
      } else {
        console.warn(`Image with ID ${imageId} not found in location ${locationId}`);
        currentImage.value = null;
      }
    } catch (error) {
      console.error("Error loading image for hold detection:", error);
      imageLoadError.value = error.message;
      currentImage.value = null;
    }
  } else {
    // No query parameters, use default/hardcoded image
    currentImage.value = null;
    // Use default grading system when no location specified
    boulderProblemsStore.setLocationGradingSystem(null);
    // Reset boulder problems store
    boulderProblemsStore.clearAllProblems();
  }
};

const clearResults = () => {
  holdDetectionStore.resetDetectionState();
  selectedHoldIndex.value = null;
  // Also clear boulder problems when clearing detection results
  boulderProblemsStore.clearAllProblems();
};

const goBackToLocation = () => {
  const locationId = route.params.locationId; // Changed from route.query to route.params
  if (locationId) {
    // Navigate back to the location detail page
    // We need to find the region ID for the location
    // For now, let's assume we can reconstruct the URL pattern
    router.push(`/location/${locationId}`);
  }
};

// Watch for changes in detectionResults and recalculate image scale
watch(detectionResults, (newValue) => {
  if (newValue) {
    console.log("detectionResults updated:", newValue);
    calculateImageScale();
  }
});

// Watch for route changes to load different images
watch(
  () => route.query,
  () => {
    loadImageFromQuery();
  },
  { immediate: false }
);

// Lifecycle
onMounted(async () => {
  // Reset any previous state
  holdDetectionStore.resetDetectionState();

  // Load image based on query parameters
  await loadImageFromQuery();
});
</script>
