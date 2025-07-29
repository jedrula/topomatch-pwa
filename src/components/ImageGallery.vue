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
    <div class="max-w-[90vw] max-h-[90vh] flex items-center justify-center" @click.stop>
      <img
        v-if="currentImage"
        :src="currentImage.url"
        :alt="currentImage.name"
        class="max-w-full max-h-full object-contain"
        @load="onImageLoad"
      />
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
        class="flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all"
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
import { computed, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

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

const currentIndex = computed(() => {
  // Get index from URL if available
  const imageIndex = route.query.image;
  if (imageIndex !== undefined) {
    const index = parseInt(imageIndex);
    return isNaN(index)
      ? props.initialIndex
      : Math.max(0, Math.min(index, props.images.length - 1));
  }
  return props.initialIndex;
});

const currentImage = computed(() => {
  return props.images[currentIndex.value] || null;
});

const closeGallery = () => {
  // Remove image query parameter to close gallery
  const query = { ...route.query };
  delete query.image;
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
  router.push({
    query: { ...route.query, image: clampedIndex },
  });
  emit("navigate", clampedIndex);
};

const onImageLoad = () => {
  // Focus the gallery for keyboard navigation
  nextTick(() => {
    const galleryEl = document.querySelector('[tabindex="0"]');
    if (galleryEl) {
      galleryEl.focus();
    }
  });
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
</script>
