# Firebase Storage CORS Configuration

## Problem
When using `fetch()` to access Firebase Storage images from the browser (e.g., for hold detection server), you may encounter CORS errors like:
```
Access to fetch at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution
Configure CORS on your Firebase Storage bucket to allow requests from your domains.

## Setup Steps

### 1. Install Google Cloud SDK (if not already installed)
```bash
# macOS
brew install google-cloud-sdk

# Other platforms: https://cloud.google.com/sdk/docs/install
```

### 2. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud config set project topomatch-pwa
```

### 3. Apply CORS Configuration
The `cors.json` file in the project root contains the CORS configuration:

```bash
gsutil cors set cors.json gs://topomatch-pwa.firebasestorage.app
```

### 4. Verify Configuration
```bash
gsutil cors get gs://topomatch-pwa.firebasestorage.app
```

## CORS Configuration Details

The `cors.json` file allows:
- **Origins**: Production domains and local development ports
- **Methods**: GET, HEAD, OPTIONS
- **Headers**: Content-Type and CORS headers
- **Cache**: 1 hour (3600 seconds)

## When to Reconfigure
- Adding new domains (staging, new production domains)
- Setting up new environments
- If CORS errors appear in browser console

## Testing
After applying CORS configuration, test with:
1. Open browser dev tools → Network tab
2. Try "Detect Holds (Server)" functionality
3. Should see successful requests without CORS errors

## Troubleshooting
- Make sure you're authenticated with the correct Google Cloud project
- Verify the bucket name matches your Firebase project
- CORS changes take effect immediately, no caching delay
- Use browser incognito mode to test without cache interference
