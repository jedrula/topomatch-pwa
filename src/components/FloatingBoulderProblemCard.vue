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
              class="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
              :style="{ backgroundColor: problem?.color }"
            >
              {{ getGradeLabel(problem.grade) }}
            </div>
            <router-link
              v-if="problem"
              :to="`/location/${locationId}/problem/${problem.id}`"
              class="font-medium text-gray-900 truncate text-sm hover:text-blue-600 transition-colors min-w-0"
              @click.stop
            >
              {{ problem.name }}
            </router-link>
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

          <!-- Link / unlink button -->
          <button
            v-if="canEdit && !assignmentMode"
            @click.stop="handleLinkButtonClick"
            :disabled="isLinkingMode && linkingSourceOnCurrentImage && !isLinkTarget"
            :title="linkButtonTitle"
            :aria-label="linkButtonTitle"
            :class="[
              'w-7 h-7 flex items-center justify-center rounded transition-all flex-shrink-0',
              problem.linkedProblemId
                ? 'text-indigo-400 hover:text-red-500 hover:bg-red-50'
                : isLinkingMode && isLinkTarget
                ? 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 animate-pulse'
                : isLinkingMode && linkingSourceOnCurrentImage
                ? 'text-gray-200 cursor-not-allowed'
                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50',
            ]"
          >
            <svg v-if="problem.linkedProblemId" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1M3 3l18 18" />
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>

        <!-- Inline link confirm (shown when this card is the link target) -->
        <div
          v-if="showLinkConfirm"
          class="mt-2 pt-2 border-t border-indigo-100"
          @click.stop
        >
          <p class="text-xs font-medium text-indigo-800 mb-2">Which is the primary? (name &amp; grade source)</p>
          <div class="space-y-1 mb-2">
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" :value="linkingProblemId" v-model="confirmPrimaryId" class="accent-indigo-600" />
              <span class="font-medium truncate">{{ linkingProblemName }}</span>
              <span class="text-gray-400 flex-shrink-0">(other image)</span>
            </label>
            <label class="flex items-center gap-2 text-xs cursor-pointer">
              <input type="radio" :value="problem.id" v-model="confirmPrimaryId" class="accent-indigo-600" />
              <span class="font-medium truncate">{{ problem.name }}</span>
              <span class="text-gray-400 flex-shrink-0">(this image)</span>
            </label>
          </div>
          <div class="flex gap-2">
            <button
              @click.stop="confirmLink"
              :disabled="isConfirming"
              class="flex-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            >
              {{ isConfirming ? 'Linking…' : 'Confirm Link' }}
            </button>
            <button
              @click.stop="showLinkConfirm = false"
              class="flex-1 px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Predecessor confirm (shown when this card is a predecessor target) -->
        <div
          v-if="isPredecessorTarget"
          class="mt-2 pt-2 border-t border-amber-100"
          @click.stop
        >
          <p class="text-xs font-medium text-amber-800 mb-2">Set as predecessor of <span class="font-semibold">{{ predecessorForProblemName }}</span>?</p>
          <p class="text-xs text-gray-500 mb-2">Betas recorded on this problem will be shown on the new problem too.</p>
          <div class="flex gap-2">
            <button
              @click.stop="confirmPredecessor"
              :disabled="isConfirmingPredecessor"
              class="flex-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            >
              {{ isConfirmingPredecessor ? 'Linking…' : 'Confirm' }}
            </button>
            <button
              @click.stop="$emit('cancel-predecessor')"
              class="flex-1 px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Predecessor status (shown when problem already has a predecessor linked) -->
        <div
          v-if="canEdit && !isPredecessorLinkingMode && problem?.predecessorProblemId"
          class="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2"
          @click.stop
        >
          <span class="text-xs text-gray-500 flex-1">↩ Has predecessor linked</span>
          <button
            @click.stop="$emit('clear-predecessor', problem)"
            class="text-xs text-red-400 hover:text-red-600 transition-colors"
            title="Clear predecessor link"
          >✕ Clear</button>
        </div>

        <!-- Start predecessor linking (shown when admin, no predecessor yet, not in linking mode) -->
        <div
          v-if="canEdit && !isPredecessorLinkingMode && !showLinkConfirm && !problem?.predecessorProblemId"
          class="mt-2 pt-2 border-t border-gray-100"
          @click.stop
        >
          <button
            @click.stop="$emit('start-predecessor-link', problem)"
            class="text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
            title="Link to predecessor problem from previous routesetting"
          >
            <span>↩</span>
            <span>Link predecessor</span>
          </button>
        </div>

        <!-- Predecessor linking in progress (shown on the source/new problem while linking mode is active) -->
        <div
          v-if="isPredecessorSource"
          class="mt-2 pt-2 border-t border-amber-100 flex items-center gap-2"
          @click.stop
        >
          <span class="text-xs text-amber-700 flex-1 animate-pulse">↩ Navigate to old image, click old problem</span>
          <button
            @click.stop="$emit('cancel-predecessor')"
            class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >✕</button>
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
  linkingProblemId: {
    type: String,
    default: null,
  },
  linkingProblemName: {
    type: String,
    default: '',
  },
  linkingSourceOnCurrentImage: {
    type: Boolean,
    default: false,
  },
  predecessorForProblemId: {
    type: String,
    default: null,
  },
  predecessorForProblemName: {
    type: String,
    default: '',
  },
  predecessorSourceOnCurrentImage: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['edit', 'link', 'unlink', 'confirm-link', 'toggle-visibility', 'mouse-enter', 'mouse-leave', 'show-videos', 'assign-problem', 'start-predecessor-link', 'confirm-predecessor', 'clear-predecessor', 'cancel-predecessor']);

// Check if user can edit (admin only)
const canEdit = computed(() => userStore.isAdmin);

// Linking helpers
const isLinkingMode = computed(() => !!props.linkingProblemId);
const isLinkTarget = computed(() =>
  isLinkingMode.value &&
  props.problem?.id !== props.linkingProblemId &&
  !props.linkingSourceOnCurrentImage
);

// Predecessor linking helpers
const isPredecessorLinkingMode = computed(() => !!props.predecessorForProblemId);
const isPredecessorTarget = computed(() =>
  isPredecessorLinkingMode.value &&
  props.problem?.id !== props.predecessorForProblemId &&
  !props.predecessorSourceOnCurrentImage
);
const isPredecessorSource = computed(() =>
  isPredecessorLinkingMode.value &&
  props.problem?.id === props.predecessorForProblemId
);

const isConfirmingPredecessor = ref(false);
const confirmPredecessor = () => {
  if (isConfirmingPredecessor.value) return;
  isConfirmingPredecessor.value = true;
  emit('confirm-predecessor', props.problem);
};

const showLinkConfirm = ref(false);
const confirmPrimaryId = ref(null);
const isConfirming = ref(false);

const linkButtonTitle = computed(() => {
  if (props.problem?.linkedProblemId) return 'Unlink from sibling problem';
  if (isLinkingMode.value && isLinkTarget.value) return 'Link with this problem';
  if (isLinkingMode.value && props.linkingSourceOnCurrentImage) return 'Navigate to the adjacent image first';
  return 'Link to problem on adjacent image';
});

const handleLinkButtonClick = () => {
  if (props.problem?.linkedProblemId) {
    handleUnlink();
    return;
  }
  if (isLinkingMode.value && isLinkTarget.value) {
    // Open inline confirm
    confirmPrimaryId.value = props.linkingProblemId;
    showLinkConfirm.value = true;
    return;
  }
  if (isLinkingMode.value && props.linkingSourceOnCurrentImage) return; // blocked
  handleLink();
};

const confirmLink = () => {
  if (!confirmPrimaryId.value || isConfirming.value) return;
  isConfirming.value = true;
  emit('confirm-link', {
    problemIdA: props.linkingProblemId,
    problemIdB: props.problem.id,
    primaryId: confirmPrimaryId.value,
  });
  showLinkConfirm.value = false;
  isConfirming.value = false;
};

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

const handleLink = () => {
  if (props.problem) {
    emit('link', props.problem);
  }
};

const handleUnlink = () => {
  if (props.problem) {
    emit('unlink', props.problem);
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
