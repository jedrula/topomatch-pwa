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
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs hover:shadow-xl transition-shadow">
        <div class="flex items-center gap-2">
          <!-- Camera/Assign button on the left -->
          <button
            v-if="!assignmentMode"
            @click.stop="handleShowVideos"
            class="w-8 h-8 flex items-center justify-center rounded transition-all bg-gray-900 text-white hover:bg-gray-800 shadow-sm flex-shrink-0 cursor-pointer"
            title="Show beta videos"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
              />
            </svg>
          </button>
          
          <!-- Assign button for assignment mode -->
          <button
            v-else
            @click.stop="handleAssignProblem"
            class="w-8 h-8 flex items-center justify-center rounded transition-all bg-green-600 text-white hover:bg-green-700 shadow-sm flex-shrink-0 cursor-pointer"
            title="Assign this problem to video"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>

          <!-- Problem info -->
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div
              class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
              :style="{ backgroundColor: problem?.color }"
            ></div>
            <div class="flex items-baseline gap-1 min-w-0">
              <router-link
                v-if="problem"
                :to="`/location/${locationId}/problem/${problem.id}`"
                class="font-medium text-gray-900 truncate text-sm hover:text-blue-600 transition-colors"
                @click.stop
              >
                {{ problem.name }}
              </router-link>
              <span v-if="problem" class="text-xs text-gray-500 flex-shrink-0">
                ({{ getGradeLabel(problem.grade) }})
              </span>
            </div>
          </div>

          <!-- Edit button on the right -->
          <button
            v-if="canEdit"
            @click.stop="handleEdit"
            class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-all flex-shrink-0"
            title="Edit problem"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore.js';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import { useUserStore } from '@/stores/userStore';

const boulderProblemsStore = useBoulderProblemsStore();
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
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
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

const emit = defineEmits(['edit', 'toggle-visibility', 'mouse-enter', 'mouse-leave', 'show-videos', 'assign-problem']);

// Check if user can edit (admin only)
const canEdit = computed(() => userStore.isAdmin);

// Template ref for the card element
const cardElement = ref(null);

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
  if (props.problem) {
    console.log('FloatingBoulderProblemCard: emitting show-videos with problemId:', props.problem.id);
    emit('show-videos', props.problem.id);
  } else {
    console.log('FloatingBoulderProblemCard: handleShowVideos called but no problem available');
  }
};

const handleAssignProblem = () => {
  if (props.problem) {
    console.log('FloatingBoulderProblemCard: emitting assign-problem with problemId:', props.problem.id);
    emit('assign-problem', props.problem.id);
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
