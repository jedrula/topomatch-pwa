# WASM Multi-Threading Optimization Summary

## Final Configuration (Oct 30, 2025)

### Thread Configuration
- **Pose Detection (YOLOv8)**: 4 threads
- **Image Matching (SuperPoint + LightGlue)**: 6 threads
- **Mobile & Desktop**: Same aggressive configuration (tested safe)

### Memory Optimizations
- **enableMemPattern**: `true` (12% performance improvement)
- **enableCpuMemArena**: `true` (faster memory allocations)
- **Applied to**: All devices (mobile and desktop)

## Performance Results

### Baseline (Single Thread)
- **Total Time**: 57 seconds
- **Pose Detection**: 765ms/frame
- **Image Matching**: 6.71s/image

### Optimized (Multi-Thread + Memory Opts)
- **Total Time**: ~14 seconds
- **Pose Detection**: 325ms/frame (2.35x faster)
- **Image Matching**: 1.28s/image (5.25x faster)
- **Overall Speedup**: 4.07x

### Memory Usage (Tested)
- **Total Memory**: 502.5 MB
  - Main Thread: 268.3 MB (53%)
  - Workers: 234.2 MB (47%)
- **Verdict**: ✅ Safe for mobile (well under 1GB browser limit)

## Thread Count Testing Results

### Pose Detection (YOLOv8n-pose)
- **1 thread**: 765ms/frame (baseline)
- **4 threads**: 325ms/frame ⭐ OPTIMAL
- **6 threads**: 380ms/frame (slower - diminishing returns)

### Image Matching (SuperPoint + LightGlue)
- **1 thread**: 6.71s/image (baseline)
- **4 threads**: 1.52s/image
- **6 threads**: 1.28s/image ⭐ OPTIMAL

## Configuration Details

### Cross-Origin Isolation (Required for Multi-Threading)
```javascript
// vite.config.js
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}
```

### Worker Configuration
```javascript
// Pose Detection Worker
ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 1);

await ort.InferenceSession.create(MODEL_PATH, {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'extended',
  enableMemPattern: true,
  enableCpuMemArena: true,
  wasm: {
    numThreads: 4,
    simd: true,
    threads: true,
  },
});

// Image Matching Worker  
const threadCount = Math.min(6, navigator.hardwareConcurrency || 1);

await ort.InferenceSession.create(MODEL_PATH, {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
  enableMemPattern: true,
  enableCpuMemArena: true,
  wasm: {
    numThreads: 6,
    simd: true,
    threads: true,
  },
});
```

## Performance Monitoring

### Memory API
Uses `performance.measureUserAgentSpecificMemory()` (requires Cross-Origin Isolation):
- ✅ Measures total memory including workers
- ✅ Breaks down main thread vs worker memory
- ✅ Gracefully falls back to `performance.memory` (main thread only)

### Console Logging
Performance boxes log after each major operation:
- Video processing (frame extraction + pose detection)
- Image matching analysis
- Includes timing, throughput, and memory breakdown

## Mobile Deployment

### Decision: Aggressive Configuration Safe ✅
- 502 MB total memory well within limits
- Modern mobile devices (4-6GB RAM) handle easily
- Browser web app limits: 500-1000 MB typical
- No device-specific branching needed

### Battery Impact
- Multi-threading completes work 4x faster
- **Less total battery drain** (shorter runtime > fewer threads)
- Modern mobile CPUs handle multi-core workloads efficiently

## DevTools Impact

⚠️ **Important**: Close DevTools for accurate benchmarking
- DevTools open: 35-62% slower
- Memory profiling adds significant overhead
- Production performance unaffected

## Key Learnings

1. **YOLOv8 has diminishing returns beyond 4 threads**
   - 6 threads actually slower than 4
   - Model architecture doesn't parallelize well beyond 4

2. **SuperPoint + LightGlue scales well to 6 threads**
   - Different model architecture
   - Better parallelization potential

3. **Memory optimizations provide measurable speedup**
   - 12% faster image matching
   - No mobile stability issues at 502 MB

4. **Sequential execution prevents resource contention**
   - Pose detection runs alone
   - Image matching runs alone
   - No need to limit total thread pool

5. **Cross-Origin Isolation enables modern APIs**
   - Multi-threading (SharedArrayBuffer)
   - Comprehensive memory measurement
   - Required for production PWA deployment

## Related Documentation
- `PERFORMANCE_BENCHMARKS.md` - Detailed test results
- `FIREBASE_VIDEO_TRANSCODE_SETUP.md` - Video processing setup
- `PROJECT_CONTEXT.md` - Overall architecture
