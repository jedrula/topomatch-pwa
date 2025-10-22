# Video Transcoding Flow Using Cloud Transcoder API

## High-Level Architecture Overview

This document describes the end-to-end flow of video processing from upload to viewing, using Google Cloud Transcoder API directly instead of the Firebase extension.

---

## The Complete Journey

### 1. **User Uploads Video** 📤
- Climber records a video of their climb attempt
- User selects the video file in the app interface
- App uploads the raw video file to Firebase Storage
- Upload destination: `gs://topomatch-pwa.appspot.com/videos/raw/{userId}/{videoId}.mp4`
- Upload status is tracked in Firestore with metadata:
  ```json
  {
    "status": "uploading",
    "originalPath": "videos/raw/{userId}/{videoId}.mp4",
    "uploadedAt": timestamp,
    "userId": "...",
    "fileSize": 52428800
  }
  ```

---

### 2. **Cloud Function Triggered** ⚡
- Firebase Storage `onObjectFinalized` trigger detects the new video file
- Cloud Function `transcodeVideo` is automatically invoked
- Function validates:
  - File is a video format (mp4, mov, avi, etc.)
  - File is in the correct upload path
  - File dimensions are within limits (max 4096x4096 px input)
  - Video duration is reasonable (max 24 hours for EditList)
  - File size is reasonable (recommended: under 5GB for mobile uploads)
- Firestore document updated:
  ```json
  {
    "status": "processing",
    "processingStartedAt": timestamp
  }
  ```

---

### 3. **Transcoding Job Created** 🎬
- Cloud Function calls Google Cloud Transcoder API
- Creates a transcoding job with:
  - **Input**: Original high-quality video from Storage
  - **Output**: Single SD quality version (480p)
  - **Location**: `europe-west1` (matches your Firebase region `eur3`)
  
- Job configuration (POC - Ultra-Minimal SD-Only Approach):
  ```javascript
  {
    inputUri: 'gs://bucket/videos/raw/user123/video456.mp4',
    outputUri: 'gs://bucket/videos/transcoded/user123/video456/video.mp4',
    config: {
      elementaryStreams: [
        {
          key: 'video-sd',
          videoStream: { 
            h264: { 
              bitrateBps: 1000000,  // 1 Mbps - good for mobile
              frameRate: 30,
              heightPixels: 480,
              widthPixels: 854
            } 
          } 
        },
        {
          key: 'audio',
          audioStream: { 
            codec: 'aac', 
            bitrateBps: 128000 
          } 
        }
      ],
      muxStreams: [
        { 
          key: 'sd-output',
          container: 'mp4', 
          elementaryStreams: ['video-sd', 'audio'] 
        }
      ]
    }
  }
  ```

**Why This Approach is PERFECT for POC:**
- ✅ **Simplest possible** - Single output file, no quality switching logic
- ✅ **Cheapest** - ~$0.015 per 1-minute video (70% cheaper!)
- ✅ **Good enough for mobile** - 480p looks fine on phone screens
- ✅ **Fastest transcoding** - Processes even faster than HD
- ✅ **No confusion** - One file, one quality, simple
- ✅ **Easy to upgrade later** - Can add HD when users demand it

**Output:**
- Single file: `video.mp4` (480p SD @ ~1 Mbps)
- Perfect for 1-3 minute climb videos on mobile
- Users won't complain unless you tell them it's SD 😉

- Transcoder API returns a job ID
- Job ID stored in Firestore for tracking

---

### 4. **Background Transcoding** ⏳
- Google Cloud's infrastructure processes the video
- Single SD quality version is generated
- Progress cannot be directly monitored in real-time
- Typical duration: 
  - 1-3 minutes for a 1-minute video
  - Processing time is roughly 1-3x the video duration
  - Depends on original file size and quality settings

---

### 5. **Transcoding Completion** ✅

#### Option A: Polling (Simple but less efficient)
- Scheduled Cloud Function runs every 5 minutes
- Checks status of "processing" jobs via Transcoder API
- When job completes, updates Firestore

#### Option B: Cloud Storage Trigger (Recommended)
- Transcoder writes output files to Storage
- Storage trigger detects new transcoded files
- Cloud Function `onTranscodingComplete` is triggered
- Function updates Firestore with output paths:
  ```json
  {
    "status": "ready",
    "processingCompletedAt": timestamp,
    "transcodedVersions": [
      {
        "quality": "sd",
        "path": "videos/transcoded/user123/video456/video.mp4",
        "size": 10000000,
        "bitrate": 1000000,
        "resolution": "480p"
      }
    ],
    "thumbnail": "videos/transcoded/user123/video456/thumbnail.jpg"
  }
  ```

---

### 6. **User Interface Updates** 🔄

#### Background Processing - "Fire and Forget" UX

**Philosophy:** After upload completes, user moves on. Video processing happens silently in the background. Video is **immediately shareable** - viewers will automatically get the best available version.

**During Upload:**
- Show upload progress (user needs to wait for this)
- Once upload completes → immediately redirect/close modal
- **Video is immediately shareable** (share link works right away)
- User can continue using the app
- No spinners, no "processing..." messages

**After Upload:**
- Transcoding happens silently in background (1-3 minutes)
- No notifications needed (user doesn't care when it finishes)
- Video is immediately playable (serves original until transcoded)
- **Shared links work immediately** - viewers see best available version

**Sharing Flow:**
1. User uploads video → gets shareable link immediately
2. User shares link with friends right away
3. Friend opens link 30 seconds later:
   - Still transcoding → sees original video (works perfectly)
   - Transcoding done → sees SD version (optimized, smaller file)
4. Friend opens same link 5 minutes later:
   - Always sees SD version (transcoding finished)
5. **Friend never knows or cares about transcoding** - it just works!

**Key Point:** The system transparently serves the best available version. Users never think about "processing" or "optimization" - they just share and watch.

#### Viewing Implementation (Simple Fallback):

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase';

// When loading a climb video page
async function loadClimbVideo(videoId) {
  const videoDoc = await getDoc(doc(db, 'climbVideos', videoId));
  const videoData = videoDoc.data();
  
  let videoUrl;
  let isTranscoded = false;
  
  // Try to use transcoded version, fall back to original
  if (videoData.status === 'ready' && videoData.transcodedVersions?.[0]) {
    // Transcoding complete - use optimized SD version
    const transcodedPath = videoData.transcodedVersions[0].path;
    videoUrl = await getDownloadURL(ref(storage, transcodedPath));
    isTranscoded = true;
  } else {
    // Still processing or failed - serve original
    videoUrl = await getDownloadURL(ref(storage, videoData.originalPath));
    isTranscoded = false;
  }
  
  return { videoUrl, isTranscoded };
}
```

#### Optional: Debug Badge (Development/Testing Only)

Show a small badge to help with debugging during POC:

```html
<template>
  <div class="video-container">
    <video :src="videoUrl" controls></video>
    
    <!-- Only show in development or for debugging -->
    <div v-if="showDebugInfo" class="debug-badge">
      {{ isTranscoded ? '✅ Transcoded (SD)' : '⏳ Original (transcoding...)' }}
    </div>
  </div>
</template>

<style>
.debug-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
</style>
```

**Key Benefits:**
- ✅ **Simple UX** - User uploads, then moves on
- ✅ **Immediately shareable** - Share link works right after upload
- ✅ **Always playable** - Original video serves as immediate fallback
- ✅ **Silent upgrade** - Automatically serves transcoded version when ready
- ✅ **No complexity** - No notifications, spinners, or status tracking needed
- ✅ **Transparent to users** - They never think about transcoding
- ✅ **Debug friendly** - Optional badge shows transcoding status (dev only)

---

### 7. **Other Viewers Watch Video** 👀

**The Magic:** Viewers never know about transcoding. They just click the link and watch. The system handles everything transparently.

#### Initial Load:
1. Viewer clicks shared link to climb page
2. App reads video metadata from Firestore (single read)
3. App intelligently serves best available version:
   - If transcoded version exists → serve SD (optimized, smaller)
   - If still transcoding → serve original (works perfectly)
4. **Viewer experiences:** Click link → video plays. Simple!

#### Streaming:
```javascript
const storage = getStorage();

if (videoData.status === 'ready') {
  // Transcoding complete - use optimized SD version (most common case)
  const videoRef = ref(storage, 'videos/transcoded/user123/video456/video.mp4');
  const videoUrl = await getDownloadURL(videoRef);
} else {
  // Still processing - serve original (rare, only within minutes of upload)
  const originalRef = ref(storage, videoData.originalPath);
  const videoUrl = await getDownloadURL(originalRef);
}
```

Simple video playback:
```html
<video controls>
  <source :src="videoUrl" type="video/mp4">
  Your browser doesn't support video playback.
</video>
```

**User Experience Timeline:**
- **T+0 seconds:** User uploads video, gets shareable link
- **T+10 seconds:** User shares link with friend
- **T+30 seconds:** Friend opens link → sees original video (transcoding in progress)
- **T+2 minutes:** Another friend opens same link → sees SD version (transcoding done)
- **T+1 hour:** Many friends watch → everyone sees optimized SD version
- **Nobody notices the transition** - it's completely transparent!

---

## Key Components Summary

### Storage Buckets Structure:
```
gs://topomatch-pwa.appspot.com/
├── videos/
│   ├── raw/                    # Original uploads (can be deleted after transcoding)
│   │   └── {userId}/
│   │       └── {videoId}.mp4
│   └── transcoded/             # Processed outputs (SD only for POC)
│       └── {userId}/
│           └── {videoId}/
│               └── video.mp4    # 480p SD (single file!)
```

### Firestore Collections:

**New Collection: `/climbVideos/{videoId}`**

This is a **NEW** collection separate from your existing boulder problems. It tracks video upload and transcoding status.

```
/climbVideos/{videoId}
  - status: 'uploading' | 'processing' | 'ready' | 'failed'
  - userId: string
  - originalPath: string (e.g., 'videos/raw/{userId}/{videoId}.mp4')
  - transcodedVersions: array [
      { quality: 'sd', path: '...', size: number, bitrate: 1000000, resolution: '480p' }
    ]
  - uploadedAt: timestamp
  - processingStartedAt: timestamp
  - processingCompletedAt: timestamp
  - transcodingJobId: string (Google Cloud Transcoder job ID)
  - metadata: { 
      duration: number (seconds),
      width: number (pixels),
      height: number (pixels),
      codec: string,
      fileSize: number (bytes)
    }
  
  // Optional: Link to boulder problem if this is an attempt
  - boulderProblemId: string (optional reference)
  - locationId: string (optional reference)
```

**Integration with Existing Data:**

Your app already has:
- `/locations/{locationId}` - Climbing locations
- `/locations/{locationId}/boulderProblems/{problemId}` - Boulder problems

The video collection can optionally link to these:
- A climb video can reference a `boulderProblemId` to show "This is my attempt at problem X"
- A climb video can reference a `locationId` to show "This was filmed at location Y"

### Cloud Functions:
1. **transcodeVideo** (Storage trigger on raw upload)
   - Validates video file
   - Creates transcoding job
   - Updates Firestore status

2. **onTranscodingComplete** (Storage trigger on transcoded output)
   - Detects completed transcoding
   - Updates Firestore with output paths
   - Generates thumbnail
   - Marks video as ready

3. **getVideoUrl** (HTTPS callable - optional)
   - Generates signed URLs for secure video access
   - Enforces access control rules

---

## Benefits of This Approach

✅ **Full Control** - Complete customization of transcoding parameters  
✅ **Simple & Clean** - Single SD quality, no complexity  
✅ **Cost Effective** - Pay only for actual transcoding time (~$0.015/min)  
✅ **Scalable** - Google's infrastructure handles any volume  
✅ **Reliable** - No extension compatibility issues  
✅ **Monitoring** - Direct access to job status and errors  
✅ **Storage Optimization** - Can delete original raw video after transcoding  
✅ **Easy to Upgrade** - Add HD quality later if users request it

---

## Cloud Transcoder API Limits (Per Job)

Based on official Google Cloud documentation:

| Limit | Value |
|-------|-------|
| Maximum input width | 4096 px |
| Maximum input height | 4096 px |
| Maximum output width | 4096 px |
| Maximum output height | 2160 px (4K) |
| Total output size | 400 GB |
| Maximum EditList duration | 24 hours |
| Maximum number of video streams | 70 |
| Maximum number of audio streams | 50 |
| Concurrent jobs per region (interactive mode) | 20 |
| Concurrent jobs per region (batch mode) | 10 |

**Practical Recommendations for Climb Videos (POC):**
- Typical video duration: ~1 minute (most climbs)
- Maximum video duration: 3 minutes (for longer attempts)
- Maximum file size: 200-500MB (typical phone recordings are ~100-150MB per minute)
- Input resolution: Any (will be downscaled to 480p SD output)
- Recommended format: MP4, MOV (most common from phones)
- Output: **480p SD only** (mobile-optimized, ultra-cheap)
- Future: Easy to upgrade to HD when users demand it

---

## Potential Challenges & Solutions

### Challenge 1: Transcoding Takes Time (1-3 minutes)
**Why This Isn't a Problem:**
- ✅ User uploads and moves on - no waiting
- ✅ Original video plays immediately (instant playback)
- ✅ Transcoded version silently replaces it later
- ✅ Most viewers will see transcoded version (upload delay + sharing time)
- ✅ No spinners, no notifications needed
- ✅ "Fire and forget" UX - best experience

### Challenge 2: Large Storage Costs
**Not Even A Problem with SD-Only:**
- Only ~$0.10/month storage for 100 videos
- Can still delete original after transcoding if needed
- Storage is negligible compared to transcoding costs
- For POC: Don't even worry about it

### Challenge 3: Failed Transcoding Jobs
**Solution**:
- Implement retry logic (max 3 attempts)
- Log errors to Cloud Logging
- Update Firestore status to 'failed' with error message
- Notify user via email/notification

### Challenge 4: Access Control
**Solution**:
- Use Firebase Storage security rules
- Generate signed URLs with expiration
- Track video ownership in Firestore
- Implement view permissions (public/private/friends)

---

## Cost Estimation (Rough)

**Transcoder API Pricing** (SD-only for POC):
- Single SD output (480p @ $0.015/min)
- **Example:** 1-minute video = **$0.015 per upload**
- 💰 **70% cheaper than HD+SD!** Perfect for POC

**Storage Costs**:
- $0.026 per GB/month
- 1-minute video (SD only): ~30-35MB total
- **Example:** ~$0.001/month per video
- 💰 **Half the storage** of HD+SD approach

**Total Cost Example (100 videos/month, 1 minute each):**
- Transcoding: 100 × $0.015 = **$1.50/month** 🎉
- Storage: 100 × $0.001 = **$0.10/month**
- **Total: ~$1.60/month for 100 climb videos!** 

**Compare to HD+SD approach:**
- POC (SD-only): $1.60/month ✅
- HD+SD: $4.70/month
- **You save ~$3/month** (66% savings!)

**When to Upgrade to HD:**
- Users complain about quality
- You get traction and want premium experience
- Easy migration: just update the transcoding config

**Network Egress** (when viewers watch):
- First 1GB/month: Free
- Next 10TB: $0.12 per GB
- Cost depends on viewership volume

---

## Testing Strategy

### End-to-End Testing (Without Frontend)

**Goal:** Test the entire transcoding pipeline quickly without building UI first.

#### Test Script: `scripts/simulate-upload.js`

This script simulates a user uploading a video and monitors the complete flow:

```javascript
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (for emulator or production)
admin.initializeApp({
  projectId: 'topomatch-pwa',
  storageBucket: 'topomatch-pwa.appspot.com'
});

const storage = new Storage();
const db = admin.firestore();

async function simulateVideoUpload(testVideoPath) {
  console.log('🎬 Starting video upload simulation...\n');
  
  // Generate test identifiers
  const userId = 'test-user-123';
  const videoId = `test-video-${Date.now()}`;
  const uploadPath = `videos/raw/${userId}/${videoId}.mp4`;
  
  console.log(`📤 Uploading test video to: ${uploadPath}`);
  
  // 1. Upload video to Storage (this triggers the Cloud Function)
  await storage
    .bucket('topomatch-pwa.appspot.com')
    .upload(testVideoPath, {
      destination: uploadPath,
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          userId: userId,
          uploadedBy: 'test-script'
        }
      }
    });
  
  console.log('✅ Upload complete!\n');
  
  // 2. Create Firestore document (if Cloud Function doesn't do it)
  const videoRef = db.collection('climbVideos').doc(videoId);
  await videoRef.set({
    status: 'processing',
    userId: userId,
    originalPath: uploadPath,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: {
      fileName: path.basename(testVideoPath)
    }
  });
  
  console.log(`📝 Created Firestore document: /climbVideos/${videoId}\n`);
  console.log('⏳ Monitoring transcoding progress...\n');
  
  // 3. Monitor Firestore for status changes
  return new Promise((resolve, reject) => {
    const unsubscribe = videoRef.onSnapshot(async (snapshot) => {
      const data = snapshot.data();
      
      console.log(`📊 Status: ${data.status}`);
      
      if (data.status === 'ready') {
        console.log('\n✅ TRANSCODING COMPLETE!\n');
        console.log('📹 Transcoded versions:');
        data.transcodedVersions?.forEach(version => {
          console.log(`  - ${version.quality}: ${version.path}`);
        });
        
        // Verify transcoded file exists
        const transcodedPath = data.transcodedVersions?.[0]?.path;
        if (transcodedPath) {
          const [exists] = await storage
            .bucket('topomatch-pwa.appspot.com')
            .file(transcodedPath)
            .exists();
          
          console.log(`\n� Transcoded file exists in Storage: ${exists ? '✅ YES' : '❌ NO'}`);
          
          if (exists) {
            const [metadata] = await storage
              .bucket('topomatch-pwa.appspot.com')
              .file(transcodedPath)
              .getMetadata();
            
            console.log(`📏 File size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
          }
        }
        
        unsubscribe();
        resolve(data);
      } else if (data.status === 'failed') {
        console.log('\n❌ TRANSCODING FAILED!\n');
        console.error('Error:', data.error);
        unsubscribe();
        reject(new Error(data.error));
      }
    });
    
    // Timeout after 10 minutes
    setTimeout(() => {
      unsubscribe();
      reject(new Error('Transcoding timeout (10 minutes)'));
    }, 10 * 60 * 1000);
  });
}

// Run the test
const testVideoPath = process.argv[2] || './test-data/sample-climb.mp4';

simulateVideoUpload(testVideoPath)
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
```

#### Usage:

```bash
# With Firebase emulator (local testing)
cd server
npm install
firebase emulators:start

# In another terminal
node scripts/simulate-upload.js ./test-data/sample-hd-video.mp4
```

#### Expected Output:

```
🎬 Starting video upload simulation...

� Uploading test video to: videos/raw/test-user-123/test-video-1729425600000.mp4
✅ Upload complete!

📝 Created Firestore document: /climbVideos/test-video-1729425600000

⏳ Monitoring transcoding progress...

📊 Status: processing
📊 Status: processing
📊 Status: ready

✅ TRANSCODING COMPLETE!

📹 Transcoded versions:
  - sd: videos/transcoded/test-user-123/test-video-1729425600000/video.mp4

📦 Transcoded file exists in Storage: ✅ YES
📏 File size: 8.45 MB

🎉 Test completed successfully!
```

#### What This Tests:

✅ **Storage upload trigger** - Cloud Function detects new file  
✅ **Transcoder API call** - Job is created correctly  
✅ **Background processing** - Transcoding completes  
✅ **Storage output** - Transcoded file is written  
✅ **Firestore updates** - Status changes are tracked  
✅ **End-to-end flow** - Complete pipeline works  

#### Benefits:

- **No UI needed** - Test backend logic independently
- **Fast feedback** - See results in 1-3 minutes
- **Easy debugging** - Console logs show each step
- **Repeatable** - Run multiple times with different videos
- **CI-friendly** - Can be automated in tests

Once this works, **frontend integration is trivial** - just upload to Storage and read from Firestore!

---

## Next Steps for Implementation

1. ✅ Document current state (this file)
2. 🔲 Enable Transcoder API in GCP project
3. 🔲 Install `@google-cloud/video-transcoder` package
4. 🔲 Create test video file (`test-data/sample-climb.mp4`)
5. 🔲 Create `scripts/simulate-upload.js` test script
6. 🔲 Implement `transcodeVideo` Cloud Function
7. 🔲 Implement `onTranscodingComplete` Cloud Function
8. 🔲 **Run end-to-end test with test script** ⚡
9. 🔲 Debug and fix any issues
10. 🔲 Update Firestore schema for video metadata
11. 🔲 Implement frontend video upload
12. 🔲 Implement frontend video viewing
13. 🔲 Add optional debug badge
14. 🔲 Test with real phone recordings
15. 🔲 Deploy to production

---

## References

- [Cloud Transcoder API Documentation](https://cloud.google.com/transcoder/docs)
- [Transcoding Presets](https://cloud.google.com/transcoder/docs/concepts/overview#job_template)
- [Node.js Client Library](https://googleapis.dev/nodejs/video-transcoder/latest/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
