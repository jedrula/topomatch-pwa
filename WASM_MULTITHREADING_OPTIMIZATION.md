# WebAssembly Multi-threading Optimization

## Problem

User was seeing these warnings in production:

```
env.wasm.numThreads is set to 4, but this will not work unless you enable crossOriginIsolated mode.
WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading.
```

This means ONNX Runtime (AI inference engine) was trying to use 4 threads but **couldn't** because Cross-Origin Isolation wasn't enabled. It fell back to single-threaded mode, making image analysis significantly slower.

## Solution: Enable Cross-Origin Isolation

### What is Cross-Origin Isolation?

Cross-Origin Isolation is a security feature that allows your web app to use powerful features like:
- **SharedArrayBuffer** (required for WebAssembly multi-threading)
- High-resolution timers
- Better performance isolation

### Changes Made

Added HTTP headers to `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Embedder-Policy",
            "value": "require-corp"
          },
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin"
          }
        ]
      }
    ]
  }
}
```

### What These Headers Do

1. **Cross-Origin-Embedder-Policy: require-corp**
   - Ensures all cross-origin resources are loaded with CORS or CORP headers
   - Prevents loading resources that don't opt-in to being embedded

2. **Cross-Origin-Opener-Policy: same-origin**
   - Ensures the browsing context is isolated
   - Prevents other windows from accessing your window object

### Expected Performance Improvement

**Before**: ONNX Runtime uses **1 thread** (fallback mode)
**After**: ONNX Runtime uses **4 threads** (multi-threading enabled)

This should make image matching analysis **~2-4x faster** depending on the device.

### Potential Side Effects

⚠️ **Important**: These headers have security implications:

1. **External Resources**: All cross-origin images, scripts, and iframes must:
   - Either be same-origin
   - Or include `crossorigin` attribute and proper CORS headers

2. **Firebase Storage Images**: Should work fine because:
   - Firebase Storage already supports CORS
   - We already configured CORS in `cors.json`

3. **External APIs**: Any external resources need proper CORS configuration

### Testing Cross-Origin Isolation

After deployment, check if it's working:

```javascript
// In browser console
console.log(crossOriginIsolated); // Should return true
```

Or check the warnings - they should disappear!

### Troubleshooting

If you see errors like:
```
Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
```

This means a resource doesn't have proper CORS headers. Solutions:

1. **For images**: Add `crossorigin="anonymous"` attribute
   ```vue
   <img src="https://example.com/image.jpg" crossorigin="anonymous">
   ```

2. **For scripts**: Add `crossorigin` attribute
   ```html
   <script src="https://example.com/script.js" crossorigin></script>
   ```

3. **For Firebase Storage**: Already configured via `cors.json`

### References

- [Web.dev: Cross-Origin Isolation Guide](https://web.dev/cross-origin-isolation-guide/)
- [MDN: Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
- [ONNX Runtime WebAssembly](https://onnxruntime.ai/docs/tutorials/web/)

## Alternative: Disable Multi-threading Warning

If Cross-Origin Isolation causes issues, you can disable the WASM multi-threading:

```javascript
// In inferenceStore.js
const session = await ort.InferenceSession.create(modelArrayBuffer, {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
  executionMode: 'sequential',
  extra: {
    // Disable multi-threading to avoid warnings
    numThreads: 1
  }
});
```

But this is **NOT recommended** as it makes inference slower.

## Parallelization (Separate from Multi-threading)

**Current**: Images are analyzed sequentially (one after another)
**Possible**: Could process multiple images in parallel

However, this is **different** from WASM multi-threading:
- WASM multi-threading: Makes **each** image analysis faster (uses 4 CPU cores)
- Parallelization: Analyzes **multiple** images simultaneously

For now, enabling WASM multi-threading (via Cross-Origin Isolation) is the bigger win.

### Why Not Parallelize Image Processing?

1. **Memory constraints**: Processing multiple images with AI models uses significant RAM
2. **Browser limits**: Most browsers limit concurrent Web Workers
3. **Diminishing returns**: Each inference already uses all available cores (with multi-threading)
4. **Complexity**: Would require managing multiple inference sessions

**Recommendation**: Enable Cross-Origin Isolation first, measure performance, then decide if parallelization is needed.
