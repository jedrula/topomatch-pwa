import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

const db = getFirestore();

// Interface for Location data
interface Location {
  id?: string;
  name: string;
  description?: string;
  heroImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
      heroImageUrl: heroImageUrl || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
