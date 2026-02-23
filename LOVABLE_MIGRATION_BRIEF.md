# TopoMatch PWA - High-Level Architecture Overview
## For Vue → React Migration (Lovable)

---

## 🎯 **What Are We Building?**

**TopoMatch** is a climbing gym PWA that uses **AI computer vision** to:
1. **Match climber videos to gym wall boulder problems** - Uses ONNX models for pose detection and image matching
2. **Track climbing ascents** - Record sends, grades, attempts linked to specific boulder problems
3. **Organize gyms by routesetting** - Time-versioned photo galleries per gym reset

Think: **Strava for indoor climbing + computer vision + gym management**

---

## 📱 **Platform Requirements**

- **Web PWA** (desktop + mobile browsers)
- **iOS Native** via Capacitor
- **Firebase Backend** (Firestore, Storage, Functions, Auth)
- **ONNX Runtime** for client-side ML inference
- **Native iOS plugins** for video editing + pose detection (Vision Framework)

---

## 🗺️ **Core Routes & Views**

### Public Routes
- `/` - Browse all climbing locations (grid view)
- `/location/:id` - Location detail with photo galleries, videos, problems
- `/location/:id/problem/:problemId` - Boulder problem detail page
- `/user/:userId` - Public user profile

### Authenticated Routes
- `/profile` - Current user profile
- `/location/:id/routesettings` - Manage routesetting history (time-versioned photos)

### Admin Routes
- `/add-location` - Create new climbing gym
- `/location/:id/edit` - Edit location
- `/location/:id/holds-server` - Hold detection server config
- `/location/:id/jobs` - Background job status (hold detection, etc.)
- `/admin` - Admin panel
- `/admin/diagnostics` - Video analysis diagnostics
- `/admin/healthcheck` - API health checks

---

## 🏗️ **Key Architecture Concepts**

### 1. **Routesetting Versioning**
- Each gym has multiple **routesettings** (reset dates: `2024-12-15T10:00:00`)
- Photos are tagged with routesetting timestamp
- Users view historical routesettings (old problems, old walls)
- **Query param navigation**: `/location/123?routesetting=2024-12-15T10:00:00`

### 2. **Video Upload → Analysis Pipeline**
```
User picks video (iOS native editor or web file picker)
  ↓
Client generates ascentId (crypto.randomUUID())
  ↓
Create Firestore ascent doc: /ascents/{ascentId}
  ↓
Start upload (background): videos/raw/{userId}/{ascentId}.{ext}
  ↓
In parallel: extract frames from the local video file (DOM: <video> + <canvas>)
  ↓
[Client] videoAnalysisQueueStore.setFrames(...) starts autonomous pipeline
  ↓
Pose detection → image matching → hold loading → scoring
  ↓
Client writes assignment to `/ascents/{ascentId}` (problemId/problemSnapshot + analysisMetadata)

Upload/transcoding track (independent):
  - [Firebase Function] `handleRawVideoUpload` sets `video.status = 'transcoding'`
  - Outputs: videos/transcoded/{userId}/{ascentId}/video.mp4
  - [Firebase Function] `handleTranscodedVideo` sets `video.status = 'ready'` (+ optional thumbnailUrl)
```

Note: the current app plays back **MP4** directly from Storage URLs (no HLS playback).

#### Current Implementation (source of truth)
- Client orchestration lives in `VideoFrameMatcherEnhanced.vue`:
  - Generate `ascentId` with `crypto.randomUUID()`
  - Create ascent doc at `/ascents/{ascentId}` immediately (before upload completes)
  - Start upload in background via `videoUploadQueueStore.startUpload(...)`
  - Extract frames in the component (DOM work) then hand off to `videoAnalysisQueueStore.setFrames(...)`

- Upload details:
  - Storage raw: `videos/raw/{userId}/{ascentId}.{ext}`
  - Upload uses Storage custom metadata: `{ ascentId, locationId, problemId, userId }`
  - Server Functions:
    - `handleRawVideoUpload`: sets `ascents/{ascentId}.video.status = 'transcoding'`, stores `video.originalPath`, then transcodes (or emulator-copies) to `videos/transcoded/{userId}/{ascentId}/video.mp4`
    - `handleTranscodedVideo`: sets `video.status = 'ready'`, `video.transcodedPath`, and optionally `video.thumbnailUrl`

- Two independent client “queues” (port these as background React services, not component state):
  - Upload queue: `videoUploadQueueStore`
    - Tracks upload progress
    - Subscribes to `/ascents/{ascentId}` and reacts to `video.status` and `video.thumbnailUrl`
    - Also updates UI as soon as `problemId/problemSnapshot` appear (analysis result is independent of video readiness)
  - Analysis queue: `videoAnalysisQueueStore`
    - Starts when the component passes frames + inputs via `setFrames(ascentId, frames, comparisonImages, boulderProblems, locationId)`
    - Writes assignment back to the ascent:
      - If `topScore > 0.5`: set `problemId` + `problemSnapshot`
      - Always writes `analysisMetadata` (top score + top-3 summary)

#### React port checklist (video upload + assignment)
- Keep **one stable ID**: `ascentId` is the Firestore doc ID and is used in Storage object naming/metadata.
- Keep analysis autonomous:
  - Frame extraction remains component-level (needs `<video>`/`<canvas>`), but everything after that is a background queue.
  - The queue must survive unmounts.
- Keep the same observable contract on `/ascents/{ascentId}`:
  - Upload updates `video.status` + `video.*Path` + optional `thumbnailUrl`
  - Analysis updates `problemId/problemSnapshot` + `analysisMetadata`

### 3. **Client-Side ONNX Inference**
- **Pose Detection**: YOLOv11-pose (17 keypoints: wrists, ankles, elbows, etc.)
- **Image Matching**: SuperPoint + LightGlue pipeline
- **Platforms**:
  - **Desktop Web**: ONNX Runtime Web (WASM + WebGPU)
  - **iOS Native**: ONNX Runtime iOS (via Capacitor plugin)
  - **Mobile Web**: Server-side fallback (client too slow)

### 4. **Image Upload & Resizing**
- Client generates imageId (`crypto.randomUUID()`)
- Upload to: `location-images/{locationId}/{imageId}/original.jpg`
- **Firebase Extension** auto-generates thumbnails:
  - `original_300x300.webp` (thumbnails)
  - `original_800x600.webp` (mobile)
  - `original_1920x1440.webp` (desktop)
- Firestore doc: `/locationImages/{imageId}`

---

## 🧩 **Major Component Categories**

### Video Components
- `VideoUploadButton.vue` - Floating action button (camera/library picker)
- `VideoPlayerShorts.vue` - TikTok-style vertical video player
- `VideoFrameMatcherEnhanced.vue` - Video analysis UI (pose + matching)
- `VideoAnalysisIndicator.vue` - Floating upload/analysis progress
- `BetaVideoUploadModal.vue` - Upload + link video to problem

### Image Components
- `ImageGallerySimplified.vue` - Photo gallery with floorplan sections
- `GymFloorplan.vue` - Organize photos by gym area (east wall, cave, etc.)
- `ImageWithHolds.vue` - Display detected holds overlay (SVG circles)
- `ImageUpload.vue` - Bulk image upload with progress

### Boulder Problem Components
- `BoulderProblemDrawer.vue` - Bottom sheet with problem details
- `BoulderProblemCard.vue` - Problem card in grid
- `BoulderProblemsManager.vue` - Admin CRUD for problems

### Form Components
- `AscentForm.vue` - Log ascent (grade, attempt type, notes)
- `LocationForm.vue` - Create/edit climbing gym
- `AuthModal.vue` - Login/signup modal

### Overlay Components
- `UnifiedHoldOverlay.vue` - Draw detected + manual holds
- `InteractiveHoldOverlay.vue` - Click to add/edit holds
- `PoseFrameAnimator.vue` - Animate pose keypoints over time

---

## 📦 **Core Services (API Layer)**

### Firebase Services
- `firebase.js` - Firebase SDK initialization
- `authService.js` - Sign in/out, user management
- `ascentService.js` - CRUD for ascents (climbing logs)
- `boulderProblemsServiceV2.js` - CRUD for problems
- `locationService.js` - CRUD for gyms
- `routesettingService.js` - Manage routesetting versions
- `videoService.js` - Video upload, ascent association
- `commentService.js` - Comments on ascents
- `likeService.js` - Like ascents

### Computer Vision Services
- `poseDetectionFactory.js` - Select pose model (YOLO/MediaPipe/iOS Vision)
- `yoloPoseService.js` - YOLOv11-pose wrapper
- `mediapipePoseService.js` - MediaPipe Pose wrapper
- `iosVisionPoseService.js` - iOS Vision Framework adapter
- `imageMatchingService.js` - SuperPoint+LightGlue inference
- `inferenceService.js` - ONNX Runtime Web wrapper
- `nativeImageMatchingAdapter.js` - iOS native plugin bridge

### Hold Detection Services
- `holdDetectionService.js` - Manage AI + manual holds
- `manualHoldsService.js` - CRUD for manual holds
- `holdDetectionApiService.ts` - Server-side API calls

### Utilities
- `capacitorHttp.js` - Capacitor HTTP plugin wrapper
- `diagnostics.js` - Error reporting + diagnostics
- `imageCacheService.js` - Cache images in IndexedDB
- `detectionCacheService.js` - Cache hold detection results

---

## 🗄️ **State Management (Pinia Stores)**

### Core Stores
- `userStore.js` - Current user, auth state, admin flag
- `ascentStore.js` - Ascent data, filtering, sorting
- `boulderProblemsStore.js` - Problems cache
- `holdDetectionPersistenceStore.js` - Hold data persistence

### Video Processing Stores
- `videoUploadQueueStore.js` - Upload queue, progress tracking
- `videoAnalysisQueueStore.js` - Autonomous analysis pipeline
  - Pose detection → Image matching → Hold loading → Scoring
  - Runs independently of component lifecycle

### Inference Stores (ONNX)
- `inferenceStore.js` - Image matching inference (web)
- `inferenceStoreLoader.js` - Dynamic loader (worker vs main thread)
- `inferenceStoreWorkerNew.js` - Web Worker implementation
- `inferenceStoreMainThread.js` - Main thread fallback
- `inferenceStoreMock.js` - Mock for testing

---

## 🔌 **Capacitor Native Plugins**

### iOS Plugins (Swift)
- `IosImageMatchingPlugin.swift` - SuperPoint+LightGlue via ONNX Runtime
- `IosVideoEditorPlugin.swift` - Trim videos before upload
- `IosPoseDetectionPlugin.swift` - Vision Framework pose detection

### Web Fallbacks
- All plugins have web implementations (file pickers, mock pose data, etc.)

---

## 🎨 **Styling & UI**

- **Tailwind CSS** - Utility-first styling
- **Mobile-first** - Responsive design, bottom tab bar
- **Design system**:
  - `.btn` / `.btn-secondary` - Button styles
  - `.card` - Card container
  - `.input` - Form inputs
  - Custom scroll containers (`.app-content`)

---

## 🔥 **Firestore Data Model**

### Collections
```
/users/{userId}
  - displayName, email, photoURL, admin
  /fcmTokens/{tokenId}
  /pushTokens/{token}

/locations/{locationId}
  - name, address, coordinates, floorplanSections
  /boulderProblems/{problemId}
    - name, grade, color, imageId, coordinates
  /manualHolds/{holdDocId}
    - holdType, coordinates, createdBy

/locationImages/{imageId}
  - locationId, routesetting, downloadUrl, uploadedAt
  - floorplanSectionId (optional)

/ascents/{ascentId}
  - userId, userName, locationId, problemId
  - video: { status, rawUrl, transcodedUrl, thumbnailUrl }
  - attemptType, userGrade, notes, date

/comments/{commentId}
  - ascentId, userId, text, createdAt
```

### Client-Side ID Generation
```javascript
const ascentId = crypto.randomUUID();
const imageId = crypto.randomUUID();
// Used in both Firestore doc IDs AND Storage paths
```

---

## 🚀 **Critical Migration Notes**

### Keep As-Is
- ✅ **Server folder** - Firebase Functions, no changes
- ✅ **Capacitor config** - iOS bridge stays
- ✅ **ONNX models** - Model files + inference logic
- ✅ **Firebase SDK** - Same backend APIs

### Vue → React Conversions

#### State Management
- **Pinia stores** → React Context + hooks
  - Example: `useUserStore()` → `useUser()` hook
  - Example: `videoAnalysisQueueStore` → `useVideoAnalysis()` hook

#### Routing
- **Vue Router** → React Router
  - Keep same route structure
  - Query params: `?routesetting=...`, `?videoId=...`
  - Scroll behavior: custom scroll containers

#### Components
- **Vue Composition API** → React hooks
  - `ref()` → `useState()`
  - `computed()` → `useMemo()`
  - `watch()` → `useEffect()`
  - `onMounted()` → `useEffect(() => {}, [])`

#### Composables
- **Vue composables** → React hooks
  - `useToast()` - Toast notification system
  - `useVideoAnalysis()` - Video analysis pipeline
  - `useSortedImages()` - Image sorting logic
  - `useImageContextMenu()` - Right-click menu

### Performance Critical
- **ONNX Runtime Web** must stay performant
  - Web Workers for image matching
  - WASM + WebGPU for pose detection
- **Video analysis queue** must be autonomous (runs in background)
- **Image caching** in IndexedDB for offline support

---

## 📋 **Key User Flows**

### 1. Upload Video Beta
```
Click floating "+" button
  → Choose camera/library
  → (iOS: native video editor)
  → Select boulder problem
  → Fill ascent form (grade, attempt)
  → Upload starts (background queue)
  → Video transcoded on server
  → Analysis queue picks up
  → Pose detection + image matching
  → Results shown in diagnostics
```

### 2. Browse Location
```
Home page → Click gym card
  → Location detail page
  → View current routesetting photos
  → Floorplan sections (east wall, cave, etc.)
  → Switch routesetting (dropdown)
  → See videos tab
  → Click video → TikTok-style player
  → Like, comment, view problem
```

### 3. Manage Boulder Problems (Admin)
```
Location detail → "Edit" button
  → Toggle problem mode
  → Click image → Place problem marker
  → Set name, grade, color, hold type
  → Save to Firestore
  → Link videos to problems
```

### 4. Hold Detection (Admin)
```
Location → "Detect Holds" button
  → Configure server URL
  → Run detection job
  → Background processing
  → View results overlay
  → Manual corrections (add/delete holds)
```

---

## 🧪 **Testing Strategy**

- **Playwright E2E** - Pose detection regression tests
- **Firebase Emulators** - Local backend development
- **Mock stores** - Unit test components without backend
- **Storybook** - Component development (Histoire)

---

## 🎯 **Migration Priority**

### Phase 1: Core Infrastructure
1. React Router setup (same route structure)
2. Firebase SDK integration
3. User authentication (Context + hooks)
4. Basic layout (header, tabs, scroll containers)

### Phase 2: Content Viewing
1. Location list/detail pages
2. Image galleries (floorplan sections)
3. Video player (TikTok-style)
4. Boulder problem display

### Phase 3: Video Upload
1. Upload button (native iOS + web fallback)
2. Upload queue store → React hook
3. Ascent form
4. Progress indicators

### Phase 4: Computer Vision
1. ONNX Runtime Web integration
2. Video analysis queue → React hook
3. Pose detection services
4. Image matching services
5. Hold overlay components

### Phase 5: Admin Features
1. Boulder problem manager
2. Hold detection UI
3. Diagnostics views
4. Job queue monitoring

---

## ❓ **Questions for Lovable**

1. **State management approach?** - Context API, Zustand, Jotai, or something else?
2. **ONNX Runtime Web?** - Any React-specific patterns for Web Workers + WASM?
3. **Capacitor plugins?** - Best way to bridge native iOS plugins in React?
4. **Scroll containers?** - Custom scroll handling (not window scroll) - any gotchas?
5. **Video player?** - Recommended library for TikTok-style vertical player?
6. **Firebase Real-time?** - Best React patterns for Firestore subscriptions?

---

## 📚 **Key Files to Reference**

### Router
- `src/router/index.js` - All routes

### Main Views
- `src/views/LocationDetailView.vue` - Most complex view (1500+ lines)
- `src/views/BrowseLocationsView.vue` - Home page

### Video System
- `src/stores/videoAnalysisQueueStore.js` - Autonomous analysis pipeline
- `src/components/VideoPlayerShorts.vue` - TikTok-style player

### ONNX Inference
- `src/services/poseDetectionFactory.js` - Model selection
- `src/services/inferenceService.js` - Image matching
- `src/workers/poseDetectionWorkerNew.js` - Web Worker

### Capacitor
- `ios/App/App/plugins/` - Native iOS plugins

---

**Ready to start? Let's tackle this phase by phase! 🚀**
