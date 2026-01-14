/* global ort */

self.onmessage = async (event) => {
  const { type, userImageBuffer, topoImageBuffer } = event.data;

  if (type === 'createSession') {
    try {
      console.log('🚀 [InferenceWorker] Starting session creation...');
      
      // Detect if we're on mobile (less memory available)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Check available memory before attempting to load model
      let availableMemory = null;
      let shouldAttemptLoad = true;
      
      if (performance.memory) {
        // Chrome/Edge - we can check memory
        availableMemory = performance.memory.jsHeapSizeLimit;
        const usedMemory = performance.memory.usedJSHeapSize;
        const freeMemory = availableMemory - usedMemory;
        const freeMB = (freeMemory / 1024 / 1024).toFixed(0);
        const requiredMB = isMobile ? 300 : 700; // Minimum required memory
        
        console.log(`💾 [InferenceWorker] Memory check:`);
        console.log(`   Free: ${freeMB} MB`);
        console.log(`   Required: ${requiredMB} MB`);
        
        if (freeMemory < requiredMB * 1024 * 1024) {
          shouldAttemptLoad = false;
          throw new Error(`Insufficient memory: Only ${freeMB} MB available, need at least ${requiredMB} MB. Please close other tabs/apps and try again, or use a device with more RAM.`);
        }
      } else {
        // Safari - can't check memory, but can check device memory hints
        console.warn('⚠️ [InferenceWorker] Cannot check available memory (Safari limitation)');
        
        if (isMobile && navigator.deviceMemory !== undefined && navigator.deviceMemory < 4) {
          // Device has less than 4GB RAM - likely to fail
          console.error(`⚠️ [InferenceWorker] Device has ${navigator.deviceMemory} GB RAM - may be insufficient`);
          shouldAttemptLoad = false;
          throw new Error(`This device has only ${navigator.deviceMemory} GB RAM. Video analysis requires at least 4GB RAM. Please try on a more powerful device.`);
        }
        
        console.log('⚠️ [InferenceWorker] Proceeding without memory check - may fail on low-memory devices');
      }
      
      const startTime = performance.now();
      
      // Universal optimized settings for all devices
      // Leave 2 threads for browser UI and other tasks
      const hardwareCores = navigator.hardwareConcurrency || 4;
      const maxThreads = Math.max(1, Math.min(4, hardwareCores - 2)); // Reserve 2 cores for UI
      const threadCount = maxThreads;
      
      console.log(`🧵 [InferenceWorker] Using ${threadCount} threads (hardware: ${navigator.hardwareConcurrency || 4}, reserved: 2)`);
      console.log('📥 [InferenceWorker] Starting model download and WASM initialization...');
      console.log('   Model: superpoint_lightglue_pipeline.ort.onnx');
      console.log('   This may take 1-2 minutes on first load (model needs to download)');
      
      // Detect iOS version for SIMD compatibility
      const isIOS15OrBelow = (() => {
        const ua = navigator.userAgent;
        const match = ua.match(/OS (\d+)_/);
        if (match) {
          const version = parseInt(match[1], 10);
          return version <= 15;
        }
        return false;
      })();
      
      const useSIMD = !isIOS15OrBelow;
      if (isIOS15OrBelow) {
        console.log('⚠️ [InferenceWorker] iOS 15 or below detected - disabling SIMD');
      }
      
      // Universal optimized ONNX session config
      const sessionConfig = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'basic', // Basic optimization for all devices - saves memory
        enableMemPattern: false,  // DISABLE to reduce memory usage
        enableCpuMemArena: false, // DISABLE to reduce memory usage
        wasm: {
          numThreads: threadCount,
          simd: useSIMD,
          threads: threadCount > 1,
        },
      };
      
      console.log(`⚙️ [InferenceWorker] Session config:`, {
        threads: threadCount,
        optimization: sessionConfig.graphOptimizationLevel,
        memPattern: sessionConfig.enableMemPattern,
        cpuArena: sessionConfig.enableCpuMemArena
      });
      
      // Use absolute path from root (worker is bundled in /assets/)
      // Note: FP16 quantization not supported by ONNX Runtime Web (WASM limitation)
      const modelPath = '/superpoint_lightglue_pipeline.ort.onnx';
      console.log(`📂 [InferenceWorker] Loading model from: ${modelPath}`);
      
      const session = await ort.InferenceSession.create(
        modelPath,
        sessionConfig
      );
      const endTime = performance.now();
      console.log(`✅ [InferenceWorker] Session created successfully in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      self.session = session; // Store the session in the worker

      self.postMessage({
        type: 'sessionCreated',
        data: {
          sessionTime: endTime - startTime,
        },
      });
    } catch (error) {
      console.error('❌ [InferenceWorker] Session creation failed:', error);
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
        console.error('💡 [InferenceWorker] Out of memory - Recovery steps:');
        console.error('   1. Close ALL other browser tabs (each tab uses memory)');
        console.error('   2. Close background apps (check task switcher)');
        console.error('   3. Restart Safari/Browser completely');
        console.error('   4. If still failing: Device has insufficient RAM for this feature');
        console.error('   Note: This device may not support video analysis due to memory constraints');
      }
      
      self.postMessage({
        type: 'error',
        data: { message: errorMessage },
      });
    }
  }

  if (type === 'runInference') {
    if (!self.session) {
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
      const tensors = images.map((image, index) =>
        preprocessImage(image, imgWidth, imgHeight, index)
      );
      const combinedInput = new Float32Array([...tensors[0], ...tensors[1]]);
      const tensor = new ort.Tensor('float32', combinedInput, [2, 1, imgHeight, imgWidth]);
      const feeds = { images: tensor };

      const startTime = performance.now();
      const results = await self.session.run(feeds);
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
      self.postMessage({
        type: 'error',
        data: { message: error.message },
      });
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
};

function preprocessImage(image, width, height, index) {
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

async function loadImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  return bitmap;
}
