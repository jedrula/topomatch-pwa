# Detection Server Response Debug Files

This directory contains raw JSON responses from the hold detection server for inspection and analysis.

## Purpose

When a location image is uploaded, the Cloud Function:
1. Downloads the image from Firebase Storage
2. Uploads it to the detection server at `/api/v1/process`
3. Polls `/api/v1/status/{job_id}` until completion
4. **Saves the raw response here** for inspection
5. Maps the response to Firestore format

## File Format

Each file is named: `response-{timestamp}.json`

Example:
```json
{
  "timestamp": "2025-10-27T12:34:56.789Z",
  "imageId": "abc123",
  "locationId": "xyz789",
  "rawResponse": {
    "holds": [...],
    "viewBox": "...",
    "metadata": {...}
  },
  "holdsCount": 15,
  "sampleHold": {
    // First hold from the response for quick inspection
  }
}
```

## Usage

1. **Upload a location image** through the UI
2. **Check this directory** for the new response file
3. **Inspect the structure** to understand what fields the server returns
4. **Update TypeScript types** in `src/types/holdDetection.ts` if needed
5. **Update mapping logic** in `holdDetection.ts` to match actual structure

## Example Analysis

```bash
# View the latest response
cd server/src/detection-responses
cat $(ls -t | head -1) | jq .

# Check what fields are on holds
cat $(ls -t | head -1) | jq '.sampleHold'

# See if bbox is array or object
cat $(ls -t | head -1) | jq '.sampleHold.bbox'
```

## Next Steps After Inspection

Once you understand the actual response structure:
1. Create proper TypeScript interfaces (no `as any` needed)
2. Remove fallback logic (||, default values) if fields are guaranteed
3. Add validation only where the server format genuinely varies
4. Update this README with actual structure documentation
