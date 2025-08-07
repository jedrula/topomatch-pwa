import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase.js";

// Initialize callable functions
const createBoulderProblemFn = httpsCallable(functions, "createBoulderProblem");
const getBoulderProblemsFn = httpsCallable(functions, "getBoulderProblems");
const getBoulderProblemFn = httpsCallable(functions, "getBoulderProblem");
const updateBoulderProblemFn = httpsCallable(functions, "updateBoulderProblem");
const deleteBoulderProblemFn = httpsCallable(functions, "deleteBoulderProblem");
const deleteAllBoulderProblemsFn = httpsCallable(functions, "deleteAllBoulderProblems");
const addHoldToProblemFn = httpsCallable(functions, "addHoldToProblem");
const removeHoldFromProblemFn = httpsCallable(functions, "removeHoldFromProblem");
const updateProblemHoldsFn = httpsCallable(functions, "updateProblemHolds");

export const boulderProblemsServiceV2 = {
  /**
   * Create a new boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {Object} problemData - The boulder problem data
   * @returns {Promise<string>} The created problem ID
   */
  async createBoulderProblem(locationId, problemData) {
    try {
      const result = await createBoulderProblemFn({ locationId, problemData });
      console.log("Boulder problem created with ID:", result.data.problemId);
      return result.data.problemId;
    } catch (error) {
      console.error("Error creating boulder problem:", error);
      throw error;
    }
  },

  /**
   * Update an existing boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Object} updates - The fields to update
   * @returns {Promise<void>}
   */
  async updateBoulderProblem(locationId, problemId, updates) {
    try {
      await updateBoulderProblemFn({ locationId, problemId, updates });
      console.log("Boulder problem updated successfully");
    } catch (error) {
      console.error("Error updating boulder problem:", error);
      throw error;
    }
  },

  /**
   * Delete a boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @returns {Promise<void>}
   */
  async deleteBoulderProblem(locationId, problemId) {
    try {
      await deleteBoulderProblemFn({ locationId, problemId });
      console.log("Boulder problem deleted successfully");
    } catch (error) {
      console.error("Error deleting boulder problem:", error);
      throw error;
    }
  },

  /**
   * Get all boulder problems for a location via Firebase Function
   * @param {string} locationId - The location ID
   * @returns {Promise<Array>} Array of boulder problems
   */
  async getBoulderProblems(locationId) {
    try {
      const result = await getBoulderProblemsFn({ locationId });
      const problems = result.data.problems.map((problem) => ({
        ...problem,
        // Convert Firestore timestamps to JavaScript Date objects
        createdAt: problem.createdAt?.toDate
          ? problem.createdAt.toDate()
          : new Date(problem.createdAt),
        updatedAt: problem.updatedAt?.toDate
          ? problem.updatedAt.toDate()
          : new Date(problem.updatedAt),
      }));

      console.log(`Retrieved ${problems.length} boulder problems for location ${locationId}`);
      return problems;
    } catch (error) {
      console.error("Error fetching boulder problems:", error);
      throw error;
    }
  },

  /**
   * Get boulder problems for a specific image via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} imageId - The image ID
   * @returns {Promise<Array>} Array of boulder problems for the image
   */
  async getBoulderProblemsByImage(locationId, imageId) {
    try {
      const result = await getBoulderProblemsFn({ locationId, imageId });
      const problems = result.data.problems.map((problem) => ({
        ...problem,
        // Convert Firestore timestamps to JavaScript Date objects
        createdAt: problem.createdAt?.toDate
          ? problem.createdAt.toDate()
          : new Date(problem.createdAt),
        updatedAt: problem.updatedAt?.toDate
          ? problem.updatedAt.toDate()
          : new Date(problem.updatedAt),
      }));

      console.log(
        `Retrieved ${problems.length} boulder problems for location ${locationId} and image ${imageId}`
      );
      return problems;
    } catch (error) {
      console.error("Error fetching boulder problems by image:", error);
      throw error;
    }
  },

  /**
   * Get a specific boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @returns {Promise<Object|null>} The boulder problem or null if not found
   */
  async getBoulderProblem(locationId, problemId) {
    try {
      const result = await getBoulderProblemFn({ locationId, problemId });
      const problem = result.data.problem;

      return {
        ...problem,
        createdAt: problem.createdAt?.toDate
          ? problem.createdAt.toDate()
          : new Date(problem.createdAt),
        updatedAt: problem.updatedAt?.toDate
          ? problem.updatedAt.toDate()
          : new Date(problem.updatedAt),
      };
    } catch (error) {
      if (error.message.includes("not found")) {
        console.log("Boulder problem not found");
        return null;
      }
      console.error("Error fetching boulder problem:", error);
      throw error;
    }
  },

  /**
   * Add a hold to a boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Object} hold - The hold data to add
   * @param {number} holdIndex - The index of the hold in the detection results
   * @returns {Promise<void>}
   */
  async addHoldToProblem(locationId, problemId, hold, holdIndex) {
    try {
      const result = await addHoldToProblemFn({ locationId, problemId, hold, holdIndex });
      console.log(result.data.message);
    } catch (error) {
      console.error("Error adding hold to problem:", error);
      throw error;
    }
  },

  /**
   * Remove a hold from a boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {number} holdIndex - The index of the hold to remove
   * @returns {Promise<void>}
   */
  async removeHoldFromProblem(locationId, problemId, holdIndex) {
    try {
      const result = await removeHoldFromProblemFn({ locationId, problemId, holdIndex });
      console.log(result.data.message);
    } catch (error) {
      console.error("Error removing hold from problem:", error);
      throw error;
    }
  },

  /**
   * Delete all boulder problems for a location via Firebase Function
   * @param {string} locationId - The location ID
   * @returns {Promise<Object>} Result with deletedCount
   */
  async deleteAllBoulderProblemsForLocation(locationId) {
    try {
      const result = await deleteAllBoulderProblemsFn({ locationId });
      console.log("All boulder problems deleted:", result.data.message);
      return result.data;
    } catch (error) {
      console.error("Error deleting all boulder problems:", error);
      throw error;
    }
  },

  /**
   * Update the holds array for a boulder problem via Firebase Function
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {Array} holds - The new holds array
   * @returns {Promise<void>}
   */
  async updateProblemHolds(locationId, problemId, holds) {
    try {
      const result = await updateProblemHoldsFn({ locationId, problemId, holds });
      console.log(result.data.message);
    } catch (error) {
      console.error("Error updating problem holds:", error);
      throw error;
    }
  },
};
