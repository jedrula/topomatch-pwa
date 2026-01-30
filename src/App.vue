<script setup>
import { onMounted, ref, watch } from 'vue';
import { RouterView } from 'vue-router';
import { useUserStore } from './stores/userStore.js';
import { isNative } from './utils/platform.js';
import AppHeader from './components/AppHeader.vue';
import AuthModal from './components/AuthModal.vue';
import VideoAnalysisIndicator from './components/VideoAnalysisIndicator.vue';
import BottomTabBar from './components/BottomTabBar.vue';
import DiagnosticReporter from './components/DiagnosticReporter.vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const userStore = useUserStore();
const showAuthModal = ref(false);
const showReporter = ref(false);
const isNativePlatform = ref(false);

// PWA update - auto-update without prompting
const {
  offlineReady,
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  immediate: true, // Check for updates immediately
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
    console.log('🔔 UPDATE AVAILABLE! Auto-updating...');
    // Auto-update without prompting
    updateServiceWorker(true);
  },
  onOfflineReady() {
    console.log('📴 App ready to work offline');
  },
  onRegisterError(error) {
    console.error('❌ SW registration error:', error);
  },
});

// Watch needRefresh for debugging (no longer used for manual prompts)
watch(needRefresh, (newVal) => {
  console.log('🔄 needRefresh changed to:', newVal);
  if (newVal) {
    console.log('   Auto-update will be triggered');
  }
});

// Initialize authentication when app starts
onMounted(async () => {
  isNativePlatform.value = isNative();
  userStore.initAuth();
  
  // TEST: Image matching plugin (iOS only)
  if (isNativePlatform.value) {
    try {
      const { testIosImageMatching } = await import('./plugins/testIosImageMatching');
      await testIosImageMatching();
    } catch (error) {
      console.log('⏸️ Image matching test skipped or failed:', error);
    }
  }
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

// Handle report dialog
const handleOpenReporter = () => {
  console.log('[App] Opening reporter, showReporter:', showReporter.value);
  showReporter.value = true;
  console.log('[App] After setting, showReporter:', showReporter.value);
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
    <!-- PWA Update: Auto-updating, no prompt needed -->
    
    <!-- Global header -->
    <AppHeader v-if="!isNativePlatform" />

    <!-- Main content - scrollable area -->
    <main class="app-content">
      <RouterView />
    </main>

    <!-- Bottom Tab Bar (native only) -->
    <BottomTabBar @open-reporter="handleOpenReporter" />

    <!-- Global Auth Modal - direct child of app root -->
    <AuthModal 
      :is-open="showAuthModal" 
      @close="closeAuthModal" 
      @success="onAuthSuccess"
    />

    <!-- Global Diagnostic Reporter -->
    <DiagnosticReporter 
      :show="showReporter"
      @close="showReporter = false"
    />

    <!-- Global Video Analysis Indicator - persists across routes -->
    <VideoAnalysisIndicator />
  </div>
</template>
