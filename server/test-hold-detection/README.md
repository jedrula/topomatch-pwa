# Hold Detection Server Tests

These test scripts validate the hold detection server implementation before deploying to production.

## Test Files

### `test-hold-detection.js`
Single image upload test - measures response time and validates the upload mechanism.

**Usage:**
```bash
HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection.js <image-path>
```

**Example:**
```bash
HOLD_DETECTION_SERVER_URL=https://49ba466c7e78.ngrok-free.app node test-hold-detection.js ../test-data/compressed-test-image.jpg
```

### `test-hold-detection-parallel.js`
Parallel upload test - validates server capacity under concurrent load.

**Usage:**
```bash
HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection-parallel.js <image-path> [count]
```

**Example:**
```bash
# Test with 4 parallel uploads (default)
HOLD_DETECTION_SERVER_URL=https://49ba466c7e78.ngrok-free.app node test-hold-detection-parallel.js ../test-data/compressed-test-image.jpg

# Test with 10 parallel uploads
HOLD_DETECTION_SERVER_URL=https://49ba466c7e78.ngrok-free.app node test-hold-detection-parallel.js ../test-data/compressed-test-image.jpg 10
```

## Test Results Summary

### Performance Benchmarks
- **Single upload:** ~6-7 seconds
- **4 parallel:** 9-25s (avg 18.7s) ✅
- **8 parallel:** 9-44s (avg 39.6s) ✅
- **10 parallel:** 8.5-54s (avg 42.2s) ✅
- **12 parallel:** 8.7-64s (avg 49.8s) - can be flaky

### Key Findings
1. **Processing time is consistent:** ~4.5-5.0 seconds regardless of load
2. **Response time increases with queue depth:** More concurrent requests = longer wait times
3. **Server handles 10 concurrent requests reliably**
4. **At 12+ concurrent requests:** Connection errors may occur (ngrok/server limit)
5. **All results are valid:** Every successful job detected 211 holds with compressed test image

### Implementation Validation
✅ **Buffer approach works** - Using `form-data` package with Buffer + `getHeaders()`  
✅ **File compression critical** - Images compressed to ~500KB (max 2MB) before upload  
✅ **Firebase function matches test implementation** - Proven pattern deployed to production

## Dependencies

```bash
cd server
npm install form-data node-fetch
```

## Notes

- These tests use the same Buffer + FormData pattern as the Firebase Cloud Function
- The ngrok URL changes frequently - update `HOLD_DETECTION_SERVER_URL` accordingly
- For production, the Firebase function reads the URL from `.env.local` or `.env.production`
