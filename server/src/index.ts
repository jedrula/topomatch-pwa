import {onCall} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {getAuth} from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

// Region configuration - all functions deployed to europe-west1
const REGION = "europe-west1";

// Video transcoding functions
export {transcodeVideo, onTranscodingComplete} from "./videoTranscoding";

// Ascent cleanup function (handles /ascents collection with embedded video)
export {onAscentDeleted} from "./ascentCleanup";

// Location image deletion with cascade
export {onLocationImageDeleted} from "./locationImageDeletion";

// Automatic hold detection when images are uploaded
export {onLocationImageUploaded} from "./holdDetection";

// Like toggle function for ascents
export {toggleLike} from "./likeToggle";

// Push notification functions
export {notifyNewRoutesetting} from "./notifications";

// Configure Storage emulator BEFORE initializing Firebase Admin
// This must be set before any Storage client is created
if (process.env.FUNCTIONS_EMULATOR === "true") {
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
}

initializeApp();

const db = getFirestore();
const auth = getAuth();

// Configure Firestore to use emulator if in development
if (process.env.FUNCTIONS_EMULATOR === "true") {
  db.settings({
    host: "127.0.0.1:8080",
    ssl: false,
  });
}

const bucket = getStorage().bucket();

// Admin management functions
export const setAdminRole = onCall({region: REGION}, async (request) => {
  // Only allow existing admins to create new admins
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new Error("Authentication required");
  }

  const callerRecord = await auth.getUser(callerUid);
  const callerClaims = callerRecord.customClaims || {};

  if (!callerClaims.admin) {
    throw new Error("Only admins can grant admin privileges");
  }

  const { uid, isAdmin } = request.data;

  try {
    // Set custom claims
    await auth.setCustomUserClaims(uid, { admin: isAdmin });

    // Also store in Firestore for easy querying
    await db.collection("users").doc(uid).set(
      {
        isAdmin,
        updatedAt: new Date(),
        updatedBy: callerUid,
      },
      { merge: true }
    );

    logger.info(
      `Admin role ${isAdmin ? "granted to" : "removed from"} user ${uid} by ${callerUid}`
    );

    return { success: true, message: `Admin role ${isAdmin ? "granted" : "removed"} successfully` };
  } catch (error) {
    logger.error("Error setting admin role:", error);
    throw new Error("Failed to update admin role");
  }
});

// Initialize admin function - can be called once to set initial admin
export const initializeAdmin = onCall({region: REGION}, async (request) => {
  const { email } = request.data;

  try {
    // Check if any admins exist
    const adminQuery = await db.collection("users").where("isAdmin", "==", true).limit(1).get();

    if (!adminQuery.empty) {
      throw new Error("Admin already exists. Use setAdminRole function instead.");
    }

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);

    // Set as admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    await db.collection("users").doc(userRecord.uid).set(
      {
        isAdmin: true,
        email: userRecord.email,
        createdAt: new Date(),
        role: "admin",
      },
      { merge: true }
    );

    logger.info(`Initial admin privileges granted to ${email}`);

    return { success: true, message: `Admin privileges granted to ${email}` };
  } catch (error) {
    logger.error("Error initializing admin:", error);
    throw new Error("Failed to initialize admin");
  }
});

// Helper function to extract file path from Firebase Storage URL
const getFilePathFromUrl = (downloadUrl: string): string | null => {
  try {
    // Firebase Storage URLs have the format:
    // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(downloadUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch (error) {
    logger.error("Error parsing storage URL:", error);
    return null;
  }
};

// Interface for GradingSystem
interface GradingSystem {
  id: string;
  name: string;
  description?: string;
  grades: Array<{
    label: string;
    color?: string;
  }>;
  isCustom?: boolean;
}

// Interface for Location data
interface Location {
  id?: string;
  name: string;
  name_lowercase?: string; // For prefix search
  description?: string;
  heroImageUrl?: string;
  gradingSystem?: GradingSystem;
  routesettings?: string[]; // Array of ISO timestamps, last one is current
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for LocationImage data
// imageId is always present (matches Firestore doc ID)
// uploadedAt is optional because it's added server-side
// settingDate is required - all images must belong to a routesetting
interface LocationImage {
  imageId: string;
  locationId: string;
  fileName: string;
  downloadUrl: string;
  uploadedAt?: Date;
  routesettings: string[]; // Array of ISO timestamps (YYYY-MM-DDTHH:mm:ss) - which routesettings use this image
}

// Input type for addLocationImage (omit uploadedAt which is added server-side)
// When creating, client provides single routesetting, server converts to array
type AddLocationImageRequest = Omit<LocationImage, 'uploadedAt' | 'routesettings'> & {
  routesetting: string; // Single routesetting when creating (converted to array server-side)
};

// Create a new location
export const createLocation = onCall({region: REGION}, async (request) => {
  try {
    const { name, description, heroImageUrl, gradingSystem } = request.data as Location;

    if (!name) {
      throw new Error("Name is required");
    }

    const locationData: Location = {
      name,
      name_lowercase: name.toLowerCase(), // For prefix search
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add heroImageUrl if it's provided
    if (heroImageUrl) {
      locationData.heroImageUrl = heroImageUrl;
    }

    // Only add gradingSystem if it's provided
    if (gradingSystem) {
      locationData.gradingSystem = gradingSystem;
    }

    const docRef = await db.collection("locations").add(locationData);
    const locationWithId = {
      id: docRef.id,
      ...locationData,
    };

    logger.info("Location created:", locationWithId);
    return locationWithId;
  } catch (error) {
    logger.error("Error creating location:", error);
    throw new Error("Failed to create location");
  }
});

// Get all locations
export const getLocations = onCall({region: REGION}, async (request) => {
  try {
    const snapshot = await db.collection("locations").get();
    const locations: Location[] = [];

    snapshot.forEach((doc) => {
      locations.push({
        id: doc.id,
        ...doc.data(),
      } as Location);
    });

    return locations;
  } catch (error) {
    logger.error("Error getting locations:", error);
    throw new Error("Failed to get locations");
  }
});

// Search locations by name prefix (case-insensitive)
// Uses Firestore range query: https://firebase.google.com/docs/firestore/solutions/search
export const searchLocations = onCall({region: REGION}, async (request) => {
  try {
    const {prefix} = request.data;

    if (!prefix || typeof prefix !== "string") {
      throw new Error("prefix parameter is required");
    }

    const searchPrefix = prefix.toLowerCase().trim();
    
    // Firestore range query trick for prefix search:
    // Query for documents where name_lowercase >= prefix and name_lowercase < prefix + '\uf8ff'
    // \uf8ff is the highest UTF-8 character, so this gives us all documents starting with the prefix
    const snapshot = await db.collection("locations")
      .where("name_lowercase", ">=", searchPrefix)
      .where("name_lowercase", "<", searchPrefix + "\uf8ff")
      .limit(20) // Limit results to prevent huge result sets
      .get();

    const locations: Location[] = [];

    snapshot.forEach((doc) => {
      locations.push({
        id: doc.id,
        ...doc.data(),
      } as Location);
    });

    return locations;
  } catch (error) {
    logger.error("Error searching locations:", error);
    throw new Error("Failed to search locations");
  }
});

// Get a specific location
export const getLocation = onCall({region: REGION}, async (request) => {
  try {
    const { locationId } = request.data;

    if (!locationId) {
      throw new Error("Location ID is required");
    }

    const doc = await db.collection("locations").doc(locationId).get();

    if (!doc.exists) {
      throw new Error("Location not found");
    }

    const location = {
      id: doc.id,
      ...doc.data(),
    } as Location;

    return location;
  } catch (error) {
    logger.error("Error getting location:", error);
    throw new Error("Failed to get location");
  }
});

// Update a location
export const updateLocation = onCall({region: REGION}, async (request) => {
  try {
    const { locationId, name, description, heroImageUrl, gradingSystem } = request.data;

    if (!locationId) {
      throw new Error("Location ID is required");
    }

    if (!name) {
      throw new Error("Name is required");
    }

    // Get the current location to check for existing hero image
    const currentDoc = await db.collection("locations").doc(locationId).get();
    if (!currentDoc.exists) {
      throw new Error("Location not found");
    }

    const currentData = currentDoc.data() as Location;

    // If hero image is being changed and there was an old one, delete the old file
    if (currentData.heroImageUrl && heroImageUrl !== currentData.heroImageUrl) {
      const oldHeroImagePath = getFilePathFromUrl(currentData.heroImageUrl);
      if (oldHeroImagePath) {
        try {
          await bucket.file(oldHeroImagePath).delete();
          logger.info("Deleted old hero image from storage:", oldHeroImagePath);
        } catch (error) {
          logger.warn("Failed to delete old hero image from storage:", oldHeroImagePath, error);
          // Don't throw here - continue with update even if old file deletion fails
        }
      }
    }

    const updateData: Partial<Location> = {
      name,
      name_lowercase: name.toLowerCase(), // Update lowercase version for prefix search
      description: description || "",
      updatedAt: new Date(),
    };

    // Only include heroImageUrl if it's provided and not empty
    if (heroImageUrl && heroImageUrl.trim() !== "") {
      updateData.heroImageUrl = heroImageUrl;
    }

    // Include gradingSystem if it's provided (even if null to explicitly remove)
    if (gradingSystem !== undefined) {
      updateData.gradingSystem = gradingSystem;
    }

    await db.collection("locations").doc(locationId).update(updateData);

    const updatedDoc = await db.collection("locations").doc(locationId).get();
    const updatedLocation = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Location;

    logger.info("Location updated:", updatedLocation);
    return updatedLocation;
  } catch (error) {
    logger.error("Error updating location:", error);
    throw new Error("Failed to update location");
  }
});

// Delete a location and all its related files
export const deleteLocation = onCall({region: REGION}, async (request) => {
  try {
    const { locationId } = request.data;

    if (!locationId) {
      throw new Error("Location ID is required");
    }

    // Get the location document to check for hero image
    const locationDoc = await db.collection("locations").doc(locationId).get();
    if (!locationDoc.exists) {
      throw new Error("Location not found");
    }

    const locationData = locationDoc.data() as Location;

    // Get all associated images before deleting them
    const imageSnapshot = await db
      .collection("locationImages")
      .where("locationId", "==", locationId)
      .get();

    // Delete files from Firebase Storage
    const deleteFilePromises = imageSnapshot.docs.map(async (doc) => {
      const imageData = doc.data() as LocationImage;
      const filePath = getFilePathFromUrl(imageData.downloadUrl);

      if (filePath) {
        try {
          await bucket.file(filePath).delete();
          logger.info("Deleted file from storage:", filePath);
        } catch (error) {
          logger.warn("Failed to delete file from storage:", filePath, error);
          // Don't throw here - continue with cleanup even if file deletion fails
        }
      }
    });

    // Delete hero image if it exists and is a Firebase Storage URL
    if (locationData.heroImageUrl) {
      const heroImagePath = getFilePathFromUrl(locationData.heroImageUrl);
      if (heroImagePath) {
        try {
          await bucket.file(heroImagePath).delete();
          logger.info("Deleted hero image from storage:", heroImagePath);
        } catch (error) {
          logger.warn("Failed to delete hero image from storage:", heroImagePath, error);
          // Don't throw here - continue with cleanup even if file deletion fails
        }
      }
    }

    // Delete Firestore records
    const deleteDocPromises = imageSnapshot.docs.map((doc) => doc.ref.delete());

    // Wait for all deletions to complete
    await Promise.all([...deleteFilePromises, ...deleteDocPromises]);

    // Delete the location document
    await db.collection("locations").doc(locationId).delete();

    logger.info("Location and related data deleted:", locationId);
    return { message: "Location deleted successfully" };
  } catch (error) {
    logger.error("Error deleting location:", error);
    throw new Error("Failed to delete location");
  }
});

// Add an image to a location
// Client generates imageId (same as Storage folder name) for consistency
export const addLocationImage = onCall({region: REGION}, async (request) => {
  try {
    // Input: imageId is the client-generated ID that becomes the Firestore doc ID
    const { imageId, locationId, fileName, downloadUrl, routesetting } = request.data as AddLocationImageRequest;

    if (!imageId || !locationId || !fileName || !downloadUrl || !routesetting) {
      throw new Error("imageId, locationId, fileName, downloadUrl, and routesetting are required");
    }

    // Data to store
    const imageData: Omit<LocationImage, 'uploadedAt'> = {
      imageId,
      locationId,
      fileName,
      downloadUrl,
      routesettings: [routesetting], // Image belongs to this routesetting
    };

    // Use setDoc with client-provided imageId (matches Storage folder name)
    await db.collection("locationImages").doc(imageId).set({
      ...imageData,
      uploadedAt: new Date(),
    });
    
    logger.info(`Added image ${imageId} with routesetting ${routesetting}`);
    
    // Return with uploadedAt field populated
    const imageWithUploadedAt: LocationImage = {
      ...imageData,
      uploadedAt: new Date(),
    };

    logger.info("Location image added:", imageWithUploadedAt);
    return imageWithUploadedAt;
  } catch (error) {
    logger.error("Error adding location image:", error);
    throw new Error("Failed to add location image");
  }
});

// Get all images for a location
export const getLocationImages = onCall({region: REGION}, async (request) => {
  try {
    const { locationId, routesetting } = request.data;

    if (!locationId) {
      throw new Error("locationId is required");
    }

    logger.info(`getLocationImages called with locationId=${locationId}, routesetting=${routesetting}`);

    // If routesetting provided, query images that contain this routesetting in their array
    if (routesetting) {
      logger.info(`Querying with array-contains: routesetting=${routesetting}`);
      
      // First get all images for location
      const allSnapshot = await db
        .collection("locationImages")
        .where("locationId", "==", locationId)
        .get();
      
      logger.info(`Found ${allSnapshot.size} total images for location`);
      
      // Then filter in memory for the routesetting
      const images: LocationImage[] = [];
      allSnapshot.forEach((doc) => {
        const data = doc.data() as LocationImage;
        logger.info(`  Image ${doc.id}: routesettings=${JSON.stringify(data.routesettings)}`);
        
        // Check if this image's routesettings array contains the requested routesetting
        if (data.routesettings && Array.isArray(data.routesettings) && data.routesettings.includes(routesetting)) {
          logger.info(`    ✓ MATCH - including this image`);
          images.push({
            ...data,
            imageId: doc.id,
          });
        } else {
          logger.info(`    ✗ NO MATCH - skipping`);
        }
      });
      
      // Sort by uploadedAt descending
      images.sort((a, b) => {
        const aTime = a.uploadedAt instanceof Date ? a.uploadedAt.getTime() : 0;
        const bTime = b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : 0;
        return bTime - aTime;
      });

      logger.info(`Returning ${images.length} filtered images`);
      return images;
    }

    // No routesetting - return all images for location (admin view)
    logger.info(`No routesetting provided - returning all images for location`);
    const snapshot = await db
      .collection("locationImages")
      .where("locationId", "==", locationId)
      .orderBy("uploadedAt", "desc")
      .get();

    const images: LocationImage[] = [];
    snapshot.forEach((doc) => {
      images.push({
        imageId: doc.id,
        ...doc.data(),
      } as LocationImage);
    });

    return images;
  } catch (error) {
    logger.error("Error getting location images:", error);
    throw new Error("Failed to get location images");
  }
});

// Delete a location image
// Note: Cascade cleanup (Storage, boulder problems, hold detections) handled by onLocationImageDeleted trigger
export const deleteLocationImage = onCall({region: REGION}, async (request) => {
  try {
    const { imageId } = request.data;

    if (!imageId) {
      throw new Error("imageId is required");
    }

    // Verify image exists
    const imageDoc = await db.collection("locationImages").doc(imageId).get();

    if (!imageDoc.exists) {
      throw new Error("Image not found");
    }

    // Delete the Firestore document - this triggers onLocationImageDeleted for cascade cleanup
    await db.collection("locationImages").doc(imageId).delete();

    logger.info("Location image deleted, cascade cleanup triggered:", imageId);
    return { message: "Location image deleted successfully" };
  } catch (error) {
    logger.error("Error deleting location image:", error);
    throw new Error("Failed to delete location image");
  }
});

// Boulder Problems Functions
export const createBoulderProblem = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemData } = request.data;

  if (!locationId || !problemData) {
    throw new Error("Missing required fields: locationId and problemData");
  }

  // Validate required fields
  if (!problemData.name || !problemData.grade || !problemData.imageId) {
    throw new Error("Missing required fields: name, grade, or imageId");
  }

  try {
    const problemsRef = db.collection("locations").doc(locationId).collection("boulderProblems");

    const newProblem = {
      name: problemData.name,
      grade: problemData.grade,
      holds: problemData.holds || [],
      imageId: problemData.imageId,
      color: problemData.color || "#ef4444",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: request.auth.uid,
    };

    const docRef = await problemsRef.add(newProblem);
    logger.info("Boulder problem created:", docRef.id);

    return {
      problemId: docRef.id,
      problem: { id: docRef.id, ...newProblem },
    };
  } catch (error) {
    logger.error("Error creating boulder problem:", error);
    throw new Error("Failed to create boulder problem");
  }
});

export const getBoulderProblems = onCall({region: REGION}, async (request) => {
  const { locationId, imageId, routesetting } = request.data;

  if (!locationId) {
    throw new Error("Missing required field: locationId");
  }

  try {
    // If routesetting is provided, first get imageIds that match the routesetting
    let filteredImageIds: string[] | null = null;
    if (routesetting && !imageId) {
      console.log(`🔍 Filtering by routesetting: ${routesetting}`);
      const imagesSnapshot = await db
        .collection("locationImages")
        .where("locationId", "==", locationId)
        .where("routesettings", "array-contains", routesetting)
        .get();
      
      filteredImageIds = imagesSnapshot.docs.map(doc => doc.id);
      console.log(`📷 Found ${filteredImageIds.length} images with routesetting:`, filteredImageIds);
      
      // If no images match the routesetting, return empty array early
      if (filteredImageIds.length === 0) {
        console.log(`✅ No images found, returning empty array`);
        return { problems: [], metadata: null };
      }
    }

    let query = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .orderBy("createdAt", "desc");

    if (imageId) {
      query = query.where("imageId", "==", imageId);
    } else if (filteredImageIds) {
      // Firestore 'in' query supports up to 30 values
      if (filteredImageIds.length <= 30) {
        console.log(`✅ Using Firestore 'in' query with ${filteredImageIds.length} imageIds`);
        query = query.where("imageId", "in", filteredImageIds);
      } else {
        // If more than 30, this will break - acceptable for now
        throw new Error(`Too many images (${filteredImageIds.length}) - Firestore 'in' limit is 30`);
      }
    }

    const querySnapshot = await query.get();
    const problems: any[] = [];
    console.log(`📋 Query returned ${querySnapshot.size} problems`);

    querySnapshot.forEach((doc) => {
      const problemData: any = doc.data();
      const problem = {
        id: doc.id,
        ...problemData,
      };
      
      // If we have more than 10 filtered images, filter in-memory
      if (filteredImageIds && filteredImageIds.length > 10) {
        if (filteredImageIds.includes(problemData.imageId)) {
          problems.push(problem);
        }
      } else {
        problems.push(problem);
      }
    });

    // If imageId is provided, try to get the holdDetection metadata
    let metadata = null;
    if (imageId) {
      try {
        const holdDetectionRef = db
          .collection("locations")
          .doc(locationId)
          .collection("holdDetections")
          .doc(imageId);
        const holdDetectionSnap = await holdDetectionRef.get();
        
        if (holdDetectionSnap.exists) {
          const detectionData = holdDetectionSnap.data();
          metadata = detectionData?.detectionResults?.metadata || null;
        }
      } catch (error) {
        logger.warn(`Failed to fetch holdDetection metadata for image ${imageId}:`, error);
      }
    }

    logger.info(
      `Retrieved ${problems.length} boulder problems for location ${locationId}${
        imageId ? ` and image ${imageId}` : ""
      }${metadata ? " with metadata" : ""}`
    );
    
    return { problems, metadata };
  } catch (error) {
    logger.error("Error fetching boulder problems:", error);
    throw new Error("Failed to fetch boulder problems");
  }
});

export const getBoulderProblem = onCall({region: REGION}, async (request) => {
  const { locationId, problemId } = request.data;

  if (!locationId || !problemId) {
    throw new Error("Missing required fields: locationId and problemId");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);
    const problemSnap = await problemRef.get();

    if (!problemSnap.exists) {
      throw new Error("Boulder problem not found");
    }

    const problemData = {
      id: problemSnap.id,
      ...problemSnap.data(),
    };

    logger.info("Retrieved boulder problem:", problemId);
    return { problem: problemData };
  } catch (error) {
    logger.error("Error fetching boulder problem:", error);
    throw new Error("Failed to fetch boulder problem");
  }
});

export const updateBoulderProblem = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, updates } = request.data;

  if (!locationId || !problemId || !updates) {
    throw new Error("Missing required fields: locationId, problemId, and updates");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);

    // Check if the problem exists
    const problemSnap = await problemRef.get();
    if (!problemSnap.exists) {
      throw new Error("Boulder problem not found");
    }

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    await problemRef.update(updateData);
    logger.info("Boulder problem updated:", problemId);

    return { message: "Boulder problem updated successfully" };
  } catch (error) {
    logger.error("Error updating boulder problem:", error);
    throw new Error("Failed to update boulder problem");
  }
});

export const deleteBoulderProblem = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId } = request.data;

  if (!locationId || !problemId) {
    throw new Error("Missing required fields: locationId and problemId");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);

    // Check if the problem exists
    const problemSnap = await problemRef.get();
    if (!problemSnap.exists) {
      throw new Error("Boulder problem not found");
    }

    await problemRef.delete();
    logger.info("Boulder problem deleted:", problemId);

    return { message: "Boulder problem deleted successfully" };
  } catch (error) {
    logger.error("Error deleting boulder problem:", error);
    throw new Error("Failed to delete boulder problem");
  }
});

export const deleteAllBoulderProblems = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId } = request.data;

  if (!locationId) {
    throw new Error("Missing required field: locationId");
  }

  try {
    const problemsRef = db.collection("locations").doc(locationId).collection("boulderProblems");

    // Get all boulder problems for this location
    const problemsSnap = await problemsRef.get();

    if (problemsSnap.empty) {
      logger.info(`No boulder problems found for location ${locationId}`);
      return { message: "No boulder problems to delete", deletedCount: 0 };
    }

    // Delete all problems in a batch
    const batch = db.batch();
    problemsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    const deletedCount = problemsSnap.size;
    logger.info(`Deleted ${deletedCount} boulder problems for location ${locationId}`);

    return {
      message: `Successfully deleted ${deletedCount} boulder problems`,
      deletedCount,
    };
  } catch (error) {
    logger.error("Error deleting all boulder problems:", error);
    throw new Error("Failed to delete all boulder problems");
  }
});

export const addHoldToProblem = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, hold, holdId } = request.data;

  if (!locationId || !problemId || !hold || !holdId) {
    throw new Error("Missing required fields: locationId, problemId, hold, and holdId");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);
    const problemSnap = await problemRef.get();

    if (!problemSnap.exists) {
      throw new Error("Boulder problem not found");
    }

    const problemData = problemSnap.data();
    const currentHolds = problemData?.holds || [];

    // Check if hold is already in the problem (match by holdId)
    const existingHoldIndex = currentHolds.findIndex(
      (h: any) => h.holdId === holdId
    );

    if (existingHoldIndex === -1) {
      // Add the hold with complete self-contained data
      const newHold = {
        // Core identification - use immutable holdId
        holdId: holdId,

        // Complete hold data (self-contained)
        confidence: hold.confidence || 0,
        bbox: hold.bbox || [0, 0, 0, 0],
        coordinates: hold.coordinates || {
          x: hold.bbox?.[0] || 0,
          y: hold.bbox?.[1] || 0,
          width: hold.bbox?.[2] || 0,
          height: hold.bbox?.[3] || 0,
        },

        // Self-contained SVG markup
        svgMarkup: hold.svgMarkup || null,
        detectionSource: hold.detectionSource || "unknown",

        // Metadata
        addedAt: new Date(),
        addedBy: request.auth.uid,
      };

      currentHolds.push(newHold);
      logger.info(`Hold ${holdId} added to problem ${problemId} with SVG markup`);
    } else {
      // Remove the hold if it already exists (toggle behavior)
      currentHolds.splice(existingHoldIndex, 1);
      logger.info(`Hold ${holdId} removed from problem ${problemId}`);
    }

    await problemRef.update({
      holds: currentHolds,
      updatedAt: new Date(),
    });

    return {
      message: `Hold ${holdId} ${
        existingHoldIndex === -1 ? "added to" : "removed from"
      } problem successfully`,
      holds: currentHolds,
    };
  } catch (error) {
    logger.error("Error adding/removing hold from problem:", error);
    throw new Error("Failed to add/remove hold from problem");
  }
});

export const removeHoldFromProblem = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, holdId } = request.data;

  if (!locationId || !problemId || !holdId) {
    throw new Error("Missing required fields: locationId, problemId, and holdId");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);
    const problemSnap = await problemRef.get();

    if (!problemSnap.exists) {
      throw new Error("Boulder problem not found");
    }

    const problemData = problemSnap.data();
    const currentHolds = problemData?.holds || [];

    // Remove the hold by holdId (immutable identifier)
    const updatedHolds = currentHolds.filter((h: any) => h.holdId !== holdId);

    await problemRef.update({
      holds: updatedHolds,
      updatedAt: new Date(),
    });

    logger.info(`Hold ${holdId} removed from problem ${problemId}`);

    return {
      message: `Hold ${holdId} removed from problem successfully`,
      holds: updatedHolds,
    };
  } catch (error) {
    logger.error("Error removing hold from problem:", error);
    throw new Error("Failed to remove hold from problem");
  }
});

export const updateProblemHolds = onCall({region: REGION}, async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, holds } = request.data;

  if (!locationId || !problemId || !holds) {
    throw new Error("Missing required fields: locationId, problemId, and holds");
  }

  try {
    const problemRef = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .doc(problemId);

    await problemRef.update({
      holds: holds.map((hold: any) => ({
        ...hold,
        addedAt: hold.addedAt || new Date(),
      })),
      updatedAt: new Date(),
    });

    logger.info(`Updated holds for problem ${problemId}`);

    return {
      message: "Problem holds updated successfully",
      holds,
    };
  } catch (error) {
    logger.error("Error updating problem holds:", error);
    throw new Error("Failed to update problem holds");
  }
});
