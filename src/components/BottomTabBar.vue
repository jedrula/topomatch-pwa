<template>
  <nav 
    v-if="isNativePlatform"
    class="bottom-tab-bar relative top-0.5 bg-white border-t border-gray-200/20"
  >
    <div class="flex justify-around pt-2">
      <!-- Home Tab -->
      <router-link
        to="/"
        class="flex flex-col items-center gap-1 px-4 transition-colors"
        :class="isActive('/') ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-[11px] font-medium">Home</span>
      </router-link>

      <!-- Locations Tab -->
      <router-link
        to="/pick-location"
        class="flex flex-col items-center gap-1 px-4 transition-colors"
        :class="isActive('/pick-location') ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-[11px] font-medium">Locations</span>
      </router-link>

      <!-- Profile Tab -->
      <component
        :is="userStore.isLoggedIn ? 'router-link' : 'button'"
        :to="userStore.isLoggedIn ? '/profile' : undefined"
        @click="!userStore.isLoggedIn ? openAuthModal() : undefined"
        class="flex flex-col items-center gap-1 px-4 transition-colors"
        :class="isActive('/profile') ? 'text-blue-600' : 'text-gray-600'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="text-[11px] font-medium">Profile</span>
      </component>
    </div>
  </nav>
</template>

<script setup>
import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import { isNative } from '../utils/platform.js';

const route = useRoute();
const userStore = useUserStore();
const isNativePlatform = isNative();

// Inject auth modal from App.vue
const authModal = inject('authModal');

const openAuthModal = () => {
  if (authModal?.open) {
    authModal.open();
  }
};

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};
</script>

<style scoped>
/* No additional styles needed - safe area handled inline */
</style>
