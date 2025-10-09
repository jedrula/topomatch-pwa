<template>
  <div class="feature-match-visualization">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Video Frame (Source) -->
      <div class="relative">
        <h6 class="text-xs font-medium text-gray-700 mb-2">Video Frame (Source)</h6>
        <div class="relative inline-block border rounded">
          <img
            ref="sourceImage"
            :src="sourceImageUrl"
            alt="Video frame"
            class="max-w-full max-h-[300px] object-contain"
            @load="onSourceImageLoad"
          />
          <!-- Source feature points -->
          <svg
            v-if="sourceImageDimensions.width > 0"
            class="absolute inset-0 pointer-events-none"
            :width="sourceImageDimensions.width"
            :height="sourceImageDimensions.height"
            :viewBox="`0 0 ${sourceImageDimensions.naturalWidth} ${sourceImageDimensions.naturalHeight}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle
              v-for="(match, index) in processedMatches"
              :key="`source-${index}`"
              :cx="match.point1.x"
              :cy="match.point1.y"
              r="3"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              :stroke="match.isInlier ? '#16a34a' : '#dc2626'"
              stroke-width="1"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      <!-- Reference Image (Target) -->
      <div class="relative">
        <h6 class="text-xs font-medium text-gray-700 mb-2">Reference Image (Target)</h6>
        <div class="relative inline-block border rounded">
          <img
            ref="targetImage"
            :src="targetImageUrl"
            alt="Reference image"
            class="max-w-full max-h-[300px] object-contain"
            @load="onTargetImageLoad"
          />
          <!-- Target feature points -->
          <svg
            v-if="targetImageDimensions.width > 0"
            class="absolute inset-0 pointer-events-none"
            :width="targetImageDimensions.width"
            :height="targetImageDimensions.height"
            :viewBox="`0 0 ${targetImageDimensions.naturalWidth} ${targetImageDimensions.naturalHeight}`"
            preserveAspectRatio="xMidYMid meet"
          >
            <circle
              v-for="(match, index) in processedMatches"
              :key="`target-${index}`"
              :cx="match.point2.x"
              :cy="match.point2.y"
              r="3"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              :stroke="match.isInlier ? '#16a34a' : '#dc2626'"
              stroke-width="1"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Combined view with connecting lines -->
    <div class="mt-4">
      <h6 class="text-xs font-medium text-gray-700 mb-2">Feature Matches with Connections</h6>
      <div class="relative border rounded bg-gray-50 p-2">
        <svg
          v-if="canRenderCombinedView"
          :width="combinedDimensions.width"
          :height="combinedDimensions.height"
          class="w-full"
          :viewBox="`0 0 ${combinedDimensions.width} ${combinedDimensions.height}`"
        >
          <!-- Source image -->
          <image
            :href="sourceImageUrl"
            x="0"
            y="0"
            :width="sourceImageScale.width"
            :height="sourceImageScale.height"
            preserveAspectRatio="xMidYMid meet"
          />
          
          <!-- Target image -->
          <image
            :href="targetImageUrl"
            :x="sourceImageScale.width + 20"
            y="0"
            :width="targetImageScale.width"
            :height="targetImageScale.height"
            preserveAspectRatio="xMidYMid meet"
          />

          <!-- Connecting lines -->
          <g v-for="(match, index) in validMatches" :key="`line-${index}`">
            <line
              :x1="match.sourcePoint.x"
              :y1="match.sourcePoint.y"
              :x2="match.targetPoint.x"
              :y2="match.targetPoint.y"
              :stroke="match.isInlier ? '#22c55e' : '#ef4444'"
              :stroke-width="match.isInlier ? '1.5' : '1'"
              :opacity="match.isInlier ? '0.8' : '0.4'"
            />
          </g>

          <!-- Feature points on combined view -->
          <g v-for="(match, index) in validMatches" :key="`points-${index}`">
            <!-- Source point -->
            <circle
              :cx="match.sourcePoint.x"
              :cy="match.sourcePoint.y"
              r="2"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              stroke="white"
              stroke-width="0.5"
            />
            <!-- Target point -->
            <circle
              :cx="match.targetPoint.x"
              :cy="match.targetPoint.y"
              r="2"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              stroke="white"
              stroke-width="0.5"
            />
          </g>
        </svg>
      </div>
    </div>

    <!-- Pose Keypoint Transformation Visualization - Simplified -->
    <div v-if="poseKeypoints.length > 0 && homographyMatrix" class="mt-4">
      <h6 class="text-xs font-medium text-gray-700 mb-2">Transformed Pose Projection (Simplified)</h6>
      
      <!-- Use the same simple layout as debug mode -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Source Image with Original Pose Points -->
        <div class="relative">
          <h6 class="text-xs font-medium text-gray-700 mb-2">
            Source Image (Original Pose Keypoints)
          </h6>
          <div class="relative inline-block border-2 border-red-300 rounded">
            <img
              ref="poseSourceImage"
              :src="sourceImageUrl"
              alt="Source with pose"
              class="max-w-full max-h-[300px] object-contain"
              @load="onPoseSourceImageLoad"
            />
            <!-- Original pose keypoints overlay -->
            <svg
              v-if="poseSourceImageDimensions.width > 0"
              class="absolute inset-0 pointer-events-none"
              :width="poseSourceImageDimensions.width"
              :height="poseSourceImageDimensions.height"
              :viewBox="`0 0 ${poseSourceImageDimensions.naturalWidth} ${poseSourceImageDimensions.naturalHeight}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <g v-for="(keypoint, index) in poseKeypoints" :key="`pose-source-${index}`">
                <circle
                  :cx="keypoint.x"
                  :cy="keypoint.y"
                  r="6"
                  fill="#ef4444"
                  stroke="white"
                  stroke-width="2"
                  opacity="0.8"
                />
                <text
                  :x="keypoint.x + 8"
                  :y="keypoint.y - 8"
                  font-size="12"
                  fill="#dc2626"
                  font-weight="bold"
                  stroke="white"
                  stroke-width="0.5"
                >{{ index }}</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Target Image with Projected Pose Points -->
        <div class="relative">
          <h6 class="text-xs font-medium text-gray-700 mb-2">
            Target Image (Projected Pose Keypoints)
          </h6>
          <div class="relative inline-block border-2 border-green-300 rounded">
            <img
              ref="poseTargetImage"
              :src="targetImageUrl"
              alt="Target with projected pose"
              class="max-w-full max-h-[300px] object-contain"
              @load="onPoseTargetImageLoad"
            />
            <!-- Projected pose keypoints overlay -->
            <svg
              v-if="poseTargetImageDimensions.width > 0"
              class="absolute inset-0 pointer-events-none"
              :width="poseTargetImageDimensions.width"
              :height="poseTargetImageDimensions.height"
              :viewBox="`0 0 ${poseTargetImageDimensions.naturalWidth} ${poseTargetImageDimensions.naturalHeight}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <g v-for="(projection, index) in simplePoseProjections" :key="`pose-target-${index}`">
                <circle
                  :cx="projection.projected.x"
                  :cy="projection.projected.y"
                  r="6"
                  fill="#22c55e"
                  stroke="white"
                  stroke-width="2"
                  opacity="0.8"
                />
                <text
                  :x="projection.projected.x + 8"
                  :y="projection.projected.y - 8"
                  font-size="12"
                  fill="#16a34a"
                  font-weight="bold"
                  stroke="white"
                  stroke-width="0.5"
                >{{ index }}</text>
                
                <!-- Show closest hold connection if available -->
                <g v-if="projection.closestHold">
                  <line
                    :x1="projection.projected.x"
                    :y1="projection.projected.y"
                    :x2="projection.closestHold.x"
                    :y2="projection.closestHold.y"
                    stroke="black"
                    stroke-width="2"
                    opacity="0.6"
                  />
                  <circle
                    :cx="projection.closestHold.x"
                    :cy="projection.closestHold.y"
                    r="4"
                    fill="black"
                    opacity="0.6"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- Simplified pose transformation table -->
      <div v-if="simplePoseProjections.length > 0" class="mt-4">
        <h6 class="text-xs font-medium text-gray-700 mb-2">Pose Projection Coordinates</h6>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs bg-white border border-gray-200 rounded">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Keypoint #</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Original (x, y)</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Projected (x, y)</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Status</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Closest Hold Distance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(projection, index) in simplePoseProjections" :key="index" class="hover:bg-gray-50">
                <td class="px-2 py-1 font-medium text-gray-900">{{ index }}</td>
                <td class="px-2 py-1 text-gray-600">
                  ({{ Math.round(projection.original.x) }}, {{ Math.round(projection.original.y) }})
                </td>
                <td class="px-2 py-1 text-gray-600">
                  <span v-if="isValidSimpleProjection(projection.projected)">
                    ({{ Math.round(projection.projected.x) }}, {{ Math.round(projection.projected.y) }})
                  </span>
                  <span v-else class="text-red-500">Invalid</span>
                </td>
                <td class="px-2 py-1">
                  <span v-if="isValidSimpleProjection(projection.projected)" class="text-green-600">✓ Valid</span>
                  <span v-else class="text-red-600">✗ Invalid</span>
                </td>
                <td class="px-2 py-1 text-gray-600">
                  <span v-if="projection.closestHold">
                    {{ Math.round(projection.holdDistance) }}px
                  </span>
                  <span v-else class="text-gray-400">No hold found</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Legend and Controls -->
    <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-4 text-xs">
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Inlier matches ({{ inlierCount }})</span>
        </div>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Outlier matches ({{ outlierCount }})</span>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <label class="text-xs text-gray-600">
          <input
            v-model="showOutliers"
            type="checkbox"
            class="mr-1"
          />
          Show outliers
        </label>
        <label class="text-xs text-gray-600">
          Max matches:
          <select v-model="maxDisplayMatches" class="ml-1 text-xs border rounded px-1">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="999">All</option>
          </select>
        </label>
      </div>
    </div>

    <!-- Interactive Homography Testing -->
    <div v-if="homographyMatrix" class="mt-6 border-t pt-6">
      <div class="flex items-center justify-between mb-4">
        <h6 class="text-sm font-medium text-gray-700">Interactive Homography Testing</h6>
        <div class="flex items-center space-x-2">
          <button
            v-if="testPoints.length > 0"
            @click="clearTestPoints"
            class="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-300 rounded"
          >
            Clear test points
          </button>
        </div>
      </div>
      
      <div class="mb-4 p-3 bg-blue-50 rounded-lg">
        <p class="text-xs text-blue-700 mb-2">
          <strong>Click Testing Mode:</strong> Click on the source image (left) to test homography projection accuracy.
          The projected point will appear on the target image (right).
        </p>
        <div class="flex items-center space-x-4 text-xs text-blue-600">
          <span>Test points: {{ testPoints.length }}</span>
          <span v-if="averageProjectionError">
            Avg error: {{ Math.round(averageProjectionError) }}px
          </span>
        </div>
      </div>

      <!-- Modified source and target images for click testing -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Clickable Source Image -->
        <div class="relative">
          <h6 class="text-xs font-medium text-gray-700 mb-2">
            Source Image (Click to Test) 
            <span class="text-blue-600">- {{ testPoints.length }} test points</span>
          </h6>
          <div class="relative inline-block border-2 border-blue-300 rounded">
            <img
              ref="debugSourceImage"
              :src="sourceImageUrl"
              alt="Source for testing"
              class="max-w-full max-h-[300px] object-contain cursor-crosshair"
              @load="onDebugSourceImageLoad"
              @click="onSourceImageClick"
            />
            <!-- Test points overlay on source -->
            <svg
              v-if="debugSourceImageDimensions.width > 0"
              class="absolute inset-0 pointer-events-none"
              :width="debugSourceImageDimensions.width"
              :height="debugSourceImageDimensions.height"
              :viewBox="`0 0 ${debugSourceImageDimensions.naturalWidth} ${debugSourceImageDimensions.naturalHeight}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Test points from clicking -->
              <g v-for="(point, index) in testPoints" :key="`test-source-${index}`">
                <circle
                  :cx="point.source.x"
                  :cy="point.source.y"
                  r="8"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="2"
                  opacity="0.8"
                />
                <text
                  :x="point.source.x + 12"
                  :y="point.source.y - 8"
                  font-size="12"
                  fill="#1d4ed8"
                  font-weight="bold"
                  stroke="white"
                  stroke-width="0.5"
                >{{ index + 1 }}</text>
              </g>
              
              <!-- Selected keypoint from table -->
              <g v-if="selectedKeypoint">
                <circle
                  :cx="selectedKeypoint.original.x"
                  :cy="selectedKeypoint.original.y"
                  r="12"
                  fill="#ef4444"
                  stroke="yellow"
                  stroke-width="3"
                  opacity="0.9"
                />
                <text
                  :x="selectedKeypoint.original.x + 16"
                  :y="selectedKeypoint.original.y - 10"
                  font-size="14"
                  fill="#dc2626"
                  font-weight="bold"
                  stroke="yellow"
                  stroke-width="1"
                >{{ selectedKeypoint.name }}</text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Target Image with Projections -->
        <div class="relative">
          <h6 class="text-xs font-medium text-gray-700 mb-2">
            Target Image (Projected Points)
            <span class="text-green-600">- {{ validTestProjections.length }} valid projections</span>
          </h6>
          <div class="relative inline-block border-2 border-green-300 rounded">
            <img
              ref="debugTargetImage"
              :src="targetImageUrl"
              alt="Target with projections"
              class="max-w-full max-h-[300px] object-contain"
              @load="onDebugTargetImageLoad"
            />
            <!-- Projected test points overlay on target -->
            <svg
              v-if="debugTargetImageDimensions.width > 0"
              class="absolute inset-0 pointer-events-none"
              :width="debugTargetImageDimensions.width"
              :height="debugTargetImageDimensions.height"
              :viewBox="`0 0 ${debugTargetImageDimensions.naturalWidth} ${debugTargetImageDimensions.naturalHeight}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Test points from clicking -->
              <g v-for="(point, index) in validTestProjections" :key="`test-target-${index}`">
                <circle
                  :cx="point.projected.x"
                  :cy="point.projected.y"
                  r="8"
                  fill="#10b981"
                  stroke="white"
                  stroke-width="2"
                  opacity="0.8"
                />
                <text
                  :x="point.projected.x + 12"
                  :y="point.projected.y - 8"
                  font-size="12"
                  fill="#059669"
                  font-weight="bold"
                  stroke="white"
                  stroke-width="0.5"
                >{{ index + 1 }}</text>
              </g>
              
              <!-- Selected keypoint and its closest hold -->
              <g v-if="selectedKeypoint">
                <!-- Line connecting keypoint to hold -->
                <line
                  v-if="selectedKeypointHoldCoords"
                  :x1="selectedKeypoint.transformed.x"
                  :y1="selectedKeypoint.transformed.y"
                  :x2="selectedKeypointHoldCoords.x"
                  :y2="selectedKeypointHoldCoords.y"
                  stroke="yellow"
                  stroke-width="3"
                  opacity="0.8"
                />
                
                <!-- Projected keypoint -->
                <circle
                  :cx="selectedKeypoint.transformed.x"
                  :cy="selectedKeypoint.transformed.y"
                  r="12"
                  fill="#ef4444"
                  stroke="yellow"
                  stroke-width="3"
                  opacity="0.9"
                />
                <text
                  :x="selectedKeypoint.transformed.x + 16"
                  :y="selectedKeypoint.transformed.y - 10"
                  font-size="14"
                  fill="#dc2626"
                  font-weight="bold"
                  stroke="yellow"
                  stroke-width="1"
                >{{ selectedKeypoint.name }}</text>
                
                <!-- Closest hold -->
                <g v-if="selectedKeypointHoldCoords">
                  <circle
                    :cx="selectedKeypointHoldCoords.x"
                    :cy="selectedKeypointHoldCoords.y"
                    r="10"
                    fill="#22c55e"
                    stroke="yellow"
                    stroke-width="3"
                    opacity="0.9"
                  />
                  <text
                    :x="selectedKeypointHoldCoords.x + 14"
                    :y="selectedKeypointHoldCoords.y + 5"
                    font-size="12"
                    fill="#16a34a"
                    font-weight="bold"
                    stroke="yellow"
                    stroke-width="1"
                  >Hold</text>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- Test Results Table -->
      <div v-if="testPoints.length > 0" class="mt-4">
        <h6 class="text-xs font-medium text-gray-700 mb-2">Projection Test Results</h6>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs bg-white border border-gray-200 rounded">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-2 py-1 text-left font-medium text-gray-500">#</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Source (x, y)</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Projected (x, y)</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Status</th>
                <th class="px-2 py-1 text-left font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(point, index) in testPoints" :key="index" class="hover:bg-gray-50">
                <td class="px-2 py-1 font-medium text-gray-900">{{ index + 1 }}</td>
                <td class="px-2 py-1 text-gray-600">
                  ({{ Math.round(point.source.x) }}, {{ Math.round(point.source.y) }})
                </td>
                <td class="px-2 py-1 text-gray-600">
                  <span v-if="isValidProjection(point.projected)">
                    ({{ Math.round(point.projected.x) }}, {{ Math.round(point.projected.y) }})
                  </span>
                  <span v-else class="text-red-500">Invalid</span>
                </td>
                <td class="px-2 py-1">
                  <span v-if="isValidProjection(point.projected)" class="text-green-600">✓ Valid</span>
                  <span v-else class="text-red-600">✗ Invalid</span>
                </td>
                <td class="px-2 py-1">
                  <button
                    @click="removeTestPoint(index)"
                    class="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  sourceImageUrl: String,
  targetImageUrl: String,
  featureMatches: {
    type: Array,
    default: () => []
  },
  homographyInliers: {
    type: Number,
    default: 0
  },
  poseKeypoints: {
    type: Array,
    default: () => []
  },
  homographyMatrix: {
    type: Array,
    default: () => null
  },
  selectedKeypoint: {
    type: Object,
    default: () => null
  }
})

// Refs for image elements
const sourceImage = ref(null)
const targetImage = ref(null)

// Image dimensions
const sourceImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const targetImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

// Display controls
const showOutliers = ref(true)
const maxDisplayMatches = ref(50)

// Interactive testing (always enabled)
const testPoints = ref([])
const debugSourceImage = ref(null)
const debugTargetImage = ref(null)
const debugSourceImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const debugTargetImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

// Simple pose projection refs
const poseSourceImage = ref(null)
const poseTargetImage = ref(null)
const poseSourceImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const poseTargetImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

// Image load handlers
const onSourceImageLoad = () => {
  if (sourceImage.value) {
    sourceImageDimensions.value = {
      width: sourceImage.value.clientWidth,
      height: sourceImage.value.clientHeight,
      naturalWidth: sourceImage.value.naturalWidth,
      naturalHeight: sourceImage.value.naturalHeight
    }
  }
}

const onTargetImageLoad = () => {
  if (targetImage.value) {
    targetImageDimensions.value = {
      width: targetImage.value.clientWidth,
      height: targetImage.value.clientHeight,
      naturalWidth: targetImage.value.naturalWidth,
      naturalHeight: targetImage.value.naturalHeight
    }
  }
}

// Debug image load handlers
const onDebugSourceImageLoad = () => {
  if (debugSourceImage.value) {
    debugSourceImageDimensions.value = {
      width: debugSourceImage.value.clientWidth,
      height: debugSourceImage.value.clientHeight,
      naturalWidth: debugSourceImage.value.naturalWidth,
      naturalHeight: debugSourceImage.value.naturalHeight
    }
  }
}

const onDebugTargetImageLoad = () => {
  if (debugTargetImage.value) {
    debugTargetImageDimensions.value = {
      width: debugTargetImage.value.clientWidth,
      height: debugTargetImage.value.clientHeight,
      naturalWidth: debugTargetImage.value.naturalWidth,
      naturalHeight: debugTargetImage.value.naturalHeight
    }
  }
}

// Pose image load handlers
const onPoseSourceImageLoad = () => {
  if (poseSourceImage.value) {
    poseSourceImageDimensions.value = {
      width: poseSourceImage.value.clientWidth,
      height: poseSourceImage.value.clientHeight,
      naturalWidth: poseSourceImage.value.naturalWidth,
      naturalHeight: poseSourceImage.value.naturalHeight
    }
  }
}

const onPoseTargetImageLoad = () => {
  if (poseTargetImage.value) {
    poseTargetImageDimensions.value = {
      width: poseTargetImage.value.clientWidth,
      height: poseTargetImage.value.clientHeight,
      naturalWidth: poseTargetImage.value.naturalWidth,
      naturalHeight: poseTargetImage.value.naturalHeight
    }
  }
}

// Process matches to add inlier/outlier information
const processedMatches = computed(() => {
  if (!props.featureMatches.length) return []
  
  // Mark inliers vs outliers based on homography inliers count
  return props.featureMatches.map((match, index) => ({
    ...match,
    isInlier: index < props.homographyInliers
  }))
})

// Extract hold coordinates for selected keypoint
const selectedKeypointHoldCoords = computed(() => {
  if (!props.selectedKeypoint || !props.selectedKeypoint.closestHold) return null
  
  const hold = props.selectedKeypoint.closestHold
  let holdX, holdY
  
  // Extract center coordinates from various hold formats
  if (hold.coordinates) {
    holdX = hold.coordinates.x + (hold.coordinates.width || 0) / 2
    holdY = hold.coordinates.y + (hold.coordinates.height || 0) / 2
  } else if (hold.bbox && Array.isArray(hold.bbox)) {
    holdX = hold.bbox[0] + hold.bbox[2] / 2
    holdY = hold.bbox[1] + hold.bbox[3] / 2
  } else if (hold.bbox && typeof hold.bbox === 'object') {
    holdX = hold.bbox.x + (hold.bbox.width || 0) / 2
    holdY = hold.bbox.y + (hold.bbox.height || 0) / 2
  } else if (hold.x !== undefined && hold.y !== undefined) {
    // Check if this is already a center coordinate (from AI detected holds)
    if (hold.source === 'ai-detected' || hold.aiModel === 'server-detection') {
      holdX = hold.x // Already center coordinate
      holdY = hold.y // Already center coordinate
    } else {
      holdX = hold.x + (hold.width || 0) / 2
      holdY = hold.y + (hold.height || 0) / 2
    }
  } else if (hold.center_x !== undefined && hold.center_y !== undefined) {
    holdX = hold.center_x
    holdY = hold.center_y
  } else {
    return null
  }
  
  return { x: holdX, y: holdY }
})

// Check if we can render the combined view
const canRenderCombinedView = computed(() => {
  return (
    sourceImageDimensions.value.width > 0 &&
    targetImageDimensions.value.width > 0 &&
    sourceImageDimensions.value.naturalWidth > 0 &&
    targetImageDimensions.value.naturalWidth > 0 &&
    combinedDimensions.value.width > 0
  )
})

// Transform pose keypoints using homography matrix
// Simple pose projections using the same logic as interactive testing
const simplePoseProjections = computed(() => {
  if (!props.poseKeypoints.length || !props.homographyMatrix) return []
  
  return props.poseKeypoints.map((keypoint, index) => {
    // Use the same transformation as the clickable testing (which works correctly)
    const projectedPoint = transformPointWithHomography(
      keypoint.x, 
      keypoint.y, 
      props.homographyMatrix
    )
    
    // Find closest hold (if you have hold data available)
    let closestHold = null
    let holdDistance = null
    
    // TODO: Add hold detection logic here if you have hold coordinates
    // For now, this is just a placeholder for the closest hold feature
    
    return {
      index,
      original: { x: keypoint.x, y: keypoint.y },
      projected: projectedPoint,
      closestHold,
      holdDistance
    }
  }).filter(projection => {
    // Filter out invalid projections using the same validation as clickable testing
    return projection.projected && 
           !isNaN(projection.projected.x) && !isNaN(projection.projected.y) &&
           isFinite(projection.projected.x) && isFinite(projection.projected.y)
  })
})

// Validation for simple projections
const isValidSimpleProjection = (point) => {
  return point && 
         !isNaN(point.x) && !isNaN(point.y) &&
         isFinite(point.x) && isFinite(point.y) &&
         point.x >= 0 && point.y >= 0 &&
         point.x <= poseTargetImageDimensions.value.naturalWidth &&
         point.y <= poseTargetImageDimensions.value.naturalHeight
}

// Helper function to transform a point using homography matrix
const transformPointWithHomography = (x, y, homography) => {
  if (!homography || homography.length !== 9) {
    return { x: 0, y: 0 }
  }
  
  // Homography transformation: [x', y', w'] = H * [x, y, 1]
  const h = homography
  const denominator = h[6] * x + h[7] * y + h[8]
  
  if (Math.abs(denominator) < 1e-10) {
    return { x: 0, y: 0 } // Avoid division by zero
  }
  
  const transformedX = (h[0] * x + h[1] * y + h[2]) / denominator
  const transformedY = (h[3] * x + h[4] * y + h[5]) / denominator
  
  return {
    x: transformedX,
    y: transformedY
  }
}

// Calculate valid matches with proper coordinate transformation
const validMatches = computed(() => {
  if (!canRenderCombinedView.value) return []
  
  let matches = processedMatches.value
  
  if (!showOutliers.value) {
    matches = matches.filter(match => match.isInlier)
  }
  
  if (maxDisplayMatches.value < 999) {
    matches = matches.slice(0, maxDisplayMatches.value)
  }
  
  // Transform coordinates for display
  return matches.map(match => {
    const sourceScaleX = sourceImageDimensions.value.naturalWidth > 0 ? 
      sourceImageScale.value.width / sourceImageDimensions.value.naturalWidth : 0
    const sourceScaleY = sourceImageDimensions.value.naturalHeight > 0 ? 
      sourceImageScale.value.height / sourceImageDimensions.value.naturalHeight : 0
    const targetScaleX = targetImageDimensions.value.naturalWidth > 0 ? 
      targetImageScale.value.width / targetImageDimensions.value.naturalWidth : 0
    const targetScaleY = targetImageDimensions.value.naturalHeight > 0 ? 
      targetImageScale.value.height / targetImageDimensions.value.naturalHeight : 0
    
    return {
      ...match,
      sourcePoint: {
        x: match.point1.x * sourceScaleX,
        y: match.point1.y * sourceScaleY
      },
      targetPoint: {
        x: sourceImageScale.value.width + 20 + (match.point2.x * targetScaleX),
        y: match.point2.y * targetScaleY
      }
    }
  }).filter(match => {
    // Filter out any matches with invalid coordinates
    return (
      !isNaN(match.sourcePoint.x) && !isNaN(match.sourcePoint.y) &&
      !isNaN(match.targetPoint.x) && !isNaN(match.targetPoint.y) &&
      isFinite(match.sourcePoint.x) && isFinite(match.sourcePoint.y) &&
      isFinite(match.targetPoint.x) && isFinite(match.targetPoint.y)
    )
  })
})

// Count inliers and outliers
const inlierCount = computed(() => processedMatches.value.filter(m => m.isInlier).length)
const outlierCount = computed(() => processedMatches.value.filter(m => !m.isInlier).length)

// Combined view dimensions and scaling
const combinedDimensions = computed(() => {
  const maxHeight = Math.max(sourceImageDimensions.value.height, targetImageDimensions.value.height)
  const totalWidth = sourceImageDimensions.value.width + targetImageDimensions.value.width + 20
  return {
    width: totalWidth,
    height: maxHeight
  }
})

const sourceImageScale = computed(() => ({
  width: sourceImageDimensions.value.width,
  height: sourceImageDimensions.value.height
}))

const targetImageScale = computed(() => ({
  width: targetImageDimensions.value.width,
  height: targetImageDimensions.value.height
}))

// Interactive testing functions
const onSourceImageClick = (event) => {
  if (!props.homographyMatrix) {
    return
  }

  const rect = debugSourceImage.value.getBoundingClientRect()
  const scaleX = debugSourceImageDimensions.value.naturalWidth / debugSourceImageDimensions.value.width
  const scaleY = debugSourceImageDimensions.value.naturalHeight / debugSourceImageDimensions.value.height
  
  // Get click coordinates relative to the natural image size
  const clickX = (event.clientX - rect.left) * scaleX
  const clickY = (event.clientY - rect.top) * scaleY
  
  // Project the point using homography
  const projectedPoint = transformPointWithHomography(clickX, clickY, props.homographyMatrix)
  
  const testPoint = {
    source: { x: clickX, y: clickY },
    projected: projectedPoint,
    timestamp: Date.now()
  }
  
  testPoints.value.push(testPoint)
}

// Validate that a projection is reasonable for debug testing
const isValidProjection = (point) => {
  return point && 
         !isNaN(point.x) && !isNaN(point.y) &&
         isFinite(point.x) && isFinite(point.y) &&
         point.x >= 0 && point.y >= 0 &&
         point.x <= debugTargetImageDimensions.value.naturalWidth &&
         point.y <= debugTargetImageDimensions.value.naturalHeight
}

// Filter out invalid projections
const validTestProjections = computed(() => {
  return testPoints.value.filter(point => isValidProjection(point.projected))
})

// Calculate average projection error (for future validation features)
const averageProjectionError = computed(() => {
  // This could be enhanced to compare against known validation points
  // For now, we can't calculate real error without validation data
  return null
})

// Control functions
const removeTestPoint = (index) => {
  testPoints.value.splice(index, 1)
}

const clearTestPoints = () => {
  testPoints.value = []
}
</script>
