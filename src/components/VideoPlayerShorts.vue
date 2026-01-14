<template>
  <div class="fixed inset-0 bg-black z-[10000] flex flex-col">
    <!-- Header with close button and info -->
    <div class="absolute top-0 left-0 right-0 z-[100] bg-gradient-to-b from-black/80 to-transparent p-4">
      <div class="flex items-center justify-between text-white">
        <div class="flex items-center gap-3 flex-1">
          <!-- Back/Close button -->
          <button
            @click.stop="closePlayer"
            class="text-white hover:text-gray-300 transition-colors p-2 -ml-2"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <!-- Title -->
          <div class="flex-1">
            <h3 class="font-semibold text-lg capitalize">{{ title }}</h3>
            <p class="text-sm text-gray-300">
              {{ currentVideoIndex + 1 }} of {{ videos.length }}
            </p>
          </div>
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
        </div>
      </div>
    </div>

    <!-- Video container with swipe and scroll support -->
    <div 
      ref="videoContainer"
      class="relative overflow-x-hidden"
      :class="[
        showComments 
          ? 'h-[35vh] flex-shrink-0 overflow-hidden'
          : 'flex-1 overflow-y-auto'
      ]"
      :style="{
        scrollSnapType: showComments ? 'none' : 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }"
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
      <div v-else class="relative w-full h-full">
        <div
          v-for="(video, index) in videos"
          :key="video.id || index"
          :data-video-index="index"
          class="w-full h-full flex items-center justify-center relative"
          :style="{ scrollSnapAlign: 'start' }"
        >
          <!-- Video element - only load videos near current index to prevent memory crashes -->
          <video
            v-if="Math.abs(index - currentVideoIndex) <= 1"
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
            :preload="index === currentVideoIndex ? 'auto' : 'none'"
          />
          
          <!-- Thumbnail overlay - show when video not loaded OR not ready yet -->
          <div
            v-if="video.thumbnailBase64 && (Math.abs(index - currentVideoIndex) > 1 || !['playing', 'ready', 'paused'].includes(videoState[index]))"
            class="absolute inset-0 flex items-center justify-center bg-black"
          >
            <img
              :src="video.thumbnailBase64"
              class="w-full h-full object-contain"
              alt="Video thumbnail"
            />
          </div>
          
          <!-- Custom video controls overlay -->
          <div 
            v-if="index === currentVideoIndex" 
            class="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none"
          >
            <!-- Loading/buffering spinner - show immediately -->
            <div 
              v-if="videoState[index] === 'loading' || videoState[index] === 'buffering'"
              class="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div class="bg-black/50 rounded-full p-4">
                <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            </div>
            
            <!-- Controls container that matches the actual video content size -->
            <!-- Only show when video dimensions are loaded to prevent layout shift -->
            <div 
              v-if="videoElements[index]?.videoWidth && videoElements[index]?.videoHeight"
              class="relative pointer-events-auto"
              :style="getVideoContentDimensions(index)"
              @click="togglePlayPause"
            >
              <!-- Play button (when paused or ready, but not while dragging) -->
              <div 
                v-if="(videoState[index] === 'paused' || videoState[index] === 'ready') && !isDraggingProgress"
                class="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div class="bg-black/50 rounded-full p-4">
                  <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              <!-- Video metadata overlay (bottom left, above progress bar) -->
              <div 
                class="absolute left-1 max-w-[250px] pointer-events-auto z-10"
                :class="isTouchDevice ? 'bottom-6' : 'bottom-4'"
              >
                <VideoMetadata :video="currentVideo" />
              </div>

              <!-- HD error badge (bottom right, above progress bar) -->
              <div 
                v-if="!currentVideo.isTranscoded" 
                class="absolute right-1 pointer-events-auto z-10"
                :class="isTouchDevice ? 'bottom-6' : 'bottom-4'"
              >
                <div class="inline-flex items-center gap-1 bg-red-500/20 text-red-300 px-2 py-1 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span class="text-xs">HD</span>
                </div>
              </div>
              
              <!-- Bottom progress bar (at the very bottom edge of video content) -->
              <div 
                ref="progressBarContainer"
                class="absolute bottom-0 left-0 right-0 group/progress cursor-pointer"
                @mousedown="handleProgressMouseDown"
                @touchstart="handleProgressTouchStart"
                @click.stop="handleProgressBarClick"
              >
                <!-- Larger hit area for easier interaction (bigger on mobile) -->
                <div 
                  class="bg-white/20 transition-all relative"
                  :class="isTouchDevice ? 'h-1.5' : 'h-1 group-hover/progress:h-1.5'"
                >
                  <!-- Larger clickable/hoverable overlay (extra large on mobile) -->
                  <div 
                    class="absolute left-0 right-0"
                    :class="isTouchDevice ? '-top-4 -bottom-4' : '-top-3 -bottom-3'"
                  ></div>
                  
                  <!-- Progress fill -->
                  <div 
                    class="bg-white h-full transition-all duration-100 ease-linear relative"
                    :style="{ width: `${getVideoProgress(index)}%` }"
                  >
                    <!-- Draggable handle (always visible on mobile, appears on hover on desktop) -->
                    <div 
                      class="absolute bg-white rounded-full transition-opacity shadow-lg"
                      :class="[
                        isTouchDevice ? 'w-4 h-4 opacity-100' : 'w-3 h-3 opacity-0 group-hover/progress:opacity-100'
                      ]"
                      style="right: 0; top: 50%; transform: translate(50%, -50%)"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Right side action buttons -->
    <div v-if="currentVideo" class="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col space-y-6 pointer-events-auto z-[70]">
      <!-- Like button -->
      <LikeButton 
        :ascent="currentVideo" 
        @update="handleLikeUpdate"
        @count-click="openLikes"
      />
      
      <!-- Comment button -->
      <button
        @click="openComments"
        class="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform cursor-pointer"
      >
        <div class="relative">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span class="text-[11px] font-medium">{{ currentVideo.commentCount || 0 }}</span>
      </button>
      

    <!-- Likes Drawer -->
    <LikesDrawer
      :is-open="showLikes"
      :user-ids="currentVideo?.likedByUserIds || []"
      @close="closeLikes"
    />
      <!-- Future: Add share button here -->
    </div>

    <!-- Comment Section -->
    <CommentSection
      :is-open="showComments"
      :ascent-id="currentVideo?.id"
      @close="closeComments"
      @update="handleCommentUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import VideoMetadata from './VideoMetadata.vue';
import LikeButton from './LikeButton.vue';
import CommentSection from './CommentSection.vue';
import LikesDrawer from './LikesDrawer.vue';
import { isTouchDevice as detectTouchDevice } from '@/utils/platform';
import { query } from 'firebase/firestore';

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
const showComments = ref(false);
const showLikes = ref(false);
const isDraggingProgress = ref(false);
const progressBarContainer = ref(null);
const isTouchDevice = computed(() => detectTouchDevice());

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

// Update progress - called by timeupdate event
const updateVideoProgress = (index, video) => {
  if (video && video.duration) {
    const progress = (video.currentTime / video.duration) * 100;
    videoProgress.value[index] = progress;
  }
};

// Set up event listeners for video element
const setupVideoListeners = (video, index) => {
  if (!video || video.dataset.listenersAdded) return;
  video.dataset.listenersAdded = 'true';
  
  // Throttle timeupdate to reduce energy impact
  let lastUpdate = 0;
  video.addEventListener('timeupdate', () => {
    const now = Date.now();
    // Only update every 100ms to reduce CPU usage
    if (now - lastUpdate > 100) {
      lastUpdate = now;
      // Only update if video is valid and has duration
      if (video && !video.error && video.duration && isFinite(video.duration)) {
        updateVideoProgress(index, video);
      }
    }
  });
  
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
  
  video.addEventListener('error', (e) => {
    console.error(`Video ${index} error:`, video.error);
    videoState.value[index] = 'error';
    // Pause other operations on errored video
    video.pause();
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

// Observe all video containers with the intersection observer
const observeVideoContainers = () => {
  const container = videoContainer.value;
  if (container && intersectionObserver) {
    const videoContainers = container.querySelectorAll('[data-video-index]');
    videoContainers.forEach(element => {
      intersectionObserver.observe(element);
    });
  }
};

// Pause all videos except the current one and cleanup distant videos
const pauseOtherVideos = (currentIndex) => {
  Object.entries(videoElements.value).forEach(([index, video]) => {
    const videoIndex = parseInt(index);
    if (video && videoIndex !== currentIndex) {
      if (!video.paused) {
        video.pause();
        video.currentTime = 0;
      }
      // Unload videos far from current view to free memory
      if (Math.abs(videoIndex - currentIndex) > 1) {
        video.removeAttribute('src');
        video.load(); // Force unload
        // Clear stored progress data
        delete videoProgress.value[videoIndex];
        delete videoState.value[videoIndex];
      }
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
  // Ignore keyboard shortcuts when user is typing in an input field
  const activeElement = document.activeElement;
  const isTyping = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable
  );
  
  // Allow Escape to work even when typing (to close comments/modals)
  if (event.key === 'Escape') {
    event.preventDefault();
    closePlayer();
    return;
  }
  
  // Ignore other shortcuts when typing
  if (isTyping) {
    return;
  }
  
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      previousVideo();
      break;
    case 'ArrowDown':
      event.preventDefault();
      nextVideo();
      break;
    case ' ':
      event.preventDefault();
      togglePlayPause();
      break;
  }
};

const togglePlayPause = () => {
  // Don't toggle if we're currently dragging the progress bar
  if (isDraggingProgress.value) return;
  
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
  // Cleanup all videos before closing
  Object.values(videoElements.value).forEach(video => {
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  });
  emit('close');
};

const handleProgressBarClick = (event) => {
  if (isDraggingProgress.value) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (!currentVideo || currentVideo.error || currentVideo.readyState < 1 || !currentVideo.duration) return;
  
  const wasPlaying = !currentVideo.paused;
  
  const rect = event.currentTarget.getBoundingClientRect();
  const clickPercentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const newTime = clickPercentage * currentVideo.duration;
  
  if (isFinite(newTime) && newTime >= 0 && newTime <= currentVideo.duration) {
    currentVideo.currentTime = newTime;
    
    if (wasPlaying) {
      currentVideo.addEventListener('seeked', () => {
        if (currentVideo && !currentVideo.error) {
          currentVideo.play().catch(err => console.error('Play after seek failed:', err));
        }
      }, { once: true });
    }
  }
};

// Shared drag logic - simplified seek handling
const handleProgressDrag = (event, getClientX) => {
  event.preventDefault();
  event.stopPropagation();
  
  const currentVideo = videoElements.value[currentVideoIndex.value];
  if (!currentVideo || !currentVideo.duration) return null;
  
  isDraggingProgress.value = true;
  const wasPlaying = !currentVideo.paused;
  
  if (wasPlaying) {
    currentVideo.pause();
  }
  
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  
  const seekTo = (clientX) => {
    // Guard against seeking on invalid video
    if (!currentVideo || currentVideo.readyState < 1 || !currentVideo.duration) return;
    
    const clickX = clientX - rect.left;
    const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickPercentage * currentVideo.duration;
    
    // Only seek if new time is valid
    if (isFinite(newTime) && newTime >= 0 && newTime <= currentVideo.duration) {
      currentVideo.currentTime = newTime;
    }
  };
  
  const cleanup = (clientX) => {
    // Final seek
    if (clientX !== null) {
      seekTo(clientX);
    }
    
    // Wait for seek to complete before resuming
    if (wasPlaying && currentVideo && !currentVideo.error) {
      const resumePlayback = () => {
        if (currentVideo && !currentVideo.error) {
          currentVideo.play().catch(err => console.error('Play after seek failed:', err));
        }
      };
      currentVideo.addEventListener('seeked', resumePlayback, { once: true });
    }
    
    isDraggingProgress.value = false;
  };
  
  return { seekTo, cleanup };
};

const handleProgressMouseDown = (event) => {
  const dragHandlers = handleProgressDrag(event, (e) => e.clientX);
  if (!dragHandlers) return;
  
  const { seekTo, cleanup } = dragHandlers;
  
  const handleMouseMove = (e) => {
    seekTo(e.clientX);
  };
  
  const handleMouseUp = (e) => {
    cleanup(e.clientX);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const handleProgressTouchStart = (event) => {
  const dragHandlers = handleProgressDrag(event, (e) => {
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    return touch?.clientX ?? null;
  });
  if (!dragHandlers) return;
  
  const { seekTo, cleanup } = dragHandlers;
  
  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches?.[0]) {
      seekTo(e.touches[0].clientX);
    }
  };
  
  const handleTouchEnd = (e) => {
    const finalX = e.changedTouches?.[0]?.clientX ?? null;
    cleanup(finalX);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
  };
  
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);
  document.addEventListener('touchcancel', handleTouchEnd);
};

// Load videos using getVideos function
const loadVideos = async () => {
  try {
    loading.value = true;
    videos.value = await props.getVideos(props.videoId || route.query.videoId);
    console.log(`Loaded videos for ${props.videoId || route.query.videoId}:`, videos.value);
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
  observeVideoContainers();
  
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

// Comment functions
const openComments = async () => {
  showComments.value = true;
  // Disconnect Intersection Observer to prevent video switching when container resizes
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
  // Wait for DOM to update with new container height
  await nextTick();
  await nextTick();
  // Scroll to position current video at the top of the visible area
  const container = videoContainer.value;
  if (container) {
    container.scrollTop = currentVideoIndex.value * container.clientHeight;
  }
};

// Likes drawer functions
const openLikes = () => {
  showLikes.value = true;
};

const closeLikes = () => {
  showLikes.value = false;
};

// Comments drawer functions
const closeComments = async () => {
  showComments.value = false;
  // Wait for DOM to update with full container height
  await nextTick();
  await nextTick();
  // Scroll to position current video correctly
  const container = videoContainer.value;
  if (container) {
    container.scrollTop = currentVideoIndex.value * container.clientHeight;
  }
  // Reconnect Intersection Observer when comments close
  observeVideoContainers();
};

const handleCommentUpdate = (commentCount) => {
  // Update comment count locally
  const video = videos.value[currentVideoIndex.value];
  if (video) {
    video.commentCount = commentCount;
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
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
  // Cleanup all videos to prevent memory leaks
  Object.values(videoElements.value).forEach(video => {
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  });
  videoElements.value = {};
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

</style>
