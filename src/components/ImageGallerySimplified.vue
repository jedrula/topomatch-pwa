<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <!-- Dead simple full-screen image display -->
    <div class="relative w-full h-full max-w-full max-h-full">
      <!-- {{ currentImageProblems }} -->
      <!-- Close button -->
      <button
        @click="closeGallery"
        class="absolute top-4 right-4 z-50 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Image info - Bottom right corner -->
      <div
        v-if="currentImage"
        class="absolute bottom-6 right-6 text-white text-right bg-black bg-opacity-50 p-3 rounded-lg text-sm z-40"
      >
        <div class="text-xs text-gray-300">
          <p v-if="currentImageProblems.length > 0" class="text-blue-300">
            {{ currentImageProblems.length }} boulder problem{{ currentImageProblems.length === 1 ? '' : 's' }}
          </p>
          <p v-else class="text-gray-400">
            No boulder problems
          </p>
        </div>
      </div>

      <!-- Navigation arrows - only show on desktop and when there are multiple images -->
      <template v-if="images.length > 1">
        <!-- Previous arrow -->
        <button
          @click="navigatePrevious"
          class="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200 hidden sm:block"
          title="Previous image (Arrow Left)"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Next arrow -->
        <button
          @click="navigateNext"
          class="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200 hidden sm:block"
          title="Next image (Arrow Right)"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Mobile swipe indicator -->
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full sm:hidden">
          ← Swipe →
        </div>
      </template>

      <!-- Image container with swipe support -->
      <div 
        ref="imageContainer" 
        class="relative w-full h-full flex items-center justify-center"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove" 
        @touchend="handleTouchEnd"
      >
        <!-- Loading state -->
        <!-- Loading spinner while image loads -->
        <div
          v-if="currentImage && !imageLoaded"
          class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30"
        >
          <div class="text-center text-white">
            <div
              class="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-lg">Loading image...</p>
          </div>
        </div>

        <!-- No current image fallback -->
        <div
          v-if="!currentImage"
          class="w-full h-64 flex items-center justify-center"
        >
          <div class="text-center text-white">
            <div
              class="w-8 h-8 border-4 border-gray-300 border-t-white rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p>Loading image...</p>
          </div>
        </div>

        <!-- Image with Holds Overlay -->
        <ImageWithHolds
          v-else-if="imageViewBox"
          :viewBox="imageViewBox"
        >
          <template #image>
            <img
              ref="climbingImage"
              :src="getOptimalImageUrl(currentImage.url)"
              :alt="currentImage.name || 'Climbing route'"
              class="w-full h-auto object-contain block max-h-full"
              @load="onImageLoad"
            />
          </template>
          <template #overlay>
            <!-- Only show overlay content when image is loaded -->
            <template v-if="imageLoaded">
              <!-- Render actual boulder problems -->
              <template v-if="currentImageProblems.length > 0">
                <template v-for="problem in visibleProblems" :key="problem.id">
                  <HoldSvg
                  v-for="(holdData, holdIndex) in problem.holds || []"
                  :key="`${problem.id}-hold-${holdIndex}`"
                  :svg-markup="holdData.hold.svgMarkup"
                  :interaction="getHoldInteraction(problem)"
                  :interaction-allowed="'selectable'"
                  :color="problem.color || '#3b82f6'"
                  @click="() => handleProblemClick(problem)"
                  @hover="(isEntering, event) => handleProblemHover(problem, isEntering, event)"
                />
              </template>
            </template>
            
            <!-- Fallback: Show sample hold if no problems available -->
            <HoldSvg
              v-else
              svg-markup="<circle cx='200' cy='300' r='30' fill='rgba(59, 130, 246, 0.3)' stroke='#3b82f6' stroke-width='2'/>"
              interaction="normal"
              interaction-allowed="selectable"
              color="#3b82f6"
            />
            </template>
          </template>
        </ImageWithHolds>

        <!-- Fallback: Show image without holds if no viewBox available -->
        <div v-else class="flex items-center justify-center">
          <img
            ref="climbingImage"
            :src="getOptimalImageUrl(currentImage.url)"
            :alt="currentImage.name || 'Climbing route'"
            class="w-full h-auto object-contain block max-h-full"
            @load="onImageLoad"
          />
        </div>
      </div>
    </div>

    <!-- Floating boulder problem card -->
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

    <!-- Video Player Shorts -->
    <VideoPlayerShorts
      :problem-id="route.query.showVideosForProblem"
      :location-id="locationId"
      @close="handleVideoPlayerClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageWithHolds from './ImageWithHolds.vue';
import HoldSvg from './HoldSvg.vue';
import FloatingBoulderProblemCard from './FloatingBoulderProblemCard.vue';
import VideoPlayerShorts from './VideoPlayerShorts.vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore';
import { getOptimalImageUrl } from '@/utils/imageResize.js';
import { boulderProblemsServiceV2 } from '@/services/boulderProblemsServiceV2.js';

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
  boulderProblems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'navigate', 'navigate-next', 'navigate-previous']);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();

// Touch/swipe handling
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50; // Minimum distance for swipe detection

// Keyboard navigation
const handleKeyDown = (event) => {
  if (!props.isOpen) return;
  
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    navigatePrevious();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    navigateNext();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeGallery();
  }
};

// Touch handlers
const handleTouchStart = (event) => {
  touchStartX.value = event.touches[0].clientX;
  touchStartY.value = event.touches[0].clientY;
};

const handleTouchMove = (event) => {
  // Prevent default to avoid scrolling
  event.preventDefault();
};

const handleTouchEnd = (event) => {
  touchEndX.value = event.changedTouches[0].clientX;
  touchEndY.value = event.changedTouches[0].clientY;
  
  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = touchEndY.value - touchStartY.value;
  
  // Check if horizontal swipe is more significant than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      // Swipe right - go to previous image
      navigatePrevious();
    } else {
      // Swipe left - go to next image  
      navigateNext();
    }
  }
};

// Helper function to hide floating card
const hideFloatingCard = () => {
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
  floatingCard.value.visible = false;
  hoveredProblemId.value = null;
};

// Navigation methods
const navigateNext = () => {
  if (props.images.length > 1) {
    emit('navigate-next');
  }
};

const navigatePrevious = () => {
  if (props.images.length > 1) {
    emit('navigate-previous');
  }
};
const holdDetectionPersistenceStore = useHoldDetectionPersistenceStore();

// Refs
const imageContainer = ref(null);
const climbingImage = ref(null);
const imageLoaded = ref(false);
const imageMetadata = ref(null);

// Boulder problems functionality
const hoveredProblemId = ref(null);
const floatingCard = ref({
  visible: false,
  problem: null,
  position: { x: 0, y: 0 },
});

// Timeout for tooltip hiding
let tooltipHideTimeout = null;

// Current image computed
const currentImage = computed(() => {
  if (!props.images || props.images.length === 0) return null;

  const imageId = route.query.imageId;
  if (imageId) {
    const foundImage = props.images.find((img) => img.imageId === imageId);
    if (foundImage) return foundImage;
  }

  return props.images[props.initialIndex] || props.images[0];
});

// Get viewBox from metadata - NO DEFAULTS!
const imageViewBox = computed(() => {
  if (!imageMetadata.value) {
    return null; // No default - must be explicit
  }

  const viewBox = imageMetadata.value.viewBox;
  
  if (!viewBox) {
    console.warn(`⚠️ No viewBox found in metadata for image ${currentImage.value?.imageId}. Hold detection may not have been performed.`);
    return null; // No default - must be explicit
  }

  return viewBox;
});

// Get boulder problems for current image
const currentImageProblems = computed(() => {
  if (!currentImage.value || !props.boulderProblems) return [];
  
  return props.boulderProblems.filter(problem => problem.imageId === currentImage.value.imageId);
});

// Get visible boulder problems (respecting store filters)
const visibleProblems = computed(() => {
  if (boulderProblemsStore.isShowingOnlyOneProblem) {
    return currentImageProblems.value.filter(problem => 
      problem.id === boulderProblemsStore.onlyProblemId && !problem.hidden
    );
  }
  
  return currentImageProblems.value.filter(problem => !problem.hidden);
});

// Get interaction state for a hold based on problem hover state
const getHoldInteraction = (problem) => {
  if (problem.hidden) {
    return 'hidden';
  }
  
  // If this problem is being hovered, highlight it
  if (hoveredProblemId.value === problem.id) {
    return 'hover';
  }
  
  // If another problem is being hovered, dim this one slightly
  if (hoveredProblemId.value && hoveredProblemId.value !== problem.id) {
    return 'normal';
  }
  
  return 'normal';
};

// Load metadata for current image
const loadImageMetadata = async (imageId) => {
  if (!imageId || !props.locationId) {
    imageMetadata.value = null;
    return;
  }

  try {
    const metadata = await boulderProblemsServiceV2.getHoldDetectionMetadata(props.locationId, imageId);
    imageMetadata.value = metadata;
  } catch (error) {
    console.error('Failed to load image metadata:', error);
    imageMetadata.value = null;
  }
};

// Close function
const closeGallery = () => {
  hideFloatingCard(); // Hide floating card when closing gallery
  const query = { ...route.query };
  delete query.imageId;
  router.push({ query });
  emit('close');
};

// Image loading
const onImageLoad = () => {
  imageLoaded.value = true;
};

// Floating card event handlers
const handleFloatingCardEdit = (problem) => {
  router.push({
    name: 'location-hold-detection-server',
    params: {
      locationId: props.locationId,
    },
    query: {
      imageId: currentImage.value?.imageId,
      imageName: currentImage.value?.name,
      editingProblemId: problem.id,
    },
  });
};

const handleFloatingCardToggleVisibility = (problem) => {
  if (boulderProblemsStore.isShowingOnlyOneProblem && !problem.hidden) {
    boulderProblemsStore.showAllProblems();
  } else {
    boulderProblemsStore.showOnlyProblem(problem.id);
  }
};

const handleFloatingCardShowVideos = (problemId) => {
  // Hide the floating card when opening video player
  hideFloatingCard();
  
  // Update URL with showVideosForProblem query param
  router.push({
    query: {
      ...route.query,
      showVideosForProblem: problemId,
    },
  });
};

// Video player event handlers
const handleVideoPlayerClose = () => {
  // Remove both showVideosForProblem and videoId from URL
  const query = { ...route.query };
  delete query.showVideosForProblem;
  delete query.videoId;
  router.push({ query });
};

const handleFloatingCardMouseEnter = () => {
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
};

const handleFloatingCardMouseLeave = () => {
  tooltipHideTimeout = setTimeout(() => {
    floatingCard.value.visible = false;
    hoveredProblemId.value = null;
  }, 200);
};

// Boulder problem interaction handlers
const handleProblemClick = () => {
  // For now, just log the click - could add navigation or edit functionality
};

const handleProblemHover = (problem, isEntering, event) => {
  if (isEntering) {
    // Clear any existing timeout
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
    
    // Show floating card immediately
    hoveredProblemId.value = problem.id;
    floatingCard.value = {
      visible: true,
      problem: problem,
      position: {
        x: event?.clientX || 100,
        y: event?.clientY || 100,
      },
    };
  } else {
    // Mouse leaving - set timeout to hide the card
    tooltipHideTimeout = setTimeout(() => {
      floatingCard.value.visible = false;
      hoveredProblemId.value = null;
    }, 200);
  }
};

// Watch for current image changes
watch(
  currentImage,
  async (newImage) => {
    imageLoaded.value = false;
    imageMetadata.value = null; // Reset metadata
    
    // Load metadata for the new image
    if (newImage && props.locationId) {
      await loadImageMetadata(newImage.imageId);
      
      // Also load hold detection data if needed
      try {
        await holdDetectionPersistenceStore.loadStoredDetection(newImage.imageId);
      } catch (error) {
        console.error('Failed to load hold detection:', error);
      }
    }
  },
  { immediate: true }
);

// Load boulder problems for the location
watch(
  () => props.locationId,
  async (newLocationId) => {
    if (newLocationId) {
      try {
        await boulderProblemsStore.loadProblemsForLocation(newLocationId);
        
        // Initialize hold detection persistence store
        holdDetectionPersistenceStore.initializeForLocation(newLocationId);
      } catch (error) {
        console.error('Error loading boulder problems:', error);
      }
    }
  },
  { immediate: true }
);

// Hide floating card when image changes
watch(
  currentImage,
  () => {
    hideFloatingCard(); // Hide floating card when switching images
  }
);

// Setup keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Full-screen overlay styles */
.fixed.inset-0 {
  z-index: 9999;
}

/* Image container styles */
img {
  max-width: 100vw;
  max-height: 100vh;
  width: auto;
  height: auto;
  object-fit: contain;
}
</style>
