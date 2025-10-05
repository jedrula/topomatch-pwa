# Hold Type System Documentation

## Overview

We've implemented a comprehensive TypeScript typing system for holds across the application. This provides:

- **Type Safety**: Catch errors at compile time
- **Consistency**: Same hold structure everywhere
- **Clarity**: Clear distinction between AI and manual holds
- **Flexibility**: Support for different hold roles in boulder problems

## Hold Type Hierarchy

```typescript
// Base interface - common properties
interface BaseHold {
  id: string;
  x: number;
  y: number; 
  width: number;
  height: number;
  svgMarkup?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// AI-detected holds
interface AIDetectedHold extends BaseHold {
  source: 'ai';
  confidence: number;
  type: string;
  // ... AI-specific properties
}

// Manually drawn holds  
interface ManualHold extends BaseHold {
  source: 'manual';
  createdBy: string;
  type?: string;
  color?: string;
  notes?: string;
}

// Union type for all holds
type Hold = AIDetectedHold | ManualHold;
```

## Usage Examples

### 1. Working with Individual Holds

```typescript
import { createAIHold, createManualHold, isAIDetectedHold } from '@/types/holds';

// Create an AI-detected hold
const aiHold = createAIHold({
  id: 'ai_123',
  x: 100, y: 200, width: 30, height: 40,
  confidence: 0.95,
  type: 'hold'
});

// Create a manual hold
const manualHold = createManualHold({
  id: 'manual_456', 
  x: 150, y: 250, width: 25, height: 35,
  createdBy: 'user123',
  color: '#ff0000'
});

// Type-safe checking
if (isAIDetectedHold(aiHold)) {
  console.log('Confidence:', aiHold.confidence); // ✅ TypeScript knows this exists
}
```

### 2. Boulder Problem Holds

```typescript
import { createProblemHold } from '@/types/holds';

// Add a hold to a boulder problem with role
const problemHold = createProblemHold(
  someHold, 
  0, // holdIndex
  'start' // role
);

// In the store:
addHoldToProblem(problemId, hold, holdIndex, 'start');
```

### 3. Using Utility Functions

```typescript
import { 
  combineHolds, 
  getAIHolds, 
  getManualHolds,
  findNearbyHolds,
  getHoldStatistics 
} from '@/utils/holdUtils';

// Combine AI and manual holds
const allHolds = combineHolds(aiHolds, manualHolds);

// Get statistics
const stats = getHoldStatistics(allHolds);
console.log(`Total: ${stats.total}, AI: ${stats.aiCount}, Manual: ${stats.manualCount}`);

// Find nearby holds
const nearbyHolds = findNearbyHolds(targetHold, allHolds, 50);
```

### 4. Legacy Compatibility

```typescript
import { convertSimpleHoldToHold, convertHoldToSimpleHold } from '@/types/holds';

## Migration Guide

### Using the New Types

Since the current codebase already uses the proper structure, migration is straightforward:

```typescript
// Before: Manual type handling
const holds = data.aiHolds || [];

// After: Use type-safe utilities
import { normalizeDetectionResults, combineHolds } from '@/utils/holdUtils';

const detectionResults = normalizeDetectionResults(data);
const allHolds = combineHolds(detectionResults.aiHolds, detectionResults.manualHolds);
```

### Data Conversion

The app already stores data in the correct format, so minimal conversion is needed:

```typescript
// Simple normalization for safety
const normalizedData = normalizeDetectionResults(rawData);
```
```

## Files Updated

### New Type Definitions
- `src/types/holds.ts` - Core hold type definitions
- `src/utils/holdUtils.ts` - Utility functions for working with holds

### Updated Services  
- `src/stores/boulderProblemsStore.js` - Added JSDoc typing for hold functions
- `src/services/manualHoldsService.js` - Added JSDoc typing

### Available for Update
These files can be gradually updated to use the new types:
- `src/services/holdDetectionService.js` 
- `src/components/InteractiveHoldOverlay.vue`
- `src/views/HoldDetectionServerView.vue`
- Various other components that work with holds

## Benefits

1. **Type Safety**: IDE will catch type errors before runtime
2. **IntelliSense**: Better autocomplete and documentation 
3. **Refactoring**: Safer code changes with TypeScript's analysis
4. **Documentation**: Types serve as living documentation
5. **Consistency**: Enforced structure across all hold usage

## Migration Strategy

1. ✅ **Core types defined** (`holds.ts`, `holdUtils.ts`)
2. ✅ **Store updated** with JSDoc typing 
3. 🔄 **Gradual adoption** - Update files as you work on them
4. 🔄 **Component conversion** - Convert key components to TypeScript
5. 🔄 **Service conversion** - Convert services to TypeScript

The system is backward compatible - existing code will continue working while new code can adopt the improved typing gradually.