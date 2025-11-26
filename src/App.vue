<script setup>
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/userStore.js';
import AppHeader from './components/AppHeader.vue';
import AuthModal from './components/AuthModal.vue';
import VideoAnalysisIndicator from './components/VideoAnalysisIndicator.vue';

const userStore = useUserStore();
const showAuthModal = ref(false);

// Initialize authentication when app starts
onMounted(() => {
  userStore.initAuth();
});

// Global auth modal handlers
const openAuthModal = () => {
  showAuthModal.value = true;
};

const closeAuthModal = () => {
  showAuthModal.value = false;
};

const onAuthSuccess = () => {
  closeAuthModal();
};

// Provide the auth modal methods globally
import { provide } from 'vue';
provide('authModal', {
  open: openAuthModal,
  close: closeAuthModal
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Global header -->
    <AppHeader />

    <!-- Main content -->
    <RouterView />

    <!-- Global Auth Modal - direct child of app root -->
    <AuthModal 
      :is-open="showAuthModal" 
      @close="closeAuthModal" 
      @success="onAuthSuccess"
    />

    <!-- Global Video Analysis Indicator - persists across routes -->
    <VideoAnalysisIndicator />
  </div>
</template>

<style scoped></style>
