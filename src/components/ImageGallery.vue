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
    <div class="max-w-[90vw] max-h-[90vh] flex items-center justify-center relative" @click.stop>
      <div class="relative">
        <img
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.name"
          class="max-w-full max-h-full object-contain"
          @load="onImageLoad"
          ref="imageElement"
        />

        <!-- Boulder Problems SVG Overlay -->
        <svg
          v-if="imageLoaded && currentImageProblems.length > 0"
          class="absolute inset-0 w-full h-full pointer-events-none"
          :viewBox="imageViewBox"
          preserveAspectRatio="none"
        >
          <!-- Problem Holds as SVGs -->
          <template v-for="problem in currentImageProblems" :key="problem.id">
            <HoldSvg
              v-for="(problemHold, holdIndex) in problem.holds"
              :data-problem-id="problem.id"
              :key="`${problem.id}-${holdIndex}`"
              :svg-markup="problemHold.hold.svgMarkup"
              :interaction="hoveredProblemId === problem.id ? 'hover' : 'default'"
              :selectable="true"
              :color="problem.color"
              @click="goToProblemDetail(problem)"
              @hover="handleProblemHover(problem.id, $event)"
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
        <img :src="image.url" :alt="image.name" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import HoldSvg from "./HoldSvg.vue";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore";

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

const emit = defineEmits(["close", "navigate"]);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();

// Boulder problems functionality
const imageElement = ref(null);
const imageLoaded = ref(false);
const hoveredProblemId = ref(null);

const currentIndex = computed(() => {
  // Get imageId from URL if available
  const imageId = route.query.imageId;
  if (imageId !== undefined) {
    const index = props.images.findIndex((img) => img.id === imageId);
    return index !== -1 ? index : props.initialIndex;
  }
  return props.initialIndex;
});

const currentImage = computed(() => {
  return props.images[currentIndex.value] || null;
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

// SVG viewBox for overlay positioning
const imageViewBox = computed(() => {
  if (!imageElement.value) return "0 0 1000 1000";

  const img = imageElement.value;
  const naturalWidth = img.naturalWidth || 1000;
  const naturalHeight = img.naturalHeight || 1000;

  return `0 0 ${naturalWidth} ${naturalHeight}`;
});

const closeGallery = () => {
  // Remove imageId query parameter to close gallery
  const query = { ...route.query };
  delete query.imageId;
  router.push({ query });
  emit("close");
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
  emit("navigate", clampedIndex);
};

const onImageLoad = () => {
  imageLoaded.value = true;

  // Focus the gallery for keyboard navigation
  nextTick(() => {
    const galleryEl = document.querySelector('[tabindex="0"]');
    if (galleryEl) {
      galleryEl.focus();
    }
  });
};

const goToProblemDetail = (problem) => {
  router.push({
    name: "boulder-problem-detail",
    params: {
      locationId: props.locationId,
      problemId: problem.id,
    },
  });
};

const handleProblemHover = (problemId, isEntering) => {
  hoveredProblemId.value = isEntering ? problemId : null;
};

// Watch for route changes to update current image
watch(
  () => route.query.image,
  (newImageIndex) => {
    if (newImageIndex !== undefined && props.isOpen) {
      const index = parseInt(newImageIndex);
      if (!isNaN(index)) {
        emit("navigate", index);
      }
    }
  }
);

// Watch for current image changes to reset loaded state
watch(
  () => currentImage.value,
  () => {
    imageLoaded.value = false;
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
        console.error("Error loading boulder problems:", error);
      }
    }
  },
  { immediate: true }
);
</script>
