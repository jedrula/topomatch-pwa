# Memory Leak Analysis - E2E Test

## Problem
3-cycle upload test shows consistent **~80MB memory growth per cycle**:
- Cycle 1 end: ~90MB
- Cycle 2 end: ~170MB (+80MB)
- Cycle 3 end: ~250MB (+80MB)

Suspicion: 10 video frames with ImageData (~8MB each) not being garbage collected.

## Memory Profiling Tools

### 1. Chrome DevTools Memory Profiler

**Setup:**
1. Run test with `--headed --debug` 
2. Open DevTools → Memory tab
3. Take heap snapshots at key moments

**Script to add breakpoints:**
```javascript
// In test file, add:
await page.evaluate(() => debugger); // Pause for manual heap snapshot
```

### 2. Automated Heap Snapshots via CDP

Use Chrome DevTools Protocol to capture heap snapshots programmatically:

```javascript
// In test file
const client = await page.context().newCDPSession(page);

// Take heap snapshot
await client.send('HeapProfiler.takeHeapSnapshot', {
  reportProgress: false,
  captureNumericValue: true
});

// Listen for snapshot chunks
client.on('HeapProfiler.addHeapSnapshotChunk', (params) => {
  // Save params.chunk to file
});
```

### 3. Memory Timeline Recording

```javascript
// Start recording memory timeline
await client.send('HeapProfiler.startSampling', {
  samplingInterval: 32768 // bytes
});

// ... run test cycles ...

// Stop and get profile
const { profile } = await client.send('HeapProfiler.stopSampling');
fs.writeFileSync('memory-profile.heapprofile', JSON.stringify(profile));
```

## Analysis Workflow

### Step 1: Capture Snapshots at Key Points
```javascript
const snapshots = [];

// Before upload 1
snapshots.push(await takeSnapshot('before-cycle-1'));

// After upload 1 complete
snapshots.push(await takeSnapshot('after-cycle-1'));

// After upload 2 complete  
snapshots.push(await takeSnapshot('after-cycle-2'));

// After upload 3 complete
snapshots.push(await takeSnapshot('after-cycle-3'));
```

### Step 2: Compare Snapshots
Use Chrome DevTools to compare snapshots:
1. Load snapshot in DevTools
2. Switch to "Comparison" view
3. Compare cycle 2 vs cycle 1 → See what grew by 80MB
4. Filter by "Retained Size" descending

### Step 3: Identify Retention Path
For leaked objects:
1. Find ImageData or Frame objects
2. Click to see "Retainers" panel
3. Follow the retention path up to the root
4. Identify which store/component is holding the reference

## Smart Analysis with heapsnapshot-parser

```bash
npm install -g heapsnapshot-parser
```

```javascript
// Generate and analyze
const fs = require('fs');
const { parseSnapshot } = require('heapsnapshot-parser');

const snapshot = JSON.parse(fs.readFileSync('heap-cycle-2.heapsnapshot'));
const parsed = parseSnapshot(snapshot);

// Find all ImageData objects
const imageDatas = parsed.nodes.filter(n => 
  n.className === 'ImageData' || 
  n.name?.includes('imageData')
);

console.log(`Found ${imageDatas.length} ImageData objects`);
imageDatas.forEach(node => {
  console.log(`- Size: ${node.retainedSize} bytes`);
  console.log(`  Retained by:`, node.retainers.map(r => r.name));
});
```

## Implementation Plan

### Option A: Manual Snapshots (Quick)
1. Add `await page.evaluate(() => debugger);` after each cycle
2. Run test in headed mode
3. Manually take 3 heap snapshots
4. Compare in DevTools
5. Find retention path

### Option B: Automated Snapshots (Better)
1. Modify test to use CDP for heap snapshots
2. Save `.heapsnapshot` files for each cycle
3. Load in DevTools or use heapsnapshot-parser
4. Automated diff analysis

### Option C: Memory Allocation Timeline (Best for finding allocator)
1. Start allocation profiling before test
2. Run all 3 cycles
3. Stop profiling
4. Analyze which functions allocated the leaked memory

## Expected Findings

**Hypothesis 1: Store holding frame references**
- Retention path: `Window → Pinia → videoAnalysisQueueStore → jobs → extractedFrames[]`
- Fix: Ensure cleanup code actually runs and GC can collect

**Hypothesis 2: Event listener closures**
- Retention path: `Window → EventTarget → closure → captured frames`
- Fix: Remove event listeners properly

**Hypothesis 3: Vue reactivity keeping refs**
- Retention path: `Window → Vue → reactive → frames`
- Fix: Use `markRaw()` or clear refs explicitly

**Hypothesis 4: Canvas/ImageData not released**
- Retention path: `Window → HTMLCanvasElement → ImageData`
- Fix: Explicitly null out canvas references

## Next Steps

Which approach do you want to try first?
1. **Quick**: Add debugger breakpoints, manual snapshots (5 min)
2. **Automated**: CDP heap snapshots in test (30 min)
3. **Deep**: Allocation timeline profiling (1 hour)

I recommend starting with #1 to quickly see what's holding the memory.
