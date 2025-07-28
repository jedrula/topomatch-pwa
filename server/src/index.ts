import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

const db = getFirestore();

// Configure Firestore to use emulator if in development
if (process.env.FUNCTIONS_EMULATOR === "true") {
  db.settings({
    host: "127.0.0.1:8080",
    ssl: false,
  });
}

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
export const createLocation = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { name, description, heroImageUrl } = request.body as Location;

    if (!name) {
      response.status(400).json({ error: "Name is required" });
      return;
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
    response.status(201).json(locationWithId);
  } catch (error) {
    logger.error("Error creating location:", error);
    response.status(500).json({ error: "Failed to create location" });
  }
});

// Get all locations
export const getLocations = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const snapshot = await db.collection("locations").get();
    const locations: Location[] = [];

    snapshot.forEach((doc) => {
      locations.push({
        id: doc.id,
        ...doc.data(),
      } as Location);
    });

    response.status(200).json(locations);
  } catch (error) {
    logger.error("Error getting locations:", error);
    response.status(500).json({ error: "Failed to get locations" });
  }
});

// Get a specific location
export const getLocation = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const locationId = request.query.id as string;

    if (!locationId) {
      response.status(400).json({ error: "Location ID is required" });
      return;
    }

    const doc = await db.collection("locations").doc(locationId).get();

    if (!doc.exists) {
      response.status(404).json({ error: "Location not found" });
      return;
    }

    const location = {
      id: doc.id,
      ...doc.data(),
    } as Location;

    response.status(200).json(location);
  } catch (error) {
    logger.error("Error getting location:", error);
    response.status(500).json({ error: "Failed to get location" });
  }
});

// Update a location
export const updateLocation = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "PUT") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const locationId = request.query.id as string;
    const { name, description, heroImageUrl } = request.body as Location;

    if (!locationId) {
      response.status(400).json({ error: "Location ID is required" });
      return;
    }

    if (!name) {
      response.status(400).json({ error: "Name is required" });
      return;
    }

    const updateData: Partial<Location> = {
      name,
      description: description || "",
      heroImageUrl: heroImageUrl || undefined,
      updatedAt: new Date(),
    };
    await db.collection("locations").doc(locationId).update(updateData);

    const updatedDoc = await db.collection("locations").doc(locationId).get();
    const updatedLocation = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Location;

    logger.info("Location updated:", updatedLocation);
    response.status(200).json(updatedLocation);
  } catch (error) {
    logger.error("Error updating location:", error);
    response.status(500).json({ error: "Failed to update location" });
  }
});

// Delete a location
export const deleteLocation = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "DELETE") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const locationId = request.query.id as string;

    if (!locationId) {
      response.status(400).json({ error: "Location ID is required" });
      return;
    }

    await db.collection("locations").doc(locationId).delete();

    logger.info("Location deleted:", locationId);
    response.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    logger.error("Error deleting location:", error);
    response.status(500).json({ error: "Failed to delete location" });
  }
});

// Add an image to a location
export const addLocationImage = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { locationId, fileName, downloadUrl } = request.body as LocationImage;

    if (!locationId || !fileName || !downloadUrl) {
      response.status(400).json({ error: "locationId, fileName, and downloadUrl are required" });
      return;
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
    response.status(201).json(imageWithId);
  } catch (error) {
    logger.error("Error adding location image:", error);
    response.status(500).json({ error: "Failed to add location image" });
  }
});

// Get all images for a location
export const getLocationImages = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const locationId = request.query.locationId as string;

    if (!locationId) {
      response.status(400).json({ error: "locationId is required" });
      return;
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

    response.status(200).json(images);
  } catch (error) {
    logger.error("Error getting location images:", error);
    response.status(500).json({ error: "Failed to get location images" });
  }
});

// Delete a location image
export const deleteLocationImage = onRequest({ cors: true }, async (request, response) => {
  try {
    if (request.method !== "DELETE") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    const imageId = request.query.imageId as string;

    if (!imageId) {
      response.status(400).json({ error: "imageId is required" });
      return;
    }

    await db.collection("locationImages").doc(imageId).delete();

    logger.info("Location image deleted:", imageId);
    response.status(200).json({ message: "Location image deleted successfully" });
  } catch (error) {
    logger.error("Error deleting location image:", error);
    response.status(500).json({ error: "Failed to delete location image" });
  }
});
