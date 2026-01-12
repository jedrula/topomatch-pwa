<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container py-2 sm:py-4">
      <!-- Search Input -->
      <div class="mb-8">
        <form @submit.prevent="handleSearch" class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Find location"
            autofocus
            class="w-full h-12 px-4 pr-12 text-[15px] border border-gray-200 rounded-lg transition-all duration-200"
            @input="handleSearchInput"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="clearSearch"
            class="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="submit"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Search Results (when searching) -->
      <div v-if="isSearching && searchQuery" class="mb-8">
        <!-- Loading -->
        <div v-if="isSearchLoading" class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>

        <!-- Results -->
        <div v-else-if="searchResults.length > 0">
          <h2 class="text-[15px] font-semibold text-gray-900 mb-4">
            Search Results ({{ searchResults.length }})
          </h2>
          <LocationGrid :locations="searchResults" />
        </div>

        <!-- No Results -->
        <div v-else class="card text-center py-12">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No locations found</h3>
          <p class="text-[13px] text-gray-600">Try a different search term</p>
        </div>
      </div>

      <!-- Favorite Locations / All Locations -->
      <div v-if="!isSearching || !searchQuery">
        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="card">
          <div class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md">
            {{ error }}
          </div>
        </div>

        <!-- Locations List -->
        <div v-else-if="locations.length > 0">
          <h2 class="text-[15px] font-semibold text-gray-900 mb-4">
            {{ showingLikedLocations ? 'Your Favorite Locations' : 'Most Liked Locations' }}
          </h2>
          <LocationGrid :locations="locations" />
        </div>

        <!-- Empty State -->
        <div v-else class="card text-center py-12">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No locations yet</h3>
          <p class="text-[13px] text-gray-600">Get started by adding your first climbing location</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { locationService } from '../services/locationService.js';
import { useUserStore } from '../stores/userStore.js';
import LocationGrid from '../components/LocationGrid.vue';

const userStore = useUserStore();
const searchQuery = ref('');
const isSearching = ref(false);
const isSearchLoading = ref(false);
const isLoading = ref(true);
const error = ref('');
const locations = ref([]);
const searchResults = ref([]);
const showingLikedLocations = ref(false); // Track if showing liked or most liked
let searchDebounceTimer = null;

// Minimum characters required to trigger search
const MIN_SEARCH_LENGTH = 2;

const loadLocations = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    
    // Single call that handles both authenticated and unauthenticated users
    const result = await locationService.getPickerLocations();
    locations.value = result.locations;
    showingLikedLocations.value = result.type === 'liked';
  } catch (err) {
    console.error('Error loading locations:', err);
    error.value = 'Failed to load locations. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleSearchInput = () => {
  // Clear existing timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  // If query is empty, clear results immediately
  if (searchQuery.value.length === 0) {
    isSearching.value = false;
    searchResults.value = [];
    return;
  }

  // Only search if minimum characters met
  if (searchQuery.value.length >= MIN_SEARCH_LENGTH) {
    // Debounce: wait 300ms after user stops typing
    searchDebounceTimer = setTimeout(() => {
      handleSearch();
    }, 300);
  }
};

const handleSearch = async () => {
  const query = searchQuery.value.trim();
  
  if (!query || query.length < MIN_SEARCH_LENGTH) {
    isSearching.value = false;
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    isSearchLoading.value = true;
    searchResults.value = [];

    // Use prefix-based search (Firestore range query)
    const results = await locationService.searchLocationsByPrefix(query);
    searchResults.value = results;
  } catch (err) {
    console.error('Error searching locations:', err);
    searchResults.value = [];
  } finally {
    isSearchLoading.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  isSearching.value = false;
  searchResults.value = [];
};

onMounted(loadLocations);

onUnmounted(() => {
  // Clean up debounce timer
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
});
</script>
