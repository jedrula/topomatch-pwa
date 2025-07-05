<template>
  <footer class="bg-gray-100 text-center py-4 border-t border-gray-300">
    <button
      @click="toggleDebugInfo"
      class="text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
    >
      Debug
    </button>
    <div v-if="showDebugInfo" class="mt-2 text-sm text-gray-600">
      <p v-if="inferenceStore.sessionTime">Session Time: {{ inferenceStore.sessionTime }}</p>
      <p v-if="inferenceStore.matchCount !== null">
        Best Match Count: {{ inferenceStore.matchCount }}
      </p>
      <p v-if="wasmThreadsSupported">WebAssembly Threads Supported: {{ wasmThreadsSupported }}</p>
      <p v-if="wasmSimdSupported">WebAssembly SIMD Supported: {{ wasmSimdSupported }}</p>
      <p v-if="browserInfo">Browser Info: {{ browserInfo.name }} {{ browserInfo.version }}</p>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as wasmFeatureDetect from "wasm-feature-detect";
import Bowser from "bowser";
import { useInferenceStore } from "@/stores/inferenceStore";

const inferenceStore = useInferenceStore();

const showDebugInfo = ref(false);
const wasmThreadsSupported = ref(null);
const wasmSimdSupported = ref(null);
const browserInfo = ref(null);

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

<style scoped>
footer {
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>
