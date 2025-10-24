# Copilot Instructions

## Development Principles

### 🚀 CUTTING EDGE MODE - NO BACKWARD COMPATIBILITY
- This is a PROTOTYPE in active development
- **NEVER** add backward compatibility code
- **NEVER** keep legacy methods "just in case"
- When refactoring, **DELETE** old code completely
- Prefer minimal, readable code over defensive programming
- Move fast, break things, iterate quickly

### Code Quality
- Keep code simple and readable
- Delete unused code immediately
- No "TODO: remove legacy code later" comments
- If we need to change something, change it completely NOW

### When Asked to Refactor
1. Delete the old code
2. Implement the new approach
3. Update all usages
4. No migration paths or compatibility layers

## Current Architecture (Updated: Oct 24, 2025)

### Firestore Collections
- **`/ascents`** - Top-level ascent collection with embedded video data
  - Fields: userId, locationId, problemId, problemSnapshot, attemptType, userGrade, notes, date, video, userName
  - userName stored for display (avoids user lookups)
- **`/locations`** - Climbing locations
- **`/locations/{id}/boulderProblems`** - Boulder problems (nested)
- **`/locations/{id}/locationImages`** - Location images (nested)

### Video Architecture
- Videos are **embedded objects** in ascent documents
- NO separate `/climbVideos` collection
- Video structure: `AscentVideo` interface (see `src/types/ascent.ts`)
- Transcoding flow:
  1. Upload to `videos/raw/{userId}/{videoId}.ext` triggers `transcodeVideo`
  2. Transcoding job processes video
  3. Output written to `videos/transcoded/{userId}/{videoId}/video.mp4`
  4. `onTranscodingComplete` updates `/ascents/{ascentId}/video.transcodedPath`

### Key Services
- `ascentService.js` - Works with top-level `/ascents` collection
- `videoService.js` - Upload videos to Storage, query videos from `/ascents`
- `videoUploadQueueStore.js` - Manage upload queue, transform video data

## Tech Stack
- Vue 3 (Composition API)
- Firebase (Firestore, Storage, Functions, Auth)
- Pinia (State Management)
- Vite (Build Tool)
