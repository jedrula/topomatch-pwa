<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-6 pb-24">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Hold Detection</h1>
            <p class="text-gray-600 mt-2">
              AI-powered climbing hold identification and analysis
            </p>
          </div>
          <router-link
            to="/"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Home</span>
          </router-link>
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
                Currently using: WhatsApp Image 2025-05-24 at 00.15.17.jpeg
              </p>
            </div>
            
            <div class="p-6">
              <!-- Image Container -->
              <div class="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  ref="climbingImage"
                  :src="imageUrl"
                  alt="Climbing wall for hold detection"
                  class="w-full h-auto object-contain"
                  @load="onImageLoad"
                />
                
                <!-- Hold Detection Overlay -->
                <div
                  v-if="detectionResults && imageLoaded"
                  class="absolute inset-0"
                  :style="{ transform: `scale(${imageScale})`, transformOrigin: 'top left' }"
                >
                  <div
                    v-for="(hold, index) in detectionResults.holds"
                    :key="index"
                    class="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 cursor-pointer hover:bg-opacity-30 transition-all duration-200"
                    :style="{
                      left: `${hold.x}px`,
                      top: `${hold.y}px`,
                      width: `${hold.width}px`,
                      height: `${hold.height}px`,
                    }"
                    @click="selectHold(hold, index)"
                    :class="{
                      'border-blue-500 bg-blue-500': selectedHoldIndex === index,
                      'border-red-500 bg-red-500': selectedHoldIndex !== index,
                    }"
                  >
                    <!-- Hold Label -->
                    <div class="absolute -top-6 left-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {{ hold.type }} ({{ Math.round(hold.confidence * 100) }}%)
                    </div>
                  </div>
                </div>

                <!-- Loading Overlay -->
                <div
                  v-if="holdDetectionStore.isLoading"
                  class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div class="bg-white rounded-lg p-6 text-center">
                    <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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

                <!-- Future: Image Upload Button -->
                <button
                  disabled
                  class="px-6 py-3 border border-gray-300 text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
                  title="Image upload will be available in future version"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>Upload Image (Soon)</span>
                </button>
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
                    {{ detectionResults ? `${detectionResults.holds.length} holds found` : "No results" }}
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
                  <span class="text-lg font-bold text-blue-600">{{ detectionResults.holds.length }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Hold Details -->
          <div v-if="selectedHold" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Selected Hold</h3>
              
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Type</span>
                  <span class="text-sm font-medium text-gray-900 capitalize">{{ selectedHold.type }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Confidence</span>
                  <span class="text-sm font-medium text-gray-900">{{ Math.round(selectedHold.confidence * 100) }}%</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Position</span>
                  <span class="text-sm font-medium text-gray-900">{{ selectedHold.x }}, {{ selectedHold.y }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Size</span>
                  <span class="text-sm font-medium text-gray-900">{{ selectedHold.width }} × {{ selectedHold.height }}</span>
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
                  :key="index"
                  @click="selectHold(hold, index)"
                  class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  :class="{
                    'border-blue-500 bg-blue-50': selectedHoldIndex === index,
                  }"
                >
                  <div>
                    <div class="font-medium text-gray-900 capitalize">{{ hold.type }}</div>
                    <div class="text-sm text-gray-500">{{ hold.x }}, {{ hold.y }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900">{{ Math.round(hold.confidence * 100) }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="holdDetectionStore.errorString" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
import { ref, computed, onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useHoldDetectionStore } from "@/stores/holdDetectionStore";

const holdDetectionStore = useHoldDetectionStore();

// Reactive state
const climbingImage = ref(null);
const imageLoaded = ref(false);
const imageScale = ref(1);
const selectedHoldIndex = ref(null);

// Hardcoded image URL for now
const imageUrl = "/topos/wibrem-23-may/WhatsApp Image 2025-05-24 at 00.15.17.jpeg";

// Computed properties
const detectionResults = computed(() => holdDetectionStore.detectionResults);
const selectedHold = computed(() => {
  if (selectedHoldIndex.value === null || !detectionResults.value) return null;
  return detectionResults.value.holds[selectedHoldIndex.value];
});

// Methods
const onImageLoad = () => {
  imageLoaded.value = true;
  calculateImageScale();
};

const calculateImageScale = () => {
  if (!climbingImage.value || !detectionResults.value) {
    imageScale.value = 1;
    return;
  }

  const displayedWidth = climbingImage.value.clientWidth;
  const displayedHeight = climbingImage.value.clientHeight;
  const originalWidth = detectionResults.value.imageWidth;
  const originalHeight = detectionResults.value.imageHeight;

  // Calculate scale based on how the image is displayed
  const scaleX = displayedWidth / originalWidth;
  const scaleY = displayedHeight / originalHeight;
  
  // Use the smaller scale to maintain aspect ratio
  imageScale.value = Math.min(scaleX, scaleY);
};

const runDetection = async () => {
  // Create a mock file object for the hardcoded image
  const mockFile = {
    name: "WhatsApp Image 2025-05-24 at 00.15.17.jpeg",
    size: 0, // We don't have the actual size
    type: "image/jpeg",
  };

  await holdDetectionStore.runHoldDetection(mockFile);
  
  // Recalculate scale after detection results are available
  if (detectionResults.value) {
    calculateImageScale();
  }
};

const selectHold = (hold, index) => {
  selectedHoldIndex.value = selectedHoldIndex.value === index ? null : index;
};

const clearResults = () => {
  holdDetectionStore.resetDetectionState();
  selectedHoldIndex.value = null;
};

// Lifecycle
onMounted(() => {
  // Reset any previous state
  holdDetectionStore.resetDetectionState();
});
</script>
