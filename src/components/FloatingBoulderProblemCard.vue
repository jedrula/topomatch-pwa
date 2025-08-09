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
          Grade {{ problem.grade }} • {{ problem.holds.length }} holds
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
                problem.hidden
                  ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100'
                  : 'text-gray-400 hover:text-orange-600 hover:bg-orange-100',
              ]"
              :title="problem.hidden ? 'Show problem' : 'Hide problem'"
            >
              <svg
                v-if="problem.hidden"
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
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
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
