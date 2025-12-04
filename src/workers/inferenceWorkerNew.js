/**
 * Inference Worker - Best Practices Implementation
 * Following: https://onnxruntime.ai/docs/tutorials/web/deploy.html#worker-loading
 * 
 * Key improvements:
 * - Uses ES modules instead of concatenated files
 * - Imports ONNX Runtime Web directly
 * - Cleaner architecture following official docs
 */

import * as ort from 'onnxruntime-web';

let session = null;

self.onmessage = async (event) => {
  const { type, userImageBuffer, topoImageBuffer } = event.data;

  if (type === 'createSession') {
    try {
      console.log('🚀 [InferenceWorker] Starting session creation...');
      
      // Detect if we're on mobile (less memory available)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Check available memory before attempting to load model
      if (performance.memory) {
        const availableMemory = performance.memory.jsHeapSizeLimit;
        const usedMemory = performance.memory.usedJSHeapSize;
        const freeMemory = availableMemory - usedMemory;
        const freeMB = (freeMemory / 1024 / 1024).toFixed(0);
        const requiredMB = isMobile ? 300 : 700;
        
        console.log(`💾 [InferenceWorker] Memory check:`);
        console.log(`   Free: ${freeMB} MB`);
        console.log(`   Required: ${requiredMB} MB`);
        
        if (freeMemory < requiredMB * 1024 * 1024) {
          throw new Error(`Insufficient memory: Only ${freeMB} MB available, need at least ${requiredMB} MB.`);
        }
      } else {
        console.warn('⚠️ [InferenceWorker] Cannot check available memory (Safari limitation)');
        
        if (isMobile && navigator.deviceMemory !== undefined && navigator.deviceMemory < 4) {
          throw new Error(`This device has only ${navigator.deviceMemory} GB RAM. Video analysis requires at least 4GB RAM.`);
        }
      }
      
      const startTime = performance.now();
      
      // Optimized session config
      const hardwareCores = navigator.hardwareConcurrency || 4;
      const maxThreads = Math.max(1, Math.min(4, hardwareCores - 2)); // Reserve 2 cores for UI
      
      console.log(`🧵 [InferenceWorker] Using ${maxThreads} threads (hardware: ${hardwareCores})`);
      
      const sessionConfig = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'basic',
        enableMemPattern: false,
        enableCpuMemArena: false,
        wasm: {
          numThreads: maxThreads,
          simd: true,
          threads: maxThreads > 1,
        },
      };
      
      // Load model
      const modelPath = '/superpoint_lightglue_pipeline.ort.onnx';
      console.log(`📂 [InferenceWorker] Loading model from: ${modelPath}`);
      
      session = await ort.InferenceSession.create(modelPath, sessionConfig);
      const endTime = performance.now();
      
      console.log(`✅ [InferenceWorker] Session created successfully in ${((endTime - startTime) / 1000).toFixed(2)}s`);
      
      self.postMessage({
        type: 'sessionReady',
        data: { sessionTime: endTime - startTime },
      });
    } catch (error) {
      console.error('❌ [InferenceWorker] Session creation failed:', error);
      
      let errorMessage = error.message;
      
      // Add helpful error messages
      if (error.message.includes('Insufficient memory')) {
        errorMessage = error.message;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `Failed to download model file. Please check your internet connection and try again. Error: ${error.message}`;
      } else if (error.message.includes('out of memory') || error.message.includes('OOM')) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          errorMessage = `Your device ran out of memory while loading the AI model. Try:\n1. Close all other browser tabs\n2. Close other apps\n3. Restart your browser\n4. If still failing, this device may not have enough RAM (4GB+ recommended)`;
        } else {
          errorMessage = `Out of memory while loading AI model. Try:\n1. Close other browser tabs and applications\n2. Restart your browser\n3. If still failing, your system may need more RAM`;
        }
      }
      
      self.postMessage({
        type: 'error',
        data: { message: errorMessage },
      });
    }
  }

  if (type === 'runInference') {
    if (!session) {
      self.postMessage({
        type: 'error',
        data: { message: 'Session is not initialized.' },
      });
      return;
    }

    let userBitmap = null;
    let topoBitmap = null;
    let userBlob = null;
    let topoBlob = null;
    
    try {
      if (!userImageBuffer || !topoImageBuffer) {
        self.postMessage({
          type: 'error',
          data: { message: 'Both user and topo images must be provided.' },
        });
        return;
      }
      
      userBlob = new Blob([userImageBuffer]);
      userBitmap = await createImageBitmap(userBlob);
      topoBlob = new Blob([topoImageBuffer]);
      topoBitmap = await createImageBitmap(topoBlob);
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

      self.postMessage({
        type: 'inferenceComplete',
        data: {
          inferenceTime: endTime - startTime,
          results,
          // Don't send images - causes memory leak (ImageBitmaps not transferable)
          imgWidth,
          imgHeight,
          userImageDims,
          topoImageDims,
        },
      });
    } catch (error) {
      console.error('❌ [InferenceWorker] Inference failed:', error);
      self.postMessage({
        type: 'error',
        data: { message: `Inference failed: ${error.message}` },
      });
    } finally {
      // Explicitly release resources
      if (userBitmap && typeof userBitmap.close === 'function') userBitmap.close();
      if (topoBitmap && typeof topoBitmap.close === 'function') topoBitmap.close();
      userBitmap = null;
      topoBitmap = null;
      userBlob = null;
      topoBlob = null;
    }
  }
};

/**
 * Preprocess image for inference
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
