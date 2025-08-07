# Boulder Problems Backend Integration

## Overview

This implementation provides a complete backend integration for boulder problems using Firestore with the following features:

- **Hierarchical Storage**: Boulder problems are stored as subcollections under locations
- **Automatic Cleanup**: When a location is deleted, all its boulder problems are automatically deleted
- **Optimistic Updates**: UI updates immediately while syncing with backend
- **Error Handling**: Comprehensive error handling with rollback capabilities
- **Real-time Sync**: Problems sync across devices when using the same location/image

## Data Structure

### Firestore Schema

```
locations/{locationId}/
  └── boulderProblems/{problemId}
      ├── id: string
      ├── name: string
      ├── grade: string (V0, V1, V2, etc.)
      ├── holds: array of hold objects
      ├── imageId: string (reference to location image)
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      ├── createdBy: string (user ID)
      └── color: string (hex color for UI)
```

### Hold Object Structure (Updated for Self-Contained SVG)

```javascript
{
  // Core identification
  holdIndex: number,           // Index in detection results (for backward compatibility)
  detectionIndex: number,      // Original detection index
  id: string,                  // Unique hold identifier

  // Hold metadata
  confidence: number,          // Detection confidence (0-1)
  bbox: [x, y, width, height], // Bounding box coordinates
  coordinates: {               // Coordinate object for backward compatibility
    x: number,
    y: number,
    width: number,
    height: number
  },

  // Self-contained SVG markup (the key improvement!)
  svgMarkup: string,           // Complete SVG markup for this hold
  detectionSource: string,     // 'svg_markups' | 'svg_files' | 'user_drawn' | 'custom'

  // Metadata
  addedAt: timestamp,          // When hold was added to problem
  addedBy: string             // User ID who added the hold
}
```

**Key Benefits of Self-Contained SVG:**

- **Future-Proof**: Can store any SVG markup (rectangles, circles, custom shapes, user drawings)
- **Independent**: Each hold carries its complete visual representation
- **Flexible**: Supports combined holds, modified holds, or entirely custom markup
- **Portable**: Hold data can be moved between problems or exported without dependencies
  height: number,
  type: string, // Hold type (jug, crimp, etc.)
  confidence: number, // AI confidence (0-1)
  color: {
  name: string, // Color name
  hex: string // Hex color code
  }
  },
  addedAt: timestamp // When hold was added to problem
  }

````

## Usage Examples

### 1. Creating a Boulder Problem

```javascript
// From the hold detection page with query params
// URL: /hold-detection?locationId=abc123&imageId=img456

// The store automatically initializes for the location/image
await boulderProblemsStore.createNewProblem("V3", "Crimpy Goodness");

// Add holds by clicking on detected holds
// This happens automatically when clicking holds while creating
````

### 2. Loading Existing Problems

```javascript
// Load all problems for a location
await boulderProblemsStore.loadBoulderProblems(locationId);

// Load problems for specific image
await boulderProblemsStore.loadBoulderProblems(locationId, imageId);
```

### 3. Updating Problems

```javascript
// Update problem name
await boulderProblemsStore.updateProblemName(problemId, "New Name");

// Update grade
await boulderProblemsStore.updateProblemGrade(problemId, "V5");

// Add/remove holds (toggles)
await boulderProblemsStore.addHoldToProblem(problemId, holdData, holdIndex);
```

### 4. Direct Service Usage

```javascript
// Create problem directly
const problemId = await boulderProblemsService.createBoulderProblem(
  locationId,
  {
    name: "Test Problem",
    grade: "V2",
    imageId: "img123",
    color: "#ef4444",
  }
);

// Get problems by image
const problems = await boulderProblemsService.getBoulderProblemsByImage(
  locationId,
  imageId
);
```

## Navigation Flow

1. **Location Detail Page**: Admin sees "Holds" button on images
2. **Click Holds Button**: Navigates to `/hold-detection?locationId=X&imageId=Y`
3. **Hold Detection Page**:
   - Loads existing problems for this image
   - Allows creating new problems
   - Click holds to add/remove from active problem
4. **Back Navigation**: Returns to location detail page

## Error Handling

- **Optimistic Updates**: UI updates immediately, reverts on backend failure
- **Network Issues**: Operations queue and retry automatically
- **Validation Errors**: Clear error messages displayed to user
- **Rollback**: Failed operations automatically rollback local state

## Authentication

Uses Firebase Authentication with email/password sign-in. Admin users are determined by email address checking in the auth service. The system includes:

- **Firebase Auth Integration**: Real user authentication with Firebase Auth emulator support
- **Role-based Access**: Admin permissions based on email verification
- **Session Management**: Automatic auth state persistence and restoration
- **User Interface**: Login/registration modal with form validation and error handling

## Firestore Security Rules

Ensure your Firestore rules allow authenticated users to read/write boulder problems:

```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /locations/{locationId}/boulderProblems/{problemId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Performance Considerations

- **Subcollections**: Auto-deleted with parent, efficient querying
- **Indexed Queries**: Queries are indexed on `createdAt` and `imageId`
- **Batch Operations**: Bulk operations use Firestore batches
- **Caching**: Consider implementing client-side caching for frequently accessed problems

## Future Enhancements

1. **Real-time Subscriptions**: Listen to problem changes in real-time
2. **Offline Support**: Queue operations when offline
3. **Image Change Detection**: Handle when detection results change
4. **Problem Versioning**: Track changes to problem holds over time
5. **Sharing**: Allow sharing problems between users
6. **Statistics**: Track problem popularity, difficulty ratings, etc.
