<template>
  <!-- Hidden file input -->
  <input
    ref="fileInput"
    type="file"
    accept="video/*"
    class="hidden"
    @change="handleFileChange"
  />
  
  <!-- Styled button that triggers file input -->
  <button
    @click="triggerFileInput"
    :class="[
      'fixed bottom-15 right-4 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 hover:bg-green-700 z-40',
      showText ? 'w-auto px-4 gap-2' : 'w-14'
    ]"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <span v-if="showText" class="text-[14px] font-medium whitespace-nowrap">Upload</span>
  </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';

const props = defineProps({
  isAuthenticated: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['file-selected']);
const authModal = inject('authModal');

const scrollY = ref(0);
const fileInput = ref(null);

// Show text only when at the top (scrolled less than 100px)
const showText = computed(() => scrollY.value < 100);

const triggerFileInput = () => {
  // Check authentication and open modal if needed
  if (!props.isAuthenticated) {
    authModal.open();
    return;
  }
  
  // User is authenticated, trigger file input
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target?.files?.[0];
  if (file) {
    emit('file-selected', file);
    // Reset input so the same file can be selected again
    event.target.value = '';
  }
};

const handleScroll = (event) => {
  scrollY.value = event.target.scrollTop;
};

onMounted(() => {
  // Find the scrolling container (.app-content)
  const scrollContainer = document.querySelector('.app-content');
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  const scrollContainer = document.querySelector('.app-content');
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll);
  }
});
</script>
