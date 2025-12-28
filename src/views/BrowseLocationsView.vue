<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container py-8">
      <div class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md">
        {{ error }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="locations.length === 0" class="container py-16 text-center">
      <div class="card max-w-md mx-auto">
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
    <div v-else class="container py-6 sm:py-8">
      <!-- Trending Videos Section -->
      <div class="mb-8">
        <TrendingVideos />
      </div>

      <!-- Section Header -->
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-[15px] font-semibold text-gray-900">Locations</h2>
          <p class="text-[13px] text-gray-600 mt-0.5">Pick a location to view problems</p>
        </div>
        
        <!-- Add Location Button -->
        <router-link
          v-if="userStore.canCreateLocations"
          to="/add-location"
          class="btn inline-flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </router-link>
      </div>

      <!-- Locations Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div class="p-4">
            <h3 class="text-[14px] font-semibold text-gray-900 mb-1 line-clamp-1">
              {{ location.name }}
            </h3>
            <p v-if="location.description" class="text-[13px] text-gray-600 line-clamp-2 mb-3">
              {{ location.description }}
            </p>
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
