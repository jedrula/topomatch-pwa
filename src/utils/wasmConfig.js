/**
 * WASM/ONNX Runtime configuration utilities
 * Handles platform-specific optimizations and compatibility
 */

/**
 * Detect if running on iOS 15 or below (SIMD not supported)
 */
export const isIOS15OrBelow = () => {
  const ua = navigator.userAgent;
  const match = ua.match(/OS (\d+)_/);
  if (match) {
    const version = parseInt(match[1], 10);
    return version <= 15;
  }
  return false;
};

/**
 * Get optimized ONNX Runtime session config based on platform capabilities
 * @param {number} threadCount - Number of threads to use
 * @returns {object} ONNX Runtime session configuration
 */
export const getONNXSessionConfig = (threadCount) => {
  const iosOldVersion = isIOS15OrBelow();
  const useSIMD = !iosOldVersion;
  
  if (iosOldVersion) {
    console.log('⚠️ [WASM Config] iOS 15 or below detected - disabling SIMD');
  }
  
  return {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'basic',
    enableMemPattern: false,
    enableCpuMemArena: false,
    wasm: {
      numThreads: threadCount,
      simd: useSIMD,
      threads: threadCount > 1,
    },
  };
};
