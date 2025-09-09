<!--
  PoseVisualizationOverlay - SVG-based pose visualization component
  
  Uses SVG overlays similar to BoulderImageWithHolds for reliable coordinate handling
  
  Props:
  - imageUrl: URL of the boulder image
  - imageRef: Ref to the image element for getting dimensions
  - transformedPoses: Array of pose data with coordinates
  - poseVisibility: Array indicating which poses are visible
  - holdDetectionResults: Hold detection results for proximity calculations
  - imageNaturalWidth: Natural width of the image
  - imageNaturalHeight: Natural height of the image
-->
<template>
  <svg
    v-if="shouldShowOverlay"
    class="absolute inset-0 w-full h-full pointer-events-none"
    :viewBox="viewBox"
    preserveAspectRatio="xMidYMid meet"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Define patterns for dashed lines -->
    <defs>
      <pattern id="dashed-line" patternUnits="userSpaceOnUse" width="8" height="1">
        <line x1="0" y1="0.5" x2="4" y2="0.5" stroke="black" stroke-width="1" opacity="0.6"/>
      </pattern>
    </defs>

    <!-- Draw poses -->
    <g v-for="(pose, poseIndex) in visiblePoses" :key="`pose-${poseIndex}-${pose.frameIndex}`">
      <!-- Draw keypoints as larger blue squares -->
      <g v-for="(point, pointIndex) in pose.transformedPoints" :key="`point-${pointIndex}`">
        <!-- Blue square for keypoint - made much bigger for better visibility -->
        <rect
          :x="point.x - 12"
          :y="point.y - 12"
          width="24"
          height="24"
          fill="rgba(59, 130, 246, 0.9)"
          stroke="white"
          stroke-width="3"
        />
        
        <!-- Find and draw closest hold -->
        <g v-if="getClosestHold(point.x, point.y)" :key="`hold-${pointIndex}`">
          <!-- Draw line to closest hold -->
          <line
            :x1="point.x"
            :y1="point.y"
            :x2="getClosestHold(point.x, point.y).x"
            :y2="getClosestHold(point.x, point.y).y"
            stroke="rgba(0, 0, 0, 0.6)"
            stroke-width="1"
            stroke-dasharray="4,2"
          />
          
          <!-- Draw small red circle for closest hold -->
          <circle
            :cx="getClosestHold(point.x, point.y).x"
            :cy="getClosestHold(point.x, point.y).y"
            r="2"
            fill="rgba(255, 0, 0, 0.8)"
            stroke="white"
            stroke-width="1"
          />
          
          <!-- Draw distance text -->
          <text
            :x="(point.x + getClosestHold(point.x, point.y).x) / 2"
            :y="(point.y + getClosestHold(point.x, point.y).y) / 2 - 2"
            font-family="Arial"
            font-size="10"
            font-weight="bold"
            fill="rgba(0, 0, 0, 0.9)"
            stroke="rgba(255, 255, 255, 0.9)"
            stroke-width="2"
            text-anchor="middle"
          >
            {{ Math.round(getClosestHold(point.x, point.y).distance) }}px
          </text>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  imageRef: {
    type: Object,
    default: null,
  },
  transformedPoses: {
    type: Array,
    default: () => [],
  },
  poseVisibility: {
    type: Array,
    default: () => [],
  },
  holdDetectionResults: {
    type: Object,
    default: null,
  },
  imageNaturalWidth: {
    type: Number,
    default: 0,
  },
  imageNaturalHeight: {
    type: Number,
    default: 0,
  },
});

// Create viewBox based on image natural dimensions
const viewBox = computed(() => {
  if (props.imageNaturalWidth && props.imageNaturalHeight) {
    return `0 0 ${props.imageNaturalWidth} ${props.imageNaturalHeight}`;
  }
  return '0 0 100 100'; // fallback
});

// Check if we should show the overlay
const shouldShowOverlay = computed(() => {
  return props.transformedPoses.length > 0 && 
         props.imageNaturalWidth > 0 && 
         props.imageNaturalHeight > 0;
});

// Get visible poses based on visibility array
const visiblePoses = computed(() => {
  return props.transformedPoses.filter((pose, index) => {
    return props.poseVisibility[index] !== false; // Show by default if not explicitly hidden
  });
});

// Helper function to extract hold coordinates in a consistent way
const extractHoldCoordinates = (hold) => {
  let holdX, holdY;

  if (hold.coordinates) {
    holdX = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
    holdY = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
  } else if (hold.bbox && Array.isArray(hold.bbox)) {
    holdX = hold.bbox[0] + hold.bbox[2] / 2;
    holdY = hold.bbox[1] + hold.bbox[3] / 2;
  } else if (hold.x !== undefined && hold.y !== undefined) {
    holdX = hold.x + (hold.width || 0) / 2;
    holdY = hold.y + (hold.height || 0) / 2;
  } else if (hold.center_x !== undefined && hold.center_y !== undefined) {
    holdX = hold.center_x;
    holdY = hold.center_y;
  } else {
    return null;
  }

  return { x: holdX, y: holdY };
};

// Find closest hold to a given point
const findClosestHold = (x, y) => {
  if (!props.holdDetectionResults?.results) return null;

  let closest = null;
  let minDistance = Infinity;

  props.holdDetectionResults.results.forEach((hold) => {
    const holdCoords = extractHoldCoordinates(hold);
    if (!holdCoords) return;

    const distance = Math.sqrt(
      Math.pow(holdCoords.x - x, 2) + Math.pow(holdCoords.y - y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = {
        x: holdCoords.x,
        y: holdCoords.y,
        distance: distance,
        hold: hold,
      };
    }
  });

  return closest;
};

// Get closest hold for a given point (used in template)
const getClosestHold = (x, y) => {
  return findClosestHold(x, y);
};
</script>
