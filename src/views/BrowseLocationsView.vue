<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ error }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="locations.length === 0" class="max-w-7xl mx-auto px-4 py-12 text-center">
      <div class="bg-white rounded-lg shadow p-8">
        <svg
          class="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
        <p class="text-gray-600 mb-6">Get started by adding your first climbing location.</p>
        <router-link
          to="/add-location"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Add First Location
        </router-link>
      </div>
    </div>

    <!-- Locations Grid -->
    <div v-else class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-6">
        <p class="text-gray-600">
          {{ locations.length }} location{{ locations.length !== 1 ? "s" : "" }} found
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="location in locations"
          :key="location.id"
          class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
          @click="goToLocation(location.id)"
        >
          <!-- Hero Image -->
          <div class="relative h-48 bg-gray-200">
            <img
              v-if="location.heroImageUrl"
              :src="location.heroImageUrl"
              :alt="location.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
          </div>

          <!-- Location Info -->
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-2 line-clamp-1">{{ location.name }}</h3>
            <p v-if="location.description" class="text-gray-600 text-sm line-clamp-2 mb-3">
              {{ location.description }}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span v-if="location.createdAt">
                Added {{ formatDateShort(location.createdAt) }}
              </span>
              <div class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { locationService } from "../services/locationService.js";
import { formatDateShort } from "../utils/dateUtils.js";
import { useUserStore } from "../stores/userStore.js";

const router = useRouter();
const userStore = useUserStore();
const locations = ref([]);
const isLoading = ref(true);
const error = ref("");

const loadLocations = async () => {
  try {
    isLoading.value = true;
    error.value = "";
    const data = await locationService.getLocations();
    locations.value = data;
  } catch (err) {
    console.error("Error loading locations:", err);
    error.value = "Failed to load locations. Please try again.";
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
