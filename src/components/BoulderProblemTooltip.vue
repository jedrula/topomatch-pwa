<template>
  <div
    v-if="visible && problem"
    class="fixed z-50 pointer-events-none"
    :style="tooltipStyle"
  >
    <!-- Tooltip Container with proper styling -->
    <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
      <!-- Problem Header -->
      <div class="flex items-center space-x-2 mb-2">
        <div
          class="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
          :style="{ backgroundColor: problem.color }"
        ></div>
        <div class="font-medium text-gray-900 truncate">
          {{ problem.name }}
        </div>
        <span class="text-xs text-gray-500">#{{ problem.id }}</span>
      </div>
      
      <!-- Problem Details -->
      <div class="text-sm text-gray-600 mb-2">
        Grade {{ getGradeLabel(problem.grade) }} • {{ problem.holds.length }} holds
      </div>
      
      <!-- Quick Actions -->
      <div class="flex items-center space-x-2 text-xs">
        <button
          @click="handleEdit"
          class="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors pointer-events-auto"
        >
          Edit
        </button>
        <button
          @click="handleViewDetail"
          class="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors pointer-events-auto"
        >
          View
        </button>
        <button
          @click="handleToggleVisibility"
          :class="[
            'px-2 py-1 rounded transition-colors pointer-events-auto',
            problem.hidden
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ problem.hidden ? 'Show' : 'Hide' }}
        </button>
      </div>
      
      <!-- Unsaved changes indicator -->
      <div
        v-if="hasUnsavedChanges"
        class="flex items-center mt-2 pt-2 border-t border-gray-100"
      >
        <div class="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
        <span class="text-xs text-orange-600">Unsaved changes</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getGradeLabel } from "@/utils/gradingUtils.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  problem: {
    type: Object,
    default: null,
  },
  mousePosition: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "view-detail", "toggle-visibility"]);

const tooltipStyle = computed(() => {
  if (!props.visible || !props.problem) return { display: 'none' };
  
  // Offset tooltip to the right and slightly below cursor
  const offsetX = 15;
  const offsetY = 10;
  
  return {
    left: `${props.mousePosition.x + offsetX}px`,
    top: `${props.mousePosition.y + offsetY}px`,
  };
});

const handleEdit = () => {
  emit("edit", props.problem);
};

const handleViewDetail = () => {
  emit("view-detail", props.problem);
};

const handleToggleVisibility = () => {
  emit("toggle-visibility", props.problem);
};
</script>
