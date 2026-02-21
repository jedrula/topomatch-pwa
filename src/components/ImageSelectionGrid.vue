<template>
  <div>
    <label class="block text-[13px] font-medium text-gray-700 mb-2">
      {{ label }} <span class="text-gray-500">({{ selectedImageIds.length }}/{{ images.length }})</span>
    </label>
    <div v-if="description" class="text-[12px] text-gray-500 mb-3">
      {{ description }}
    </div>
    
    <!-- Select All / Deselect All -->
    <div class="flex gap-3 mb-3">
      <button
        @click="selectAll"
        type="button"
        class="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
      >
        Select All
      </button>
      <span class="text-gray-300">|</span>
      <button
        @click="deselectAll"
        type="button"
        class="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
      >
        Deselect All
      </button>
    </div>

    <!-- Image Grid -->
    <div class="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto bg-gray-50 p-2 rounded-md border border-gray-200/60">
      <div
        v-for="image in images"
        :key="image.imageId"
        @click="toggleSelection(image.imageId)"
        class="relative aspect-square cursor-pointer border-2 rounded-md overflow-hidden transition-all"
        :class="{
          'border-blue-500 ring-2 ring-blue-200': selectedImageIds.includes(image.imageId) && color === 'blue',
          'border-green-500 ring-2 ring-green-200': selectedImageIds.includes(image.imageId) && color === 'green',
          'border-gray-200 hover:border-gray-300': !selectedImageIds.includes(image.imageId)
        }"
      >
        <img
          :src="image.url"
          :alt="image.name"
          crossorigin="anonymous"
          class="w-full h-full object-cover"
          :class="{ 'opacity-50': !selectedImageIds.includes(image.imageId) }"
        />
        <!-- Checkmark overlay -->
        <div
          v-if="selectedImageIds.includes(image.imageId)"
          class="absolute top-1 right-1"
        >
          <div class="rounded-full p-0.5 shadow-md" :class="{
            'bg-blue-600': color === 'blue',
            'bg-green-600': color === 'green'
          }">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  images: {
    type: Array,
    required: true,
    // Array of { imageId, url, name }
  },
  selectedImageIds: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    default: 'Select images'
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green'].includes(value)
  }
});

const emit = defineEmits(['update:selectedImageIds']);

function toggleSelection(imageId) {
  const newSelection = [...props.selectedImageIds];
  const index = newSelection.indexOf(imageId);
  
  if (index > -1) {
    newSelection.splice(index, 1);
  } else {
    newSelection.push(imageId);
  }
  
  emit('update:selectedImageIds', newSelection);
}

function selectAll() {
  emit('update:selectedImageIds', props.images.map(img => img.imageId));
}

function deselectAll() {
  emit('update:selectedImageIds', []);
}
</script>
