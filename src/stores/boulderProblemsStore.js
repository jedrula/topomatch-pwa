import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { boulderProblemsServiceV2 as boulderProblemsService } from '@/services/boulderProblemsServiceV2';

/**
 * @typedef {import('@/types/holds').Hold} Hold
 * @typedef {import('@/types/holds').ProblemHold} ProblemHold
 * @typedef {import('@/types/holds').AIDetectedHold} AIDetectedHold
 * @typedef {import('@/types/holds').ManualHold} ManualHold
 */

export const useBoulderProblemsStore = defineStore('boulderProblems', () => {
  // State
  const boulderProblems = ref([]);
  const activeProblem = ref(null);
  const nextProblemId = ref(1);
  const isCreatingProblem = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const currentLocationId = ref(null);
  const currentImageId = ref(null);
  const currentLocationGradingSystem = ref(null); // Store location-specific grading system

  // Batch update state
  const problemsWithUnsavedChanges = ref(new Set()); // Track which problems have unsaved changes
  const isSaving = ref(false);

  // Default V-Scale grading system (fallback)
  const defaultGradingSystem = {
    id: 'v-scale',
    name: 'V-Scale (Traditional Bouldering)',
    description: 'Standard bouldering grades from VB to V17',
    grades: [
      { label: 'VB', color: '#22c55e' },
      { label: 'V0', color: '#3b82f6' },
      { label: 'V1', color: '#6366f1' },
      { label: 'V2', color: '#8b5cf6' },
      { label: 'V3', color: '#a855f7' },
      { label: 'V4', color: '#c026d3' },
      { label: 'V5', color: '#db2777' },
      { label: 'V6', color: '#e11d48' },
      { label: 'V7', color: '#dc2626' },
      { label: 'V8', color: '#ea580c' },
      { label: 'V9', color: '#f59e0b' },
      { label: 'V10', color: '#eab308' },
      { label: 'V11', color: '#ca8a04' },
      { label: 'V12', color: '#a16207' },
      { label: 'V13', color: '#78716c' },
      { label: 'V14', color: '#57534e' },
      { label: 'V15', color: '#44403c' },
      { label: 'V16', color: '#292524' },
      { label: 'V17', color: '#1c1917' },
    ],
  };

  // Computed property for grades - uses location-specific system or default
  const grades = computed(() => {
    const gradingSystem = currentLocationGradingSystem.value || defaultGradingSystem;
    return gradingSystem.grades.map((grade) => grade.label);
  });

  // Computed property for current grading system
  const gradingSystem = computed(() => {
    return currentLocationGradingSystem.value || defaultGradingSystem;
  });

  // Helper functions for grade conversion
  const getGradeObjectFromLabel = (gradeLabel) => {
    if (!gradeLabel) return null;
    const system = gradingSystem.value;
    const gradeObject = system.grades.find((g) => g.label === gradeLabel);
    return gradeObject || null;
  };

  const getGradeLabelFromObject = (gradeObject) => {
    if (!gradeObject) return '';
    if (typeof gradeObject === 'string') return gradeObject; // Already a label
    return gradeObject.label || '';
  };

  // Colors for visual distinction of boulder problems
  const problemColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#6366f1', // indigo
    '#d946ef', // fuchsia
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
    // Reset grading system - will be loaded separately
    currentLocationGradingSystem.value = null;
  };

  const setLocationGradingSystem = (gradingSystemData) => {
    currentLocationGradingSystem.value = gradingSystemData;
  };

  const loadBoulderProblems = async (locationId, imageId = null) => {
    if (!locationId) return;

    isLoading.value = true;
    error.value = null;

    try {
      let result;
      if (imageId) {
        result = await boulderProblemsService.getBoulderProblemsByImage(locationId, imageId);
        // result is now { problems: [], metadata: {} }
        const problems = result.problems || result; // fallback for old format
        
        // Add color property based on index if not present
        boulderProblems.value = problems.map((problem, index) => ({
          ...problem,
          color: problem.color || problemColors[index % problemColors.length],
        }));

        return result; // Return the full result including metadata
      } else {
        const problems = await boulderProblemsService.getBoulderProblems(locationId);
        
        // Add color property based on index if not present
        boulderProblems.value = problems.map((problem, index) => ({
          ...problem,
          color: problem.color || problemColors[index % problemColors.length],
        }));

        return { problems, metadata: null };
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error loading boulder problems:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createNewProblem = async (gradeLabel, name = '') => {
    if (!currentLocationId.value || !currentImageId.value) {
      throw new Error('Location and image must be set before creating problems');
    }

    // Convert grade label to grade object
    const gradeObject =
      getGradeObjectFromLabel(gradeLabel) ||
      (grades.value.length > 0 ? getGradeObjectFromLabel(grades.value[0]) : null);

    const colorIndex = boulderProblems.value.length % problemColors.length;
    const problemName = name || `Problem ${boulderProblems.value.length + 1}`;

    // Create optimistic local problem (no viewBox stored here anymore)
    const localProblem = {
      id: getNextLocalId(),
      name: problemName,
      grade: gradeObject,
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
      // Create on backend (no viewBox stored in boulder problem anymore)
      const problemId = await boulderProblemsService.createBoulderProblem(currentLocationId.value, {
        name: problemName,
        grade: gradeObject,
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
      console.error('Error creating boulder problem:', err);
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
    } catch (err) {
      error.value = err.message;
      console.error('Error finishing boulder problem creation:', err);
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
    } catch (err) {
      error.value = err.message;
      console.error('Error cancelling boulder problem creation:', err);
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

  /**
   * Add or remove a hold from a boulder problem
   * @param {string} problemId - The problem ID
   * @param {Hold} hold - The hold data (AI or manual)
   * @param {number} holdIndex - The index of the hold in the detection results
   * @param {string} [role] - Optional role of the hold (start, intermediate, finish, optional)
   */
  const addHoldToProblem = (problemId, hold, holdIndex, role = undefined) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    // Update local state only - no server call
    const existingHoldIndex = problem.holds.findIndex((h) => h.holdIndex === holdIndex);
    if (existingHoldIndex !== -1) {
      // Remove hold if it's already added
      problem.holds.splice(existingHoldIndex, 1);
    } else {
      // Add hold to problem using the new ProblemHold structure
      /** @type {ProblemHold} */
      const problemHold = {
        holdIndex,
        hold: { ...hold },
        addedAt: new Date().toISOString(),
        role: role,
      };
      problem.holds.push(problemHold);
    }

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  /**
   * Remove a hold from a boulder problem
   * @param {string} problemId - The problem ID
   * @param {number} holdIndex - The index of the hold to remove
   */
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
      } catch (err) {
        // Revert optimistic update on error
        boulderProblems.value.splice(problemIndex, 0, deletedProblem);
        if (activeProblem.value?.id === problemId) {
          activeProblem.value = deletedProblem;
        }
        error.value = err.message;
        console.error('Error deleting boulder problem:', err);
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

  const updateProblemGrade = (problemId, newGradeLabel) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem) return;

    // Convert grade label to grade object
    const gradeObject = getGradeObjectFromLabel(newGradeLabel);
    problem.grade = gradeObject;

    // Mark problem as having unsaved changes (unless it's local only or being created)
    if (!problem.isLocalOnly && !isCreatingProblem.value) {
      problemsWithUnsavedChanges.value.add(problemId);
    }
  };

  const updateProblem = (updatedProblem) => {
    const problemIndex = boulderProblems.value.findIndex((p) => p.id === updatedProblem.id);
    if (problemIndex === -1) return;

    // Store the previous problem state to check what actually changed
    const previousProblem = boulderProblems.value[problemIndex];

    // Update the problem with new properties
    boulderProblems.value[problemIndex] = {
      ...boulderProblems.value[problemIndex],
      ...updatedProblem,
    };

    // Check if any server-persisted properties changed (exclude local UI state like 'hidden')
    const serverPersistedPropsChanged =
      updatedProblem.name !== previousProblem.name ||
      updatedProblem.grade !== previousProblem.grade ||
      (updatedProblem.holds &&
        JSON.stringify(updatedProblem.holds) !== JSON.stringify(previousProblem.holds));

    // Mark problem as having unsaved changes only if server-persisted properties changed
    if (!updatedProblem.isLocalOnly && !isCreatingProblem.value && serverPersistedPropsChanged) {
      problemsWithUnsavedChanges.value.add(updatedProblem.id);
    }
  };

  // Visibility management
  const showOnlyProblem = (targetProblemId) => {
    // Hide all problems except the target one
    boulderProblems.value.forEach((problem) => {
      if (problem.id === targetProblemId) {
        // Show the target problem
        updateProblem({ ...problem, hidden: false });
      } else {
        // Hide all other problems
        updateProblem({ ...problem, hidden: true });
      }
    });
  };

  const showAllProblems = () => {
    // Show all problems
    boulderProblems.value.forEach((problem) => {
      updateProblem({ ...problem, hidden: false });
    });
  };

  // Check if only one problem is visible (for UI state)
  const isShowingOnlyOneProblem = computed(() => {
    const visibleProblems = boulderProblems.value.filter((p) => !p.hidden);
    return visibleProblems.length === 1 && boulderProblems.value.length > 1;
  });

  // Get the currently isolated problem (if any)
  const isolatedProblem = computed(() => {
    if (!isShowingOnlyOneProblem.value) return null;
    return boulderProblems.value.find((p) => !p.hidden);
  });

  // Batch save functionality
  const saveProblemChanges = async (problemId) => {
    const problem = boulderProblems.value.find((p) => p.id === problemId);
    if (!problem || problem.isLocalOnly || !currentLocationId.value) return;

    isSaving.value = true;
    error.value = null;

    try {
      // Update the entire problem with current state (no viewBox)
      await boulderProblemsService.updateBoulderProblem(currentLocationId.value, problemId, {
        name: problem.name,
        grade: problem.grade,
        holds: problem.holds,
      });

      // Remove from unsaved changes
      problemsWithUnsavedChanges.value.delete(problemId);
    } catch (err) {
      error.value = err.message;
      console.error('Error saving problem changes:', err);
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
      console.error('Error discarding problem changes:', err);
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
      console.warn('No location ID available for clearing problems');
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

    } catch (err) {
      console.error('Failed to clear all boulder problems:', err);
      error.value = err.message || 'Failed to clear all boulder problems';
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
    currentLocationGradingSystem,
    grades,
    gradingSystem,
    problemColors,
    isSaving,

    // Computed
    sortedProblems,
    activeProblemColor,
    isShowingOnlyOneProblem,
    isolatedProblem,

    // Actions
    initializeForLocation,
    setLocationGradingSystem,
    loadBoulderProblems,
    loadProblemsForLocation: (locationId) => loadBoulderProblems(locationId),
    loadProblemsForImage: (locationId, imageId) => loadBoulderProblems(locationId, imageId),
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
    showOnlyProblem,
    showAllProblems,
    isHoldInProblem,
    isHoldInActiveProblem,
    clearAllProblems,
    clearError,
    getProblemStats,

    // Grade conversion helpers
    getGradeObjectFromLabel,
    getGradeLabelFromObject,

    // Batch operations
    saveProblemChanges,
    saveAllPendingChanges,
    discardProblemChanges,
    hasUnsavedChanges,
    getUnsavedChangesCount,
  };
});
