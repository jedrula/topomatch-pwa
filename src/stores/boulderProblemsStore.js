import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { boulderProblemsServiceV2 as boulderProblemsService } from "@/services/boulderProblemsServiceV2";

export const useBoulderProblemsStore = defineStore("boulderProblems", () => {
  // State
  const boulderProblems = ref([]);
  const activeProblem = ref(null);
  const nextProblemId = ref(1);
  const isCreatingProblem = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const currentLocationId = ref(null);
  const currentImageId = ref(null);

  // Batch update state
  const problemsWithUnsavedChanges = ref(new Set()); // Track which problems have unsaved changes
  const isSaving = ref(false);

  // Boulder problem grades (V-Scale)
  const grades = [
    "VB",
    "V0",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
  ];

  // Colors for visual distinction of boulder problems
  const problemColors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#6366f1", // indigo
    "#d946ef", // fuchsia
  ];

  // Computed
  const sortedProblems = computed(() => {
    return [...boulderProblems.value].sort((a, b) => {
      // Sort by creation date (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
  });

  const activeProblemColor = computed(() => {
    if (!activeProblem.value) return null;
    return activeProblem.value.color || problemColors[0];
  });

  // Helper function to generate next local ID for optimistic updates
  const getNextLocalId = () => {
    return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Actions
  const initializeForLocation = (locationId, imageId) => {
    currentLocationId.value = locationId;
    currentImageId.value = imageId;
    // Reset state when switching to a new context
    boulderProblems.value = [];
    activeProblem.value = null;
    isCreatingProblem.value = false;
    error.value = null;
  };

  const loadBoulderProblems = async (locationId, imageId = null) => {
    if (!locationId) return;

    isLoading.value = true;
    error.value = null;

    try {
      let problems;
      if (imageId) {
        problems = await boulderProblemsService.getBoulderProblemsByImage(locationId, imageId);
      } else {
        problems = await boulderProblemsService.getBoulderProblems(locationId);
      }

      // Add color property based on index if not present
      boulderProblems.value = problems.map((problem, index) => ({
        ...problem,
        color: problem.color || problemColors[index % problemColors.length],
      }));

      console.log(`Loaded ${problems.length} boulder problems`);
    } catch (err) {
      error.value = err.message;
      console.error("Error loading boulder problems:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const createNewProblem = async (grade = "V0", name = "") => {
    if (!currentLocationId.value || !currentImageId.value) {
      throw new Error("Location and image must be set before creating problems");
    }

    const colorIndex = boulderProblems.value.length % problemColors.length;
    const problemName = name || `Problem ${boulderProblems.value.length + 1}`;

    // Create optimistic local problem
    const localProblem = {
      id: getNextLocalId(),
      name: problemName,
      grade,
      holds: [],
      imageId: currentImageId.value,
      color: problemColors[colorIndex],
      createdAt: new Date(),
      updatedAt: new Date(),
      isLocalOnly: true, // Flag for optimistic update
    };

    boulderProblems.value.push(localProblem);
    activeProblem.value = localProblem;
    isCreatingProblem.value = true;

    try {
      // Create on backend
      const problemId = await boulderProblemsService.createBoulderProblem(currentLocationId.value, {
        name: problemName,
        grade,
        imageId: currentImageId.value,
        color: problemColors[colorIndex],
        holds: [],
      });

      // Update the local problem with the real ID
      const problemIndex = boulderProblems.value.findIndex((p) => p.id === localProblem.id);
      if (problemIndex !== -1) {
        boulderProblems.value[problemIndex] = {
          ...localProblem,
          id: problemId,
          isLocalOnly: false,
        };
        activeProblem.value = boulderProblems.value[problemIndex];
      }

      console.log("Boulder problem created successfully:", problemId);
      return boulderProblems.value[problemIndex];
    } catch (err) {
      // Remove the optimistic problem on error
      const problemIndex = boulderProblems.value.findIndex((p) => p.id === localProblem.id);
      if (problemIndex !== -1) {
        boulderProblems.value.splice(problemIndex, 1);
      }
      activeProblem.value = null;
      isCreatingProblem.value = false;
      error.value = err.message;
      console.error("Error creating boulder problem:", err);
      throw err;
    }
  };

  const finishCreatingProblem = async () => {
    if (!activeProblem.value || !isCreatingProblem.value) return;

    try {
      // If the problem has holds and exists on backend, update it
      if (!activeProblem.value.isLocalOnly && activeProblem.value.holds.length > 0) {
        await boulderProblemsService.updateBoulderProblem(
          currentLocationId.value,
          activeProblem.value.id,
          {
            name: activeProblem.value.name,
            grade: activeProblem.value.grade,
            holds: activeProblem.value.holds,
          }
        );
      }

      isCreatingProblem.value = false;
      activeProblem.value = null;
      console.log("Finished creating boulder problem");
    } catch (err) {
      error.value = err.message;
      console.error("Error finishing boulder problem creation:", err);
    }
  };

  const cancelCreatingProblem = async () => {
    if (!activeProblem.value || !isCreatingProblem.value) return;

    try {
      // If it's not local only, delete from backend
      if (!activeProblem.value.isLocalOnly) {
        await boulderProblemsService.deleteBoulderProblem(
          currentLocationId.value,
          activeProblem.value.id
        );
      }

      // Remove from local state
      const index = boulderProblems.value.findIndex((p) => p.id === activeProblem.value.id);
      if (index !== -1) {
        boulderProblems.value.splice(index, 1);
      }

      isCreatingProblem.value = false;
      activeProblem.value = null;
      console.log("Cancelled boulder problem creation");
    } catch (err) {
      error.value = err.message;
      console.error("Error cancelling boulder problem creation:", err);
    }
  };

  const selectProblem = (problem) => {
    if (isCreatingProblem.value) {
      // Don't allow switching problems while creating
      return;
    }
    activeProblem.value = problem;
  };

  const deselectProblem = () => {
    if (!isCreatingProblem.value) {
      activeProblem.value = null;
    }
  };

  const addHoldToProblem = (problemId, hold, holdIndex) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    // Update local state only - no server call
    const existingHoldIndex = problem.holds.findIndex((h) => h.holdIndex === holdIndex);
    if (existingHoldIndex !== -1) {
      // Remove hold if it's already added
      problem.holds.splice(existingHoldIndex, 1);
    } else {
      // Add hold to problem
      problem.holds.push({
        holdIndex,
        hold: { ...hold },
        addedAt: new Date(),
      });
    }

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  const removeHoldFromProblem = (problemId, holdIndex) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    const holdPosition = problem.holds.findIndex((h) => h.holdIndex === holdIndex);
    if (holdPosition === -1) return;

    // Update local state only - no server call
    problem.holds.splice(holdPosition, 1);

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  const deleteProblem = async (problemId) => {
    const problemIndex = boulderProblems.value.findIndex((p) => p.id === problemId);
    if (problemIndex === -1) return null;

    const deletedProblem = boulderProblems.value[problemIndex];

    // Remove from local state optimistically
    boulderProblems.value.splice(problemIndex, 1);

    // Clear any unsaved changes for this problem
    problemsWithUnsavedChanges.value.delete(problemId);

    // If the deleted problem was active, deselect it
    if (activeProblem.value?.id === problemId) {
      activeProblem.value = null;
      isCreatingProblem.value = false;
    }

    // Delete from backend if not local only
    if (!deletedProblem.isLocalOnly && currentLocationId.value) {
      try {
        await boulderProblemsService.deleteBoulderProblem(currentLocationId.value, problemId);
        console.log("Boulder problem deleted successfully");
      } catch (err) {
        // Revert optimistic update on error
        boulderProblems.value.splice(problemIndex, 0, deletedProblem);
        if (activeProblem.value?.id === problemId) {
          activeProblem.value = deletedProblem;
        }
        error.value = err.message;
        console.error("Error deleting boulder problem:", err);
        throw err;
      }
    }

    return deletedProblem;
  };

  const updateProblemName = (problemId, newName) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    problem.name = newName;

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  const updateProblemGrade = (problemId, newGrade) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    problem.grade = newGrade;

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  const updateProblem = (updatedProblem) => {
    const problemIndex = boulderProblems.value.findIndex((p) => p.id === updatedProblem.id);
    if (problemIndex === -1) return;

    // Update the problem with new properties
    boulderProblems.value[problemIndex] = {
      ...boulderProblems.value[problemIndex],
      ...updatedProblem,
    };

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!updatedProblem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(updatedProblem.id);
    }
  };

  // Batch save functionality
  const saveProblemChanges = async (problemId) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem || problem.isLocalOnly || !currentLocationId.value) return;

    isSaving.value = true;
    error.value = null;

    try {
      // Update the entire problem with current state
      await boulderProblemsService.updateBoulderProblem(currentLocationId.value, problemId, {
        name: problem.name,
        grade: problem.grade,
        holds: problem.holds,
      });

      // Remove from unsaved changes
      problemsWithUnsavedChanges.value.delete(problemId);
      console.log(`Saved changes for problem ${problemId}`);
    } catch (err) {
      error.value = err.message;
      console.error("Error saving problem changes:", err);
      throw err;
    } finally {
      isSaving.value = false;
    }
  };

  const saveAllPendingChanges = async () => {
    if (problemsWithUnsavedChanges.value.size === 0) return;

    const problemIds = Array.from(problemsWithUnsavedChanges.value);
    for (const problemId of problemIds) {
      await saveProblemChanges(problemId);
    }
  };

  const discardProblemChanges = async (problemId) => {
    if (!currentLocationId.value) return;

    try {
      // Reload the problem from the server to discard local changes
      const serverProblem = await boulderProblemsService.getBoulderProblem(
        currentLocationId.value,
        problemId
      );

      const problemIndex = boulderProblems.value.findIndex((p) => p.id === problemId);
      if (problemIndex !== -1 && serverProblem) {
        boulderProblems.value[problemIndex] = serverProblem;
      }

      // Remove from unsaved changes
      problemsWithUnsavedChanges.value.delete(problemId);
    } catch (err) {
      console.error("Error discarding problem changes:", err);
      throw err;
    }
  };

  const hasUnsavedChanges = (problemId) => {
    return problemsWithUnsavedChanges.value.has(problemId);
  };

  const getUnsavedChangesCount = () => {
    return problemsWithUnsavedChanges.value.size;
  };

  const isHoldInProblem = (problemId, holdIndex) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return false;
    return problem.holds.some((h) => h.holdIndex === holdIndex);
  };

  const isHoldInActiveProblem = (holdIndex) => {
    if (!activeProblem.value) return false;
    return isHoldInProblem(activeProblem.value.id, holdIndex);
  };

  const clearAllProblems = async () => {
    if (!currentLocationId.value) {
      console.warn("No location ID available for clearing problems");
      return;
    }

    try {
      isLoading.value = true;
      error.value = null;

      // Call server to delete all problems
      const result = await boulderProblemsService.deleteAllBoulderProblemsForLocation(
        currentLocationId.value
      );

      // Clear local state
      boulderProblems.value = [];
      activeProblem.value = null;
      isCreatingProblem.value = false;

      // Clear all unsaved changes
      problemsWithUnsavedChanges.value.clear();

      console.log(`✅ Cleared ${result.deletedCount} boulder problems from server and local state`);
    } catch (err) {
      console.error("Failed to clear all boulder problems:", err);
      error.value = err.message || "Failed to clear all boulder problems";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  // Get problem statistics
  const getProblemStats = (problemId) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return null;

    return {
      id: problem.id,
      name: problem.name,
      grade: problem.grade,
      holdCount: problem.holds.length,
      createdAt: problem.createdAt,
      color: problem.color,
    };
  };

  return {
    // State
    boulderProblems,
    activeProblem,
    nextProblemId,
    isCreatingProblem,
    isLoading,
    error,
    currentLocationId,
    currentImageId,
    grades,
    problemColors,
    isSaving,

    // Computed
    sortedProblems,
    activeProblemColor,

    // Actions
    initializeForLocation,
    loadBoulderProblems,
    createNewProblem,
    finishCreatingProblem,
    cancelCreatingProblem,
    selectProblem,
    deselectProblem,
    addHoldToProblem,
    removeHoldFromProblem,
    deleteProblem,
    updateProblemName,
    updateProblemGrade,
    updateProblem,
    isHoldInProblem,
    isHoldInActiveProblem,
    clearAllProblems,
    clearError,
    getProblemStats,

    // Batch operations
    saveProblemChanges,
    saveAllPendingChanges,
    discardProblemChanges,
    hasUnsavedChanges,
    getUnsavedChangesCount,
  };
});
