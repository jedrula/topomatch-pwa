<template>
  <div
    v-if="
      result &&
      (result.composite_svg ||
        (result.svg_markups && result.holds) ||
        (result.svg_files && result.holds))
    "
    class="absolute inset-0 pointer-events-none"
    ref="overlayContainer"
  >
    <!-- Interactive SVG Overlay -->
    <div ref="svgContainer" class="absolute pointer-events-auto" :style="svgContainerStyle">
      <!-- Interactive Mode: Individual hold SVGs -->
      <svg
        v-if="result.svg_markups && result.holds && result.svg_markups.length > 0"
        class="w-full h-full"
        :viewBox="svgViewBox"
        preserveAspectRatio="none"
        style="display: block"
      >
        <!-- Individual hold groups for interaction using new svg_markups -->
        <g
          v-for="(svgMarkup, index) in result.svg_markups"
          :key="`hold-${result.holds[index]?.id || index}`"
          :data-hold-index="index"
          :data-hold-id="result.holds[index]?.id"
          class="hold-svg-group cursor-pointer transition-all duration-200"
          :style="getHoldStyle(index)"
          @click.stop="handleHoldClick(result.holds[index], index)"
          @mouseenter="handleHoldHover(index, true)"
          @mouseleave="handleHoldHover(index, false)"
        >
          <!-- Render inline SVG content directly -->
          <g v-html="svgMarkup"></g>
        </g>
      </svg>

      <!-- Fallback: Legacy svg_files support -->
      <svg
        v-else-if="result.svg_files && result.holds && result.svg_files.length > 0"
        class="w-full h-full"
        :viewBox="svgViewBox"
        preserveAspectRatio="none"
        style="display: block"
      >
        <!-- Individual hold groups for interaction using legacy svg_files -->
        <g
          v-for="(svgContent, index) in result.svg_files"
          :key="`hold-${result.holds[index]?.id || index}`"
          :data-hold-index="index"
          class="hold-svg-group cursor-pointer transition-all duration-200"
          :style="getHoldStyle(index)"
          @click.stop="handleHoldClick(result.holds[index], index)"
          @mouseenter="handleHoldHover(index, true)"
          @mouseleave="handleHoldHover(index, false)"
        >
          <!-- Render individual SVG content -->
          <g v-html="cleanSvgContent(svgContent)"></g>
        </g>
      </svg>

      <!-- Fallback: Composite SVG (non-interactive) -->
      <div
        v-else-if="result.composite_svg"
        v-html="result.composite_svg"
        class="w-full h-full"
        @load="onSvgLoad"
      />
    </div>

    <!-- Overlay Controls -->
    <div
      v-if="showControls"
      class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 pointer-events-auto z-10"
    >
      <div class="space-y-3">
        <!-- Opacity Control -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            SVG Overlay Opacity:
            <span class="inline-block ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
              {{ Math.round(opacity * 100) }}%
            </span>
          </label>
          <input
            v-model.number="opacity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            @input="updateSvgOpacity"
          />
        </div>

        <!-- Toggle Visibility -->
        <div class="flex space-x-2">
          <button
            @click="toggleVisibility"
            class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {{ visible ? "Hide Overlay" : "Show Overlay" }}
          </button>
          <button
            @click="resetOpacity"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset Opacity
          </button>
        </div>

        <!-- Interactive Mode Indicator -->
        <div
          v-if="(result.svg_markups && result.holds) || (result.svg_files && result.holds)"
          class="pt-2 border-t border-gray-200"
        >
          <p class="text-xs text-gray-600">💡 Click on holds to select them for boulder problems</p>
          <p v-if="result.svg_markups" class="text-xs text-green-600 mt-1">
            ✨ Using enhanced inline SVG markup
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  imageElement: {
    type: Object, // HTML img element
    required: true,
  },
  showControls: {
    type: Boolean,
    default: true,
  },
  selectedHolds: {
    type: Array,
    default: () => [],
  },
  activeColor: {
    type: String,
    default: "#3B82F6", // Blue
  },
});

const emit = defineEmits(["hold-click", "hold-hover"]);

// Reactive state
const overlayContainer = ref(null);
const svgContainer = ref(null);
const opacity = ref(0.7);
const visible = ref(true);
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
  if (!props.result?.image_info) return "0 0 1000 1000";
  const { width, height } = props.result.image_info;
  return `0 0 ${width} ${height}`;
});

// Computed style for SVG container
const svgContainerStyle = computed(() => ({
  top: `${svgPosition.value.top}px`,
  left: `${svgPosition.value.left}px`,
  width: `${svgPosition.value.width}px`,
  height: `${svgPosition.value.height}px`,
  opacity: visible.value ? opacity.value : 0,
  transition: "opacity 0.3s ease",
}));

// Interactive hold styling
const getHoldStyle = (holdIndex) => {
  const isSelected = props.selectedHolds.includes(holdIndex);
  const isHovered = hoveredHoldIndex.value === holdIndex;

  let styles = {};

  if (isSelected) {
    styles.filter = `drop-shadow(0 0 8px ${props.activeColor})`;
    styles.opacity = "1";
  } else if (isHovered) {
    styles.filter = "drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))";
    styles.opacity = "0.8";
  } else {
    styles.opacity = "0.7";
  }

  return styles;
};

// Clean SVG content for rendering
const cleanSvgContent = (svgContent) => {
  if (!svgContent) return "";

  // Remove SVG wrapper tags if present, keeping only inner content
  let cleaned = svgContent.trim();

  // Remove outer <svg> tags if they exist
  cleaned = cleaned.replace(/^<svg[^>]*>/, "");
  cleaned = cleaned.replace(/<\/svg>$/, "");

  return cleaned;
};

// Hold interaction handlers
const handleHoldClick = (hold, index) => {
  console.log(`🎯 Hold clicked:`, { hold, index });
  emit("hold-click", hold, index);
};

const handleHoldHover = (index, isEntering) => {
  hoveredHoldIndex.value = isEntering ? index : null;
  emit("hold-hover", index, isEntering);
};

// Calculate SVG positioning (from playground logic)
const calculateSvgPosition = () => {
  if (!props.imageElement || !props.result?.image_info) {
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

  // Get original image dimensions from server result
  const originalWidth = props.result.image_info.width;
  const originalHeight = props.result.image_info.height;

  console.log("📐 Calculating SVG position:", {
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

  console.log("📐 Calculated SVG positioning:", {
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

// Control functions
const updateSvgOpacity = () => {
  // Opacity is already reactive via computed style
};

const toggleVisibility = () => {
  visible.value = !visible.value;
};

const resetOpacity = () => {
  opacity.value = 0.7;
};

const onSvgLoad = () => {
  applySvgAttributes();
};

// Apply SVG attributes for perfect alignment (for fallback composite SVG)
const applySvgAttributes = () => {
  nextTick(() => {
    const svgElement = svgContainer.value?.querySelector("svg");
    if (!svgElement || !props.result?.image_info) {
      return;
    }

    const { width: originalWidth, height: originalHeight } = props.result.image_info;

    // Set viewBox to match original image dimensions
    svgElement.setAttribute("viewBox", `0 0 ${originalWidth} ${originalHeight}`);

    // Scale SVG to fit exactly with no aspect ratio preservation
    svgElement.setAttribute("preserveAspectRatio", "none");

    // Make SVG fill container completely
    svgElement.style.width = "100%";
    svgElement.style.height = "100%";
    svgElement.style.display = "block";

    console.log("🎨 Applied SVG attributes:", {
      viewBox: `0 0 ${originalWidth} ${originalHeight}`,
      preserveAspectRatio: "none",
    });
  });
};

// Public method for recalculating position
const recalculatePosition = () => {
  calculateSvgPosition();
  applySvgAttributes();
};

// Watchers and lifecycle
watch(() => props.imageElement, calculateSvgPosition);
watch(
  () => props.result,
  () => {
    calculateSvgPosition();
    applySvgAttributes();
  }
);

// ResizeObserver for responsive updates
let resizeObserver = null;

onMounted(() => {
  calculateSvgPosition();
  applySvgAttributes();

  // Set up ResizeObserver for dynamic repositioning
  if (props.imageElement) {
    resizeObserver = new ResizeObserver(() => {
      console.log("🔄 Image resized, recalculating SVG overlay position...");
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
/* Interactive hold styling */
.hold-svg-group {
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.hold-svg-group:hover {
  opacity: 0.9;
}

/* Enhanced hold styling for inline SVG markups */
.hold-svg-group :deep(.hold-*) {
  transition: fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease;
}

/* Confidence-based styling for holds */
.hold-svg-group.confidence-high :deep(.hold-*) {
  fill: rgba(100, 255, 100, 0.8) !important;
  stroke: rgb(50, 200, 50) !important;
}

.hold-svg-group.confidence-medium :deep(.hold-*) {
  fill: rgba(255, 200, 100, 0.8) !important;
  stroke: rgb(200, 150, 50) !important;
}

.hold-svg-group.confidence-low :deep(.hold-*) {
  fill: rgba(255, 100, 100, 0.6) !important;
  stroke: rgb(200, 50, 50) !important;
}

/* Selection highlighting */
.hold-svg-group.selected :deep(.hold-*) {
  stroke-width: 3px !important;
  filter: drop-shadow(0 0 8px currentColor);
}

/* Hover effects */
.hold-svg-group:hover :deep(.hold-*) {
  opacity: 0.9 !important;
  stroke-width: 2px !important;
}

/* Custom slider styles */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

input[type="range"]::-webkit-slider-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
}

input[type="range"]::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
}
</style>
