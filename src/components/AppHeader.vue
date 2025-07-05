<template>
  <header class="app-header bg-white border-b border-gray-200 px-4 py-3">
    <nav class="flex items-center justify-between max-w-6xl mx-auto">
      <!-- Left side: Breadcrumbs -->
      <div class="flex items-center space-x-2 text-sm">
        <router-link
          to="/"
          class="text-blue-600 hover:text-blue-800 font-medium"
          :class="{ 'text-gray-900 font-semibold': isHome }"
        >
          All Regions
        </router-link>

        <span v-if="!isHome" class="text-gray-400">/</span>

        <div v-if="!isHome && currentRegion" class="flex items-center space-x-2">
          <img
            :src="currentRegion.thumbnail"
            :alt="currentRegion.name"
            class="w-6 h-6 object-cover rounded"
          />
          <span class="text-gray-900 font-semibold">{{ currentRegion.name }}</span>
        </div>
      </div>

      <!-- Right side: App title -->
      <div class="text-lg font-bold text-gray-800">Topo Matcher</div>
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

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.router-link-exact-active {
  color: #1f2937;
  font-weight: 600;
}
</style>
