<template>
  <div class="min-h-screen">
    <!-- Error State -->
    <div v-if="error" class="container py-8">
      <div class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md">
        {{ error }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && locations.length === 0" class="container py-16 text-center">
      <div class="max-w-md mx-auto">
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No locations yet</h3>
        <p class="text-[13px] text-gray-600 mb-6">Get started by adding your first climbing location.</p>
        <router-link to="/add-location" class="btn inline-flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add First Location
        </router-link>
      </div>
    </div>

    <!-- Locations Grid -->
    <div v-else class="container py-2 sm:py-4">
      <!-- Pick Location CTA -->
      <router-link
        to="/pick-location"
        class="mb-8 block p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">Pick Location</h2>
            <p class="text-xs text-gray-500 mt-0.5">Browse problems & beta videos</p>
          </div>
          <svg class="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </router-link>

      <!-- Trending Videos Section -->
      <div class="mb-8">
        <TrendingVideos />
      </div>

      <!-- Admin Add Location Button -->
      <div v-if="userStore.canCreateLocations" class="mt-8 text-center">
        <router-link
          to="/add-location"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Location
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { locationService } from '../services/locationService.js';
import { formatDateShort } from '../utils/dateUtils.js';
import { useUserStore } from '../stores/userStore.js';
import { fixLocalhostUrl } from '../services/storageUtils.js';
import TrendingVideos from '../components/TrendingVideos.vue';

const router = useRouter();
const userStore = useUserStore();
const locations = ref([]);
const isLoading = ref(true);
const error = ref('');

const loadLocations = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    const data = await locationService.getLocations();
    locations.value = data;
  } catch (err) {
    console.error('Error loading locations:', err);
    error.value = 'Failed to load locations. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const goToLocation = (locationId) => {
  router.push(`/location/${locationId}`);
};

onMounted(loadLocations);
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
