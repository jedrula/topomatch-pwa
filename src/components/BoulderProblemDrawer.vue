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
            <!-- Color indicator -->
            <div
              class="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0"
              :style="{ backgroundColor: problem?.color }"
            ></div>

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

            <!-- Grade -->
            <div class="text-sm text-gray-600 font-medium flex-shrink-0">
              {{ getGradeLabel(problem.grade) }}
            </div>

            <!-- Watch videos button -->
            <button
              v-if="!assignmentMode"
              @click.stop="handleShowVideos"
              class="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-sm text-sm font-medium flex-shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
                />
              </svg>
              <span class="hidden sm:inline">Videos</span>
            </button>

            <!-- Assign button for assignment mode -->
            <button
              v-else
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
              <span class="hidden sm:inline">Assign</span>
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
  locationId: {
    type: String,
    required: true,
  },
  assignmentMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'edit', 'show-videos', 'assign-problem']);

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
    drawerElement.value.style.transform = `translateY(${deltaY}px)`;
  }
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  
  const deltaY = touchCurrentY.value - touchStartY.value;
  
  if (drawerElement.value) {
    drawerElement.value.style.transform = '';
  }
  
  // If dragged down more than 100px, close the drawer
  if (deltaY > 100) {
    handleClose();
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

const handleAssignProblem = () => {
  emit('assign-problem', props.problem.id);
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
