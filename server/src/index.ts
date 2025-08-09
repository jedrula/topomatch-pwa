import { onCall } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

initializeApp();

const db = getFirestore();
const bucket = getStorage().bucket();
const auth = getAuth();

// Configure Firestore to use emulator if in development
if (process.env.FUNCTIONS_EMULATOR === "true") {
  db.settings({
    host: "127.0.0.1:8080",
    ssl: false,
  });
}

// Admin management functions
export const setAdminRole = onCall(async (request) => {
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
export const initializeAdmin = onCall(async (request) => {
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
  description?: string;
  heroImageUrl?: string;
  gradingSystem?: GradingSystem;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for LocationImage data
interface LocationImage {
  id?: string;
  locationId: string;
  fileName: string;
  downloadUrl: string;
  uploadedAt?: Date;
}

// Create a new location
export const createLocation = onCall(async (request) => {
  try {
    const { name, description, heroImageUrl, gradingSystem } = request.data as Location;

    if (!name) {
      throw new Error("Name is required");
    }

    const locationData: Location = {
      name,
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
export const getLocations = onCall(async (request) => {
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

// Get a specific location
export const getLocation = onCall(async (request) => {
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
export const updateLocation = onCall(async (request) => {
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
      description: description || "",
      updatedAt: new Date(),
    };

    // Only include heroImageUrl if it's provided and not empty
    if (heroImageUrl && heroImageUrl.trim() !== "") {
      updateData.heroImageUrl = heroImageUrl;
    }

    // Only include gradingSystem if it's provided
    if (gradingSystem) {
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
export const deleteLocation = onCall(async (request) => {
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
export const addLocationImage = onCall(async (request) => {
  try {
    const { locationId, fileName, downloadUrl } = request.data as LocationImage;

    if (!locationId || !fileName || !downloadUrl) {
      throw new Error("locationId, fileName, and downloadUrl are required");
    }

    const imageData: LocationImage = {
      locationId,
      fileName,
      downloadUrl,
      uploadedAt: new Date(),
    };

    const docRef = await db.collection("locationImages").add(imageData);
    const imageWithId = {
      id: docRef.id,
      ...imageData,
    };

    logger.info("Location image added:", imageWithId);
    return imageWithId;
  } catch (error) {
    logger.error("Error adding location image:", error);
    throw new Error("Failed to add location image");
  }
});

// Get all images for a location
export const getLocationImages = onCall(async (request) => {
  try {
    const { locationId } = request.data;

    if (!locationId) {
      throw new Error("locationId is required");
    }

    const snapshot = await db
      .collection("locationImages")
      .where("locationId", "==", locationId)
      .orderBy("uploadedAt", "desc")
      .get();

    const images: LocationImage[] = [];
    snapshot.forEach((doc) => {
      images.push({
        id: doc.id,
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
export const deleteLocationImage = onCall(async (request) => {
  try {
    const { imageId } = request.data;

    if (!imageId) {
      throw new Error("imageId is required");
    }

    // Get the image document to retrieve the download URL
    const imageDoc = await db.collection("locationImages").doc(imageId).get();

    if (!imageDoc.exists) {
      throw new Error("Image not found");
    }

    const imageData = imageDoc.data() as LocationImage;
    const filePath = getFilePathFromUrl(imageData.downloadUrl);

    // Delete file from Firebase Storage
    if (filePath) {
      try {
        await bucket.file(filePath).delete();
        logger.info("Deleted file from storage:", filePath);
      } catch (error) {
        logger.warn("Failed to delete file from storage:", filePath, error);
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete the Firestore document
    await db.collection("locationImages").doc(imageId).delete();

    logger.info("Location image deleted:", imageId);
    return { message: "Location image deleted successfully" };
  } catch (error) {
    logger.error("Error deleting location image:", error);
    throw new Error("Failed to delete location image");
  }
});

// Boulder Problems Functions
export const createBoulderProblem = onCall(async (request) => {
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

export const getBoulderProblems = onCall(async (request) => {
  const { locationId, imageId } = request.data;

  if (!locationId) {
    throw new Error("Missing required field: locationId");
  }

  try {
    let query = db
      .collection("locations")
      .doc(locationId)
      .collection("boulderProblems")
      .orderBy("createdAt", "desc");

    if (imageId) {
      query = query.where("imageId", "==", imageId);
    }

    const querySnapshot = await query.get();
    const problems: any[] = [];

    querySnapshot.forEach((doc) => {
      problems.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    logger.info(
      `Retrieved ${problems.length} boulder problems for location ${locationId}${
        imageId ? ` and image ${imageId}` : ""
      }`
    );
    return { problems };
  } catch (error) {
    logger.error("Error fetching boulder problems:", error);
    throw new Error("Failed to fetch boulder problems");
  }
});

export const getBoulderProblem = onCall(async (request) => {
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

export const updateBoulderProblem = onCall(async (request) => {
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

export const deleteBoulderProblem = onCall(async (request) => {
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

export const deleteAllBoulderProblems = onCall(async (request) => {
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

export const addHoldToProblem = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, hold, holdIndex } = request.data;

  if (!locationId || !problemId || !hold || holdIndex === undefined) {
    throw new Error("Missing required fields: locationId, problemId, hold, and holdIndex");
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

    // Check if hold is already in the problem (match by holdIndex or detectionIndex)
    const existingHoldIndex = currentHolds.findIndex(
      (h: any) => h.holdIndex === holdIndex || h.detectionIndex === holdIndex
    );

    if (existingHoldIndex === -1) {
      // Add the hold with complete self-contained data
      const newHold = {
        // Core identification
        holdIndex,
        detectionIndex: hold.detectionIndex || holdIndex,

        // Complete hold data (self-contained)
        id: hold.id || holdIndex,
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
      logger.info(`Hold ${holdIndex} added to problem ${problemId} with SVG markup`);
    } else {
      // Remove the hold if it already exists (toggle behavior)
      currentHolds.splice(existingHoldIndex, 1);
      logger.info(`Hold ${holdIndex} removed from problem ${problemId}`);
    }

    await problemRef.update({
      holds: currentHolds,
      updatedAt: new Date(),
    });

    return {
      message: `Hold ${holdIndex} ${
        existingHoldIndex === -1 ? "added to" : "removed from"
      } problem successfully`,
      holds: currentHolds,
    };
  } catch (error) {
    logger.error("Error adding/removing hold from problem:", error);
    throw new Error("Failed to add/remove hold from problem");
  }
});

export const removeHoldFromProblem = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required");
  }

  const { locationId, problemId, holdIndex } = request.data;

  if (!locationId || !problemId || holdIndex === undefined) {
    throw new Error("Missing required fields: locationId, problemId, and holdIndex");
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

    // Remove the hold
    const updatedHolds = currentHolds.filter((h: any) => h.holdIndex !== holdIndex);

    await problemRef.update({
      holds: updatedHolds,
      updatedAt: new Date(),
    });

    logger.info(`Hold ${holdIndex} removed from problem ${problemId}`);

    return {
      message: `Hold ${holdIndex} removed from problem successfully`,
      holds: updatedHolds,
    };
  } catch (error) {
    logger.error("Error removing hold from problem:", error);
    throw new Error("Failed to remove hold from problem");
  }
});

export const updateProblemHolds = onCall(async (request) => {
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
