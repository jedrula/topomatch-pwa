/**
 * SAM (Segment Anything Model) Worker for precise hold segmentation
 * Uses YOLO detection centers as prompt points for SAM segmentation
 * Based on proven SAM web implementation pattern
 */

import {
  env,
  SamModel,
  AutoProcessor,
  RawImage,
  Tensor,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// We adopt the singleton pattern to enable lazy-loading of the model and processor.
export class SegmentAnythingSingleton {
  static model_id = 'Xenova/slimsam-77-uniform'; // Use the optimized SlimSAM model
  static model;
  static processor;
  static quantized = true;

  static getInstance() {
    if (!this.model) {
      this.model = SamModel.from_pretrained(this.model_id, {
        quantized: this.quantized,
      });
    }
    if (!this.processor) {
      this.processor = AutoProcessor.from_pretrained(this.model_id);
    }

    return Promise.all([this.model, this.processor]);
  }
}

// State variables
let image_embeddings = null;
let image_inputs = null;
let ready = false;
let currentImageData = null;

/**
 * Generate segmentation masks for holds using SAM
 * @param {Array} holdCenters - Array of {x, y} center points from YOLO detection
 * @returns {Array} Array of segmentation masks
 */
const generateHoldMasks = async (holdCenters) => {
  if (!image_embeddings || !image_inputs) {
    throw new Error("Image not processed. Call 'segment' first to process the image.");
  }

  const [model, processor] = await SegmentAnythingSingleton.getInstance();
  const masks = [];

  console.log(`Generating masks for ${holdCenters.length} holds...`);

  // Process each hold center point
  for (let i = 0; i < holdCenters.length; i++) {
    const { x, y, originalHold } = holdCenters[i];
    console.log(`Processing hold ${i + 1}/${holdCenters.length} at (${x}, ${y})`);

    try {
      // Prepare inputs for decoding
      const reshaped = image_inputs.reshaped_input_sizes[0];
      const points = [[x * reshaped[1], y * reshaped[0]]]; // Scale to reshaped size
      const labels = [1]; // Positive point

      const input_points = new Tensor('float32', points.flat(Infinity), [1, 1, points.length, 2]);
      const input_labels = new Tensor('int64', labels.map((l) => BigInt(l)).flat(Infinity), [
        1,
        1,
        labels.length,
      ]);

      // Generate the mask
      const outputs = await model({
        ...image_embeddings,
        input_points,
        input_labels,
      });

      // Post-process the mask
      const processedMasks = await processor.post_process_masks(
        outputs.pred_masks,
        image_inputs.original_sizes,
        image_inputs.reshaped_input_sizes
      );

      // Get the best mask (first one is usually the best)
      const maskTensor = processedMasks[0][0];
      const maskImage = RawImage.fromTensor(maskTensor);
      const scores = outputs.iou_scores.data;

      // Convert mask to pixel coordinates
      const maskData = new Uint8Array(maskTensor.data);
      const maskPixels = [];
      const [height, width] = [maskTensor.dims[0], maskTensor.dims[1]];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          if (maskData[index] > 0) {
            maskPixels.push({ x, y });
          }
        }
      }

      // Calculate bounding box from mask
      let minX = width,
        minY = height,
        maxX = 0,
        maxY = 0;
      for (const pixel of maskPixels) {
        minX = Math.min(minX, pixel.x);
        minY = Math.min(minY, pixel.y);
        maxX = Math.max(maxX, pixel.x);
        maxY = Math.max(maxY, pixel.y);
      }

      masks.push({
        ...originalHold, // Preserve original YOLO detection data
        // Override with segmentation data
        segmentationMask: {
          pixels: maskPixels,
          width: width,
          height: height,
          data: maskData,
          image: maskImage, // Include the mask image for potential visualization
        },
        // Update bounding box to match segmentation
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        centerPoint: { x, y },
        iouScore: Math.max(...scores),
        segmented: true,
      });

      console.log(
        `Hold ${i + 1} segmented: ${maskPixels.length} pixels, IoU: ${Math.max(...scores).toFixed(
          3
        )}`
      );
    } catch (error) {
      console.error(`Failed to segment hold ${i + 1}:`, error);
      // Fallback: keep original YOLO detection
      masks.push({
        ...originalHold,
        segmented: false,
        error: error.message,
      });
    }
  }

  return masks;
};

// Worker message handler
self.onmessage = async (e) => {
  try {
    const [model, processor] = await SegmentAnythingSingleton.getInstance();

    if (!ready) {
      // Indicate that we are ready to accept requests
      ready = true;
      self.postMessage({
        type: 'samSessionCreated',
        data: { sessionTime: 0 }, // We'll measure actual session time elsewhere
      });
    }

    const { type, data } = e.data;

    switch (type) {
      case 'initializeSAM':
        // Already handled above
        break;

      case 'reset':
        image_inputs = null;
        image_embeddings = null;
        currentImageData = null;
        break;

      case 'segment': {
        // Process image and compute embeddings (stage 1)
        console.log('Processing image for SAM embeddings...');

        self.postMessage({
          type: 'segment_result',
          data: 'start',
        });

        // Read the image and recompute image embeddings
        const image = await RawImage.read(data.imageDataURI || data.imageBuffer);
        image_inputs = await processor(image);
        image_embeddings = await model.get_image_embeddings(image_inputs);
        currentImageData = data;

        self.postMessage({
          type: 'segment_result',
          data: 'done',
        });
        break;
      }

      case 'generateMasks': {
        // Generate masks for holds (stage 2)
        const { imageBuffer, holdCenters } = data;

        // If we don't have embeddings for this image, compute them first
        if (!image_embeddings || !currentImageData) {
          console.log('No image embeddings found, processing image first...');
          const imageBlob = new Blob([imageBuffer]);
          const imageDataURI = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(imageBlob);
          });

          // Process image first
          const image = await RawImage.read(imageDataURI);
          image_inputs = await processor(image);
          image_embeddings = await model.get_image_embeddings(image_inputs);
          currentImageData = { imageBuffer, imageDataURI };
        }

        const startTime = performance.now();
        const masks = await generateHoldMasks(holdCenters);
        const endTime = performance.now();

        self.postMessage({
          type: 'masksGenerated',
          data: {
            masks,
            processingTime: endTime - startTime,
            totalHolds: holdCenters.length,
            successfulSegmentations: masks.filter((m) => m.segmented).length,
          },
        });
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('SAM worker error:', error);
    self.postMessage({
      type: 'error',
      data: { message: error.message },
    });
  }
};
