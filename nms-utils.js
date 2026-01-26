/**
 * Non-Maximum Suppression (NMS) for YOLO pose detection
 * Pure JavaScript implementation - no ONNX/WASM needed
 */

/**
 * Calculate Intersection over Union (IoU) between two bounding boxes
 */
function calculateIoU(box1, box2) {
  const x1 = Math.max(box1.x1, box2.x1);
  const y1 = Math.max(box1.y1, box2.y1);
  const x2 = Math.min(box1.x2, box2.x2);
  const y2 = Math.min(box1.y2, box2.y2);

  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  
  const box1Area = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
  const box2Area = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);
  
  const unionArea = box1Area + box2Area - intersectionArea;
  
  return intersectionArea / unionArea;
}

/**
 * Parse YOLO output tensor into detections
 * YOLO output format: [batch, 56, num_anchors]
 * Each detection: [x, y, w, h, confidence, ...51 keypoint values (17 * 3)]
 */
export function parseYoloOutput(yoloOutput, scoreThreshold = 0.25) {
  const data = yoloOutput.cpuData || yoloOutput.data;
  const shape = yoloOutput.dims; // [1, 56, num_anchors]
  
  const numAnchors = shape[2];
  const detections = [];
  
  console.log(`   Parsing YOLO output: ${numAnchors} anchors`);
  
  for (let i = 0; i < numAnchors; i++) {
    // Each anchor has 56 values: [x, y, w, h, conf, 17*3 keypoints]
    const offset = i * 56;
    
    const x = data[offset];
    const y = data[offset + 1];
    const w = data[offset + 2];
    const h = data[offset + 3];
    const confidence = data[offset + 4];
    
    // Filter by confidence threshold
    if (confidence < scoreThreshold) continue;
    
    // Convert center format (x, y, w, h) to corner format (x1, y1, x2, y2)
    const box = {
      x1: x - w / 2,
      y1: y - h / 2,
      x2: x + w / 2,
      y2: y + h / 2
    };
    
    // Extract keypoints (17 keypoints * 3 values each: x, y, confidence)
    const keypoints = [];
    for (let j = 0; j < 17; j++) {
      const kptOffset = offset + 5 + (j * 3);
      keypoints.push({
        x: data[kptOffset],
        y: data[kptOffset + 1],
        confidence: data[kptOffset + 2]
      });
    }
    
    detections.push({
      box,
      keypoints,
      confidence
    });
  }
  
  console.log(`   Found ${detections.length} detections above threshold ${scoreThreshold}`);
  return detections;
}

/**
 * Apply Non-Maximum Suppression to remove overlapping detections
 */
export function applyNMS(detections, iouThreshold = 0.45, maxDetections = 50) {
  if (detections.length === 0) return [];
  
  console.log(`   Applying NMS with IoU threshold ${iouThreshold}...`);
  
  // Sort by confidence (highest first)
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  
  const selected = [];
  const suppressed = new Set();
  
  for (let i = 0; i < sorted.length && selected.length < maxDetections; i++) {
    if (suppressed.has(i)) continue;
    
    const currentBox = sorted[i];
    selected.push(currentBox);
    
    // Suppress overlapping boxes
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) continue;
      
      const iou = calculateIoU(currentBox.box, sorted[j].box);
      if (iou > iouThreshold) {
        suppressed.add(j);
      }
    }
  }
  
  console.log(`   NMS selected ${selected.length} detections (suppressed ${suppressed.size})`);
  return selected;
}

/**
 * Apply letterbox offset correction to detections
 */
export function correctLetterbox(detections, scale, xOffset, yOffset) {
  return detections.map(det => ({
    ...det,
    box: {
      x1: (det.box.x1 - xOffset) / scale,
      y1: (det.box.y1 - yOffset) / scale,
      x2: (det.box.x2 - xOffset) / scale,
      y2: (det.box.y2 - yOffset) / scale
    },
    keypoints: det.keypoints.map(kp => ({
      x: (kp.x - xOffset) / scale,
      y: (kp.y - yOffset) / scale,
      confidence: kp.confidence
    }))
  }));
}

/**
 * Complete NMS pipeline: parse YOLO output → apply NMS → correct letterbox
 */
export function processYoloDetections(
  yoloOutput,
  scale,
  xOffset,
  yOffset,
  options = {}
) {
  const {
    scoreThreshold = 0.25,
    iouThreshold = 0.45,
    maxDetections = 50
  } = options;
  
  // Parse YOLO output
  const detections = parseYoloOutput(yoloOutput, scoreThreshold);
  
  // Apply NMS
  const selected = applyNMS(detections, iouThreshold, maxDetections);
  
  // Correct letterbox offset
  const corrected = correctLetterbox(selected, scale, xOffset, yOffset);
  
  return corrected;
}
