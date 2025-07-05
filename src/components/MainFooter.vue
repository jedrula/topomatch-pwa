<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 px-4 py-3 z-40">
    <div class="max-w-6xl mx-auto text-center">
      <button
        @click="toggleDebugInfo"
        class="text-sm text-gray-600 hover:text-gray-800 focus:outline-none transition-colors"
      >
        Debug
      </button>
      <div v-if="showDebugInfo" class="mt-2 text-sm text-gray-600 space-y-1">
        <p v-if="inferenceStore.sessionTime">Session Time: {{ inferenceStore.sessionTime }}</p>
        <p v-if="bestMatchCount !== null">Best Match Count: {{ bestMatchCount }}</p>
        <p v-if="wasmThreadsSupported">WebAssembly Threads Supported: {{ wasmThreadsSupported }}</p>
        <p v-if="wasmSimdSupported">WebAssembly SIMD Supported: {{ wasmSimdSupported }}</p>
        <p v-if="browserInfo">Browser Info: {{ browserInfo.name }} {{ browserInfo.version }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import * as wasmFeatureDetect from "wasm-feature-detect";
import Bowser from "bowser";
import { useInferenceStore } from "@/stores/inferenceStore";

const inferenceStore = useInferenceStore();

const showDebugInfo = ref(false);
const wasmThreadsSupported = ref(null);
const wasmSimdSupported = ref(null);
const browserInfo = ref(null);

// Get the best match count from the first item in sortedMatchCounts
const bestMatchCount = computed(() => {
  const sortedCounts = Object.values(inferenceStore.sortedMatchCounts);
  return sortedCounts.length > 0 ? sortedCounts[0] : null;
});

function toggleDebugInfo() {
  showDebugInfo.value = !showDebugInfo.value;
}

onMounted(async () => {
  // Check WebAssembly features
  wasmThreadsSupported.value = await wasmFeatureDetect.threads();
  wasmSimdSupported.value = await wasmFeatureDetect.simd();

  // Check browser info
  const browser = Bowser.getParser(window.navigator.userAgent);
  browserInfo.value = {
    name: browser.getBrowserName(),
    version: browser.getBrowserVersion(),
    os: browser.getOSName(),
    osVersion: browser.getOSVersion(),
  };
});
</script>
