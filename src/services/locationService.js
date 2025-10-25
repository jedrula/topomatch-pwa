import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase.js';
import { boulderProblemsServiceV2 as boulderProblemsService } from './boulderProblemsServiceV2.js';

// Initialize callable functions
const createLocationFn = httpsCallable(functions, 'createLocation');
const getLocationsFn = httpsCallable(functions, 'getLocations');
const getLocationFn = httpsCallable(functions, 'getLocation');
const updateLocationFn = httpsCallable(functions, 'updateLocation');
const deleteLocationFn = httpsCallable(functions, 'deleteLocation');
const addLocationImageFn = httpsCallable(functions, 'addLocationImage');
const getLocationImagesFn = httpsCallable(functions, 'getLocationImages');
const deleteLocationImageFn = httpsCallable(functions, 'deleteLocationImage');

class LocationService {
  async createLocation(location) {
    try {
      const result = await createLocationFn(location);
      return result.data;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const result = await getLocationsFn();
      return result.data;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  async getLocation(id) {
    try {
      const result = await getLocationFn({ locationId: id });
      return result.data;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  async updateLocation(id, location) {
    try {
      const result = await updateLocationFn({ locationId: id, ...location });
      return result.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(id) {
    try {
      // Note: Boulder problems are stored as subcollections and will be
      // automatically deleted when the location document is deleted
      // However, we can optionally clean them up explicitly for better error handling
      try {
        await boulderProblemsService.deleteAllBoulderProblemsForLocation(id);
      } catch (boulderError) {
        console.warn(
          'Error cleaning up boulder problems (will be handled by cascade delete):',
          boulderError
        );
        // Continue with location deletion even if boulder cleanup fails
      }

      const result = await deleteLocationFn({ locationId: id });
      return result.data;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  // Add image metadata to a location
  async addLocationImage(imageId, locationId, fileName, downloadUrl) {
    try {
      const result = await addLocationImageFn({
        imageId,
        locationId,
        fileName,
        downloadUrl,
      });
      return result.data;
    } catch (error) {
      console.error('Error adding location image:', error);
      throw error;
    }
  }

  // Get all images for a location
  async getLocationImages(locationId) {
    try {
      const result = await getLocationImagesFn({ locationId });
      return result.data;
    } catch (error) {
      console.error('Error getting location images:', error);
      throw error;
    }
  }

  // Delete a location image
  async deleteLocationImage(imageId) {
    try {
      const result = await deleteLocationImageFn({ imageId });
      return result.data;
    } catch (error) {
      console.error('Error deleting location image:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
