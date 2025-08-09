<template>
  <Teleport to="body">
    <div
      v-if="visible && problem"
      class="fixed z-50 pointer-events-auto"
      :style="{ left: `${position.x + 12}px`, top: `${position.y - 8}px` }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
        <div class="flex items-center space-x-2 mb-2">
          <div
            class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
            :style="{ backgroundColor: problem.color }"
          ></div>
          <div class="font-medium text-gray-900 truncate text-sm">
            {{ problem.name }}
          </div>
        </div>

        <div class="text-xs text-gray-500 mb-2">
          Grade {{ getGradeLabel(problem.grade) }} • {{ problem.holds.length }} holds
        </div>

        <div class="flex items-center space-x-1 text-xs">
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
              @click.stop="handleToggleVisibility"
              :class="[
                'p-1 rounded transition-colors duration-200 pointer-events-auto',
                visibilityState.isHighlighted
                  ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-100'
                  : problem.hidden
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
import { computed } from "vue";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore.js";
import { getGradeLabel } from "@/utils/gradingUtils.js";

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
});

const emit = defineEmits(["edit", "toggle-visibility", "mouse-enter", "mouse-leave"]);

// Compute the visibility state and appropriate UI text
const visibilityState = computed(() => {
  if (!props.problem) return { icon: "eye", title: "Show only this problem" };

  const isOnlyProblemVisible =
    boulderProblemsStore.isShowingOnlyOneProblem && !props.problem.hidden;
  const isProblemHidden = props.problem.hidden;

  if (isOnlyProblemVisible) {
    return {
      icon: "eye-multiple",
      title: "Show all problems",
      isHighlighted: true,
    };
  } else if (isProblemHidden) {
    return {
      icon: "eye-slash",
      title: "Show only this problem",
      isHighlighted: false,
    };
  } else {
    return {
      icon: "eye",
      title: "Show only this problem",
      isHighlighted: false,
    };
  }
});

const handleEdit = () => {
  if (props.problem) {
    emit("edit", props.problem);
  }
};

const handleToggleVisibility = () => {
  if (props.problem) {
    emit("toggle-visibility", props.problem);
  }
};

const handleMouseEnter = () => {
  emit("mouse-enter");
};

const handleMouseLeave = () => {
  emit("mouse-leave");
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
