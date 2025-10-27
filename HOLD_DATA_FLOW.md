# Hold Data Flow & DTO Contracts

## Data Flow Layers

```
┌──────────────────────────────────────┐
│  1. AI DETECTION SERVER (Python)     │  ProcessedHold (snake_case)
└────────────────┬─────────────────────┘
                 │ HTTP Response
                 ↓
┌──────────────────────────────────────┐
│  2. FRONTEND API SERVICE (TS)        │  SimpleHold (camelCase)
│     holdDetectionUtils.ts            │
└────────────────┬─────────────────────┘
                 │ Store
                 ↓
┌──────────────────────────────────────┐
│  3. FRONTEND STORE (JS)              │  SimpleHold + temp data
│     holdDetectionServerStore.js      │
└────────────────┬─────────────────────┘
                 │ Transform & Save
                 ↓
┌──────────────────────────────────────┐
│  4. FIRESTORE (DB)                   │  FirestoreHold (with IDs)
│     /locations/{id}/holdDetections   │
└────────────────┬─────────────────────┘
                 │ Load
                 ↓
┌──────────────────────────────────────┐
│  5. BOULDER PROBLEMS (JS)            │  ProblemHold (with holdId)
│     boulderProblemsStore.js          │
└──────────────────────────────────────┘
```

## Layer-by-Layer Contracts

### 1. AI Detection Server → Frontend

**Server Response (`ProcessedHold`)**
```typescript
interface ProcessedHold {
  id: string;                    // Server-generated: "hold_0", "hold_1"
  confidence: number;            // 0-1
  center_x: number;              // Center point (SNAKE_CASE!)
  center_y: number;              // Center point
  bbox: {                        // Bounding box
    x: number;                   // Top-left corner
    y: number;
    width: number;
    height: number;
  };
  svg_path: string;              // SVG path data
  segmentation_score: number | null;
  color_analysis: ColorAnalysis;
}
```

**Conversion (`convertApiResponseToFrontendFormat`)**
```typescript
// src/types/holdDetectionUtils.ts line 122
const hold: SimpleHold = {
  id: processedHold.id,          // Keep server ID
  x: processedHold.bbox.x,       // bbox.x → x
  y: processedHold.bbox.y,       // bbox.y → y
  width: processedHold.bbox.width,
  height: processedHold.bbox.height,
  confidence: processedHold.confidence,
  type: /* inferred from ID */,
  svgMarkup: /* from svg_markups array */
}
```

### 2. Frontend Store Format

**Store (`results.value.holds`)**
```typescript
interface SimpleHold {
  id: string;                    // From server
  x: number;                     // Top-left (from bbox)
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: string;
  svgMarkup?: string;
}
```

**PROBLEM:** Store doesn't persist server IDs on first load!
- Server returns: `{id: "hold_0", ...}`
- Store saves to Firestore with NEW IDs: `{id: "ai_hold_0", ...}`
- Original server IDs are lost!

### 3. Firestore Schema

**Current Save (`saveDetectionToFirestore` line 948)**
```javascript
const aiHold = {
  id: `ai_hold_${index}`,        // ❌ WRONG! Generates new ID
  source: 'ai-detected',
  svgMarkup: svg_markups[index],
  x: centerX,                    // ❌ Calculated wrong (uses bbox.x as center!)
  y: centerY,
  width: hold.width || 0,        // ❌ Fallback code
  height: hold.height || 0,
  confidence: hold.confidence || 0,
  holdType: hold.type || 'unknown',
  // Missing: bbox, center_x, center_y
}
```

**What Firestore Currently Stores**
```
/locations/{locationId}/holdDetections/{imageId}
{
  detectionResults: {
    aiHolds: [
      {
        id: "ai_hold_0",         // Index-based ID (BAD!)
        x: number,               // Actually center, not top-left
        y: number,
        width: number,
        height: number,
        confidence: number,
        holdType: string,
        svgMarkup: string
      }
    ],
    manualHolds: [...],
    metadata: {...}
  }
}
```

### 4. Boulder Problems Reference

**Current (`ProblemHold`)**
```typescript
interface ProblemHold {
  holdIndex: number;             // ❌ ARRAY POSITION - breaks on delete!
  hold: Hold;                    // Full hold object
  addedAt: string;
  role: 'start' | 'finish' | 'intermediate' | null;
}
```

**Problem Scenario:**
1. Create boulder with holds at indices `[0, 1, 2]`
2. Delete hold at index `0`
3. Array becomes `[old1, old2]` but indices are now `[0, 1]`
4. Boulder problem still references `holdIndex: 1` which now points to `old2` instead of `old1`!

## Proposed Clean Architecture

### 1. Server Response (No Change)
Server continues to return `ProcessedHold` with snake_case.

### 2. Frontend Conversion (Fix)
```typescript
// src/types/holdDetectionUtils.ts
const hold: SimpleHold = {
  id: processedHold.id,          // KEEP server ID
  x: processedHold.bbox.x,       // Top-left corner
  y: processedHold.bbox.y,
  centerX: processedHold.center_x, // ✅ Add center explicitly
  centerY: processedHold.center_y,
  width: processedHold.bbox.width,
  height: processedHold.bbox.height,
  confidence: processedHold.confidence,
  type: processedHold.color_analysis?.color_category || 'unknown',
  svgMarkup: svg_markups[indexOf(hold)]
}
```

### 3. Firestore Schema (Fix)
```typescript
interface FirestoreHold {
  id: string;                    // ✅ KEEP server ID (or generate UUID for manual)
  source: 'ai-detected' | 'manual-drawn';
  x: number;                     // Top-left (from bbox)
  y: number;
  centerX: number;               // ✅ Center point explicit
  centerY: number;
  width: number;
  height: number;
  confidence: number;
  holdType: string;
  svgMarkup?: string;
  bbox?: [number, number, number, number]; // Optional: [x, y, w, h]
  addedAt?: Date;
  createdBy?: string;            // For manual holds
}
```

### 4. Boulder Problems (Fix)
```typescript
interface ProblemHold {
  holdId: string;                // ✅ USE IMMUTABLE ID
  hold: Hold;                    // Full hold object (for display)
  addedAt: string;
  role: 'start' | 'finish' | 'intermediate' | null;
}
```

**Lookup Change:**
```javascript
// OLD (breaks on delete)
problem.holds.findIndex(h => h.holdIndex === index)

// NEW (stable reference)
problem.holds.findIndex(h => h.holdId === hold.id)
```

## Migration Strategy

### NO BACKWARD COMPATIBILITY
- Delete all local Firestore data
- No need to support old schema
- Just implement new schema correctly

### Steps
1. ✅ Fix `convertApiResponseToFrontendFormat` to preserve server IDs
2. ✅ Fix `saveDetectionToFirestore` to use server IDs (not generate new ones)
3. ✅ Update Firestore schema to include centerX/centerY explicitly
4. ✅ Change `ProblemHold.holdIndex` → `ProblemHold.holdId`
5. ✅ Update all boulder problem lookups to use holdId
6. ✅ Remove ALL fallback code (`hold.x || hold.centerX || 0`)
7. ✅ Test: detect → save → reload → create problem → delete hold → verify

## Key Principles

1. **Immutable IDs**: Never generate new IDs. Use server ID or crypto.randomUUID()
2. **Explicit Schema**: No more guessing with `x || center_x || centerX`
3. **Transform at Boundaries**: Convert snake_case → camelCase at API layer only
4. **Reference by ID**: Never use array index for references across stores
5. **Type Safety**: Use TypeScript interfaces, enforce at runtime if needed
