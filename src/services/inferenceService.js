/**
 * Main-thread inference service (no worker)
 * Direct implementation using ONNX Runtime Web
 * Based on: https://onnxruntime.ai/docs/tutorials/web/deploy.html
 */

import * as ort from 'onnxruntime-web';
import { getONNXSessionConfig } from '@/utils/wasmConfig';

let session = null;
let sessionCreationPromise = null;

/**
 * Create ONNX Runtime session (loads model)
 * @returns {Promise<{sessionTime: number}>}
 */
export async function createSession() {
  // Return existing session if already created
  if (session) {
    return { sessionTime: 0 };
  }

  // If already creating, wait for that promise
  if (sessionCreationPromise) {
    return sessionCreationPromise;
  }

  sessionCreationPromise = (async () => {
    try {
      console.log('🚀 [InferenceService] Starting session creation...');
      
      // Detect if we're on mobile (less memory available)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Check available memory before attempting to load model
      if (performance.memory) {
        // Chrome/Edge - we can check memory
        const availableMemory = performance.memory.jsHeapSizeLimit;
        const usedMemory = performance.memory.usedJSHeapSize;
        const freeMemory = availableMemory - usedMemory;
        const freeMB = (freeMemory / 1024 / 1024).toFixed(0);
        const requiredMB = isMobile ? 300 : 700; // Minimum required memory
        
        console.log(`💾 [InferenceService] Memory check:`);
        console.log(`   Free: ${freeMB} MB`);
        console.log(`   Required: ${requiredMB} MB`);
        
        if (freeMemory < requiredMB * 1024 * 1024) {
          throw new Error(`Insufficient memory: Only ${freeMB} MB available, need at least ${requiredMB} MB. Please close other tabs/apps and try again, or use a device with more RAM.`);
        }
      } else {
        // Safari - can't check memory, but can check device memory hints
        console.warn('⚠️ [InferenceService] Cannot check available memory (Safari limitation)');
        
        if (isMobile && navigator.deviceMemory !== undefined && navigator.deviceMemory < 4) {
          // Device has less than 4GB RAM - likely to fail
          console.error(`⚠️ [InferenceService] Device has ${navigator.deviceMemory} GB RAM - may be insufficient`);
          throw new Error(`This device has only ${navigator.deviceMemory} GB RAM. Video analysis requires at least 4GB RAM. Please try on a more powerful device.`);
        }
        
        console.log('⚠️ [InferenceService] Proceeding without memory check - may fail on low-memory devices');
      }
      
      const startTime = performance.now();
      
      // Universal optimized settings for all devices
      // Leave 2 threads for browser UI and other tasks
      const hardwareCores = navigator.hardwareConcurrency || 4;
      const maxThreads = Math.max(1, Math.min(4, hardwareCores - 2)); // Reserve 2 cores for UI
      const threadCount = maxThreads;
      
      console.log(`🧵 [InferenceService] Using ${threadCount} threads (hardware: ${navigator.hardwareConcurrency || 4}, reserved: 2)`);
      console.log('📥 [InferenceService] Starting model download and WASM initialization...');
      console.log('   Model: superpoint_lightglue_pipeline.ort.onnx');
      console.log('   This may take 1-2 minutes on first load (model needs to download)');
      
      // Get optimized session config for this platform
      const sessionConfig = getONNXSessionConfig(threadCount);
      
      console.log(`⚙️ [InferenceService] Session config:`, {
        threads: threadCount,
        optimization: sessionConfig.graphOptimizationLevel,
        memPattern: sessionConfig.enableMemPattern,
        cpuArena: sessionConfig.enableCpuMemArena
      });
      
      // Use absolute path from root
      const modelPath = '/superpoint_lightglue_pipeline.ort.onnx';
      console.log(`📂 [InferenceService] Loading model from: ${modelPath}`);
      
      session = await ort.InferenceSession.create(
        modelPath,
        sessionConfig
      );
      const endTime = performance.now();
      const sessionTime = endTime - startTime;
      
      console.log(`✅ [InferenceService] Session created successfully in ${(sessionTime / 1000).toFixed(2)}s`);

      return { sessionTime };
    } catch (error) {
      console.error('❌ [InferenceService] Session creation failed:', error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide helpful message for out-of-memory errors
      let errorMessage = error.message;
      if (error.message.includes('Out of memory') || error.message.includes('RangeError') || error.message.includes('Insufficient memory')) {
        if (error.message.includes('Insufficient memory')) {
          // Early detection - we caught it before trying
          errorMessage = error.message;
        } else {
          // Runtime OOM - happened during load
          errorMessage = 'Device ran out of memory loading AI model. Try closing other apps/tabs and reloading the page.';
        }
        console.error('💡 [InferenceService] Out of memory - Recovery steps:');
        console.error('   1. Close ALL other browser tabs (each tab uses memory)');
        console.error('   2. Close background apps (check task switcher)');
        console.error('   3. Restart Safari/Browser completely');
        console.error('   4. If still failing: Device has insufficient RAM for this feature');
        console.error('   Note: This device may not support video analysis due to memory constraints');
      }
      
      // Clear the promise so retry is possible
      sessionCreationPromise = null;
      throw new Error(errorMessage);
    }
  })();

  return sessionCreationPromise;
}

/**
 * Preprocess image for inference
 * @param {ImageBitmap} image 
 * @param {number} width 
 * @param {number} height 
 * @returns {Float32Array}
 */
function preprocessImage(image, width, height) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const input = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = imageData[i * 4] / 255.0;
    const g = imageData[i * 4 + 1] / 255.0;
    const b = imageData[i * 4 + 2] / 255.0;
    input[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return input;
}

/**
 * Run inference on two images
 * @param {ArrayBuffer} userImageBuffer 
 * @param {ArrayBuffer} topoImageBuffer 
 * @returns {Promise<{inferenceTime: number, results: any, userImageDims: {width: number, height: number}, topoImageDims: {width: number, height: number}, imgWidth: number, imgHeight: number}>}
 */
export async function runInference(userImageBuffer, topoImageBuffer) {
  if (!session) {
    throw new Error('Session is not initialized. Call createSession() first.');
  }

  let userBitmap = null;
  let topoBitmap = null;
  let userBlob = null;
  let topoBlob = null;
  
  try {
    if (!userImageBuffer || !topoImageBuffer) {
      throw new Error('Both user and topo images must be provided.');
    }
    
    console.log('[InferenceService] Image buffers:', {
      userSize: userImageBuffer.byteLength,
      topoSize: topoImageBuffer.byteLength
    });
    
    userBlob = new Blob([userImageBuffer]);
    console.log('[InferenceService] Created user blob:', userBlob.size, userBlob.type);
    userBitmap = await createImageBitmap(userBlob);
    console.log('[InferenceService] Created user bitmap:', userBitmap.width, 'x', userBitmap.height);
    
    topoBlob = new Blob([topoImageBuffer]);
    console.log('[InferenceService] Created topo blob:', topoBlob.size, topoBlob.type);
    topoBitmap = await createImageBitmap(topoBlob);
    console.log('[InferenceService] Created topo bitmap:', topoBitmap.width, 'x', topoBitmap.height);
    
    const images = [userBitmap, topoBitmap];

    // Store original image dimensions for coordinate space conversion
    const userImageDims = { width: userBitmap.width, height: userBitmap.height };
    const topoImageDims = { width: topoBitmap.width, height: topoBitmap.height };

    const imgWidth = 256;
    const imgHeight = 256;
    const tensors = images.map((image) =>
      preprocessImage(image, imgWidth, imgHeight)
    );
    const combinedInput = new Float32Array([...tensors[0], ...tensors[1]]);
    const tensor = new ort.Tensor('float32', combinedInput, [2, 1, imgHeight, imgWidth]);
    const feeds = { images: tensor };

    const startTime = performance.now();
    const results = await session.run(feeds);
    const endTime = performance.now();

    return {
      inferenceTime: endTime - startTime,
      results,
      images,
      imgWidth,
      imgHeight,
      userImageDims,
      topoImageDims,
    };
  } catch (error) {
    throw new Error(`Inference failed: ${error.message}`);
  } finally {
    // Explicitly release resources to help GC, especially on mobile
    if (userBitmap && typeof userBitmap.close === 'function') userBitmap.close();
    if (topoBitmap && typeof topoBitmap.close === 'function') topoBitmap.close();
    userBitmap = null;
    topoBitmap = null;
    userBlob = null;
    topoBlob = null;
  }
}

/**
 * Check if session is ready
 * @returns {boolean}
 */
export function isSessionReady() {
  return session !== null;
}
