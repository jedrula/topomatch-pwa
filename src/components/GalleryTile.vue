<template>
  <div
    class="relative overflow-hidden group cursor-pointer"
    :style="tileStyle"
    @click="onTileClick"
    v-tooltip="{
      content: tooltipContent,
      html: true,
      placement: 'top',
      delay: { show: 100, hide: 100 },
      theme: 'tooltip',
      autoHide: true,
    }"
  >
    <!-- Visualize Button -->
    <button
      v-if="inferenceStore.inferenceResults[img]"
      @click.stop="onVisualize"
      :aria-pressed="isCurrentlyVisualized"
      title="Visualize matches"
      class="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 rounded-full p-1.5 shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
    >
      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    </button>

    <!-- Cache Status Indicator -->
    <div
      v-if="isCached"
      class="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full p-1 shadow-sm"
      title="Downloaded for offline use"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Image Container -->
    <div class="w-full h-full flex items-center justify-center relative">
      <CachedImage :src="img" alt="region image" class="max-w-full max-h-full object-cover" />

      <!-- Processing Spinner -->
      <div
        v-if="inferenceStore.currentlyProcessingImage === img"
        class="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      >
        <div
          class="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"
        ></div>
      </div>
    </div>

    <!-- Filename -->
    <div class="absolute bottom-1 left-1 right-1 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
      <p class="text-white text-xs font-medium truncate">{{ img.split("/").pop() }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStore';
import { imageCacheService } from '@/services/imageCacheService';
import CachedImage from '@/components/CachedImage.vue';

const props = defineProps({
  img: {
    type: String,
    required: true,
  },
  selected: {
    type: Boolean,
    required: true,
  },
  isCurrentlyVisualized: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['visualize', 'click']);

const inferenceStore = useInferenceStore();
const isCached = ref(false);

// Check if image is cached
const checkCacheStatus = async () => {
  try {
    isCached.value = await imageCacheService.isImageCached(props.img);
  } catch (error) {
    console.error('Error checking cache status:', error);
  }
};

// Check cache status on mount and when img changes
onMounted(async () => {
  // Small delay to ensure cache service is initialized
  await new Promise(resolve => setTimeout(resolve, 50));
  await checkCacheStatus();
  
  // Listen for cache updates
  imageCacheService.addEventListener('cacheUpdated', handleCacheUpdate);
  imageCacheService.addEventListener('cacheRefresh', handleCacheRefresh);
});

onUnmounted(() => {
  imageCacheService.removeEventListener('cacheUpdated', handleCacheUpdate);
  imageCacheService.removeEventListener('cacheRefresh', handleCacheRefresh);
});

watch(() => props.img, checkCacheStatus);

// Handle cache update events
const handleCacheUpdate = (event) => {
  const { imagePath, action } = event.detail;
  if (imagePath === props.img) {
    isCached.value = action === 'cached';
  }
};

// Handle cache refresh events
const handleCacheRefresh = async () => {
  await checkCacheStatus();
};

function onVisualize() {
  emit('visualize', props.img);
}

function onTileClick() {
  emit('click', props.img);
}

// Helper to get border color based on number of matches
function getMatchBorderColor(matches) {
  if (typeof matches !== 'number') return '#1976d2'; // default blue
  // Assume 0-100 is the range, interpolate from red to green
  const min = 0,
    max = 100;
  const clamped = Math.max(min, Math.min(max, matches));
  // Use color-mix if supported, else fallback
  // 0 = red, 100 = green
  const percent = (clamped - min) / (max - min);
  // Use HSL: 0deg (red) to 120deg (green)
  const hue = 0 + percent * 120;
  return `hsl(${hue}, 70%, 45%)`;
}

const tileStyle = computed(() => {
  const matches =
    inferenceStore.matchCounts && inferenceStore.matchCounts[props.img] !== undefined
      ? inferenceStore.matchCounts[props.img]
      : undefined;
  let border;
  if (matches !== undefined) {
    border = '2px solid ' + getMatchBorderColor(matches);
  } else if (props.selected) {
    border = '1px solid #1976d2';
  } else {
    border = '1px solid transparent';
  }
  return { border };
});

const tooltipContent = computed(() => {
  let content = '';
  if (inferenceStore.inferenceTimes && inferenceStore.inferenceTimes[props.img] !== undefined) {
    content += `<div class='inference-time'>Inference: ${inferenceStore.inferenceTimes[
      props.img
    ].toFixed(2)} ms</div>`;
  }
  if (inferenceStore.matchCounts && inferenceStore.matchCounts[props.img] !== undefined) {
    content += `<div class='match-count'>Number of Matches: ${
      inferenceStore.matchCounts[props.img]
    }</div>`;
  }
  if (!content) {
    content = '<em>No data</em>';
  }
  content +=
    "<div class='click-hint' style='margin-top: 8px; font-size: 11px; color: #6b7280;'>Click to view large image</div>";
  return content;
});
</script>
