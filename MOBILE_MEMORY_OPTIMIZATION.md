# Mobile Memory Optimization for Video Processing

## Problem
Large videos (50MB+) crash the webapp on mobile devices with ~2GB RAM, causing page refresh due to memory exhaustion.

## Root Cause
Video processing in-browser is extremely memory-intensive:
- Full resolution video frames (potentially 1920x1080+)
- Multiple frames kept in memory simultaneously
- Multiple copies of each frame (ImageData + File blob + URL)
- ONNX models running on each frame for pose detection AND image matching

## Configuration

### 🎛️ Feature Flag: `DOWNSCALE_IMAGES`

Controlled in two places:
1. **`src/utils/homographyUtils.js`** - Frame extraction downscaling
2. **`src/components/VideoFrameMatcherEnhanced.vue`** - Memory cleanup behavior

```javascript
const DOWNSCALE_IMAGES = false;  // Default: Full resolution (debugging)
// Set to true in production for memory optimization
```

**When `false` (Full Resolution - Default):**
- ✅ Full resolution frames (best quality)
- ✅ All frames kept in memory (needed for homography debugging)
- ✅ Can visualize feature matches on source images
- ⚠️ Higher memory usage (~200 MB)

**When `true` (Downscaled - Production):**
- ⚡ Frames downscaled to 640px (optimal for YOLOv8)
- ⚡ Only best frame kept, others freed (~80 MB saved)
- ⚡ Lower memory footprint (~100 MB)
- ⚠️ Cannot debug homography on full-res images

## Optimizations Implemented

### ✅ 1. Configurable Frame Downscaling
**File**: `src/utils/homographyUtils.js`
```javascript
const DOWNSCALE_IMAGES = false; // Set to true in production
const MAX_DIMENSION = 640;

if (DOWNSCALE_IMAGES && (videoWidth > MAX_DIMENSION || videoHeight > MAX_DIMENSION)) {
  // Downscale to 640px
} else {
  // Keep full resolution
}
```
**Impact**: 
- Full resolution mode: Best quality for accuracy and debugging
- Downscaled mode: 640px optimal for YOLOv8 (saves ~75% memory per frame)

### ✅ 2. Conditional Frame Resource Cleanup (BIGGEST WIN! 🎯)
**File**: `src/components/VideoFrameMatcherEnhanced.vue`
```javascript
const DOWNSCALE_IMAGES = false; // Set to true in production

// After pose detection
if (!DOWNSCALE_IMAGES) {
  // Full res: Keep all frames for homography visualization
  console.log('Full resolution mode: keeping all frames');
} else {
  // Downscaled: Free all frames except best one
  extractedFrames.value.forEach((frame, index) => {
    if (index !== bestFrameIndex) {
      URL.revokeObjectURL(frame.url);
      delete frame.file;
      delete frame.url;
    }
  });
}
```
**Impact**: 
- **Full resolution mode**: Keep all frames for homography debugging (needed for FeatureMatchVisualization)
- **Downscaled mode**: ~80-100 MB saved immediately after pose detection!
- All 10 frames processed for pose detection (good coverage)
- Pose data is tiny (~1 KB per frame vs ~8 MB per frame)

### ✅ 3. Hide PoseFrameAnimator Component
**File**: `src/components/VideoFrameMatcherEnhanced.vue`
```javascript
// Commented out PoseFrameAnimator - it needs all 10 frames in memory
// import PoseFrameAnimator from './PoseFrameAnimator.vue';

// UI now shows only AscentForm, not the animated GIF-like display
```
**Impact**: 
- Don't need to keep 10 full-res frames for display
- Frames are only used for processing, then freed
- UI remains clean and focused on ascent form

### ✅ 4. Balanced JPEG Compression
**File**: `src/components/VideoFrameMatcherEnhanced.vue`
```javascript
canvas.toBlob((blob) => {
  resolve(new File([blob], fileName, { type: 'image/jpeg' }));
}, 'image/jpeg', 0.85); // 85% quality - balanced compression
```
**Impact**: 
- 30-40% smaller file sizes vs PNG
- Still maintains good quality for model inference
- Not too greedy - quality matters!

### ✅ 5. Blob URL Cleanup (Prevents memory leaks)
**File**: `src/components/VideoFrameMatcherEnhanced.vue`
```javascript
const cleanupFrameUrls = () => {
  extractedFrames.value.forEach((frame) => {
    if (frame.url && frame.url.startsWith('blob:')) {
      URL.revokeObjectURL(frame.url);
    }
  });
};

// Called on component unmount and state clear
onUnmounted(() => {
  cleanupFrameUrls();
  clearState();
});
```
**Impact**: Prevents blob URLs from lingering in memory

### ✅ 6. Garbage Collection Hints
**File**: `src/components/VideoFrameMatcherEnhanced.vue`
```javascript
// Small delay between frames with GC hint
await new Promise(resolve => setTimeout(resolve, 100));
if (window.gc) window.gc(); // Suggest GC on mobile
```
**Impact**: Helps browser reclaim memory between processing steps

## Memory Savings Calculation

### Debug Mode (DOWNSCALE_DISABLED = true) - Default
**1080p video, 10 frames - FULL RES!**
- All 10 frames extracted: **83 MB**
- All frames kept for debugging: **83 MB continuously**
- No PoseFrameAnimator: **0 MB saved here**
- Pose data: **~10 KB**
- Image matching: **1 frame** × N topo images = **~50 MB peak**
- **Total peak: ~180-200 MB** �

**Use for:**
- Development and debugging
- Homography visualization
- Feature match debugging
- When memory is not constrained

### Production Mode (DOWNSCALE_DISABLED = false)
**1080p video → 640p, 10 frames**
- All 10 frames extracted at 640p: **9 MB** (89% reduction!)
- After pose detection: **Free 9 frames, keep 1 = 0.9 MB** ✅
- No PoseFrameAnimator: **0 MB for display**
- Pose data: **~10 KB**
- Image matching: **1 frame** × N topo images = **~50 MB peak**
- **Total peak: ~80-100 MB** ⚡

**Total Savings vs Debug: ~60-70% memory reduction** 🎉

### Key Insights
1. **Feature flag approach** - best of both worlds!
2. **Debug mode** - full resolution + all frames (needed for homography viz)
3. **Production mode** - downscaled + aggressive cleanup (mobile-friendly)
4. **Easy toggle** - change one constant in two files

## Additional Optimization Opportunities (Not Implemented)

### 🔧 Further Optimizations If Still Crashing

1. **Process frames sequentially**
   - Extract → Detect → Discard → Next frame
   - Keep only results, not raw frames
   - More complex implementation

3. **Reduce ONNX thread count on mobile**
   ```javascript
   // In usePoseDetection.js
   const numThreads = isMobile ? 2 : 4;
   ```

4. **Lazy load models**
   - Only load pose detection when needed
   - Unload after processing
   - Reduces baseline memory usage

5. **Video streaming instead of full load**
   - Use MediaSource API to stream video
   - Don't load entire file into memory
   - More complex implementation

## How to Toggle for Production

To enable aggressive memory optimization for mobile devices:

1. **In `src/utils/homographyUtils.js`** (line ~157):
   ```javascript
   const DOWNSCALE_IMAGES = true; // Changed from false
   ```

2. **In `src/components/VideoFrameMatcherEnhanced.vue`** (line ~303):
   ```javascript
   const DOWNSCALE_IMAGES = true; // Changed from false
   ```

**Result:**
- Frames downscaled to 640px
- Only best frame kept in memory
- ~60-70% memory reduction

**Consider using environment variables:**
```javascript
const DOWNSCALE_IMAGES = !import.meta.env.DEV; // Auto-toggle based on dev/prod
```

## Testing Recommendations

1. **Test on target device** (wife's iPhone)
   - Debug mode: Should work but may be slower
   - Production mode: Should be faster and more stable

2. **Monitor memory in DevTools**
   - Chrome: Performance → Memory
   - Check peak memory usage during processing
   - Compare debug vs production mode

3. **Test with various video sizes**
   - 10MB, 25MB, 50MB, 100MB videos
   - Different resolutions (720p, 1080p, 4K)

4. **Verify homography debugging**
   - Debug mode: Feature matches should display correctly
   - Production mode: May not have source images for visualization

## Success Metrics

- ✅ 50MB videos process without crashing on mobile
- ✅ Peak memory usage stays under 200-300 MB
- ✅ Pose detection accuracy maintained
- ✅ Image matching quality preserved
- ✅ Processing time remains acceptable (3-5 frames should be faster than 10)

## Rollback Plan

If optimizations cause issues:
1. Increase `FRAMES_FOR_ANALYSIS` back to 5-7
2. Increase `MAX_DIMENSION` to 1280 (720p → 1280p)
3. All changes are localized and easily adjustable
