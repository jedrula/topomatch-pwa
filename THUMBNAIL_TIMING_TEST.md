# Thumbnail Generation Timing

## Actual Measurements

### Emulator (Confirmed)
- Extension: `ext-storage-resize-images-x2dt-generateResizedImage`
- Typical timing: **~960ms** (< 1 second)
- Very consistent and fast

### Production (To Verify)
Check Firebase Console → Functions → Logs for:
```
ext-storage-resize-images-x2dt-generateResizedImage
```

Look for: `Finished "ext-storage-resize-images-x2dt-generateResizedImage" in XXXms`

## Current Configuration

Based on emulator data (960ms):
```javascript
const THUMBNAIL_WAIT_TIME = 2000; // 2 seconds (2x emulator time for safety)
```

**Rationale:**
- Emulator: ~960ms
- Add buffer for network/CDN: +1000ms
- Safe fallback to original if it takes longer
- Better to show optimized image quickly than wait too long

## Adjusting for Production

If production logs show different timing:
- **Faster (< 1s)**: Could reduce to `1500ms`
- **Slower (3-5s)**: Increase to `3000ms`
- **Inconsistent**: Keep at `2000ms` with fallback
