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
              v-for="(match, index) in featureMatches"
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
              v-for="(match, index) in featureMatches"
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
          v-if="combinedDimensions.width > 0"
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
          <g v-for="(match, index) in visibleMatches" :key="`line-${index}`">
            <line
              :x1="(match.point1.x / sourceImageDimensions.naturalWidth) * sourceImageScale.width"
              :y1="(match.point1.y / sourceImageDimensions.naturalHeight) * sourceImageScale.height"
              :x2="sourceImageScale.width + 20 + (match.point2.x / targetImageDimensions.naturalWidth) * targetImageScale.width"
              :y2="(match.point2.y / targetImageDimensions.naturalHeight) * targetImageScale.height"
              :stroke="match.isInlier ? '#22c55e' : '#ef4444'"
              :stroke-width="match.isInlier ? '1.5' : '1'"
              :opacity="match.isInlier ? '0.8' : '0.4'"
            />
          </g>

          <!-- Feature points on combined view -->
          <g v-for="(match, index) in visibleMatches" :key="`points-${index}`">
            <!-- Source point -->
            <circle
              :cx="(match.point1.x / sourceImageDimensions.naturalWidth) * sourceImageScale.width"
              :cy="(match.point1.y / sourceImageDimensions.naturalHeight) * sourceImageScale.height"
              r="2"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              stroke="white"
              stroke-width="0.5"
            />
            <!-- Target point -->
            <circle
              :cx="sourceImageScale.width + 20 + (match.point2.x / targetImageDimensions.naturalWidth) * targetImageScale.width"
              :cy="(match.point2.y / targetImageDimensions.naturalHeight) * targetImageScale.height"
              r="2"
              :fill="match.isInlier ? '#22c55e' : '#ef4444'"
              stroke="white"
              stroke-width="0.5"
            />
          </g>
        </svg>
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

// Filter matches for display
const visibleMatches = computed(() => {
  let matches = processedMatches.value
  
  if (!showOutliers.value) {
    matches = matches.filter(match => match.isInlier)
  }
  
  if (maxDisplayMatches.value < 999) {
    matches = matches.slice(0, maxDisplayMatches.value)
  }
  
  return matches
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
