# Video Transcoding POC - Implementation Progress

## ✅ Completed Steps (1-6)

### Step 1: GCP Project & API Setup ✅
- **Project ID confirmed:** `topomatch-pwa`
- **Transcoder API enabled:** `transcoder.googleapis.com` 
- **Region configured:** `europe-west1` (matches Firebase eur3)

### Step 2: Dependencies Installed ✅
```bash
npm install @google-cloud/video-transcoder @google-cloud/storage
```
- Both packages installed successfully in `server/`

### Step 3: Test Video Ready ✅
- Using existing test video: `test-data/FLOW_IMG_8013.mov`
- Multiple test videos available in test-data folder

### Step 4: Test Script Created ✅
- **File:** `server/scripts/simulate-upload.js`
- **Features:**
  - Uploads video to `videos/raw/{userId}/{videoId}.mp4`
  - Creates Firestore document in `/climbVideos/{videoId}`
  - Monitors status changes in real-time
  - Reports file sizes and compression stats
  - 10-minute timeout for transcoding

### Step 5: transcodeVideo Cloud Function ✅
- **File:** `server/src/videoTranscoding.ts`
- **Trigger:** Storage `onObjectFinalized` on `videos/raw/**`
- **Features:**
  - Validates video content type
  - Extracts userId and videoId from path
  - Creates/updates Firestore document
  - Calls Transcoder API with SD-only config (480p @ 1 Mbps)
  - Stores job ID in Firestore
  - Error handling and logging

### Step 6: onTranscodingComplete Cloud Function ✅
- **File:** `server/src/videoTranscoding.ts`
- **Trigger:** Storage `onObjectFinalized` on `videos/transcoded/**`
- **Features:**
  - Detects when transcoded video.mp4 is written
  - Updates Firestore status to "ready"
  - Stores transcoded version metadata
  - Calculates file size
  - Error handling and logging

## 📋 Implementation Details

### Storage Structure:
```
gs://topomatch-pwa.appspot.com/
├── videos/
│   ├── raw/                    # Trigger: transcodeVideo
│   │   └── {userId}/
│   │       └── {videoId}.mp4
│   └── transcoded/             # Trigger: onTranscodingComplete
│       └── {userId}/
│           └── {videoId}/
│               └── video.mp4    # 480p SD output
```

### Firestore Schema:
```
/climbVideos/{videoId}
  - status: 'processing' | 'ready' | 'failed'
  - userId: string
  - originalPath: string
  - uploadedAt: timestamp
  - processingStartedAt: timestamp
  - processingCompletedAt: timestamp
  - transcodingJobId: string
  - transcodedVersions: [{
      quality: 'sd',
      path: string,
      size: number,
      bitrate: 1000000,
      resolution: '480p'
    }]
```

### Transcoding Configuration:
- **Input:** Any video format uploaded to raw path
- **Output:** Single MP4 file (480p, H.264, AAC audio)
- **Bitrate:** 1 Mbps video, 128 kbps audio
- **Frame rate:** 30 fps
- **Resolution:** 854x480 (16:9 aspect ratio)

## 🔄 Next Steps (7-15)

### Step 7: Run End-to-End Test 🎯
**Ready to execute!** Once you compile TypeScript and deploy functions:
```bash
cd server
npm run build  # Compile TypeScript
npm run deploy:functions  # Deploy to Firebase

# Then run the test
node scripts/simulate-upload.js ../test-data/FLOW_IMG_8013.mov
```

Expected flow:
1. Script uploads video → Storage
2. `transcodeVideo` function triggers → Creates job
3. Google transcodes video (1-3 minutes)
4. Transcoded video written → Storage
5. `onTranscodingComplete` function triggers → Updates Firestore
6. Script detects status change → Reports success

### Step 8: Debug & Fix Issues
- Monitor Cloud Function logs
- Check Transcoder API responses
- Verify Storage paths
- Validate Firestore updates

### Steps 9-15: Frontend & Production
After backend testing succeeds, proceed with:
- Firestore security rules
- Frontend upload component
- Video viewing with fallback
- Debug badge
- Real iPhone video testing
- Production deployment

## ⚠️ Pre-Test Checklist

Before running the test, ensure:
- [ ] TypeScript compiled (`npm run build` in server/)
- [ ] Cloud Functions deployed (`npm run deploy:functions`)
- [ ] Test video exists at `../test-data/FLOW_IMG_8013.mov`
- [ ] GCP project has Transcoder API enabled ✅
- [ ] Firebase Storage bucket accessible ✅

## 🎯 Success Criteria

The POC is successful when:
1. ✅ Test script uploads video without errors
2. ✅ `transcodeVideo` function creates Transcoder job
3. ✅ Video transcodes successfully (1-3 minutes)
4. ✅ `onTranscodingComplete` updates Firestore
5. ✅ Transcoded file exists in Storage
6. ✅ File size significantly reduced (target: 50-70% smaller)
7. ✅ Script reports completion with stats

## 📊 Expected Results

For a typical 1-minute iPhone video:
- **Original:** ~150-200 MB (1080p)
- **Transcoded:** ~7-10 MB (480p SD)
- **Reduction:** ~95% smaller file size
- **Quality:** Acceptable for mobile viewing
- **Cost:** ~$0.015 per video

This dramatic size reduction = **snappy UX** for users! 🚀
