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

    <!-- Video container with swipe and scroll support -->
    <div 
      ref="videoContainer"
      class="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth"
      style="scroll-snap-type: y mandatory; scrollbar-width: none; -ms-overflow-style: none;"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @scroll="handleScroll"
    >
      <!-- Video slides container -->
      <div class="relative">
        <div
          v-for="(video, index) in videos"
          :key="video.id || index"
          class="w-full flex items-center justify-center relative"
          :style="{ 
            height: '100vh',
            scrollSnapAlign: 'start'
          }"
        >
          <!-- Video element -->
          <video
            :ref="el => videoElements[index] = el"
            :src="video.downloadUrl"
            :controls="false"
            :muted="false"
            class="w-full h-full object-contain cursor-pointer"
            :class="{ 'pointer-events-none': index !== currentVideoIndex }"
            @loadedmetadata="handleVideoLoaded(index)"
            @ended="onVideoEnded"
            @click="togglePlayPause"
            playsinline
            preload="metadata"
          />
          
          <!-- Custom video controls overlay -->
          <div 
            v-if="index === currentVideoIndex" 
            class="absolute inset-0 flex items-center justify-center z-[60]"
          >
            <!-- Controls container that matches the actual video content size -->
            <div 
              class="relative"
              :style="getVideoContentDimensions(index)"
            >
              <!-- Play/Pause overlay (center of actual video) -->
              <div 
                v-if="!isVideoPlaying(index)"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div class="bg-black/50 rounded-full p-4">
                  <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <!-- Top controls (volume, etc.) - positioned relative to actual video -->
              <div class="absolute top-4 right-4 flex items-center space-x-2">
                <button 
                  @click="toggleMute"
                  class="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200"
                >
                  <svg 
                    v-if="isMuted" 
                    class="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                  </svg>
                  <svg 
                    v-else 
                    class="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                  </svg>
                </button>
              </div>
              
              <!-- Bottom progress bar (full width of actual video) -->
              <div class="absolute bottom-0 left-0 right-0 pointer-events-none">
                <div class="bg-white/20 h-1">
                  <div 
                    class="bg-white h-full transition-all duration-100 ease-linear"
                    :style="{ width: `${getVideoProgress(index)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
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
const isMuted = ref(false);
const videoProgress = ref({});
const isPlaying = ref({});

// Update progress for all videos
const updateVideoProgress = () => {
  Object.entries(videoElements.value).forEach(([index, video]) => {
    if (video && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      videoProgress.value[index] = progress;
      isPlaying.value[index] = !video.paused;
    }
  });
};

// Set up progress tracking interval
let progressInterval = null;

const startProgressTracking = () => {
  if (progressInterval) clearInterval(progressInterval);
  progressInterval = setInterval(updateVideoProgress, 100);
};

const stopProgressTracking = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

// Touch handling for swipe navigation
const touchStartY = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50;
let scrollTimeout = null;

// Initialize current video index
watch(() => props.initialVideoIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < props.videos.length) {
    currentVideoIndex.value = newIndex;
    // Scroll to the correct video when initializing
    nextTick(() => {
      scrollToVideo(newIndex);
    });
  }
}, { immediate: true });

// Scroll handling
const handleScroll = () => {
  // Clear existing timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Debounce scroll events to determine which video is in view
  scrollTimeout = setTimeout(() => {
    const container = videoContainer.value;
    if (!container) return;
    
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    // Calculate which video should be considered "current" based on scroll position
    const newIndex = Math.round(scrollTop / containerHeight);
    
    if (newIndex !== currentVideoIndex.value && newIndex >= 0 && newIndex < props.videos.length) {
      console.log(`Scroll detected: changing from video ${currentVideoIndex.value + 1} to video ${newIndex + 1}`);
      pauseCurrentVideo();
      currentVideoIndex.value = newIndex;
      nextTick(() => {
        playCurrentVideo();
      });
    }
  }, 100);
};

// Scroll to specific video
const scrollToVideo = (index) => {
  const container = videoContainer.value;
  if (!container) return;
  
  const targetScrollTop = index * container.clientHeight;
  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  });
};

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
    const newIndex = currentVideoIndex.value + 1;
    pauseCurrentVideo();
    currentVideoIndex.value = newIndex;
    scrollToVideo(newIndex);
    nextTick(() => {
      playCurrentVideo();
    });
  }
};

const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    const newIndex = currentVideoIndex.value - 1;
    pauseCurrentVideo();
    currentVideoIndex.value = newIndex;
    scrollToVideo(newIndex);
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
      currentVideo.muted = isMuted.value;
      await currentVideo.play();
      startProgressTracking();
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

const toggleMute = () => {
  isMuted.value = !isMuted.value;
  Object.values(videoElements.value).forEach(video => {
    if (video) {
      video.muted = isMuted.value;
    }
  });
};

const isVideoPlaying = (index) => {
  return isPlaying.value[index] || false;
};

const getVideoProgress = (index) => {
  return videoProgress.value[index] || 0;
};

const getVideoContentDimensions = (index) => {
  const video = videoElements.value[index];
  if (!video) {
    return { width: '100%', height: '100%' };
  }
  
  // Get the video's natural dimensions
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  
  if (!videoWidth || !videoHeight) {
    return { width: '100%', height: '100%' };
  }
  
  // Get the container dimensions (viewport)
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  
  // Calculate the aspect ratios
  const videoAspectRatio = videoWidth / videoHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  let displayWidth, displayHeight;
  
  if (videoAspectRatio > containerAspectRatio) {
    // Video is wider - fit to width
    displayWidth = containerWidth;
    displayHeight = containerWidth / videoAspectRatio;
  } else {
    // Video is taller - fit to height  
    displayHeight = containerHeight;
    displayWidth = containerHeight * videoAspectRatio;
  }
  
  return {
    width: `${displayWidth}px`,
    height: `${displayHeight}px`
  };
};

const closePlayer = () => {
  pauseCurrentVideo();
  stopProgressTracking();
  emit('close');
};

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset to initial video and play
    currentVideoIndex.value = props.initialVideoIndex || 0;
    console.log(`Opening video player, starting with video ${currentVideoIndex.value + 1}`);
    nextTick(() => {
      scrollToVideo(currentVideoIndex.value);
      playCurrentVideo();
    });
  } else {
    pauseCurrentVideo();
    stopProgressTracking();
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
  stopProgressTracking();
});
</script>

<style scoped>
/* Ensure proper video sizing */
video {
  max-width: 100vw;
  max-height: 100vh;
}

/* Hide scrollbars for cleaner look */
.overflow-y-auto {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.overflow-y-auto::-webkit-scrollbar {
  display: none; /* WebKit */
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
