# Diagnostic Reporting - Testing Guide

## What Was Built

A lightweight diagnostic reporting system for debugging upload failures on remote devices (e.g., iPhone 17 Pro tester).

### Components Created:

1. **`src/services/diagnostics.js`** - Ring-buffer logging service
   - Keeps last 200 log entries in memory
   - Auto-captures device info (model, OS, memory, storage, network)
   - Creates reports with last 50 logs + device context

2. **`src/components/DiagnosticReporter.vue`** - User-facing modal
   - Simple textarea for optional user comments
   - Auto-attaches device info and logs
   - Saves to Firestore `diagnosticReports` collection

3. **`src/components/VideoAnalysisIndicator.vue`** - Integration point
   - Shows red error state when upload fails
   - "Report" button appears on failed uploads
   - One-tap diagnostic submission

### How It Works:

```
Upload Fails → Red Error Indicator → User Taps "Report" → Modal Opens → 
User Adds Comment (optional) → Send → Firestore → You See Diagnostics
```

## Testing Locally

### 1. Trigger Upload Failure

Temporarily break the upload to test the failure flow:

```javascript
// In src/stores/videoUploadQueueStore.js, around line 56
async uploadVideo(ascentId, file) {
  // Force failure for testing
  throw new Error('Test upload failure');
  
  // ... rest of function
}
```

### 2. Expected Behavior:

1. Upload a video from ascent creation
2. See the floating indicator turn **red**
3. Status text: "Upload Failed"
4. Detail text: "Tap Report to help us fix this"
5. Click the indicator → Opens video list
6. Click "Report" button → Opens diagnostic modal
7. Add optional comment → Click "Send Report"
8. Check Firestore `diagnosticReports` collection

### 3. Verify Collected Data:

In Firebase Console, check `diagnosticReports` collection:

```json
{
  "userId": "...",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "userComment": "Upload keeps crashing on my iPhone 17 Pro",
  "context": {
    "uploadId": "...",
    "fileName": "video.mov",
    "fileSize": 12345678,
    "error": "Test upload failure",
    "timestamp": "..."
  },
  "deviceInfo": {
    "platform": "ios",
    "model": "iPhone17,1",
    "osVersion": "18.2",
    "appVersion": "1.0.0",
    "memory": {...},
    "storage": {...},
    "connection": "wifi"
  },
  "logs": [
    { "timestamp": "...", "level": "info", "message": "Upload started", "context": {...} },
    { "timestamp": "...", "level": "error", "message": "Upload failed", "context": {...} }
  ]
}
```

## Testing on Real Device (iPhone 17 Pro)

### 1. Deploy to TestFlight:

```bash
# Build for iOS
npm run build

# Sync Capacitor
npx cap sync ios

# Open Xcode, archive, upload to TestFlight
```

### 2. Ask Tester To:

1. Try uploading a video that previously crashed
2. When it fails, tap the red error indicator
3. Tap the "Report" button
4. Optionally add comment: "This is the crash I reported"
5. Tap "Send Report"

### 3. You'll Receive:

- **Firestore Report**: Device info, logs, error context
- **Crashlytics Report** (if native crash): Stack trace, device state

## What You'll Learn:

From the diagnostic reports, you can see:

- **Device Model**: iPhone17,1 (iPhone 17 Pro)
- **Available Storage**: Is device full?
- **Memory Pressure**: Low memory warnings?
- **File Size/Type**: Is it a huge ProRes video?
- **Network State**: Was it uploading on cellular vs WiFi?
- **Recent Logs**: What happened before the crash?
- **Error Messages**: Exact Firebase error codes

## Common Issues to Look For:

1. **Storage Full**: `storage.available < fileSize`
2. **Memory Pressure**: Large video files on iOS
3. **ProRes Format**: iPhone 15+ can record in ProRes (huge files)
4. **Network Timeouts**: Slow cellular upload
5. **Firebase Quota**: Free tier limits

## Remove Test Failure:

```javascript
// In src/stores/videoUploadQueueStore.js
async uploadVideo(ascentId, file) {
  // Remove this line:
  // throw new Error('Test upload failure');
  
  // ... rest of function works normally
}
```

## Production Considerations:

### Privacy:
- Reports include device model, OS version, memory/storage stats
- NO personally identifiable info (no emails, names, locations in device data)
- User comments are optional and user-provided

### Performance:
- Ring-buffer is memory-efficient (200 entries max, ~50KB)
- Only sends data when user taps "Report" (not automatic)
- Firestore writes are minimal (1 write per report)

### Scalability:
- Firestore free tier: 20K writes/day (plenty for diagnostic reports)
- If you get more reports, add Firestore indexes for querying
- Consider adding pagination if you get 100+ reports

## Next Steps:

1. ✅ Test locally (force failure, verify modal, check Firestore)
2. ⏳ Deploy to TestFlight with diagnostic reporting
3. ⏳ Ask iPhone 17 Pro tester to reproduce crash and send report
4. ⏳ Analyze collected diagnostics in Firebase Console
5. ⏳ Fix the actual issue based on diagnostic data

## Questions to Answer with Diagnostics:

- Is it a file size issue? (Check `fileSize` in context)
- Is it a storage issue? (Check `deviceInfo.storage.available`)
- Is it a memory issue? (Check device model, `deviceInfo.memory`)
- Is it a network issue? (Check `deviceInfo.connection`, error messages)
- Is it Firebase quota? (Check error codes in logs)
- Is it ProRes format? (Check file type/size patterns)

---

**Philosophy**: Stay light, collect just enough context to debug, let user decide when to send reports.
