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
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600">
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
        <!-- Optional: pick which old image this new upload replaces -->
        <div v-if="replaceableImages.length > 0" class="mb-4">
          <p class="text-[13px] font-medium text-gray-700 mb-2">
            Replaces wall image <span class="text-gray-400 font-normal">(optional)</span>
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="img in replaceableImages"
              :key="img.imageId"
              type="button"
              @click="toggleReplaces(img.imageId)"
              :class="[
                'rounded-md border-2 overflow-hidden transition-all',
                selectedReplacesImageId === img.imageId
                  ? 'border-amber-500 ring-2 ring-amber-300'
                  : 'border-gray-200 hover:border-gray-400',
              ]"
            >
              <img :src="img.url" :alt="img.name" class="w-full aspect-square object-cover" crossorigin="anonymous" />
            </button>
          </div>
          <p v-if="selectedReplacesImageId" class="text-[12px] text-amber-700 mt-1.5">
            ↩ Links problems on the selected image as predecessors
          </p>
        </div>

        <ImageUpload
          :location-id="locationId"
          :routesetting="routesetting"
          :replaces-image-id="selectedReplacesImageId"
          @uploaded="$emit('uploaded', $event)"
          @error="$emit('error', $event)"
          @uploads-started="$emit('uploads-started', $event)"
          @all-complete="$emit('all-complete', $event)"
        />
      </div>

      <div class="flex gap-2 p-6 pt-4 flex-shrink-0 border-t">
        <button
          @click="handleClose"
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
import { ref, computed } from 'vue';

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
  },
  replaceableImages: {
    type: Array, // [{ imageId, url, name }]
    default: () => []
  }
});

const emit = defineEmits([
  'close',
  'uploaded',
  'error',
  'uploads-started',
  'all-complete'
]);

const selectedReplacesImageId = ref(null);

function toggleReplaces(imageId) {
  selectedReplacesImageId.value = selectedReplacesImageId.value === imageId ? null : imageId;
}

function handleClose() {
  selectedReplacesImageId.value = null;
  emit('close');
}

// Computed property to check if uploads are in progress
const uploadsInProgress = computed(() => {
  return props.pendingMetadataSaves > 0;
});
</script>
