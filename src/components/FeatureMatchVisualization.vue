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

    <!-- Pose Keypoint Transformation Visualization -->
    <div v-if="poseKeypoints.length > 0 && homographyMatrix" class="mt-4">
      <h6 class="text-xs font-medium text-gray-700 mb-2">Pose Keypoint Transformation via Homography</h6>
      <div class="relative border rounded bg-gray-50 p-2">
        <svg
          v-if="canRenderPoseTransformation"
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

          <!-- Pose keypoint transformation lines -->
          <g v-for="(transform, index) in poseTransformations" :key="`pose-line-${index}`">
            <line
              :x1="transform.sourcePoint.x"
              :y1="transform.sourcePoint.y"
              :x2="transform.targetPoint.x"
              :y2="transform.targetPoint.y"
              stroke="#ff6b35"
              stroke-width="3"
              opacity="0.8"
              stroke-dasharray="5,3"
            />
          </g>

          <!-- Source pose keypoints -->
          <g v-for="(transform, index) in poseTransformations" :key="`pose-source-${index}`">
            <circle
              :cx="transform.sourcePoint.x"
              :cy="transform.sourcePoint.y"
              r="6"
              fill="#ef4444"
              stroke="white"
              stroke-width="2"
            />
            <text
              :x="transform.sourcePoint.x + 8"
              :y="transform.sourcePoint.y - 8"
              font-size="12"
              fill="#dc2626"
              font-weight="bold"
            >{{ index }}</text>
          </g>

          <!-- Transformed pose keypoints -->
          <g v-for="(transform, index) in poseTransformations" :key="`pose-target-${index}`">
            <circle
              :cx="transform.targetPoint.x"
              :cy="transform.targetPoint.y"
              r="6"
              fill="#22c55e"
              stroke="white"
              stroke-width="2"
            />
            <text
              :x="transform.targetPoint.x + 8"
              :y="transform.targetPoint.y - 8"
              font-size="12"
              fill="#16a34a"
              font-weight="bold"
            >{{ index }}</text>
          </g>
        </svg>
        
        <div v-if="!canRenderPoseTransformation" class="text-center py-8 text-gray-500 text-sm">
          Waiting for images to load...
        </div>
      </div>
      
      <!-- Pose transformation legend -->
      <div v-if="poseKeypoints.length > 0 && homographyMatrix" class="mt-2 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-1">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Source pose keypoints ({{ poseKeypoints.length }})</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Transformed keypoints</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-6 h-0.5 bg-orange-500" style="border-top: 3px dashed #ff6b35;"></div>
            <span>Transformation paths</span>
          </div>
        </div>
        <div class="text-gray-600">
          Numbers = keypoint index
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

// Process matches to add inlier/outlier information
const processedMatches = computed(() => {
  if (!props.featureMatches.length) return []
  
  // Mark inliers vs outliers based on homography inliers count
  return props.featureMatches.map((match, index) => ({
    ...match,
    isInlier: index < props.homographyInliers
  }))
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

// Check if we can render pose transformation
const canRenderPoseTransformation = computed(() => {
  const result = canRenderCombinedView.value && props.poseKeypoints.length > 0 && props.homographyMatrix
  console.log('🎯 canRenderPoseTransformation:', {
    canRenderCombinedView: canRenderCombinedView.value,
    poseKeypointsLength: props.poseKeypoints.length,
    hasHomographyMatrix: !!props.homographyMatrix,
    result
  })
  return result
})

// Transform pose keypoints using homography matrix
const poseTransformations = computed(() => {
  console.log('🎯 Pose transformation check:', {
    canRender: canRenderPoseTransformation.value,
    poseKeypoints: props.poseKeypoints?.length || 0,
    homographyMatrix: props.homographyMatrix ? 'present' : 'missing',
    keypointsSample: props.poseKeypoints?.slice(0, 2)
  })
  
  if (!canRenderPoseTransformation.value) return []
  
  const transforms = props.poseKeypoints.map((keypoint, index) => {
    // Transform keypoint using homography matrix
    const transformedPoint = transformPointWithHomography(
      keypoint.x, 
      keypoint.y, 
      props.homographyMatrix
    )
    
    console.log(`🎯 Keypoint ${index}:`, {
      original: { x: keypoint.x, y: keypoint.y },
      transformed: transformedPoint
    })
    
    // Scale for display
    const sourceScaleX = sourceImageDimensions.value.naturalWidth > 0 ? 
      sourceImageScale.value.width / sourceImageDimensions.value.naturalWidth : 0
    const sourceScaleY = sourceImageDimensions.value.naturalHeight > 0 ? 
      sourceImageScale.value.height / sourceImageDimensions.value.naturalHeight : 0
    const targetScaleX = targetImageDimensions.value.naturalWidth > 0 ? 
      targetImageScale.value.width / targetImageDimensions.value.naturalWidth : 0
    const targetScaleY = targetImageDimensions.value.naturalHeight > 0 ? 
      targetImageScale.value.height / targetImageDimensions.value.naturalHeight : 0
    
    return {
      index,
      sourcePoint: {
        x: keypoint.x * sourceScaleX,
        y: keypoint.y * sourceScaleY
      },
      targetPoint: {
        x: sourceImageScale.value.width + 20 + (transformedPoint.x * targetScaleX),
        y: transformedPoint.y * targetScaleY
      }
    }
  }).filter(transform => {
    // Filter out invalid transformations
    return (
      !isNaN(transform.sourcePoint.x) && !isNaN(transform.sourcePoint.y) &&
      !isNaN(transform.targetPoint.x) && !isNaN(transform.targetPoint.y) &&
      isFinite(transform.sourcePoint.x) && isFinite(transform.sourcePoint.y) &&
      isFinite(transform.targetPoint.x) && isFinite(transform.targetPoint.y)
    )
  })
  
  console.log('🎯 Final transformations:', transforms.length, transforms.slice(0, 2))
  return transforms
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
</script>
