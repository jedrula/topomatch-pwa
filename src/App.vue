<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/userStore.js';
import { isNative } from './utils/platform.js';
import AppHeader from './components/AppHeader.vue';
import AuthModal from './components/AuthModal.vue';
import VideoAnalysisIndicator from './components/VideoAnalysisIndicator.vue';
import BottomTabBar from './components/BottomTabBar.vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const userStore = useUserStore();
const showAuthModal = ref(false);
const isNativePlatform = ref(false);

// PWA update prompt
const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  onRegisteredSW(swUrl, r) {
    console.log(`✅ Service Worker registered: ${swUrl}`);
    console.log('📱 Registration object:', r);
    
    // IMMEDIATE check on registration
    if (r) {
      console.log('🚀 Immediate update check on registration...');
      r.update().then(() => {
        console.log('✅ Immediate check completed');
      }).catch(err => {
        console.error('❌ Immediate check failed:', err);
      });
    }
    
    // Check for updates on visibility change (when user returns to app)
    // This is critical for iOS PWAs
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && r) {
        console.log('👁️ App visible - checking for SW updates...');
        r.update().then(() => {
          console.log('✅ Update check completed');
        }).catch(err => {
          console.error('❌ Update check failed:', err);
        });
      }
    });
    
    // Also check periodically as backup
    r && setInterval(() => {
      console.log('⏰ Periodic SW update check...');
      r.update().catch(err => console.error('❌ Periodic update failed:', err));
    }, 60 * 60 * 1000); // 1 hour
  },
  onNeedRefresh() {
    console.log('🔔 UPDATE AVAILABLE! needRefresh triggered');
  },
  onOfflineReady() {
    console.log('📴 App ready to work offline');
  },
  onRegisterError(error) {
    console.error('❌ SW registration error:', error);
  },
});

// Watch needRefresh for debugging
watch(needRefresh, (newVal) => {
  console.log('🔄 needRefresh changed to:', newVal);
});

const close = async () => {
  offlineReady.value = false;
  needRefresh.value = false;
};

const updateApp = () => {
  console.log('🔄 Updating app...');
  updateServiceWorker(true);
};

// Initialize authentication when app starts
onMounted(() => {
  isNativePlatform.value = isNative();
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
  <div class="app-container">
    <!-- PWA Update Prompt -->
    <div
      v-if="needRefresh"
      class="fixed top-16 left-1/2 transform -translate-x-1/2 z-[9999] bg-white rounded-lg shadow-xl border-2 border-amber-500 p-4 max-w-sm mx-4"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-gray-900 mb-1">Update Available</h3>
          <p class="text-sm text-gray-600 mb-3">A new version is ready. Reload to update?</p>
          <div class="flex gap-2">
            <button
              @click="updateApp"
              class="btn-primary text-sm px-4 py-2 rounded-lg font-medium"
            >
              Reload Now
            </button>
            <button
              @click="close"
              class="btn-secondary text-sm px-4 py-2 rounded-lg font-medium"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Global header -->
    <AppHeader v-if="!isNativePlatform" />

    <!-- Main content - scrollable area -->
    <main class="app-content">
      <RouterView />
    </main>

    <!-- Bottom Tab Bar (native only) -->
    <BottomTabBar />

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
