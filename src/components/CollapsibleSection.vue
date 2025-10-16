<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h6 class="text-xs font-medium text-gray-700">{{ title }}</h6>
      <button
        @click="isExpanded = !isExpanded"
        class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
      >
        <span>{{ isExpanded ? '▼' : '▶' }}</span>
        <span>{{ isExpanded ? 'Hide' : 'Show' }}</span>
      </button>
    </div>
    <div v-if="isExpanded" :class="contentClass">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  },
  contentClass: {
    type: String,
    default: ''
  }
});

const isExpanded = ref(props.defaultExpanded);
</script>
