import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useInferenceStore = defineStore('inference', () => {
  console.log('🎭 [MOCK] Inference store initialized - ZERO memory footprint! - dumm');


  const inferenceResults = ref([]);
  const matchCounts = computed(() => inferenceResults.value.length);

  const runInferenceBatch = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const ensureSessionReady = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  };
    

  return {
    runInferenceBatch,
    ensureSessionReady,
    inferenceResults,
    matchCounts,
  };
});
