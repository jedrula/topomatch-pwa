<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <!-- Dead simple full-screen image display -->
    <div class="relative w-full h-full max-w-full max-h-full">
      <!-- Close button -->
      <button
        @click="closeGallery"
        class="absolute top-4 right-4 z-50 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-200"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
          v-else
          viewBox="0 0 1000 1000"
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
            <HoldSvg
              v-if="imageLoaded"
              svg-markup="<circle cx='200' cy='300' r='30' fill='rgba(59, 130, 246, 0.3)' stroke='#3b82f6' stroke-width='2'/>"
              interaction="selected"
              interaction-allowed="selectable"
              color="#3b82f6"
            />
          </template>
        </ImageWithHolds>
      </div>
    </div>

    <!-- Floating boulder problem card -->
    <FloatingBoulderProblemCard
      v-if="floatingCard.visible"
      :problem="floatingCard.problem"
      :position="floatingCard.position"
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
import { getOptimalImageUrl } from '@/utils/imageResize.js';

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

// Refs
const imageContainer = ref(null);
const climbingImage = ref(null);
const imageLoaded = ref(false);

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

// Watch for current image changes
watch(
  currentImage,
  (newImage) => {
    imageLoaded.value = false;
    console.log('Current image changed:', newImage?.name || 'No image');
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
