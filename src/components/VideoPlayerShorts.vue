<template>
  <div class="fixed inset-0 bg-black z-[10000] flex flex-col">
    <!-- Header with close button and info -->
    <div class="absolute top-0 left-0 right-0 z-[100] bg-gradient-to-b from-black/80 to-transparent p-4">
      <div class="flex items-center justify-between text-white">
        <div class="flex-1">
          <h3 class="font-semibold text-lg">{{ title }}</h3>
          <p class="text-sm text-gray-300">
            {{ currentVideoIndex + 1 }} of {{ videos.length }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Speaker/Mute button -->
          <button 
            @click.stop="toggleMute"
            class="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg 
              v-if="isMuted" 
              class="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
            </svg>
            <svg 
              v-else 
              class="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
            </svg>
          </button>
          <!-- Close button -->
          <button
            @click.stop="closePlayer"
            class="text-white hover:text-gray-300 transition-colors p-2"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Desktop navigation arrows (hidden on mobile) -->
    <div class="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-[90] flex-col space-y-4">
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
      @scroll="handleScroll"
    >
      <!-- Loading state -->
      <div 
        v-if="loading"
        class="w-full h-full flex items-center justify-center text-white"
      >
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading videos...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div 
        v-else-if="videos.length === 0"
        class="w-full h-full flex items-center justify-center text-white"
      >
        <div class="text-center">
          <p class="text-lg mb-2">No beta videos available</p>
          <p class="text-sm text-gray-400">Be the first to upload a beta for this problem!</p>
        </div>
      </div>

      <!-- Video slides container -->
      <div v-else class="relative">
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
            :poster="video.thumbnailBase64"
            :controls="false"
            :muted="false"
            class="w-full h-full object-contain"
            :class="{ 'pointer-events-none': index !== currentVideoIndex }"
            @loadedmetadata="handleVideoLoaded(index)"
            @ended="onVideoEnded"
            playsinline
            preload="metadata"
            crossorigin="anonymous"
          />
          
          <!-- Custom video controls overlay -->
          <div 
            v-if="index === currentVideoIndex" 
            class="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none"
          >
            <!-- Controls container that matches the actual video content size -->
            <div 
              class="relative pointer-events-auto"
              :style="getVideoContentDimensions(index)"
              @click="togglePlayPause"
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
              
              <!-- Bottom progress bar (at the very bottom edge of video content) -->
              <div 
                class="absolute bottom-0 left-0 right-0 cursor-pointer"
                @click.stop="handleProgressBarClick"
              >
                <div class="bg-white/20 h-1 relative">
                  <!-- Clickable overlay for better UX -->
                  <div class="absolute -top-2 -bottom-2 left-0 right-0"></div>
                  <div 
                    class="bg-white h-full transition-all duration-100 ease-linear"
                    :style="{ width: `${getVideoProgress(index)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Video metadata overlay -->
          <div class="absolute bottom-20 right-4 max-w-xs pointer-events-auto z-[70]">
            <VideoMetadata :video="video" />
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VideoMetadata from './VideoMetadata.vue';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  getVideos: {
    type: Function,
    required: true
  },
  videoId: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: 'Videos'
  },
  initialVideoId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['close']);

// Refs
const videos = ref([]);
const loading = ref(false);
const videoContainer = ref(null);
const videoElements = ref({});
const isMuted = ref(true); // Start muted by default
const videoProgress = ref({});
const isPlaying = ref({});

// Computed current video index based on videoId from URL
const currentVideoIndex = computed(() => {
  const videoId = route.query.videoId;
  if (!videoId || videos.value.length === 0) return 0;
  
  const index = videos.value.findIndex(v => v.id === videoId);
  return index >= 0 ? index : 0;
});

// Helper function to update videoId in URL
const setCurrentVideoId = (videoId) => {
  router.replace({
    query: {
      ...route.query,
      videoId
    }
  });
};

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

let scrollTimeout = null;

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
    
    if (newIndex !== currentVideoIndex.value && newIndex >= 0 && newIndex < videos.value.length) {
      // Update URL with new video ID
      const newVideo = videos.value[newIndex];
      if (newVideo && newVideo.id) {
        setCurrentVideoId(newVideo.id);
        nextTick(() => {
          pauseOtherVideos(newIndex);
          const video = videoElements.value[newIndex];
          if (video && video.paused) {
            video.muted = isMuted.value;
            video.play().catch(err => console.log('Autoplay failed:', err));
            startProgressTracking();
          }
        });
      }
    }
  }, 100);
};

// Pause all videos except the current one
const pauseOtherVideos = (currentIndex) => {
  Object.entries(videoElements.value).forEach(([index, video]) => {
    const videoIndex = parseInt(index);
    if (video && videoIndex !== currentIndex && !video.paused) {
      video.pause();
      video.currentTime = 0; // Reset to beginning
    }
  });
};

// Scroll to specific video
const scrollToVideo = (index) => {
  const container = videoContainer.value;
  if (!container) return;
  
  pauseOtherVideos(index);
  
  const targetScrollTop = index * container.clientHeight;
  container.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  });
};

// Navigation methods
const nextVideo = () => {
  if (currentVideoIndex.value < videos.value.length - 1) {
    const newIndex = currentVideoIndex.value + 1;
    const newVideo = videos.value[newIndex];
    if (newVideo && newVideo.id) {
      setCurrentVideoId(newVideo.id);
      nextTick(() => {
        scrollToVideo(newIndex);
        nextTick(() => playCurrentVideo());
      });
    }
  }
};

const previousVideo = () => {
  if (currentVideoIndex.value > 0) {
    const newIndex = currentVideoIndex.value - 1;
    const newVideo = videos.value[newIndex];
    if (newVideo && newVideo.id) {
      setCurrentVideoId(newVideo.id);
      nextTick(() => {
        scrollToVideo(newIndex);
        nextTick(() => playCurrentVideo());
      });
    }
  }
};

// Video control methods
const pauseCurrentVideo = () => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (currentVideo && !currentVideo.paused) {
    currentVideo.pause();
  }
};

const playCurrentVideo = async (resetTime = true) => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  console.log('Playing video at index:', currentVideoIndex.value);
  if (currentVideo) {
    try {
      if (resetTime) {
        currentVideo.currentTime = 0; // Reset to beginning
      }
      currentVideo.muted = isMuted.value;
      await currentVideo.play();
      startProgressTracking();
    } catch (error) {
      console.log('Video play failed:', error);
    }
  }
};

const handleVideoLoaded = () => {
};

const onVideoEnded = () => {
  // Don't auto-advance to next video - let user manually navigate
  // Video will stay on the current one when it ends
};

// Keyboard navigation
const handleKeyDown = (event) => {
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
  const container = videoContainer.value;
  
  if (!video || !container) {
    return { width: '100%', height: '100%' };
  }
  
  // Get the video's natural dimensions
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  
  if (!videoWidth || !videoHeight) {
    return { width: '100%', height: '100%' };
  }
  
  // Get the actual container dimensions (not window dimensions)
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  
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

const handleProgressBarClick = (event) => {
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (!currentVideo || !currentVideo.duration) return;
  
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const progressBarWidth = rect.width;
  
  // Calculate the percentage clicked
  const clickPercentage = clickX / progressBarWidth;
  
  // Set the video time based on the click position
  const newTime = clickPercentage * currentVideo.duration;
  currentVideo.currentTime = Math.max(0, Math.min(newTime, currentVideo.duration));
  
};

// Load videos using getVideos function
const loadVideos = async () => {
  try {
    loading.value = true;
    videos.value = await props.getVideos(props.videoId);
  } catch (error) {
    console.error('Error loading videos:', error);
    videos.value = [];
  } finally {
    loading.value = false;
  }
};


// Initialize player when opened
const initializePlayer = async () => {
  if (videos.value.length === 0) return;
  
  await nextTick();
  const currentVideoId = route.query.videoId || props.initialVideoId;
  const isValidVideoId = currentVideoId && videos.value.some(v => v.id === currentVideoId);
  
  if (!isValidVideoId && videos.value.length > 0) {
    // Set first video as current
    setCurrentVideoId(videos.value[0].id);
    await nextTick();
    scrollToVideo(currentVideoIndex.value);
    await nextTick();
    playCurrentVideo();
  }
  else if (isValidVideoId) {
    await nextTick();
    scrollToVideo(currentVideoIndex.value);
    await nextTick();
    playCurrentVideo();
  }
};

// Lifecycle
onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown);
  await loadVideos();
  await initializePlayer();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  stopProgressTracking();
});

// Expose initializePlayer so parent can call it when videos load
defineExpose({
  initializePlayer
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
