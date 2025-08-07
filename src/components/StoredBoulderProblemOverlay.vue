<template>
  <div
    v-if="problem && problem.holds && problem.holds.length > 0"
    class="absolute inset-0 pointer-events-none"
    ref="overlayContainer"
  >
    <!-- Boulder Problem SVG Overlay -->
    <div ref="svgContainer" class="absolute pointer-events-auto" :style="svgContainerStyle">
      <svg
        class="w-full h-full"
        :viewBox="svgViewBox"
        preserveAspectRatio="none"
        style="display: block"
      >
        <!-- Render each hold using its stored SVG markup -->
        <g
          v-for="(hold, index) in problem.holds"
          :key="`stored-hold-${hold.id || index}`"
          :data-hold-id="hold.id"
          :data-detection-index="hold.detectionIndex"
          class="stored-hold-group transition-all duration-200"
          :class="{
            'cursor-pointer': interactive,
            hovered: hoveredHoldIndex === index,
            highlighted: highlightedHolds.includes(hold.id || hold.holdIndex),
          }"
          :style="getHoldStyle(hold, index)"
          @click.stop="interactive && handleHoldClick(hold, index)"
          @mouseenter="handleHoldHover(hold, index, true)"
          @mouseleave="handleHoldHover(hold, index, false)"
        >
          <!-- Render the stored SVG markup directly -->
          <g v-if="hold.svgMarkup" v-html="hold.svgMarkup"></g>

          <!-- Fallback: render bounding box if no SVG markup -->
          <rect
            v-else
            :x="hold.coordinates?.x || hold.bbox?.[0] || 0"
            :y="hold.coordinates?.y || hold.bbox?.[1] || 0"
            :width="hold.coordinates?.width || hold.bbox?.[2] || 20"
            :height="hold.coordinates?.height || hold.bbox?.[3] || 20"
            fill="rgba(255, 0, 0, 0.3)"
            stroke="red"
            stroke-width="2"
          />

          <!-- Hold index label (optional) -->
          <text
            v-if="showHoldLabels"
            :x="(hold.coordinates?.x || hold.bbox?.[0] || 0) + 5"
            :y="(hold.coordinates?.y || hold.bbox?.[1] || 0) + 15"
            font-family="Arial, sans-serif"
            font-size="12"
            fill="white"
            stroke="black"
            stroke-width="0.5"
          >
            {{ hold.holdIndex !== undefined ? hold.holdIndex : index }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Problem Info Overlay -->
    <div
      v-if="showProblemInfo"
      class="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 pointer-events-auto z-10"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-4 h-4 rounded-full border-2 border-gray-300"
          :style="{ backgroundColor: problem.color }"
        ></div>
        <div>
          <div class="font-medium text-gray-900">{{ problem.name }}</div>
          <div class="text-sm text-gray-500">
            Grade {{ problem.grade }} • {{ problem.holds.length }} holds
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
  imageElement: {
    type: Object, // HTML img element
    required: true,
  },
  imageInfo: {
    type: Object, // { width, height } of original image
    required: true,
  },
  interactive: {
    type: Boolean,
    default: false,
  },
  showProblemInfo: {
    type: Boolean,
    default: true,
  },
  showHoldLabels: {
    type: Boolean,
    default: false,
  },
  highlightedHolds: {
    type: Array,
    default: () => [],
  },
  opacity: {
    type: Number,
    default: 0.8,
  },
});

const emit = defineEmits(["hold-click", "hold-hover"]);

// Reactive state
const overlayContainer = ref(null);
const svgContainer = ref(null);
const hoveredHoldIndex = ref(null);

// SVG positioning state
const svgPosition = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
});

// Computed viewBox for SVG
const svgViewBox = computed(() => {
  if (!props.imageInfo) return "0 0 1000 1000";
  const { width, height } = props.imageInfo;
  return `0 0 ${width} ${height}`;
});

// Computed style for SVG container
const svgContainerStyle = computed(() => ({
  top: `${svgPosition.value.top}px`,
  left: `${svgPosition.value.left}px`,
  width: `${svgPosition.value.width}px`,
  height: `${svgPosition.value.height}px`,
  opacity: props.opacity,
  transition: "opacity 0.3s ease",
}));

// Hold styling
const getHoldStyle = (hold, index) => {
  const isHovered = hoveredHoldIndex.value === index;
  const isHighlighted = props.highlightedHolds.includes(hold.id || hold.holdIndex);

  let styles = {};

  if (isHighlighted) {
    styles.filter = `drop-shadow(0 0 8px ${props.problem.color || "#3B82F6"})`;
    styles.opacity = "1";
  } else if (isHovered) {
    styles.filter = "drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))";
    styles.opacity = "0.9";
  } else {
    styles.opacity = "0.8";
  }

  return styles;
};

// Hold interaction handlers
const handleHoldClick = (hold, index) => {
  console.log(`🎯 Stored hold clicked:`, { hold, index });
  emit("hold-click", hold, index);
};

const handleHoldHover = (hold, index, isEntering) => {
  hoveredHoldIndex.value = isEntering ? index : null;
  emit("hold-hover", hold, index, isEntering);
};

// Calculate SVG positioning (same logic as ServerHoldOverlay)
const calculateSvgPosition = () => {
  if (!props.imageElement || !props.imageInfo) {
    return;
  }

  const img = props.imageElement;

  // Get actual displayed image dimensions
  const imgDisplayWidth = img.offsetWidth;
  const imgDisplayHeight = img.offsetHeight;

  if (imgDisplayWidth === 0 || imgDisplayHeight === 0) {
    // Image not fully loaded yet
    return;
  }

  // Get original image dimensions
  const originalWidth = props.imageInfo.width;
  const originalHeight = props.imageInfo.height;

  console.log("📐 Calculating stored hold SVG position:", {
    display: `${imgDisplayWidth}x${imgDisplayHeight}`,
    original: `${originalWidth}x${originalHeight}`,
  });

  // Calculate aspect ratios
  const imageAspectRatio = originalWidth / originalHeight;
  const displayAspectRatio = imgDisplayWidth / imgDisplayHeight;

  let actualImageWidth, actualImageHeight;
  let offsetX = 0,
    offsetY = 0;

  // The image uses object-fit: contain, so calculate actual rendered size
  if (imageAspectRatio > displayAspectRatio) {
    // Image is wider relative to display area - constrained by width
    actualImageWidth = imgDisplayWidth;
    actualImageHeight = imgDisplayWidth / imageAspectRatio;
    offsetY = (imgDisplayHeight - actualImageHeight) / 2;
  } else {
    // Image is taller relative to display area - constrained by height
    actualImageHeight = imgDisplayHeight;
    actualImageWidth = imgDisplayHeight * imageAspectRatio;
    offsetX = (imgDisplayWidth - actualImageWidth) / 2;
  }

  console.log("📐 Calculated stored hold SVG positioning:", {
    actualSize: `${actualImageWidth}x${actualImageHeight}`,
    offset: `${offsetX}, ${offsetY}`,
    imageAspectRatio: imageAspectRatio.toFixed(3),
    displayAspectRatio: displayAspectRatio.toFixed(3),
  });

  // Update SVG position
  svgPosition.value = {
    top: offsetY,
    left: offsetX,
    width: actualImageWidth,
    height: actualImageHeight,
  };
};

// Public method for recalculating position
const recalculatePosition = () => {
  calculateSvgPosition();
};

// Watchers and lifecycle
watch(() => props.imageElement, calculateSvgPosition);
watch(() => props.imageInfo, calculateSvgPosition);
watch(() => props.problem, calculateSvgPosition);

// ResizeObserver for responsive updates
let resizeObserver = null;

onMounted(() => {
  calculateSvgPosition();

  // Set up ResizeObserver for dynamic repositioning
  if (props.imageElement) {
    resizeObserver = new ResizeObserver(() => {
      console.log("🔄 Image resized, recalculating stored hold overlay position...");
      setTimeout(calculateSvgPosition, 50);
    });
    resizeObserver.observe(props.imageElement);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// Expose public methods
defineExpose({
  recalculatePosition,
});
</script>

<style scoped>
/* Stored hold styling */
.stored-hold-group {
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.stored-hold-group.cursor-pointer:hover {
  opacity: 0.9;
}

.stored-hold-group.hovered {
  opacity: 0.9;
}

.stored-hold-group.highlighted {
  opacity: 1;
}

/* Enhanced styling for stored SVG markups */
.stored-hold-group :deep(*) {
  transition: fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease;
}

/* Hover effects for interactive mode */
.stored-hold-group.cursor-pointer:hover :deep(*) {
  opacity: 0.9 !important;
  stroke-width: 2px !important;
}

/* Highlighted hold effects */
.stored-hold-group.highlighted :deep(*) {
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 8px currentColor);
}
</style>
