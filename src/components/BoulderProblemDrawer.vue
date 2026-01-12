<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="visible && problem"
        class="fixed inset-0 bg-black bg-opacity-40 z-[9998]"
        @click="handleClose"
      ></div>
    </Transition>

    <!-- Drawer -->
    <Transition name="slide-up">
      <div
        v-if="visible && problem"
        ref="drawerElement"
        class="fixed bottom-0 left-0 right-0 z-[9999] bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Swipe indicator -->
        <div class="flex justify-center py-3 cursor-pointer" @click="handleClose">
          <div class="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Content -->
        <div class="px-4 pb-6">
          <!-- Single row with all elements -->
          <div class="flex items-center gap-3">
            <!-- Color indicator with grade -->
            <div
              class="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
              :style="{ backgroundColor: problem?.color }"
            >
              {{ getGradeLabel(problem.grade) }}
            </div>

            <!-- Problem info -->
            <div class="flex-1 min-w-0">
              <router-link
                v-if="problem"
                :to="`/location/${locationId}/problem/${problem.id}`"
                class="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                @click.stop="handleClose"
              >
                {{ problem.name }}
              </router-link>
            </div>

            <!-- Assign button - only in assignment mode -->
            <button
              v-if="assignmentMode"
              @click.stop="handleAssignProblem"
              class="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium flex-shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Assign</span>
            </button>

            <!-- Edit button -->
            <button
              v-if="canEdit"
              @click.stop="handleEdit"
              class="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center flex-shrink-0"
              title="Edit problem"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>

          <!-- Video Posters Section -->
          <div v-if="!assignmentMode" class="mt-4 pt-4 border-t border-gray-200">
            <!-- Loading state -->
            <div v-if="videosLoading" class="flex items-center gap-2 text-sm text-gray-500">
              <div class="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span>Loading videos...</span>
            </div>
            
            <!-- No videos message -->
            <div v-else-if="videos.length === 0" class="text-xs text-gray-400 italic">
              No beta videos yet
            </div>
            
            <!-- Videos grid -->
            <div v-else>
              <div class="text-xs text-gray-500 mb-2">
                {{ videos.length }} video{{ videos.length === 1 ? '' : 's' }}
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="video in videos"
                  :key="video.id"
                  @click="handleVideoClick(video.id)"
                  class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <!-- Thumbnail image -->
                  <img
                    v-if="video.thumbnailBase64 || video.poster"
                    :src="video.thumbnailBase64 || video.poster"
                    :alt="video.userName || 'Video thumbnail'"
                    class="w-full h-full object-cover"
                  />
                  <!-- Fallback if no thumbnail -->
                  <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <!-- Duration badge if available -->
                  <div v-if="video.duration" class="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-[10px] px-1 py-0.5 rounded">
                    {{ formatDuration(video.duration) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  problem: {
    type: Object,
    default: null,
  },
  videos: {
    type: Array,
    default: () => [],
  },
  videosLoading: {
    type: Boolean,
    default: false,
  },
  locationId: {
    type: String,
    required: true,
  },
  assignmentMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'edit', 'show-videos', 'video-click', 'assign-problem']);

const canEdit = computed(() => userStore.isAdmin);

const drawerElement = ref(null);
const touchStartY = ref(0);
const touchCurrentY = ref(0);
const isDragging = ref(false);

const handleTouchStart = (event) => {
  touchStartY.value = event.touches[0].clientY;
  isDragging.value = true;
};

const handleTouchMove = (event) => {
  if (!isDragging.value) return;
  
  touchCurrentY.value = event.touches[0].clientY;
  const deltaY = touchCurrentY.value - touchStartY.value;
  
  // Only allow downward drag
  if (deltaY > 0 && drawerElement.value) {
    // Prevent default only when we're actually dragging down
    event.preventDefault();
    // Remove any transition during drag for instant feedback
    drawerElement.value.style.transition = 'none';
    drawerElement.value.style.transform = `translateY(${deltaY}px)`;
  }
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  
  const deltaY = touchCurrentY.value - touchStartY.value;
  
  // If dragged down more than 100px, close the drawer
  if (deltaY > 100) {
    // Keep the current transform and let the close transition handle it
    // Add a transition for smooth animation
    if (drawerElement.value) {
      drawerElement.value.style.transition = 'transform 0.3s ease-out';
      drawerElement.value.style.transform = 'translateY(100%)';
      
      // After transition completes, emit close
      setTimeout(() => {
        handleClose();
      }, 300);
    } else {
      handleClose();
    }
  } else {
    // Snap back to original position
    if (drawerElement.value) {
      drawerElement.value.style.transition = 'transform 0.2s ease-out';
      drawerElement.value.style.transform = '';
      
      // Clean up transition after animation
      setTimeout(() => {
        if (drawerElement.value) {
          drawerElement.value.style.transition = '';
        }
      }, 200);
    }
  }
  
  isDragging.value = false;
  touchStartY.value = 0;
  touchCurrentY.value = 0;
};

const handleClose = () => {
  emit('close');
};

const handleEdit = () => {
  emit('edit', props.problem);
};

const handleShowVideos = () => {
  emit('show-videos', props.problem.id);
};

const handleVideoClick = (videoId) => {
  emit('video-click', videoId, props.problem.id);
};

const handleAssignProblem = () => {
  emit('assign-problem', props.problem.id);
};

// Format duration from seconds to MM:SS
const formatDuration = (seconds) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition for drawer */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
