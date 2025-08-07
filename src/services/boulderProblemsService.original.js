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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { getCurrentUser } from "./authService";

export const boulderProblemsService = {
  /**
   * Create a new boulder problem
   * @param {string} locationId - The location ID
   * @param {Object} problemData - The boulder problem data
   * @returns {Promise<string>} The created problem ID
   */
  async createBoulderProblem(locationId, problemData) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to create boulder problems");
      }

      // Validate required fields
      if (!problemData.name || !problemData.grade || !problemData.imageId) {
        throw new Error("Missing required fields: name, grade, or imageId");
      }

      const problemsRef = collection(db, "locations", locationId, "boulderProblems");

      const newProblem = {
        name: problemData.name,
        grade: problemData.grade,
        holds: problemData.holds || [],
        imageId: problemData.imageId,
        color: problemData.color || "#ef4444",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.uid,
      };

      const docRef = await addDoc(problemsRef, newProblem);
      console.log("Boulder problem created with ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("Error creating boulder problem:", error);
      throw error;
    }
  },

  /**
   * Update an existing boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateBoulderProblem(locationId, problemId, updates) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to update boulder problems");
      }

      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);

      // Check if the problem exists
      const problemSnap = await getDoc(problemRef);
      if (!problemSnap.exists()) {
        throw new Error("Boulder problem not found");
      }

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(problemRef, updateData);
      console.log("Boulder problem updated successfully");
    } catch (error) {
      console.error("Error updating boulder problem:", error);
      throw error;
    }
  },

  /**
   * Delete a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @returns {Promise<void>}
   */
  async deleteBoulderProblem(locationId, problemId) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to delete boulder problems");
      }

      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);

      // Check if the problem exists
      const problemSnap = await getDoc(problemRef);
      if (!problemSnap.exists()) {
        throw new Error("Boulder problem not found");
      }

      await deleteDoc(problemRef);
      console.log("Boulder problem deleted successfully");
    } catch (error) {
      console.error("Error deleting boulder problem:", error);
      throw error;
    }
  },

  /**
   * Get all boulder problems for a location
   * @param {string} locationId - The location ID
   * @returns {Promise<Array>} Array of boulder problems
   */
  async getBoulderProblems(locationId) {
    try {
      const problemsRef = collection(db, "locations", locationId, "boulderProblems");
      const q = query(problemsRef, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const problems = [];

      querySnapshot.forEach((doc) => {
        problems.push({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JavaScript Date objects
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      console.log(`Retrieved ${problems.length} boulder problems for location ${locationId}`);
      return problems;
    } catch (error) {
      console.error("Error fetching boulder problems:", error);
      throw error;
    }
  },

  /**
   * Get boulder problems for a specific image
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID
   * @returns {Promise<Array>} Array of boulder problems for the image
   */
  async getBoulderProblemsByImage(locationId, imageId) {
    try {
      const problemsRef = collection(db, "locations", locationId, "boulderProblems");
      const q = query(problemsRef, where("imageId", "==", imageId), orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const problems = [];

      querySnapshot.forEach((doc) => {
        problems.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      console.log(`Retrieved ${problems.length} boulder problems for image ${imageId}`);
      return problems;
    } catch (error) {
      console.error("Error fetching boulder problems by image:", error);
      throw error;
    }
  },

  /**
   * Get a specific boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @returns {Promise<Object|null>} The boulder problem or null if not found
   */
  async getBoulderProblem(locationId, problemId) {
    try {
      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);
      const problemSnap = await getDoc(problemRef);

      if (problemSnap.exists()) {
        const data = problemSnap.data();
        return {
          id: problemSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      } else {
        console.log("Boulder problem not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching boulder problem:", error);
      throw error;
    }
  },

  /**
   * Add a hold to a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Object} hold - The hold data to add
   * @param {number} holdIndex - The index of the hold in the detection results
   * @returns {Promise<void>}
   */
  async addHoldToProblem(locationId, problemId, hold, holdIndex) {
    try {
      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);
      const problemSnap = await getDoc(problemRef);

      if (!problemSnap.exists()) {
        throw new Error("Boulder problem not found");
      }

      const problemData = problemSnap.data();
      const currentHolds = problemData.holds || [];

      // Check if hold is already in the problem
      const existingHoldIndex = currentHolds.findIndex((h) => h.holdIndex === holdIndex);

      if (existingHoldIndex === -1) {
        // Add the hold
        const newHold = {
          holdIndex,
          hold: { ...hold },
          addedAt: new Date(),
        };

        currentHolds.push(newHold);
      } else {
        // Remove the hold if it already exists
        currentHolds.splice(existingHoldIndex, 1);
      }

      await updateDoc(problemRef, {
        holds: currentHolds,
        updatedAt: serverTimestamp(),
      });

      console.log(
        `Hold ${holdIndex} ${
          existingHoldIndex === -1 ? "added to" : "removed from"
        } problem ${problemId}`
      );
    } catch (error) {
      console.error("Error adding/removing hold to/from problem:", error);
      throw error;
    }
  },

  /**
   * Remove a hold from a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {number} holdIndex - The index of the hold to remove
   * @returns {Promise<void>}
   */
  async removeHoldFromProblem(locationId, problemId, holdIndex) {
    try {
      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);
      const problemSnap = await getDoc(problemRef);

      if (!problemSnap.exists()) {
        throw new Error("Boulder problem not found");
      }

      const problemData = problemSnap.data();
      const currentHolds = problemData.holds || [];

      // Remove the hold
      const updatedHolds = currentHolds.filter((h) => h.holdIndex !== holdIndex);

      await updateDoc(problemRef, {
        holds: updatedHolds,
        updatedAt: serverTimestamp(),
      });

      console.log(`Hold ${holdIndex} removed from problem ${problemId}`);
    } catch (error) {
      console.error("Error removing hold from problem:", error);
      throw error;
    }
  },

  /**
   * Delete all boulder problems for a location (called when location is deleted)
   * @param {string} locationId - The location ID
   * @returns {Promise<void>}
   */
  async deleteAllBoulderProblemsForLocation(locationId) {
    try {
      const problemsRef = collection(db, "locations", locationId, "boulderProblems");
      const querySnapshot = await getDocs(problemsRef);

      // Use batch delete for efficiency
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted all boulder problems for location ${locationId}`);
    } catch (error) {
      console.error("Error deleting all boulder problems for location:", error);
      throw error;
    }
  },

  /**
   * Update the holds array for a boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Array} holds - The new holds array
   * @returns {Promise<void>}
   */
  async updateProblemHolds(locationId, problemId, holds) {
    try {
      const problemRef = doc(db, "locations", locationId, "boulderProblems", problemId);

      await updateDoc(problemRef, {
        holds: holds.map((hold) => ({
          ...hold,
          addedAt: hold.addedAt || new Date(),
        })),
        updatedAt: serverTimestamp(),
      });

      console.log(`Updated holds for problem ${problemId}`);
    } catch (error) {
      console.error("Error updating problem holds:", error);
      throw error;
    }
  },
};
