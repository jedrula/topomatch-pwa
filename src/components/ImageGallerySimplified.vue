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

      <!-- Image container -->
      <div ref="imageContainer" class="relative w-full h-full flex items-center justify-center">
        <!-- Loading state -->
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
            <!-- Render actual boulder problems -->
            <template v-if="imageLoaded && currentImageProblems.length > 0">
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
              v-else-if="imageLoaded"
              svg-markup="<circle cx='200' cy='300' r='30' fill='rgba(59, 130, 246, 0.3)' stroke='#3b82f6' stroke-width='2'/>"
              interaction="normal"
              interaction-allowed="selectable"
              color="#3b82f6"
            />
          </template>
        </ImageWithHolds>

        <!-- Fallback: Show image without holds if no viewBox available -->
        <div v-else class="text-center text-white p-8">
          <img
            ref="climbingImage"
            :src="getOptimalImageUrl(currentImage.url)"
            :alt="currentImage.name || 'Climbing route'"
            class="w-full h-auto object-contain block max-h-full mb-4"
            @load="onImageLoad"
          />
          <p class="text-yellow-300">
            ⚠️ Hold detection not performed for this image.
          </p>
          <p class="text-gray-300 text-sm">
            Run hold detection to enable boulder problem creation.
          </p>
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
      @mouse-enter="handleFloatingCardMouseEnter"
      @mouse-leave="handleFloatingCardMouseLeave"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ImageWithHolds from './ImageWithHolds.vue';
import HoldSvg from './HoldSvg.vue';
import FloatingBoulderProblemCard from './FloatingBoulderProblemCard.vue';
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

const emit = defineEmits(['close', 'navigate']);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
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
    const foundImage = props.images.find((img) => img.id === imageId);
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
    console.warn(`⚠️ No viewBox found in metadata for image ${currentImage.value?.id}. Hold detection may not have been performed.`);
    return null; // No default - must be explicit
  }

  return viewBox;
});

// Get boulder problems for current image
const currentImageProblems = computed(() => {
  if (!currentImage.value || !props.boulderProblems) return [];
  
  return props.boulderProblems.filter(problem => problem.imageId === currentImage.value.id);
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
    console.log('Loading metadata for image:', imageId);
    const metadata = await boulderProblemsServiceV2.getHoldDetectionMetadata(props.locationId, imageId);
    console.log('Metadata response:', metadata);
    imageMetadata.value = metadata;
    
    if (metadata) {
      console.log('Metadata loaded:', metadata);
    } else {
      console.warn('No metadata returned for image:', imageId);
    }
  } catch (error) {
    console.error('Failed to load image metadata:', error);
    imageMetadata.value = null;
  }
};

// Close function
const closeGallery = () => {
  const query = { ...route.query };
  delete query.imageId;
  router.push({ query });
  emit('close');
};

// Image loading
const onImageLoad = () => {
  imageLoaded.value = true;
  console.log('Image loaded in simplified gallery');
};

// Floating card event handlers
const handleFloatingCardEdit = (problem) => {
  console.log('Editing problem from simplified gallery:', problem.name);
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
  console.log('Toggling problem visibility from simplified gallery:', problem.name);
  if (boulderProblemsStore.isShowingOnlyOneProblem && !problem.hidden) {
    boulderProblemsStore.showAllProblems();
  } else {
    boulderProblemsStore.showOnlyProblem(problem.id);
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
const handleProblemClick = (problem) => {
  console.log('Problem clicked:', problem.name);
  // For now, just log the click - could add navigation or edit functionality
};

const handleProblemHover = (problem, isEntering, event) => {
  console.log('Problem hover:', problem.name, 'entering:', isEntering);
  
  if (isEntering) {
    // Clear any existing timeout
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
    
    // Show floating card
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
    console.log('Current image changed:', newImage?.name || 'No image');
    
    // Load metadata for the new image
    if (newImage && props.locationId) {
      console.log('Loading metadata for image:', newImage.name);
      await loadImageMetadata(newImage.id);
      
      // Also load hold detection data if needed
      try {
        await holdDetectionPersistenceStore.loadStoredDetection(newImage.id);
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
        console.log('Loading boulder problems for location:', newLocationId);
        await boulderProblemsStore.loadProblemsForLocation(newLocationId);
        console.log('Boulder problems loaded');
        
        // Initialize hold detection persistence store
        holdDetectionPersistenceStore.initializeForLocation(newLocationId);
      } catch (error) {
        console.error('Error loading boulder problems:', error);
      }
    }
  },
  { immediate: true }
);
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
