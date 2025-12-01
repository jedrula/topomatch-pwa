# Add Heap Snapshots to Test

Add this code to `tests/user-journey-video-upload.spec.js`:

## 1. Add imports at top:
```javascript
import fs from 'fs';
```

## 2. Add heap snapshot helper after captureMemory function:
```javascript
// 🔬 HEAP SNAPSHOT: Capture heap snapshot for detailed analysis
let cdpSession;
const heapSnapshots = [];

const takeHeapSnapshot = async (label) => {
  try {
    if (!cdpSession) {
      cdpSession = await page.context().newCDPSession(page);
    }

    console.log(`   🔬 Taking heap snapshot: ${label}...`);
    
    let snapshotData = '';
    const chunkHandler = (params) => {
      snapshotData += params.chunk;
    };
    
    cdpSession.on('HeapProfiler.addHeapSnapshotChunk', chunkHandler);
    
    await cdpSession.send('HeapProfiler.takeHeapSnapshot', {
      reportProgress: false,
      captureNumericValue: true
    });
    
    cdpSession.off('HeapProfiler.addHeapSnapshotChunk', chunkHandler);
    
    const filename = `heap-snapshot-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.heapsnapshot`;
    const filepath = path.resolve(`./test-results/${filename}`);
    
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, snapshotData);
    heapSnapshots.push({ label, filepath, size: snapshotData.length });
    
    console.log(`   ✅ Saved: ${filename} (${(snapshotData.length / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.warn(`   ⚠️  Failed to take heap snapshot: ${error.message}`);
  }
};
```

## 3. Add snapshot call after each cycle completes:
```javascript
// After this line:
const cycleEndMemory = await captureMemory(`Upload ${uploadNum} complete`);

// Add:
await takeHeapSnapshot(`cycle-${uploadNum}-end`);
```

## 4. Add summary at end (before "TEST PASSED"):
```javascript
// Print heap snapshot locations
if (heapSnapshots.length > 0) {
  console.log('\n🔬 HEAP SNAPSHOTS:');
  heapSnapshots.forEach(s => console.log(`   ${s.label}: ${s.filepath}`));
  console.log('\nAnalyze with: See HEAP_SNAPSHOT_ANALYSIS.md');
}
```

## 5. Run test:
```bash
npx playwright test tests/user-journey-video-upload.spec.js --headed
```

## 6. Analyze snapshots:
See `HEAP_SNAPSHOT_ANALYSIS.md` for detailed instructions.
