import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  getCountFromServer,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  collectionGroup,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getCurrentUser } from './authService';
import { generateUUID } from '../utils/uuid';

/**
 * Generate a unique ascent ID on the client
 * Uses crypto.randomUUID() with polyfill fallback
 * @returns {string} A unique ascent ID
 */
export const generateAscentId = () => {
  return generateUUID();
};

export const ascentService = {
  /**
   * Log a new ascent for a boulder problem
   * Now uses top-level /ascents collection with embedded video data
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {Object} ascentData - The ascent data (includes problemSnapshot and optional video)
   * @param {string} [ascentId] - Optional pre-generated ascent ID (for video upload coordination)
   * @returns {Promise<string>} The created ascent ID
   */
  async logAscent(locationId, problemId, ascentData, ascentId = null) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to log ascents');
      }

      // Relaxed validation for optimistic uploads
      // Only locationId is truly required - everything else can be added later

      const newAscent = {
        // User & references
        userId: user.uid,
        locationId,
        problemId: problemId || null,
        
        // Problem snapshot (optional for optimistic uploads, added later by analysis)
        problemSnapshot: ascentData.problemSnapshot ? {
          name: ascentData.problemSnapshot.name,
          grade: ascentData.problemSnapshot.grade,
          color: ascentData.problemSnapshot.color,
        } : null,
        
        // Ascent details (all optional for optimistic uploads)
        attemptType: ascentData.attemptType || null, // 'flash', 'second', 'multiple'
        userGrade: ascentData.userGrade || null,
        notes: ascentData.notes || '',
        date: ascentData.date || serverTimestamp(),
        
        // Routesetting timestamp (for filtering unassigned videos)
        routesetting: ascentData.routesetting || null,
        
        // Optional embedded video data
        video: ascentData.video || null,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // User display name (for showing who climbed without user lookup)
        userName: user.displayName || user.email || 'Anonymous',
      };

      // Use provided ID or generate new one
      if (ascentId) {
        // Client provided ID - use setDoc
        const docRef = doc(db, 'ascents', ascentId);
        await setDoc(docRef, newAscent);
        return ascentId;
      } else {
        // Server-generated ID - use addDoc
        const ascentsRef = collection(db, 'ascents');
        const docRef = await addDoc(ascentsRef, newAscent);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error logging ascent:', error);
      throw error;
    }
  },

  /**
   * Get all ascents for a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @returns {Promise<Array>} Array of ascent records
   */
  async getBoulderAscents(locationId, problemId) {
    try {
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('problemId', '==', problemId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ascents = [];

      querySnapshot.forEach((doc) => {
        ascents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return ascents;
    } catch (error) {
      console.error('Error fetching boulder ascents:', error);
      throw error;
    }
  },

  /**
   * Get all ascents for a specific user (across all locations/problems) - paginated
   * @param {string} userId - The user ID (optional, defaults to current user)
   * @param {number} limitCount - Maximum number of ascents to fetch
   * @returns {Promise<Array>} Array of ascent records
   */
  async getUserAscents(userId = null, limitCount = 20) {
    try {
      const user = getCurrentUser();
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('userId', '==', targetUserId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const ascents = [];

      querySnapshot.forEach((doc) => {
        ascents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return ascents;
    } catch (error) {
      console.error('Error fetching user ascents:', error);
      throw error;
    }
  },

  /**
   * Get user's ascent statistics (using count aggregation)
   * @param {string} userId - The user ID (optional, uses current user if not provided)
   * @returns {Promise<{totalAscents: number, videoCount: number, uniqueProblems: number}>}
   */
  async getUserStats(userId = null) {
    try {
      const user = getCurrentUser();
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      const ascentsRef = collection(db, 'ascents');
      
      // Get total ascent count
      const allAscentsQuery = query(
        ascentsRef,
        where('userId', '==', targetUserId)
      );
      const totalSnapshot = await getCountFromServer(allAscentsQuery);
      const totalAscents = totalSnapshot.data().count;

      // For unique problems, we need to fetch all ascents (no count aggregation for distinct)
      // But we only need problemId field
      const problemsQuery = query(
        ascentsRef,
        where('userId', '==', targetUserId)
      );
      const problemsSnapshot = await getDocs(problemsQuery);
      const problemIds = new Set();
      problemsSnapshot.forEach((doc) => {
        const problemId = doc.data().problemId;
        if (problemId) problemIds.add(problemId);
      });

      return {
        totalAscents,
        videoCount: totalAscents, // All ascents have videos
        uniqueProblems: problemIds.size,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  },

  /**
   * Get all ascents at a location (across all problems)
   * @param {string} locationId - The location ID
   * @returns {Promise<Array>} Array of ascent records
   */
  async getLocationAscents(locationId) {
    try {
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('locationId', '==', locationId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ascents = [];

      querySnapshot.forEach((doc) => {
        ascents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return ascents;
    } catch (error) {
      console.error('Error fetching location ascents:', error);
      throw error;
    }
  },

  /**
   * Update an ascent record
   * @param {string} ascentId - The ascent ID
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateAscent(ascentId, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to update ascents');
      }

      const ascentRef = doc(db, 'ascents', ascentId);

      // Check if the ascent exists and belongs to the current user
      const ascentSnap = await getDoc(ascentRef);
      if (!ascentSnap.exists()) {
        throw new Error('Ascent not found');
      }

      const ascentData = ascentSnap.data();
      if (ascentData.userId !== user.uid) {
        throw new Error('You can only update your own ascents');
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(ascentRef, updateData);
    } catch (error) {
      console.error('Error updating ascent:', error);
      throw error;
    }
  },

  /**
   * Delete an ascent record
   * Deletes the ascent and triggers Cloud Function to delete associated video files
   * @param {string} ascentId - The ascent ID
   * @returns {Promise<void>}
   */
  async deleteAscent(ascentId) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to delete ascents');
      }

      const ascentRef = doc(db, 'ascents', ascentId);

      // Check if the ascent exists and belongs to the current user
      const ascentSnap = await getDoc(ascentRef);
      if (!ascentSnap.exists()) {
        throw new Error('Ascent not found');
      }

      const ascentData = ascentSnap.data();
      if (ascentData.userId !== user.uid) {
        throw new Error('You can only delete your own ascents');
      }

      // Delete the ascent document
      // Cloud Function will handle cleanup of video files in Storage
      await deleteDoc(ascentRef);
    } catch (error) {
      console.error('Error deleting ascent:', error);
      throw error;
    }
  },

  /**
   * Get ascent statistics for a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @returns {Promise<Object>} Statistics object
   */
  async getBoulderAscentStats(locationId, problemId) {
    try {
      const ascents = await this.getBoulderAscents(locationId, problemId);

      const stats = {
        totalAscents: ascents.length,
        uniqueClimbers: new Set(ascents.map((a) => a.userId)).size,
        attemptTypes: {
          flash: ascents.filter((a) => a.attemptType === 'flash').length,
          second: ascents.filter((a) => a.attemptType === 'second').length,
          multiple: ascents.filter((a) => a.attemptType === 'multiple').length,
        },
        withVideos: ascents.filter((a) => a.video && a.video.status === 'ready').length,
        averageUserGrade: null,
        userGrades: ascents.filter((a) => a.userGrade).map((a) => a.userGrade),
      };

      // Calculate average user grade if we have enough data
      if (stats.userGrades.length > 0) {
        // This is a simplified calculation - you might want to implement proper V-scale averaging
        stats.averageUserGrade = stats.userGrades[Math.floor(stats.userGrades.length / 2)];
      }

      return stats;
    } catch (error) {
      console.error('Error calculating ascent stats:', error);
      throw error;
    }
  },

  /**
   * Get trending ascents (most liked videos from the last 2 weeks)
   * @param {number} limit - Maximum number of ascents to return (default: 10)
   * @returns {Promise<Array>} Array of trending ascent records
   */
  async getTrendingAscents(limit = 10) {
    try {
      // Calculate date 2 weeks ago
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('date', '>=', twoWeeksAgo),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const ascents = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include ascents with videos that have a path or URL
        // Check for transcodedPath, originalPath, downloadUrl, or url (same as videoService)
        if (data.video && (
          data.video.transcodedPath ||
          data.video.originalPath ||
          data.video.downloadUrl ||
          data.video.url
        )) {
          ascents.push({
            id: doc.id,
            ...data,
            likeCount: data.likeCount || 0,
          });
        }
      });

      // Sort by like count (descending) and take top N
      ascents.sort((a, b) => b.likeCount - a.likeCount);
      return ascents.slice(0, limit);
    } catch (error) {
      console.error('Error fetching trending ascents:', error);
      throw error;
    }
  },
};
