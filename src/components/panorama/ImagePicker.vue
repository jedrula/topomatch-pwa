<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">{{ label }}</h3>

    <!-- Selected preview -->
    <div
      v-if="selectedImage"
      class="flex items-center gap-3 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg"
    >
      <img
        :src="selectedImage.thumbnailUrl || selectedImage.downloadUrl"
        class="w-14 h-14 object-cover rounded flex-shrink-0"
        :alt="selectedImage.fileName"
      />
      <div class="min-w-0">
        <p class="text-xs font-medium text-blue-800 truncate">{{ selectedImage.fileName }}</p>
        <button
          class="text-xs text-blue-500 hover:text-blue-700 mt-0.5"
          @click="$emit('select', null)"
        >
          Clear
        </button>
      </div>
    </div>

    <!-- Section groups -->
    <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
      <div v-for="{ section, images } in sections" :key="section.id">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          {{ section.name }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="img in images"
            :key="img.imageId"
            @click="$emit('select', img)"
            :title="img.fileName"
            :class="[
              'w-14 h-14 rounded overflow-hidden border-2 transition-all flex-shrink-0',
              img.imageId === selectedId
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-transparent hover:border-gray-300',
            ]"
          >
            <img
              :src="img.thumbnailUrl || img.downloadUrl"
              class="w-full h-full object-cover"
              :alt="img.fileName"
              loading="lazy"
            />
          </button>
        </div>
      </div>

      <p v-if="sections.length === 0" class="text-sm text-gray-400 py-4 text-center">
        No images found
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  sections: { type: Array, required: true }, // [{ section, images }]
  selectedId: { type: String, default: null },
});

defineEmits(['select']);

const selectedImage = computed(() => {
  if (!props.selectedId) return null;
  for (const { images } of props.sections) {
    const found = images.find(img => img.imageId === props.selectedId);
    if (found) return found;
  }
  return null;
});
</script>
