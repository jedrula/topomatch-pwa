# Completed Jobs Registry Architecture

## Problem
Video analysis jobs contain heavy objects (~80MB per job):
- 10 frames with ImageData (~8MB each)
- Pose detection results
- Feature matching data
- Scoring calculations

Keeping these jobs in memory after completion causes memory leaks.

## Solution: Completed Jobs Registry

After a job completes, we:

1. **Record completion with PRIMITIVES ONLY**
   ```javascript
   completionRegistry.value[ascentId] = {
     status: 'complete',           // string
     completedAt: 1234567890,      // number (timestamp)
     detectedProblemId: 'abc123',  // string
     topScore: 0.95,               // number
     topProblemName: 'Blue V3',    // string
   };
   ```

2. **Delete the full job object**
   ```javascript
   delete jobs.value[ascentId];  // Frees ~80MB!
   ```

## Memory Impact

| Before | After |
|--------|-------|
| Full job: ~80MB | Completion record: ~100 bytes |
| Frames kept in memory | Frames freed immediately |
| Memory grows with each upload | Memory stable across uploads |

## Benefits

### 1. Memory Safety ✅
- **Zero object references** - Only primitive values (strings, numbers, booleans)
- **Guaranteed cleanup** - No way for heavy objects to leak
- **Minimal footprint** - Each record is ~100 bytes vs ~80MB

### 2. Test Compatibility ✅
- Tests can check `status === 'complete'` even after job deleted
- No need to keep heavy job objects around for test assertions
- Clear separation: active jobs vs completed jobs

### 3. UI Flexibility ✅
- Can show "recently analyzed" without memory penalty
- Track completion timestamps for sorting/filtering
- Display detected problem info without keeping full job

## Usage

### Check if job completed:
```javascript
const job = getJob(ascentId);
if (job?.status === 'complete') {
  console.log(`Completed at: ${new Date(job.completedAt)}`);
  console.log(`Detected: ${job.topProblemName} (${job.topScore})`);
}
```

### In tests:
```javascript
// Check both active jobs AND completion registry
const analysisJobs = Object.values(analysisQueue.jobs);
const completionRegistry = analysisQueue.completionRegistry;
const completedJobs = Object.values(completionRegistry);

// Job might be active OR completed+deleted
const job = analysisJobs[0] || completedJobs[0];
if (job.status === 'complete') {
  // ✅ Test passes!
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Video Upload Flow                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  1. JOB CREATED (jobs.value[ascentId])                  │
│     - extractedFrames: [10 frames × 8MB = 80MB]         │
│     - comparisonImages: [...]                           │
│     - boulderProblems: [...]                            │
│     Status: 'detecting' → 'matching' → 'scoring'        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  2. JOB COMPLETES                                       │
│     status = 'complete'                                 │
│     All processing done ✅                               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  3. RECORD COMPLETION (primitives only!)                │
│     completionRegistry[ascentId] = {                    │
│       status: 'complete',        // ~10 bytes           │
│       completedAt: 1234567890,   // ~8 bytes            │
│       detectedProblemId: 'abc',  // ~20 bytes           │
│       topScore: 0.95,            // ~8 bytes            │
│       topProblemName: 'Blue V3'  // ~20 bytes           │
│     }                                                    │
│     Total: ~100 bytes ✅                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  4. DELETE JOB (memory cleanup!)                        │
│     delete jobs.value[ascentId]                         │
│     → Frees 80MB of ImageData                           │
│     → Frees all nested objects                          │
│     → JavaScript GC can collect everything              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  5. COMPLETION INFO STILL AVAILABLE                     │
│     Tests: Can check status === 'complete'              │
│     UI: Can show "recently analyzed"                    │
│     Memory: Only ~100 bytes per job ✅                   │
└─────────────────────────────────────────────────────────┘
```

## Critical Rules

### ✅ DO:
- Store primitive values only (strings, numbers, booleans, null)
- Delete full job immediately after recording completion
- Keep completion records lightweight (~100 bytes)

### ❌ DON'T:
- Store arrays in completion registry
- Store objects with nested data
- Keep references to frames, scores, or any heavy data
- Copy job object to completion registry

## Memory Leak Prevention

The key insight: **Even setting references to null doesn't free memory if the parent object stays in reactive store.**

```javascript
// ❌ THIS LEAKS:
job.extractedFrames = [];
job.imageData = null;
// Job still in jobs.value → frames still reachable → memory leak!

// ✅ THIS WORKS:
completionRegistry[id] = { status: 'complete', ... };  // Lightweight record
delete jobs.value[id];  // Job gone → frames freed → GC collects memory!
```

## Testing

Run memory leak test:
```bash
npx playwright test tests/user-journey-video-upload.spec.js --headed
```

Expected results:
- Cycle 1: 10 JSArrayBufferData (~80MB)
- Cycle 2: 10 JSArrayBufferData (~80MB) ← Previous freed!
- Cycle 3: 10 JSArrayBufferData (~80MB) ← Previous freed!

Memory should stay stable at ~90-100MB instead of growing to 250MB+.
