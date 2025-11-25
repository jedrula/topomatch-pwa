# Video Analysis Queue Store Refactor

## 📊 Current State Analysis

### What We Have Now

**Upload Queue** ✅ **GOOD** - Store-based
- `videoUploadQueueStore.js` manages all uploads
- Independent of component lifecycle
- Tracks progress, handles Storage operations
- Updates video status in Firestore

**Analysis Pipeline** ❌ **PROBLEM** - Component-based
- ALL logic in `VideoFrameMatcherEnhanced.vue` (~1600 lines)
- Frame extraction, pose detection, matching, scoring
- State tied to component lifecycle
- If component unmounts, state is lost

**Optimistic Upload** ✅ **NEW** - Partially working
- Ascent created immediately on video selection
- Upload starts in background
- Modal minimizes (v-show)
- Analysis runs while user browses

**Old Deferred Pattern** ❌ **OBSOLETE** - Can be removed
- `pendingAscentSubmission` in LocationDetailView
- Handled case where user submitted before detection
- No longer needed - we create ascent immediately now

## 🎯 The Problem

### Component Has Too Much Responsibility

```
VideoFrameMatcherEnhanced.vue (1606 lines):
├── Frame extraction [DOM-dependent] ❌
├── Pose detection [WASM, can move] ✅
├── Image matching [OpenCV, can move] ✅
├── Score calculation [Utils, already separate] ✅
├── Ascent updates [Service calls, can move] ✅
└── State management [Should be in store] ✅
```

### Issues

1. **Component lifecycle risk** - If unmounts, analysis state is lost
2. **No global visibility** - Can't track progress from outside
3. **Hard to coordinate** - Upload queue and analysis separate
4. **Not reusable** - Logic locked in component
5. **Difficult to test** - UI and logic mixed

## 🚀 The Solution

### Architecture: Store-Based Analysis

```
┌────────────────────────────────────────────────┐
│ VideoFrameMatcherEnhanced (Thin UI Layer)     │
│ - Render <video> element                      │
│ - Extract frames to ImageData                 │
│ - Push to analysisQueue                       │
│ - Display progress from store                 │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ videoAnalysisQueueStore (The Engine)          │
│ - Queue analysis jobs                         │
│ - Run pose detection on ImageData             │
│ - Run image matching                          │
│ - Calculate scores                            │
│ - Update ascents in Firestore                 │
│ - Track progress                              │
│ - Emit completion events                      │
└────────────────────────────────────────────────┘
```

### Critical Insight: Frame Extraction

**MUST stay in component** because it needs:
- `<video>` element in DOM
- Canvas API
- File → Video Element → Canvas → ImageData

**Everything else can move to store!**

## 📋 Refactored Flow

### 1. Video Selection (Component)

```javascript
handleVideoSelected(file) {
  // 1. Create ascent immediately
  const ascentId = generateAscentId();
  await ascentService.logAscent(locationId, null, {
    userId, locationId, date, notes: '',
    video: { status: 'uploading', fileName, fileSize },
    problemId: null, attemptType: null, userGrade: null
  }, ascentId);
  
  // 2. Queue upload (store-based)
  uploadQueue.startUpload(file, locationId, null, ascentId);
  
  // 3. Queue analysis job (NEW - store-based)
  analysisQueue.addJob({
    ascentId,
    videoFile: file,
    locationId,
    comparisonImages: props.comparisonImages
  });
  
  // 4. Minimize modal (user can browse)
  emit('minimize');
  
  // 5. Extract frames (DOM work - component responsibility)
  const frames = await extractVideoFrames(file);
  
  // 6. Push frames to store for processing
  analysisQueue.setFrames(ascentId, frames);
  
  // 7. Component done! Store takes over
}
```

### 2. Analysis Processing (Store)

```javascript
// videoAnalysisQueueStore.js
const processJob = async (job) => {
  if (!job.frames) {
    console.log('Waiting for frames...');
    return;
  }
  
  // Pose detection (WASM - no DOM)
  job.status = 'detecting';
  for (let i = 0; i < job.frames.length; i++) {
    const frame = job.frames[i];
    const poseData = await extractPoseKeypoints(frame.imageData);
    frame.poseData = poseData;
    job.progress = (i / job.frames.length) * 33;
  }
  
  // Image matching (OpenCV - no DOM)
  job.status = 'matching';
  const matches = await matchFramesToImages(
    job.frames, 
    job.comparisonImages
  );
  job.matchResults = matches;
  job.progress = 66;
  
  // Score calculation (pure math)
  job.status = 'scoring';
  const scores = calculateAggregatedProblemScores(
    job.frames,
    matches,
    job.comparisonImages
  );
  job.scores = scores;
  job.progress = 100;
  
  // Update ascent (Firestore)
  const winner = scores[0];
  if (winner.totalScore > 0.5) {
    await ascentService.updateAscent(job.ascentId, {
      problemId: winner.id,
      problemSnapshot: {
        name: winner.name,
        grade: winner.grade,
        color: winner.color
      },
      analysisMetadata: {
        detectedAt: new Date(),
        topScore: winner.totalScore,
        topProblemId: winner.id,
        allScores: scores.slice(0, 3)
      }
    });
  }
  
  job.status = 'complete';
  job.completedAt = Date.now();
  
  // Emit for notifications
  eventBus.emit('analysis-complete', {
    ascentId: job.ascentId,
    problem: winner
  });
};
```

### 3. Display Progress (Modal/UI)

```vue
<script setup>
const analysisQueue = useVideoAnalysisQueueStore();

// Get active job for this location
const activeJob = computed(() => {
  return Object.values(analysisQueue.jobs)
    .find(job => job.locationId === props.locationId && 
                 job.status !== 'complete');
});
</script>

<template>
  <div v-if="activeJob" class="progress">
    <div v-if="activeJob.status === 'detecting'">
      🔍 Detecting poses... {{ activeJob.progress }}%
    </div>
    <div v-else-if="activeJob.status === 'matching'">
      🎯 Matching images... {{ activeJob.progress }}%
    </div>
    <div v-else-if="activeJob.status === 'scoring'">
      📊 Calculating scores... {{ activeJob.progress }}%
    </div>
  </div>
</template>
```

## 🔧 Migration Strategy

### Phase 1: Create Store ✅ DONE
- [x] Created `videoAnalysisQueueStore.js`
- [x] Basic structure: addJob(), updateJobStatus(), getJob()
- [x] Pattern matches `videoUploadQueueStore`

### Phase 2: Extract Processing Logic (NEXT)
- [ ] Move pose detection calls to store
- [ ] Move image matching logic to store
- [ ] Move scoring logic to store (already in utils)
- [ ] Implement `processJob()` method in store
- [ ] Add `setFrames()` method to receive ImageData from component

### Phase 3: Slim Down Component (AFTER)
- [ ] Remove analysis logic from VideoFrameMatcherEnhanced
- [ ] Keep only: file input, frame extraction, progress display
- [ ] Component becomes ~200 lines instead of 1600
- [ ] Call analysisQueue methods instead of local processing

### Phase 4: Update UI (FINAL)
- [ ] BetaVideoUploadModal reads from analysisQueue
- [ ] LocationDetailView displays analysis progress
- [ ] Remove obsolete pendingAscentSubmission logic
- [ ] Add notification when analysis completes

### Phase 5: Cleanup (BONUS)
- [ ] Remove unused component state
- [ ] Remove duplicate event handlers
- [ ] Simplify modal prop passing
- [ ] Update documentation

## 🎨 Store API Design

### Job Structure

```javascript
{
  id: string,              // crypto.randomUUID()
  ascentId: string,        // Links to ascent document
  locationId: string,      // For filtering
  videoFile: File,         // Original video
  comparisonImages: Array, // Location images with problems
  
  // Status tracking
  status: 'queued' | 'waiting_frames' | 'detecting' | 
          'matching' | 'scoring' | 'complete' | 'error',
  progress: number,        // 0-100
  
  // Processing data
  frames: Array,           // ImageData + poseData
  matchResults: Array,     // Feature matches
  scores: Array,           // Problem scores
  
  // Metadata
  error: string | null,
  createdAt: number,
  completedAt: number | null
}
```

### Store Methods

```javascript
// Queue a new analysis job
addJob(ascentId, videoFile, locationId, comparisonImages) → jobId

// Provide extracted frames (called by component)
setFrames(ascentId, frames) → void (triggers processing)

// Get job by ascent ID
getJob(ascentId) → job | null

// Cancel a job
cancelJob(ascentId) → void

// Clear all (debugging)
clearAll() → void

// Computed properties
activeJobs → Array
completedJobs → Array
hasActiveJobs → boolean
getActiveJob → job | null (first active job)
```

## ✅ Benefits

### Before (Component-Based)

```
❌ 1600 line component
❌ State lost on unmount
❌ Hard to track externally
❌ Difficult to coordinate with upload
❌ Mixed UI and logic
❌ Hard to test
```

### After (Store-Based)

```
✅ ~200 line component (thin UI)
✅ State persists globally
✅ Observable from anywhere
✅ Easy coordination (both stores)
✅ Clean separation of concerns
✅ Testable stores
```

## 🧹 Code to Remove

### LocationDetailView.vue

```javascript
// REMOVE: Obsolete deferred pattern
const pendingAscentSubmission = ref(null);

// REMOVE: No longer needed
const handleDetectionComplete = async (detectionData) => {
  if (pendingAscentSubmission.value && detectionData?.winner) {
    // ... patching logic
  }
};

// REMOVE from template
@table-scores-ready="(data) => { 
  handleTableScoresReady(data); 
  handleDetectionComplete(data); // ← Remove this
}"
```

### VideoFrameMatcherEnhanced.vue

```javascript
// REMOVE: These become store responsibilities
const processingStatus = ref('');
const processingDetails = ref('');
const isProcessing = ref(false);
const transformedPoses = ref([]);
const featureMatches = ref([]);
const aggregatedProblemScores = ref([]);

// MOVE TO STORE: All processing logic
const processVideo = async () => { ... }
const updateAscentWithAnalysisResults = async () => { ... }
```

## 📝 Documentation Updates

### Files to Update

1. `PROJECT_CONTEXT.md` - Update architecture section
2. `ASCENT_SUBMISSION_FLOW.md` - Mark as outdated/archived
3. `DEFERRED_ASCENT_CREATION.md` - Mark as obsolete
4. Create `ANALYSIS_QUEUE_ARCHITECTURE.md` - New flow docs

## 🎯 Success Criteria

- [ ] Component can unmount, analysis continues
- [ ] Progress visible in modal from store
- [ ] Upload and analysis queues independent
- [ ] Notifications work on completion
- [ ] Code reduced from 1600 → ~200 lines in component
- [ ] All tests passing
- [ ] Documentation updated

## 🚨 Risks & Mitigations

### Risk 1: Frame Extraction Complexity
- **Risk**: Separating frame extraction from processing could break
- **Mitigation**: Keep extraction in component, use clear API to pass to store

### Risk 2: Worker Communication
- **Risk**: Pose detection workers might not work outside component
- **Mitigation**: Workers are already independent, just need ImageData

### Risk 3: State Synchronization
- **Risk**: Upload queue and analysis queue out of sync
- **Mitigation**: Both use ascentId as key, coordinate via Firestore updates

### Risk 4: Migration Bugs
- **Risk**: Breaking existing functionality during refactor
- **Mitigation**: Migrate incrementally, test each phase, keep old code until verified

## 📚 References

- `videoUploadQueueStore.js` - Pattern to follow
- `problemScoringUtils.js` - Scoring logic already extracted
- `poseDetection.js` - Config for pose detection
- `MODAL_MINIMIZE_SOLUTION.md` - v-show pattern

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Extract processing logic to store  
**Owner**: Development Team  
**Created**: November 25, 2025
