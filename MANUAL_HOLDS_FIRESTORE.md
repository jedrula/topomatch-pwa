# Manual Holds Firestore Migration

## 🎯 Overview

Manual holds storage has been migrated from localStorage to Firestore for better collaboration and data persistence across devices and users.

## 🏗️ Architecture

### **Data Structure**

```
locations/{locationId}/
  └── manualHolds/{imageUrl_hash}
      ├── imageUrl: string
      ├── holds: array of manual hold objects
      ├── createdAt: timestamp
      ├── updatedAt: timestamp
      └── contributors: array of user IDs
```

### **Benefits**

- ✅ **Shared across users** - Multiple users can contribute holds for the same image
- ✅ **Cross-device sync** - Access your manual holds from any device
- ✅ **Collaboration** - Track who contributed which holds
- ✅ **Persistence** - No data loss from browser storage limitations
- ✅ **Real-time updates** - Manual holds appear immediately for all users

## 🔧 Implementation

### **New Service Layer**

- `manualHoldsService.js` - Firestore CRUD operations for manual holds
- Handles document ID generation from image URLs
- Tracks user contributions and timestamps

### **Updated Store**

- `holdDetectionServerStore.js` now uses Firestore instead of localStorage
- Async operations with optimistic UI updates
- Error handling with fallback to reload from Firestore

### **Component Integration**

- `InteractiveHoldOverlay.vue` passes locationId and imageUrl to store actions
- Automatic loading of manual holds when image changes
- Real-time persistence during drawing operations

## 🚀 Usage

### **For Users**

1. Navigate to any climbing image in a location
2. Click "Enable Drawing Mode"
3. Draw holds manually using circle, rectangle, or polygon tools
4. Holds are automatically saved to Firestore and shared with other users
5. Switch to another image and back - your holds persist

### **For Developers**

```javascript
// Load manual holds for an image
await manualHoldsService.loadManualHolds(locationId, imageUrl);

// Add a new manual hold
await manualHoldsService.addManualHold(locationId, imageUrl, holdData);

// Save all current holds
await manualHoldsService.saveManualHolds(locationId, imageUrl, holdsArray);
```

## 🔒 Security

### **Firestore Rules**

```javascript
// Manual holds subcollection
match /manualHolds/{holdDocId} {
  allow read: if true; // Public read access - manual holds are shared
  allow write: if isAuthenticated(); // Authenticated users can contribute
}
```

### **Access Control**

- **Read**: Public access (any user can see manual holds)
- **Write**: Authenticated users only (must be logged in to contribute)
- **Contributors tracking**: Each hold tracks who created it and when

## 📊 Data Model

### **Manual Hold Object**

```javascript
{
  id: "manual_1703123456789_abc123def",
  x: 245.67,
  y: 123.45,
  width: 45.2,
  height: 38.9,
  confidence: 1.0,
  type: "manual",
  tool: "circle", // circle, rectangle, polygon
  svgMarkup: "<circle cx='245.67' cy='123.45' r='22.6' fill='rgba(59, 130, 246, 0.3)' stroke='#3b82f6' stroke-width='2'/>",
  centerPoint: { x: 245.67, y: 123.45 },
  boundingBox: { x: 223.07, y: 101.55, width: 45.2, height: 43.8 },
  createdBy: "user123", // Added by Firestore service
  createdAt: "2024-12-21T10:30:45.123Z",
  timestamp: "2024-12-21T10:30:45.123Z"
}
```

### **Firestore Document Structure**

```javascript
{
  imageUrl: "https://firebase.storage.googleapis.com/...",
  holds: [/* array of manual hold objects */],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  contributors: ["user123", "user456"] // Array of UIDs who contributed
}
```

## 🔄 Migration Process

### **From localStorage to Firestore**

1. **Previous**: `localStorage.setItem('manual_holds_' + btoa(imageUrl), JSON.stringify(holds))`
2. **Now**: `manualHoldsService.saveManualHolds(locationId, imageUrl, holds)`

### **Backward Compatibility**

- No breaking changes to existing manual hold data structure
- Same hold format works with boulder problem creation
- Existing manual holds in localStorage will be lost but can be redrawn

## 🧪 Testing

### **How to Test**

1. Open any location with images (e.g., `/location/{locationId}/holds-server?imageId={imageId}`)
2. Enable drawing mode and draw some holds
3. Refresh the page - holds should persist
4. Open the same image in another browser/device - holds should appear
5. Check Firestore console to see the data structure

### **Expected Behavior**

- Manual holds appear immediately when drawn
- Holds persist across page refreshes and browser sessions
- Multiple users can contribute holds to the same image
- Error handling gracefully handles Firestore connection issues

## 🎨 UI/UX Improvements

### **Visual Feedback**

- Existing holds remain visible during drawing mode (with reduced opacity)
- Immediate visual feedback when drawing new holds
- Consistent styling between AI-detected and manual holds

### **Drawing Tools**

- **Circle**: Click and drag to create circular holds
- **Rectangle**: Click and drag to create rectangular holds
- **Polygon**: Click multiple points, right-click to finish complex shapes

### **Drawing Instructions**

- Contextual help text shows current tool usage
- ESC key exits drawing mode
- Right-click finishes polygon drawing

## 🚀 Future Enhancements

### **Potential Features**

- Real-time collaborative editing with live cursors
- Manual hold versioning and history
- Import/export of manual holds between locations
- Bulk editing operations
- Manual hold quality ratings and moderation
- Integration with AI training data collection

### **Performance Optimizations**

- Client-side caching layer for frequently accessed holds
- Batch operations for multiple hold modifications
- Optimistic UI updates with conflict resolution
