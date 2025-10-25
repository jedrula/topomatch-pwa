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
- **YAGNI (You Ain't Gonna Need It)**: Don't add empty `<style scoped>` blocks or placeholder comments
- Only add code/sections when actually needed, not "just in case"
- **Use `crypto.randomUUID()` for generating unique IDs** (ascentId, imageId, etc.) - NOT `Math.random()`

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
  - **ascentId generated on client** using `crypto.randomUUID()`
- **`/locations`** - Climbing locations
- **`/locations/{id}/boulderProblems`** - Boulder problems (nested)
- **`/locations/{id}/locationImages`** - Location images (nested)
- **`/locationImages`** - Location images (top-level collection)
  - **imageId generated on client** using `crypto.randomUUID()` (same pattern as ascents)
  - Firestore doc ID matches Storage folder name for consistency

### Image Upload Flow (Client-Side IDs)
1. **Client generates imageId** using `crypto.randomUUID()`
2. **Upload image** to `location-images/{locationId}/{imageId}/original.ext`
3. **Extension creates resized versions** in same folder: `original_300x300.webp`, etc.
4. **Create Firestore doc** at `/locationImages/{imageId}` with same ID (uses `setDoc`)
5. **Deletion** removes entire folder with all resized versions

### Image Upload & Thumbnail Generation
- **Firebase Extension**: `firebase/storage-resize-images@0.2.10`
- **Storage structure**: Folder-based for easy management
  - Original: `location-images/{locationId}/{imageId}/original.jpg`
  - Resized: `location-images/{locationId}/{imageId}/original_300x300.webp`, etc.
  - All versions grouped in same folder for easy deletion
- **Generated sizes**: 300x300 (thumbnails), 800x600 (mobile), 1920x1440 (desktop)
- **Extension behavior**: 
  - ✅ **Works in emulator** (confirmed - NOT like video transcoding)
  - ⚡ **Faster in emulator** than production (typically 2-5 seconds)
  - 🌐 Production may be slower due to CDN propagation
- **Smart loading**: See `LocationImages.vue` for time-based heuristic approach
  - Shows loading state for recently uploaded images
  - Waits before attempting thumbnail load (configurable delay)
  - Falls back to original image if thumbnail not ready
- **Deletion**: Removes entire folder with all resized versions (clean cascade)


### Video Upload Flow (Client-Side IDs)
1. **Client generates ascentId** using `crypto.randomUUID()`
2. **Upload video** to `videos/raw/{userId}/{videoId}.ext` with ascentId in metadata
3. **Create ascent** at `/ascents/{ascentId}` with same ID (uses `setDoc`)
4. **transcodeVideo** triggers, reads ascentId from metadata, outputs to `videos/transcoded/{userId}/{ascentId}/`
5. **onTranscodingComplete** updates `/ascents/{ascentId}/video.status = 'ready'`

### Video Architecture
- Videos are **embedded objects** in ascent documents (no separate collection)
- Video structure: `AscentVideo` interface (see `src/types/ascent.ts`)
- Storage paths use **ascentId** for consistency
- **No temp IDs, no claiming** - one ID from start to finish

### Key Services
- `ascentService.js` - Works with `/ascents`, exports `generateAscentId()`
- `videoService.js` - Upload videos to Storage with ascentId
- `videoUploadQueueStore.js` - Track upload progress (simplified, no temp IDs)

## Tech Stack
- Vue 3 (Composition API)
- Firebase (Firestore, Storage, Functions, Auth)
- Pinia (State Management)
- Vite (Build Tool)
