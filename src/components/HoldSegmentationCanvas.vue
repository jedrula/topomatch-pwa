<!-- 
HoldSegmentationCanvas.vue
Renders hold segmentation masks on canvas for precise visualization 
-->
<template>
  <canvas
    ref="segmentationCanvas"
    :width="canvasWidth"
    :height="canvasHeight"
    class="absolute inset-0 pointer-events-none"
    :style="{
      width: canvasWidth + 'px',
      height: canvasHeight + 'px',
    }"
  />
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  holds: {
    type: Array,
    default: () => [],
  },
  imageScale: {
    type: Number,
    default: 1,
  },
  selectedHoldIndex: {
    type: Number,
    default: -1,
  },
  canvasWidth: {
    type: Number,
    required: true,
  },
  canvasHeight: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['holdClick']);

const segmentationCanvas = ref(null);

/**
 * Get hold visualization color based on type and state
 */
const getHoldColor = (hold, index, isSelected = false) => {
  if (isSelected) {
    return { fill: 'rgba(59, 130, 246, 0.6)', stroke: 'rgb(59, 130, 246)' }; // Blue
  }

  // Default colors based on confidence
  const alpha = Math.min(0.7, Math.max(0.3, hold.confidence));
  const baseColor = hold.segmented ? '34, 197, 94' : '239, 68, 68'; // Green for segmented, red for bbox

  return {
    fill: `rgba(${baseColor}, ${alpha})`,
    stroke: `rgb(${baseColor})`,
  };
};

/**
 * Draw a segmentation mask on canvas
 */
const drawSegmentationMask = (ctx, hold, index) => {
  const isSelected = index === props.selectedHoldIndex;
  const colors = getHoldColor(hold, index, isSelected);

  if (hold.segmented && hold.segmentationMask) {
    // Draw precise segmentation mask
    const { pixels } = hold.segmentationMask;

    ctx.fillStyle = colors.fill;

    // Create path from mask pixels
    ctx.beginPath();
    const pixelClusters = clusterPixels(pixels);

    pixelClusters.forEach((cluster) => {
      if (cluster.length > 0) {
        // Start path at first pixel
        const firstPixel = cluster[0];
        ctx.moveTo(firstPixel.x * props.imageScale, firstPixel.y * props.imageScale);

        // Create rough outline by connecting cluster boundary pixels
        const boundary = getBoundaryPixels(cluster);
        boundary.forEach((pixel) => {
          ctx.lineTo(pixel.x * props.imageScale, pixel.y * props.imageScale);
        });

        ctx.closePath();
      }
    });

    ctx.fill();

    // Draw stroke outline
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
  } else {
    // Fall back to bounding box for non-segmented holds
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = isSelected ? 3 : 2;

    const x = hold.x * props.imageScale;
    const y = hold.y * props.imageScale;
    const width = hold.width * props.imageScale;
    const height = hold.height * props.imageScale;

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }
};

/**
 * Cluster nearby pixels to reduce noise
 */
const clusterPixels = (pixels) => {
  if (pixels.length === 0) return [];

  // Simple clustering: group pixels that are within 2 pixels of each other
  const clusters = [];
  const visited = new Set();

  pixels.forEach((pixel, index) => {
    if (visited.has(index)) return;

    const cluster = [pixel];
    visited.add(index);

    // Find nearby pixels
    pixels.forEach((otherPixel, otherIndex) => {
      if (visited.has(otherIndex)) return;

      const distance = Math.sqrt(
        Math.pow(pixel.x - otherPixel.x, 2) + Math.pow(pixel.y - otherPixel.y, 2)
      );

      if (distance <= 2) {
        cluster.push(otherPixel);
        visited.add(otherIndex);
      }
    });

    if (cluster.length > 5) {
      // Only include substantial clusters
      clusters.push(cluster);
    }
  });

  return clusters;
};

/**
 * Get boundary pixels for smoother outline drawing
 */
const getBoundaryPixels = (cluster) => {
  if (cluster.length === 0) return [];

  // Simple convex hull approximation
  // Sort pixels by angle from centroid
  const centroid = {
    x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
    y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length,
  };

  const sortedPixels = cluster.sort((a, b) => {
    const angleA = Math.atan2(a.y - centroid.y, a.x - centroid.x);
    const angleB = Math.atan2(b.y - centroid.y, b.x - centroid.x);
    return angleA - angleB;
  });

  // Take every nth pixel for smoother outline
  const step = Math.max(1, Math.floor(sortedPixels.length / 20));
  return sortedPixels.filter((_, index) => index % step === 0);
};

/**
 * Handle mouse clicks on canvas to detect hold selection
 */
const handleCanvasClick = (event) => {
  const canvas = segmentationCanvas.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / props.imageScale;
  const y = (event.clientY - rect.top) / props.imageScale;

  // Find which hold was clicked
  for (let index = props.holds.length - 1; index >= 0; index--) {
    const hold = props.holds[index];

    if (hold.segmented && hold.segmentationMask) {
      // Check if click is within segmentation mask
      const { pixels } = hold.segmentationMask;
      const clickedPixel = pixels.find(
        (pixel) => Math.abs(pixel.x - x) <= 1 && Math.abs(pixel.y - y) <= 1
      );

      if (clickedPixel) {
        emit('holdClick', hold, index);
        return;
      }
    } else {
      // Check if click is within bounding box
      if (x >= hold.x && x <= hold.x + hold.width && y >= hold.y && y <= hold.y + hold.height) {
        emit('holdClick', hold, index);
        return;
      }
    }
  }
};

/**
 * Redraw the canvas with current holds
 */
const redrawCanvas = () => {
  const canvas = segmentationCanvas.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all holds
  props.holds.forEach((hold, index) => {
    drawSegmentationMask(ctx, hold, index);
  });
};

// Watch for changes and redraw
watch(
  [() => props.holds, () => props.imageScale, () => props.selectedHoldIndex],
  () => {
    nextTick(() => {
      redrawCanvas();
    });
  },
  { deep: true }
);

onMounted(() => {
  const canvas = segmentationCanvas.value;
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick);
    redrawCanvas();
  }
});
</script>
