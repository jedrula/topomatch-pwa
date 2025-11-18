# Camera Movement Detection

**Status**: 📋 Not Started  
**Priority**: 🟢 LOW  
**Category**: Enhancement / Computer Vision  
**Complexity**: Medium  
**Impact**: Medium (improves V1, enables adaptive frame selection)

## Goal

Detect camera movement between video frames to:
1. Show stability indicator in debug UI
2. Warn users when excessive movement detected
3. Enable future adaptive frame selection (V2 of camera movement challenge)

## Approach

### Option 1: Optical Flow on Background (RECOMMENDED)
**Complexity**: 30-60 minutes  
**Accuracy**: High

Calculate optical flow between consecutive frames, masking out the climber:

```javascript
async function detectCameraMovement(frame1, frame2, pose1, pose2) {
  // 1. Convert to grayscale
  // 2. Create mask to exclude person (use pose bounding box + margin)
  // 3. Calculate optical flow (cv.calcOpticalFlowFarneback)
  // 4. Average flow magnitude on background pixels only
  // 5. Return movement score + isStable flag
}
```

**Pros**: Most accurate, analyzes background only  
**Cons**: Requires OpenCV.js processing (already loaded)

### Option 2: Feature Point Tracking
**Complexity**: 45-90 minutes  
**Accuracy**: High

Use SuperPoint keypoints on consecutive frames, track background features:
- Run SuperPoint on frame pairs
- Filter keypoints outside person bounding box
- Measure displacement of wall features

**Pros**: Uses existing SuperPoint infrastructure  
**Cons**: More complex, need to separate background features

## Implementation Notes

- Mask person using pose keypoints bounding box (add 50px margin)
- Threshold: movement > 2.0 pixels = unstable camera
- Display in debug UI: 📹 Camera: Stable ✅ or Moving ⚠️
- Future: Use stability data to adjust frame window dynamically

## Related Files
- `src/components/VideoFrameMatcherEnhanced.vue` - Add detection during frame analysis
- `src/utils/homographyUtils.js` - Utility functions available
- `tasks/todo/camera-movement-challenge.md` - Parent challenge

## Future Use (V2)
When camera stable: use more frames (up to 10)  
When camera moving: use fewer frames (3 or warn user)  
Adaptive based on actual detected movement
