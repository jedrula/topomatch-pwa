<template>
  <div class="animate-in fade-in h-full flex flex-col">
    <!-- Photo panorama strip -->
    <div v-if="displayImages.length > 0" class="flex-1 flex gap-1 overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
      <div
        v-for="(image, i) in displayImages"
        :key="`${image.imageId}-${i}`"
        class="relative flex-shrink-0 cursor-pointer"
        :draggable="isEditMode"
        @dragstart="handleDragStart(i)"
        @dragover="handleDragOver($event, i)"
        @drop="handleDrop(i)"
        @dragend="handleDragEnd"
        @click="$emit('image-click', image)"
      >
        <div
          v-if="isEditMode"
          class="absolute top-1 left-1 z-10 bg-white/70 rounded p-0.5"
        >
          <svg class="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <div
          :class="[
            'transition-all duration-200',
            overIdx === i && dragIdx !== null && dragIdx !== i ? 'ring-2 ring-blue-500' : ''
          ]"
        >
          <img
            :src="image.url"
            :alt="`${section.name} photo ${i + 1}`"
            class="h-full w-auto object-cover"
            style="min-width: 140px"
            crossorigin="anonymous"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
      <div class="text-center">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-gray-500">No photos assigned to this section</p>
      </div>
    </div>

    <!-- Section metadata below photos -->
    <div class="mt-2 flex-shrink-0">
      <p class="text-xs text-gray-500">
        <span class="font-semibold">{{ section.name }}</span>
        <span class="mx-1">·</span>
        <span class="capitalize">{{ section.type }}</span>
        <span class="mx-1">·</span>
        <span>{{ section.imageIds?.length || 0 }} photos</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  images: {
    type: Array,
    default: () => []
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['image-reorder', 'image-click']);

// Drag state
const dragIdx = ref(null);
const overIdx = ref(null);

// Get images for this section based on imageIds
const displayImages = computed(() => {
  if (!props.section.imageIds || props.section.imageIds.length === 0) {
    return [];
  }
  
  return props.section.imageIds
    .map(imageId => props.images.find(img => img.imageId === imageId))
    .filter(Boolean); // Filter out undefined if image not found
});

function handleDragStart(idx) {
  dragIdx.value = idx;
}

function handleDragOver(e, idx) {
  e.preventDefault();
  overIdx.value = idx;
}

function handleDrop(idx) {
  if (dragIdx.value === null || dragIdx.value === idx) {
    dragIdx.value = null;
    overIdx.value = null;
    return;
  }

  const newIds = [...props.section.imageIds];
  const [moved] = newIds.splice(dragIdx.value, 1);
  newIds.splice(idx, 0, moved);

  emit('image-reorder', props.section.id, newIds);

  dragIdx.value = null;
  overIdx.value = null;
}

function handleDragEnd() {
  dragIdx.value = null;
  overIdx.value = null;
}
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
