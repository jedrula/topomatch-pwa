/**
 * Segmentation Pipeline for Climbing Hold Analysis
 * 
 * This module provides segmentation and color analysis capabilities
 * to enhance hold detection results with exact shapes and colors.
 * 
 * Pipeline Step 2: Segmentation & Color Analysis
 * Input: Bounding boxes from object detection
 * Output: Enhanced detections with masks, shapes, and colors
 */

class SegmentationPipeline {
  constructor() {
    this.segmentationSession = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the segmentation model
   * @param {string} modelPath - Path to the segmentation ONNX model
   * @param {Object} options - Model configuration options
   */
  async initialize(modelPath = null, options = {}) {
    try {
      // For now, we'll implement a fallback approach without a separate model
      // This can be easily replaced with an actual segmentation model later
      console.log("Initializing segmentation pipeline...");
      
      if (modelPath) {
        // TODO: Load actual segmentation model when available
        // this.segmentationSession = await ort.InferenceSession.create(modelPath, options);
        console.log("Segmentation model loading not yet implemented, using fallback approach");
      }
      
      this.isInitialized = true;
      return { success: true, method: "fallback" };
    } catch (error) {
      console.error("Segmentation pipeline initialization error:", error);
      throw error;
    }
  }

  /**
   * Process detected holds to extract shapes and colors
   * @param {Array} detections - Array of bounding box detections from YOLOv8
   * @param {ImageBitmap} imageBitmap - Original image
   * @returns {Array} Enhanced detections with shapes and colors
   */
  async processDetections(detections, imageBitmap) {
    if (!this.isInitialized) {
      throw new Error("Segmentation pipeline not initialized");
    }

    console.log(`Processing ${detections.length} detections for segmentation...`);
    const enhancedDetections = [];

    for (let i = 0; i < detections.length; i++) {
      const detection = detections[i];
      try {
        // Extract the region of interest (ROI) from the original image
        const roi = await this.extractROI(imageBitmap, detection);
        
        // Get segmentation mask (fallback approach for now)
        const mask = await this.getSegmentationMask(roi, detection);
        
        // Extract dominant color from the masked region
        const color = await this.extractDominantColor(roi, mask);
        
        // Create enhanced detection object
        const enhancedDetection = {
          ...detection,
          mask: mask,
          color: color,
          shape: this.analyzeShape(mask),
          id: `hold_${i}_${Date.now()}`
        };

        enhancedDetections.push(enhancedDetection);
      } catch (error) {
        console.error(`Error processing detection ${i}:`, error);
        // Fallback: return original detection without enhancement
        enhancedDetections.push({ ...detection, id: `hold_${i}_${Date.now()}` });
      }
    }

    return enhancedDetections;
  }

  /**
   * Extract Region of Interest (ROI) from the image based on bounding box
   * @param {ImageBitmap} imageBitmap - Original image
   * @param {Object} detection - Bounding box detection
   * @returns {ImageData} Cropped image data
   */
  async extractROI(imageBitmap, detection) {
    // Add padding around the bounding box for better segmentation
    const padding = 10;
    const x = Math.max(0, Math.floor(detection.x - padding));
    const y = Math.max(0, Math.floor(detection.y - padding));
    const width = Math.min(
      imageBitmap.width - x,
      Math.ceil(detection.width + 2 * padding)
    );
    const height = Math.min(
      imageBitmap.height - y,
      Math.ceil(detection.height + 2 * padding)
    );

    // Create canvas to extract ROI
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Draw the cropped region
    ctx.drawImage(
      imageBitmap,
      x, y, width, height,  // Source rectangle
      0, 0, width, height   // Destination rectangle
    );

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Get segmentation mask for the ROI
   * Currently uses a fallback approach, can be replaced with actual model
   * @param {ImageData} roi - Region of interest image data
   * @param {Object} detection - Original detection object
   * @returns {Uint8Array} Binary mask (1 = hold, 0 = background)
   */
  async getSegmentationMask(roi, detection) {
    // Fallback approach: Create an elliptical mask based on the bounding box
    // This can be replaced with actual segmentation model inference
    
    const width = roi.width;
    const height = roi.height;
    const mask = new Uint8Array(width * height);
    
    // Create elliptical mask (common shape for climbing holds)
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = (width * 0.8) / 2;  // 80% of width
    const radiusY = (height * 0.8) / 2; // 80% of height
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - centerX) / radiusX;
        const dy = (y - centerY) / radiusY;
        
        // Ellipse equation: (x/a)² + (y/b)² <= 1
        if (dx * dx + dy * dy <= 1) {
          mask[y * width + x] = 1;
        } else {
          mask[y * width + x] = 0;
        }
      }
    }
    
    return mask;
  }

  /**
   * Extract dominant color from the masked region
   * @param {ImageData} roi - Region of interest
   * @param {Uint8Array} mask - Binary mask
   * @returns {Object} Color information
   */
  async extractDominantColor(roi, mask) {
    const data = roi.data;
    const width = roi.width;
    const height = roi.height;
    
    // Collect all pixels within the mask
    const pixels = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const maskIndex = y * width + x;
        if (mask[maskIndex] === 1) {
          const pixelIndex = maskIndex * 4;
          pixels.push({
            r: data[pixelIndex],
            g: data[pixelIndex + 1],
            b: data[pixelIndex + 2]
          });
        }
      }
    }

    if (pixels.length === 0) {
      return { r: 128, g: 128, b: 128, hex: "#808080", name: "gray" };
    }

    // Calculate average color (can be improved with k-means clustering)
    const avgColor = pixels.reduce(
      (acc, pixel) => ({
        r: acc.r + pixel.r,
        g: acc.g + pixel.g,
        b: acc.b + pixel.b
      }),
      { r: 0, g: 0, b: 0 }
    );

    avgColor.r = Math.round(avgColor.r / pixels.length);
    avgColor.g = Math.round(avgColor.g / pixels.length);
    avgColor.b = Math.round(avgColor.b / pixels.length);

    // Convert to hex and get color name
    const hex = this.rgbToHex(avgColor.r, avgColor.g, avgColor.b);
    const name = this.getColorName(avgColor);

    return {
      ...avgColor,
      hex,
      name,
      pixelCount: pixels.length
    };
  }

  /**
   * Analyze shape characteristics from the mask
   * @param {Uint8Array} mask - Binary mask
   * @returns {Object} Shape analysis results
   */
  analyzeShape(mask) {
    // Calculate basic shape metrics
    const totalPixels = mask.reduce((sum, pixel) => sum + pixel, 0);
    
    // This is a placeholder for more sophisticated shape analysis
    // Can be extended with contour detection, shape classification, etc.
    return {
      area: totalPixels,
      type: "elliptical", // Placeholder
      confidence: 0.8     // Placeholder
    };
  }

  /**
   * Convert RGB to hex
   */
  rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  /**
   * Get color name from RGB values
   * @param {Object} rgb - RGB color object
   * @returns {string} Color name
   */
  getColorName(rgb) {
    // Simple color classification - can be improved with a proper color palette
    const { r, g, b } = rgb;
    
    // Calculate hue, saturation, and lightness for better color classification
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    
    if (max - min < 30) {
      // Low saturation colors
      if (lightness < 50) return "black";
      if (lightness > 200) return "white";
      return "gray";
    }
    
    // High saturation colors
    if (r > g && r > b) return "red";
    if (g > r && g > b) return "green";
    if (b > r && b > g) return "blue";
    if (r > b && g > b) return "yellow";
    if (r > g && b > g) return "purple";
    if (g > r && b > r) return "cyan";
    
    return "mixed";
  }

  /**
   * Group holds by color for boulder problem identification
   * @param {Array} enhancedDetections - Detections with color information
   * @param {number} colorTolerance - Color similarity threshold (0-100)
   * @returns {Array} Array of hold groups
   */
  groupHoldsByColor(enhancedDetections, colorTolerance = 30) {
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < enhancedDetections.length; i++) {
      if (processed.has(i)) continue;

      const currentHold = enhancedDetections[i];
      const group = {
        id: `group_${groups.length}`,
        color: currentHold.color,
        holds: [currentHold],
        problemType: "boulder" // Can be extended to route, etc.
      };

      // Find similar colored holds
      for (let j = i + 1; j < enhancedDetections.length; j++) {
        if (processed.has(j)) continue;

        const otherHold = enhancedDetections[j];
        const colorDistance = this.calculateColorDistance(
          currentHold.color,
          otherHold.color
        );

        if (colorDistance <= colorTolerance) {
          group.holds.push(otherHold);
          processed.add(j);
        }
      }

      groups.push(group);
      processed.add(i);
    }

    return groups;
  }

  /**
   * Calculate color distance between two colors
   * @param {Object} color1 - First color
   * @param {Object} color2 - Second color
   * @returns {number} Color distance (0-441, lower = more similar)
   */
  calculateColorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }
}

// Export for use in worker
if (typeof self !== 'undefined') {
  self.SegmentationPipeline = SegmentationPipeline;
}

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SegmentationPipeline;
}
