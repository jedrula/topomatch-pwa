/**
 * Inference Store Loader
 * 
 * Dynamically loads the appropriate inference store implementation based on:
 * - Device type (mobile vs desktop)
 * - Environment variables (mock, main thread, new worker, old worker)
 * 
 * This ensures we only import one store implementation and maintain singleton behavior.
 * The selected store is cached on first load and reused across all imports.
 */

import { isMobile } from '@/utils/platform';
// import { Capacitor } from '@capacitor/core'; // Moved to dynamic import

let cachedUseInferenceStore = null;

/**
 * Get the appropriate inference store implementation
 * @returns {Promise<Function>} The useInferenceStore function from the selected implementation
 */
export async function loadInferenceStore() {
  // Return cached store if already loaded
  if (cachedUseInferenceStore) {
    return cachedUseInferenceStore;
  }

  const { Capacitor } = await import('@capacitor/core');
  const isMobileDevice = isMobile();
  const isNativeApp = Capacitor.isNativePlatform();
  
  console.log('🔍 Device detection:');
  console.log('   User Agent:', navigator.userAgent);
  console.log('   isMobile():', isMobileDevice);
  console.log('   isNativePlatform():', isNativeApp);
  console.log('   Platform:', navigator.platform);

  let useInferenceStore;

  // 🚨 MOBILE WEB ONLY: Skip model loading on mobile browsers (not native apps)
  if (isMobileDevice && !isNativeApp) {
    console.log('📱 Mobile device detected - Using dummy MOCK inference store');
    const module = await import('./inferenceStoreDummyMock.js');
    useInferenceStore = module.useInferenceStore;
  } 
  // Mock mode (VITE_USE_INFERENCE_MOCK=true): Uses recorded fixtures (saves ~49 MB)
  else if (import.meta.env.VITE_USE_INFERENCE_MOCK === 'true') {
    console.log('🎭 Using MOCK inference store (recorded fixtures)');
    const module = await import('./inferenceStoreMock.js');
    useInferenceStore = module.useInferenceStore;
  } 
  // Main thread mode (VITE_USE_MAIN_THREAD_INFERENCE=true): Runs in main thread (no worker)
  else if (import.meta.env.VITE_USE_MAIN_THREAD_INFERENCE === 'true') {
    console.log('🧵 Using MAIN THREAD inference store (no worker)');
    const module = await import('./inferenceStoreMainThread.js');
    useInferenceStore = module.useInferenceStore;
  } 
  // Worker (new) mode (VITE_USE_NEW_WORKER=true): ES modules worker following ONNX Runtime best practices
  else if (import.meta.env.VITE_USE_NEW_WORKER === 'true') {
    console.log('🚀 Using NEW WORKER inference store (ES modules, ONNX Runtime best practices)');
    const module = await import('./inferenceStoreWorkerNew.js');
    useInferenceStore = module.useInferenceStore;
  } 
  // Worker (old) mode (default): Legacy concatenated worker
  else {
    console.log('👷 Using OLD WORKER inference store (legacy concatenated)');
    const module = await import('./inferenceStore.js');
    useInferenceStore = module.useInferenceStore;
  }

  // Cache for future calls
  cachedUseInferenceStore = useInferenceStore;
  
  return useInferenceStore;
}
