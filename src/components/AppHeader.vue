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
          v-if="!isHome"
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

      <!-- Right side: App title -->
      <div class="flex items-center space-x-2">
        <div class="text-lg font-bold text-gray-800">Topo Matcher</div>
        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { REGIONS } from "@/constants/regions";

const route = useRoute();

const isHome = computed(() => route.name === "home");

const currentRegion = computed(() => {
  if (isHome.value || !route.params.regionId) return null;
  return REGIONS.find((region) => region.id === route.params.regionId);
});
</script>
