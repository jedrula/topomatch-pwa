<template>
  <header
    class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm"
  >
    <nav class="flex items-center justify-between max-w-6xl mx-auto">
      <!-- Left side: Breadcrumbs -->
      <div class="flex items-center space-x-2 text-sm">
        <router-link
          to="/"
          class="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          :class="{ 'text-gray-900 font-semibold': isHome }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
            />
          </svg>
          <span>All Regions</span>
        </router-link>

        <svg
          v-if="!isHome && !isHoldDetection"
          class="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>

        <div v-if="!isHome && currentRegion" class="flex items-center space-x-2">
          <img
            :src="currentRegion.thumbnail"
            :alt="currentRegion.name"
            class="w-7 h-7 object-cover rounded-md shadow-sm border border-gray-200"
          />
          <span class="text-gray-900 font-semibold">{{ currentRegion.name }}</span>
        </div>
      </div>

      <!-- Right side: Navigation and App title -->
      <div class="flex items-center space-x-6">
        <!-- Navigation Menu (Desktop) -->
        <nav class="hidden sm:flex items-center space-x-4">
          <router-link
            to="/"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': route.name === 'home' }"
          >
            Regions
          </router-link>
          <router-link
            v-if="userStore.canViewLocations"
            to="/browse-locations"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': isLocationRoute }"
          >
            Locations
          </router-link>
          <router-link
            v-if="userStore.isLoggedIn"
            to="/hold-detection"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': route.name === 'hold-detection' }"
          >
            Hold Detection
          </router-link>
          <router-link
            v-if="userStore.isAdmin"
            to="/admin"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': route.name === 'admin' }"
          >
            Admin
          </router-link>
        </nav>

        <!-- Auth Section (Desktop) -->
        <div class="hidden sm:flex items-center space-x-3">
          <!-- Signed In User -->
          <div v-if="userStore.isLoggedIn" class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-600 font-medium text-sm">
                  {{ userStore.userDisplayName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="text-gray-700 font-medium">{{ userStore.userDisplayName }}</span>
              <span
                v-if="userStore.isAdmin"
                class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium"
              >
                Admin
              </span>
            </div>
            <button
              @click="handleSignOut"
              class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Sign Out
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

        <!-- App Title -->
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu (Dropdown) -->
    <div
      v-if="showMobileMenu"
      class="sm:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm"
    >
      <nav class="max-w-6xl mx-auto py-4 space-y-2">
        <router-link
          to="/"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': route.name === 'home' }"
        >
          Regions
        </router-link>
        <router-link
          v-if="userStore.canViewLocations"
          to="/browse-locations"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': isLocationRoute }"
        >
          Locations
        </router-link>
        <router-link
          v-if="userStore.isLoggedIn"
          to="/hold-detection"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': route.name === 'hold-detection' }"
        >
          Hold Detection
        </router-link>
        <router-link
          v-if="userStore.isAdmin"
          to="/admin"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': route.name === 'admin' }"
        >
          Admin
        </router-link>

        <!-- Mobile Auth Section -->
        <div class="border-t border-gray-200 pt-4 mt-4">
          <div v-if="userStore.isLoggedIn" class="space-y-2">
            <div class="px-4 py-2">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-blue-600 font-medium text-sm">
                    {{ userStore.userDisplayName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <div class="text-gray-900 font-medium">{{ userStore.userDisplayName }}</div>
                  <div v-if="userStore.isAdmin" class="text-purple-600 text-sm">Admin</div>
                </div>
              </div>
            </div>
            <button
              @click="handleSignOut"
              class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium transition-colors rounded-lg"
            >
              Sign Out
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
import { computed, ref, inject } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "../stores/userStore.js";
import { REGIONS } from "@/constants/regions";

const route = useRoute();
const userStore = useUserStore();
const showMobileMenu = ref(false);

// Inject auth modal methods from App.vue
const authModal = inject("authModal");

const isHome = computed(() => route.name === "home");
const isHoldDetection = computed(() => route.name === "hold-detection");
const isLocationRoute = computed(
  () =>
    route.name === "browse-locations" ||
    route.name === "location-detail" ||
    route.name === "location-edit" ||
    route.name === "add-location"
);

const currentRegion = computed(() => {
  if (isHome.value || !route.params.regionId) return null;
  return REGIONS.find((region) => region.id === route.params.regionId);
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
    console.error("Sign out failed:", error);
  }
};

const openAuthModal = () => {
  authModal.open();
  closeMobileMenu();
};
</script>
