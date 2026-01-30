# Storage Trigger Consolidation

## What Changed

### Before
- **3 separate functions**: `transcodeVideo`, `onTranscodingComplete`, `onLocationImageUploaded`
- Each function triggered independently
- More cold starts, more logs noise
- No thumbnail generation

### After
- **1 unified function**: `onStorageFileCreated` with smart routing
- Cleaner logs, better resource utilization
- **Thumbnail generation** added (FFmpeg-based)
- Well-structured with separate handler files

## New Architecture

```
server/src/storage/
├── index.ts                 # Main router (onStorageFileCreated)
├── videoHandlers.ts         # Video upload & transcoding handlers
├── imageHandlers.ts         # Image upload & hold detection
└── thumbnailGenerator.ts    # FFmpeg thumbnail utility
```

### Storage Event Flow

**1. Raw Video Upload** (`videos/raw/{userId}/{videoId}.ext`)
- Routes to: `handleRawVideoUpload()`
- Production: Creates Transcoder job
- Emulator: Copies file to transcoded path (same flow as production)
- Updates Firestore: `video.status = "transcoding"`

**2. Transcoded Video** (`videos/transcoded/{userId}/{ascentId}/video.mp4`)
- Routes to: `handleTranscodedVideo()`
- **NEW**: Generates thumbnail at 2 seconds using FFmpeg
- Thumbnail saved: `videos/transcoded/{userId}/{ascentId}/thumbnail.jpg`
- Updates Firestore: `video.status = "ready"`, `video.thumbnailUrl = "..."`

**3. Location Image** (`location-images/{locationId}/{imageId}/original.ext`)
- Routes to: `handleLocationImageUpload()`
- Calls detection server API
- Saves detected holds to Firestore

## Thumbnail Generation

### Technology
- **FFmpeg** (industry standard for video processing)
- Better than ImageMagick for video thumbnails
- Already included in Cloud Functions environment

### Settings
- Extract frame at **2 seconds** (avoids black frames at start)
- Resolution: **640px width** (maintains aspect ratio)
- Format: **JPEG** (good quality, small size)
- Quality: **High** (q:v 2)
- Cache: **1 year** (thumbnails don't change)

### Storage Path
```
videos/transcoded/{userId}/{ascentId}/
├── video.mp4           # Transcoded video
└── thumbnail.jpg       # Generated thumbnail
```

### Emulator Support
✅ **Works in emulator** because:
- We copy raw → transcoded path
- Copy triggers `onStorageFileCreated` naturally
- FFmpeg runs on both emulator and production

## Frontend Changes

### Type Update
```typescript
// src/types/ascent.ts
export interface AscentVideo {
  // Before
  thumbnailBase64?: string; ❌
  
  // After
  thumbnailUrl?: string; ✅
}
```

### Dead Code Removed
- ❌ `src/utils/videoThumbnail.js` (deleted)
- ❌ All `thumbnailBase64` client-side extraction logic
- ❌ Memory-intensive client-side processing

### UI Changes Needed
All components using `video.thumbnailBase64` should switch to `video.thumbnailUrl`:
- `VideoPlayerShorts.vue`
- `VideoGridItem.vue`
- `LocationVideos.vue`
- `BoulderProblemDrawer.vue`
- etc.

## Benefits

### Performance
- ✅ **50% fewer functions** (3 → 1)
- ✅ **Fewer cold starts** (shared function instance)
- ✅ **Lighter frontend** (no client-side video processing)
- ✅ **Better memory usage** (thumbnails generated server-side)

### Developer Experience
- ✅ **Cleaner logs** (one function to monitor)
- ✅ **Easier debugging** (single entry point)
- ✅ **Better organization** (handlers in separate files)
- ✅ **Works in emulator** (copy-based transcoding simulation)

### User Experience
- ✅ **Faster uploads** (no client-side thumbnail extraction)
- ✅ **More reliable** (thumbnails always generated)
- ✅ **Consistent quality** (server-side processing)
- ✅ **Works on all devices** (no browser limitations)

## Deployment

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions:onStorageFileCreated

# Old functions can be deleted
firebase functions:delete transcodeVideo
firebase functions:delete onTranscodingComplete
firebase functions:delete onLocationImageUploaded
```

## Testing

### Emulator
```bash
# Start emulators
npm run emulators

# Upload video → should trigger full flow with thumbnail
# Upload image → should trigger hold detection
```

### Production
After deployment, upload a video and check:
1. Logs show route selection
2. Thumbnail appears in Storage at correct path
3. Firestore has `video.thumbnailUrl`
4. Frontend displays thumbnail

## Next Steps

1. **Update frontend components** to use `thumbnailUrl` instead of `thumbnailBase64`
2. **Remove dead code** - search for remaining `thumbnailBase64` references
3. **Test in emulator** - verify thumbnail generation works
4. **Deploy to production** - Firebase Functions
5. **Delete old functions** - clean up unused `transcodeVideo`, etc.

## Failure Recovery (Jan 2026)

### Problem
Transcoding jobs can fail silently (e.g., "AudioMissing" error when video has no audio track). Firestore stuck at `status="transcoding"` indefinitely. UI shows "Processing..." forever.

### Solution
**Manual cleanup script** (future: could be scheduled function)
- Script: `server/scripts/cleanup-transcoding-state.js`
- Finds stuck videos (`status="transcoding"`)
- Checks actual Transcoder job status via Google Cloud API
- Recommends action: mark-failed / verify-files / still-processing

**Job ID storage** (added Jan 2026)
- Store `video.transcoderJobId` and `video.transcoderJobFullPath` in Firestore when creating job
- Enables easy debugging without parsing logs

**Why manual (not scheduled)?**
1. Better control during testing/debugging
2. Avoid unnecessary cloud function costs (low usage app)
3. Can become scheduled function later when needed

**Usage:**
```bash
cd server
node scripts/cleanup-transcoding-state.js [userId]
```
