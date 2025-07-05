<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="max-w-6xl mx-auto px-4 py-8 pb-24">
      <!-- Hero Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Select a Climbing Region</h1>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto">
          Choose a region to match your climbing photos with our topo database
        </p>
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
import AppHeader from "@/components/AppHeader.vue";
import RegionPicker from "@/components/RegionPicker.vue";
import MainFooter from "@/components/MainFooter.vue";
import { useInferenceStore } from "@/stores/inferenceStore";

const router = useRouter();
const inferenceStore = useInferenceStore();

function onRegionChange(newRegionId) {
  router.push({ name: "region", params: { regionId: newRegionId } });
}
</script>
