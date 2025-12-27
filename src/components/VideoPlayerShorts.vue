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

    <!-- Video container with swipe and scroll support -->
    <div 
      ref="videoContainer"
      class="flex-1 relative overflow-y-auto overflow-x-hidden"
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
          :data-video-index="index"
          class="w-full flex items-center justify-center relative"
          :style="{ 
            height: '100vh',
            scrollSnapAlign: 'start'
          }"
        >
          <!-- Video element -->
          <video
            :ref="el => {
              if (el) {
                videoElements[index] = el;
                setupVideoListeners(el, index);
              }
            }"
            :src="video.url || video.downloadUrl"
            :poster="video.thumbnailBase64"
            :controls="false"
            :muted="false"
            class="w-full h-full object-contain"
            :class="{ 'pointer-events-none': index !== currentVideoIndex }"
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
              <!-- Loading/buffering spinner -->
              <div 
                v-if="videoState[index] === 'loading' || videoState[index] === 'buffering'"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div class="bg-black/50 rounded-full p-4">
                  <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              </div>
              
              <!-- Play button (when paused or ready) -->
              <div 
                v-else-if="videoState[index] === 'paused' || videoState[index] === 'ready'"
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
        </div>
      </div>
    </div>

    <!-- Bottom info bar -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
      <div class="text-white text-center text-sm">
        <p>Swipe up/down to navigate videos</p>
      </div>
    </div>

    <!-- Right side action buttons -->
    <div v-if="currentVideo" class="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col space-y-6 pointer-events-auto z-[70]">
      <LikeButton 
        :ascent="currentVideo" 
        @update="handleLikeUpdate"
      />
      <!-- Future: Add comment button here -->
      <!-- Future: Add share button here -->
    </div>

    <!-- Video metadata overlay (bottom right) -->
    <div v-if="currentVideo" class="absolute bottom-1 right-0.5 max-w-[200px] pointer-events-auto z-[70]">
      <VideoMetadata :video="currentVideo" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import VideoMetadata from './VideoMetadata.vue';
import LikeButton from './LikeButton.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

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
// Single source of truth for video states: 'loading', 'ready', 'playing', 'paused', 'buffering'
const videoState = ref({});

// Computed current video index based on videoId from URL
const currentVideoIndex = computed(() => {
  const videoId = route.query.videoId;
  if (!videoId || videos.value.length === 0) return 0;
  
  const index = videos.value.findIndex(v => v.id === videoId);
  return index >= 0 ? index : 0;
});

// Computed current video data
const currentVideo = computed(() => {
  return videos.value[currentVideoIndex.value] || null;
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

// Set up event listeners for video element to track state
const setupVideoListeners = (video, index) => {
  if (!video || video.dataset.listenersAdded) return;
  video.dataset.listenersAdded = 'true';
  
  video.addEventListener('loadstart', () => {
    videoState.value[index] = 'loading';
  });
  
  video.addEventListener('loadeddata', () => {
    videoState.value[index] = 'ready';
  });
  
  video.addEventListener('playing', () => {
    videoState.value[index] = 'playing';
  });
  
  video.addEventListener('pause', () => {
    videoState.value[index] = 'paused';
  });
  
  video.addEventListener('waiting', () => {
    videoState.value[index] = 'buffering';
  });
};

// Intersection Observer to detect which video is actually visible
let intersectionObserver = null;

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      // Find the entry that has the largest intersection ratio (most visible)
      let mostVisibleEntry = null;
      let maxRatio = 0;

      entries.forEach(entry => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisibleEntry = entry;
        }
      });

      // Only update if we have a clearly visible video (> 50% visible)
      if (mostVisibleEntry && maxRatio > 0.5) {
        const newIndex = parseInt(mostVisibleEntry.target.dataset.videoIndex);
        
        if (newIndex !== currentVideoIndex.value && newIndex >= 0 && newIndex < videos.value.length) {
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
      }
    },
    {
      root: null,
      threshold: [0, 0.25, 0.5, 0.75, 1.0] // Check at multiple thresholds
    }
  );
};

const handleScroll = () => {
  // Scroll handler is now simplified - Intersection Observer does the heavy lifting
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
const scrollToVideo = (index, instant = false) => {
  const container = videoContainer.value;
  if (!container) return;
  
  pauseOtherVideos(index);
  
  const targetScrollTop = index * container.clientHeight;
  
  if (instant) {
    // Direct positioning for initialization - no animation
    container.scrollTop = targetScrollTop;
  } else {
    // Smooth scroll for user navigation
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }
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
        currentVideo.currentTime = 0;
      }
      currentVideo.muted = isMuted.value;
      await currentVideo.play();
      startProgressTracking();
    } catch (error) {
      console.log('Video play failed:', error);
    }
  }
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
      currentVideo.play().catch(err => console.log('Play failed:', err));
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

const getVideoProgress = (index) => {
  return videoProgress.value[index] || 0;
};

const getVideoContentDimensions = (index) => {
  const video = videoElements.value[index];
  const container = videoContainer.value;
  
  if (!video || !container) {
    return {};
  }
  
  // Get the video's natural dimensions
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  
  if (!videoWidth || !videoHeight) {
    // Don't return dimensions until metadata loads
    // This prevents stretching before video is ready
    return {};
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
  
  // Set up Intersection Observer to watch video containers
  setupIntersectionObserver();
  await nextTick();
  
  // Observe all video containers
  const container = videoContainer.value;
  if (container) {
    const videoContainers = container.querySelectorAll('[data-video-index]');
    videoContainers.forEach(element => {
      intersectionObserver.observe(element);
    });
  }
  
  const currentVideoId = route.query.videoId || props.initialVideoId;
  const isValidVideoId = currentVideoId && videos.value.some(v => v.id === currentVideoId);
  
  if (!isValidVideoId && videos.value.length > 0) {
    // Set first video as current
    setCurrentVideoId(videos.value[0].id);
    await nextTick();
    scrollToVideo(currentVideoIndex.value, true); // instant = true for initialization
    await nextTick();
    playCurrentVideo();
  }
  else if (isValidVideoId) {
    await nextTick();
    scrollToVideo(currentVideoIndex.value, true); // instant = true for initialization
    await nextTick();
    playCurrentVideo();
  }
};

// Handle like updates from LikeButton
const handleLikeUpdate = ({ liked, likeCount }) => {
  if (!currentVideo.value || !userStore.user?.uid) return;
  
  // Update the video data locally for immediate UI feedback
  const video = videos.value[currentVideoIndex.value];
  if (video) {
    video.likeCount = likeCount;
    // Update the likedByUserIds array locally
    const userId = userStore.user.uid;
    if (liked && !video.likedByUserIds?.includes(userId)) {
      video.likedByUserIds = [...(video.likedByUserIds || []), userId];
    } else if (!liked && video.likedByUserIds?.includes(userId)) {
      video.likedByUserIds = video.likedByUserIds.filter(id => id !== userId);
    }
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
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
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
