<template>
  <div 
    v-if="result && result.composite_svg" 
    class="absolute inset-0 pointer-events-none"
    ref="overlayContainer"
  >
    <!-- SVG Overlay -->
    <div
      ref="svgContainer"
      class="absolute"
      :style="svgContainerStyle"
    >
      <div
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
            {{ visible ? 'Hide Overlay' : 'Show Overlay' }}
          </button>
          <button
            @click="resetOpacity"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reset Opacity
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    required: true
  },
  imageElement: {
    type: Object, // HTML img element
    required: true
  },
  showControls: {
    type: Boolean,
    default: true
  }
});

// Reactive state
const overlayContainer = ref(null);
const svgContainer = ref(null);
const opacity = ref(0.7);
const visible = ref(true);

// SVG positioning state
const svgPosition = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0
});

// Computed style for SVG container
const svgContainerStyle = computed(() => ({
  top: `${svgPosition.value.top}px`,
  left: `${svgPosition.value.left}px`,
  width: `${svgPosition.value.width}px`,
  height: `${svgPosition.value.height}px`,
  opacity: visible.value ? opacity.value : 0,
  transition: 'opacity 0.3s ease',
}));

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
  
  console.log('📐 Calculating SVG position:', {
    display: `${imgDisplayWidth}x${imgDisplayHeight}`,
    original: `${originalWidth}x${originalHeight}`
  });

  // Calculate aspect ratios
  const imageAspectRatio = originalWidth / originalHeight;
  const displayAspectRatio = imgDisplayWidth / imgDisplayHeight;

  let actualImageWidth, actualImageHeight;
  let offsetX = 0, offsetY = 0;

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

  console.log('📐 Calculated SVG positioning:', {
    actualSize: `${actualImageWidth}x${actualImageHeight}`,
    offset: `${offsetX}, ${offsetY}`,
    imageAspectRatio: imageAspectRatio.toFixed(3),
    displayAspectRatio: displayAspectRatio.toFixed(3)
  });

  // Update SVG position
  svgPosition.value = {
    top: offsetY,
    left: offsetX,
    width: actualImageWidth,
    height: actualImageHeight
  };
};

// Apply SVG attributes for perfect alignment
const applySvgAttributes = () => {
  nextTick(() => {
    const svgElement = svgContainer.value?.querySelector('svg');
    if (!svgElement || !props.result?.image_info) {
      return;
    }

    const { width: originalWidth, height: originalHeight } = props.result.image_info;

    // Set viewBox to match original image dimensions
    svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    
    // Scale SVG to fit exactly with no aspect ratio preservation
    svgElement.setAttribute('preserveAspectRatio', 'none');
    
    // Make SVG fill container completely
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.display = 'block';
    
    console.log('🎨 Applied SVG attributes:', {
      viewBox: `0 0 ${originalWidth} ${originalHeight}`,
      preserveAspectRatio: 'none'
    });
  });
};

// Update SVG opacity
const updateSvgOpacity = () => {
  const svgElement = svgContainer.value?.querySelector('svg');
  if (svgElement) {
    svgElement.style.opacity = visible.value ? opacity.value : 0;
  }
};

// Toggle overlay visibility
const toggleVisibility = () => {
  visible.value = !visible.value;
};

// Reset opacity to default
const resetOpacity = () => {
  opacity.value = 0.7;
};

// Recalculate positioning when needed
const recalculatePosition = () => {
  if (props.imageElement && props.result) {
    calculateSvgPosition();
    applySvgAttributes();
  }
};

// Watch for changes
watch(() => props.result, () => {
  console.log('🔄 Result changed, recalculating SVG position');
  nextTick(recalculatePosition);
}, { immediate: true });

watch(() => props.imageElement, () => {
  console.log('🔄 Image element changed, recalculating SVG position');
  nextTick(recalculatePosition);
}, { immediate: true });

watch(opacity, updateSvgOpacity);
watch(visible, updateSvgOpacity);

// Resize handler
let resizeObserver = null;

onMounted(() => {
  // Initial calculation
  nextTick(recalculatePosition);

  // Set up resize observer for the image element
  if (props.imageElement && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      console.log('🔄 Image resized, recalculating SVG position');
      recalculatePosition();
    });
    resizeObserver.observe(props.imageElement);
  }

  // Fallback: window resize listener
  window.addEventListener('resize', recalculatePosition);
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', recalculatePosition);
});

// Expose methods for parent component
defineExpose({
  recalculatePosition,
  setOpacity: (value) => { opacity.value = value; },
  setVisibility: (value) => { visible.value = value; },
});
</script>

<style scoped>
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
