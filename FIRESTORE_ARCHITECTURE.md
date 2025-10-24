# Firestore Architecture - High Level Overview

**Project**: TopoMatch PWA  
**Last Updated**: 2025-10-23  
**Database**: Cloud Firestore

---

## 🎯 What This App Does

TopoMatch is a climbing app where users can:
- Browse climbing locations (gyms, outdoor crags)
- View boulder problems on wall images
- Upload and watch beta videos
- Log their ascents (climbs) with optional video
- AI-detected holds help identify climbing routes
- Admins can manage route settings by deleting old images/problems

---

## 📚 Collection Structure Overview

### Top-Level Collections (Root Level)

```
/users                    - User profiles and permissions (admin flags)
/locations                - Climbing locations (gyms, crags, etc.)
/locationImages           - Wall photos (flattened, can be deleted on route reset)
/ascents                  - User climbs with optional embedded video data ⭐ NEW
/app-config               - App settings (hold detection server URL, feature flags)
```

### Nested Collections (Subcollections)

```
/locations/{id}/boulderProblems/{id}     - Boulder problems at a specific location
/locations/{id}/holdDetections/{imageId} - AI-detected holds on wall images
```

**Note**: Ascents are NO LONGER nested under boulderProblems! They're top-level for easier querying and to preserve user data when problems are deleted.

---

## 🔗 How Collections Relate

### The Basic Hierarchy

```
Location (e.g., "Brooklyn Boulders")
│
├─ LocationImages (photos of walls)
│   └─ Used by: BoulderProblems reference these via imageId
│   └─ Deletable: Cascade deletes problems and hold detections
│
├─ BoulderProblems (routes on the walls)
│   ├─ References: imageId (which wall photo)
│   ├─ Contains: hold data (which holds to use)
│   └─ Deletable: Safe to delete, ascents preserved with problemSnapshot
│
└─ HoldDetections (AI analysis of wall photos)
    └─ Keyed by: imageId (one detection per image)
    └─ Deletable: Removed when image is deleted
```

### Top-Level Collections (Independent)

**Ascents** ⭐ - Stored at root level (NOT nested):
- Need to query "all climbs by a user" (across all locations/problems)
- Need to query "all climbs at a location" (across all problems)
- Need to query "all climbs on a problem"
- References: `locationId`, `problemId`, `userId`
- Contains: `problemSnapshot` (name, grade, color) for historical preservation
- Contains: Optional `video` object embedded (replaces separate climbVideos collection)
- **Never deleted** - preserves user climb history even when problems/images are removed

**Why Merge Videos with Ascents?**
- Every video belongs to an ascent (no standalone beta videos in v1)
- Simplifies queries: one document has all climb data
- Easier deletion: delete ascent = delete video automatically
- Video is just a property of the ascent (like notes or date)

---

## 📊 Key Data Flows

### 1️⃣ Creating a Boulder Problem

```
1. Upload wall image → locationImages/{imageId}
2. AI detects holds → holdDetections/{imageId}
3. User selects holds + names route → boulderProblems/{problemId}
   (contains: name, grade, color, selected hold IDs)
```

### 2️⃣ Logging a Climb with Video

```
1. User uploads video while logging climb
2. Create ascent document → ascents/{ascentId}
   (contains: userId, locationId, problemId, attemptType, notes, date)
   (includes: problemSnapshot - name, grade, color)
   (includes: video object - paths, status, metadata)
3. Video transcoding happens asynchronously
4. Cloud Function updates ascent.video.status = 'ready' when done
```

### 3️⃣ Watching Beta Videos

```
1. Query ascents by problemId → get all climbs of that problem
2. OR query by locationId → get all climbs at that location  
3. OR query by userId → get all of user's climbs
4. Filter for ascents where video exists
5. Video stored in Firebase Storage, paths in ascent.video object
```

### 4️⃣ Route Setting (Deleting Old Problems)

```
1. Admin deletes locationImage → Triggers Cloud Function cascade:
   - Delete all boulderProblems where imageId matches
   - Delete holdDetections document for that imageId
   - Delete Storage file for the image
2. Ascents remain untouched (top-level, preserved forever)
3. Old ascents still show problem name/grade via problemSnapshot
4. Videos still play (Storage files not deleted)
```

---

## 💾 Storage Integration

Firebase Storage paths mirror Firestore structure:

```
/videos/raw/{userId}/{ascentId}.mp4              - Original video uploads
/videos/transcoded/{userId}/{ascentId}/video.mp4  - Transcoded for web playback
/locations/{locationId}/images/{imageId}.jpg     - Wall photos
```

**Firestore stores paths** in ascent.video object or image downloadUrl field.

**Note**: Videos use `ascentId` not separate `videoId` since video is embedded in ascent.

---

## ☁️ Cloud Functions (Automated Tasks)

- **`onTranscodingComplete`** - Update ascent.video.status when transcoding finishes
- **`onAscentDeleted`** - When ascent deleted → delete video files from Storage
- **`onLocationImageDeleted`** ⭐ NEW - Cascade delete: image → problems → hold detections → storage file
- **`transcodeVideo`** - Initiate video transcoding after upload
- **`deleteLocation`** - Cascade delete: location → images → storage files

---

## 🔒 Security Pattern

- **Public Read**: Locations, problems, videos (anyone can browse)
- **Authenticated Write**: Need login to upload images, create problems, log ascents
- **Owner Delete**: Only uploader can delete their videos/images
- **Admin Only**: User permissions, app configuration

---

## 📑 Indexes (Why They Matter)

Firestore requires composite indexes for queries with `WHERE` + `ORDER BY`:

| Collection | Query Pattern | Index Fields |
|------------|---------------|--------------|
| `ascents` | "All climbs by this user" | `userId + date` |
| `ascents` | "All climbs at location" | `locationId + date` |
| `ascents` | "All climbs of problem" | `problemId + date` |
| `locationImages` | "Images at location" | `locationId + uploadedAt` |
| `boulderProblems` | "Problems on this wall image" | `imageId + createdAt` |

**Without indexes**: Queries fail or limited to 200 documents  
**Managed in**: `firestore.indexes.json`

---

## 🏗️ Design Decisions

### Why Top-Level Ascents (Not Nested)?

**Old**: `/locations/{id}/boulderProblems/{id}/ascents/{id}` (nested)  
**New**: `/ascents/{id}` (top-level) ⭐

**Benefits**:
- ✅ Easier queries across locations/problems
- ✅ Can DELETE boulder problems without losing ascent access
- ✅ User climb history preserved even after route settings
- ✅ Simpler security rules
- ✅ No collectionGroup queries needed

### Why Merge Videos into Ascents?

**Old**: Separate `/climbVideos` collection  
**New**: Video embedded in ascent document ⭐

**Benefits**:
- ✅ Every video belongs to an ascent (no standalone beta videos)
- ✅ Single query gets climb + video data
- ✅ Simpler deletion (delete ascent = delete video)
- ✅ Video is just a property of the ascent
- ✅ Fewer collections to manage

### Why Embed problemSnapshot in Ascent?

**Purpose**: Preserve climb context when problem is deleted

**Contains**: name, grade, color (minimal data)

**Why Not Full Problem**: Keep it minimal for fast iteration, can expand later

### Why Embed Holds in Problem?

**Alternative**: Separate `/holds` collection  
**Benefit of Embedding**: 
- Single read to get problem + all holds
- No join queries needed
- Holds don't exist outside problem context

---

## 🎓 Quick Reference

### Get Videos for a Problem
```javascript
query(collection(db, 'climbVideos'), 
  where('problemId', '==', problemId),
  orderBy('createdAt', 'desc'))
```

### Get User's Climbs
```javascript
query(collectionGroup(db, 'ascents'),
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'))
```

### Get Problems on Image
```javascript
query(collection(db, 'locations', locId, 'boulderProblems'),
  where('imageId', '==', imageId),
  orderBy('createdAt', 'desc'))
```

---

**Questions?** Check the codebase or ask the team!

**Questions?** Check the codebase or ask the team!
