# Hold Detection Firestore Storage

## Overview

Store hold detection results permanently in Firestore with their viewBox context to ensure perfect coordinate alignment and eliminate reliance on local caching.

## Firestore Schema

```
locations/{locationId}/
  └── holdDetections/{imageId}
      ├── imageId: string
      ├── detectionResults: {
      │   ├── aiHolds: array of AI-detected holds with SVG markup
      │   ├── manualHolds: array of manually-created holds with SVG markup
      │   └── metadata: {
      │       ├── viewBox: string (e.g. "0 0 1920 1080")
      │       ├── detectedAt: timestamp (when AI detection was performed)
      │       ├── lastManualUpdate: timestamp (when manual holds were last modified)
      │       ├── detectionSource: string ("ai-model", "manual-only", "mixed")
      │       ├── imageUrl: string
      │       ├── imageDimensions: { width: number, height: number }
      │       ├── modelVersion?: string (for AI detections)
      │       └── contributors: array of user IDs who added manual holds
      │   }
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

## Unified Hold Object Structure

```javascript
{
  id: string,                    // Unique hold identifier
  source: string,               // "ai-detected" | "manual-drawn" | "user-modified"
  svgMarkup: string,            // Complete SVG markup for this hold
  bbox: [x, y, width, height],  // Bounding box in viewBox coordinates
  confidence?: number,          // AI confidence (0-1) for AI-detected holds
  holdType?: string,            // "jug", "crimp", "pinch", etc.
  
  // AI-specific fields (only for AI-detected holds)
  detectionConfidence?: number,
  aiModel?: string,
  
  // Manual-specific fields (only for manual holds)
  tool?: string,               // "circle", "rectangle", "polygon", "freehand"
  createdBy?: string,          // User ID who created manual hold
  
  // Common metadata
  addedAt: timestamp,
  lastModified?: timestamp
}
```

## Benefits

1. **Persistent Storage**: Hold detection survives cache clears and browser changes
2. **ViewBox Context**: Perfect coordinate alignment guaranteed
3. **Single Source of Truth**: Firestore is authoritative, no cache conflicts
4. **Explicit Coordinates**: No default viewBox guessing
5. **Audit Trail**: Track when and how holds were detected
6. **Scalable**: Easy to add new detection methods or improve existing ones

## API Methods

- `saveHoldDetection(locationId, imageId, detectionData)` - Save unified detection results  
- `addManualHold(locationId, imageId, holdData, userId)` - Add a manual hold
- `updateAIDetection(locationId, imageId, aiHolds, metadata)` - Update AI detection
- `removeHold(locationId, imageId, holdId)` - Remove specific hold
- `getHoldDetection(locationId, imageId)` - Get complete detection data
- `getAllHolds(locationId, imageId)` - Get combined AI + manual holds
- `getViewBox(locationId, imageId)` - Get viewBox for image
- `runAIDetection(locationId, imageId, imageUrl, options)` - Trigger AI detection

## Usage Examples

### Save AI Detection Results with ViewBox
```javascript
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore'

const holdStore = useHoldDetectionPersistenceStore()

// Initialize for a location
holdStore.initializeForLocation('location_123')

// Save AI detection results
await holdStore.saveDetectionResults('image_456', {
  aiHolds: [
    {
      id: 'ai_hold_1',
      source: 'ai-detected',
      svgMarkup: '<circle cx="100" cy="200" r="15" fill="rgba(255,0,0,0.5)"/>',
      bbox: [85, 185, 30, 30],
      confidence: 0.92,
      holdType: 'jug',
      detectionConfidence: 0.92,
      aiModel: 'yolov8n-pose',
      addedAt: new Date()
    }
  ],
  manualHolds: [],
  viewBox: '0 0 1920 1080',
  imageUrl: 'https://example.com/climb.jpg',
  imageDimensions: { width: 1920, height: 1080 },
  modelVersion: 'yolov8n-pose-v2'
})
```

### Add Manual Hold to Existing Detection
```javascript
// Add a manually drawn hold
await holdStore.addManualHold('image_456', {
  svgMarkup: '<polygon points="150,300 180,290 185,320 155,325" fill="rgba(0,255,0,0.5)"/>',
  bbox: [150, 290, 35, 35],
  holdType: 'crimp',
  tool: 'polygon'
})
```

### Get Unified Holds (AI + Manual)
```javascript
// Get all holds for an image
const allHolds = holdStore.getHoldsForImage('image_456')

// Get only AI-detected holds
const aiHolds = holdStore.getAIHoldsForImage('image_456')

// Get only manual holds
const manualHolds = holdStore.getManualHoldsForImage('image_456')

// Get viewBox context
const viewBox = holdStore.getViewBoxForImage('image_456')
```

### Using in ImageWithHolds Component
```vue
<template>
  <ImageWithHolds :viewBox="imageViewBox">
    <template #image>
      <img :src="imageUrl" alt="Climbing route" />
    </template>
    <template #overlay>
      <g v-for="hold in allHolds" :key="hold.id">
        <g v-html="hold.svgMarkup"></g>
        <text 
          :x="hold.bbox[0]" 
          :y="hold.bbox[1] - 5" 
          class="text-xs"
          :fill="hold.source === 'ai-detected' ? '#ff0000' : '#00ff00'"
        >
          {{ hold.holdType }} ({{ hold.source }})
        </text>
      </g>
    </template>
  </ImageWithHolds>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore'
import ImageWithHolds from '@/components/ImageWithHolds.vue'

const props = defineProps(['imageId', 'locationId', 'imageUrl'])

const holdStore = useHoldDetectionPersistenceStore()

onMounted(async () => {
  holdStore.initializeForLocation(props.locationId)
  await holdStore.loadStoredDetection(props.imageId)
})

const allHolds = computed(() => holdStore.getHoldsForImage(props.imageId))
const imageViewBox = computed(() => holdStore.getViewBoxForImage(props.imageId))
</script>
```
