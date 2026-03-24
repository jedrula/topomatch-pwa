<template>
  <div class="animate-in fade-in h-full flex flex-col">
    <!-- Photo panorama strip - horizontal scroll -->
    <div v-if="displayImages.length > 0" class="flex-1 flex flex-col min-h-0">
      <!-- Add photos button when photos exist -->
      <div v-if="canUpload" class="mb-2 flex justify-end flex-shrink-0">
        <button
          @click="$emit('add-photos-to-section')"
          class="h-7 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1"
          title="Add more photos to this section"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Photos
        </button>
      </div>
      <div class="flex-1 min-h-0 flex flex-row rounded-lg border border-gray-200 overflow-hidden">
        <draggable
          v-model="draggableImages"
          item-key="imageId"
          class="flex flex-row w-full"
          :animation="200"
          ghost-class="opacity-50"
          :disabled="!canUpload"
          @end="handleReorder"
        >
          <template #item="{ element: image, index: i }">
            <div
              :key="image.imageId"
              class="relative flex-1 transition-all duration-200"
              :class="{ 'cursor-move': canUpload, 'cursor-pointer': !canUpload }"
              @click="$emit('image-click', image)"
              @contextmenu="(e) => showContextMenu(e, image)"
            >
              <img
                :src="image.thumbnailUrl"
                :alt="`${section.name} photo ${i + 1}`"
                class="w-full h-full object-cover pointer-events-none"
                crossorigin="anonymous"
              />
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
      <div class="text-center">
        <svg class="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-gray-500 mb-3">No photos assigned to this section</p>
        <button
          v-if="canUpload"
          @click="$emit('add-photos-to-section')"
          class="btn-sm inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Photos
        </button>
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
import draggable from 'vuedraggable';
import { useImageContextMenu } from '../../composables/useImageContextMenu';
import { getResizedImageUrl } from '../../utils/imageResize';
import { orderImagesBySection } from '../../utils/imageOrdering';

const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  images: {
    type: Array,
    default: () => []
  },
  allSections: {
    type: Array,
    default: () => []
  },
  canUpload: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['image-reorder', 'image-click', 'analyze-holds', 'delete-image', 'move-to-section', 'add-photos-to-section']);

const { showContextMenu } = useImageContextMenu({
  onAnalyze: (image) => emit('analyze-holds', image),
  onDelete: (image) => emit('delete-image', image),
  onMove: (image, sectionId) => emit('move-to-section', image, sectionId),
  sections: computed(() => props.allSections),
  currentSectionId: computed(() => props.section.id)
});

// Get images for this section based on imageIds
const displayImages = computed(() => orderImagesBySection(props.section.imageIds, props.images));

// Get thumbnail URLs for faster loading in panorama view
const displayImagesWithThumbnails = computed(() => {
  return displayImages.value.map(image => ({
    ...image,
    thumbnailUrl: getResizedImageUrl(image.url, '300x300', 'webp')
  }));
});

// Two-way binding for draggable component
const draggableImages = computed({
  get: () => {
    return displayImagesWithThumbnails.value;
  },
  set: (newValue) => {
    // Updates handled in handleReorder
  }
});

function handleReorder(event) {
  // Use displayed images to ensure indices match what user sees
  const displayedIds = displayImages.value.map(img => img.imageId);
  const [movedId] = displayedIds.splice(event.oldIndex, 1);
  displayedIds.splice(event.newIndex, 0, movedId);
  
  emit('image-reorder', props.section.id, displayedIds);
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
