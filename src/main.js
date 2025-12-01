import './assets/main.css';
import 'floating-vue/dist/style.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import FloatingVue from 'floating-vue';

import App from './App.vue';
import router from './router';

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

// Eagerly initialize inference store to start loading AI models immediately
import { useInferenceStore } from './stores/inferenceStore';
useInferenceStore(); // This will trigger the session creation immediately

// Expose testing API for E2E tests (development only)
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
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

app.mount('#app');
