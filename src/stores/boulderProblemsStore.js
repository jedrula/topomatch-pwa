import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useBoulderProblemsStore = defineStore("boulderProblems", () => {
  // State
  const boulderProblems = ref([]);
  const activeProblem = ref(null);
  const nextProblemId = ref(1);
  const isCreatingProblem = ref(false);

  // Boulder problem grades (V-Scale)
  const grades = [
    "VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", 
    "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17"
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
    return [...boulderProblems.value].sort((a, b) => a.id - b.id);
  });

  const activeProblemColor = computed(() => {
    if (!activeProblem.value) return null;
    const colorIndex = (activeProblem.value.id - 1) % problemColors.length;
    return problemColors[colorIndex];
  });

  // Actions
  const createNewProblem = (grade = "V0", name = "") => {
    const newProblem = {
      id: nextProblemId.value,
      name: name || `Problem ${nextProblemId.value}`,
      grade,
      holds: [],
      createdAt: new Date().toISOString(),
      color: problemColors[(nextProblemId.value - 1) % problemColors.length]
    };

    boulderProblems.value.push(newProblem);
    activeProblem.value = newProblem;
    isCreatingProblem.value = true;
    nextProblemId.value++;

    return newProblem;
  };

  const finishCreatingProblem = () => {
    isCreatingProblem.value = false;
    activeProblem.value = null;
  };

  const cancelCreatingProblem = () => {
    if (activeProblem.value && isCreatingProblem.value) {
      // Remove the problem being created
      const index = boulderProblems.value.findIndex(p => p.id === activeProblem.value.id);
      if (index !== -1) {
        boulderProblems.value.splice(index, 1);
        nextProblemId.value--; // Reuse the ID
      }
    }
    isCreatingProblem.value = false;
    activeProblem.value = null;
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
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (!problem) return;

    // Check if hold is already in this problem
    const existingHoldIndex = problem.holds.findIndex(h => h.holdIndex === holdIndex);
    if (existingHoldIndex !== -1) {
      // Remove hold if it's already added
      problem.holds.splice(existingHoldIndex, 1);
    } else {
      // Add hold to problem
      problem.holds.push({
        holdIndex,
        hold: { ...hold },
        addedAt: new Date().toISOString()
      });
    }
  };

  const removeHoldFromProblem = (problemId, holdIndex) => {
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (!problem) return;

    const index = problem.holds.findIndex(h => h.holdIndex === holdIndex);
    if (index !== -1) {
      problem.holds.splice(index, 1);
    }
  };

  const deleteProblem = (problemId) => {
    const index = boulderProblems.value.findIndex(p => p.id === problemId);
    if (index !== -1) {
      const deletedProblem = boulderProblems.value[index];
      boulderProblems.value.splice(index, 1);
      
      // If the deleted problem was active, deselect it
      if (activeProblem.value?.id === problemId) {
        activeProblem.value = null;
        isCreatingProblem.value = false;
      }
      
      return deletedProblem;
    }
  };

  const updateProblemName = (problemId, newName) => {
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (problem) {
      problem.name = newName;
    }
  };

  const updateProblemGrade = (problemId, newGrade) => {
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (problem) {
      problem.grade = newGrade;
    }
  };

  const isHoldInProblem = (problemId, holdIndex) => {
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (!problem) return false;
    return problem.holds.some(h => h.holdIndex === holdIndex);
  };

  const isHoldInActiveProblem = (holdIndex) => {
    if (!activeProblem.value) return false;
    return isHoldInProblem(activeProblem.value.id, holdIndex);
  };

  const clearAllProblems = () => {
    boulderProblems.value = [];
    activeProblem.value = null;
    isCreatingProblem.value = false;
    nextProblemId.value = 1;
  };

  // Get problem statistics
  const getProblemStats = (problemId) => {
    const problem = boulderProblems.value.find(p => p.id === problemId);
    if (!problem) return null;

    return {
      id: problem.id,
      name: problem.name,
      grade: problem.grade,
      holdCount: problem.holds.length,
      createdAt: problem.createdAt,
      color: problem.color
    };
  };

  return {
    // State
    boulderProblems,
    activeProblem,
    nextProblemId,
    isCreatingProblem,
    grades,
    problemColors,
    
    // Computed
    sortedProblems,
    activeProblemColor,
    
    // Actions
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
    getProblemStats
  };
});
