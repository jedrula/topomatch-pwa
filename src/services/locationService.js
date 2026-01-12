import { callFunction } from './capacitorHttp.js';
import { boulderProblemsServiceV2 as boulderProblemsService } from './boulderProblemsServiceV2.js';

class LocationService {
  async createLocation(location) {
    try {
      const result = await callFunction('createLocation', location);
      return result;
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      const result = await callFunction('getLocations');
      return result;
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  async getLocation(id) {
    try {
      const result = await callFunction('getLocation', { locationId: id });
      return result;
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  async updateLocation(id, location) {
    try {
      const result = await callFunction('updateLocation', { locationId: id, ...location });
      return result;
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

      const result = await callFunction('deleteLocation', { locationId: id });
      return result;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  // Add image metadata to a location
  async addLocationImage(imageId, locationId, fileName, downloadUrl, routesetting) {
    if (!routesetting) {
      throw new Error('routesetting is required. Create a routesetting for this location first.');
    }
    
    try {
      const result = await callFunction('addLocationImage', {
        imageId,
        locationId,
        fileName,
        downloadUrl,
        routesetting,
      });
      return result;
    } catch (error) {
      console.error('Error adding location image:', error);
      throw error;
    }
  }

  // Get all images for a location (optionally filtered by routesetting)
  async getLocationImages(locationId, routesetting = null) {
    try {
      const params = { locationId };
      if (routesetting) {
        params.routesetting = routesetting;
      }
      const result = await callFunction('getLocationImages', params);
      return result;
    } catch (error) {
      console.error('Error getting location images:', error);
      throw error;
    }
  }

  // Delete a location image
  async deleteLocationImage(imageId) {
    try {
      const result = await callFunction('deleteLocationImage', { imageId });
      return result;
    } catch (error) {
      console.error('Error deleting location image:', error);
      throw error;
    }
  }

  // Search locations by name prefix (case-insensitive)
  // Uses Firestore range query trick: https://firebase.google.com/docs/firestore/solutions/search
  async searchLocationsByPrefix(searchText) {
    try {
      const result = await callFunction('searchLocations', { 
        prefix: searchText.toLowerCase() 
      });
      return result;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  // Get locations for picker (liked if authenticated, most liked otherwise)
  async getPickerLocations() {
    try {
      const result = await callFunction('getPickerLocations');
      return result;
    } catch (error) {
      console.error('Error getting picker locations:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
