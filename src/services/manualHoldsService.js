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
 * Service for managing manual holds in Firestore
 * Manual holds are stored per image and shared across users
 */
export const manualHoldsService = {
  /**
   * Generate a document ID from image URL
   * @param {string} imageUrl - The image URL
   * @returns {string} Document ID
   */
  getDocumentId(imageUrl) {
    // Create a safe document ID from the image URL
    return btoa(imageUrl).replace(/[/+=]/g, '_');
  },

  /**
   * Load manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageUrl - The image URL
   * @returns {Promise<Array>} Array of manual holds
   */
  async loadManualHolds(locationId, imageUrl) {
    try {
      const docId = this.getDocumentId(imageUrl);
      const holdsRef = doc(db, 'locations', locationId, 'manualHolds', docId);
      const holdsSnap = await getDoc(holdsRef);

      if (holdsSnap.exists()) {
        const data = holdsSnap.data();
        console.log(`📥 Loaded ${data.holds?.length || 0} manual holds for image`);
        return data.holds || [];
      }

      console.log('📥 No manual holds found for image');
      return [];
    } catch (error) {
      console.error('❌ Error loading manual holds:', error);
      throw error;
    }
  },

  /**
   * Save manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageUrl - The image URL
   * @param {Array} holds - Array of manual holds
   * @returns {Promise<void>}
   */
  async saveManualHolds(locationId, imageUrl, holds) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to save manual holds');
      }

      const docId = this.getDocumentId(imageUrl);
      const holdsRef = doc(db, 'locations', locationId, 'manualHolds', docId);

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

      console.log(`💾 Saved ${holds.length} manual holds to Firestore`);
    } catch (error) {
      console.error('❌ Error saving manual holds:', error);
      throw error;
    }
  },

  /**
   * Add a single manual hold
   * @param {string} locationId - The location ID
   * @param {string} imageUrl - The image URL
   * @param {Object} hold - The hold to add
   * @returns {Promise<Array>} Updated holds array
   */
  async addManualHold(locationId, imageUrl, hold) {
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
      const currentHolds = await this.loadManualHolds(locationId, imageUrl);

      // Add new hold
      const updatedHolds = [...currentHolds, enhancedHold];

      // Save back to Firestore
      await this.saveManualHolds(locationId, imageUrl, updatedHolds);

      console.log('✅ Added manual hold to Firestore:', enhancedHold.id);
      return updatedHolds;
    } catch (error) {
      console.error('❌ Error adding manual hold:', error);
      throw error;
    }
  },

  /**
   * Remove a manual hold
   * @param {string} locationId - The location ID
   * @param {string} imageUrl - The image URL
   * @param {string} holdId - The hold ID to remove
   * @returns {Promise<Array>} Updated holds array
   */
  async removeManualHold(locationId, imageUrl, holdId) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to remove manual holds');
      }

      // Load current holds
      const currentHolds = await this.loadManualHolds(locationId, imageUrl);

      // Remove the hold
      const updatedHolds = currentHolds.filter((hold) => hold.id !== holdId);

      // Save back to Firestore
      await this.saveManualHolds(locationId, imageUrl, updatedHolds);

      console.log('🗑️ Removed manual hold from Firestore:', holdId);
      return updatedHolds;
    } catch (error) {
      console.error('❌ Error removing manual hold:', error);
      throw error;
    }
  },

  /**
   * Clear all manual holds for an image
   * @param {string} locationId - The location ID
   * @param {string} imageUrl - The image URL
   * @returns {Promise<void>}
   */
  async clearManualHolds(locationId, imageUrl) {
    try {
      await this.saveManualHolds(locationId, imageUrl, []);
      console.log('🧹 Cleared all manual holds from Firestore');
    } catch (error) {
      console.error('❌ Error clearing manual holds:', error);
      throw error;
    }
  },
};
