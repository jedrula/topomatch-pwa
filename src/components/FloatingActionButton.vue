<template>
  <button
    v-if="showFab"
    @click="handleClick"
    class="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:bg-blue-700 z-40"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const emit = defineEmits(['click']);
const route = useRoute();

// Show FAB on all platforms when on location detail page
const showFab = computed(() => {
  return route.path.startsWith('/location/') && route.name === 'location-detail';
});

const handleClick = () => {
  emit('click');
};
</script>
