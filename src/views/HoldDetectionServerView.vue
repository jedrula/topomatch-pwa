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
              <h1 class="text-3xl font-bold text-gray-900">Detected Holds</h1>
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
              View and edit automatically detected climbing holds (AI-powered)
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
              <!-- Image Navigation (above image in normal mode) -->
              <div
                v-if="!isFullscreen && imageLoaded && totalImageCount > 1"
                class="flex items-center justify-center space-x-2 mb-3"
              >
                <button
                  @click="navigateToImage(-1)"
                  :disabled="!canNavigatePrev"
                  class="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors"
                  title="Previous image"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span class="text-sm text-gray-600 font-medium select-none">
                  {{ currentImageIndex + 1 }} / {{ totalImageCount }}
                </span>
                <button
                  @click="navigateToImage(1)"
                  :disabled="!canNavigateNext"
                  class="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors"
                  title="Next image"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <!-- Image Container -->
              <div
                ref="imageContainer"
                class="relative bg-gray-100 rounded-lg overflow-hidden min-h-64"
                :class="{ 'fullscreen-overlay': isFullscreen }"
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

                <!-- Image content: hidden on mobile when viewing info tab -->
                <div v-show="!isFullscreen || mobilePanelTab === 'image'" style="display: contents">

                <!-- Image Navigation overlay (fullscreen only) -->
                <div
                  v-if="isFullscreen && imageLoaded && totalImageCount > 1"
                  class="absolute top-4 left-4 z-10 flex items-center space-x-1 pointer-events-auto"
                >
                  <button
                    @click="navigateToImage(-1)"
                    :disabled="!canNavigatePrev"
                    class="bg-black bg-opacity-50 hover:bg-opacity-70 disabled:bg-opacity-30 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-all duration-200"
                    title="Previous image"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span class="bg-black bg-opacity-50 text-white text-xs font-medium px-2 py-1.5 rounded-lg select-none">
                    {{ currentImageIndex + 1 }}/{{ totalImageCount }}
                  </span>
                  <button
                    @click="navigateToImage(1)"
                    :disabled="!canNavigateNext"
                    class="bg-black bg-opacity-50 hover:bg-opacity-70 disabled:bg-opacity-30 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-all duration-200"
                    title="Next image"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <!-- Zoom Indicator (only in fullscreen) -->
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
                  crossorigin="anonymous"
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
                  :magic-wand-selection="magicWandSelection"
                  :show-hold-overlay="false"
                  :is-showing-only-one-problem="boulderProblemsStore.isShowingOnlyOneProblem"
                  :isolated-problem="boulderProblemsStore.isolatedProblem"
                  :filtered-problems="[]"
                  :location-id="String(route.params.locationId)"
                  :image-id="currentImage?.id"
                  :image-url="imageUrl"
                  :boulder-hold-selection-tool="boulderHoldSelectionTool"
                  :magic-wand-mode="magicWandMode"
                  :highlighted-hold-ids="highlightedHoldIds"
                  :highlight-color="highlightColor"
                  :used-cluster-hold-ids="usedClusterHoldIds"
                  @hold-click="handleHoldClick"
                  @hold-hover="handleHoldHover"
                  @tool-selection-change="handleToolSelectionChange"
                  @delete-hold="handleDeleteHold"
                  @crop-complete="handleCropComplete"
                  @magic-wand-mode-change="(mode) => magicWandMode = mode"
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
                </div><!-- end: image content wrapper -->

                <!-- Fullscreen Boulder Problems + Draft Problems -->
                <div
                  v-if="isFullscreen && route.params.locationId"
                  :class="mobilePanelTab === 'info'
                    ? 'md:hidden absolute inset-0 overflow-y-auto z-10 bg-white'
                    : 'hidden md:block'"
                >
                  <BoulderProblemsManager
                    key="fullscreen-manager"
                    v-bind="boulderProblemsManagerProps"
                    v-model:model-value-problem-name="sharedProblemName"
                    v-model:model-value-selected-grade="sharedSelectedGrade"
                    v-model:model-value-problem-color="sharedProblemColor"
                    :is-fullscreen="mobilePanelTab === 'image'"
                    v-on="boulderProblemsManagerEvents"
                  >
                    <!-- Draft Problems (fullscreen, compact) -->
                    <template v-if="route.query.imageId && serverStore.hasResults">
                      <hr class="border-gray-200" />
                      <div class="p-4">
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="text-xs font-semibold text-gray-900">Draft Problems</h3>
                          <button
                            v-if="draftState.clusters"
                            @click="fetchDrafts"
                            :disabled="draftState.loading"
                            title="Re-fetch drafts"
                            class="text-gray-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
                          >
                            <svg
                              class="w-3.5 h-3.5"
                              :class="draftState.loading ? 'animate-spin' : ''"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>

                        <!-- Initial fetch button -->
                        <button
                          v-if="!draftState.clusters"
                          @click="fetchDrafts"
                          :disabled="draftState.loading"
                          class="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <div
                            v-if="draftState.loading"
                            class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
                          ></div>
                          <span>{{ draftState.loading ? 'Clustering...' : 'Fetch Drafts' }}</span>
                        </button>

                        <div v-if="draftState.error" class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                          {{ draftState.error }}
                        </div>

                        <div v-if="draftState.clusters" class="space-y-1">

                          <div
                            v-for="cluster in sortedDraftClusters"
                            :key="cluster.clusterId"
                            @click="toggleDraftCluster(cluster.clusterId)"
                            class="flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition-colors text-xs"
                            :class="selectedDraftClusterId === cluster.clusterId
                              ? 'bg-indigo-50 border-indigo-300'
                              : 'bg-gray-50 border-gray-100 hover:bg-gray-100'"
                          >
                            <div class="flex items-center space-x-1.5">
                              <div
                                class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                :style="{ backgroundColor: cluster.dominantColor || clusterColor(cluster.clusterId) }"
                              >
                                {{ cluster.clusterId }}
                              </div>
                              <span class="text-gray-700">{{ cluster.holdIds.length }}</span>
                              <span v-if="cluster.colorName" class="font-medium text-gray-500 capitalize">
                                {{ cluster.colorName }}
                              </span>
                              <span class="text-green-600" v-if="cluster.unusedCount > 0">
                                {{ cluster.unusedCount }} new
                              </span>
                            </div>
                            <button
                              @click.stop="useDraftCluster(cluster)"
                              class="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Use
                            </button>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Crop Holds (fullscreen) -->
                    <template v-if="serverStore.hasResults && !boulderProblemsStore.isCreatingProblem && !editingState.isEditing">
                      <hr class="border-gray-200" />
                      <div class="p-4 space-y-3">
                        <button
                          @click="toggleCropMode"
                          :class="[
                            'w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                            serverStore.isCropMode
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'border border-rose-500 text-rose-700 hover:bg-rose-50',
                          ]"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span>{{ serverStore.isCropMode ? 'Crop Mode ON' : 'Crop Holds' }}</span>
                        </button>
                      </div>
                    </template>
                  </BoulderProblemsManager>
                  <!-- Spacer so content scrolls above the fixed tab bar -->
                  <div class="mobile-scroll-spacer" aria-hidden="true"></div>
                </div>

                <!-- Mobile toggle FAB (fullscreen mode only) -->
                <button
                  v-if="isFullscreen"
                  @click="mobilePanelTab = mobilePanelTab === 'image' ? 'info' : 'image'"
                  class="mobile-toggle-fab md:hidden"
                  :title="mobilePanelTab === 'image' ? 'Show problems' : 'Show image'"
                >
                  <!-- Show problems icon when on image tab -->
                  <svg v-if="mobilePanelTab === 'image'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <!-- Show image icon when on info tab -->
                  <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex flex-col sm:flex-row gap-3">
                <!-- Info: Detection is automatic -->
                <div
                  v-if="!serverStore.hasResults"
                  class="flex-1 px-6 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center justify-center space-x-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-sm">Detection happens automatically when image is uploaded. Refresh page if holds don't appear.</span>
                </div>

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
                  <span>{{ magicWandActive ? `Magic Wand ON (${magicWandMode === 'local' ? 'Local' : 'Server'})` : 'Magic Wand' }}</span>
                </button>

                <!-- Mark Volume Button -->
                <button
                  v-if="serverStore.hasResults && !boulderProblemsStore.isCreatingProblem && !editingState.isEditing"
                  @click="toggleVolumeMode"
                  :class="[
                    'px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                    serverStore.isVolumeMode
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'border border-amber-500 text-amber-700 hover:bg-amber-50',
                  ]"
                  title="Mark Volume: Click a hold to toggle it as a volume"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span>{{ serverStore.isVolumeMode ? "Volume Mode ON" : "Mark Volume" }}</span>
                </button>

                <!-- Crop Holds Button -->
                <button
                  v-if="serverStore.hasResults && !boulderProblemsStore.isCreatingProblem && !editingState.isEditing"
                  @click="toggleCropMode"
                  :class="[
                    'px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                    serverStore.isCropMode
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'border border-rose-500 text-rose-700 hover:bg-rose-50',
                  ]"
                  title="Crop Holds: Draw area to keep, deletes all holds outside"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <span>{{ serverStore.isCropMode ? "Crop Mode ON" : "Crop Holds" }}</span>
                </button>
              </div>

              <!-- How It Works -->
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
                    <span>How Automatic Detection Works</span>
                    <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">
                      Automatic
                    </span>
                  </summary>

                  <div class="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <!-- Explanation -->
                    <div class="text-sm text-gray-700 space-y-2">
                      <p><strong>✨ Detection happens automatically when you upload a location image.</strong></p>
                      <p class="text-sm">Just upload an image and holds will appear within a few seconds. If they don't show up, try refreshing the page.</p>
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
          <!-- Boulder Problems + Draft Problems -->
          <div v-if="!isFullscreen && route.params.locationId">
            <BoulderProblemsManager
              key="normal-manager"
              v-bind="boulderProblemsManagerProps"
              v-model:model-value-problem-name="sharedProblemName"
              v-model:model-value-selected-grade="sharedSelectedGrade"
              v-model:model-value-problem-color="sharedProblemColor"
              :is-fullscreen="false"
              v-on="boulderProblemsManagerEvents"
            >
              <!-- Draft Problems (slot content inside BoulderProblemsManager card) -->
              <template v-if="route.query.imageId && serverStore.hasResults">
                <hr class="border-gray-200" />
                <div class="p-6">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-900">Draft Problems</h3>
                    <button
                      v-if="draftState.clusters"
                      @click="fetchDrafts"
                      :disabled="draftState.loading"
                      title="Re-fetch drafts"
                      class="text-gray-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
                    >
                      <svg
                        class="w-4 h-4"
                        :class="draftState.loading ? 'animate-spin' : ''"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  <!-- Initial fetch button (shown only before first fetch) -->
                  <button
                    v-if="!draftState.clusters"
                    @click="fetchDrafts"
                    :disabled="draftState.loading"
                    class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <div
                      v-if="draftState.loading"
                      class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{{ draftState.loading ? 'Clustering...' : 'Fetch Drafts' }}</span>
                  </button>

                  <!-- Error -->
                  <div v-if="draftState.error" class="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {{ draftState.error }}
                  </div>

                  <!-- Results -->
                  <div v-if="draftState.clusters" class="space-y-2">

                    <!-- Cluster list -->
                    <div
                      v-for="cluster in sortedDraftClusters"
                      :key="cluster.clusterId"
                      @click="toggleDraftCluster(cluster.clusterId)"
                      class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors"
                      :class="selectedDraftClusterId === cluster.clusterId
                        ? 'bg-indigo-50 border-indigo-300'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'"
                    >
                      <div class="flex items-center space-x-2">
                        <div
                          class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          :style="{ backgroundColor: cluster.dominantColor || clusterColor(cluster.clusterId) }"
                        >
                          {{ cluster.clusterId }}
                        </div>
                        <span class="text-sm text-gray-700">
                          {{ cluster.holdIds.length }} holds
                        </span>
                        <span v-if="cluster.colorName" class="text-xs font-medium text-gray-500 capitalize">
                          {{ cluster.colorName }}
                        </span>
                        <span class="text-xs text-green-600" v-if="cluster.unusedCount > 0">
                          {{ cluster.unusedCount }} new
                        </span>
                        <span class="text-xs text-gray-400" v-if="cluster.usedCount > 0">
                          {{ cluster.usedCount }} used
                        </span>
                      </div>
                      <button
                        @click.stop="useDraftCluster(cluster)"
                        class="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </BoulderProblemsManager>
          </div>

          <!-- Processing Status -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Processing Status</h3>

              <div class="space-y-4">
                <!-- Detection Mode -->
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Detection Mode</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span class="text-sm font-medium text-blue-600">
                      Automatic (Cloud Function)
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
            v-if="magicWandActive"
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
              <!-- Mode toggle -->
              <div class="flex items-center rounded-lg border border-purple-200 overflow-hidden text-sm mb-4">
                <button
                  @click="magicWandMode = 'local'"
                  :class="[
                    'flex-1 px-3 py-2 font-medium transition-colors',
                    magicWandMode === 'local' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50',
                  ]"
                  title="Local: colour + proximity algorithm runs in the browser, no server needed"
                >🖥 Local</button>
                <button
                  @click="magicWandMode = 'server'"
                  :class="[
                    'flex-1 px-3 py-2 font-medium transition-colors',
                    magicWandMode === 'server' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50',
                  ]"
                  title="Server: calls the AI detection server"
                >🤖 Server</button>
              </div>

              <!-- Loading state -->
              <div v-if="magicWandLoading" class="flex items-center space-x-2 text-purple-600">
                <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span class="text-sm">Finding similar holds...</span>
              </div>
              <!-- Results -->
              <div v-else-if="magicWandSelection.stats" class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Selected:</span>
                  <span class="text-sm font-medium text-purple-900">
                    {{ magicWandSelection.selectedHoldIds.length }} holds
                  </span>
                </div>
                <div v-if="magicWandSelection.dominantColor" class="flex items-center justify-between">
                  <span class="text-purple-600">Color:</span>
                  <span class="flex items-center space-x-2">
                    <span class="w-4 h-4 rounded-full border" :style="{ backgroundColor: magicWandSelection.dominantColor }" />
                    <span class="text-sm font-medium text-purple-900">{{ hexToColorName(magicWandSelection.dominantColor) }}</span>
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-purple-600">Similarity cutoff:</span>
                  <span class="text-sm font-medium text-purple-900">
                    {{ magicWandSelection.stats.cutoff?.toFixed(2) }}
                  </span>
                </div>
                <!-- Use as Problem button -->
                <button
                  @click="useMagicWandSelection"
                  class="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Use as Problem ({{ magicWandSelection.selectedHoldIds.length }} holds)
                </button>
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
      :location-id="locationId"
      :linking-problem-id="(route.query.linkingProblemId as string) || null"
      :linking-problem-name="(route.query.linkingProblemName as string) || ''"
      :linking-source-on-current-image="linkingSourceOnCurrentImage"
      @edit="handleFloatingCardEdit"
      @link="handleFloatingCardLink"
      @unlink="handleFloatingCardUnlink"
      @confirm-link="handleFloatingCardConfirmLink"
      @toggle-visibility="handleFloatingCardToggleVisibility"
      @mouse-enter="handleFloatingCardMouseEnter"
      @mouse-leave="handleFloatingCardMouseLeave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { orderImagesBySectionOf } from '../utils/imageOrdering';
import { useHoldDetectionServerStore } from '@/stores/holdDetectionServerStore.js';
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore.js';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore.js';
import { locationService } from '@/services/locationService';
import InteractiveHoldOverlay from '@/components/InteractiveHoldOverlay.vue';
import BoulderProblemsManager from '@/components/BoulderProblemsManager.vue';
import FloatingBoulderProblemCard from '@/components/FloatingBoulderProblemCard.vue';
import { ensureHoldHasSvgMarkup } from '@/utils/svgUtils.js';
import { hexToColorName, precomputeHoldHues } from '@/utils/colorUtils.js';
import { performMagicWandSelection } from '@/utils/magicWandUtils.js';
import { getHoldDetectionServerUrl } from '@/services/appConfigService';
// Note: Not using getResizedImageUrl - we load original images to match detection coordinates

// TypeScript component - basic type annotations without complex interface definitions

const route = useRoute();
const router = useRouter();
const serverStore = useHoldDetectionServerStore();
const persistenceStore = useHoldDetectionPersistenceStore();
const boulderProblemsStore = useBoulderProblemsStore();

// Get locationId from route params
const locationId = computed(() => {
  const id = route.params.locationId;
  return Array.isArray(id) ? id[0] : id;
});

// Reactive state
// References
const climbingImage = ref(null); // TODO: Add proper image type
const imageContainer = ref(null);
const interactiveOverlay = ref(null); // TODO: Add component type
const imageLoaded = ref(false);
const currentImage = ref(null); // TODO: Add proper image type
const imageLoadError = ref(null);
const locationImages = ref([]); // Images in same routesetting as current image, ordered by section
const locationData = ref(null); // Full location object (for section-based nav ordering)

// Fullscreen state (pseudo-fullscreen using CSS, not native API)
const isFullscreen = ref(false)
const mobilePanelTab = ref('image') // 'image' | 'info' - mobile tab toggle in fullscreen

// Shared state for boulder problem form (persists across fullscreen toggle)
const sharedProblemName = ref('');
const sharedSelectedGrade = ref('');
const sharedProblemColor = ref('#ffffff');

// Hold interaction state
const hoveredProblemId = ref(null);


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

// Draft problems (cluster API) state
const draftState = ref({
  loading: false,
  error: null,
  clusters: null,
  k: null,
  silhouette: null,
});

const CLUSTER_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#10b981',
  '#d946ef',
];

const clusterColor = (clusterId) => CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];

const selectedDraftClusterId = ref(null);
const showUnassigned = ref(false);

// Frontend magic wand — runs the local color+proximity algorithm
const callFeMagicWand = async (hold) => {
  const aiHolds = serverStore.results?.holds || [];
  const manualHolds = serverStore.manualHolds || [];
  const allHolds = [...aiHolds, ...manualHolds];
  const hueMap = climbingImage.value
    ? await precomputeHoldHues(climbingImage.value, allHolds)
    : null;
  const result = performMagicWandSelection(hold.id, allHolds, 30, 500, hueMap);
  if (!result.success) throw new Error('FE magic wand failed');
  return {
    holdIds: result.selectedHoldIds,
    dominantColor: null,
    selectedCount: result.selectedHoldIds.length,
    cutoffSimilarity: result.stats?.maxColorDistance ?? null,
  };
};

// Server magic wand call
const callServerMagicWand = async (holdId) => {
  const imageId = route.query.imageId;
  if (!imageId || !holdId) return null;
  const baseUrl = await getHoldDetectionServerUrl();
  const res = await fetch(`${baseUrl}/cluster/magic-wand`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ imageId, holdId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return await res.json();
};

// Helper: add holds by IDs to a target problem
const addHoldsByIds = (holdIds, targetProblem) => {
  const aiHolds = serverStore.results?.holds || [];
  for (const holdId of holdIds) {
    const holdIndex = aiHolds.findIndex(h => h.id === holdId);
    const hold = aiHolds[holdIndex];
    if (!hold) continue;
    let enhancedHold = ensureHoldHasSvgMarkup(hold);
    if (serverStore.results?.svg_markups?.[holdIndex]) {
      enhancedHold = { ...enhancedHold, svgMarkup: serverStore.results.svg_markups[holdIndex] };
    }
    enhancedHold.detectionSource = hold.pathPoints ? 'manual' : 'server';
    boulderProblemsStore.addHoldToProblem(targetProblem.id, enhancedHold);
  }
};

const selectedDraftCluster = computed(() => {
  if (selectedDraftClusterId.value === null || !draftState.value.clusters) return null;
  return draftState.value.clusters.find(c => c.clusterId === selectedDraftClusterId.value) || null;
});

// All hold IDs (AI + manual)
const allHoldIds = computed(() => {
  const aiHolds = serverStore.results?.holds || [];
  const manual = serverStore.manualHolds || [];
  return [...aiHolds.map(h => h.id), ...manual.map(h => h.id)];
});

// Set of holdIds already used in any boulder problem for this image
const usedHoldIds = computed(() => {
  const ids = new Set();
  for (const problem of boulderProblemsStore.sortedProblems) {
    for (const h of problem.holds || []) {
      ids.add(h.holdId);
    }
  }
  return ids;
});

// Unassigned holds: all holds not used by any problem
const unassignedHoldIds = computed(() => {
  return allHoldIds.value.filter(id => !usedHoldIds.value.has(id));
});

const unassignedCount = computed(() => unassignedHoldIds.value.length);

// Highlight: draft cluster selection takes priority, then unassigned toggle
const highlightedHoldIds = computed(() => {
  if (selectedDraftCluster.value) return selectedDraftCluster.value.holdIds;
  if (showUnassigned.value) return unassignedHoldIds.value;
  return [];
});
// Already-used holds within the selected cluster (shown grey)
const usedClusterHoldIds = computed(() => {
  if (!selectedDraftCluster.value) return [];
  return selectedDraftCluster.value.holdIds.filter(id => usedHoldIds.value.has(id));
});
const highlightColor = computed(() => {
  if (selectedDraftClusterId.value !== null) return clusterColor(selectedDraftClusterId.value);
  if (showUnassigned.value) return '#f59e0b'; // amber for unassigned
  return '#3b82f6';
});

const toggleShowUnassigned = () => {
  showUnassigned.value = !showUnassigned.value;
  // Clear draft cluster selection when toggling unassigned
  if (showUnassigned.value) selectedDraftClusterId.value = null;
};

// Clusters enriched with used/unused counts + color name from API hex, sorted by most unused
const sortedDraftClusters = computed(() => {
  if (!draftState.value.clusters) return [];
  return draftState.value.clusters
    .map(cluster => {
      const used = cluster.holdIds.filter(id => usedHoldIds.value.has(id)).length;
      const colorName = hexToColorName(cluster.dominantColor);
      return { ...cluster, usedCount: used, unusedCount: cluster.holdIds.length - used, colorName };
    })
    .sort((a, b) => b.unusedCount - a.unusedCount);
});

const toggleDraftCluster = (clusterId) => {
  selectedDraftClusterId.value = selectedDraftClusterId.value === clusterId ? null : clusterId;
  if (selectedDraftClusterId.value !== null) showUnassigned.value = false;
};

const useDraftCluster = async (cluster) => {
  // Cancel any in-progress creation first
  if (boulderProblemsStore.isCreatingProblem) {
    boulderProblemsStore.cancelCreatingProblem();
  }
  showUnassigned.value = false;

  const color = cluster.dominantColor || clusterColor(cluster.clusterId);
  const name = cluster.colorName
    ? `${cluster.colorName.charAt(0).toUpperCase() + cluster.colorName.slice(1)}`
    : `Draft ${cluster.clusterId}`;
  sharedProblemName.value = name;
  const defaultGrade = boulderProblemsStore.grades[0] || null;
  sharedSelectedGrade.value = defaultGrade || '';
  boulderProblemsStore.createNewProblem(defaultGrade, name, color);

  const problem = boulderProblemsStore.activeProblem;
  if (!problem) return;

  const newHoldIds = cluster.holdIds.filter(id => !usedHoldIds.value.has(id));
  addHoldsByIds(newHoldIds, problem);

  selectedDraftClusterId.value = null;
};

const fetchDrafts = async () => {
  const imageId = route.query.imageId;
  if (!imageId) return;

  draftState.value.loading = true;
  draftState.value.error = null;
  selectedDraftClusterId.value = null;

  try {
    const baseUrl = await getHoldDetectionServerUrl();
    const res = await fetch(`${baseUrl}/cluster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ imageId }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = await res.json();
    draftState.value.clusters = data.clusters;
    draftState.value.k = data.k;
    draftState.value.silhouette = data.silhouette;
  } catch (err) {
    draftState.value.error = err.message;
  } finally {
    draftState.value.loading = false;
  }
};

// Success notification state
const showSuccess = ref(false);
const successMessage = ref('');

// Timeout for tooltip hiding
let tooltipHideTimeout = null;

// Boulder problem tool selection state
const boulderHoldSelectionTool = ref('single');

// Magic Wand state (global magic wand for standalone use)
const magicWandActive = ref(false);
const magicWandMode = ref('server'); // 'server' | 'local'
const magicWandLoading = ref(false);
const magicWandSelection = ref({
  selectedHoldIds: [], // Array of hold IDs (string IDs from server)
  targetHoldId: null,
  dominantColor: null,
  stats: null,
});
// Track holds added by last magic wand click in boulder mode so we can replace them
const lastMagicWandBoulderHoldIds = ref([]);

// Dynamic image loading based on query parameters
const imageUrl = computed(() => {
  if (currentImage.value) {
    return currentImage.value.url;
  }
  // Fallback to hardcoded image if no query parameter
  return '/topos/wibrem-23-may/WhatsApp Image 2025-05-24 at 00.15.17.jpeg';
});

// Debug: Reactive computed to track API health changes
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
  unassignedCount: unassignedCount.value,
  showingUnassigned: showUnassigned.value,
}));

// Methods
const onImageLoad = () => {
  imageLoaded.value = true;

  // Image loaded - ready for interactions
};

// Pseudo-fullscreen toggle (CSS-based, not native API)
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  
  if (isFullscreen.value) {
    // Prevent body scroll when in fullscreen
    document.body.style.overflow = 'hidden';
  } else {
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Legacy function - kept for manual testing via console if needed
// eslint-disable-next-line no-unused-vars
const testApiHealth = async () => {
  const result = await serverStore.testApiHealth();

  if (result.success) {
    console.log('✅ API health check passed');
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
const clearMagicWandSelection = () => {
  magicWandSelection.value = {
    selectedHoldIds: [],
    targetHoldId: null,
    dominantColor: null,
    stats: null,
  };
  lastMagicWandBoulderHoldIds.value = [];
};

const toggleMagicWand = () => {
  magicWandActive.value = !magicWandActive.value;
  clearMagicWandSelection();
};

// Use the current magic wand selection as a new boulder problem
const useMagicWandSelection = async () => {
  const sel = magicWandSelection.value;
  if (!sel.selectedHoldIds.length) return;

  // Cancel any in-progress creation first
  if (boulderProblemsStore.isCreatingProblem) {
    boulderProblemsStore.cancelCreatingProblem();
  }

  const color = sel.dominantColor || '#a855f7';
  const name = sel.dominantColor
    ? hexToColorName(sel.dominantColor).charAt(0).toUpperCase() + hexToColorName(sel.dominantColor).slice(1)
    : 'Magic Wand';
  sharedProblemName.value = name;
  const defaultGrade = boulderProblemsStore.grades[0] || null;
  sharedSelectedGrade.value = defaultGrade || '';
  boulderProblemsStore.createNewProblem(defaultGrade, name, color);

  const problem = boulderProblemsStore.activeProblem;
  if (!problem) return;

  addHoldsByIds(sel.selectedHoldIds, problem);

  // Deactivate magic wand after using
  magicWandActive.value = false;
  clearMagicWandSelection();
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
    // Disable volume mode
    serverStore.setVolumeMode(false);
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
    // Disable volume mode
    serverStore.setVolumeMode(false);
    // Load existing manual holds for this image
    serverStore.loadManualHolds(route.params.locationId, route.query.imageId);
  } else {
    // Save manual holds when exiting delete mode
    serverStore.saveManualHolds(route.params.locationId, route.query.imageId, imageUrl.value);
  }
};

const toggleVolumeMode = () => {
  const newVolumeMode = !serverStore.isVolumeMode;
  serverStore.setVolumeMode(newVolumeMode);

  if (newVolumeMode) {
    // Disable other modes
    if (magicWandActive.value) {
      toggleMagicWand();
    }
    serverStore.setDeleteMode(false);
    serverStore.setDrawingMode(false);
  }
};

const toggleCropMode = () => {
  const newCropMode = !serverStore.isCropMode;
  serverStore.setCropMode(newCropMode);

  if (newCropMode) {
    if (magicWandActive.value) {
      toggleMagicWand();
    }
    serverStore.setDeleteMode(false);
    serverStore.setDrawingMode(false);
    serverStore.setVolumeMode(false);
  }
};

// Point-in-polygon using ray casting algorithm
const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const handleCropComplete = async (cropPolygon) => {
  serverStore.setCropMode(false);

  const allHolds = serverStore.results?.holds || [];
  const manualHolds = serverStore.manualHolds || [];

  // Determine which holds are inside the crop polygon
  const holdsInside = [];
  const holdsOutside = [];

  for (const hold of allHolds) {
    const center = {
      x: hold.x + hold.width / 2,
      y: hold.y + hold.height / 2,
    };
    if (isPointInPolygon(center, cropPolygon)) {
      holdsInside.push(hold.id);
    } else {
      holdsOutside.push(hold.id);
    }
  }

  for (const hold of manualHolds) {
    const center = {
      x: hold.x + hold.width / 2,
      y: hold.y + hold.height / 2,
    };
    if (isPointInPolygon(center, cropPolygon)) {
      holdsInside.push(hold.id);
    } else {
      holdsOutside.push(hold.id);
    }
  }

  if (holdsOutside.length === 0) {
    alert('All holds are inside the crop area. Nothing to remove.');
    return;
  }

  const confirmed = confirm(
    `Crop holds?\n\nKeep: ${holdsInside.length} holds inside the selection\nRemove: ${holdsOutside.length} holds outside the selection\n\nThis cannot be undone.`
  );

  if (!confirmed) return;

  await serverStore.cropHolds(
    holdsInside,
    route.params.locationId,
    route.query.imageId,
  );
};

// ============================================================================
// LEGACY: Manual Detection Functions (kept for admin/testing - not used in normal flow)
// Detection now happens automatically via Cloud Function when image is uploaded
// ============================================================================

// eslint-disable-next-line no-unused-vars
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
    // SimpleHold already has correct structure from holdDetectionUtils.ts
    const aiHolds = (serverStore.results?.holds || []).map((hold, index) => ({
      // KEEP server ID - critical for stable references
      id: hold.id,
      source: 'ai-detected',
      // Top-left corner (from bbox)
      x: hold.x,
      y: hold.y,
      // Center points (from server, already in SimpleHold)
      centerX: hold.centerX,
      centerY: hold.centerY,
      // Dimensions
      width: hold.width,
      height: hold.height,
      // Detection metadata
      confidence: hold.confidence,
      holdType: hold.type,
      svgMarkup: serverStore.results?.svg_markups?.[index] || '',
      // Timestamps
      addedAt: new Date()
    }));

    // Calculate viewBox from image dimensions
    const imageElement = climbingImage.value;
    
    console.log('\n🖼️  STEP 2: IMAGE ELEMENT ANALYSIS');
    console.log('─────────────────────────────────────');
    if (imageElement) {
      console.log(`   - Image element exists: YES`);
      console.log(`   - naturalWidth: ${imageElement.naturalWidth}`);
      console.log(`   - naturalHeight: ${imageElement.naturalHeight}`);
      console.log(`   - displayWidth: ${imageElement.clientWidth}`);
      console.log(`   - displayHeight: ${imageElement.clientHeight}`);
    } else {
      console.log(`   - Image element exists: NO`);
    }
    
    // CRITICAL: Check if SVG markup uses a different viewBox than the natural image
    // Parse the first SVG markup to extract its viewBox if present
    console.log('\n📐 STEP 3: SVG VIEWBOX DETECTION');
    console.log('─────────────────────────────────────');
    let svgViewBox = null;
    if (serverStore.results?.svg_markups?.[0]) {
      const firstMarkup = serverStore.results.svg_markups[0];
      console.log(`   - First SVG markup length: ${firstMarkup.length} chars`);
      
      const viewBoxMatch = firstMarkup.match(/viewBox=["']([^"']+)["']/);
      if (viewBoxMatch) {
        svgViewBox = viewBoxMatch[1];
        const parts = svgViewBox.split(' ');
        console.log(`   - ✅ Found viewBox in SVG: "${svgViewBox}"`);
        console.log(`   - viewBox dimensions: ${parts[2]} x ${parts[3]}`);
      } else {
        console.log(`   - ❌ No viewBox attribute found in SVG markup`);
        console.log(`   - SVG start: ${firstMarkup.substring(0, 200)}`);
      }
    } else {
      console.log(`   - ❌ No SVG markups available`);
    }
    
    // Use SVG viewBox if found, otherwise use natural dimensions
    const viewBox = svgViewBox || 
      (imageElement ? `0 0 ${imageElement.naturalWidth} ${imageElement.naturalHeight}` : '0 0 1920 1080');
    
    console.log('\n� STEP 4: METADATA TO BE SAVED TO FIRESTORE');
    console.log('─────────────────────────────────────');
    console.log(`   - viewBox: "${viewBox}"`);
    console.log(`   - imageDimensions.width: ${imageElement?.naturalWidth || 1920}`);
    console.log(`   - imageDimensions.height: ${imageElement?.naturalHeight || 1080}`);
    console.log(`   - Using server SVG viewBox: ${!!svgViewBox ? 'YES ✅' : 'NO ❌'}`);
    
    const viewBoxParts = viewBox.split(' ');
    const viewBoxWidth = parseFloat(viewBoxParts[2]);
    const viewBoxHeight = parseFloat(viewBoxParts[3]);
    const actualWidth = imageElement?.naturalWidth || 1920;
    const actualHeight = imageElement?.naturalHeight || 1080;
    
    console.log('\n🔢 STEP 5: COORDINATE SYSTEM ANALYSIS');
    console.log('─────────────────────────────────────');
    console.log(`   - viewBox dimensions: ${viewBoxWidth} x ${viewBoxHeight}`);
    console.log(`   - actual (natural) dimensions: ${actualWidth} x ${actualHeight}`);
    console.log(`   - Scale factor X: ${actualWidth / viewBoxWidth} (actual/viewBox)`);
    console.log(`   - Scale factor Y: ${actualHeight / viewBoxHeight} (actual/viewBox)`);
    
    if (viewBoxWidth === actualWidth && viewBoxHeight === actualHeight) {
      console.log(`   ⚠️  WARNING: viewBox === actualDimensions`);
      console.log(`   ⚠️  This means NO coordinate conversion will happen!`);
      console.log(`   ⚠️  Hold coordinates are ALREADY in natural image space`);
    } else {
      console.log(`   ✅ viewBox ≠ actualDimensions`);
      console.log(`   ✅ Hold coordinates WILL be converted from viewBox to natural`);
    }
    
    console.log('\n📊 STEP 6: SAMPLE HOLD COORDINATE VERIFICATION');
    console.log('─────────────────────────────────────');
    if (aiHolds.length > 0) {
      const sampleHold = aiHolds[0];
      console.log(`   Sample: ${sampleHold.id}`);
      console.log(`   - Saved center coordinates: (${sampleHold.x.toFixed(1)}, ${sampleHold.y.toFixed(1)})`);
      console.log(`   - These coordinates are in: ${svgViewBox ? 'SVG viewBox space' : 'Natural image space'}`);
      console.log(`   - When loaded by VideoFrameMatcherEnhanced, they will be:`);
      if (svgViewBox && viewBoxWidth !== actualWidth) {
        const convertedX = sampleHold.x * (actualWidth / viewBoxWidth);
        const convertedY = sampleHold.y * (actualHeight / viewBoxHeight);
        console.log(`     → Converted to: (${convertedX.toFixed(1)}, ${convertedY.toFixed(1)}) in natural space`);
      } else {
        console.log(`     → Used as-is: (${sampleHold.x.toFixed(1)}, ${sampleHold.y.toFixed(1)}) (already natural)`);
      }
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

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

    // Reload detection results to get the saved data with IDs
    await serverStore.loadDetectionResults(route.params.locationId, currentImage.value.id);
    
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
const handleHoldClick = (hold, holdIndex, forceReassign = false) => {

  // Check if we're in boulder creation/editing mode
  const isBoulderMode = boulderProblemsStore.isCreatingProblem || editingState.value.isEditing;

  // Priority 1: Boulder creation/editing with magic wand tool
  if (isBoulderMode && boulderHoldSelectionTool.value === 'magic-wand') {
    // Determine which problem we're working with
    let targetProblem = null;
    if (boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem) {
      targetProblem = boulderProblemsStore.activeProblem;
    } else if (editingState.value.isEditing && editingState.value.editingProblem) {
      targetProblem = editingState.value.editingProblem;
    }
    if (!targetProblem) return;

    // Remove holds from previous magic wand click before adding new ones
    for (const prevId of lastMagicWandBoulderHoldIds.value) {
      boulderProblemsStore.removeHoldFromProblem(targetProblem.id, prevId);
    }
    lastMagicWandBoulderHoldIds.value = [];

    // Call magic wand (local or server depending on mode)
    magicWandLoading.value = true;
    const wandCall = magicWandMode.value === 'local'
      ? Promise.resolve(callFeMagicWand(hold))
      : callServerMagicWand(hold.id);
    wandCall.then((result) => {
      if (result && result.holdIds) {
        addHoldsByIds(result.holdIds, targetProblem);
        lastMagicWandBoulderHoldIds.value = result.holdIds;
      }
    }).catch((err) => {
      console.error('Magic wand failed:', err);
    }).finally(() => {
      magicWandLoading.value = false;
    });

    return;
  }

  // Priority 2: Volume mode - toggle volume flag on the hold
  if (serverStore.isVolumeMode) {
    serverStore.toggleHoldVolume(hold, route.params.locationId, route.query.imageId);
    return;
  }

  // Priority 3: Standalone Magic Wand functionality (when not in boulder mode)
  if (!isBoulderMode && magicWandActive.value) {
    magicWandLoading.value = true;
    const wandCall = magicWandMode.value === 'local'
      ? Promise.resolve(callFeMagicWand(hold))
      : callServerMagicWand(hold.id);
    wandCall.then((result) => {
      if (result && result.holdIds) {
        magicWandSelection.value = {
          selectedHoldIds: result.holdIds,
          targetHoldId: hold.id,
          dominantColor: result.dominantColor,
          stats: {
            selected: result.selectedCount,
            cutoff: result.cutoffSimilarity,
          },
        };
      }
    }).catch((err) => {
      console.error('Magic wand failed:', err);
    }).finally(() => {
      magicWandLoading.value = false;
    });

    return;
  }

  // Priority 4: Normal boulder creation/editing (single hold selection)
  if (isBoulderMode) {
    // Normal hold selection logic for boulder problems

    // Check if hold is already assigned to another problem (using hold ID)
    const existingProblem = boulderProblemsStore.sortedProblems.find((problem) =>
      problem.holds?.some((h) => h.holdId === hold.id)
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

    // If hold belongs to a different problem than the one being worked on, block or force-reassign
    if (existingProblem && existingProblem.id !== targetProblem.id) {
      if (forceReassign) {
        boulderProblemsStore.removeHoldFromProblem(existingProblem.id, hold.id);
      } else {
        console.warn(`⚠️ Hold ${holdIndex} is already part of problem #${existingProblem.id}`);
        return;
      }
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

    // Add or remove hold from the target problem (uses hold.id internally)
    boulderProblemsStore.addHoldToProblem(targetProblem.id, enhancedHold);

    return; // Don't proceed with other logic when in boulder mode
  }

  // Priority 5: No special mode active - ignore click
};

// Helper function to get problem ID for a hold
const getHoldProblemId = (hold) => {
  for (const problem of boulderProblemsStore.sortedProblems) {
    const holdFound = problem.holds?.some((h) => h.holdId === hold.id);
    if (holdFound) {
      return problem.id;
    }
  }
  return null;
};

const handleHoldHover = (hold, isEntering, event) => {

  // Clear any pending hide timeout
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }

  if (isEntering && event) {
    // Find which problem this hold belongs to
    const problemId = getHoldProblemId(hold);

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
  showUnassigned.value = false;
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
    // Remove manual hold from in-memory state (will be persisted when exiting delete mode)
    serverStore.removeManualHold(hold.id);
  }
  
  // TODO: Also remove the hold from any boulder problems that might reference it
  // This would require updating problem holds arrays and adjusting hold indices
};

const handleProblemCardHover = (problem, isEntering) => {
  // Set hovered problem ID when entering, clear when leaving
  hoveredProblemId.value = isEntering ? problem.id : null;
};

// Shared events for BoulderProblemsManager (DRY principle) - defined after all functions
const boulderProblemsManagerEvents = {
  'start-editing': startEditingProblem,
  'stop-editing': stopEditingProblem,
  'tool-selection-change': handleToolSelectionChange,
  'problem-hover': handleProblemCardHover,
  'toggle-show-unassigned': toggleShowUnassigned,
};

// Load image based on query parameters
const loadImageFromQuery = async () => {
  const locationId = route.query.locationId || route.params.locationId;
  const imageId = route.query.imageId;

  if (locationId && imageId) {
    try {
      // Initialize persistence store for this location
      persistenceStore.initializeForLocation(locationId);

      // Load image data from the location service (cache the filtered list for navigation)
      if (locationImages.value.length === 0) {
        // Use the location's current routesetting (last entry = newest, same as LocationDetailView)
        // so the server-side filter matches exactly what the location detail page shows.
        const activeRoutesetting = locationData.value?.routesettings?.at(-1);
        const imageRecords = await locationService.getLocationImages(locationId, activeRoutesetting || null);
        if (Array.isArray(imageRecords)) {
          // Order by section order (same logic as FloorplanSectionDetail / location detail page)
          const sections = locationData.value?.floorplan?.sections || [];
          locationImages.value = orderImagesBySectionOf(imageId as string, sections, imageRecords);
        }
      }
      if (locationImages.value.length > 0) {
        const imageRecord = locationImages.value.find((record) => record.imageId === imageId);

        if (imageRecord) {
          currentImage.value = {
            id: imageRecord.imageId,
            url: imageRecord.downloadUrl, // Use ORIGINAL image (same as detection server analyzed)
            name: imageRecord.fileName,
          }

          // Note: Detection results are loaded in onMounted via serverStore.loadDetectionResults()
          // No need to load them here to avoid duplication

          // Load existing manual holds for this image
          await serverStore.loadManualHolds(locationId, imageId);
        } else {
          console.warn('⚠️ Image not found in location images:', imageId);
        }
      } else {
        console.warn('⚠️ No location images available');
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

// Image navigation
const currentImageIndex = computed(() => {
  if (!currentImage.value || locationImages.value.length === 0) return -1;
  return locationImages.value.findIndex(r => r.imageId === currentImage.value.id);
});

const totalImageCount = computed(() => locationImages.value.length);

const canNavigatePrev = computed(() => currentImageIndex.value > 0);
const canNavigateNext = computed(() =>
  currentImageIndex.value >= 0 && currentImageIndex.value < totalImageCount.value - 1
);

const navigateToImage = (direction) => {
  const newIndex = currentImageIndex.value + direction;
  if (newIndex < 0 || newIndex >= locationImages.value.length) return;
  const newImageId = locationImages.value[newIndex].imageId;
  router.push({ query: { ...route.query, imageId: newImageId } });
};

// Watch for route changes to load different images
watch(
  () => route.query,
  async (newQuery, oldQuery) => {
    if (newQuery.imageId !== oldQuery?.imageId && route.params.locationId) {
      // Reset state for new image
      serverStore.resetState();
      imageLoaded.value = false;
      selectedDraftClusterId.value = null;
      showUnassigned.value = false;
      draftState.value = { loading: false, error: null, clusters: null, k: null, silhouette: null };

      await loadImageFromQuery();
      await loadExistingDetectionResults();

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
    // Load detection results (AI + manual holds) from Firestore
    await serverStore.loadDetectionResults(locationId, imageId);
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

  // Load location data (once — used for grading system and section-based nav ordering)
  if (route.params.locationId) {
    try {
      const location = await locationService.getLocation(route.params.locationId);
      locationData.value = location;
      if (location && typeof location === 'object' && 'gradingSystem' in location && location.gradingSystem) {
        boulderProblemsStore.setLocationGradingSystem(location.gradingSystem);
      } else {
        boulderProblemsStore.setLocationGradingSystem(null);
      }
    } catch (error) {
      console.warn('⚠️ Error loading location data:', error);
      boulderProblemsStore.setLocationGradingSystem(null);
    }
  }

  // Load image based on query parameters
  await loadImageFromQuery();

  // Load existing detection results from Firestore if available
  await loadExistingDetectionResults();

  // Note: No API health check needed - detection is automatic via Cloud Function
  // API health check only used for manual testing (available in "How It Works" section)
});

onUnmounted(() => {
  // Restore body scroll if fullscreen was active
  if (isFullscreen.value) {
    document.body.style.overflow = '';
  }
});

// Reset mobile tab when exiting fullscreen
watch(isFullscreen, (val) => {
  if (!val) mobilePanelTab.value = 'image';
});

// Floating card event handlers
const handleFloatingCardEdit = (problem) => {
  // Use URL-based editing state management
  startEditingProblem(problem);
};

const handleFloatingCardLink = (problem: any) => {
  router.replace({
    query: {
      ...route.query,
      linkingProblemId: problem.id,
      linkingProblemName: problem.name,
    },
  });
};

const handleFloatingCardUnlink = async (problem: any) => {
  if (!confirm(`Unlink "${problem.name}" from its sibling problem?`)) return;
  try {
    await boulderProblemsStore.unlinkBoulderProblems(route.params.locationId as string, problem.id);
  } catch (err) {
    alert(`Failed to unlink problem: ${(err as Error).message || err}`);
  }
};

// True when the linking-source problem belongs to the current image's problem list
const linkingSourceOnCurrentImage = computed(() => {
  const linkingId = route.query.linkingProblemId as string | undefined;
  if (!linkingId) return false;
  return boulderProblemsStore.sortedProblems.some((p: any) => p.id === linkingId);
});

const handleFloatingCardConfirmLink = async ({ problemIdA, problemIdB, primaryId }: { problemIdA: string; problemIdB: string; primaryId: string }) => {
  try {
    await boulderProblemsStore.linkBoulderProblems(route.params.locationId as string, problemIdA, problemIdB, primaryId);
    const { linkingProblemId: _a, linkingProblemName: _b, ...rest } = route.query;
    router.replace({ query: rest });
  } catch (err) {
    alert(`Failed to link problems: ${(err as Error).message || err}`);
  }
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
/* Pseudo-fullscreen overlay (keeps browser chrome for native zoom) */
.fullscreen-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  background: black !important;
  border-radius: 0 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: auto !important;
}

.fullscreen-overlay img {
  max-width: 100vw !important;
  max-height: 100vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

/* Remove old native fullscreen styles - no longer needed */

/* Single floating toggle button - fixed bottom-right, well above any browser chrome */
.mobile-toggle-fab {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 10000;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Spacer at the bottom of the info scroll panel - well above any chrome */
.mobile-scroll-spacer {
  height: 120px;
  flex-shrink: 0;
}
</style>
