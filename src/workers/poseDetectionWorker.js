// Pose Detection Worker - YOLOv8 Implementation
// Based on FatemeZamanian/YOLOv8-pose-onnxruntime-web

console.log('YOLOv8 Pose detection worker initializing...');

// Mobile memory management
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowMemoryDevice = navigator.deviceMemory && navigator.deviceMemory <= 4;

console.log('Device info:', { 
  isMobile, 
  isLowMemoryDevice,
  deviceMemory: navigator.deviceMemory || 'unknown',
  hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
});

// The ort object is available from the concatenated ONNX code
if (typeof ort !== 'undefined' && ort.env) {
  // Conservative settings for mobile devices
  if (isMobile || isLowMemoryDevice) {
    ort.env.wasm.numThreads = 1; // Single thread on mobile
    ort.env.wasm.simd = false; // Disable SIMD on mobile to save memory
    console.log('Mobile optimizations applied: single thread, SIMD disabled');
  } else {
    ort.env.wasm.numThreads = 4;
    console.log('Desktop optimizations applied: multi-thread enabled');
  }
  console.log('ONNX Runtime configured successfully');
} else {
  console.error('ONNX Runtime not available in worker');
}

// Worker state
let yolov8Session = null;
let nmsSession = null;

// Memory cleanup utilities
const cleanupTensors = (tensors) => {
  if (tensors && typeof tensors === 'object') {
    Object.values(tensors).forEach(tensor => {
      if (tensor && typeof tensor.dispose === 'function') {
        tensor.dispose();
      }
    });
  }
};

const forceGarbageCollection = () => {
  // Force garbage collection if available
  if (typeof self !== 'undefined' && self.gc) {
    self.gc();
  }
};

// YOLOv8n-pose configuration
const MODEL_PATH = '/yolov8n-pose.onnx';
const NMS_PATH = '/modified-nms-yolov8-pose.onnx';
const INPUT_SIZE = 640;
const MODEL_INPUT_SHAPE = [1, 3, 640, 640];

// Detection configuration
const topk = 50;
const iouThreshold = 0.45;
const scoreThreshold = 0.25;

// Message handler
self.onmessage = async (event) => {
  const { type, imageBuffer, imageInfo } = event.data;

  if (type === 'createSession') {
    console.log('Creating YOLOv8 pose detection sessions...');
    console.log('ONNX Runtime environment:', {
      ortAvailable: typeof ort !== 'undefined',
      ortEnv: typeof ort !== 'undefined' ? ort.env : 'N/A',
      wasmBackends: typeof ort !== 'undefined' ? ort.env.wasm : 'N/A'
    });
    
    try {
      const startTime = performance.now();

      // Memory-aware session options
      const sessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: isMobile || isLowMemoryDevice ? 'basic' : 'all',
        wasm: {
          numThreads: isMobile || isLowMemoryDevice ? 1 : Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2)),
          simd: !(isMobile || isLowMemoryDevice), // Disable SIMD on mobile
          threads: !(isMobile || isLowMemoryDevice), // Disable threading on mobile
        },
      };

      console.log('Creating sessions with options:', sessionOptions);

      // Create main YOLOv8 session
      yolov8Session = await ort.InferenceSession.create(MODEL_PATH, sessionOptions);

      // Create NMS session  
      nmsSession = await ort.InferenceSession.create(NMS_PATH, sessionOptions);

      // Skip warmup on mobile to save memory
      if (!isMobile && !isLowMemoryDevice) {
        console.log('Warming up model...');
        const tensor = new ort.Tensor(
          'float32',
          new Float32Array(MODEL_INPUT_SHAPE.reduce((a, b) => a * b)),
          MODEL_INPUT_SHAPE
        );
        const warmupResult = await yolov8Session.run({ images: tensor });
        cleanupTensors(warmupResult);
        tensor.dispose();
        console.log('Model warmup complete');
      } else {
        console.log('Skipping warmup on mobile device');
      }

      const endTime = performance.now();

      self.postMessage({
        type: 'sessionCreated',
        data: {
          sessionTime: endTime - startTime,
        },
      });

      console.log('YOLOv8 pose detection sessions created successfully');
    } catch (error) {
      console.error('Failed to create pose detection sessions:', error);
      self.postMessage({
        type: 'error',
        data: { message: 'Failed to load pose detection models: ' + error.message },
      });
    }
  }

  if (type === 'runPoseDetection') {
    if (!yolov8Session || !nmsSession) {
      self.postMessage({
        type: 'error',
        data: { message: 'Pose detection sessions are not initialized.' },
      });
      return;
    }

    let imageBitmap = null;
    let imageBlob = null;

    try {
      if (!imageBuffer || !imageInfo) {
        self.postMessage({
          type: 'error',
          data: { message: 'Image buffer and info must be provided.' },
        });
        return;
      }

      // Create bitmap from buffer
      imageBlob = new Blob([imageBuffer]);
      imageBitmap = await createImageBitmap(imageBlob);

      const startTime = performance.now();

      // Preprocess image using our custom preprocessing
      const { tensor, xRatio, yRatio, xOffset, yOffset } = preprocessImageYOLOv8(imageBitmap);

      // Run main YOLOv8 inference
      const { output0 } = await yolov8Session.run({ images: tensor });

      // Clean up input tensor immediately
      tensor.dispose();

      // Create NMS config tensor
      const config = new ort.Tensor(
        'float32',
        new Float32Array([
          topk, // topk per class
          iouThreshold, // iou threshold
          scoreThreshold, // score threshold
        ])
      );

      // Run NMS post-processing
      const { selected } = await nmsSession.run({
        detection: output0,
        config: config,
      });

      // Clean up intermediate tensors
      output0.dispose();
      config.dispose();

      // Process results into our format
      const poses = processYOLOv8Results(
        selected,
        xRatio,
        yRatio,
        xOffset,
        yOffset,
        imageBitmap.width,
        imageBitmap.height
      );

      // Clean up NMS output
      selected.dispose();

      // Force memory cleanup on mobile
      if (isMobile || isLowMemoryDevice) {
        forceGarbageCollection();
      }

      const endTime = performance.now();
      
      console.log(`Pose detection completed:`, {
        poses: poses.length,
        inferenceTime: `${(endTime - startTime).toFixed(2)}ms`,
        imageSize: `${imageBitmap.width}x${imageBitmap.height}`
      });

      self.postMessage({
        type: 'poseDetectionComplete',
        data: {
          inferenceTime: endTime - startTime,
          results: { poses },
          imageInfo: {
            ...imageInfo,
            originalWidth: imageBitmap.width,
            originalHeight: imageBitmap.height,
            xRatio,
            yRatio,
          },
        },
      });
    } catch (error) {
      console.error('Pose detection inference error:', error);
      
      // Provide more specific error messages for common mobile issues
      let errorMessage = 'Pose detection failed: ' + error.message;
      
      if (error.message.includes('out of memory') || error.message.includes('OOM')) {
        errorMessage = 'Not enough memory available - try closing other apps or using a smaller video';
      } else if (error.message.includes('session') || error.message.includes('model')) {
        errorMessage = 'Detection model error - try refreshing the page';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Detection timed out - your device may be overloaded';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Failed to load detection model - check your internet connection';
      }
      
      self.postMessage({
        type: 'error',
        data: { message: errorMessage, originalError: error.message },
      });
    } finally {
      // Clean up resources
      if (imageBitmap && typeof imageBitmap.close === 'function') {
        imageBitmap.close();
      }
      imageBitmap = null;
      imageBlob = null;
    }
  }

  // Handle cleanup message
  if (type === 'cleanup') {
    console.log('Cleaning up pose detection worker...');
    try {
      // Dispose of sessions
      if (yolov8Session) {
        yolov8Session.close && yolov8Session.close();
        yolov8Session = null;
      }
      if (nmsSession) {
        nmsSession.close && nmsSession.close();
        nmsSession = null;
      }
      
      // Force cleanup
      forceGarbageCollection();
      
      console.log('Pose detection worker cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
};

/**
 * Preprocess image for YOLOv8 using canvas-based approach
 * Following the exact FatemeZamanian approach for coordinate consistency
 */
function preprocessImageYOLOv8(imageBitmap) {
  console.log('YOLOv8 preprocessing:', {
    width: imageBitmap.width,
    height: imageBitmap.height,
  });

  // Calculate padding to square (matching OpenCV approach exactly)
  const maxSize = Math.max(imageBitmap.width, imageBitmap.height);
  const xPad = maxSize - imageBitmap.width;
  const yPad = maxSize - imageBitmap.height;

  // These ratios will be used to convert model output back to original coordinates
  const xRatio = maxSize / imageBitmap.width;
  const yRatio = maxSize / imageBitmap.height;

  console.log('Padding:', { maxSize, xPad, yPad, xRatio, yRatio });

  // Create padded canvas (make it square)
  const paddedCanvas = new OffscreenCanvas(maxSize, maxSize);
  const paddedCtx = paddedCanvas.getContext('2d');

  // Fill with black (like OpenCV BORDER_CONSTANT)
  paddedCtx.fillStyle = 'black';
  paddedCtx.fillRect(0, 0, maxSize, maxSize);

  // Draw image with proper padding
  // For vertical image (height > width): pad on sides
  // For horizontal image (width > height): pad on top/bottom
  let xOffset = 0,
    yOffset = 0;
  if (imageBitmap.height > imageBitmap.width) {
    // Tall image - pad horizontally (center horizontally)
    xOffset = xPad / 2;
    paddedCtx.drawImage(imageBitmap, xOffset, 0, imageBitmap.width, imageBitmap.height);
  } else {
    // Wide image - pad vertically (center vertically)
    yOffset = yPad / 2;
    paddedCtx.drawImage(imageBitmap, 0, yOffset, imageBitmap.width, imageBitmap.height);
  }

  // Resize to model input size
  const modelCanvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
  const modelCtx = modelCanvas.getContext('2d');
  modelCtx.drawImage(paddedCanvas, 0, 0, INPUT_SIZE, INPUT_SIZE);

  const imageData = modelCtx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const data = imageData.data;

  // Convert to tensor format (RGB, CHW, normalized)
  const float32Array = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);

  for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
    const pixelIndex = i * 4;

    // RGB format, normalized to [0, 1], CHW layout
    float32Array[i] = data[pixelIndex] / 255.0; // R channel
    float32Array[i + INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 1] / 255.0; // G channel
    float32Array[i + 2 * INPUT_SIZE * INPUT_SIZE] = data[pixelIndex + 2] / 255.0; // B channel
  }

  console.log('Tensor created:', {
    shape: MODEL_INPUT_SHAPE,
    size: float32Array.length,
    sampleValues: [float32Array[0], float32Array[1], float32Array[2]],
  });

  const tensor = new ort.Tensor('float32', float32Array, MODEL_INPUT_SHAPE);

  return { tensor, xRatio, yRatio, xOffset, yOffset };
}

/**
 * Process YOLOv8 results (after NMS) into pose data
 */
function processYOLOv8Results(
  selected,
  xRatio,
  yRatio,
  xOffset,
  yOffset,
  originalWidth,
  originalHeight
) {
  console.log('Processing YOLOv8 results:', {
    selectedDims: selected.dims,
    xRatio,
    yRatio,
    xOffset,
    yOffset,
    originalSize: `${originalWidth}x${originalHeight}`,
  });

  const poses = [];

  // Loop through selected detections
  for (let idx = 0; idx < selected.dims[1]; idx++) {
    const data = selected.data.slice(idx * selected.dims[2], (idx + 1) * selected.dims[2]);

    const box = data.slice(0, 4);
    const score = data.slice(4, 5)[0];
    const landmarks = data.slice(5); // 17 keypoints * 3 values each = 51 values

    // Calculate padding offsets and scaling
    const maxSize = Math.max(originalWidth, originalHeight);
    const modelToOriginalScale = maxSize / INPUT_SIZE;

    console.log('Coordinate transformation debug:', {
      originalSize: `${originalWidth}x${originalHeight}`,
      maxSize,
      modelToOriginalScale,
      xOffset,
      yOffset,
    });

    const [x, y, w, h] = [
      box[0] * modelToOriginalScale - xOffset, // left (subtract x offset)
      box[1] * modelToOriginalScale - yOffset, // top (subtract y offset)
      box[2] * modelToOriginalScale, // width
      box[3] * modelToOriginalScale, // height
    ];

    // Process keypoints (17 keypoints, 3 values each: x, y, confidence)
    const keypoints = [];
    for (let k = 0; k < 17; k++) {
      // Model outputs keypoints in 640x640 space
      const modelKpX = landmarks[k * 3];
      const modelKpY = landmarks[k * 3 + 1];
      const kpConf = landmarks[k * 3 + 2];

      // Convert from model space (640x640) to padded space, then to original image space
      let kpX = modelKpX * modelToOriginalScale - xOffset;
      let kpY = modelKpY * modelToOriginalScale - yOffset;

      if (k < 3) {
        // Log first 3 keypoints for debugging
        console.log(`Keypoint ${k} transformation:`, {
          modelCoords: { x: modelKpX, y: modelKpY },
          afterScale: { x: modelKpX * modelToOriginalScale, y: modelKpY * modelToOriginalScale },
          afterOffset: { x: kpX, y: kpY },
          confidence: kpConf,
        });
      }

      keypoints.push({
        x: Math.max(0, Math.min(originalWidth, kpX)),
        y: Math.max(0, Math.min(originalHeight, kpY)),
        confidence: kpConf,
      });
    }

    poses.push({
      bbox: {
        x: Math.max(0, x - w / 2),
        y: Math.max(0, y - h / 2),
        width: Math.min(originalWidth, w),
        height: Math.min(originalHeight, h),
      },
      confidence: score,
      keypoints,
    });
  }

  console.log(`Processed ${poses.length} poses`);
  
  if (poses.length === 0) {
    console.warn('No poses detected in this frame - this is normal if no person is visible');
  }
  
  return poses;
}

console.log('YOLOv8 pose detection worker ready');
