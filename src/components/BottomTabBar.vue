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

      <!-- WhatsApp Tab (only for logged in users) -->
      <a
        v-if="userStore.isLoggedIn"
        :href="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col items-center gap-1 px-4 transition-colors text-gray-600 active:text-green-600"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span class="text-[11px] font-medium">Feedback</span>
      </a>

      <!-- Report Tab -->
      <button
        @click="handleReportClick"
        class="flex flex-col items-center gap-1 px-4 transition-colors text-gray-600 active:text-blue-600"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-[11px] font-medium">Report</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { inject, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import { isNative } from '../utils/platform.js';

const emit = defineEmits(['openReporter']);

const route = useRoute();
const userStore = useUserStore();
const isNativePlatform = isNative();

// WhatsApp URL with clean message for native app (no capacitor://localhost)
const whatsappUrl = computed(() => {
  const userName = userStore.user?.displayName || userStore.user?.email || 'User';
  // Use relative path (e.g., /location/123) instead of full capacitor:// URL
  const relativePath = route.fullPath;
  const message = `Hi, I am ${userName} and I have feedback about TopoMatch app${relativePath !== '/' ? ` (page: ${relativePath})` : ''}`;
  return `https://wa.me/48577809649?text=${encodeURIComponent(message)}`;
});

// Inject auth modal from App.vue
const authModal = inject('authModal');

const openAuthModal = () => {
  if (authModal?.open) {
    authModal.open();
  }
};

const handleReportClick = () => {
  console.log('[BottomTabBar] Report clicked, emitting openReporter event');
  emit('openReporter');
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
