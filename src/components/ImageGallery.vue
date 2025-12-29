<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
    @click="closeOnBackdrop"
    @keydown.esc="closeGallery"
    @keydown.left="previousImage"
    @keydown.right="nextImage"
    tabindex="0"
  >
    <!-- Close button -->
    <button
      @click="closeGallery"
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Image counter -->
    <div class="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
      {{ currentIndex + 1 }} / {{ images.length }}
    </div>

    <!-- Previous button -->
    <button
      v-if="images.length > 1"
      @click="previousImage"
      class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
      :disabled="currentIndex === 0"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === 0 }"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Next button -->
    <button
      v-if="images.length > 1"
      @click="nextImage"
      class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
      :disabled="currentIndex === images.length - 1"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === images.length - 1 }"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Main image -->
    <div class="max-w-[90vw] max-h-[90vh] flex items-center justify-center relative" @click.stop="handleImageContainerClick">
      <div class="relative">
        <picture
          v-if="currentImage"
          :key="currentImage.id"
        >
          <!-- WebP sources for modern browsers -->
          <source 
            :srcset="getResponsiveImageSrcset(currentImage.url, 'webp')"
            sizes="(max-width: 768px) 800px, (max-width: 1920px) 1920px, 100vw"
            type="image/webp"
            crossorigin="anonymous"
          />
          <!-- JPEG fallback for older browsers -->
          <source 
            :srcset="getResponsiveImageSrcset(currentImage.url, 'jpeg')"
            sizes="(max-width: 768px) 800px, (max-width: 1920px) 1920px, 100vw"
            type="image/jpeg"
            crossorigin="anonymous"
          />
          <!-- Fallback img element -->
          <img
            :src="getOptimalImageUrl(currentImage.url, 1920)"
            :alt="currentImage.name"
            class="max-w-full max-h-full object-contain"
            crossorigin="anonymous"
            @load="overlay.handleImageLoad"
            :ref="overlay.imageRef"
            loading="lazy"
          />
        </picture>

        <!-- Boulder Problems SVG Overlay -->
        <svg
          v-if="overlay.isImageLoaded && currentImageProblems.length > 0"
          :key="`overlay-${currentImage?.id}`"
          class="absolute inset-0 w-full h-full"
          :viewBox="imageViewBox"
          preserveAspectRatio="none"
          style="pointer-events: none;"
        >
          <!-- Problem Holds as SVGs -->
          <template v-for="problem in currentImageProblems" :key="problem.id">
            <HoldSvg
              v-for="(problemHold, holdIndex) in problem.holds"
              :data-problem-id="problem.id"
              :key="`${problem.id}-${holdIndex}`"
              :svg-markup="ensureHoldHasSvgMarkup(problemHold.hold).svgMarkup"
              :interaction="getProblemInteraction(problem.id)"
              :interaction-allowed="'selectable'"
              :color="problem.color"
              @click="handleProblemClick(problem, $event)"
              @hover="(isEntering, event) => handleProblemHover(problem.id, isEntering, event)"
            />
          </template>
        </svg>
      </div>
    </div>

    <!-- Image info overlay -->
    <div
      class="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded"
    >
      <div class="text-sm font-medium">{{ currentImage?.name }}</div>
      <div class="text-xs text-gray-300 mt-1">
        Click and drag to pan • Use arrow keys to navigate • Press ESC to close
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div
      v-if="images.length > 1"
      class="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded max-w-[90vw] overflow-x-auto"
    >
      <button
        v-for="(image, index) in images"
        :key="image.id"
        @click="goToImage(index)"
        class="flex-shrink-0 w-16 h-16 rounded overflow-hidden transition-all"
        :class="
          index === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-80'
        "
      >
        <img 
          :src="getResizedImageUrl(image.url, '300x300', 'webp')" 
          :alt="image.name" 
          class="w-full h-full object-cover"
          crossorigin="anonymous"
          loading="lazy"
        />
      </button>
    </div>

    <!-- Floating Problem Card Tooltip -->
    <FloatingBoulderProblemCard
      :visible="floatingCard.visible"
      :problem="floatingCard.problem"
      :position="floatingCard.position"
      :location-id="locationId"
      @edit="handleFloatingCardEdit"
      @toggle-visibility="handleFloatingCardToggleVisibility"
      @show-videos="handleFloatingCardShowVideos"
      @mouse-enter="handleFloatingCardMouseEnter"
      @mouse-leave="handleFloatingCardMouseLeave"
    />
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HoldSvg from './HoldSvg.vue';
import FloatingBoulderProblemCard from './FloatingBoulderProblemCard.vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { ensureHoldHasSvgMarkup } from '@/utils/svgUtils.js';
import { getResizedImageUrl, getOptimalImageUrl } from '@/utils/imageResize.js';
import { useImageOverlay } from '@/composables/useImageOverlay.js';
import { getCachedDetectionResult } from '@/services/detectionCacheService.js';
import { getDefaultCompressionSettings } from '@/utils/imageMetadata.js';

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  locationId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'navigate']);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();

// Detection results for proper overlay calculation
const detectionResults = ref(null);

// Boulder problems functionality
const hoveredProblemId = ref(null);

// Mobile tap-to-toggle functionality
const tappedProblemId = ref(null);

// Current image computed
const currentImage = computed(() => {
  if (!props.images || props.images.length === 0) return null;

  const imageId = route.query.imageId;
  if (imageId) {
    const foundImage = props.images.find((img) => img.id === imageId);
    if (foundImage) return foundImage;
  }

  return props.images[props.initialIndex] || props.images[0];
});

// Use the image overlay composable
const overlay = useImageOverlay();

// Computed viewBox for the current image
const imageViewBox = computed(() => {
  // Use detection results if available for accurate viewBox calculation
  if (detectionResults.value) {
    const imageInfo = detectionResults.value.image_info;
    if (imageInfo && imageInfo.width && imageInfo.height) {
      return `0 0 ${imageInfo.width} ${imageInfo.height}`;
    }
  }
  
  // Fallback to overlay composable approach
  const imageUrl = currentImage.value?.url;
  return overlay.getViewBox(null, imageUrl);
});
const isTouchDevice = ref(false);

// Floating problem card state
const floatingCard = ref({
  visible: false,
  problem: null,
  position: { x: 0, y: 0 },
});

// Timeout for tooltip hiding
let tooltipHideTimeout = null;

const currentIndex = computed(() => {
  // Get imageId from URL if available
  const imageId = route.query.imageId;
  if (imageId !== undefined) {
    const index = props.images.findIndex((img) => img.id === imageId);
    return index !== -1 ? index : props.initialIndex;
  }
  return props.initialIndex;
});

// Boulder problems for the current image
const currentImageProblems = computed(() => {
  if (!currentImage.value || !boulderProblemsStore.boulderProblems.length) {
    return [];
  }

  // Filter problems for this specific image
  return boulderProblemsStore.boulderProblems.filter(
    (problem) => problem.imageId === currentImage.value.id
  );
});

const closeGallery = () => {
  // Remove imageId query parameter to close gallery
  const query = { ...route.query };
  delete query.imageId;
  router.push({ query });
  emit('close');
};

const closeOnBackdrop = (event) => {
  if (event.target === event.currentTarget) {
    closeGallery();
  }
};

const previousImage = () => {
  if (currentIndex.value > 0) {
    navigateToImage(currentIndex.value - 1);
  }
};

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    navigateToImage(currentIndex.value + 1);
  }
};

const goToImage = (index) => {
  navigateToImage(index);
};

const navigateToImage = (index) => {
  const clampedIndex = Math.max(0, Math.min(index, props.images.length - 1));
  const imageId = props.images[clampedIndex]?.id;

  if (imageId) {
    router.push({
      query: { ...route.query, imageId },
    });
  }
  emit('navigate', clampedIndex);
};

// Touch device detection
const detectTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
};

// Initialize touch detection
onMounted(() => {
  isTouchDevice.value = detectTouchDevice();
});

// Helper function to generate responsive srcset
const getResponsiveImageSrcset = (originalUrl, format = 'webp') => {
  const mobile = getResizedImageUrl(originalUrl, '800x600', format);
  const desktop = getResizedImageUrl(originalUrl, '1920x1440', format);
  return `${mobile} 800w, ${desktop} 1920w`;
};

// Get interaction state for a problem (handles both hover and tap states)
const getProblemInteraction = (problemId) => {
  // On touch devices, prioritize tapped state over hover
  if (isTouchDevice.value && tappedProblemId.value === problemId) {
    return 'hover'; // Use 'hover' interaction for visual consistency
  }
  // On non-touch devices or when nothing is tapped, use hover state
  if (hoveredProblemId.value === problemId) {
    return 'hover';
  }
  return 'default';
};

// Handle click/tap on problem holds
const handleProblemClick = (problem, event) => {
  if (isTouchDevice.value) {
    // On touch devices, toggle the tapped state
    if (tappedProblemId.value === problem.id) {
      // Tapping the same problem again - hide tooltip and deselect
      tappedProblemId.value = null;
      floatingCard.value.visible = false;
    } else {
      // Tapping a different problem - show tooltip and select
      tappedProblemId.value = problem.id;
      showFloatingCard(problem, event);
    }
  } else {
    // On non-touch devices, navigate to problem detail (original behavior)
    goToProblemDetail(problem);
  }
};

// Helper function to show floating card
const showFloatingCard = (problem, event) => {
  const rect = event.target.getBoundingClientRect();
  const mouseX = rect.left + rect.width / 2;
  const mouseY = rect.top + rect.height / 2;
  
  floatingCard.value = {
    visible: true,
    problem: problem,
    position: { x: mouseX, y: mouseY },
  };
};

const goToProblemDetail = (problem) => {
  router.push({
    name: 'boulder-problem-detail',
    params: {
      locationId: props.locationId,
      problemId: problem.id,
    },
  });
};

// Handle clicks on the image container (for "click outside" behavior on mobile)
const handleImageContainerClick = (event) => {
  // On touch devices, if clicking outside of holds (on the image itself),
  // hide any active tooltips
  if (isTouchDevice.value && tappedProblemId.value !== null) {
    // Check if the click target is not a hold SVG element
    const isClickOnHold = event.target.closest('[data-problem-id]');
    if (!isClickOnHold) {
      tappedProblemId.value = null;
      floatingCard.value.visible = false;
    }
  }
};

const handleProblemHover = (problemId, isEntering, event) => {
  // Clear any pending hide timeout
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }

  if (isEntering && event) {
    // Find the problem data
    const problem = currentImageProblems.value.find((p) => p.id === problemId);

    if (problem) {
      // Position tooltip near the mouse cursor
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      // Show floating card at mouse position
      floatingCard.value = {
        visible: true,
        problem: problem,
        position: { x: mouseX, y: mouseY },
      };
    }

    hoveredProblemId.value = problemId;
  } else {
    // Don't hide immediately - use a delay to allow moving to tooltip
    tooltipHideTimeout = setTimeout(() => {
      floatingCard.value.visible = false;
      hoveredProblemId.value = null;
    }, 300); // 300ms delay
  }
};

// Watch for route changes to update current image
watch(
  () => route.query.image,
  (newImageIndex) => {
    if (newImageIndex !== undefined && props.isOpen) {
      const index = parseInt(newImageIndex);
      if (!isNaN(index)) {
        emit('navigate', index);
      }
    }
  }
);

// Watch for current image changes to load detection results
watch(
  currentImage,
  async (newImage) => {
    if (newImage?.url) {
      try {
        const defaultSettings = getDefaultCompressionSettings();
        const cachedResult = await getCachedDetectionResult(newImage.url, defaultSettings);
        detectionResults.value = cachedResult;
      } catch (error) {
        console.error('Error loading detection results:', error);
        detectionResults.value = null;
      }
    } else {
      detectionResults.value = null;
    }
  },
  { immediate: true }
);

// Watch for current image changes to reset loaded state
watch(
  () => currentImage.value,
  () => {
    overlay.isImageLoaded.value = false;
    // Also hide any visible tooltip when changing images
    floatingCard.value.visible = false;
    hoveredProblemId.value = null;
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
  }
);

// Load boulder problems when gallery opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.locationId) {
      try {
        await boulderProblemsStore.initializeForLocation(props.locationId);
        if (!boulderProblemsStore.boulderProblems.length) {
          await boulderProblemsStore.loadBoulderProblems(props.locationId);
        }
      } catch (error) {
        console.error('Error loading boulder problems:', error);
      }
    }
  },
  { immediate: true }
);

// Floating card event handlers
const handleFloatingCardEdit = (problem) => {
  // Navigate to HoldDetectionServerView with editing state
  router.push({
    name: 'location-hold-detection-server',
    params: {
      locationId: props.locationId,
    },
    query: {
      imageId: currentImage.value?.id,
      imageName: currentImage.value?.name,
      editingProblemId: problem.id,
    },
  });
};

const handleFloatingCardToggleVisibility = (problem) => {
  // Check if we're showing only this problem or showing all problems
  if (boulderProblemsStore.isShowingOnlyOneProblem && !problem.hidden) {
    // Currently showing only this problem - show all problems
    boulderProblemsStore.showAllProblems();
  } else {
    // Show only this problem (hide all others)
    boulderProblemsStore.showOnlyProblem(problem.id);
  }
};

const handleFloatingCardMouseEnter = () => {
  // Clear any pending hide timeout when mouse enters the tooltip
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
};

const handleFloatingCardMouseLeave = () => {
  // Hide the tooltip when mouse leaves it
  tooltipHideTimeout = setTimeout(() => {
    floatingCard.value.visible = false;
    hoveredProblemId.value = null;
  }, 200); // Shorter delay when leaving tooltip
};

const handleFloatingCardShowVideos = (problemId) => {
  // Hide the floating card when opening video player
  floatingCard.value.visible = false;
  
  // Update URL with showVideosForProblem query param
  router.push({
    query: {
      ...route.query,
      showVideosForProblem: problemId,
    },
  });
};
</script>
