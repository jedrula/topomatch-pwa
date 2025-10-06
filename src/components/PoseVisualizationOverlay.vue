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
        
        <!-- Draw closest hold if available -->
        <g v-if="pose.closestHolds && pose.closestHolds[pointIndex] && pose.closestHolds[pointIndex].coordinates && pose.closestHolds[pointIndex].coordinates.x !== null && pose.closestHolds[pointIndex].coordinates.y !== null" :key="`hold-${pointIndex}`">
          <!-- DEBUG: Log hold coordinates -->
          {{
            console.log(`🔴 Rendering red circle for keypoint ${pointIndex}:`, {
              keypointCoords: { x: point.x, y: point.y },
              holdCoords: pose.closestHolds[pointIndex].coordinates,
              distance: pose.closestHolds[pointIndex].distance,
              viewBox: viewBox
            })
          }}
          
          <!-- Draw line to closest hold -->
          <line
            :x1="point.x"
            :y1="point.y"
            :x2="pose.closestHolds[pointIndex].coordinates.x"
            :y2="pose.closestHolds[pointIndex].coordinates.y"
            stroke="rgba(0, 0, 0, 0.6)"
            stroke-width="1"
            stroke-dasharray="4,2"
          />
          
          <!-- Draw red circle for closest hold (winner) - made bigger and more visible -->
          <circle
            :cx="pose.closestHolds[pointIndex].coordinates.x"
            :cy="pose.closestHolds[pointIndex].coordinates.y"
            r="15"
            fill="rgba(239, 68, 68, 0.9)"
            stroke="white"
            stroke-width="3"
          />
          
          <!-- Optional: Add distance text -->
          <text
            :x="pose.closestHolds[pointIndex].coordinates.x + 12"
            :y="pose.closestHolds[pointIndex].coordinates.y - 8"
            font-size="12"
            fill="black"
            font-weight="bold"
            stroke="white"
            stroke-width="1"
          >
            {{ pose.closestHolds[pointIndex].distance }}px
          </text>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue';
import { getDetectionImageViewBox } from '@/utils/imageMetadata';

const props = defineProps({
  imageUrl: String,
  imageRef: Object,
  transformedPoses: Array,
  poseVisibility: Object,
  holdDetectionResults: Array,
  storedViewBox: Object,
  imageNaturalWidth: Number,
  imageNaturalHeight: Number
});

// Create viewBox using the same method as BoulderImageWithHolds
const viewBox = computed(() => {
  console.log('🖼️ PoseVisualizationOverlay viewBox calculation:', {
    holdDetectionResults: !!props.holdDetectionResults,
    storedViewBox: props.storedViewBox,
    imageUrl: props.imageUrl,
    imageNaturalWidth: props.imageNaturalWidth,
    imageNaturalHeight: props.imageNaturalHeight
  });
  
  // Use stored viewBox from Firestore if available
  if (props.storedViewBox) {
    // The stored viewBox is already a string like "0 0 1080 1440"
    console.log('✅ Using stored viewBox from Firestore:', props.storedViewBox);
    return props.storedViewBox;
  }
  
  // Fallback to detection-based viewBox calculation
  const calculatedViewBox = getDetectionImageViewBox(
    props.holdDetectionResults, 
    props.imageUrl, 
    null, 
    props.imageRef
  );
  
  console.log('✅ Using detection-based viewBox (fallback):', calculatedViewBox);
  return calculatedViewBox;
});

// Check if we should show the overlay
const shouldShowOverlay = computed(() => {
  return props.transformedPoses.length > 0;
});

// Get visible poses based on visibility array
const visiblePoses = computed(() => {
  // The parent component already filters poses, so just return them as-is
  console.log('🖼️ PoseVisualizationOverlay received poses:', props.transformedPoses.map(p => ({ frameIndex: p.frameIndex, color: p.color })));
  return props.transformedPoses;
});
</script>
