# Video Upload Queue Architecture

## Overview

We've implemented a robust video upload queue system that handles video uploads independently from ascent creation. This solves t```javascript
{
  tempId: 'temp-1234567890-abc123',
  file: File,  // Not persisted - lost on page refresh
  locationId: 'loc_123',
  problemId: 'prob_456',  // May be null initially
  status: 'pending' | 'uploading' | 'completed' | 'claimed' | 'failed',
  progress: 0-100,
  uploadedUrl: 'https://...',
  uploadedAt: 1234567890,
  error: null,
  ascentId: 'ascent_789',  // Set when claimed
  createdAt: 1234567890,
  uploadPromise: Promise  // For awaiting completion
}
```ers having to wait for videos to upload before they can submit their ascent data.

## Architecture

### Core Component: `videoUploadQueueStore` (Pinia Store)

Located at: `src/stores/videoUploadQueueStore.js`

**Purpose:** Manages video uploads as a queue with lifecycle tracking, handles edge cases, and provides a clean API for upload management.

## How It Works

### 1. **Immediate Upload** 
When a user selects a video file:
```javascript
const tempId = await videoUploadQueue.startUpload(file, locationId, problemId);
```
- Generates a unique temporary ID
- Starts uploading immediately (non-blocking)
- Tracks upload progress in real-time
- Returns temp ID for later reference

### 2. **Ascent Creation**
When user submits the ascent form:
```javascript
await ascentStore.logAscent(ascentData);  // Create ascent first
const ascentId = ascentStore.latestUserAscent.id;

// Then claim the uploaded video
await videoUploadQueue.claimUpload(tempId, ascentId);
```
- Creates the ascent record
- Associates the already-uploaded video with the real ascent ID
- If video is still uploading, waits for completion

### 3. **Video Association**
The `claimUpload` method:
- Waits if video is still uploading (no timeout - waits until completion)
- Updates the video metadata to link to the real ascent ID
- Returns success/failure status

## Edge Cases Handled

###  1. **Video Uploaded, Ascent Abandoned**
**Scenario:** User uploads video but closes the form without submitting

**Solution:**
- Videos remain in storage with temp ascent IDs
- Frontend removes from local queue
- **⚠️ TODO: Backend cleanup job needed** - Should periodically scan for videos uploaded with temp IDs and delete unclaimed ones after 24 hours (see "Backend Implementation TODO" section below)

###  2. **Ascent Submitted, Video Still Uploading**
**Scenario:** User clicks "Log Send" before video finishes uploading

**Solution:**
- `claimUpload()` awaits the upload Promise
- User sees loading state during upload
- Ascent is created, then video is automatically associated when upload completes
- No artificial timeout - lets the upload complete naturally
- If upload fails, user gets clear error message

### 3. **Network Failures**
**Scenario:** Upload fails due to network issues

**Solution:**
- Upload fails with clear error message
- User can retry manually if needed
- No automatic retries (video files too large to retry automatically)
- Error state preserved in queue for user visibility

### 4. **Browser Refresh**
**Scenario:** User refreshes page during upload

**Solution:**
- Upload state is **NOT persisted** - browser refresh means starting over
- Keeps implementation simple
- Users must avoid refreshing during uploads
- Future: Could add "unsaved changes" warning if activeUploads exist

## Store API

### State
- `uploads`: Object mapping temp IDs to upload records
- `activeUploads`: Computed array of currently uploading videos
- `completedUploads`: Computed array of completed but unclaimed uploads
- `hasActiveUploads`: Boolean indicating if any uploads in progress

### Methods

#### `start Upload(file, locationId, problemId)`
Start uploading a video immediately
- Returns: temp ID for tracking
- Side effects: Begins upload, updates progress

#### `claimUpload(tempId, ascentId)`
Associate an uploaded video with an ascent
- Awaits upload Promise if still in progress (no timeout)
- Returns: `{ success, uploadedUrl, error? }`

#### `updateProblemId(tempId, problemId)`
Update the problem ID for an upload
- Use case: Problem detected after upload started

#### `cancelUpload(tempId)`
Cancel/abandon an upload
- Removes from queue
- Note: Backend handles cleanup of orphaned videos from storage

#### `getUpload(tempId)`
Get upload record by temp ID

#### `getUploadsForProblem(locationId, problemId)`
Get all uploads for a specific problem

## Integration Points

### Video Analysis Flow (Primary Integration)

**How it works:**
1. User uploads video for analysis
2. AI detects which problem it matches
3. `useVideoAnalysis.js` calls `videoUploadQueue.startUpload(video, locationId, problemId)`
4. Upload starts immediately, returns tempId
5. User navigates to problem page with `?uploadTempId=temp-123`
6. Future: Simple ascent logging form will claim the upload

```javascript
// In useVideoAnalysis.js
const tempId = videoUploadQueue.startUpload(
  analysisData.video,
  locationId,
  problem.id
);

await router.push({
  name: 'boulder-problem-detail',
  params: { locationId, problemId: problem.id },
  query: { 
    action: 'log-ascent',
    uploadTempId: tempId 
  },
});
```

### Future: Simple Ascent Logging Form

When we rebuild ascent logging (removed for now), it will:
1. Check for `route.query.uploadTempId` on mount
2. Allow user to fill in ascent details (date, grade, attempt type, notes)
3. On submit, claim the upload:

```javascript
// Future implementation
await ascentStore.logAscent(ascentData);
if (route.query.uploadTempId) {
  await videoUploadQueue.claimUpload(route.query.uploadTempId, ascentId);
}
```

## Data Flow

```
User selects video
     ↓
startUpload() → Generates temp ID
     ↓
Upload begins (non-blocking)
     ↓
User fills form & clicks submit
     ↓
Create ascent → Get ascent ID
     ↓
claimUpload() → Associates video with ascent
     ↓
Success! Video linked to ascent
```

## Upload Record Structure

```javascript
{
  tempId: 'temp-1234567890-abc123',
  file: File,  // Not persisted to localStorage
  locationId: 'loc_123',
  problemId: 'prob_456',  // May be null initially
  status: 'pending' | 'uploading' | 'completed' | 'claimed' | 'failed',
  progress: 0-100,
  uploadedUrl: 'https://...',
  uploadedAt: 1234567890,
  error: null,
  ascentId: 'ascent_789',  // Set when claimed
  createdAt: 1234567890,
  uploadPromise: Promise  // Promise for awaiting completion
}
```

## Status Flow

```
pending → uploading → completed → claimed
   ↓          ↓           ↓
 failed ←── failed ←── (timeout/abandoned)
```

## Future Improvements

### Priority 1: Backend Orphaned Video Cleanup
Implement a backend cleanup job that:
- Runs periodically (e.g., daily)
- Scans Firebase Storage for videos with temp ascent IDs
- Checks if those temp IDs were claimed (associated with real ascents)
- Deletes unclaimed videos older than 24 hours
- Also cleans up corresponding Firestore metadata

Example backend logic:
```javascript
// Cloud Function or scheduled task
async function cleanupOrphanedVideos() {
  // 1. Query videos collection for temp ascent IDs
  const orphanedVideos = await db.collection('videos')
    .where('ascentId', '>=', 'temp-')
    .where('createdAt', '<', Date.now() - 24 * 60 * 60 * 1000)
    .get();
    
  // 2. Delete from Storage and Firestore
  for (const doc of orphanedVideos.docs) {
    await storage.bucket().file(doc.data().storagePath).delete();
    await doc.ref.delete();
  }
}
```

### Priority 2: Update Video Metadata in Firestore
Currently the video is uploaded with a temp ascent ID. Should update Firestore when claimed:

```javascript
// In claimUpload()
await videoService.updateVideoAscentId(tempId, ascentId);
```

### Priority 3: Progress UI Component
Show upload progress to user:
- Upload queue status in UI
- Progress bars for active uploads
- Notification when upload completes
- Warning on page navigation if uploads in progress

## Testing Checklist

- [ ] Upload video → Submit ascent → Verify video associated
- [ ] Upload video → Close tab → Verify orphaned video (backend will cleanup)
- [ ] Submit ascent while video uploading → Verify waits for upload
- [ ] Network failure during upload → Verify shows error (no retry)
- [ ] Failed upload → User can manually retry
- [ ] Browser refresh during upload → Verify upload lost, user must restart
- [ ] Video analysis → Navigate to problem → Verify upload starts automatically

## Backend Implementation TODO

⚠️ **Not yet implemented** - The following backend functionality is needed to complete the architecture:

### Orphaned Video Cleanup Job
Create a scheduled Cloud Function or backend job that:

1. **Runs daily** (or more frequently if needed)
2. **Queries for temp videos:**
   ```sql
   SELECT * FROM videos 
   WHERE ascentId LIKE 'temp-%' 
   AND createdAt < NOW() - INTERVAL 24 HOURS
   ```
3. **Deletes from storage and database:**
   - Remove file from Firebase Storage
   - Delete Firestore document
   - Log cleanup activity for monitoring

4. **Monitoring:**
   - Track number of orphaned videos cleaned up
   - Alert if cleanup rate is too high (possible bug)
   - Dashboard showing orphaned video statistics

## Benefits

✅ **Better UX**: Users don't wait for upload before submitting  
✅ **Simple & Clean**: No complex retry logic, no localStorage persistence  
✅ **Robust**: Handles network failures with clear error messages  
✅ **Clean**: Backend handles orphaned video cleanup  
✅ **Scalable**: Can handle multiple uploads simultaneously  
✅ **DRY**: Single source of truth for upload logic  
✅ **Testable**: Clear API surface for unit testing  
✅ **Efficient**: Promise-based, no polling or busy-waiting  
✅ **Pragmatic**: Browser refresh = start over (simple, clear behavior)

## Migration Notes

### Removed Components
- **AscentLogger.vue** - Removed entirely (will be rebuilt later with simpler design)
  - Was trying to do too much (video upload + form)
  - Had broken manual video upload flow
  - Duplicated functionality with video analysis flow

### Removed from Old Flow
- `window.tempVideoFile` usage - replaced by upload queue
- `sessionStorage` prefilledVideoData - replaced by upload queue
- Temporary ascent ID generation - using temp upload IDs instead
- Manual video upload on problem page - removed with AscentLogger

### Updated in useVideoAnalysis.js
- Integrated with `videoUploadQueueStore`
- Calls `startUpload()` when redirecting to problem page
- Passes `uploadTempId` as query param
- Removed sessionStorage video data storage

### Current State
- **Only one flow**: Video analysis → AI detection → Upload starts → Navigate to problem page
- **No ascent logging yet**: Need to rebuild simple form that claims upload
- **Clean architecture**: Single source of truth in videoUploadQueueStore
- Cleaner, simpler flow

### Net Result
- ~150 lines removed (AscentLogger component + integrations)
- Single source of truth: videoUploadQueueStore
- No more window/sessionStorage hacks
- Clean, maintainable architecture
- Video upload only through AI analysis flow (for now)
- Cleaner separation of concerns
- More robust edge case handling
