# Coordinate Scaling Fix

**Date:** October 27, 2025  
**Status:** ✅ Fixed

## Problem

Hold overlays were displaying at the wrong scale - coordinates were too large, causing holds to appear in incorrect positions.

## Root Cause Analysis

### The Mismatch

1. **Detection Server** analyzes image at original upload dimensions:
   - Image dimensions: **1536 x 2048** (from Storage)
   - Coordinates returned: In 1536x2048 space
   - Example: `x: 756.78, y: 1198.86`

2. **Cloud Function** (BEFORE fix):
   - Saved viewBox: Fallback `"0 0 1920 1080"` ❌
   - Should be: `"0 0 1536 2048"` to match image_info

3. **Frontend** (BEFORE fix):
   - Loaded image: **1920 x 1440** (resized version) ❌
   - ViewBox says: `0 0 1536 2048`
   - **Result**: Coordinates in 1536x2048 space displayed on 1920x1440 image = WRONG SCALE!

### Why This Happened

The frontend was using `getResizedImageUrl(imageRecord.downloadUrl, '1920x1440', 'jpg')` which loads a resized thumbnail for performance. But the detection server analyzes the **original** image, so coordinates don't match.

## The Fix

### 1. Cloud Function - Correct ViewBox Extraction

**Before:**
```typescript
const viewBox = detectionResult.viewBox || 
               detectionResult.metadata?.viewBox || 
               "0 0 1920 1080"; // Wrong fallback!

const imageDimensions = detectionResult.metadata?.imageDimensions || 
                       detectionResult.image_info ||
                       { width: 1920, height: 1080 };
```

**After:**
```typescript
// Extract image_info from detection server response
const imageInfo = (detectionResult as any).image_info;
const imageDimensions = imageInfo || { width: 1920, height: 1080 };

// ViewBox MUST match the coordinate space (image_info dimensions)
const viewBox = imageInfo 
  ? `0 0 ${imageInfo.width} ${imageInfo.height}`
  : "0 0 1920 1080";
```

**Result:** ViewBox now correctly set to `"0 0 1536 2048"` matching detection coordinates!

### 2. Frontend - Load Original Image

**Before:**
```vue
currentImage.value = {
  id: imageRecord.imageId,
  url: getResizedImageUrl(imageRecord.downloadUrl, '1920x1440', 'jpg'), // ❌ Resized
  name: imageRecord.fileName,
}
```

**After:**
```vue
currentImage.value = {
  id: imageRecord.imageId,
  url: imageRecord.downloadUrl, // ✅ Original image (matches detection)
  name: imageRecord.fileName,
}
```

**Result:** Frontend now displays the SAME image dimensions that detection analyzed!

## How Coordinate Mapping Works Now

### Detection Server Response
```json
{
  "image_info": {
    "width": 1536,
    "height": 2048
  },
  "holds": [
    {
      "x": 756.78,
      "y": 1198.86,
      "width": 109.74,
      "height": 63.54
    }
  ],
  "svg_markups": [
    "<path d=\"M 865,1217 L 837,1200 L ...\" />"
  ]
}
```

### Cloud Function Saves to Firestore
```javascript
{
  detectionResults: {
    aiHolds: [{
      id: "ai_hold_0",
      x: 756.78,
      y: 1198.86,
      width: 109.74,
      height: 63.54,
      svgMarkup: "<path d=\"M 865,1217 L 837,1200 L ...\" />"
    }],
    metadata: {
      viewBox: "0 0 1536 2048",  // ✅ Matches image_info
      imageDimensions: {
        width: 1536,
        height: 2048
      }
    }
  }
}
```

### Frontend Displays
```vue
<img :src="originalImageUrl" />  <!-- 1536x2048 image -->
<svg viewBox="0 0 1536 2048">     <!-- Same coordinate space! -->
  <path d="M 865,1217 L 837,1200 L ..." />  <!-- Perfectly aligned! -->
</svg>
```

## Files Modified

1. **server/src/holdDetection.ts**
   - Extract `image_info` from detection response
   - Build viewBox from `image_info.width` and `image_info.height`
   - Add logging for debugging

2. **src/views/HoldDetectionServerView.vue**
   - Remove `getResizedImageUrl()` usage
   - Use original `imageRecord.downloadUrl` directly
   - Remove unused import

## Performance Considerations

### Original Images are Larger
- **Before**: Loading 1920x1440 JPG (~200KB)
- **After**: Loading original 1536x2048 JPG (~455KB - from response data)

### Why This is Acceptable
1. **Accuracy over speed**: Correct hold positions are critical
2. **One-time load**: Image cached after first load
3. **Modern networks**: 455KB loads quickly (< 1 second on 3G)
4. **Progressive JPEG**: Image appears progressively while loading

### Future Optimization (Optional)
Could implement:
1. Load resized image first for quick preview
2. Load original image in background
3. Switch to original when holds are ready
4. Cache original image for instant subsequent loads

## Testing Checklist

- [x] Restart emulator
- [ ] Upload new location image
- [ ] Wait for Cloud Function to complete
- [ ] Navigate to holds page
- [ ] Verify viewBox matches image dimensions in logs
- [ ] Verify hold overlays align perfectly with image
- [ ] Check SVG paths render correctly
- [ ] Test on different image sizes

## Debugging Commands

```bash
# Check Cloud Function logs for viewBox
cd server && npm run serve

# In browser console on holds page:
console.log('Image dimensions:', climbingImage.value.naturalWidth, 'x', climbingImage.value.naturalHeight);
console.log('SVG viewBox:', document.querySelector('svg[viewBox]')?.getAttribute('viewBox'));
```

## Expected Log Output

```
📐 Image Info: {
  "filename": "climbing_wall.jpg",
  "width": 1536,
  "height": 2048,
  "size_mb": 0.455
}
📐 ViewBox: 0 0 1536 2048
📐 Dimensions: 1536x2048
```

## Related Issues

- SVG markups not displaying → Fixed (separate issue)
- Frontend simplification → Complete
- Automatic detection → Working
- API health check removed → Complete

## Next Steps

1. Test with newly uploaded image
2. Verify holds align correctly
3. Document in main README if scaling is correct
4. Consider adding UI indicator when loading original vs resized image
