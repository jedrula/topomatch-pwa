<template>
  <div class="pose-frame-animator">
    <!-- Frame Display -->
    <div class="relative bg-gray-100 rounded-lg overflow-hidden">
      <img
        v-if="currentFrame"
        :src="currentFrame.url"
        :alt="`Frame ${currentFrameIndex + 1}`"
        class="w-full h-auto max-h-[80vh] object-contain"
      />
      
      <!-- Frame Counter Overlay -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
        {{ currentFrameIndex + 1 }} / {{ frames.length }}
      </div>
      
      <!-- Play/Pause Button -->
      <button
        @click="togglePlayPause"
        class="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity"
        :title="isPlaying ? 'Pause' : 'Play'"
      >
        <svg v-if="isPlaying" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>
    
    <!-- Frame Info (only shown in debug mode) -->
    <div v-if="debugMode" class="mt-2 text-xs text-gray-600">
      <p v-if="currentFrame.poseData">
        ✓ Pose detected (confidence: {{ (currentFrame.poseData.confidence * 100).toFixed(0) }}%)
      </p>
      <p v-else class="text-yellow-600">
        ⚠ No pose detected in this frame
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// Props
const props = defineProps({
  frames: {
    type: Array,
    required: true,
    default: () => []
  },
  frameRate: {
    type: Number,
    default: 1 // 1 frame per second by default
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  debugMode: {
    type: Boolean,
    default: false
  }
});

// State
const currentFrameIndex = ref(0);
const isPlaying = ref(props.autoPlay);
let animationInterval = null;

// Computed
const currentFrame = computed(() => {
  if (props.frames.length === 0) return null;
  return props.frames[currentFrameIndex.value];
});

// Methods
const nextFrame = () => {
  if (props.frames.length === 0) return;
  currentFrameIndex.value = (currentFrameIndex.value + 1) % props.frames.length;
};

const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value;
};

const startAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval);
  }
  
  const intervalMs = 1000 / props.frameRate;
  animationInterval = setInterval(() => {
    if (isPlaying.value) {
      nextFrame();
    }
  }, intervalMs);
};

const stopAnimation = () => {
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
};

// Watchers
watch(() => props.frameRate, () => {
  if (isPlaying.value) {
    startAnimation();
  }
});

watch(() => props.frames, () => {
  // Reset to first frame when frames change
  currentFrameIndex.value = 0;
});

// Lifecycle
onMounted(() => {
  startAnimation();
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<style scoped>
.pose-frame-animator {
  width: 100%;
}
</style>
