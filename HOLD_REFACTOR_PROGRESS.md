# Hold Data Flow Refactor - Progress Summary

## What We Fixed ✅

### 1. **Clear DTO Contracts** 
- Documented complete data flow in `HOLD_DATA_FLOW.md`
- Server API → Frontend → Firestore → Boulder Problems
- No more guessing about field names

### 2. **Server ID Preservation**
- ✅ `holdDetectionUtils.ts` now preserves server IDs (not generating new ones)
- ✅ `saveDetectionToFirestore` uses server IDs directly
- ✅ No more `ai_hold_${index}` - uses server's `hold_0`, `hold_1`, etc.

### 3. **Explicit Center Points**
- ✅ Added `centerX` and `centerY` to `SimpleHold` interface
- ✅ Server provides `center_x`, `center_y` - we use them directly
- ✅ No more calculating center from bbox

### 4. **Removed Defensive/Fallback Code**
- ❌ **BEFORE**: `x: hold.bbox?.[0] || hold.x || 0`
- ✅ **AFTER**: `x: hold.x`
- Cleaned up `loadDetectionResults` in store
- Trust the schema!

### 5. **Hold References by ID (Mostly Complete)**
- ✅ Updated `ProblemHold` interface: `holdIndex` → `holdId`
- ✅ Fixed `addHoldToProblem()` - uses `hold.id`
- ✅ Fixed `removeHoldFromProblem()` - uses `holdId`
- ✅ Fixed `isHoldInProblem()` - uses `holdId`
- ✅ Updated all store lookups to use `h.holdId === hold.id`
- ✅ Updated view calls - no longer pass index
- ✅ Removed unused index calculations in InteractiveHoldOverlay

## What's Left to Finish 🚧

### 6. **Complete holdId Refactor (10% remaining)**

**Files still using `holdIndex` checks:**

1. **src/views/HoldDetectionServerView.vue**
   - `getHoldProblemId(holdIndex)` - needs to accept hold/holdId
   - `handleHoldHover(holdIndex, ...)` - needs to accept hold/holdId

2. **src/components/InteractiveHoldOverlay.vue** (lines 601, 609, 617)
   ```javascript
   problem.holds?.some((h) => h.holdIndex === holdIndex)
   ```
   Should be:
   ```javascript
   problem.holds?.some((h) => h.holdId === hold.id)
   ```

3. **src/components/UnifiedHoldOverlay.vue** (lines 122, 130, 138)
   Same pattern as above

4. **server/src/index.ts** (backend - lines 775, 857)
   Backend boulder problem functions still use `holdIndex`
   Need to update Firebase callable functions

## How to Complete

### Step 1: Fix getHoldProblemId
```javascript
// Change signature from index to hold
const getHoldProblemId = (hold) => {
  for (const problem of boulderProblemsStore.sortedProblems) {
    const holdFound = problem.holds?.some((h) => h.holdId === hold.id);
    if (holdFound) return problem.id;
  }
  return null;
};
```

### Step 2: Update handleHoldHover calls
Find where `getHoldProblemId(holdIndex)` is called, pass `hold` instead.

### Step 3: Fix Overlay Components
Search and replace in both overlay files:
```javascript
// OLD
h.holdIndex === holdIndex

// NEW
h.holdId === hold.id
```

### Step 4: Backend Functions (server/src/index.ts)
Update Firebase callable functions:
- Change `holdIndex` parameter to `holdId`
- Update Firestore queries to match by `holdId`
- No backward compatibility needed!

## Testing Checklist

Once complete, test this flow:

1. ✅ **Detect Holds** - Server returns holds with IDs
2. ✅ **Auto-save** - Saves with server IDs (not generating new ones)
3. ✅ **Reload** - Loads from Firestore with IDs intact
4. ✅ **Create Problem** - Add holds to problem using IDs
5. ⚠️  **Delete Hold** - CRITICAL TEST!
   - Create problem with holds at IDs: `[hold_0, hold_1, hold_2]`
   - Delete `hold_0`
   - Problem should still reference `hold_1` and `hold_2` correctly
   - Arrays shift, but IDs don't change!
6. ✅ **Verify** - Boulder problem still shows correct holds

## Benefits Once Complete

1. **Stable References** - Deleting holds won't break boulder problems
2. **No ID Generation** - Server IDs flow through unchanged
3. **Clean Code** - No more `|| 0` fallbacks everywhere
4. **Type Safety** - Clear contracts at each boundary
5. **Debuggable** - Know exactly what data looks like at each layer

## Files Modified So Far

- ✅ `src/types/holdDetectionApi.ts` - SimpleHold interface
- ✅ `src/types/holdDetectionUtils.ts` - Conversion function
- ✅ `src/types/holds.ts` - ProblemHold interface
- ✅ `src/views/HoldDetectionServerView.vue` - Save & some calls
- ✅ `src/stores/holdDetectionServerStore.js` - Load transformation
- ✅ `src/stores/boulderProblemsStore.js` - All core functions
- ✅ `src/components/InteractiveHoldOverlay.vue` - addHold calls
- ⚠️  `src/components/InteractiveHoldOverlay.vue` - checks still need fixes
- ⚠️  `src/components/UnifiedHoldOverlay.vue` - checks still need fixes
- ⚠️  `server/src/index.ts` - backend needs updates

## Estimated Remaining Work

- **Time**: 30-45 minutes
- **Complexity**: Low (mostly search & replace)
- **Risk**: Low (no users, can break freely)
- **Benefit**: High (fixes the boulder problem corruption bug)

## Next Session

Start with fixing `getHoldProblemId` and `handleHoldHover`, then do a global search for remaining `h.holdIndex` references.
