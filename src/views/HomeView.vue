<template>
  <div class="min-h-screen bg-gray-50">
    <main class="max-w-6xl mx-auto px-4 py-8 pb-24">
      <!-- Hero Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Select a Climbing Region</h1>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto">
          Choose a region to match your climbing photos with our topo database
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <router-link
          to="/add-location"
          class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900">Add New Location</h3>
              <p class="text-gray-600">Create a new climbing location or gym</p>
            </div>
          </div>
        </router-link>

        <router-link
          to="/browse-locations"
          class="block bg-white p-6 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg
                class="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900">Browse Locations</h3>
              <p class="text-gray-600">View all locations</p>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Region Picker -->
      <div class="mb-8">
        <RegionPicker @regionChange="onRegionChange" />
      </div>

      <!-- Global session loading state -->
      <div
        v-if="inferenceStore.isLoading && !inferenceStore.sessionReady"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <div class="flex items-center space-x-3 mb-4">
          <div
            class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
          ></div>
          <p class="text-gray-600 font-medium">{{ inferenceStore.loadingMessage }}</p>
        </div>
        <p class="text-sm text-gray-500">Preparing the inference engine...</p>
      </div>

      <MainFooter />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import RegionPicker from "@/components/RegionPicker.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useInferenceStore } from "@/stores/inferenceStore";

const router = useRouter();
const inferenceStore = useInferenceStore();

function onRegionChange(newRegionId) {
  router.push({ name: "region", params: { regionId: newRegionId } });
}
</script>
