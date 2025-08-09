<template>
  <div
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    class="flex items-center justify-between p-3 rounded-lg border border-gray-200 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
    :class="{
      'border-blue-500 bg-blue-50': isActive,
      'opacity-50': isDisabled,
    }"
  >
    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <div
        class="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
        :style="{ backgroundColor: problem.color }"
      ></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 min-w-0">
          <div class="font-medium text-gray-900 truncate flex-1" :title="problem.name">
            {{ problem.name }}
          </div>
          <!-- Unsaved changes indicator -->
          <div v-if="hasUnsavedChanges" class="flex items-center flex-shrink-0">
            <div class="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes"></div>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          Grade {{ getGradeLabel(problem.grade) }} • {{ problem.holds.length }} holds
        </div>
      </div>
    </div>

    <div class="flex items-center space-x-1 flex-shrink-0">
      <span class="text-xs font-medium text-gray-500 max-w-16 truncate" :title="`#${problem.id}`"
        >#{{ problem.id }}</span
      >
      <button
        @click.stop="handleViewDetail"
        class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
        title="View Details"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </button>
      <button
        @click.stop="handleToggleVisibility"
        :class="[
          'p-1 rounded transition-colors duration-200',
          problem.hidden
            ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-100'
            : 'text-gray-400 hover:text-orange-600 hover:bg-orange-100',
        ]"
        :title="problem.hidden ? 'Show problem' : 'Hide problem'"
      >
        <svg
          v-if="problem.hidden"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <!-- Eye with slash (hidden) -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
          />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <!-- Hide icon (eye with line through) -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
          />
        </svg>
      </button>
      <button
        @click.stop="handleEdit"
        :disabled="isDisabled"
        class="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Edit problem"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
      <button
        @click.stop="handleDelete"
        :disabled="isDisabled"
        class="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete problem"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { getGradeLabel } from "@/utils/gradingUtils.js";

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "click",
  "mouseenter",
  "mouseleave",
  "view-detail",
  "toggle-visibility",
  "edit",
  "delete",
]);

const handleClick = () => {
  emit("click", props.problem);
};

const handleMouseEnter = () => {
  emit("mouseenter", props.problem);
};

const handleMouseLeave = () => {
  emit("mouseleave", props.problem);
};

const handleViewDetail = () => {
  emit("view-detail", props.problem);
};

const handleToggleVisibility = () => {
  emit("toggle-visibility", props.problem);
};

const handleEdit = () => {
  emit("edit", props.problem);
};

const handleDelete = () => {
  emit("delete", props.problem.id);
};
</script>
