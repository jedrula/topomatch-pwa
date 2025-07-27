"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.updateLocation = exports.getLocation = exports.getLocations = exports.createLocation = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
// Create a new location
exports.createLocation = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        if (request.method !== "POST") {
            response.status(405).json({ error: "Method not allowed" });
            return;
        }
        const { name, description } = request.body;
        if (!name) {
            response.status(400).json({ error: "Name is required" });
            return;
        }
        const locationData = {
            name,
            description: description || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const docRef = await db.collection("locations").add(locationData);
        const locationWithId = Object.assign({ id: docRef.id }, locationData);
        logger.info("Location created:", locationWithId);
        response.status(201).json(locationWithId);
    }
    catch (error) {
        logger.error("Error creating location:", error);
        response.status(500).json({ error: "Failed to create location" });
    }
});
// Get all locations
exports.getLocations = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        if (request.method !== "GET") {
            response.status(405).json({ error: "Method not allowed" });
            return;
        }
        const snapshot = await db.collection("locations").get();
        const locations = [];
        snapshot.forEach((doc) => {
            locations.push(Object.assign({ id: doc.id }, doc.data()));
        });
        response.status(200).json(locations);
    }
    catch (error) {
        logger.error("Error getting locations:", error);
        response.status(500).json({ error: "Failed to get locations" });
    }
});
// Get a specific location
exports.getLocation = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        if (request.method !== "GET") {
            response.status(405).json({ error: "Method not allowed" });
            return;
        }
        const locationId = request.query.id;
        if (!locationId) {
            response.status(400).json({ error: "Location ID is required" });
            return;
        }
        const doc = await db.collection("locations").doc(locationId).get();
        if (!doc.exists) {
            response.status(404).json({ error: "Location not found" });
            return;
        }
        const location = Object.assign({ id: doc.id }, doc.data());
        response.status(200).json(location);
    }
    catch (error) {
        logger.error("Error getting location:", error);
        response.status(500).json({ error: "Failed to get location" });
    }
});
// Update a location
exports.updateLocation = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        if (request.method !== "PUT") {
            response.status(405).json({ error: "Method not allowed" });
            return;
        }
        const locationId = request.query.id;
        const { name, description } = request.body;
        if (!locationId) {
            response.status(400).json({ error: "Location ID is required" });
            return;
        }
        if (!name) {
            response.status(400).json({ error: "Name is required" });
            return;
        }
        const updateData = {
            name,
            description: description || "",
            updatedAt: new Date(),
        };
        await db.collection("locations").doc(locationId).update(updateData);
        const updatedDoc = await db.collection("locations").doc(locationId).get();
        const updatedLocation = Object.assign({ id: updatedDoc.id }, updatedDoc.data());
        logger.info("Location updated:", updatedLocation);
        response.status(200).json(updatedLocation);
    }
    catch (error) {
        logger.error("Error updating location:", error);
        response.status(500).json({ error: "Failed to update location" });
    }
});
// Delete a location
exports.deleteLocation = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        if (request.method !== "DELETE") {
            response.status(405).json({ error: "Method not allowed" });
            return;
        }
        const locationId = request.query.id;
        if (!locationId) {
            response.status(400).json({ error: "Location ID is required" });
            return;
        }
        await db.collection("locations").doc(locationId).delete();
        logger.info("Location deleted:", locationId);
        response.status(200).json({ message: "Location deleted successfully" });
    }
    catch (error) {
        logger.error("Error deleting location:", error);
        response.status(500).json({ error: "Failed to delete location" });
    }
});
//# sourceMappingURL=index.js.map