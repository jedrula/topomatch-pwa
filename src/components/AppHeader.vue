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
            to="/hold-detection"
            class="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            :class="{ 'text-blue-600 font-semibold': route.name === 'hold-detection' }"
          >
            Hold Detection
          </router-link>
        </nav>

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
          <div class="text-lg font-bold text-gray-800">Topo Matcher</div>
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
          to="/hold-detection"
          @click="closeMobileMenu"
          class="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium transition-colors rounded-lg"
          :class="{ 'text-blue-600 bg-blue-50 font-semibold': route.name === 'hold-detection' }"
        >
          Hold Detection
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { REGIONS } from "@/constants/regions";

const route = useRoute();
const showMobileMenu = ref(false);

const isHome = computed(() => route.name === "home");
const isHoldDetection = computed(() => route.name === "hold-detection");

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
</script>
