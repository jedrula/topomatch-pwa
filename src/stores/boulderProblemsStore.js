import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { boulderProblemsService } from "@/services/boulderProblemsService";

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

  const addHoldToProblem = async (problemId, hold, holdIndex) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    // Update local state optimistically
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

    // Update backend if not local only
    if (!problem.isLocalOnly && currentLocationId.value) {
      try {
        await boulderProblemsService.addHoldToProblem(
          currentLocationId.value,
          problemId,
          hold,
          holdIndex
        );
      } catch (err) {
        // Revert optimistic update on error
        if (existingHoldIndex !== -1) {
          problem.holds.push({
            holdIndex,
            hold: { ...hold },
            addedAt: new Date(),
          });
        } else {
          const revertIndex = problem.holds.findIndex((h) => h.holdIndex === holdIndex);
          if (revertIndex !== -1) {
            problem.holds.splice(revertIndex, 1);
          }
        }
        error.value = err.message;
        console.error("Error updating hold in problem:", err);
      }
    }
  };

  const removeHoldFromProblem = async (problemId, holdIndex) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    // Store the hold for potential revert
    const holdToRemove = problem.holds.find((h) => h.holdIndex === holdIndex);
    const holdPosition = problem.holds.findIndex((h) => h.holdIndex === holdIndex);

    if (holdPosition === -1) return;

    // Update local state optimistically
    problem.holds.splice(holdPosition, 1);

    // Update backend if not local only
    if (!problem.isLocalOnly && currentLocationId.value) {
      try {
        await boulderProblemsService.removeHoldFromProblem(
          currentLocationId.value,
          problemId,
          holdIndex
        );
      } catch (err) {
        // Revert optimistic update on error
        problem.holds.splice(holdPosition, 0, holdToRemove);
        error.value = err.message;
        console.error("Error removing hold from problem:", err);
      }
    }
  };

  const deleteProblem = async (problemId) => {
    const problemIndex = boulderProblems.value.findIndex((p) => p.id === problemId);
    if (problemIndex === -1) return null;

    const deletedProblem = boulderProblems.value[problemIndex];

    // Remove from local state optimistically
    boulderProblems.value.splice(problemIndex, 1);

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

  const updateProblemName = async (problemId, newName) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    const oldName = problem.name;
    problem.name = newName;

    // Update backend if not local only
    if (!problem.isLocalOnly && currentLocationId.value) {
      try {
        await boulderProblemsService.updateBoulderProblem(currentLocationId.value, problemId, {
          name: newName,
        });
      } catch (err) {
        // Revert on error
        problem.name = oldName;
        error.value = err.message;
        console.error("Error updating problem name:", err);
      }
    }
  };

  const updateProblemGrade = async (problemId, newGrade) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    const oldGrade = problem.grade;
    problem.grade = newGrade;

    // Update backend if not local only
    if (!problem.isLocalOnly && currentLocationId.value) {
      try {
        await boulderProblemsService.updateBoulderProblem(currentLocationId.value, problemId, {
          grade: newGrade,
        });
      } catch (err) {
        // Revert on error
        problem.grade = oldGrade;
        error.value = err.message;
        console.error("Error updating problem grade:", err);
      }
    }
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
    // For now, just clear local state
    // In the future, this could optionally delete from backend
    boulderProblems.value = [];
    activeProblem.value = null;
    isCreatingProblem.value = false;
    error.value = null;
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
    isHoldInProblem,
    isHoldInActiveProblem,
    clearAllProblems,
    clearError,
    getProblemStats,
  };
});
