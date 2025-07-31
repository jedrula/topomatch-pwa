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
    await db.collection('users').doc(uid).set({
      isAdmin,
      updatedAt: new Date(),
      updatedBy: callerUid
    }, { merge: true });

    logger.info(`Admin role ${isAdmin ? 'granted to' : 'removed from'} user ${uid} by ${callerUid}`);
    
    return { success: true, message: `Admin role ${isAdmin ? 'granted' : 'removed'} successfully` };
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
    const adminQuery = await db.collection('users').where('isAdmin', '==', true).limit(1).get();
    
    if (!adminQuery.empty) {
      throw new Error("Admin already exists. Use setAdminRole function instead.");
    }

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Set as admin
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    await db.collection('users').doc(userRecord.uid).set({
      isAdmin: true,
      email: userRecord.email,
      createdAt: new Date(),
      role: 'admin'
    }, { merge: true });

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

// Interface for Location data
interface Location {
  id?: string;
  name: string;
  description?: string;
  heroImageUrl?: string;
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
    const { name, description, heroImageUrl } = request.data as Location;

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
    const { locationId, name, description, heroImageUrl } = request.data;

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
