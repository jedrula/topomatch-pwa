<template>
  <header
    class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm"
  >
    <nav class="flex items-center justify-between max-w-6xl mx-auto">
      <!-- Left side: App Title -->
      <div class="flex items-center">
        <router-link 
          to="/" 
          class="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          TopoMatch(v1.5)
        </router-link>
      </div>

      <!-- Right side: Navigation and App title -->
      <div class="flex items-center space-x-6">
        <!-- Navigation Menu (Desktop) -->
        <nav class="hidden sm:flex items-center space-x-4">
          <router-link
            v-if="userStore.canViewLocations"
            to="/"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': isLocationRoute }"
          >
            Locations
          </router-link>
          <router-link
            v-if="currentLocationId"
            :to="`/location/${currentLocationId}/jobs`"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': isJobsRoute }"
          >
            Jobs
          </router-link>
        </nav>

        <!-- Auth Section (Desktop) -->
        <div class="hidden sm:flex items-center space-x-3">
          <!-- Signed In User -->
          <div v-if="userStore.isLoggedIn" class="flex items-center space-x-4">
            <router-link
              to="/profile"
              class="text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              {{ userStore.userDisplayName }}
            </router-link>
            <button
              @click="handleSignOut"
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              sign out
            </button>
          </div>

          <!-- Not Signed In -->
          <button
            v-else
            @click="openAuthModal"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign In
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="sm:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>

    <!-- Mobile Menu (Dropdown) -->
    <div
      v-if="showMobileMenu"
      class="sm:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm"
    >
      <nav class="max-w-6xl mx-auto py-4 space-y-2">
        <router-link
          v-if="userStore.canViewLocations"
          to="/"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': isLocationRoute }"
        >
          Locations
        </router-link>
        <router-link
          v-if="currentLocationId"
          :to="`/location/${currentLocationId}/jobs`"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': isJobsRoute }"
        >
          Jobs
        </router-link>

        <!-- Mobile Auth Section -->
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div v-if="userStore.isLoggedIn" class="space-y-2">
            <router-link
              to="/profile"
              @click="closeMobileMenu"
              class="block px-4 py-2 text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              {{ userStore.userDisplayName }}
            </router-link>
            <button
              @click="handleSignOut"
              class="block w-full text-left px-4 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-lg"
            >
              sign out
            </button>
          </div>

          <button
            v-else
            @click="openAuthModal"
            class="block w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium transition-colors rounded-lg"
          >
            Sign In
          </button>
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';

const route = useRoute();
const userStore = useUserStore();
const showMobileMenu = ref(false);

// Inject auth modal methods from App.vue
const authModal = inject('authModal');

const isLocationRoute = computed(
  () =>
    route.name === 'home' ||
    route.name === 'location-detail' ||
    route.name === 'location-edit' ||
    route.name === 'add-location'
);

const isJobsRoute = computed(() => route.name === 'location-jobs');

const currentLocationId = computed(() => {
  // Show Jobs link when viewing a location or its jobs
  if (route.params.locationId) {
    return route.params.locationId;
  }
  return null;
});

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

const handleSignOut = async () => {
  try {
    await userStore.signOut();
    closeMobileMenu();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};

const openAuthModal = () => {
  authModal.open();
  closeMobileMenu();
};
</script>
