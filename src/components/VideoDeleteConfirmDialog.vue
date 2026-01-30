<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h3 class="text-[15px] font-semibold text-gray-900 mb-2">Delete Video?</h3>
      <p class="text-gray-600 text-[13px] mb-6">
        Are you sure you want to delete this video? This action cannot be undone.
      </p>
      <div class="flex gap-3 justify-end">
        <button
          @click="$emit('cancel')"
          :disabled="deleting"
          class="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[13px] font-medium rounded-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          :disabled="deleting"
          class="h-9 px-4 bg-red-600 text-white text-[13px] font-medium rounded-md hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2"
        >
          <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ deleting ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['confirm', 'cancel']);
</script>
