import './assets/main.css';
import 'floating-vue/dist/style.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import FloatingVue from 'floating-vue';

import App from './App.vue';
import router from './router';
import { initPushNotificationListener, consumePendingRoute, setRouter } from './services/deepLinkHandler';
import { loadInferenceStore } from './stores/inferenceStoreLoader';

// Initialize push notification listener BEFORE app mounts
// This captures notifications that launched the app
initPushNotificationListener();

// Capacitor: Disable zoom for native platform (better UX, no pinch-zoom needed)
// Browser: Keep zoom enabled for accessibility
if (window.Capacitor?.isNativePlatform()) {
  const meta = document.querySelector('meta[name=viewport]');
  if (meta) {
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }
  
  // Initialize StatusBar - content starts below status bar (no overlay)
  import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setStyle({ style: Style.Light }); // Dark text for white header
    console.log('[main.js] StatusBar configured: overlay=false, style=Light');
  }).catch(err => {
    console.log('[main.js] StatusBar not available:', err.message);
  });
}

// import * as ort from "onnxruntime-web/dist/ort-web.min.js";

// import wasm from "onnxruntime-web/dist/ort-wasm.wasm?url";
// import wasmThreaded from "onnxruntime-web/dist/ort-wasm-threaded.wasm?url";
// import wasmSimd from "onnxruntime-web/dist/ort-wasm-simd.wasm?url";
// import wasmSimdThreaded from "onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url";

// ort.env.wasm.wasmPaths = {
//   "ort-wasm.wasm": wasm,
//   "ort-wasm-threaded.wasm": wasmThreaded,
//   "ort-wasm-simd.wasm": wasmSimd,
//   "ort-wasm-simd-threaded.wasm": wasmSimdThreaded,
// };

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(FloatingVue);

app.use(pinia);

// Only initialize inference store for non-native platforms
if (!window.Capacitor?.isNativePlatform() || window.Capacitor?.getPlatform?.() !== 'ios') {
  // Eagerly initialize inference store to start loading AI models immediately
  // Four modes available:
  // 1. Mock mode (VITE_USE_INFERENCE_MOCK=true): Uses recorded fixtures (saves ~49 MB)
  // 2. Main thread mode (VITE_USE_MAIN_THREAD_INFERENCE=true): Runs in main thread (no worker)
  // 3. Worker (new) mode (VITE_USE_NEW_WORKER=true): ES modules worker following ONNX Runtime best practices
  // 4. Worker (old) mode (default): Legacy concatenated worker
  // See inferenceStoreLoader.js for implementation details
  loadInferenceStore()
    .then((useInferenceStore) => {
      useInferenceStore(); // Initialize session immediately
      console.log('🚀 Inference model loading started');
    })
    .catch((error) => {
      console.error('❌ Failed to load inference store:', error);
    });
}

// Expose testing API for E2E tests
// Enabled in: dev mode, test mode, or production-test build (VITE_ENABLE_TEST_API=true)
if (import.meta.env.DEV || import.meta.env.MODE === 'test' || import.meta.env.VITE_ENABLE_TEST_API === 'true') {
  window.__TEST_API__ = {
    // Get store state
    getStoreState: (storeName) => {
      const stores = pinia._s; // Map of all stores
      const store = stores.get(storeName);
      return store ? store.$state : null;
    },
    
    // Get all store names
    getStoreNames: () => {
      return Array.from(pinia._s.keys());
    },
    
    // Get analysis queue store specifically
    getAnalysisQueue: () => {
      const store = pinia._s.get('videoAnalysisQueue');
      return store ? {
        jobs: store.jobs,
        activeJobs: store.activeJobs,
        hasActiveJobs: store.hasActiveJobs,
        completionRegistry: store.completionRegistry  // ← CRITICAL: Expose for tests!
      } : null;
    },
    
    // Get upload queue store
    getUploadQueue: () => {
      const store = pinia._s.get('videoUploadQueue');
      return store ? {
        uploads: store.uploads,
        allUploads: store.allUploads
      } : null;
    }
  };
  
  console.log('🧪 Test API enabled - access via window.__TEST_API__');
}

// Initialize push notifications after user logs in
import { requestNotificationPermission } from './services/pushNotificationService';
import { useUserStore } from './stores/userStore';

// No need for foreground message listener with Web Push
// Service worker handles all notifications

// Listen for navigation messages from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[main.js] Received message from service worker:', event.data);
    
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      console.log('[main.js] Notification click detected, navigating to:', event.data.url);
      
      // Navigate to the URL specified in the notification
      router.push(event.data.url)
        .then(() => {
          console.log('[main.js] Successfully navigated to:', event.data.url);
        })
        .catch(err => {
          console.error('[main.js] Failed to navigate from notification click:', err);
        });
    } else {
      console.log('[main.js] Message is not a notification click, ignoring');
    }
  });
  console.log('[main.js] Service worker message listener registered');
} else {
  console.warn('[main.js] Service workers not supported in this browser');
}

// Request permission after auth initializes
router.isReady().then(() => {
  const userStore = useUserStore();
  let lastUserId = null; // Track last user to prevent duplicate calls
  
  // Watch for user login/logout and request notification permission when logged in
  userStore.$subscribe((mutation, state) => {
    // When user logs in (was loading, now has user) AND it's a different user
    if (!state.isLoading && state.user && state.user.uid !== lastUserId) {
      lastUserId = state.user.uid;
      requestNotificationPermission().catch(err => {
        console.error('Failed to initialize push notifications:', err);
      });
    }
    
    // Clear tracking when user logs out
    if (!state.user) {
      lastUserId = null;
    }
  });
  
  // Also request on initial load if user is already logged in
  // This handles page refresh and new tab cases
  if (!userStore.isLoading && userStore.user) {
    requestNotificationPermission().catch(err => {
      console.error('Failed to initialize push notifications on load:', err);
    });
  }
});

// Handle deep link from push notification BEFORE mounting
// This prevents flash of default route before navigating
router.isReady().then(() => {
  const pendingRoute = consumePendingRoute();
  
  if (pendingRoute) {
    console.log('[main.js] Navigating to pending route:', pendingRoute);
    router.replace(pendingRoute).then(() => {
      console.log('[main.js] Navigation complete, mounting app');
      setRouter(router); // Enable foreground navigation
      app.mount('#app');
    }).catch(err => {
      console.error('[main.js] Navigation failed:', err);
      setRouter(router); // Enable foreground navigation even if navigation fails
      app.mount('#app');
    });
  } else {
    setRouter(router); // Enable foreground navigation
    app.mount('#app');
  }
});
