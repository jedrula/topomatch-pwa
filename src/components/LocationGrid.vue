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

defineProps({
  locations: {
    type: Array,
    required: true,
  },
});

const router = useRouter();

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
