<template>
  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
    <div
      v-for="location in locations"
      :key="location.id"
      class="group bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
      @click="goToLocation(location.id)"
    >
      <!-- Hero Image -->
      <div class="relative h-40 bg-gray-50">
        <img
          v-if="location.heroImageUrl"
          :src="fixLocalhostUrl(location.heroImageUrl)"
          :alt="location.name"
          class="w-full h-full object-cover"
          crossorigin="anonymous"
        />
        <div v-else class="w-full h-full flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Like indicator with count -->
        <div
          class="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm pointer-events-none"
        >
          <!-- Heart icon -->
          <svg 
            class="w-4 h-4"
            :class="userStore.isLoggedIn && likesStore.isLocationLiked(location.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'"
            fill="currentFill"
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <!-- Like count -->
          <span class="text-xs font-medium text-gray-700">
            {{ location.likesCount ?? 0 }}
          </span>
        </div>
      </div>

      <!-- Location Info -->
      <div class="p-2 sm:p-4">
        <h3 class="text-[14px] font-semibold text-gray-900 line-clamp-1">
          {{ location.name }}
        </h3>
        <div class="flex items-center justify-between text-[12px] text-gray-500">
          <span v-if="location.createdAt">
            Added {{ formatDateShort(location.createdAt) }}
          </span>
          <svg class="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { formatDateShort } from '../utils/dateUtils.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { useLocationLikesStore } from '../stores/locationLikesStore.js';

defineProps({
  locations: {
    type: Array,
    required: true,
  },
});

const router = useRouter();
const userStore = useUserStore();
const likesStore = useLocationLikesStore();

const goToLocation = (locationId) => {
  router.push(`/location/${locationId}`);
};
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
