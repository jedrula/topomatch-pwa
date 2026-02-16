<template>
  <div class="flex items-center gap-2 flex-wrap">
    <template v-if="isEditMode">
      <!-- Draw Outline button (only show when no outline exists) -->
      <button
        v-if="!hasOutline"
        @click="$emit('toggle-draw-mode', 'outline')"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          drawMode === 'outline'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        {{ drawMode === 'outline' ? 'Drawing outline… dbl-click to finish' : 'Draw Outline' }}
      </button>

      <button
        @click="$emit('toggle-draw-mode', 'section')"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          drawMode === 'section'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ drawMode === 'section' ? 'Drawing section… dbl-click to finish' : 'Add Section' }}
      </button>

      <button
        v-if="editOutline"
        @click="$emit('delete-outline')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Outline & Redraw
      </button>

      <button
        v-if="hasSelectedSection"
        @click="$emit('delete-section')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Section
      </button>
    </template>
  </div>
</template>

<script setup>
defineProps({
  isEditMode: {
    type: Boolean,
    required: true
  },
  hasOutline: {
    type: Boolean,
    default: false
  },
  drawMode: {
    type: String,
    default: 'none'
  },
  editOutline: {
    type: Boolean,
    default: false
  },
  hasSelectedSection: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'toggle-edit-mode',
  'toggle-draw-mode',
  'toggle-edit-outline',
  'delete-section'
]);
</script>
