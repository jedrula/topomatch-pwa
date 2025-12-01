# E2E Test Configuration

## Video Upload Memory Leak Test

**File**: `tests/user-journey-video-upload.spec.js`

### Configuration

The test can be configured to run any number of sequential upload cycles by changing **one number**:

```javascript
// 🎯 CONFIGURATION: Change this number to test different cycle counts
const NUM_UPLOADS = 5;  // ← Change this to 3, 5, 10, etc.
```

**Location**: Line ~50 in the test file (top of the test function)

### What Changes Automatically

When you change `NUM_UPLOADS`, the following adapt automatically:

1. **Test description**: "Starting Real User Journey Test - N Sequential Uploads"
2. **Upload loop**: Runs exactly N cycles
3. **Console output**: Shows "UPLOAD CYCLE X/N" for each cycle
4. **Memory analysis**: Compares all N cycles dynamically
5. **Leak detection**: Calculates average growth across all cycles
6. **Acceptable growth threshold**: Scales to `50% × N` (allows 50% growth per upload)

### Memory Leak Detection

**Simple approach**: Memory should **stabilize** after cleanup, not grow each cycle.

Expected behavior:
- **During processing**: Memory spikes to ~350 MB (ML models, video frames)
- **After cleanup**: Memory returns to ~180-220 MB baseline
- **Between cycles**: Average growth should be ~0 MB (within ±10 MB fluctuation)

Thresholds:
- **Leak threshold**: 10 MB average growth per cycle
- **Max stable memory**: 220 MB after cleanup (end of each cycle)
- **Pass criteria**: Memory doesn't grow cycle-to-cycle AND cleans up properly

### Example Output (5 cycles)

```
🎬 Starting Real User Journey Test - 5 Sequential Uploads...

📊 This test will:
   1. Upload video → wait for complete processing
   2. Upload again video → wait for complete processing
   3. Upload again video → wait for complete processing
   4. Upload again video → wait for complete processing
   5. Upload again video → wait for complete processing

...

� Memory After Each Upload Cycle:
   Cycle 1: 192.8 MB (+13.0 MB)
   Cycle 2: 193.2 MB (+0.4 MB)
   Cycle 3: 194.1 MB (+0.9 MB)
   Cycle 4: 193.8 MB (-0.3 MB)
   Cycle 5: 194.5 MB (+0.7 MB)

🔬 Leak Detection:
   Average cycle-to-cycle change: +0.4 MB
   Peak memory (end of cycles): 194.5 MB
   ✅ Memory stable - no leak detected

📊 Overall:
   Baseline: 179.8 MB
   Final: 194.5 MB
   Net change: +14.7 MB
```

### Running the Test

```bash
# Run with 5 uploads (as configured)
npx playwright test tests/user-journey-video-upload.spec.js --headed

# To change, edit NUM_UPLOADS at top of test file, then run again
```

### Implementation Notes

- **No hardcoded assumptions**: All logic adapts to `NUM_UPLOADS`
- **Single source of truth**: Only ONE place to change the number
- **Scalable**: Works for 1, 3, 5, 10, or any number of cycles
- **Memory cleanup**: Verified by checking cycle-to-cycle growth stays near 0 MB

### Test Architecture Fixed

**Critical Fix** (Dec 1, 2025): Exposed `completionRegistry` in Test API (`src/main.js`)
- Tests can now see completed jobs after deletion from active queue
- Memory cleanup works without breaking test visibility
- Each cycle tracked independently by `ascentId`
