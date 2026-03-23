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
        class="absolute bottom-6 right-6 text-white text-right bg-black bg-opacity-50 p-3 rounded-lg text-sm z-40 space-y-2"
      >
        <!-- Miniature floorplan showing current section -->
        <div v-if="floorplan?.outline?.length > 0" class="mb-2">
          <div class="text-[10px] text-gray-400 mb-1">{{ currentImageSection?.name || 'Unassigned' }}</div>
          <div class="w-32 h-20 bg-black bg-opacity-30 rounded overflow-hidden">
            <FloorplanViewer
              :sections="floorplan.sections || []"
              :outline="floorplan.outline || []"
              :active-section="currentImageSection?.id"
            />
          </div>
        </div>
        
        <div class="text-xs text-gray-300 flex items-center gap-2">
          <p v-if="currentImageProblems.length > 0" class="text-blue-300">
            {{ currentImageProblems.length }} boulder problem{{ currentImageProblems.length === 1 ? '' : 's' }}
          </p>
          <p v-else class="text-gray-400">
            No boulder problems
          </p>
          <!-- Edit icon for admin users -->
          <RouterLink
            v-if="userStore.isAdmin"
            :to="`/location/${locationId}/holds-server?imageId=${currentImage.imageId}&imageName=${encodeURIComponent(currentImage.name)}`"
            class="text-white hover:text-blue-300 transition-colors"
            title="Edit holds and problems"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </RouterLink>
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
        @click="handleBackgroundClick"
      >
        <!-- Loading state -->
        <!-- Loading skeleton while image loads -->
        <div
          v-if="!imageLoaded"
          class="absolute inset-0 flex items-center justify-center bg-gray-900"
        >
          <div class="w-full h-full max-w-4xl max-h-[80vh] bg-gray-800 animate-pulse flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <!-- Image with Holds Overlay -->
        <ImageWithHolds
          v-if="currentImage && imageViewBox"
          :viewBox="imageViewBox"
        >
          <template #image>
            <img
              ref="climbingImage"
              :src="optimalImageUrl"
              :alt="currentImage.name || 'Climbing route'"
              class="w-full h-auto object-contain block max-h-full"
              @load="onImageLoad"
              @error="(e) => e.target.src = fallbackImageUrl"
              crossorigin="anonymous"
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
                  @click="(event) => handleProblemClick(problem, event)"
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
        <div v-else-if="currentImage" class="flex items-center justify-center">
          <img
            ref="climbingImage"
            :src="optimalImageUrl"
            :alt="currentImage.name || 'Climbing route'"
            class="w-full h-auto object-contain block max-h-full"
            @load="onImageLoad"
            @error="(e) => e.target.src = fallbackImageUrl"
            crossorigin="anonymous"
          />
        </div>
      </div>
    </div>

    <!-- Desktop: Floating boulder problem card -->
    <FloatingBoulderProblemCard
      v-if="!isTouchDevice"
      :visible="floatingCard.visible"
      :problem="floatingCard.problem"
      :position="floatingCard.position"
      :location-id="locationId"
      :assignment-mode="isAssignmentMode"
      @edit="handleFloatingCardEdit"
      @toggle-visibility="handleFloatingCardToggleVisibility"
      @show-videos="handleFloatingCardShowVideos"
      @assign-problem="handleAssignProblem"
      @mouse-enter="handleFloatingCardMouseEnter"
      @mouse-leave="handleFloatingCardMouseLeave"
    />

    <!-- Mobile: Bottom drawer -->
    <BoulderProblemDrawer
      v-if="isTouchDevice"
      :visible="floatingCard.visible"
      :problem="floatingCard.problem"
      :videos="floatingCard.problem ? (problemVideosCache.get(floatingCard.problem.id) || []) : []"
      :videos-loading="floatingCard.problem ? loadingVideos.has(floatingCard.problem.id) : false"
      :location-id="locationId"
      :assignment-mode="isAssignmentMode"
      @close="hideFloatingCard"
      @edit="handleFloatingCardEdit"
      @show-videos="handleFloatingCardShowVideos"
      @video-click="handleVideoClick"
      @assign-problem="handleAssignProblem"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useSwipe } from '@vueuse/core';
import ImageWithHolds from './ImageWithHolds.vue';
import HoldSvg from './HoldSvg.vue';
import FloatingBoulderProblemCard from './FloatingBoulderProblemCard.vue';
import BoulderProblemDrawer from './BoulderProblemDrawer.vue';
import FloorplanViewer from './floorplan/FloorplanViewer.vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore';
import { useUserStore } from '@/stores/userStore';
import { getResponsiveImageUrls } from '@/utils/imageResize.js';
import { boulderProblemsServiceV2 } from '@/services/boulderProblemsServiceV2.js';
import { videoService } from '@/services/videoService.js';

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
  floorplan: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'navigate', 'navigate-next', 'navigate-previous']);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
const userStore = useUserStore();

// Assignment mode detection
const isAssignmentMode = computed(() => !!route.query.assignVideoId);

// Find which section contains the current image
const currentImageSection = computed(() => {
  if (!currentImage.value || !props.floorplan?.sections) return null;
  
  return props.floorplan.sections.find(section => 
    section.imageIds?.includes(currentImage.value.imageId)
  );
});

// Detect mobile/touch device (reuse existing logic from handleProblemClick)
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Touch/swipe handling with VueUse
const imageContainer = ref(null);
const maxTapMovement = 10; // Maximum movement to still be considered a tap

const { lengthX, lengthY, isSwiping } = useSwipe(imageContainer, {
  threshold: 50, // Minimum distance for swipe detection
  onSwipe(e) {
    console.log('🔄 [SWIPE] onSwipe triggered', { lengthX: lengthX.value, lengthY: lengthY.value, isSwiping: isSwiping.value });
  },
  onSwipeStart(e) {
    console.log('👆 [SWIPE] onSwipeStart', { target: e.target?.tagName });
  },
  onSwipeEnd(e, direction) {
    console.log('✅ [SWIPE] onSwipeEnd', { direction, lengthX: lengthX.value, lengthY: lengthY.value });
    if (direction === 'left') navigateNext();
    if (direction === 'right') navigatePrevious();
  },
});

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

// Helper function to hide floating card
const hideFloatingCard = () => {
  console.log('❌ [DRAWER] Closing drawer');
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
  floatingCard.value.visible = false;
  hoveredProblemId.value = null;
};

// Fetch and cache videos for a problem (and its linked partner if any)
const fetchProblemVideos = async (problemId) => {
  // Return cached if available
  if (problemVideosCache.value.has(problemId)) {
    return problemVideosCache.value.get(problemId);
  }
  
  // Avoid duplicate fetches
  if (loadingVideos.value.has(problemId)) {
    // Wait for the ongoing fetch to complete
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!loadingVideos.value.has(problemId)) {
          clearInterval(checkInterval);
          resolve(problemVideosCache.value.get(problemId) || []);
        }
      }, 100);
    });
  }
  
  try {
    loadingVideos.value.add(problemId);

    const problem = props.boulderProblems.find(p => p.id === problemId) || { id: problemId };
    const videos = await videoService.getProblemVideos(props.locationId, problem);

    problemVideosCache.value.set(problemId, videos);
    return videos;
  } catch (error) {
    console.error('Error fetching videos for problem:', problemId, error);
    return [];
  } finally {
    loadingVideos.value.delete(problemId);
  }
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

// Video caching for problems
const problemVideosCache = ref(new Map()); // Map<problemId, videos[]>
const loadingVideos = ref(new Set()); // Set<problemId> for tracking ongoing fetches

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

// Get responsive image URLs for current image
const currentImageUrls = computed(() => {
  if (!currentImage.value) return null;
  return getResponsiveImageUrls(currentImage.value.url);
});

// Get optimal image URL based on screen size
// Mobile: 800x600, Desktop: 1920x1440 (original for very large screens)
const optimalImageUrl = computed(() => {
  if (!currentImageUrls.value) return '';
  
  // Use mobile size on small screens, desktop on larger screens
  const isMobile = window.innerWidth < 768;
  return isMobile ? currentImageUrls.value.mobile : currentImageUrls.value.desktop;
});

// Get fallback URL (use JPEG version of same size, or original as last resort)
const fallbackImageUrl = computed(() => {
  if (!currentImageUrls.value) return '';
  
  const isMobile = window.innerWidth < 768;
  return isMobile ? currentImageUrls.value.mobileJpeg : currentImageUrls.value.desktopJpeg;
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
  delete query.assignVideoId;
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

const handleFloatingCardShowVideos = async (problemId) => {
  // Hide the floating card when opening video player
  hideFloatingCard();
  
  // Fetch videos (will use cache if available)
  const videos = await fetchProblemVideos(problemId);
  
  // If there are videos, open the player with the first video
  if (videos && videos.length > 0) {
    router.push({
      path: route.path,
      query: {
        ...route.query,
        videoId: videos[0].id,
        problemId: problemId, // Add problemId to filter videos in player
      },
    });
  } else {
    console.log('No videos found for problem:', problemId);
  }
};

const handleVideoClick = (videoId, problemId) => {
  // Hide the floating card when opening video player
  hideFloatingCard();
  
  // Navigate to video player with this specific video
  router.push({
    path: route.path,
    query: {
      ...route.query,
      videoId: videoId,
      problemId: problemId,
    },
  });
};

const handleAssignProblem = async (problemId) => {
  // Get the video ID from the query param
  const videoId = route.query.assignVideoId;
  if (!videoId) return;

  console.log('Assigning problem', problemId, 'to video', videoId);
  
  try {
    // Update the video's problemId in Firestore
    await videoService.assignProblemToVideo(videoId, problemId, props.locationId);
    
    // Hide the floating card
    floatingCard.value.visible = false;
    
    // Navigate back to location page (remove assignVideoId but keep other query params like routesetting)
    const { assignVideoId, imageId, videoId: _videoId, ...remainingQuery } = route.query;
    router.push({
      path: `/location/${props.locationId}`,
      query: remainingQuery,
    });
  } catch (error) {
    console.error('Error assigning problem to video:', error);
    alert(`Failed to assign problem: ${error.message}`);
  }
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
const handleProblemClick = (problem, event) => {
  console.log('🎯 [HOLD CLICK] Problem clicked', { 
    problemId: problem.id, 
    isTouchDevice,
    lengthX: lengthX.value, 
    lengthY: lengthY.value,
    eventType: event?.type
  });
  
  // On mobile/touch devices, clicking a hold should show the drawer
  // (since hover doesn't work on touch screens)
  if (isTouchDevice) {
    // Check if this was a swipe gesture (not a tap)
    // If touch moved more than maxTapMovement pixels, ignore the click
    const totalMovement = Math.sqrt(lengthX.value * lengthX.value + lengthY.value * lengthY.value);
    
    console.log('📏 [TAP CHECK]', { 
      totalMovement, 
      maxTapMovement, 
      isTap: totalMovement <= maxTapMovement,
      lengthX: lengthX.value,
      lengthY: lengthY.value
    });
    
    if (totalMovement > maxTapMovement) {
      // This was a swipe, not a tap - trigger navigation manually
      // (onSwipeEnd doesn't fire because click event interrupts the gesture)
      console.log('↔️ [SWIPE DETECTED] Triggering navigation');
      
      // Determine direction based on lengthX (horizontal movement)
      if (Math.abs(lengthX.value) > Math.abs(lengthY.value)) {
        // Horizontal swipe is dominant
        if (lengthX.value > 0) {
          console.log('➡️ Swipe right - navigating to previous');
          navigatePrevious();
        } else {
          console.log('⬅️ Swipe left - navigating to next');
          navigateNext();
        }
      }
      
      return;
    }
    
    console.log('👆 [TAP DETECTED] Opening drawer');
    
    // Only stop propagation after confirming it's a tap (not a swipe)
    // This prevents handleBackgroundClick from closing the drawer
    event?.stopPropagation();
    
    // If this problem's card is already visible, hide it (toggle behavior)
    if (floatingCard.value.visible && floatingCard.value.problem?.id === problem.id) {
      console.log('🔄 [DRAWER] Toggling drawer off (already open)');
      floatingCard.value.visible = false;
      hoveredProblemId.value = null;
    } else {
      console.log('✨ [DRAWER] Opening drawer for problem', problem.id);
      // Pre-fetch videos for this problem (non-blocking)
      fetchProblemVideos(problem.id);
      
      // Show the floating card for this problem
      hoveredProblemId.value = problem.id;
      floatingCard.value = {
        visible: true,
        problem: problem,
        position: {
          x: event?.clientX || window.innerWidth / 2,
          y: event?.clientY || window.innerHeight / 2,
        },
      };
    }
  }
};

const handleBackgroundClick = (event) => {
  console.log('🖼️ [BACKGROUND CLICK]', { 
    hasVisibleDrawer: floatingCard.value.visible,
    isTouchDevice,
    target: event.target?.tagName
  });
  
  // Close the drawer on mobile when clicking anywhere that isn't a hold
  // Holds use .stop on their events, so if this handler fires, it's not a hold
  if (isTouchDevice && floatingCard.value.visible) {
    console.log('❌ [DRAWER] Closing drawer via background click');
    floatingCard.value.visible = false;
    hoveredProblemId.value = null;
  }
};

const handleProblemHover = (problem, isEntering, event) => {
  if (isEntering) {
    // Clear any existing timeout
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
    
    // Pre-fetch videos for this problem (non-blocking)
    fetchProblemVideos(problem.id);
    
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

// Load boulder problems for the location (only on location change, not initial mount)
// Initial load is handled by parent LocationDetailView
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
  }
);

// Hide floating card when image changes
watch(
  currentImage,
  () => {
    hideFloatingCard(); // Hide floating card when switching images
    problemVideosCache.value.clear(); // Clear video cache when changing images
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
