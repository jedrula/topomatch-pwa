# Quick Draw Pending Holds Implementation

## Problem Statement

The original quick draw functionality had an inconsistent user experience:

1. **Quick Draw Mode**: When users drew holds in boulder problem creation/editing mode, the holds were immediately saved to the database as manual holds
2. **Problem Association**: The holds were added to the boulder problem in local state only
3. **Save Workflow**: Users needed to manually "Save Changes" to persist boulder problem modifications
4. **Inconsistency**: After page refresh, manual holds persisted but were no longer associated with boulder problems

This created "orphaned" manual holds when users experimented with quick draw but didn't save their boulder problem changes.

## Proposed Solution: Pending Quick Draw Holds

### Concept

Implement a two-tier hold system:
- **Persisted Manual Holds**: Regular manual holds saved immediately (for AI detection correction)
- **Pending Quick Draw Holds**: Temporary holds created in quick draw mode, only persisted when boulder problem is saved

### Technical Implementation

#### 1. Store Changes (`holdDetectionServerStore.js`)

```javascript
// New state
const pendingQuickDrawHolds = ref([]) // Holds created in quick draw mode but not yet persisted

// Combined holds for UI rendering
const allManualHolds = computed(() => {
  return [...manualHolds.value, ...pendingQuickDrawHolds.value]
})

// New functions
const addPendingQuickDrawHold = (hold) => {
  pendingQuickDrawHolds.value.push(hold)
}

const clearPendingQuickDrawHolds = () => {
  pendingQuickDrawHolds.value = []
}

const persistPendingQuickDrawHolds = async (locationId, imageId) => {
  // Save all pending holds to database and move to manualHolds
  for (const hold of pendingQuickDrawHolds.value) {
    await persistenceStore.addManualHold(imageId, hold)
    manualHolds.value.push(hold)
  }
  clearPendingQuickDrawHolds()
}
```

#### 2. Quick Draw Logic Changes (`InteractiveHoldOverlay.vue`)

```javascript
const createHoldFromPath = async () => {
  // ... hold creation logic ...
  
  if (isQuickDrawEnabled.value) {
    // Quick Draw Mode: Add as pending hold (not persisted)
    serverStore.addPendingQuickDrawHold(hold);
    boulderProblemsStore.addHoldToProblem(activeProblem.id, enrichedHold, manualHoldIndex);
  } else {
    // Regular Mode: Persist immediately
    await serverStore.addManualHold(hold, props.locationId, props.imageId);
  }
}
```

#### 3. Boulder Problem Save Integration (`boulderProblemsStore.js`)

```javascript
const saveProblemChanges = async (problemId) => {
  // Persist pending quick draw holds first
  if (holdDetectionServerStore.pendingQuickDrawHolds?.length > 0) {
    await holdDetectionServerStore.persistPendingQuickDrawHolds(currentLocationId.value, currentImageId.value);
  }
  
  // Then save boulder problem changes
  await boulderProblemsService.updateBoulderProblem(currentLocationId.value, problemId, {
    name: problem.name,
    grade: problem.grade,
    holds: problem.holds,
  });
}

const discardProblemChanges = async (problemId) => {
  // Clear pending quick draw holds when discarding
  if (holdDetectionServerStore.pendingQuickDrawHolds?.length > 0) {
    holdDetectionServerStore.clearPendingQuickDrawHolds();
  }
  
  // Reload problem from server
  // ...
}
```

### Expected User Experience

#### Quick Draw Workflow
1. **Enable Quick Draw**: User enters boulder problem creation/editing mode
2. **Draw Holds**: Holds appear immediately with proper styling (red stroke)
3. **Experiment**: User can add/remove holds, see immediate feedback
4. **Save**: All pending holds are persisted + boulder problem association is saved
5. **Discard**: Pending holds are cleared, original state restored
6. **Refresh**: After save, everything persists; after discard, experiments are lost

#### Regular Manual Hold Workflow (Unchanged)
1. **Draw Holds**: Holds are persisted immediately
2. **Purpose**: Correct AI detection, add missing holds
3. **Independent**: Not tied to specific boulder problems

## Implementation Challenges Encountered

### 1. Store Reactivity Issues
- Accessing stores within other stores caused reactivity problems
- `useHoldDetectionServerStore()` calls inside `useBoulderProblemsStore()` created undefined references

### 2. Index Calculation Complexity
- Hold indices needed to be calculated consistently between UI rendering and database storage
- Combined arrays (`[...aiHolds, ...manualHolds, ...pendingHolds]`) made indexing complex
- Different components used different indexing strategies

### 3. Persistence Timing
- Final issue: Even when logic appeared to work during session, hard refresh showed nothing was actually saved
- Suggested underlying issues with the persistence layer or timing of database operations

### 4. State Synchronization
- Managing state across multiple stores (holdDetectionServerStore, boulderProblemsStore, persistenceStore) proved complex
- Race conditions between local state updates and database operations

## Lessons Learned

### 1. Store Architecture
- Cross-store dependencies in Pinia require careful consideration
- Consider using a single store or clear unidirectional data flow

### 2. Persistence Strategy
- Complex two-tier persistence systems need robust error handling and rollback mechanisms
- Database operations should be atomic where possible

### 3. Index Management
- Hold indexing across multiple arrays and persistence layers needs a consistent strategy
- Consider using UUIDs instead of array indices for hold references

## Future Implementation Recommendations

### Option 1: Simplified Approach
- Keep current behavior but add user education (show pending changes indicator)
- Add confirmation dialogs when navigating away with unsaved quick draw holds

### Option 2: Session Storage
- Store pending quick draw holds in browser session storage
- Persist only on explicit save, clear on page refresh
- Simpler than multi-store state management

### Option 3: Unified Hold Management
- Restructure to have a single source of truth for all holds
- Use status flags (persisted, pending, etc.) instead of separate arrays
- Implement proper database transactions for atomic saves

### Option 4: Real-time Auto-save
- Auto-save quick draw holds with debouncing
- Add undo/redo functionality for better UX
- Requires more robust conflict resolution

## Technical Debt Notes

- The current manual hold persistence system works well for its intended purpose
- Quick draw functionality works during sessions but has persistence issues
- Consider revisiting with a dedicated sprint focused on state management architecture
- May benefit from adding integration tests for persistence workflows

## Context for Future Work

When returning to this feature:
1. Review the current manual hold system to understand persistence patterns
2. Consider the broader boulder problem state management architecture
3. Design the pending holds system with clear data flow diagrams
4. Implement with proper error handling and rollback mechanisms
5. Add comprehensive tests for the persistence layer
6. Consider user research on expected behavior for experimental vs committed changes

---

**Status**: Implementation removed due to persistence issues and complexity
**Priority**: Medium - UX improvement but not critical functionality
**Effort**: Large - requires architectural considerations
