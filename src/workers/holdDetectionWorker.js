// ONNX Runtime Web is available globally via the bundled worker code
// Configure ONNX Runtime for Web Workers
// ort.env.wasm.wasmPaths = "/";
// ort.env.wasm.simd = true;
// ort.env.wasm.threads = true;

console.log("Hold detection worker initialized");

self.onmessage = async (event) => {
  const { type, imageBuffer } = event.data;
  console.log("Hold detection worker received message:", type);

  if (type === "createSession") {
    console.log("Creating hold detection session...");
    try {
      const startTime = performance.now();

      // Use WASM options to enable SIMD and threads if supported
      const session = await ort.InferenceSession.create(
        "../../yolov8n-freeclimbs-detect-2-fp32.onnx",
        {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
          wasm: {
            numThreads: navigator.hardwareConcurrency
              ? Math.max(1, Math.min(4, navigator.hardwareConcurrency))
              : 2,
            simd: true,
            threads: true,
          },
        }
      );
      const endTime = performance.now();

      self.session = session; // Store the session in the worker

      self.postMessage({
        type: "sessionCreated",
        data: {
          sessionTime: endTime - startTime,
        },
      });
    } catch (error) {
      console.error("Hold detection session creation error:", error);
      self.postMessage({
        type: "error",
        data: { message: error.message },
      });
    }
  }

  if (type === "runDetection") {
    if (!self.session) {
      self.postMessage({
        type: "error",
        data: { message: "Session is not initialized." },
      });
      return;
    }

    let imageBitmap = null;
    let imageBlob = null;

    try {
      if (!imageBuffer) {
        self.postMessage({
          type: "error",
          data: { message: "Image buffer must be provided." },
        });
        return;
      }

      // Create image from buffer
      imageBlob = new Blob([imageBuffer]);
      imageBitmap = await createImageBitmap(imageBlob);

      // YOLOv8 preprocessing - expects 2560x2560 input for optimal performance
      const modelInputSize = 2560;
      const preprocessedTensor = preprocessImageForYOLO(imageBitmap, modelInputSize);

      const startTime = performance.now();
      const results = await self.session.run({ images: preprocessedTensor });
      const endTime = performance.now();

      // Post-process YOLOv8 results
      const detections = postprocessYOLOResults(
        results,
        imageBitmap.width,
        imageBitmap.height,
        modelInputSize
      );

      self.postMessage({
        type: "detectionComplete",
        data: {
          detections,
          processingTime: endTime - startTime,
          imageWidth: imageBitmap.width,
          imageHeight: imageBitmap.height,
        },
      });
    } catch (error) {
      console.error("Hold detection error:", error);
      self.postMessage({
        type: "error",
        data: { message: error.message },
      });
    } finally {
      // Cleanup
      if (imageBitmap && typeof imageBitmap.close === "function") imageBitmap.close();
      imageBitmap = null;
      imageBlob = null;
    }
  }
};

function preprocessImageForYOLO(imageBitmap, targetSize) {
  // Create canvas for preprocessing
  const canvas = new OffscreenCanvas(targetSize, targetSize);
  const ctx = canvas.getContext("2d");

  // Fill with gray background (letterboxing)
  ctx.fillStyle = "rgb(114, 114, 114)"; // YOLOv8 default padding color
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Calculate scaling to maintain aspect ratio
  const scale = Math.min(targetSize / imageBitmap.width, targetSize / imageBitmap.height);
  const scaledWidth = imageBitmap.width * scale;
  const scaledHeight = imageBitmap.height * scale;

  // Center the image
  const offsetX = (targetSize - scaledWidth) / 2;
  const offsetY = (targetSize - scaledHeight) / 2;

  // Draw scaled image centered
  ctx.drawImage(imageBitmap, offsetX, offsetY, scaledWidth, scaledHeight);

  // Get image data and convert to tensor format
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imageData.data;

  // Convert to CHW format (3, height, width) and normalize to [0,1]
  const tensor = new Float32Array(3 * targetSize * targetSize);
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const pixelIndex = (y * targetSize + x) * 4;
      const tensorIndex = y * targetSize + x;

      // RGB channels normalized to [0,1]
      tensor[tensorIndex] = data[pixelIndex] / 255.0; // R
      tensor[targetSize * targetSize + tensorIndex] = data[pixelIndex + 1] / 255.0; // G
      tensor[2 * targetSize * targetSize + tensorIndex] = data[pixelIndex + 2] / 255.0; // B
    }
  }

  // Try to create the tensor with the original float32 data but let ONNX handle conversion
  return new ort.Tensor("float32", tensor, [1, 3, targetSize, targetSize]);
}

function postprocessYOLOResults(results, originalWidth, originalHeight, modelInputSize) {
  // YOLOv8 outputs: [batch, 84, num_boxes] where 84 = 4 bbox coords + 80 class scores
  // For this model: [1, 5, num_boxes] since it's single class (4 coords + 1 class score)
  const output = results.output0 || results.output || Object.values(results)[0];
  const outputData = output.data;
  const [batchSize, numFeatures, numBoxes] = output.dims;

  console.log("YOLO output shape:", output.dims);
  console.log("Features per box:", numFeatures);
  console.log("Original image dimensions:", originalWidth, "x", originalHeight);
  console.log("Model input size:", modelInputSize);

  const detections = [];
  const confidenceThreshold = 0.3; // Minimum confidence to consider a detection
  const nmsThreshold = 0.45; // Non-maximum suppression threshold

  // Calculate scale factors for coordinate conversion
  const scale = Math.min(modelInputSize / originalWidth, modelInputSize / originalHeight);
  const offsetX = (modelInputSize - originalWidth * scale) / 2;
  const offsetY = (modelInputSize - originalHeight * scale) / 2;

  console.log("Scale factor:", scale);
  console.log("Offsets:", offsetX, offsetY);

  // Parse detections
  const boxes = [];
  for (let i = 0; i < numBoxes; i++) {
    // Extract box coordinates and confidence
    const x_center = outputData[i]; // x center
    const y_center = outputData[numBoxes + i]; // y center
    const width = outputData[2 * numBoxes + i]; // width
    const height = outputData[3 * numBoxes + i]; // height
    const confidence = outputData[4 * numBoxes + i]; // confidence for climbing hold class

    if (confidence > confidenceThreshold) {
      // Convert from center format to corner format and scale back to original image
      const x_min = (x_center - width / 2 - offsetX) / scale;
      const y_min = (y_center - height / 2 - offsetY) / scale;
      const x_max = (x_center + width / 2 - offsetX) / scale;
      const y_max = (y_center + height / 2 - offsetY) / scale;

      console.log(
        `Detection ${i}: model coords (${x_center.toFixed(1)}, ${y_center.toFixed(
          1
        )}) -> original coords (${x_min.toFixed(1)}, ${y_min.toFixed(1)}, ${x_max.toFixed(
          1
        )}, ${y_max.toFixed(1)})`
      );

      // Clamp to image bounds
      const clampedBox = {
        x: Math.max(0, Math.min(x_min, originalWidth - 1)),
        y: Math.max(0, Math.min(y_min, originalHeight - 1)),
        width: Math.max(1, Math.min(x_max - x_min, originalWidth - x_min)),
        height: Math.max(1, Math.min(y_max - y_min, originalHeight - y_min)),
        confidence: confidence,
        type: "hold", // Single class model
      };

      boxes.push(clampedBox);
    }
  }

  // Apply Non-Maximum Suppression (simplified version)
  const nmsBoxes = applyNMS(boxes, nmsThreshold);

  console.log(`Found ${boxes.length} raw detections, ${nmsBoxes.length} after NMS`);
  return nmsBoxes;
}

function applyNMS(boxes, threshold) {
  // Sort boxes by confidence (descending)
  boxes.sort((a, b) => b.confidence - a.confidence);

  const keep = [];
  const suppressed = new Set();

  for (let i = 0; i < boxes.length; i++) {
    if (suppressed.has(i)) continue;

    keep.push(boxes[i]);

    // Suppress overlapping boxes
    for (let j = i + 1; j < boxes.length; j++) {
      if (suppressed.has(j)) continue;

      const iou = calculateIoU(boxes[i], boxes[j]);
      if (iou > threshold) {
        suppressed.add(j);
      }
    }
  }

  return keep;
}

function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersectionArea = (x2 - x1) * (y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;

  return intersectionArea / unionArea;
}
