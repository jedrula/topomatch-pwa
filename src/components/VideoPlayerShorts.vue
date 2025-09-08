<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black z-[10000] flex flex-col">
    <!-- Header with close button and info -->
    <div class="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
      <div class="flex items-center justify-between text-white">
        <div class="flex-1">
          <h3 class="font-semibold text-lg">{{ problem?.name || 'Boulder Videos' }}</h3>
          <p class="text-sm text-gray-300">{{ currentVideoIndex + 1 }} of {{ videos.length }}</p>
        </div>
        <button
          @click="closePlayer"
          class="text-white hover:text-gray-300 transition-colors p-2"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Desktop navigation arrows (hidden on mobile) -->
    <div class="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-50 flex-col space-y-4">
      <button
        @click="previousVideo"
        :disabled="currentVideoIndex === 0"
        :class="[
          'bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200',
          currentVideoIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        ]"
        title="Previous video"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      
      <button
        @click="nextVideo"
        :disabled="currentVideoIndex === videos.length - 1"
        :class="[
          'bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200',
          currentVideoIndex === videos.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        ]"
        title="Next video"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Video container with swipe support -->
    <div 
      ref="videoContainer"
      class="flex-1 relative overflow-hidden"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Video slides container -->
      <div 
        class="h-full transition-transform duration-300 ease-out"
        :style="{ transform: `translateY(${-currentVideoIndex * 100}%)` }"
      >
        <div
          v-for="(video, index) in videos"
          :key="video.id || index"
          class="w-full h-full flex items-center justify-center relative"
          :style="{ height: '100vh' }"
        >
          <!-- Video element -->
          <video
            :ref="el => videoElements[index] = el"
            :src="video.downloadUrl"
            :controls="index === currentVideoIndex"
            :muted="false"
            class="w-full h-full object-contain"
            :class="{ 'pointer-events-none': index !== currentVideoIndex }"
            @loadedmetadata="handleVideoLoaded(index)"
            @ended="onVideoEnded"
            playsinline
            preload="metadata"
          />
          
          <!-- Video overlay info -->
          <div class="absolute bottom-20 left-4 right-4 text-white pointer-events-none">
            <div class="bg-black/50 rounded-lg p-3">
              <p class="text-sm font-medium">{{ video.name || `Beta ${index + 1}` }}</p>
              <p v-if="video.description" class="text-xs text-gray-300 mt-1">{{ video.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile swipe indicators -->
      <div class="md:hidden absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center pointer-events-none">
        <div class="bg-black/50 rounded-full px-4 py-2">
          <div class="flex flex-col items-center space-y-1">
            <svg v-if="currentVideoIndex > 0" class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
            <span class="text-xs">{{ currentVideoIndex + 1 }}/{{ videos.length }}</span>
            <svg v-if="currentVideoIndex < videos.length - 1" class="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Peek of next/previous videos (mobile only) -->
      <template v-if="videos.length > 1">
        <!-- Previous video peek (top) -->
        <div 
          v-if="currentVideoIndex > 0"
          class="md:hidden absolute top-0 left-0 right-0 h-16 overflow-hidden opacity-50 pointer-events-none"
        >
          <div class="h-full bg-gradient-to-b from-gray-800 to-transparent flex items-center justify-center">
            <span class="text-white text-xs">Previous video</span>
          </div>
        </div>

        <!-- Next video peek (bottom) -->
        <div 
          v-if="currentVideoIndex < videos.length - 1"
          class="md:hidden absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-50 pointer-events-none"
        >
          <div class="h-full bg-gradient-to-t from-gray-800 to-transparent flex items-center justify-center">
            <span class="text-white text-xs">Next video</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Bottom info bar -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
      <div class="text-white text-center text-sm">
        <p>Swipe up/down to navigate videos</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  videos: {
    type: Array,
    default: () => []
  },
  problem: {
    type: Object,
    default: null
  },
  initialVideoIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close']);

// Refs
const videoContainer = ref(null);
const videoElements = ref({});
const currentVideoIndex = ref(0);

// Touch handling for swipe navigation
const touchStartY = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50;

// Initialize current video index
watch(() => props.initialVideoIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < props.videos.length) {
    currentVideoIndex.value = newIndex;
  }
}, { immediate: true });

// Touch handlers for swipe navigation
const handleTouchStart = (event) => {
  touchStartY.value = event.touches[0].clientY;
};

const handleTouchMove = (event) => {
  // Prevent default scrolling
  event.preventDefault();
};

const handleTouchEnd = (event) => {
  touchEndY.value = event.changedTouches[0].clientY;
  const deltaY = touchStartY.value - touchEndY.value;
  
  // Check if swipe is significant enough
  if (Math.abs(deltaY) > minSwipeDistance) {
    if (deltaY > 0) {
      // Swipe up - next video
      nextVideo();
    } else {
      // Swipe down - previous video
      previousVideo();
    }
  }
};

// Navigation methods
const nextVideo = () => {
  if (currentVideoIndex.value < props.videos.length - 1) {
    pauseCurrentVideo();
    currentVideoIndex.value++;
    nextTick(() => {
      playCurrentVideo();
    });
  }
};

const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    pauseCurrentVideo();
    currentVideoIndex.value--;
    nextTick(() => {
      playCurrentVideo();
    });
  }
};

// Video control methods
const pauseCurrentVideo = () => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (currentVideo && !currentVideo.paused) {
    currentVideo.pause();
    console.log(`Paused video ${currentVideoIndex.value + 1}`);
  }
};

const playCurrentVideo = async () => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (currentVideo) {
    try {
      currentVideo.currentTime = 0; // Reset to beginning
      await currentVideo.play();
      console.log(`Playing video ${currentVideoIndex.value + 1}`);
    } catch (error) {
      console.log('Video play failed:', error);
    }
  }
};

const handleVideoLoaded = (index) => {
  console.log(`Video ${index + 1} loaded`);
};

const onVideoEnded = () => {
  // Auto-advance to next video when current one ends
  if (currentVideoIndex.value < props.videos.length - 1) {
    nextVideo();
  }
};

// Keyboard navigation
const handleKeyDown = (event) => {
  if (!props.isOpen) return;
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      previousVideo();
      break;
    case 'ArrowDown':
      event.preventDefault();
      nextVideo();
      break;
    case 'Escape':
      event.preventDefault();
      closePlayer();
      break;
    case ' ':
      event.preventDefault();
      togglePlayPause();
      break;
  }
};

const togglePlayPause = () => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (currentVideo) {
    if (currentVideo.paused) {
      currentVideo.play();
    } else {
      currentVideo.pause();
    }
  }
};

const closePlayer = () => {
  pauseCurrentVideo();
  emit('close');
};

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset to initial video and play
    currentVideoIndex.value = props.initialVideoIndex || 0;
    console.log(`Opening video player, starting with video ${currentVideoIndex.value + 1}`);
    nextTick(() => {
      playCurrentVideo();
    });
  } else {
    pauseCurrentVideo();
    console.log('Closing video player');
  }
});

watch(currentVideoIndex, (newIndex, oldIndex) => {
  console.log(`Video index changed from ${oldIndex} to ${newIndex}`);
  
  // Pause all videos except current one
  Object.entries(videoElements.value).forEach(([index, video]) => {
    const videoIndex = parseInt(index);
    if (video && videoIndex !== newIndex) {
      if (!video.paused) {
        video.pause();
        console.log(`Paused video ${videoIndex + 1} (background)`);
      }
    }
  });
});

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
/* Ensure proper video sizing */
video {
  max-width: 100vw;
  max-height: 100vh;
}

/* Hide default video controls on mobile for cleaner look */
@media (max-width: 768px) {
  video::-webkit-media-controls {
    display: none !important;
  }
  video::-webkit-media-controls-enclosure {
    display: none !important;
  }
}

/* Smooth transitions */
.transition-transform {
  transition: transform 0.3s ease-out;
}
</style>
