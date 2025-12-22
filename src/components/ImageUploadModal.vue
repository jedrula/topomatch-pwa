<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-6 pb-4 flex-shrink-0">
        <div>
          <h3 class="text-lg font-semibold">Upload Images</h3>
          <p v-if="uploadsInProgress" class="text-sm text-blue-600 mt-1">
            {{ pendingMetadataSaves === 0 ? 'Uploads complete!' : `Processing ${pendingMetadataSaves} of ${totalUploadsExpected} uploads...` }}
          </p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="px-6 flex-1 overflow-y-auto">
        <ImageUpload
          :location-id="locationId"
          :routesetting="routesetting"
          @uploaded="$emit('uploaded', $event)"
          @error="$emit('error', $event)"
          @uploads-started="$emit('uploads-started', $event)"
          @all-complete="$emit('all-complete', $event)"
        />
      </div>

      <div class="flex gap-2 p-6 pt-4 flex-shrink-0 border-t">
        <button
          @click="$emit('close')"
          :disabled="uploadsInProgress"
          :class="[
            'flex-1 px-4 py-2 rounded-md transition-colors',
            uploadsInProgress
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300',
          ]"
        >
          {{ uploadsInProgress ? "Uploading..." : "Close" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import ImageUpload from './ImageUpload.vue';
import { computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  locationId: {
    type: String,
    required: true
  },
  routesetting: {
    type: String,
    required: true
  },
  pendingMetadataSaves: {
    type: Number,
    default: 0
  },
  totalUploadsExpected: {
    type: Number,
    default: 0
  }
});

defineEmits([
  'close',
  'uploaded',
  'error',
  'uploads-started',
  'all-complete'
]);

// Computed property to check if uploads are in progress
const uploadsInProgress = computed(() => {
  return props.pendingMetadataSaves > 0;
});
</script>
