<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-4 mb-2">
              <h1 class="text-3xl font-bold text-gray-900">Hold Detection (Server)</h1>
              <!-- Back to Location Button -->
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
            <p class="text-gray-600">
              Server-powered climbing hold detection with AI-generated SVG overlays
            </p>
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

                <!-- Server SVG Overlay -->
                <ServerHoldOverlay
                  v-if="imageLoaded && serverStore.hasResults"
                  :result="serverStore.results"
                  :image-element="climbingImage"
                  :show-controls="true"
                  :selected-holds="selectedHoldIndices"
                  @hold-click="handleHoldClick"
                  ref="svgOverlay"
                />

                <!-- Existing Boulder Problems Overlay - Show stored problems with self-contained SVG -->
                <template
                  v-for="problem in boulderProblemsStore.sortedProblems"
                  :key="`stored-problem-${problem.id}`"
                >
                  <StoredBoulderProblemOverlay
                    v-if="imageLoaded && problem.holds && problem.holds.length > 0"
                    :problem="problem"
                    :image-element="climbingImage"
                    :image-info="serverStore.results?.image_info || { width: 1000, height: 1000 }"
                    :interactive="true"
                    :show-problem-info="false"
                    :show-hold-labels="false"
                    :opacity="0.7"
                  />
                </template>

                <!-- Processing Overlay -->
                <div
                  v-if="serverStore.isProcessing"
                  class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div class="bg-white rounded-lg p-6 text-center max-w-sm">
                    <div
                      class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
                    ></div>
                    <p class="text-gray-800 font-medium mb-2">{{ serverStore.statusMessage }}</p>

                    <!-- Progress Bar -->
                    <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${serverStore.progressPercent}%` }"
                      ></div>
                    </div>

                    <p class="text-xs text-gray-600">
                      Step {{ serverStore.currentStep }} of {{ serverStore.totalSteps }}
                    </p>

                    <!-- Detailed Progress -->
                    <div v-if="serverStore.detailedProgress" class="mt-3 text-xs text-left">
                      <div
                        v-if="serverStore.detailedProgress.yolo_time"
                        class="flex justify-between"
                      >
                        <span>🎯 YOLO:</span>
                        <span>{{ serverStore.detailedProgress.yolo_time.toFixed(3) }}s</span>
                      </div>
                      <div
                        v-if="serverStore.detailedProgress.sam2_time"
                        class="flex justify-between"
                      >
                        <span>🎯 SAM2:</span>
                        <span>{{ serverStore.detailedProgress.sam2_time.toFixed(3) }}s</span>
                      </div>
                      <div
                        v-if="serverStore.detailedProgress.svg_time"
                        class="flex justify-between"
                      >
                        <span>🎨 SVG:</span>
                        <span>{{ serverStore.detailedProgress.svg_time.toFixed(3) }}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  @click="processImage"
                  :disabled="serverStore.isProcessing || !serverStore.isReady"
                  class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <div
                    v-if="serverStore.isProcessing"
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{{
                    serverStore.isProcessing ? "Processing..." : "Detect Holds (Server)"
                  }}</span>
                </button>

                <button
                  v-if="serverStore.hasResults"
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

              <!-- API Configuration -->
              <div class="mt-6">
                <details class="group">
                  <summary
                    class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center space-x-2"
                  >
                    <svg
                      class="w-4 h-4 transition-transform group-open:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span>API Configuration</span>
                    <span
                      class="px-2 py-1 text-xs rounded"
                      :class="
                        serverStore.apiHealthy
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      "
                    >
                      {{ serverStore.apiHealthy ? "Connected" : "Disconnected" }}
                    </span>
                  </summary>

                  <div class="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <!-- API URL -->
                    <div>
                      <label for="api-url" class="block text-sm font-medium text-gray-700 mb-1">
                        API URL:
                      </label>
                      <div class="flex space-x-2">
                        <input
                          id="api-url"
                          v-model="serverStore.apiUrl"
                          type="text"
                          placeholder="Enter API base URL"
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          @change="serverStore.setApiUrl(serverStore.apiUrl)"
                        />
                        <button
                          @click="testApiHealth"
                          :disabled="!serverStore.apiUrl"
                          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Test
                        </button>
                      </div>
                    </div>

                    <!-- Compression Settings -->
                    <div>
                      <h4 class="text-sm font-medium text-gray-700 mb-2">Image Compression:</h4>
                      <div class="space-y-2">
                        <label class="flex items-center">
                          <input
                            v-model="serverStore.compressionSettings.enabled"
                            type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span class="ml-2 text-sm text-gray-600"
                            >Enable compression before upload</span
                          >
                        </label>

                        <div
                          v-if="serverStore.compressionSettings.enabled"
                          class="grid grid-cols-2 gap-3 ml-6"
                        >
                          <div>
                            <label class="block text-xs text-gray-600 mb-1">Max size (MB):</label>
                            <input
                              v-model.number="serverStore.compressionSettings.maxSizeMB"
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label class="block text-xs text-gray-600 mb-1">Max resolution:</label>
                            <input
                              v-model.number="serverStore.compressionSettings.maxWidthOrHeight"
                              type="number"
                              min="500"
                              max="4000"
                              step="100"
                              class="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Results and Statistics -->
        <div class="space-y-6">
          <!-- Processing Status -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>

              <div class="space-y-4">
                <!-- API Status -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">API Connection</span>
                  <div class="flex items-center space-x-2">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="serverStore.apiHealthy ? 'bg-green-500' : 'bg-red-500'"
                    ></div>
                    <span
                      class="text-sm font-medium"
                      :class="serverStore.apiHealthy ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ connectionDisplayText }}
                    </span>
                  </div>
                </div>

                <!-- Processing Status -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Status</span>
                  <span class="text-sm font-medium text-gray-900 capitalize">
                    {{ serverStore.processingStatus }}
                  </span>
                </div>

                <!-- Results Status -->
                <div v-if="serverStore.hasResults" class="flex items-center justify-between">
                  <span class="text-gray-600">Holds Detected</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ serverStore.holdCount }} holds found
                  </span>
                </div>

                <!-- Processing Time -->
                <div v-if="serverStore.hasResults" class="flex items-center justify-between">
                  <span class="text-gray-600">Processing Time</span>
                  <span class="text-sm font-medium text-gray-900">
                    {{ serverStore.processingTime.toFixed(2) }}s
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Results Statistics -->
          <div
            v-if="serverStore.hasResults"
            class="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Detection Results</h3>

              <!-- Metrics Grid -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                  <div class="text-2xl font-bold text-blue-600">{{ serverStore.holdCount }}</div>
                  <div class="text-sm text-gray-600">Holds Detected</div>
                </div>
                <div class="text-center p-4 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">
                    {{ serverStore.processingTime.toFixed(1) }}s
                  </div>
                  <div class="text-sm text-gray-600">Processing Time</div>
                </div>
                <div class="text-center p-4 bg-purple-50 rounded-lg">
                  <div class="text-2xl font-bold text-purple-600">{{ serverStore.svgCount }}</div>
                  <div class="text-sm text-gray-600">SVGs Generated</div>
                </div>
                <div
                  v-if="serverStore.processingMetrics"
                  class="text-center p-4 bg-orange-50 rounded-lg"
                >
                  <div class="text-2xl font-bold text-orange-600">
                    {{ serverStore.processingMetrics.compressionRatio.toFixed(1) }}x
                  </div>
                  <div class="text-sm text-gray-600">Compression Ratio</div>
                </div>
              </div>

              <!-- Detailed Timing -->
              <div v-if="serverStore.results" class="space-y-2">
                <h4 class="text-sm font-medium text-gray-700">Timing Breakdown:</h4>
                <div class="text-xs space-y-1">
                  <div
                    v-if="serverStore.results.yolo_results?.inference_time"
                    class="flex justify-between"
                  >
                    <span class="text-gray-600">🎯 YOLO Detection:</span>
                    <span class="font-mono"
                      >{{ serverStore.results.yolo_results.inference_time.toFixed(3) }}s</span
                    >
                  </div>
                  <div
                    v-if="serverStore.results.sam2_results?.processing_time"
                    class="flex justify-between"
                  >
                    <span class="text-gray-600">🎯 SAM2 Segmentation:</span>
                    <span class="font-mono"
                      >{{ serverStore.results.sam2_results.processing_time.toFixed(3) }}s</span
                    >
                  </div>
                  <div v-if="serverStore.results.svg_generation_time" class="flex justify-between">
                    <span class="text-gray-600">🎨 SVG Generation:</span>
                    <span class="font-mono"
                      >{{ serverStore.results.svg_generation_time.toFixed(3) }}s</span
                    >
                  </div>
                  <div class="flex justify-between border-t pt-1 font-medium">
                    <span class="text-gray-700">🏁 Total:</span>
                    <span class="font-mono"
                      >{{ serverStore.results.processing_time.toFixed(3) }}s</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Boulder Problems Manager -->
          <BoulderProblemsManager
            v-if="route.params.locationId"
            :location-id="route.params.locationId"
            :has-detection-results="serverStore.hasResults"
            :detection-results="serverStore.results"
            :climbing-image="climbingImage"
          />

          <!-- Error Display -->
          <div v-if="serverStore.error" class="bg-white rounded-lg shadow-sm border border-red-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-red-900 mb-4">Error</h3>
              <div class="bg-red-50 border border-red-200 rounded p-4">
                <p class="text-red-700 text-sm">{{ serverStore.error }}</p>
              </div>
              <button
                @click="serverStore.clearResults()"
                class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Clear Error
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHoldDetectionServerStore } from "@/stores/holdDetectionServerStore.js";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore.js";
import { locationService } from "@/services/locationService";
import ServerHoldOverlay from "@/components/ServerHoldOverlay.vue";
import StoredBoulderProblemOverlay from "@/components/StoredBoulderProblemOverlay.vue";
import BoulderProblemsManager from "@/components/BoulderProblemsManager.vue";

const route = useRoute();
const router = useRouter();
const serverStore = useHoldDetectionServerStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Reactive state
const climbingImage = ref(null);
const svgOverlay = ref(null);
const imageLoaded = ref(false);
const currentImage = ref(null);
const imageLoadError = ref(null);

// Hold selection state
const selectedHoldIndices = computed(() => {
  if (!boulderProblemsStore.activeProblem?.holds) return [];
  return boulderProblemsStore.activeProblem.holds.map(h => h.holdIndex);
});

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

// Debug: Reactive computed to track API health changes
const apiHealthStatus = computed(() => {
  const status = serverStore.apiHealthy;
  console.log("🔍 Computed apiHealthStatus triggered, value:", status);
  return status;
});

const connectionDisplayText = computed(() => {
  return apiHealthStatus.value ? "Connected" : "Disconnected";
});

// Methods
const onImageLoad = () => {
  imageLoaded.value = true;
  console.log("🖼️ Image loaded successfully");

  // Recalculate SVG overlay if we have results
  if (svgOverlay.value && serverStore.hasResults) {
    svgOverlay.value.recalculatePosition();
  }
};

const testApiHealth = async () => {
  console.log("🔍 Testing API health...");
  const result = await serverStore.testApiHealth();

  if (result.success) {
    console.log("✅ API health check successful");
  } else {
    console.error("❌ API health check failed:", result.error);
  }
};

const processImage = async () => {
  if (!imageUrl.value) {
    console.error("❌ No image URL available");
    return;
  }

  console.log("🚀 Starting server-side hold detection for:", imageUrl.value);

  const result = await serverStore.processImage(imageUrl.value);

  if (result.success) {
    console.log("✅ Processing completed successfully:", result.result);
  } else {
    console.error("❌ Processing failed:", result.error);
  }
};

const clearResults = () => {
  serverStore.clearResults();
  console.log("🧹 Results cleared");
};

const goBackToLocation = () => {
  const locationId = route.params.locationId;
  if (locationId) {
    router.push(`/location/${locationId}`);
  }
};

// Hold interaction handlers
const handleHoldClick = (hold, holdIndex) => {
  console.log("🎯 Hold clicked in main view:", { hold, holdIndex });
  
  // Only allow hold selection when creating a problem
  if (!boulderProblemsStore.isCreatingProblem || !boulderProblemsStore.activeProblem) {
    console.log("⚠️ No active problem being created, ignoring hold click");
    return;
  }

  // Enhance hold data with SVG markup from server results if available
  const enhancedHold = {
    ...hold,
    // Include SVG markup from server results if available
    svgMarkup: serverStore.results?.svg_markups?.[holdIndex] || null,
    detectionSource: "server"
  };

  // Add or remove hold from the active problem
  boulderProblemsStore.addHoldToProblem(
    boulderProblemsStore.activeProblem.id,
    enhancedHold,
    holdIndex
  );
  
  console.log("✅ Hold added/removed from active problem with SVG markup:", enhancedHold.svgMarkup ? "included" : "not available");
};

// Load image based on query parameters
const loadImageFromQuery = async () => {
  const locationId = route.query.locationId || route.params.locationId;
  const imageId = route.query.imageId;

  if (locationId && imageId) {
    try {
      // Load existing boulder problems for this image
      console.log("📂 Loading image from location:", { locationId, imageId });

      // Load image data from the location service
      const imageRecords = await locationService.getLocationImages(locationId);
      const imageRecord = imageRecords.find((record) => record.id === imageId);

      if (imageRecord) {
        currentImage.value = {
          id: imageRecord.id,
          url: imageRecord.downloadUrl,
          name: imageRecord.fileName,
        };
        console.log("✅ Loaded image for hold detection:", currentImage.value);
      } else {
        console.warn(`⚠️ Image with ID ${imageId} not found in location ${locationId}`);
        currentImage.value = null;
      }
    } catch (error) {
      console.error("❌ Error loading image for hold detection:", error);
      imageLoadError.value = error.message;
      currentImage.value = null;
    }
  } else {
    // No query parameters, use default/hardcoded image
    console.log("📷 Using default image (no query parameters)");
    currentImage.value = null;
  }
};

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
  console.log("🚀 Server Hold Detection View mounted");

  // Reset state
  serverStore.resetState();
  imageLoaded.value = false;
  imageLoadError.value = null;

  // Load boulder problems immediately on mount
  if (route.params.locationId) {
    console.log("🏔️ Loading boulder problems for location:", route.params.locationId);
    try {
      boulderProblemsStore.initializeForLocation(route.params.locationId, route.query.imageId);
      await boulderProblemsStore.loadBoulderProblems(route.params.locationId);
      console.log("✅ Boulder problems loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load boulder problems:", error);
    }
  }

  // Load image based on query parameters
  await loadImageFromQuery();

  // Test API health on mount
  await testApiHealth();
});
</script>
