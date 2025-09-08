<template>
  <Teleport to="body">
    <div
      v-if="visible && problem && isValidPosition"
      ref="cardElement"
      class="fixed z-[9999] pointer-events-auto"
      :style="smartPosition"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <div class="flex items-center space-x-2 mb-2">
          <div
            class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
            :style="{ backgroundColor: problem?.color }"
          ></div>
          <router-link
            v-if="problem"
            :to="`/location/${locationId}/problem/${problem.id}`"
            class="font-medium text-gray-900 truncate text-sm hover:text-blue-600 transition-colors cursor-pointer"
            @click.stop
          >
            {{ problem.name }}
          </router-link>
        </div>

        <div v-if="problem" class="text-xs text-gray-500 mb-2">
          Grade {{ getGradeLabel(problem.grade) }} • {{ problem.holds.length }} holds
        </div>

        <div v-if="problem" class="flex items-center space-x-1 text-xs">
          <span class="text-gray-400">#{{ problem.id }}</span>

          <!-- Quick action buttons -->
          <div class="flex items-center space-x-1 ml-auto">
            <button
              @click.stop="handleEdit"
              class="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200 pointer-events-auto"
              title="Edit problem"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            <button
              @click.stop="handleShowVideos"
              :class="[
                'p-1 rounded transition-colors duration-200 pointer-events-auto',
                problemVideos.length > 0
                  ? 'text-purple-500 hover:text-purple-700 hover:bg-purple-100'
                  : 'text-gray-400 cursor-default',
              ]"
              :title="problemVideos.length > 0 ? 'Show beta videos' : 'No videos'"
              :disabled="problemVideos.length === 0"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>

            <button
              @click.stop="handleToggleVisibility"
              :class="[
                'p-1 rounded transition-colors duration-200 pointer-events-auto',
                visibilityState.isHighlighted
                  ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'
                  : problem?.hidden
                  ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100',
              ]"
              :title="visibilityState.title"
            >
              <!-- Show all problems icon (when currently showing only this problem) -->
              <svg
                v-if="visibilityState.icon === 'eye-multiple'"
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                <!-- Multiple indicator dots -->
                <circle cx="18" cy="6" r="1.5" fill="currentColor" />
                <circle cx="6" cy="6" r="1.5" fill="currentColor" />
              </svg>
              <!-- Hidden eye icon (when problem is hidden) -->
              <svg
                v-else-if="visibilityState.icon === 'eye-slash'"
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
              <!-- Regular eye icon (show only this problem) -->
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore.js';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import { videoService } from '@/services/videoService.js';

const boulderProblemsStore = useBoulderProblemsStore();

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  problem: {
    type: Object,
    default: null,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  locationId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['edit', 'toggle-visibility', 'mouse-enter', 'mouse-leave', 'show-videos']);

// Template ref for the card element
const cardElement = ref(null);

// Videos for this problem
const problemVideos = ref([]);
const videosLoading = ref(false);

// Check if position is valid
const isValidPosition = computed(() => {
  return props.position && 
         typeof props.position.x === 'number' && 
         typeof props.position.y === 'number' &&
         props.position.x >= 0 && 
         props.position.y >= 0;
});

// Smart positioning that avoids screen edges
const smartPosition = computed(() => {
  if (!isValidPosition.value) return {};
  
  // Try to get actual dimensions from the DOM element
  let cardWidth = 320; // Default fallback
  let cardHeight = 120; // Default fallback
  
  if (cardElement.value) {
    const rect = cardElement.value.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      cardWidth = rect.width;
      cardHeight = rect.height;
    }
  }
  
  const margin = 12; // Margin from screen edges
  const offset = 12; // Distance from cursor
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Default position: top-left corner of card is offset pixels right and above cursor
  let x = props.position.x + offset;
  let y = props.position.y - offset;
  
  // Check horizontal positioning
  const wouldOverflowRight = (x + cardWidth) > (viewportWidth - margin);
  if (wouldOverflowRight) {
    // Position on left: right edge of card is offset pixels left of cursor
    x = props.position.x - cardWidth - offset;
  }
  
  // Check vertical positioning
  const wouldOverflowBottom = (y + cardHeight) > (viewportHeight - margin);
  if (wouldOverflowBottom) {
    // Position above: bottom edge of card is offset pixels above cursor
    y = props.position.y - cardHeight - offset;
  }
  
  // Final safety checks to ensure card stays within viewport
  if (x < margin) {
    x = margin;
  }
  if (y < margin) {
    y = margin;
  }
  if (x + cardWidth > viewportWidth - margin) {
    x = viewportWidth - cardWidth - margin;
  }
  if (y + cardHeight > viewportHeight - margin) {
    y = viewportHeight - cardHeight - margin;
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`,
  };
});

// Compute the visibility state and appropriate UI text
const visibilityState = computed(() => {
  if (!props.problem) return { icon: 'eye', title: 'Show only this problem' };

  const isOnlyProblemVisible =
    boulderProblemsStore.isShowingOnlyOneProblem && !props.problem.hidden;
  const isProblemHidden = props.problem.hidden;

  if (isOnlyProblemVisible) {
    return {
      icon: 'eye-multiple',
      title: 'Show all problems',
      isHighlighted: true,
    };
  } else if (isProblemHidden) {
    return {
      icon: 'eye-slash',
      title: 'Show only this problem',
      isHighlighted: false,
    };
  } else {
    return {
      icon: 'eye',
      title: 'Show only this problem',
      isHighlighted: false,
    };
  }
});

const handleEdit = () => {
  if (props.problem) {
    emit('edit', props.problem);
  }
};

const handleShowVideos = () => {
  if (props.problem && problemVideos.value.length > 0) {
    emit('show-videos', { problem: props.problem, videos: problemVideos.value });
  }
};

const handleToggleVisibility = () => {
  if (props.problem) {
    emit('toggle-visibility', props.problem);
  }
};

const handleMouseEnter = () => {
  emit('mouse-enter');
};

const handleMouseLeave = () => {
  emit('mouse-leave');
};

// Load videos when problem changes
watch(
  () => props.problem,
  async (newProblem) => {
    if (newProblem && props.locationId) {
      console.log('Loading videos for problem:', newProblem.name);
      videosLoading.value = true;
      try {
        problemVideos.value = await videoService.getProblemVideos(props.locationId, newProblem.id);
        console.log('Loaded', problemVideos.value.length, 'videos for problem:', newProblem.name);
      } catch (error) {
        console.error('Failed to load problem videos:', error);
        problemVideos.value = [];
      } finally {
        videosLoading.value = false;
      }
    } else {
      problemVideos.value = [];
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Add a subtle animation for appearing */
.fixed {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
