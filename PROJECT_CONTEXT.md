# Project Context & Development Guidelines

## 🏗 Development Environment

- **Dev server is always running** - Never start/stop npm dev server
- **Hot reload enabled** - Vue files update automatically
- **Firebase Functions auto-update** - Business logic changes apply on-the-fly
- **No need to restart services** - Everything hot-reloads
- **Simple browser available** - Can open for testing if needed, but user handles most testing

## 🏔 Project Overview: Boulder Climbing PWA

A Vue.js Progressive Web App for climbing hold detection and boulder problem management using AI/ML.

### Core Features

- **Hold Detection**: AI-powered climbing hold detection with SVG overlays
- **Boulder Problems**: Create, edit, and manage climbing routes
- **Server Integration**: Firebase Functions for backend operations
- **Offline Support**: PWA with caching capabilities
- **Computer Vision**: ONNX models for pose and hold detection

## 🏛 Architecture

### Frontend (Vue 3 + Vite)

```
src/
├── components/
│   ├── UnifiedHoldOverlay.vue     # Single SVG overlay for all holds
│   └── BoulderProblemsManager.vue # Problem CRUD operations
├── views/
│   └── HoldDetectionServerView.vue # Main detection interface
├── stores/
│   ├── boulderProblemsStore.js     # Problem state management
│   └── holdDetectionServerStore.js # Detection results state
└── services/
    ├── boulderProblemsServiceV2.js # Firebase Functions client
    └── detectionCacheService.js    # Browser cache abstraction
```

### Backend (Firebase Functions)

```
server/src/
├── index.ts                       # Cloud Functions
├── services/
│   └── boulderProblemsService.ts  # Problem operations
└── migrations/                    # Firestore schema changes
```

## 🎯 Key Technical Decisions

### Overlay Architecture

- **Single SVG Overlay**: `UnifiedHoldOverlay.vue` replaced multiple overlapping components
- **Simplified Positioning**: Absolute positioning with `inset-0`, no complex calculations
- **Pointer Events**: SVG root has `pointer-events-none`, individual holds have `pointer-events-auto`
- **ViewBox Matching**: SVG viewBox matches original image dimensions from server

### State Management

- **Pinia Stores**: Reactive state for problems and detection results
- **Server-First**: Server detection results are source of truth
- **SVG Markup**: Hold data includes SVG paths from AI detection
- **Browser Caching**: Detection results cached for 1 week using abstracted cache service
- **Optimistic Updates**: Local state updates immediately, server persistence handled separately
- **Unsaved Changes Tracking**: Changes marked for later batch persistence

### Boulder Problem Updates
- **Create Flow**: `createNewProblem` → `finishCreatingProblem` (persists name, grade, holds)
- **Edit Flow**: `updateProblemName`/`updateProblemGrade` → `saveProblemChanges` (persists all fields)
- **Always Include**: Ensure name, grade, and holds are sent to `updateBoulderProblem` function

### Caching Architecture
- **Abstracted Service**: `detectionCacheService.js` handles all caching logic
- **Easy Disable**: Set `CACHE_ENABLED = false` in cache service to disable
- **Easy Removal**: Replace cache service with no-op implementation to remove entirely
- **Cache Key**: Based on image URL + compression settings
- **Expiry**: 1 week (configurable in service)

### Hover System

- **Cross-Hold Highlighting**: Hovering one hold highlights all holds in that problem
- **White Border Effect**: Problem-level hover shows white borders around all related holds
- **JavaScript Events**: Custom hover handling for complex interactions

## 📋 Code Patterns

### Component Communication

```javascript
// Emit events for parent communication
emit("hold-click", hold, index);
emit("hold-hover", index, problemId);

// Props for data flow
:detection-results="serverStore.results"
:boulder-problems="boulderProblemsStore.sortedProblems"
```

### CSS Styling

- **Scoped Styles**: All components use scoped CSS
- **State-Based Classes**: `.hold-available`, `.hold-assigned`, `.hold-being-edited`
- **Hover Effects**: Drop shadows and stroke width changes
- **Transitions**: Smooth opacity and filter transitions

### Error Handling

- **Console Logging**: Descriptive emoji-prefixed logs
- **Graceful Degradation**: Components handle missing data
- **User Feedback**: Visual states for loading/error conditions

## 🚫 Common Pitfalls to Avoid

- **Don't restart dev server** - It's always running
- **Don't create nested overlays** - Use single SVG approach
- **Don't use complex positioning** - Prefer simple absolute positioning
- **Don't forget pointer events** - Ensure proper interaction zones
- **Don't ignore viewBox** - Must match image dimensions for proper scaling

## 🔧 Development Workflow

1. Make code changes (auto hot-reload)
2. Test in browser (user handles primary testing)
3. Use Simple Browser if needed for quick checks
4. Firebase Functions update automatically
5. No build/restart needed during development

## 📊 Data Structures

### Detection Results

```javascript
{
  holds: [{ id, confidence, bbox }],
  svg_markups: ["<path d='...'/>"],
  image_info: { width, height }
}
```

### Boulder Problem

```javascript
{
  id: string,
  name: string,
  grade: string,
  holds: [{ holdIndex, svgMarkup, detectionSource }],
  locationId: string,
  imageId: string
}
```

## 🎨 UI Guidelines

- **Clean Minimal Design**: Focus on climbing wall visualization
- **Responsive Layout**: Works on mobile and desktop
- **Visual Feedback**: Clear states for different hold types
- **Accessibility**: Proper contrast and hover states

---

_Last Updated: $(date)_
_This file should be referenced frequently to maintain consistency in development approach._
