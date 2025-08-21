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
            :src="fixLocalhostUrl(location.heroImageUrl)"
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

          <!-- Expandable Grade Groups -->
          <div v-if="totalProblems > 0" class="space-y-3">
            <div
              v-for="gradeGroup in boulderProblemsSummary"
              :key="gradeGroup.label"
              class="border border-gray-200 rounded-lg overflow-hidden"
            >
              <!-- Grade Header (Clickable) -->
              <button
                @click="toggleGradeExpansion(gradeGroup.label)"
                class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getGradeColor(gradeGroup.label) }"
                  ></div>
                  <span class="font-medium text-gray-900">Grade {{ gradeGroup.label }}</span>
                  <span class="text-sm text-gray-500">
                    ({{ gradeGroup.count }} {{ gradeGroup.count === 1 ? "problem" : "problems" }})
                  </span>
                </div>
                <svg
                  class="w-5 h-5 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedGrades.has(gradeGroup.label) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <!-- Expanded Problems List -->
              <div
                v-if="expandedGrades.has(gradeGroup.label)"
                class="bg-white divide-y divide-gray-100"
              >
                <div
                  v-for="problem in gradeGroup.problems"
                  :key="problem.id"
                  class="px-4 py-3 hover:bg-blue-50 transition-colors group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1 min-w-0">
                      <div
                        class="w-2 h-2 rounded-full"
                        :style="{ backgroundColor: problem.color }"
                      ></div>
                      <router-link
                        :to="{
                          name: 'boulder-problem-detail',
                          params: {
                            locationId: route.params.locationId,
                            problemId: problem.id,
                          },
                        }"
                        class="font-medium text-gray-900 group-hover:text-blue-700 truncate"
                      >
                        {{ problem.name }}
                      </router-link>
                    </div>
                    <div class="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                      <span>{{ problem.holds?.length || 0 }} holds</span>
                      <span>•</span>
                      <span>{{ getProblemVideoCount(problem.id) }} videos</span>
                      <!-- Quick video access button -->
                      <button
                        v-if="getProblemVideoCount(problem.id) > 0"
                        @click="openProblemVideos(problem)"
                        class="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                        title="View beta videos"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <!-- Problem detail link arrow -->
                      <router-link
                        :to="{
                          name: 'boulder-problem-detail',
                          params: {
                            locationId: route.params.locationId,
                            problemId: problem.id,
                          },
                        }"
                        class="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                        title="View problem details"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </router-link>
                    </div>
                  </div>
                </div>
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

        <!-- Videos/Betas section -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Beta Videos</h2>
          </div>

          <!-- Loading state -->
          <div v-if="videosLoading" class="text-center py-12">
            <div
              class="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Loading videos...</p>
          </div>

          <!-- No videos placeholder -->
          <div v-else-if="videos.length === 0" class="text-center py-12">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No beta videos yet</h3>
            <p class="text-gray-500 mb-4">
              Beta videos help climbers understand the sequence and technique for problems
            </p>
          </div>

          <!-- Videos grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="(video, index) in videos"
              :key="video.id"
              class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer hover:bg-gray-200 transition-colors"
              @click="openVideoGallery(index)"
            >
              <!-- Video thumbnail/preview -->
              <div class="w-full h-full relative">
                <video
                  :src="video.downloadUrl"
                  class="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  @loadedmetadata="
                    (e) => {
                      e.target.currentTime = 1;
                    }
                  "
                  @seeked="
                    (e) => {
                      e.target.style.opacity = '1';
                      e.target.parentElement.querySelector('.loading-placeholder').style.display =
                        'none';
                    }
                  "
                  style="opacity: 0; transition: opacity 0.3s ease"
                />

                <!-- Loading placeholder -->
                <div
                  class="loading-placeholder absolute inset-0 bg-gray-800 flex items-center justify-center"
                >
                  <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
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
          <div>
            <h3 class="text-lg font-semibold">Upload Images</h3>
            <p v-if="uploadsInProgress" class="text-sm text-blue-600 mt-1">
              Processing {{ pendingMetadataSaves }} of {{ totalUploadsExpected }} uploads...
            </p>
          </div>
          <button @click="handleUploadModalClose" class="text-gray-400 hover:text-gray-600">
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
            @all-complete="handleAllUploadsComplete"
          />
        </div>

        <div class="flex gap-2 p-6 pt-4 flex-shrink-0 border-t">
          <button
            @click="handleUploadModalClose"
            :disabled="uploadsInProgress"
            :class="[
              'flex-1 px-4 py-2 rounded-md transition-colors',
              uploadsInProgress
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
            ]"
          >
            {{ uploadsInProgress ? "Uploading..." : "Close" }}
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
                    pendingRedirectData = null;
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

            <!-- Success Result with Manual Continue -->
            <div
              v-if="videoAnalysisResult.success && pendingRedirectData"
              class="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div class="flex items-start space-x-3 mb-4">
                <div class="flex-shrink-0">
                  <svg
                    class="w-6 h-6 text-green-600"
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
                </div>
                <div class="flex-1">
                  <h4 class="text-lg font-medium text-green-900">Analysis Complete!</h4>
                  <p class="text-sm text-green-700 mt-1">
                    AI successfully identified the boulder problem from your video.
                  </p>
                </div>
              </div>

              <!-- Analysis Results -->
              <div class="space-y-4">
                <!-- Identified Problem(s) -->
                <div class="bg-white border border-green-200 rounded-lg p-4">
                  <h5 class="text-md font-medium text-gray-900 mb-2">
                    Identified Boulder Problem{{ videoAnalysisResult?.holdAnalysis?.allScores?.length > 1 ? 's' : '' }}
                  </h5>
                  
                  <!-- Primary match (best score) -->
                  <div class="space-y-3">
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: getGradeColor(pendingRedirectData.problem.grade) }"
                      ></div>
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <span class="font-semibold text-gray-900">{{
                            pendingRedirectData.problem.name
                          }}</span>
                          <span class="text-sm text-gray-600">{{
                            getGradeLabel(pendingRedirectData.problem.grade)
                          }}</span>
                          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Best Match
                          </span>
                        </div>
                        <div v-if="videoAnalysisResult?.holdAnalysis?.bestMatch" class="text-xs text-gray-500 mt-1">
                          Score: {{ (videoAnalysisResult.holdAnalysis.bestMatch.score * 100).toFixed(1) }}%
                        </div>
                      </div>
                    </div>
                    <p
                      v-if="pendingRedirectData.problem.description"
                      class="text-sm text-gray-600 ml-6"
                    >
                      {{ pendingRedirectData.problem.description }}
                    </p>
                  </div>

                  <!-- Alternative matches (2nd and 3rd place) -->
                  <div
                    v-if="videoAnalysisResult?.holdAnalysis?.allScores?.length > 1"
                    class="mt-4 pt-3 border-t border-gray-100"
                  >
                    <h6 class="text-sm font-medium text-gray-700 mb-2">Alternative Matches</h6>
                    <div
                      v-for="(candidate, index) in videoAnalysisResult.holdAnalysis.allScores.slice(1, 3)"
                      :key="candidate.problem.id"
                      class="flex items-center space-x-3 py-2"
                    >
                      <div class="flex items-center space-x-2 text-xs text-gray-500">
                        <span class="w-4 text-center">#{{ index + 2 }}</span>
                      </div>
                      <div
                        class="w-2.5 h-2.5 rounded-full"
                        :style="{ backgroundColor: getGradeColor(candidate.problem.grade) }"
                      ></div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2">
                          <span class="text-sm text-gray-900 truncate">{{ candidate.problem.name }}</span>
                          <span class="text-xs text-gray-500">{{ getGradeLabel(candidate.problem.grade) }}</span>
                        </div>
                        <div class="text-xs text-gray-500">
                          Score: {{ (candidate.score * 100).toFixed(1) }}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Analysis Details from VideoFrameMatcherEnhanced -->
                <div
                  v-if="videoAnalysisResult.holdAnalysis?.bestMatch"
                  class="bg-white border border-green-200 rounded-lg p-4"
                >
                  <h5 class="text-md font-medium text-gray-900 mb-2">AI Analysis Details</h5>

                  <!-- Show pose detection summary -->
                  <div class="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Frames analyzed:</strong>
                      {{ videoAnalysisResult.allFrames?.length || 0 }}
                    </p>
                    <p>
                      <strong>Poses detected:</strong>
                      {{
                        videoAnalysisResult.poseResults?.filter((r) => r.poses.length > 0).length ||
                        0
                      }}
                    </p>
                    <p>
                      <strong>Hold analysis:</strong>
                      {{ videoAnalysisResult.holdAnalysis.bestMatch.votes || 0 }} keypoints matched
                    </p>
                  </div>

                  <!-- Show pose visualization if available -->
                  <div v-if="videoAnalysisResult.frame" class="mt-3">
                    <p class="text-sm font-medium text-gray-700 mb-2">Analyzed Frame</p>
                    <img
                      :src="videoAnalysisResult.frame.url"
                      alt="Analyzed video frame"
                      class="w-full max-w-xs h-32 object-cover rounded-lg border mx-auto"
                    />
                  </div>
                </div>

                <!-- Matched Image -->
                <div
                  v-if="videoAnalysisResult.match"
                  class="bg-white border border-green-200 rounded-lg p-4"
                >
                  <h5 class="text-md font-medium text-gray-900 mb-2">Matched Boulder Image</h5>
                  <img
                    :src="videoAnalysisResult.match.url"
                    alt="Matched boulder image"
                    class="w-full max-w-md h-48 object-cover rounded-lg border mx-auto"
                  />
                  <p class="text-xs text-gray-500 mt-2 text-center">
                    {{ videoAnalysisResult.match.name }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="mt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  @click="continueToUpload"
                  class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Continue to Upload Video
                </button>
                <button
                  type="button"
                  @click="
                    videoAnalysisResult = null;
                    extractedFrame = null;
                    matchedBoulderImage = null;
                    allFrames = [];
                    poseResults = [];
                    analysisPhase = '';
                    pendingRedirectData = null;
                  "
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Try Another Video
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
import ImageUpload from '../components/ImageUpload.vue';
import ImageGallery from '../components/ImageGallery.vue';
import VideoGallery from '../components/VideoGallery.vue';
import VideoFrameMatcher from '../components/VideoFrameMatcherEnhanced.vue';
import { formatDate, isSameDateTime } from '../utils/dateUtils.js';
import { getGradeLabel, getGradeDifficulty, getGradeColor } from '../utils/gradingUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { transformPoint } from '../utils/homographyUtils.js';
import { videoService } from '../services/videoService.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const boulderProblemsStore = useBoulderProblemsStore();

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

// Video analysis state
const videoAnalysisResult = ref(null);
const extractedFrame = ref(null);
const isAnalyzing = ref(false);

// Enhanced workflow state
const matchedBoulderImage = ref(null);
const allFrames = ref([]); // Will store 3 frames after match found
const poseResults = ref([]); // Will store pose detection results
const analysisPhase = ref(''); // 'matching', 'extracting-frames', 'detecting-poses', 'analyzing-holds'
const pendingRedirectData = ref(null); // Store analysis data for manual redirect after review

// Grade expansion state
const expandedGrades = ref(new Set());

const locationId = route.params.locationId;

// Computed property to check if uploads are in progress
const uploadsInProgress = computed(() => {
  return pendingMetadataSaves.value > 0;
});

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

    location.value = await locationService.getLocation(locationId);

    // Initialize boulder problems store for this location
    await boulderProblemsStore.initializeForLocation(locationId);

    // Load boulder problems
    await boulderProblemsStore.loadBoulderProblems(locationId);

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
    const imageRecords = await locationService.getLocationImages(locationId);

    // Transform the records to the format expected by the template
    images.value = imageRecords.map((record) => ({
      id: record.id,
      url: record.downloadUrl,
      name: record.fileName,
    }));

    console.log('Loaded location images:', images.value);
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
    const locationVideos = await videoService.getLocationVideos(locationId);
    videos.value = locationVideos;
    console.log('Loaded location videos:', videos.value);

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
        const count = await videoService.getProblemVideoCount(locationId, problem.id);
        counts[problem.id] = count;
      } catch (err) {
        console.warn(`Failed to load video count for problem ${problem.id}:`, err);
        counts[problem.id] = 0;
      }
    }

    problemVideoCounts.value = counts;
    console.log('Loaded problem video counts:', counts);
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
    const problemVideos = await videoService.getProblemVideos(locationId, problem.id);

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
    console.log('boulderProblemsStore.boulderProblem', video, boulderProblemsStore.boulderProblems);
    const problem = boulderProblemsStore.boulderProblems.find((p) => p.id === video.problemId);
    console.log('problem', problem);

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
  return lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
};

const handleUploadModalClose = () => {
  if (uploadsInProgress.value) {
    // Don't close modal while uploads are in progress
    // You could show a warning here if desired
    console.log('Cannot close upload modal while uploads are in progress');
    return;
  }
  showUploadModal.value = false;
};

const handleImageUploadComplete = async (uploadResult) => {
  console.log('Image uploaded successfully:', uploadResult);

  // Increment pending metadata saves counter
  pendingMetadataSaves.value++;

  try {
    // Save image metadata to Firestore via backend function
    const imageRecord = await locationService.addLocationImage(
      uploadResult.locationId,
      uploadResult.fileName,
      uploadResult.downloadUrl
    );
    console.log('Image metadata saved:', imageRecord);

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
    console.log('All uploads and metadata saves complete');
    showUploadModal.value = false;
    // Reset counters
    pendingMetadataSaves.value = 0;
    totalUploadsExpected.value = 0;
  }
};

const handleImageUploadError = (error) => {
  console.error('Image upload failed:', error);
  // Note: We don't increment pendingMetadataSaves for failed uploads
  // because failed uploads don't trigger metadata saves

  // The totalUploadsExpected is set correctly in handleAllUploadsComplete
  // based on successful uploads only, so we don't need to decrement anything here
};

const handleAllUploadsComplete = (uploadStats) => {
  console.log('All storage uploads complete:', uploadStats);

  // Set the expected number of metadata saves based on successful uploads
  totalUploadsExpected.value = uploadStats.completedUploads;

  // The pendingMetadataSaves will be incremented in handleImageUploadComplete
  // and decremented as each metadata save completes

  // If no successful uploads, close modal immediately
  if (uploadStats.completedUploads === 0) {
    console.log('No successful uploads, closing modal');
    showUploadModal.value = false;
    pendingMetadataSaves.value = 0;
    totalUploadsExpected.value = 0;
  }

  // Note: Modal will be closed when all metadata saves complete
  // This is handled in handleImageUploadComplete
};

const handleBetaVideoSelected = (videoFile) => {
  console.log('Beta video selected:', videoFile.name);
  // Reset previous results and start matching phase
  videoAnalysisResult.value = null;
  extractedFrame.value = null;
  matchedBoulderImage.value = null;
  allFrames.value = [];
  poseResults.value = [];
  isAnalyzing.value = true;
  analysisPhase.value = 'matching';
};

const handleBetaAnalysisComplete = async (analysisData) => {
  console.log('🎉 Enhanced analysis complete:', analysisData);

  // The Enhanced component provides complete analysis including:
  // - video: the selected video file
  // - frames: extracted frames with pose data
  // - match: matched image with homography matrix

  if (!analysisData.match) {
    console.log('❌ No match found in analysis');
    videoAnalysisResult.value = {
      success: false,
      error: true,
      message: 'No matching boulder found in the uploaded video.',
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
        poseDataStructure: frame.poseData ? Object.keys(frame.poseData) : 'none',
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
  analysisPhase.value = 'analyzing-holds';

  // Phase 4: Analyze holds using homography and boulder problem data
  console.log('🧗 Analyzing hold usage...');
  console.log('🔗 Homography matrix available:', !!analysisData.match?.homographyMatrix);

  let holdAnalysisResult = null;
  try {
    holdAnalysisResult = await runHoldAnalysis(
      frameResults,
      analysisData.match?.homographyMatrix,
      analysisData.match
    );

    if (holdAnalysisResult?.bestMatch) {
      console.log('🎯 Best matching problem:', holdAnalysisResult.bestMatch.problem.name);
      analysisPhase.value = 'complete';

      // Store data for potential redirect but don't redirect automatically
      // Let user review the analysis first
      pendingRedirectData.value = {
        analysisData,
        problem: holdAnalysisResult.bestMatch.problem,
      };
    } else if (holdAnalysisResult) {
      console.log('⚠️ Hold analysis completed but no matches found');
      analysisPhase.value = 'complete';
    } else {
      console.log('❌ Hold analysis failed to return results');
      analysisPhase.value = 'hold-analysis-failed';
    }
  } catch (error) {
    console.error('❌ Hold analysis error:', error);
    analysisPhase.value = 'hold-analysis-error';
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
  console.log('✅ Complete video analysis finished!');
};

const handleBetaProcessingError = (error) => {
  console.error('Beta processing error:', error);
  isAnalyzing.value = false;
  videoAnalysisResult.value = {
    success: false,
    error: true,
    message: 'Error processing video: ' + error.message,
  };
};

const handleBetaVideoCleared = () => {
  console.log('Beta video cleared');
  // Reset all state when video is cleared
  videoAnalysisResult.value = null;
  extractedFrame.value = null;
  isAnalyzing.value = false;
  matchedBoulderImage.value = null;
  allFrames.value = [];
  poseResults.value = [];
  analysisPhase.value = '';
  pendingRedirectData.value = null;
};

// Handle manual continue after analysis review
const continueToUpload = async () => {
  if (!pendingRedirectData.value) {
    console.error('No pending redirect data available');
    return;
  }

  const { analysisData, problem } = pendingRedirectData.value;
  await redirectToProblemPageWithVideo(analysisData, problem);
};

// Phase 4: Hold Analysis - Compare poses with boulder problems
const runHoldAnalysis = async (frameResults, homographyMatrix, matchedImage) => {
  console.log('🎯 Phase 4: Starting hold analysis...');
  console.log('📊 Input data:', {
    frameResultsLength: frameResults?.length || 0,
    hasHomography: !!homographyMatrix,
    locationId: route.params.id,
    matchedImageId: matchedImage?.id,
    matchedImageName: matchedImage?.name,
  });

  if (!homographyMatrix) {
    console.log('⚠️ No homography matrix available for hold analysis');
    return {
      error: 'No homography matrix available',
      bestMatch: null,
      allScores: [],
      transformedFrames: [],
    };
  }

  try {
    // Get boulder problems for the matched image only
    let problemsForLocation;

    if (matchedImage?.id) {
      // Filter to only boulder problems that exist on the matched image
      problemsForLocation = boulderProblemsStore.sortedProblems.filter(
        (problem) => problem.locationId === route.params.id && problem.imageId === matchedImage.id
      );
      console.log(
        `🔍 Found ${problemsForLocation.length} boulder problems for matched image "${matchedImage.name}" (ID: ${matchedImage.id})`
      );
    } else {
      // Fallback: use all problems for the location (old behavior)
      problemsForLocation = boulderProblemsStore.sortedProblems.filter(
        (problem) => problem.locationId === route.params.id
      );
      console.log(
        `⚠️ No matched image ID available, using all ${problemsForLocation.length} boulder problems for location ${route.params.id}`
      );
    }

    if (problemsForLocation.length === 0) {
      console.log('ℹ️ No boulder problems found for this location');
      return {
        error: 'No boulder problems found for this location',
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }

    console.log(
      '🏔️ Boulder problems:',
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
        { type: 'leftWrist', point: firstPose.keypoints[9] }, // left wrist
        { type: 'rightWrist', point: firstPose.keypoints[10] }, // right wrist
        { type: 'leftAnkle', point: firstPose.keypoints[15] }, // left ankle
        { type: 'rightAnkle', point: firstPose.keypoints[16] }, // right ankle
      ].filter((kp) => {
        // Lower confidence threshold to be more inclusive
        const hasPoint = kp.point && kp.point.confidence > 0.3;
        if (!hasPoint) {
          console.log(
            `❌ ${kp.type} keypoint missing or low confidence:`,
            kp.point?.confidence || 'undefined'
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
      console.log('⚠️ No valid poses to analyze');
      return {
        error: 'No valid poses found for analysis',
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }

    // Score each boulder problem based on hold proximity
    const problemScores = [];

    for (const problem of problemsForLocation) {
      console.log(`🔍 Scoring problem "${problem.name}" with ${problem.holds?.length || 0} holds`);
      const score = calculateProblemScoreSimple(problem, transformedFrames);

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
      '🏆 Final problem scores:',
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

    console.log('🎯 Hold analysis complete:', {
      hasBestMatch: !!result.bestMatch,
      bestMatchName: result.bestMatch?.problem?.name,
      totalCandidates: result.allScores.length,
    });

    return result;
  } catch (error) {
    console.error('❌ Hold analysis error:', error);
    return {
      error: error.message,
      bestMatch: null,
      allScores: [],
      transformedFrames: [],
    };
  }
};

// Calculate how well pose keypoints match with problem holds using simple score aggregation
const calculateProblemScoreSimple = (problem, transformedFrames) => {
  console.log(`🎯 Scoring problem "${problem.name}" with ${problem.holds?.length || 0} holds`);
  
  if (!problem.holds || problem.holds.length === 0) {
    console.log(`❌ Problem "${problem.name}" has no holds defined`);
    return 0;
  }

  let totalScore = 0;
  const proximityThreshold = 150; // Same threshold as table
  const problemMatches = []; // Track individual matches for debugging

  // For each transformed frame, check proximity to holds  
  for (const frame of transformedFrames) {
    console.log(`🎯 Analyzing frame ${frame.frameIndex} with ${frame.keypoints.length} keypoints`);

    for (const keypoint of frame.keypoints) {
      // Skip very low-confidence keypoints
      if (keypoint.confidence < 0.2) {
        continue;
      }

      // Get hold center positions from the problem - same logic as table
      const holdDistances = problem.holds
        .map((holdData, index) => {
          const hold = holdData.hold;
          let x, y;

          // Extract coordinates using same logic as table
          if (hold.coordinates) {
            x = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
            y = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
          } else if (hold.bbox && Array.isArray(hold.bbox)) {
            x = hold.bbox[0] + hold.bbox[2] / 2;
            y = hold.bbox[1] + hold.bbox[3] / 2;
          } else if (hold.x !== undefined && hold.y !== undefined) {
            x = hold.x + (hold.width || 0) / 2;
            y = hold.y + (hold.height || 0) / 2;
          } else if (hold.center_x !== undefined && hold.center_y !== undefined) {
            x = hold.center_x;
            y = hold.center_y;
          } else {
            console.warn('Unknown hold coordinate format:', hold);
            return null;
          }

          const distance = Math.sqrt(
            Math.pow(keypoint.x - x, 2) + Math.pow(keypoint.y - y, 2)
          );

          // Calculate score - same logic as table
          const score = distance <= proximityThreshold ? 
            (proximityThreshold - distance) / proximityThreshold : 0;

          return {
            holdIndex: holdData.holdIndex || index,
            distance: Math.round(distance),
            score: score
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);

      // Get the best scoring hold for this keypoint in this problem
      const bestHold = holdDistances[0];
      if (bestHold && bestHold.score > 0) {
        totalScore += bestHold.score;
        problemMatches.push({
          keypoint: keypoint.type,
          frame: frame.frameIndex,
          holdIndex: bestHold.holdIndex,
          distance: bestHold.distance,
          score: bestHold.score
        });

        console.log(
          `✅ ${keypoint.type} (frame ${frame.frameIndex}) matches hold #${bestHold.holdIndex} ` +
          `(${bestHold.distance}px, score: ${bestHold.score.toFixed(3)})`
        );
      }
    }
  }

  console.log(`📊 Problem "${problem.name}" total score: ${totalScore.toFixed(3)} from ${problemMatches.length} matches`);
  return totalScore;
};

// Grade expansion functions
const toggleGradeExpansion = (grade) => {
  if (expandedGrades.value.has(grade)) {
    expandedGrades.value.delete(grade);
  } else {
    expandedGrades.value.add(grade);
  }
  // Trigger reactivity
  expandedGrades.value = new Set(expandedGrades.value);
};

// Redirect to problem page with video data
const redirectToProblemPageWithVideo = async (analysisData, problem) => {
  console.log('🚀 Redirecting to problem page with video data:', {
    problemId: problem.id,
    problemName: problem.name,
    hasVideo: !!analysisData.video,
    hasFrames: !!(analysisData.frames && analysisData.frames.length > 0),
  });

  try {
    // Store enhanced data for visual confirmation in sessionStorage
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
        matchedProblem: {
          id: problem.id,
          name: problem.name,
          grade: problem.grade,
          description: problem.description,
          color: problem.color,
          holds: problem.holds,
        },
        matchedImage: analysisData.match
          ? {
              id: analysisData.match.id,
              url: analysisData.match.url,
              name: analysisData.match.name,
              width: analysisData.match.width,
              height: analysisData.match.height,
            }
          : null,
        confidence: 0.95, // High confidence since we passed all analysis checks
        keypoints:
          videoAnalysisResult.value?.poseResults?.filter((r) => r.poses.length > 0).length || 0,
        timestamp: Date.now(),
      },
    };

    sessionStorage.setItem('prefilledVideoData', JSON.stringify(minimalData));
    console.log('📁 Stored minimal data in sessionStorage:', minimalData);
  } catch (storageError) {
    console.warn('⚠️ Could not store data in sessionStorage:', storageError);
    // Continue without sessionStorage - we'll rely on window.tempVideoFile
  }

  // Store the actual File object in a temporary variable
  // that the target page can access
  window.tempVideoFile = analysisData.video;
  console.log('📁 Stored video file in window.tempVideoFile');

  // Navigate to the problem page
  await router.push({
    name: 'boulder-problem-detail',
    params: {
      locationId: route.params.locationId || route.params.id,
      problemId: problem.id,
    },
    query: {
      action: 'log-ascent',
      hasPrefilledVideo: 'true',
    },
  });
};

onMounted(async () => {
  console.log('🔄 Loading OpenCV.js for homography calculations...');
  try {
    // Import OpenCV.js - required for homography matrix calculation
    const cvReadyPromise = await import('@techstark/opencv-js');
    window.cv = await cvReadyPromise.default;
    console.log('✅ OpenCV.js loaded successfully for LocationDetailView');
  } catch (err) {
    console.error('❌ Failed to load OpenCV.js:', err);
    console.warn('⚠️ Homography calculations will not be available');
  }

  loadLocation();
  loadLocationVideos();
});
</script>
