<template>
  <!-- Only show if loading OR if there are unassigned images to display -->
  <div v-if="loading || images.length > 0">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="section-header">
        Other Photos
        <span v-if="!loading && images.length > 0" class="section-header-count ml-1.5">({{ images.length }})</span>
      </h2>
      <button
        v-if="canUpload"
        @click="$emit('upload')"
        class="h-8 px-3 bg-gray-900 text-white text-[12px] font-medium rounded-md hover:bg-gray-800 transition-all inline-flex items-center gap-1.5"
        :aria-label="images.length === 0 ? 'Upload your first photos' : 'Upload more photos'"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="hidden sm:inline">Add</span>
      </button>
    </div>

    <!-- Content -->
    <div>
      <!-- Loading state with skeletons -->
      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="n in 5"
          :key="`skeleton-${n}`"
          class="aspect-square rounded-lg overflow-hidden bg-gray-100 animate-pulse"
        >
          <div class="w-full h-full flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Images grid (no empty state - component hidden if no images) -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="image in images"
          :key="image.imageId"
          class="aspect-square bg-gray-50 rounded-lg overflow-hidden relative group hover:ring-2 hover:ring-gray-900/10 transition-all"
        >
          <!-- HEIC file display -->
          <div
            v-if="isHeicFile(image.name)"
            class="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            @click="$emit('image-click', image)"
            :aria-label="`View ${image.name}`"
            role="button"
            tabindex="0"
            @keydown.enter="$emit('image-click', image)"
            @keydown.space.prevent="$emit('image-click', image)"
          >
            <div class="text-center">
              <svg class="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
              </svg>
              <p class="text-[11px] font-medium text-gray-600">HEIC</p>
              <p class="text-[11px] text-gray-500">{{ image.name.split("-").pop() }}</p>
            </div>
          </div>

          <!-- Regular image display with context menu -->
          <div v-else-if="!isHeicFile(image.name) && canEditHolds" class="relative" @contextmenu="(e) => showContextMenu(e, image)">
            <picture>
              <source
                :srcset="getResizedImageUrl(image.url, '300x300', 'webp')"
                type="image/webp"
                @error="() => {}"
              />
              <img
                :src="getResizedImageUrl(image.url, '300x300', 'jpeg')"
                :alt="`Photo of ${locationName || 'climbing location'}`"
                class="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                @click="$emit('image-click', image)"
                @error="(e) => e.target.src = image.url"
                loading="lazy"
                crossorigin="anonymous"
              />
            </picture>
            
            <!-- Three-dots menu button -->
            <button
              @click="(e) => showContextMenu(e, image)"
              class="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image options"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          
          <!-- Regular image display without context menu -->
          <template v-else-if="!isHeicFile(image.name)">
            <!-- Processing state for recently uploaded images -->
            <div
              v-if="isRecentUpload(image)"
              class="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center"
            >
              <div class="text-center">
                <svg class="w-5 h-5 mx-auto mb-1 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p class="text-[11px] text-gray-500">Optimizing...</p>
              </div>
            </div>
            
            <!-- Show image (use resized versions for better performance) -->
            <picture v-else>
              <source 
                :srcset="getResizedImageUrl(image.url, '300x300', 'webp')"
                type="image/webp"
                crossorigin="anonymous"
              />
              <img
                :src="getResizedImageUrl(image.url, '300x300', 'jpeg')"
                :alt="`Photo of ${locationName || 'climbing location'}`"
                class="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                @click="$emit('image-click', image)"
                @error="(e) => e.target.src = image.url"
                loading="lazy"
                crossorigin="anonymous"
              />
            </picture>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useImageContextMenu } from '../composables/useImageContextMenu';

const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  locationName: {
    type: String,
    default: ''
  },
  canUpload: {
    type: Boolean,
    default: false
  },
  canEditHolds: {
    type: Boolean,
    default: false
  },
  sections: {
    type: Array,
    default: () => []
  },
  getResizedImageUrl: {
    type: Function,
    required: true
  }
});

const isHeicFile = (filename) => {
  return filename?.toLowerCase().endsWith('.heic') || filename?.toLowerCase().endsWith('.heif');
};

const emit = defineEmits(['upload', 'image-click', 'analyze-holds', 'delete-image', 'move-to-section']);

// Setup context menu composable
const { showContextMenu } = useImageContextMenu({
  onAnalyze: (image) => emit('analyze-holds', image),
  onDelete: (image) => emit('delete-image', image),
  onMove: (image, sectionId) => emit('move-to-section', image, sectionId),
  sections: computed(() => props.sections)
});

// Simple check: is this image uploaded in the last 5 seconds?
const now = ref(Date.now());

const isRecentUpload = (image) => {
  if (!image.uploadedAt) return false;
  
  const uploadTime = typeof image.uploadedAt === 'number' 
    ? image.uploadedAt 
    : image.uploadedAt.getTime?.() || 0;
  
  return (now.value - uploadTime) < 5000; // Less than 5 seconds ago
};

// Update 'now' every 500ms to trigger re-renders
let timer;
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 500);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
