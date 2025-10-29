<!--
  BoulderImageWithHolds - A reusable component that displays a boulder image with hold highlights
  
  Props:
  - imageUrl: URL of the boulder image
  - imageAlt: Alt text for the image
  - problems: Array of boulder problems to highlight
  - imageClass: CSS classes for the image element
  - showHolds: Whether to show hold overlays (default: true)
  - selectedProblemId: ID of currently selected problem for highlighting
  
  Events:
  - problem-click: Emitted when a hold is clicked, passes problem object
  - problem-hover: Emitted when a hold is hovered, passes (problem, isEntering, event)
  - image-load: Emitted when image loads
-->
<template>
  <div class="relative">
    <img
      :ref="overlay.imageRef"
      :src="imageUrl"
      :alt="imageAlt"
      :class="imageClass"
      crossorigin="anonymous"
      @load="onImageLoad"
    />
    
    <!-- Hold Highlights SVG Overlay -->
    <svg
      v-if="overlay.isImageLoaded && showHolds && problems?.length > 0"
      class="absolute inset-0 w-full h-full pointer-events-none"
      :viewBox="imageViewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <template v-for="problem in problems" :key="problem.id">
        <HoldSvg
          v-for="(problemHold, holdIndex) in problem.holds"
          :key="`${problem.id}-${holdIndex}`"
          :svg-markup="problemHold.hold?.svgMarkup || ''"
          :interaction="selectedProblemId === problem.id ? 'hover' : 'default'"
          :interaction-allowed="'selectable'"
          :color="problem.color"
          class="pointer-events-auto cursor-pointer"
          @click="$emit('problem-click', problem)"
          @hover="(isEntering, event) => $emit('problem-hover', problem, isEntering, event)"
        />
      </template>
    </svg>
  </div>
</template>

<script setup>
import HoldSvg from './HoldSvg.vue';
import { useImageOverlay } from '@/composables/useImageOverlay';
import { computed } from 'vue';

const props = defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  imageAlt: {
    type: String,
    default: 'Boulder image',
  },
  problems: {
    type: Array,
    default: () => [],
  },
  imageClass: {
    type: String,
    default: 'w-full h-full object-cover',
  },
  showHolds: {
    type: Boolean,
    default: true,
  },
  selectedProblemId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['problem-click', 'problem-hover', 'image-load']);

// Use the image overlay composable
const overlay = useImageOverlay();

// Computed viewBox for the current image
const imageViewBox = computed(() => {
  // For boulder problems, we don't have the detection results directly
  // But we can try to get them from cache using the image URL
  return overlay.getViewBox(null, props.imageUrl);
});

// Wrap the image load handler to emit event
const onImageLoad = () => {
  overlay.handleImageLoad();
  // Emit for parent components that need to know when image loads
  emit('image-load');
};
</script>
