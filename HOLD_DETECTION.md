# Hold Detection Implementation

## Overview
Created a new "hold-detection" route that demonstrates AI-powered climbing hold identification. This is set up as a foundation for integrating an ONNX-based hold detection model.

## What's Implemented

### 1. New Route
- **URL**: `/hold-detection`
- **Component**: `HoldDetectionView.vue`
- **Navigation**: Added to header with mobile support

### 2. Hold Detection Store (`src/stores/holdDetectionStore.js`)
- Pinia store managing hold detection state
- Mock detection results for development
- Extensible structure for real ONNX model integration

### 3. UI Components
- **Image display** with overlay visualization
- **Hold bounding boxes** with click interaction
- **Statistics panel** showing hold counts by type
- **Selected hold details** panel
- **Hold list** with confidence scores
- **Loading states** and error handling

### 4. Mock Data Structure
Currently generates realistic mock data:
```javascript
{
  holds: [
    { x: 150, y: 200, width: 40, height: 40, confidence: 0.95, type: "jug" },
    // ... more holds
  ],
  imageWidth: 600,
  imageHeight: 800,
  processingTime: 1850,
}
```

## Image Used
- **File**: `WhatsApp Image 2025-05-24 at 00.15.17.jpeg`
- **Path**: `/public/topos/wibrem-23-may/`
- Hardcoded for initial implementation

## Features

### Interactive Visualization
- Hover over holds to see confidence scores
- Click holds to select and view details
- Color-coded bounding boxes (red/blue for selected)

### Statistics
- Hold count by type (jug, crimp, sloper, etc.)
- Total hold count
- Processing time display
- Confidence-based sorting

### Responsive Design
- Mobile-friendly layout
- Collapsible navigation
- Proper scaling for different screen sizes

## Next Steps for ONNX Integration

### 1. Convert YOLOv8 Model to ONNX
```bash
# Using the model from your ChatGPT conversation
# Convert the climbing holds detection model to ONNX format
```

### 2. Add Model File
- Place ONNX model in `/public/` directory
- Update `vite.config.js` to handle `.onnx` files (already configured)

### 3. Create Hold Detection Worker
Similar to existing `inferenceWorker.js`:
```javascript
// src/workers/holdDetectionWorker.js
self.onmessage = async (event) => {
  const { type, imageBuffer } = event.data;
  
  if (type === "createSession") {
    const session = await ort.InferenceSession.create("path/to/holds-model.onnx");
    // ... session setup
  }
  
  if (type === "runDetection") {
    // Process image and run inference
    // Return bounding boxes, confidence scores, and hold types
  }
};
```

### 4. Update Store Implementation
Replace mock data in `holdDetectionStore.js`:
```javascript
const runHoldDetection = async (imageFile) => {
  // Use real worker instead of mock data
  const arrayBuffer = await imageFile.arrayBuffer();
  holdDetectionWorker.postMessage({
    type: "runDetection",
    imageBuffer: arrayBuffer
  });
};
```

### 5. Image Upload Feature
Currently disabled - can be enabled by:
- Adding file input handling
- Image preprocessing for model requirements
- Dynamic image URL management

## Technical Notes

### Model Requirements
- **Input format**: Likely RGB image tensor
- **Output format**: Bounding boxes + class probabilities
- **Classes**: Hold types (jug, crimp, sloper, pinch, pocket, etc.)

### Performance Considerations
- Use Web Workers for inference (already structured)
- Implement proper memory management
- Add progress indicators for long-running detections

### Integration with Existing Codebase
- Uses same ONNX runtime setup as current inference system
- Follows same store patterns as `inferenceStore.js`
- Reuses UI components and styling from existing views

## Testing the Implementation

1. Navigate to `/hold-detection` route
2. Click "Detect Holds" button
3. Observe mock detection results
4. Interact with detected holds
5. Check statistics and hold details

The foundation is ready for integrating the actual ONNX model once it's converted and available!
