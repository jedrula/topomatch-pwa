<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
      <div>
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">Photos</h2>
        <p v-if="images.length > 0" class="text-sm text-gray-600 mt-1">
          {{ images.length }} {{ images.length === 1 ? 'photo' : 'photos' }}
        </p>
      </div>
      <button
        v-if="canUpload"
        @click="$emit('upload')"
        class="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        :aria-label="images.length === 0 ? 'Upload your first photos' : 'Upload more photos'"
      >
        <svg class="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="hidden sm:inline">Add Photos</span>
        <span class="sm:hidden">Add</span>
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6 pt-3 sm:pt-4">
      <!-- Empty state -->
      <div v-if="images.length === 0" class="text-center py-8">
        <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
        <p class="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Share photos of boulder problems, climbing routes, or the area to help other climbers visualize this location.
        </p>
        <button
          v-if="canUpload"
          @click="$emit('upload')"
          class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Upload Photos
        </button>
      </div>

      <!-- Images grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="image in images"
          :key="image.imageId"
          class="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group hover:shadow-md transition-shadow"
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
              <svg
                class="w-8 h-8 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                />
              </svg>
              <p class="text-xs font-medium text-gray-600">HEIC</p>
              <p class="text-xs text-gray-500">{{ image.name.split("-").pop() }}</p>
            </div>
          </div>

          <!-- Regular image display -->
          <template v-else>
            <!-- Processing state for recently uploaded images -->
            <div
              v-if="isRecentUpload(image)"
              class="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"
            >
              <div class="text-center">
                <svg class="w-6 h-6 mx-auto mb-1 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p class="text-xs text-gray-500">Optimizing...</p>
              </div>
            </div>
            
            <!-- Show optimized thumbnail -->
            <picture v-else>
              <!-- WebP format for modern browsers -->
              <source 
                :srcset="getResizedImageUrl(image.url, '300x300', 'webp')"
                type="image/webp"
              />
              <!-- JPEG fallback -->
              <img
                :src="getResizedImageUrl(image.url, '300x300', 'jpeg')"
                :alt="`Photo of ${locationName || 'climbing location'}`"
                class="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                @click="$emit('image-click', image)"
                @error="(e) => e.target.src = image.url"
                loading="lazy"
              />
            </picture>
            
            <!-- Hold detection button for admins -->
            <button
              v-if="canEditHolds"
              @click.stop="$emit('analyze-holds', image)"
              class="absolute top-2 right-2 p-2 bg-white bg-opacity-90 hover:bg-white text-gray-700 hover:text-green-600 rounded-full shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Analyze holds and create boulder problems"
              :aria-label="`Analyze holds in ${image.name}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            
            <!-- Delete button for admins -->
            <button
              v-if="canEditHolds"
              @click.stop="$emit('delete-image', image)"
              class="absolute top-2 left-2 p-2 bg-white bg-opacity-90 hover:bg-white text-gray-700 hover:text-red-600 rounded-full shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Delete this image and all associated boulder problems"
              :aria-label="`Delete ${image.name}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
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
  getResizedImageUrl: {
    type: Function,
    required: true
  }
});

defineEmits(['upload', 'image-click', 'analyze-holds', 'delete-image']);

const isHeicFile = (filename) => {
  return filename?.toLowerCase().endsWith('.heic') || filename?.toLowerCase().endsWith('.heif');
};

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
