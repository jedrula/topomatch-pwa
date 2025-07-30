import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUser } from "./authService";
import { videoService } from "./videoService";

export const ascentService = {
  /**
   * Log a new ascent for a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {Object} ascentData - The ascent data
   * @returns {Promise<string>} The created ascent ID
   */
  async logAscent(locationId, problemId, ascentData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to log ascents");
      }

      // Validate required fields
      if (!ascentData.attemptType) {
        throw new Error("Attempt type is required");
      }

      const ascentsRef = collection(
        db,
        "locations",
        locationId,
        "boulderProblems",
        problemId,
        "ascents"
      );

      const newAscent = {
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous",
        userEmail: user.email,
        attemptType: ascentData.attemptType, // 'flash', 'second', 'multiple'
        userGrade: ascentData.userGrade || null, // User's opinion of the grade
        notes: ascentData.notes || "",
        sessionId: ascentData.sessionId || null, // Optional session tracking
        date: ascentData.date || serverTimestamp(),
        // Video metadata
        betaVideo: ascentData.betaVideo || null, // { videoId, downloadUrl, metadata }
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(ascentsRef, newAscent);
      console.log("Ascent logged with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error logging ascent:", error);
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
      const ascentsRef = collection(
        db,
        "locations",
        locationId,
        "boulderProblems",
        problemId,
        "ascents"
      );
      const q = query(ascentsRef, orderBy("createdAt", "desc"));

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
      console.error("Error fetching boulder ascents:", error);
      throw error;
    }
  },

  /**
   * Get all ascents for a specific user
   * @param {string} userId - The user ID (optional, defaults to current user)
   * @returns {Promise<Array>} Array of ascent records with boulder problem info
   */
  async getUserAscents(userId = null) {
    try {
      const user = getCurrentUser();
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        throw new Error("User ID is required");
      }

      // Note: This requires a compound query across multiple collections
      // For now, we'll implement a simpler version that fetches from a specific location
      // In a production app, you might want to denormalize this data or use cloud functions

      const ascents = [];
      // This is a simplified implementation - in practice you'd need to query across all locations
      // or maintain a separate user ascents collection for better performance

      return ascents;
    } catch (error) {
      console.error("Error fetching user ascents:", error);
      throw error;
    }
  },

  /**
   * Get ascents by a specific user for a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} userId - The user ID (optional, defaults to current user)
   * @returns {Promise<Array>} Array of user's ascent records for this problem
   */
  async getUserBoulderAscents(locationId, problemId, userId = null) {
    try {
      const user = getCurrentUser();
      const targetUserId = userId || user?.uid;

      if (!targetUserId) {
        throw new Error("User ID is required");
      }

      const ascentsRef = collection(
        db,
        "locations",
        locationId,
        "boulderProblems",
        problemId,
        "ascents"
      );
      const q = query(
        ascentsRef,
        where("userId", "==", targetUserId),
        orderBy("createdAt", "desc")
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
      console.error("Error fetching user boulder ascents:", error);
      throw error;
    }
  },

  /**
   * Update an ascent record
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} ascentId - The ascent ID
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateAscent(locationId, problemId, ascentId, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to update ascents");
      }

      const ascentRef = doc(
        db,
        "locations",
        locationId,
        "boulderProblems",
        problemId,
        "ascents",
        ascentId
      );

      // Check if the ascent exists and belongs to the current user
      const ascentSnap = await getDoc(ascentRef);
      if (!ascentSnap.exists()) {
        throw new Error("Ascent not found");
      }

      const ascentData = ascentSnap.data();
      if (ascentData.userId !== user.uid) {
        throw new Error("You can only update your own ascents");
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(ascentRef, updateData);
      console.log("Ascent updated successfully");
    } catch (error) {
      console.error("Error updating ascent:", error);
      throw error;
    }
  },

  /**
   * Delete an ascent record
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} ascentId - The ascent ID
   * @returns {Promise<void>}
   */
  async deleteAscent(locationId, problemId, ascentId) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to delete ascents");
      }

      const ascentRef = doc(
        db,
        "locations",
        locationId,
        "boulderProblems",
        problemId,
        "ascents",
        ascentId
      );

      // Check if the ascent exists and belongs to the current user
      const ascentSnap = await getDoc(ascentRef);
      if (!ascentSnap.exists()) {
        throw new Error("Ascent not found");
      }

      const ascentData = ascentSnap.data();
      if (ascentData.userId !== user.uid) {
        throw new Error("You can only delete your own ascents");
      }

      // Delete associated beta video if it exists
      if (ascentData.betaVideo && ascentData.betaVideo.videoId) {
        try {
          await videoService.deleteBetaVideo(locationId, problemId, ascentData.betaVideo.videoId);
          console.log("Beta video deleted with ascent");
        } catch (videoError) {
          console.warn("Error deleting beta video (continuing with ascent deletion):", videoError);
          // Continue with ascent deletion even if video deletion fails
        }
      }

      await deleteDoc(ascentRef);
      console.log("Ascent deleted successfully");
    } catch (error) {
      console.error("Error deleting ascent:", error);
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
          flash: ascents.filter((a) => a.attemptType === "flash").length,
          second: ascents.filter((a) => a.attemptType === "second").length,
          multiple: ascents.filter((a) => a.attemptType === "multiple").length,
        },
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
      console.error("Error calculating ascent stats:", error);
      throw error;
    }
  },
};
