# Quick Memory Leak Analysis Guide

## Run Test with Heap Snapshots

```bash
npx playwright test tests/user-journey-video-upload.spec.js --headed
```

The test now automatically captures heap snapshots at the end of each upload cycle.

## Heap Snapshot Files

Look in `test-results/` folder for:
- `heap-snapshot-cycle-1-end.heapsnapshot`
- `heap-snapshot-cycle-2-end.heapsnapshot`
- `heap-snapshot-cycle-3-end.heapsnapshot`

## Analyze in Chrome DevTools

### Step 1: Load Snapshots
1. Open Chrome (any page)
2. Open DevTools (F12)
3. Go to **Memory** tab
4. Click **Load** button
5. Load `heap-snapshot-cycle-1-end.heapsnapshot`
6. Load `heap-snapshot-cycle-2-end.heapsnapshot`

### Step 2: Compare Snapshots
1. Select **cycle-2-end** snapshot
2. In the dropdown (top left), switch from "Summary" to **"Comparison"**
3. In the second dropdown, select **"cycle-1-end"** as baseline
4. Now you see **what grew by 80MB between cycle 1 and 2**!

### Step 3: Find the Leak
Sort by "Size Delta" (descending) to see what grew most:

**Look for:**
- `ImageData` objects (~8MB each)
- Arrays with 10 items (10 frames)
- Objects with names like: `extractedFrames`, `frames`, `job`, `imageData`

### Step 4: Find Who's Holding References
1. Click on a large ImageData object
2. Look at **"Retainers"** panel (bottom)
3. Follow the chain upward to see what's keeping it alive:

**Example retention path:**
```
ImageData (8MB)
  ← Array[10] (extractedFrames)
    ← Object (job)
      ← Object (jobs)
        ← Object (videoAnalysisQueueStore)
          ← Window
```

This tells you: **videoAnalysisQueueStore.jobs[id].extractedFrames is holding the ImageData**

### Step 5: Identify the Bug
Common patterns:
- Store not clearing `extractedFrames` array
- Event listener closure capturing frames
- Vue reactivity keeping stale references
- Canvas element not being garbage collected

## Quick Commands

### Check if cleanup code is running
```javascript
// Add to videoAnalysisQueueStore.js cleanup section:
console.log('🧹 CLEANUP CALLED:', {
  hasFrames: !!job.extractedFrames,
  frameCount: job.extractedFrames?.length,
  jobStatus: job.status
});
```

### Force garbage collection in test
```javascript
// In test, after cycle completes:
await page.evaluate(() => {
  if (window.gc) {
    window.gc();
    window.gc(); // Run twice to be sure
  }
});
await page.waitForTimeout(1000);
// Then take heap snapshot
```

### Check what's in memory right now
```javascript
// Run in browser console during test:
const store = window.__TEST_API__.getAnalysisQueue();
Object.entries(store.jobs).forEach(([id, job]) => {
  console.log(`Job ${id.slice(0,8)}:`, {
    status: job.status,
    frames: job.extractedFrames?.length || 0,
    frameSize: job.extractedFrames?.[0]?.imageData?.data?.length || 0
  });
});
```

## Expected Findings

If we have 10 frames at 8MB each still in memory:
1. Find them in heap snapshot
2. Check retainers → should point to `videoAnalysisQueueStore.jobs[id].extractedFrames`
3. Check why cleanup didn't run:
   - Did job reach 'complete' status?
   - Did cleanup code execute?
   - Did we clear the array but ImageData still referenced elsewhere?

## Next Steps After Analysis

Once you identify the retention path, we can:
1. Fix the store to properly clear references
2. Add explicit null assignments
3. Use `markRaw()` for non-reactive data
4. Remove event listeners properly
5. Call `URL.revokeObjectURL()` for blob URLs
