import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getCurrentUser } from './authService.js';

/**
 * Service for managing location routesettings (version control for boulder gym resets)
 * 
 * NEW ARCHITECTURE:
 * - Locations have `routesettings: []` array (list of ISO timestamps)
 * - Images have `routesettings: []` array (which routesettings include this image)
 * - NO subcollections - just arrays
 * - Current routesetting = last item in location.routesettings array
 */
class RoutesettingService {
  /**
   * Create a new routesetting for a location
   * 
   * @param {string} locationId - The location ID
   * @param {string} routesetting - ISO timestamp (YYYY-MM-DDTHH:mm:ss)
   * @param {object} options - Optional settings
   * @param {string[]} options.imageIds - Image IDs to include in new routesetting (carry forward)
   * @returns {Promise<string>} The routesetting timestamp
   */
  async createRoutesetting(locationId, routesetting, options = {}) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Must be authenticated to create routesetting');
      }

      const imageIds = options.imageIds || [];

      // Add routesetting to location's array
      const locationRef = doc(db, 'locations', locationId);
      await updateDoc(locationRef, {
        routesettings: arrayUnion(routesetting),
        updatedAt: Timestamp.now()
      });

      // Add routesetting to each carried-forward image's array
      for (const imageId of imageIds) {
        const imageRef = doc(db, 'locationImages', imageId);
        await updateDoc(imageRef, {
          routesettings: arrayUnion(routesetting)
        });
      }

      console.log(`✅ Created routesetting ${routesetting} for location ${locationId} with ${imageIds.length} images`);
      return routesetting;
    } catch (error) {
      console.error('Error creating routesetting:', error);
      throw error;
    }
  }

  /**
   * Get all routesettings for a location (sorted newest first)
   * @param {string} locationId - The location ID
   * @returns {Promise<string[]>} Array of routesetting timestamps (ISO format)
   */
  async getRoutesettings(locationId) {
    try {
      const locationRef = doc(db, 'locations', locationId);
      const locationDoc = await getDoc(locationRef);

      if (!locationDoc.exists()) {
        throw new Error(`Location ${locationId} not found`);
      }

      const routesettings = locationDoc.data().routesettings || [];
      
      // Sort by date, newest first, return as strings
      return routesettings.sort((a, b) => b.localeCompare(a));
    } catch (error) {
      console.error('Error getting routesettings:', error);
      throw error;
    }
  }

  /**
   * Get current active routesetting for a location
   * @param {string} locationId - The location ID
   * @returns {Promise<string|null>} Current routesetting timestamp or null
   */
  async getCurrentRoutesetting(locationId) {
    try {
      const locationRef = doc(db, 'locations', locationId);
      const locationDoc = await getDoc(locationRef);

      if (!locationDoc.exists()) {
        throw new Error(`Location ${locationId} not found`);
      }

      const routesettings = locationDoc.data().routesettings || [];
      
      // Current = last item in array
      return routesettings.length > 0 ? routesettings[routesettings.length - 1] : null;
    } catch (error) {
      console.error('Error getting current routesetting:', error);
      throw error;
    }
  }

  /**
   * Remove image from a routesetting
   * Soft delete: only removes from this routesetting's array
   * Hard delete: if image only belongs to this routesetting, delete the image document
   * 
   * @param {string} imageId - The image ID
   * @param {string} routesetting - The routesetting to remove from
   */
  async removeImageFromRoutesetting(imageId, routesetting) {
    try {
      const imageRef = doc(db, 'locationImages', imageId);
      const imageDoc = await getDoc(imageRef);

      if (!imageDoc.exists()) {
        throw new Error(`Image ${imageId} not found`);
      }

      const imageRoutesettings = imageDoc.data().routesettings || [];

      if (imageRoutesettings.length === 1 && imageRoutesettings[0] === routesetting) {
        // Hard delete - image only used by this routesetting
        // TODO: Also delete from Storage
        console.log(`🗑️  Hard delete image ${imageId} (only used by ${routesetting})`);
        // await deleteDoc(imageRef);
        throw new Error('Hard delete not implemented yet - use deleteLocationImage function');
      } else {
        // Soft delete - just remove from array
        await updateDoc(imageRef, {
          routesettings: arrayRemove(routesetting)
        });
        console.log(`📝 Soft delete: removed image ${imageId} from routesetting ${routesetting}`);
      }
    } catch (error) {
      console.error('Error removing image from routesetting:', error);
      throw error;
    }
  }

  /**
   * Helper: Format date as ISO timestamp (YYYY-MM-DDTHH:mm:ss)
   * @param {Date} date - The date to format
   * @returns {string} Date in ISO timestamp format
   */
  formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Helper: Get current timestamp
   * @returns {string} Current timestamp in ISO format
   */
  getCurrentTimestamp() {
    return this.formatTimestamp(new Date());
  }
}

export const routesettingService = new RoutesettingService();
