import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';

/**
 * @typedef {import('@/types/holds').ManualHold} ManualHold
 * @typedef {import('@/types/holds').Hold} Hold
 */

/**
 * Service for managing manual holds in Firestore
 * Manual holds are stored per image and shared across users
 */
export const manualHoldsService = {
  /**
   * Load manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID (used as document ID)
   * @returns {Promise<ManualHold[]>} Array of manual holds
   */
  async loadManualHolds(locationId, imageId) {
    try {
      const holdsRef = doc(db, 'locations', locationId, 'manualHolds', imageId);
      const holdsSnap = await getDoc(holdsRef);

      if (holdsSnap.exists()) {
        const data = holdsSnap.data();
        return data.holds || [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error loading manual holds:', error);
      throw error;
    }
  },

  /**
   * Save manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID (used as document ID)
   * @param {ManualHold[]} holds - Array of manual holds
   * @param {string} imageUrl - The image URL (for metadata)
   * @returns {Promise<void>}
   */
  async saveManualHolds(locationId, imageId, holds, imageUrl) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to save manual holds');
      }

      const holdsRef = doc(db, 'locations', locationId, 'manualHolds', imageId);

      const holdsData = {
        imageUrl,
        holds,
        updatedAt: serverTimestamp(),
        contributors: arrayUnion(user.uid), // Track who contributed
      };

      // Check if document exists
      const existingDoc = await getDoc(holdsRef);

      if (existingDoc.exists()) {
        // Update existing document
        await updateDoc(holdsRef, holdsData);
      } else {
        // Create new document
        await setDoc(holdsRef, {
          ...holdsData,
          createdAt: serverTimestamp(),
        });
      }

    } catch (error) {
      console.error('❌ Error saving manual holds:', error);
      throw error;
    }
  },

  /**
   * Add a single manual hold
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID (used as document ID)
   * @param {Object} hold - The hold to add
   * @param {string} imageUrl - The image URL (for metadata)
   * @returns {Promise<Array>} Updated holds array
   */
  async addManualHold(locationId, imageId, hold, imageUrl) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to add manual holds');
      }

      // Add user tracking to the hold
      const enhancedHold = {
        ...hold,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      };

      // Load current holds
      const currentHolds = await this.loadManualHolds(locationId, imageId);

      // Add new hold
      const updatedHolds = [...currentHolds, enhancedHold];

      // Save back to Firestore
      await this.saveManualHolds(locationId, imageId, updatedHolds, imageUrl);

      return updatedHolds;
    } catch (error) {
      console.error('❌ Error adding manual hold:', error);
      throw error;
    }
  },

  /**
   * Remove a manual hold
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID (used as document ID)
   * @param {string} holdId - The hold ID to remove
   * @param {string} imageUrl - The image URL (for metadata)
   * @returns {Promise<Array>} Updated holds array
   */
  async removeManualHold(locationId, imageId, holdId, imageUrl) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to remove manual holds');
      }

      // Load current holds
      const currentHolds = await this.loadManualHolds(locationId, imageId);

      // Remove the hold
      const updatedHolds = currentHolds.filter((hold) => hold.id !== holdId);

      // Save back to Firestore
      await this.saveManualHolds(locationId, imageId, updatedHolds, imageUrl);

      return updatedHolds;
    } catch (error) {
      console.error('❌ Error removing manual hold:', error);
      throw error;
    }
  },

  /**
   * Clear all manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID (used as document ID)
   * @param {string} imageUrl - The image URL (for metadata)
   * @returns {Promise<void>}
   */
  async clearManualHolds(locationId, imageId, imageUrl) {
    try {
      await this.saveManualHolds(locationId, imageId, [], imageUrl);
    } catch (error) {
      console.error('❌ Error clearing manual holds:', error);
      throw error;
    }
  },
};
