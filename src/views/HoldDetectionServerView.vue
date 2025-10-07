<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Success Notification -->
    <div
      v-if="showSuccess"
      class="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out"
    >
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </div>
    
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
              Server-powered climbing hold detection with precise SVG overlays
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Left Column: Image and Controls -->
        <div class="xl:col-span-2 space-y-6">
          <!-- Image Display Card -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <!-- Error message for image loading -->
              <div
                v-if="imageLoadError"
                class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
              >
                Error loading image: {{ imageLoadError }}
              </div>
              <!-- Image Container -->
              <div
                ref="imageContainer"
                class="relative bg-gray-100 rounded-lg overflow-hidden min-h-64"
                style="aspect-ratio: auto"
              >
                <!-- Fullscreen Toggle Button -->
                <button
                  v-if="imageLoaded && !serverStore.isProcessing"
                  @click="toggleFullscreen"
                  class="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg p-2 transition-all duration-200 pointer-events-auto"
                  :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
                >
                  <!-- Fullscreen Icon -->
                  <svg
                    v-if="!isFullscreen"
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
                    />
                  </svg>
                  <!-- Exit Fullscreen Icon -->
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"
                    />
                  </svg>
                </button>
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
                  class="w-full h-auto object-contain block"
                  @load="onImageLoad"
                />
                <!-- Interactive Hold Overlay with Manual Drawing Support -->
                <InteractiveHoldOverlay
                  v-if="imageLoaded"
                  :detection-results="serverStore.results"
                  :image-element="climbingImage"
                  :boulder-problems="boulderProblemsStore.sortedProblems"
                  :is-creating-problem="boulderProblemsStore.isCreatingProblem"
                  :active-problem="boulderProblemsStore.activeProblem"
                  :is-editing-problem="editingState.isEditing"
                  :editing-problem="editingState.editingProblem"
                  :hovered-problem-id="hoveredProblemId"
                  :magic-wand-active="isAnyMagicWandActive"
                  :magic-wand-selection="magicWandSelection.selectedIndices"
                  :show-hold-overlay="false"
                  :is-showing-only-one-problem="boulderProblemsStore.isShowingOnlyOneProblem"
                  :isolated-problem="boulderProblemsStore.isolatedProblem"
                  :filtered-problems="filteredProblems"
                  :location-id="String(route.params.locationId)"
                  :image-id="currentImage?.id"
                  :image-url="imageUrl"
                  :boulder-hold-selection-tool="boulderHoldSelectionTool"
                  @hold-click="handleHoldClick"
                  @hold-hover="handleHoldHover"
                  @tool-selection-change="handleToolSelectionChange"
                  @delete-hold="handleDeleteHold"
                  ref="interactiveOverlay"
                />

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

                <!-- Fullscreen Boulder Problems Manager - inside image container for fullscreen visibility -->
                <BoulderProblemsManager
                  v-if="isFullscreen && route.params.locationId"
                  v-bind="boulderProblemsManagerProps"
                  :is-fullscreen="true"
                  v-on="boulderProblemsManagerEvents"
                />
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  v-if="!serverStore.hasResults"
                  @click="processImage"
                  :disabled="serverStore.isProcessing || !serverStore.canProcessImage(imageUrl)"
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
                    serverStore.isProcessing
                      ? "Processing..."
                      : "Detect Holds (Server)"
                  }}</span>
                </button>

                <!-- Manual Hold Drawing Toggle -->
                <button
                  @click="toggleDrawingMode"
                  :class="[
                    'px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                    serverStore.isDrawingMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'border border-green-600 text-green-600 hover:bg-green-50',
                  ]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>{{ serverStore.isDrawingMode ? "Exit Drawing" : "Draw Holds" }}</span>
                </button>

                <!-- Hold Delete Toggle - Available when there are any holds (AI or manual) -->
                <button
                  v-if="serverStore.manualHolds.length > 0 || serverStore.hasResults"
                  @click="toggleDeleteMode"
                  :class="[
                    'px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                    serverStore.isDeleteMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'border border-red-600 text-red-600 hover:bg-red-50',
                  ]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>{{ serverStore.isDeleteMode ? "Exit Delete" : "Delete Holds" }}</span>
                </button>

                <!-- Magic Wand Button - Only show when not in boulder creation/editing mode -->
                <button
                  v-if="
                    serverStore.hasResults &&
                    !boulderProblemsStore.isCreatingProblem &&
                    !editingState.isEditing
                  "
                  @click="toggleMagicWand"
                  :class="[
                    'px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                    magicWandActive
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'border border-purple-300 text-purple-700 hover:bg-purple-50',
                  ]"
                  title="Magic Wand: Click a hold to select connected route of similar-colored holds"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4.929 2.929l1.414 1.414M2.929 7.071l1.414-1.414m0 0L7.071 2.93m-2.728 2.728L6.929 7.243m9.9-2.122l1.414-1.414m-2.122 9.9l1.414 1.414M12 3v3m6 6h3M9 21h6m-9-6h3m6 0h3"
                    />
                  </svg>
                  <span>{{ magicWandActive ? "Magic Wand ON" : "Magic Wand" }}</span>
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

                    <!-- Cache Management -->
                    <div class="border-t pt-4 mt-4">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-600">Cache Management</span>
                        <div class="flex gap-2">
                          <button
                            v-if="imageUrl"
                            @click="clearCurrentImageCache"
                            class="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                            title="Clear cache for current image only"
                          >
                            Clear Current
                          </button>
                          <button
                            @click="clearDetectionCache"
                            class="text-xs text-gray-500 hover:text-red-600 transition-colors"
                            title="Clear all cached detection results"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        Repeated detections are cached for 1 week
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Results and Statistics -->
        <div class="space-y-6">
          <!-- Boulder Problems Manager -->
          <BoulderProblemsManager
            v-if="route.params.locationId && !isFullscreen"
            v-bind="boulderProblemsManagerProps"
            :is-fullscreen="false"
            v-on="boulderProblemsManagerEvents"
          />

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
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-900 capitalize">
                      {{ serverStore.statusMessage }}
                    </span>
                    <!-- Cache indicator -->
                    <div
                      v-if="serverStore.statusMessage.includes('cached')"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      title="Results loaded from browser cache"
                    >
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Cached
                    </div>
                  </div>
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

          <!-- Magic Wand Status - Only show for standalone magic wand -->
          <div
            v-if="magicWandActive && magicWandSelection.stats"
            class="bg-purple-50 border border-purple-200 rounded-lg shadow-sm"
          >
            <div class="p-6">
              <h3 class="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.929 2.929l1.414 1.414M2.929 7.071l1.414-1.414m0 0L7.071 2.93m-2.728 2.728L6.929 7.243m9.9-2.122l1.414-1.414m-2.122 9.9l1.414 1.414M12 3v3m6 6h3M9 21h6m-9-6h3m6 0h3"
                  />
                </svg>
                Magic Wand Selection
              </h3>
              <div class="space-y-3">
                <!-- Target Hold -->
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Target Hold:</span>
                  <span class="text-sm font-medium text-purple-900">
                    #{{ magicWandSelection.targetHoldIndex }}
                  </span>
                </div>
                <!-- Total Selected -->
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Total Selected:</span>
                  <span class="text-sm font-medium text-purple-900">
                    {{ magicWandSelection.selectedIndices.length }} holds
                  </span>
                </div>
                <!-- Color Similar -->
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Color Similar:</span>
                  <span class="text-sm font-medium text-purple-900">
                    {{ magicWandSelection.stats.colorSimilar }} holds
                  </span>
                </div>
                <!-- Connected -->
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Connected Route:</span>
                  <span class="text-sm font-medium text-purple-900">
                    {{ magicWandSelection.stats.connected }} holds
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
                  <div class="text-2xl font-bold text-purple-600">{{ serverStore.holdCount }}</div>
                  <div class="text-sm text-gray-600">SVGs Generated</div>
                </div>
                <div
                  v-if="serverStore.processingTime > 0"
                  class="text-center p-4 bg-orange-50 rounded-lg"
                >
                  <div class="text-2xl font-bold text-orange-600">
                    {{ (serverStore.processingTime / 1000).toFixed(1) }}s
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
                  <div v-if="serverStore.results.processing_time" class="flex justify-between border-t pt-1 font-medium">
                    <span class="text-gray-700">🏁 Total:</span>
                    <span class="font-mono"
                      >{{ serverStore.results.processing_time.toFixed(3) }}s</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

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

    <!-- Floating Problem Card Tooltip -->
    <FloatingBoulderProblemCard
      :visible="floatingCard.visible"
      :problem="floatingCard.problem"
      :position="floatingCard.position"
      @edit="handleFloatingCardEdit"
      @toggle-visibility="handleFloatingCardToggleVisibility"
      @mouse-enter="handleFloatingCardMouseEnter"
      @mouse-leave="handleFloatingCardMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHoldDetectionServerStore } from '@/stores/holdDetectionServerStore.js';
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore.js';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore.js';
import { locationService } from '@/services/locationService';
import InteractiveHoldOverlay from '@/components/InteractiveHoldOverlay.vue';
import BoulderProblemsManager from '@/components/BoulderProblemsManager.vue';
import FloatingBoulderProblemCard from '@/components/FloatingBoulderProblemCard.vue';
import { ensureHoldHasSvgMarkup } from '@/utils/svgUtils.js';
import { performMagicWandSelection } from '@/utils/magicWandUtils.js';
import { getResizedImageUrl } from '@/utils/imageResize.js';

// TypeScript component - basic type annotations without complex interface definitions

const route = useRoute();
const router = useRouter();
const serverStore = useHoldDetectionServerStore();
const persistenceStore = useHoldDetectionPersistenceStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Reactive state
// References
const climbingImage = ref(null); // TODO: Add proper image type
const imageContainer = ref(null);
const interactiveOverlay = ref(null); // TODO: Add component type
const imageLoaded = ref(false);
const currentImage = ref(null); // TODO: Add proper image type
const imageLoadError = ref(null);

// Fullscreen state
const isFullscreen = ref(false)

// Hold interaction state
const hoveredProblemId = ref(null);
const filteredProblems = ref([]); // TODO: Add proper problem type

// Editing state derived from URL query parameters (single source of truth)
const editingState = computed(() => {
  const editingProblemId = route.query.editingProblemId;
  if (editingProblemId) {
    const editingProblem = boulderProblemsStore.sortedProblems.find(
      (p) => p.id === editingProblemId
    );
    return {
      isEditing: true,
      editingProblem: editingProblem || null,
      editingProblemId: editingProblemId, // Keep the ID even if problem not found yet
    };
  }
  return {
    isEditing: false,
    editingProblem: null,
    editingProblemId: null,
  };
});

// Floating problem card state
const floatingCard = ref({
  visible: false,
  problem: null,
  position: { x: 0, y: 0 },
});

// Detection saving state
const isSavingDetection = ref(false);

// Success notification state
const showSuccess = ref(false);
const successMessage = ref('');

// Timeout for tooltip hiding
let tooltipHideTimeout = null;

// Boulder problem tool selection state
const boulderHoldSelectionTool = ref('single');

// Magic Wand state (global magic wand for standalone use)
const magicWandActive = ref(false);
const magicWandSelection = ref({
  selectedIndices: [],
  targetHoldIndex: null,
  stats: null,
});

// Dynamic image loading based on query parameters
const imageUrl = computed(() => {
  if (currentImage.value) {
    return currentImage.value.url;
  }
  // Fallback to hardcoded image if no query parameter
  return '/topos/wibrem-23-may/WhatsApp Image 2025-05-24 at 00.15.17.jpeg';
});

// Debug: Reactive computed to track API health changes
const apiHealthStatus = computed(() => {
  const status = serverStore.apiHealthy;
  return status;
});

const connectionDisplayText = computed(() => {
  return apiHealthStatus.value ? 'Connected' : 'Disconnected';
});

// Check if any form of magic wand is active
const isAnyMagicWandActive = computed(() => {
  // Standalone magic wand OR boulder creation/editing with magic wand tool
  return (
    magicWandActive.value ||
    ((boulderProblemsStore.isCreatingProblem || editingState.value.isEditing) &&
      boulderHoldSelectionTool.value === 'magic-wand')
  );
});

// Shared props for BoulderProblemsManager (DRY principle)
const boulderProblemsManagerProps = computed(() => ({
  locationId: String(route.params.locationId || ''),
  hasDetectionResults: serverStore.hasResults,
  detectionResults: serverStore.results,
  climbingImage: climbingImage.value,
  editingProblemId: String(editingState.value.editingProblemId || ''),
}));

// Methods
const onImageLoad = () => {
  imageLoaded.value = true;

  // Image loaded - ready for interactions
};

// Fullscreen functionality
const toggleFullscreen = async () => {
  try {
    if (!isFullscreen.value) {
      // Enter fullscreen
      const element = imageContainer.value;
      if (!element) return;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  } catch (error) {
    console.error('Fullscreen toggle failed:', error);
  }
}

const testApiHealth = async () => {
  const result = await serverStore.testApiHealth();

  if (result.success) {
  } else {
    console.error('❌ API health check failed:', result.error);
  }
};

const clearDetectionCache = () => {
  // Clear detection results - the store no longer has clearAllCache method
  serverStore.results = null
  serverStore.error = null
}

const clearCurrentImageCache = () => {
  if (!imageUrl.value) return

  // Clear current results - the store no longer has clearCacheForImage method
  serverStore.results = null
  serverStore.error = null
}

// Magic Wand functionality
const toggleMagicWand = () => {
  magicWandActive.value = !magicWandActive.value;

  if (magicWandActive.value) {
    // Clear any previous selection when activating
    magicWandSelection.value = {
      selectedIndices: [],
      targetHoldIndex: null,
      stats: null,
    };
  } else {
    // Clear selection when deactivating
    magicWandSelection.value = {
      selectedIndices: [],
      targetHoldIndex: null,
      stats: null,
    };
  }
};

// Manual Hold Drawing functionality
const toggleDrawingMode = () => {
  const newDrawingMode = !serverStore.isDrawingMode;
  serverStore.setDrawingMode(newDrawingMode);

  if (newDrawingMode) {
    // Disable magic wand when entering drawing mode
    if (magicWandActive.value) {
      toggleMagicWand();
    }
    // Load existing manual holds for this image
    serverStore.loadManualHolds(route.params.locationId, route.query.imageId);
  } else {
    // Save manual holds when exiting drawing mode
    serverStore.saveManualHolds(route.params.locationId, route.query.imageId, imageUrl.value);
  }
};

const toggleDeleteMode = () => {
  const newDeleteMode = !serverStore.isDeleteMode;
  serverStore.setDeleteMode(newDeleteMode);

  if (newDeleteMode) {
    // Disable magic wand when entering delete mode
    if (magicWandActive.value) {
      toggleMagicWand();
    }
    // Load existing manual holds for this image
    serverStore.loadManualHolds(route.params.locationId, route.query.imageId);
  } else {
    // Save manual holds when exiting delete mode
    serverStore.saveManualHolds(route.params.locationId, route.query.imageId, imageUrl.value);
  }
};

const processImage = async () => {
  if (!imageUrl.value) {
    console.error('❌ No image URL available');
    return;
  }


  const result = await serverStore.processImage(
    imageUrl.value, 
    route.params.locationId, 
    route.query.imageId
  );

  if (result.success) {
    
    // Automatically save detection results to Firestore
    if (currentImage.value && route.params.locationId) {
      await saveDetectionToFirestore();
    }
  } else {
    console.error('❌ Processing failed:', result.error);
  }
};

const saveDetectionToFirestore = async () => {
  if (!serverStore.hasResults || !currentImage.value || !route.params.locationId) {
    console.error('❌ Cannot save: missing results, image, or locationId');
    return;
  }

  isSavingDetection.value = true;

  try {
    // Initialize persistence store for location
    persistenceStore.initializeForLocation(route.params.locationId);

    // Convert AI detection results to unified format
    const aiHolds = (serverStore.results?.holds || []).map((hold, index) => {
      // DEBUG: Log the structure of the first few holds
      if (index < 3) {
      }
      
      return {
        id: `ai_hold_${index}`,
        source: 'ai-detected',
        svgMarkup: serverStore.results?.svg_markups?.[index] || '',
        // The serverStore.results.holds already have x,y,width,height from convertApiResponseToFrontendFormat
        // x,y are top-left corner from bbox, so calculate center coordinates  
        x: (hold.x || 0) + (hold.width || 0) / 2,
        y: (hold.y || 0) + (hold.height || 0) / 2,
        width: hold.width || 0,
        height: hold.height || 0,
        confidence: hold.confidence || 0,
        holdType: hold.type || 'unknown',
        detectionConfidence: hold.confidence || 0,
        aiModel: 'server-detection',
        addedAt: new Date()
      };
    });

    // Calculate viewBox from image dimensions
    const imageElement = climbingImage.value;
    const viewBox = imageElement ? 
      `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : 
      '0 0 1920 1080'; // fallback

    const detectionData = {
      aiHolds,
      manualHolds: [], // Manual holds are saved separately
      viewBox,
      imageUrl: currentImage.value.url,
      imageDimensions: {
        width: imageElement?.naturalWidth || 1920,
        height: imageElement?.naturalHeight || 1080
      },
      modelVersion: 'server-detection-v1'
    };

    // Save to Firestore using unified system
    await persistenceStore.saveDetectionResults(currentImage.value.id, detectionData);

    
    // Show success notification
    showSuccessNotification('Detection results saved successfully!');

  } catch (error) {
    console.error('❌ Error saving detection to Firestore:', error);
    alert('Failed to save detection results. Please try again.');
  } finally {
    isSavingDetection.value = false;
  }
};

const goBackToLocation = () => {
  const locationId = route.params.locationId;
  if (locationId) {
    router.push(`/location/${locationId}`);
  }
};

const showSuccessNotification = (message) => {
  successMessage.value = message;
  showSuccess.value = true;
  setTimeout(() => {
    showSuccess.value = false;
  }, 3000);
};

// Hold interaction handlers
const handleHoldClick = (hold, holdIndex) => {

  // Check if we're in boulder creation/editing mode
  const isBoulderMode = boulderProblemsStore.isCreatingProblem || editingState.value.isEditing;

  // Priority 1: Boulder creation/editing with magic wand tool
  if (isBoulderMode && boulderHoldSelectionTool.value === 'magic-wand') {

    // Get all holds from AI + manual holds
    const aiHolds = serverStore.results?.holds || []
    const manualHolds = serverStore.manualHolds || []
    const allHolds = [...aiHolds, ...manualHolds]

    if (allHolds.length === 0) {
      console.warn('No holds available for magic wand selection');
      return;
    }

    // Determine which problem we're working with
    let targetProblem = null;
    if (boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem) {
      targetProblem = boulderProblemsStore.activeProblem;
    } else if (editingState.value.isEditing && editingState.value.editingProblem) {
      targetProblem = editingState.value.editingProblem;
    }

    if (!targetProblem) {
      return;
    }

    // Perform magic wand selection
    const result = performMagicWandSelection(holdIndex, allHolds);

    if (result.success) {

      // Add all selected holds to the target problem
        result.selectedIndices.forEach((selectedHoldIndex) => {
          const selectedHold = allHolds[selectedHoldIndex];
          if (selectedHold) {
            // Ensure hold has svgMarkup (converts from pathPoints if needed for manual holds)
            let enhancedHold = ensureHoldHasSvgMarkup(selectedHold);

            // Use server SVG markup if available (for AI holds)
            const aiHoldsCount = serverStore.results?.holds?.length || 0
            if (selectedHoldIndex < aiHoldsCount && serverStore.results?.svg_markups?.[selectedHoldIndex]) {
              enhancedHold = {
                ...enhancedHold,
                svgMarkup: serverStore.results.svg_markups[selectedHoldIndex],
              };
            }

            // Set detection source
            enhancedHold.detectionSource = selectedHold.pathPoints ? 'manual' : 'server';

            // Add hold to the target problem (this will toggle - add if not present, remove if present)
            boulderProblemsStore.addHoldToProblem(targetProblem.id, enhancedHold, selectedHoldIndex);
          }
        });
    }

    return; // Don't proceed with other logic when using boulder magic wand
  }

  // Priority 2: Standalone Magic Wand functionality (when not in boulder mode)
  if (!isBoulderMode && magicWandActive.value) {

    // Get all holds from AI + manual holds
    const aiHolds = serverStore.results?.holds || []
    const manualHolds = serverStore.manualHolds || []
    const allHolds = [...aiHolds, ...manualHolds]

    if (allHolds.length === 0) {
      console.warn('No holds available for magic wand selection');
      return;
    }

    // Perform magic wand selection for standalone use
    const result = performMagicWandSelection(holdIndex, allHolds);

    if (result.success) {
      magicWandSelection.value = {
        selectedIndices: result.selectedIndices,
        targetHoldIndex: holdIndex,
        stats: result.stats,
      };
    }

    return; // Don't proceed with normal hold selection when standalone magic wand is active
  }

  // Priority 3: Normal boulder creation/editing (single hold selection)
  if (isBoulderMode) {
    // Normal hold selection logic for boulder problems

    // Check if hold is already assigned to another problem
    const existingProblem = boulderProblemsStore.sortedProblems.find((problem) =>
      problem.holds?.some((h) => h.holdIndex === holdIndex)
    );

    // Determine which problem we're working with
    let targetProblem = null;
    if (boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem) {
      // Creating a new problem
      targetProblem = boulderProblemsStore.activeProblem;
    } else if (editingState.value.isEditing && editingState.value.editingProblem) {
      // Editing an existing problem
      targetProblem = editingState.value.editingProblem;
    }

    if (!targetProblem) {
      return;
    }

    // If hold belongs to a different problem than the one being worked on, prevent selection
    if (existingProblem && existingProblem.id !== targetProblem.id) {
      console.warn(`⚠️ Hold ${holdIndex} is already part of problem #${existingProblem.id}`);
      return;
    }

    // Ensure hold has svgMarkup (converts from pathPoints if needed for manual holds)
    let enhancedHold = ensureHoldHasSvgMarkup(hold);

    // Use server SVG markup if available (for AI holds)
    if (serverStore.results?.svg_markups?.[holdIndex]) {
      enhancedHold = {
        ...enhancedHold,
        svgMarkup: serverStore.results.svg_markups[holdIndex],
      };
    }
    // Use server hold width, height, x and y if available (for AI holds)
    if (serverStore.results?.holds?.[holdIndex]) {
      enhancedHold = {
        ...enhancedHold,
        x: serverStore.results.holds[holdIndex].x,
        y: serverStore.results.holds[holdIndex].y,
        width: serverStore.results.holds[holdIndex].width,
        height: serverStore.results.holds[holdIndex].height,
      };
    }

    // Set detection source
    enhancedHold.detectionSource = hold.pathPoints ? 'manual' : 'server';

    // Add or remove hold from the target problem
    boulderProblemsStore.addHoldToProblem(targetProblem.id, enhancedHold, holdIndex);

    return; // Don't proceed with other logic when in boulder mode
  }

  // Priority 4: No special mode active - ignore click
};

// Helper function to get problem ID for a hold
const getHoldProblemId = (holdIndex) => {
  for (const problem of boulderProblemsStore.sortedProblems) {
    const holdFound = problem.holds?.some((h) => h.holdIndex === holdIndex);
    if (holdFound) {
      return problem.id;
    }
  }
  return null;
};

const handleHoldHover = (holdIndex, isEntering, event) => {

  // Clear any pending hide timeout
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }

  if (isEntering && event) {
    // Find which problem this hold belongs to
    const problemId = getHoldProblemId(holdIndex);

    if (problemId) {
      const problem = boulderProblemsStore.sortedProblems.find((p) => p.id === problemId);

      if (problem) {
        // Position tooltip near the mouse cursor
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Show floating card at mouse position with small offset
        floatingCard.value = {
          visible: true,
          problem: problem,
          position: { x: mouseX, y: mouseY },
        };
      }
    }

    hoveredProblemId.value = problemId;
  } else {
    // Don't hide immediately - use a delay to allow moving to tooltip
    tooltipHideTimeout = setTimeout(() => {
      floatingCard.value.visible = false;
      hoveredProblemId.value = null;
    }, 300); // 300ms delay
  }
};

const startEditingProblem = (problem) => {
  router.push({
    query: {
      ...route.query,
      editingProblemId: problem.id,
    },
  });
};

const stopEditingProblem = () => {
  const query = { ...route.query };
  delete query.editingProblemId;
  router.push({ query });
};

const handleToolSelectionChange = (selectedTool) => {
  boulderHoldSelectionTool.value = selectedTool;
};

const handleDeleteHold = async ({ hold, index, type }) => {
  
  if (type === 'ai') {
    // For AI holds, use the store method to remove them
    await serverStore.removeAIHold(index, route.params.locationId, route.query.imageId);
  } else if (type === 'manual') {
    // Manual holds are already handled by the serverStore.removeManualHold call
  }
  
  // TODO: Also remove the hold from any boulder problems that might reference it
  // This would require updating problem holds arrays and adjusting hold indices
};

const handleProblemCardHover = (problem, isEntering) => {
  // Set hovered problem ID when entering, clear when leaving
  hoveredProblemId.value = isEntering ? problem.id : null;
};

const handleFilteredProblemsChange = (newFilteredProblems) => {
  filteredProblems.value = newFilteredProblems;
};

// Shared events for BoulderProblemsManager (DRY principle) - defined after all functions
const boulderProblemsManagerEvents = {
  'start-editing': startEditingProblem,
  'stop-editing': stopEditingProblem,
  'tool-selection-change': handleToolSelectionChange,
  'problem-hover': handleProblemCardHover,
  'filtered-problems-change': handleFilteredProblemsChange,
};

// Load image based on query parameters
const loadImageFromQuery = async () => {
  const locationId = route.query.locationId || route.params.locationId;
  const imageId = route.query.imageId;

  if (locationId && imageId) {
    try {
      // Load existing boulder problems for this image

      // Load location data to get grading system
      try {
        const location = await locationService.getLocation(locationId)
        if (location && typeof location === 'object' && 'gradingSystem' in location && location.gradingSystem) {
          boulderProblemsStore.setLocationGradingSystem(location.gradingSystem);
        } else {
          boulderProblemsStore.setLocationGradingSystem(null);
        }
      } catch (error) {
        console.warn('⚠️ Error loading location grading system:', error)
        // Continue with default system
        boulderProblemsStore.setLocationGradingSystem(null);
      }

      // Load image data from the location service
      const imageRecords = await locationService.getLocationImages(locationId);
      if (Array.isArray(imageRecords)) {
        const imageRecord = imageRecords.find((record) => record.id === imageId);

        if (imageRecord) {
          currentImage.value = {
            id: imageRecord.id,
            url: getResizedImageUrl(imageRecord.downloadUrl, '1920x1440', 'jpg'),
            name: imageRecord.fileName,
          }

          // Load existing manual holds for this image
          await serverStore.loadManualHolds(locationId, imageId);
        } else {
          console.warn('⚠️ Image not found in location images:', imageId);
        }
      } else {
        console.warn('⚠️ Invalid image records format:', imageRecords);
      }
    } catch (error) {
      console.error('❌ Error loading image for hold detection:', error);
      imageLoadError.value = error.message;
      currentImage.value = null;
    }
  } else {
    // No query parameters, use default/hardcoded image
    currentImage.value = null
    // Use default grading system when no location specified
    boulderProblemsStore.setLocationGradingSystem(null);
  }
}

// Watch for route changes to load different images
watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    loadImageFromQuery();

    // If imageId changed, reload boulder problems for the new image
    if (newQuery.imageId !== oldQuery?.imageId && route.params.locationId) {
      try {
        boulderProblemsStore.initializeForLocation(route.params.locationId, newQuery.imageId);
        await boulderProblemsStore.loadBoulderProblems(route.params.locationId, newQuery.imageId);
      } catch (error) {
        console.error('❌ Failed to reload boulder problems:', error);
      }
    }
  },
  { immediate: false }
);

// Watch for URL editing state changes and sync with boulder problems store
watch(
  () => editingState.value,
  (newEditingState) => {

    if (newEditingState.isEditing && newEditingState.editingProblem) {
      // Problem found - start editing mode in the store
      boulderProblemsStore.selectProblem(newEditingState.editingProblem);
    } else if (!newEditingState.isEditing) {
      // Not editing - exit editing mode in the store
      boulderProblemsStore.deselectProblem();
    }
    // If isEditing but no editingProblem found yet, wait for data to load
  },
  { immediate: true }
);

// Load existing detection results from Firestore
const loadExistingDetectionResults = async () => {
  const locationId = route.params.locationId;
  const imageId = route.query.imageId;
  
  if (!locationId || !imageId) {
    return;
  }

  try {
    
    // Use the server store method to load detection results
    const resultsLoaded = await serverStore.loadDetectionResults(locationId, imageId);
    
    if (resultsLoaded) {
    } else {
    }
    
  } catch (error) {
    console.error('❌ Error loading existing detection results:', error);
    // Don't throw - this is not a critical error, we can proceed without cached results
  }
};

// Lifecycle
onMounted(async () => {

  // Reset state
  serverStore.resetState();
  imageLoaded.value = false;
  imageLoadError.value = null;

  // Load boulder problems immediately on mount
  if (route.params.locationId) {
    const imageId = route.query.imageId;
    try {
      boulderProblemsStore.initializeForLocation(route.params.locationId, imageId);
      await boulderProblemsStore.loadBoulderProblems(route.params.locationId, imageId);
    } catch (error) {
      console.error('❌ Failed to load boulder problems:', error);
    }
  }

  // Load image based on query parameters
  await loadImageFromQuery();

  // Load existing detection results from Firestore if available
  await loadExistingDetectionResults();

  // Test API health on mount
  await testApiHealth();

  // Add fullscreen event listeners
  const handleFullscreenChange = () => {
    isFullscreen.value = !!(
      document.fullscreenElement
    )
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

onUnmounted(() => {
  // Clean up fullscreen event listeners
  const handleFullscreenChange = () => {};
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});

// Floating card event handlers
const handleFloatingCardEdit = (problem) => {
  // Use URL-based editing state management
  startEditingProblem(problem);
};

const handleFloatingCardToggleVisibility = (problem) => {
  // Check if we're showing only this problem or showing all problems
  if (boulderProblemsStore.isShowingOnlyOneProblem && !problem.hidden) {
    // Currently showing only this problem - show all problems
    boulderProblemsStore.showAllProblems();
  } else {
    // Show only this problem (hide all others)
    boulderProblemsStore.showOnlyProblem(problem.id);
  }
};

const handleFloatingCardMouseEnter = () => {
  // Clear any pending hide timeout when mouse enters the tooltip
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
};

const handleFloatingCardMouseLeave = () => {
  // Hide the tooltip when mouse leaves it
  tooltipHideTimeout = setTimeout(() => {
    floatingCard.value.visible = false;
    hoveredProblemId.value = null;
  }, 200); // Shorter delay when leaving tooltip
};
</script>

<style scoped>
/* Fullscreen styles */
:global(.fullscreen-container) {
  background: black !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100vw !important;
  height: 100vh !important;
}

:global(.fullscreen-container img) {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

:global(.fullscreen-container .absolute) {
  /* Ensure overlays maintain same positioning relative to image */
  position: absolute !important;
}

/* Fullscreen using native fullscreen API */
:fullscreen {
  background: black !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

:fullscreen img {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

:-webkit-full-screen {
  background: black !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

:-webkit-full-screen img {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

:-moz-full-screen {
  background: black !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

:-moz-full-screen img {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

:-ms-fullscreen {
  background: black !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

:-ms-fullscreen img {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}
</style>
