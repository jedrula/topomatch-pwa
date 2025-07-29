import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase.js";

// Initialize callable functions for location images
const addLocationImageFn = httpsCallable(functions, "addLocationImage");
const getLocationImagesFn = httpsCallable(functions, "getLocationImages");
const deleteLocationImageFn = httpsCallable(functions, "deleteLocationImage");

// Service for managing location images
class LocationImageService {
  async addImageToLocation(locationId, imageData) {
    try {
      const result = await addLocationImageFn({
        locationId,
        ...imageData,
      });
      return result.data;
    } catch (error) {
      console.error("Error adding image to location:", error);
      throw error;
    }
  }

  async getLocationImages(locationId) {
    try {
      const result = await getLocationImagesFn({ locationId });
      return result.data;
    } catch (error) {
      console.error("Error getting location images:", error);
      throw error;
    }
  }

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

export const locationImageService = new LocationImageService();
