import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase.js";

// Initialize callable functions
const createLocationFn = httpsCallable(functions, "createLocation");
const getLocationsFn = httpsCallable(functions, "getLocations");
const getLocationFn = httpsCallable(functions, "getLocation");
const updateLocationFn = httpsCallable(functions, "updateLocation");
const deleteLocationFn = httpsCallable(functions, "deleteLocation");
const addLocationImageFn = httpsCallable(functions, "addLocationImage");
const getLocationImagesFn = httpsCallable(functions, "getLocationImages");
const deleteLocationImageFn = httpsCallable(functions, "deleteLocationImage");

class LocationService {
  async createLocation(location) {
    try {
      const result = await createLocationFn(location);
      return result.data;
    } catch (error) {
      console.error("Error creating location:", error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const result = await getLocationsFn();
      return result.data;
    } catch (error) {
      console.error("Error getting locations:", error);
      throw error;
    }
  }

  async getLocation(id) {
    try {
      const result = await getLocationFn({ locationId: id });
      return result.data;
    } catch (error) {
      console.error("Error getting location:", error);
      throw error;
    }
  }

  async updateLocation(id, location) {
    try {
      const result = await updateLocationFn({ locationId: id, ...location });
      return result.data;
    } catch (error) {
      console.error("Error updating location:", error);
      throw error;
    }
  }

  async deleteLocation(id) {
    try {
      const result = await deleteLocationFn({ locationId: id });
      return result.data;
    } catch (error) {
      console.error("Error deleting location:", error);
      throw error;
    }
  }

  // Add image metadata to a location
  async addLocationImage(locationId, fileName, downloadUrl) {
    try {
      const result = await addLocationImageFn({
        locationId,
        fileName,
        downloadUrl,
      });
      return result.data;
    } catch (error) {
      console.error("Error adding location image:", error);
      throw error;
    }
  }

  // Get all images for a location
  async getLocationImages(locationId) {
    try {
      const result = await getLocationImagesFn({ locationId });
      return result.data;
    } catch (error) {
      console.error("Error getting location images:", error);
      throw error;
    }
  }

  // Delete a location image
  async deleteLocationImage(imageId) {
    try {
      const result = await deleteLocationImageFn({ imageId });
      return result.data;
    } catch (error) {
      console.error("Error deleting location image:", error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
