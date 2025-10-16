<template>
  <div class="feature-match-visualization">
      <img
        style="position: absolute; opacity: 0;"
        ref="sourceImage"
        :src="sourceImageUrl"
        alt="Video frame"
        @load="onSourceImageLoad"
      />
      <img
        style="position: absolute; opacity: 0;"
        ref="targetImage"
        :src="targetImageUrl"
        alt="Reference image"
        @load="onTargetImageLoad"
      />

    <!-- Combined view with connecting lines -->
    <CollapsibleSection
      title="Feature Matches with Connections"
      :default-expanded="false"
      class="mt-4"
      content-class="relative border rounded bg-gray-50 p-2"
    >
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
    </CollapsibleSection>

    <!-- Detected Keypoints Table -->
    <CollapsibleSection
      v-if="transformedPoses && transformedPoses.length > 0"
      title="Detected Keypoints"
      :default-expanded="false"
      class="mt-6"
    >
      <div class="flex items-center justify-end mb-2">
        <p class="text-xs text-blue-600">
          💡 Click any row to visualize keypoint and closest hold on both images
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs border border-gray-200 rounded">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-2 py-1 text-left border-b border-gray-200">Frame</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">Keypoint</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">Original Coords</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">
                Transformed Coords
              </th>
              <th class="px-2 py-1 text-left border-b border-gray-200">Confidence</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">1st Closest Hold</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">2nd Closest Hold</th>
              <th class="px-2 py-1 text-left border-b border-gray-200">3rd Closest Hold</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(frame, frameIndex) in transformedPoses" :key="frameIndex">
              <tr
                v-for="(keypoint, keypointIndex) in getKeypointRows(frame)"
                :key="`${frameIndex}-${keypointIndex}`"
                :class="[
                  'border-b border-gray-100 cursor-pointer transition-colors',
                  selectedKeypoint === keypoint 
                    ? 'bg-yellow-100 hover:bg-yellow-200' 
                    : 'hover:bg-blue-50'
                ]"
                @click="handleKeypointRowClick(keypoint)"
              >
                <td class="px-2 py-1">
                  <div class="flex items-center">
                    <div
                      :class="`w-2 h-2 rounded-full mr-1 ${
                        frame.color === '#ef4444'
                          ? 'bg-red-500'
                          : frame.color === '#3b82f6'
                          ? 'bg-blue-500'
                          : frame.color === '#22c55e'
                          ? 'bg-green-500'
                          : frame.color === '#f59e0b'
                          ? 'bg-amber-500'
                          : frame.color === '#8b5cf6'
                          ? 'bg-violet-500'
                          : 'bg-gray-500'
                      }`"
                    ></div>
                    Frame {{ frameIndex + 1 }} ({{ Math.round(extractedFrames[frame.frameIndex]?.percentage * 100) || 50 }}%)
                  </div>
                </td>
                <td class="px-2 py-1 font-medium">{{ keypoint.name }}</td>
                <td class="px-2 py-1 font-mono text-gray-600">
                  ({{ Math.round(keypoint.original.x) }},
                  {{ Math.round(keypoint.original.y) }})
                </td>
                <td class="px-2 py-1 font-mono text-gray-600">
                  ({{ Math.round(keypoint.transformed.x) }},
                  {{ Math.round(keypoint.transformed.y) }})
                </td>
                <td class="px-2 py-1">
                  <span
                    :class="`px-1 py-0.5 rounded text-xs ${
                      keypoint.confidence > 0.7
                        ? 'bg-green-100 text-green-800'
                        : keypoint.confidence > 0.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`"
                  >
                    {{ (keypoint.confidence * 100).toFixed(0) }}%
                  </span>
                </td>
                <td class="px-2 py-1">
                  <div v-if="keypoint.closestHold" class="text-xs">
                    <div class="font-medium text-gray-900" v-if="keypoint.closestProblem">
                      {{ keypoint.closestProblem.name }}
                    </div>
                    <div class="font-medium text-gray-900" v-else>
                      AI Detected Hold
                    </div>
                    <div class="text-gray-500">
                      {{
                        keypoint.closestHold?.id || keypoint.closestHold?.holdIndex || "?"
                      }}
                    </div>
                    <div class="text-gray-400">{{ keypoint.distanceToHold }}px away</div>
                    <div class="text-gray-400 font-mono" v-if="extractHoldCoordinates(keypoint.closestHold)">
                      ({{ Math.round(extractHoldCoordinates(keypoint.closestHold).x) }}, 
                      {{ Math.round(extractHoldCoordinates(keypoint.closestHold).y) }})
                    </div>
                    <div class="text-green-600 font-medium">
                      Score: {{ keypoint.closestScore.toFixed(3) }}
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-400">No holds found</div>
                </td>
                <td class="px-2 py-1">
                  <div v-if="keypoint.secondClosestHold" class="text-xs">
                    <div class="font-medium text-gray-900" v-if="keypoint.secondClosestProblem">
                      {{ keypoint.secondClosestProblem.name }}
                    </div>
                    <div class="font-medium text-gray-900" v-else>
                      AI Detected Hold
                    </div>
                    <div class="text-gray-500">
                      {{
                        keypoint.secondClosestHold?.id || keypoint.secondClosestHold?.holdIndex || "?"
                      }}
                    </div>
                    <div class="text-gray-400">{{ keypoint.secondClosestDistance }}px away</div>
                    <div class="text-gray-400 font-mono" v-if="extractHoldCoordinates(keypoint.secondClosestHold)">
                      ({{ Math.round(extractHoldCoordinates(keypoint.secondClosestHold).x) }}, 
                      {{ Math.round(extractHoldCoordinates(keypoint.secondClosestHold).y) }})
                    </div>
                    <div class="text-blue-600 font-medium">
                      Score: {{ keypoint.secondClosestScore.toFixed(3) }}
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-400">-</div>
                </td>
                <td class="px-2 py-1">
                  <div v-if="keypoint.thirdClosestHold" class="text-xs">
                    <div class="font-medium text-gray-900" v-if="keypoint.thirdClosestProblem">
                      {{ keypoint.thirdClosestProblem.name }}
                    </div>
                    <div class="font-medium text-gray-900" v-else>
                      AI Detected Hold
                    </div>
                    <div class="text-gray-500">
                      {{
                        keypoint.thirdClosestHold?.id || keypoint.thirdClosestHold?.holdIndex || "?"
                      }}
                    </div>
                    <div class="text-gray-400">{{ keypoint.thirdClosestDistance }}px away</div>
                    <div class="text-gray-400 font-mono" v-if="extractHoldCoordinates(keypoint.thirdClosestHold)">
                      ({{ Math.round(extractHoldCoordinates(keypoint.thirdClosestHold).x) }}, 
                      {{ Math.round(extractHoldCoordinates(keypoint.thirdClosestHold).y) }})
                    </div>
                    <div class="text-orange-600 font-medium">
                      Score: {{ keypoint.thirdClosestScore.toFixed(3) }}
                    </div>
                  </div>
                  <div v-else class="text-xs text-gray-400">-</div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Original coordinates are from the video frame. Transformed coordinates are projected
        onto the boulder image using homography.
      </p>
    </CollapsibleSection>

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
import CollapsibleSection from './CollapsibleSection.vue'
import { 
  extractHoldCoordinates,
  getKeypointRows as processKeypointRows 
} from '../composables/useHoldMatching'

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
  // Coordinate space metadata for proper scaling
  referenceImageDimensions: {
    type: Object,
    default: () => null // { width, height } - inference dimensions
  },
  detectionSpaceDimensions: {
    type: Object,
    default: () => null // { width, height } - from viewBox where holds are stored
  },
  // Data for keypoints table
  transformedPoses: {
    type: Array,
    default: () => []
  },
  extractedFrames: {
    type: Array,
    default: () => []
  },
  boulderProblems: {
    type: Array,
    default: () => []
  },
  bestMatchImage: {
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

// Internal state for keypoint selection
const selectedKeypoint = ref(null)

// Interactive testing (always enabled)
const testPoints = ref([])
const debugSourceImage = ref(null)
const debugTargetImage = ref(null)
const debugSourceImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const debugTargetImageDimensions = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })

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
  console.log('🔍 selectedKeypointHoldCoords computed called:', {
    hasSelectedKeypoint: !!selectedKeypoint.value,
    hasClosestHold: !!selectedKeypoint.value?.closestHold,
    selectedKeypoint: selectedKeypoint.value
  });
  
  if (!selectedKeypoint.value || !selectedKeypoint.value.closestHold) return null
  
  const hold = selectedKeypoint.value.closestHold
  const coords = extractHoldCoordinates(hold)
  
  if (!coords) return null
  
  let holdX = coords.x
  let holdY = coords.y
  
  // Check if this hold comes from server detection and needs coordinate space conversion
  const isFromServerDetection = 
    hold.source === 'ai-detected' || 
    hold.aiModel === 'server-detection' ||
    hold.detectionSource === 'server' ||
    hold.source === 'manual'; // Manual holds drawn on server view are also in detection space
  
  if (isFromServerDetection && (hold.x !== undefined && hold.y !== undefined)) {
    // CRITICAL FIX: These coordinates are stored in detection space (1080×1440)
    // but the visualization canvas shows the reference image
    // Scale UP from detection space to SVG viewBox space for correct display
    
    // FAIL LOUDLY if dimensions are missing - no silent fallbacks!
    if (!props.detectionSpaceDimensions || !props.referenceImageDimensions) {
      console.error('❌ MISSING COORDINATE DIMENSIONS:', {
        detectionSpaceDimensions: props.detectionSpaceDimensions,
        referenceImageDimensions: props.referenceImageDimensions,
        hold: hold
      });
      return null; // Don't render with wrong coordinates
    }
    
    const detectionWidth = props.detectionSpaceDimensions.width
    const detectionHeight = props.detectionSpaceDimensions.height
    const referenceWidth = props.referenceImageDimensions.width
    const referenceHeight = props.referenceImageDimensions.height
    
    // CRITICAL QUESTION: Does referenceImageDimensions match the SVG viewBox dimensions?
    const svgWidth = debugTargetImageDimensions.value.naturalWidth
    const svgHeight = debugTargetImageDimensions.value.naturalHeight
    
    const dimensionsMatch = (referenceWidth === svgWidth && referenceHeight === svgHeight)
    
    console.log('🔍 COORDINATE SPACE DIAGNOSTIC:', {
      holdSource: hold.source,
      holdDetectionSource: hold.detectionSource,
      referenceImageDimensions: `${referenceWidth}×${referenceHeight}`,
      svgViewBoxDimensions: `${svgWidth}×${svgHeight}`,
      dimensionsMatch: dimensionsMatch ? '✅ SAME' : '⚠️ DIFFERENT!',
      detectionSpace: `${detectionWidth}×${detectionHeight}`
    })
    
    // Scale from detection space to the CORRECT target space
    // The SVG viewBox uses naturalWidth/Height
    // The keypoints are in referenceImageDimensions space (from homography)
    // For visualization, we need to use SVG viewBox space
    const scaleX = svgWidth / detectionWidth
    const scaleY = svgHeight / detectionHeight
    
    holdX = hold.x * scaleX
    holdY = hold.y * scaleY
    
    console.log('🎯 HOLD VISUALIZATION SCALING:', {
      holdInDetectionSpace: `(${hold.x}, ${hold.y})`,
      scaledHold: `(${holdX.toFixed(1)}, ${holdY.toFixed(1)})`,
      scaleFactors: `${scaleX.toFixed(3)}×${scaleY.toFixed(3)}`,
      targetSpace: 'SVG viewBox (for rendering)',
      holdType: hold.source || 'unknown'
    });
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
  
  // Always show all matches (outliers and inliers)
  let matches = processedMatches.value
  
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

// Wrapper functions that call the composable with component-specific data
const getKeypointRows = (frame) => {
  return processKeypointRows(frame, props.extractedFrames, props.bestMatchImage, props.boulderProblems)
}

// Handle keypoint row click
const handleKeypointRowClick = (keypoint) => {
  selectedKeypoint.value = keypoint;
};
</script>

