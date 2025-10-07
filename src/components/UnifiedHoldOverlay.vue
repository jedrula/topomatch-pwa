<template>
  <svg
    v-if="detectionResults?.svg_markups && detectionResults?.holds"
    class="absolute inset-0 w-full h-full pointer-events-none"
    :viewBox="svgViewBox"
    preserveAspectRatio="none"
    ref="svgElement"
  >
    <!-- Individual Hold SVGs -->
    <HoldSvg
      v-for="(svgMarkup, index) in detectionResults.svg_markups"
      :key="`hold-${detectionResults.holds[index]?.id || index}`"
      :svg-markup="svgMarkup"
      :interaction="getHoldInteraction(index)"
      :interaction-allowed="getHoldInteractionAllowed(index)"
      :color="getHoldColor(index)"
      @click="handleHoldClick(detectionResults.holds[index], index)"
      @hover="(isEntering, event) => handleHoldHover(index, isEntering, event)"
    />
  </svg>
</template>

<script setup>
import { ref, computed } from 'vue';
import HoldSvg from './HoldSvg.vue';

const props = defineProps({
  detectionResults: {
    type: Object,
    required: true,
  },
  imageElement: {
    type: Object,
    required: true,
  },
  boulderProblems: {
    type: Array,
    default: () => [],
  },
  isCreatingProblem: {
    type: Boolean,
    default: false,
  },
  activeProblem: {
    type: Object,
    default: null,
  },
  isEditingProblem: {
    type: Boolean,
    default: false,
  },
  editingProblem: {
    type: Object,
    default: null,
  },
  hoveredProblemId: {
    type: String,
    default: null,
  },
  showHoldOverlay: {
    type: Boolean,
    default: false,
  },
  // Magic Wand props
  magicWandActive: {
    type: Boolean,
    default: false,
  },
  magicWandSelection: {
    type: Object,
    default: () => ({ selectedIndices: [], targetHoldIndex: null, stats: null }),
  },
  // "Show only" visibility props
  isShowingOnlyOneProblem: {
    type: Boolean,
    default: false,
  },
  isolatedProblem: {
    type: Object,
    default: null,
  },
  // Grade filtering props
  filteredProblems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['hold-click', 'hold-hover']);

// Reactive state
const svgElement = ref(null);
const hoveredHoldIndex = ref(null);
const hoveredProblemIdLocal = ref(null);

// SVG viewBox based on image dimensions
const svgViewBox = computed(() => {
  if (!props.detectionResults?.image_info) return '0 0 1000 1000';
  const { width, height } = props.detectionResults.image_info;
  return `0 0 ${width} ${height}`;
});

// Grade filtering - compute which problem IDs should be highlighted
const filteredProblemIds = computed(() => {
  if (!props.filteredProblems || props.filteredProblems.length === 0) {
    return new Set(); // No filtering active
  }
  return new Set(props.filteredProblems.map((p) => p.id));
});

const hasActiveGradeFilter = computed(() => {
  return (
    props.filteredProblems &&
    props.filteredProblems.length > 0 &&
    props.filteredProblems.length < props.boulderProblems.length
  );
});

// Get which problem a hold belongs to
const getHoldProblemId = (holdIndex) => {
  for (const problem of props.boulderProblems) {
    const holdFound = problem.holds?.some((h) => h.holdIndex === holdIndex);
    if (holdFound) {
      return problem.id;
    }
  }

  // Check if it's in the active problem being created
  if (props.isCreatingProblem && props.activeProblem) {
    const inActiveProblem = props.activeProblem.holds?.some((h) => h.holdIndex === holdIndex);
    if (inActiveProblem) {
      return props.activeProblem.id;
    }
  }

  // Check if it's in the problem being edited
  if (props.isEditingProblem && props.editingProblem) {
    const inEditingProblem = props.editingProblem.holds?.some((h) => h.holdIndex === holdIndex);
    if (inEditingProblem) {
      return props.editingProblem.id;
    }
  }

  return null;
};

// Get interaction state for hold based on its current state
const getHoldInteraction = (holdIndex) => {
  // Magic Wand highlighting takes priority when active
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    if (props.magicWandSelection.selectedIndices.includes(holdIndex)) {
      return 'selected'; // Show magic wand selected holds as selected
    } else {
      return 'default'; // Other holds are invisible during magic wand
    }
  }

  const problemId = getHoldProblemId(holdIndex);

  // "Show only one problem" mode - hide all holds except those belonging to the isolated problem
  if (props.isShowingOnlyOneProblem && props.isolatedProblem) {
    if (problemId === props.isolatedProblem.id) {
      // This hold belongs to the isolated problem - show it
      if (hoveredHoldIndex.value === holdIndex) {
        return 'hover';
      } else if (
        props.hoveredProblemId === problemId ||
        hoveredProblemIdLocal.value === problemId
      ) {
        return 'hover';
      } else {
        return 'selected';
      }
    } else {
      // This hold belongs to a different problem or is unclassified - hide it
      return 'hidden';
    }
  }

  // Grade filtering - hide holds that don't belong to filtered problems
  if (hasActiveGradeFilter.value) {
    if (problemId) {
      // This hold belongs to a problem - check if it's in the filtered list
      if (!filteredProblemIds.value.has(problemId)) {
        // This hold belongs to a problem that doesn't match the filter - hide it
        return 'hidden';
      }
      // Fall through to normal problem hold logic
    } else {
      // This is an unclassified hold - hide it during filtering for cleaner view
      return 'hidden';
    }
  }

  if (problemId) {
    // Find the actual problem object to check if it's hidden
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    // Hold belongs to a problem
    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      // Hold is part of the problem being created
      return hoveredHoldIndex.value === holdIndex ? 'hover' : 'selected';
    } else if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      // Hold is part of the problem being edited
      return hoveredHoldIndex.value === holdIndex ? 'hover' : 'selected';
    } else {
      // Check if the problem is hidden
      if (problem?.hidden) {
        return 'hidden';
      } else {
        // Hold belongs to a different problem
        // Check if this problem is being hovered (from parent or local hover)
        if (props.hoveredProblemId === problemId || hoveredProblemIdLocal.value === problemId) {
          return 'hover';
        } else {
          return props.showHoldOverlay ? 'selected' : 'default';
        }
      }
    }
  } else {
    // Hold is available for selection (unclassified)
    if (hoveredHoldIndex.value === holdIndex) {
      return 'hovered';
    } else {
      return props.showHoldOverlay ? 'default' : 'default'; // Only visible when overlay enabled
    }
  }
};

// Get interaction allowed state for hold
const getHoldInteractionAllowed = (holdIndex) => {
  // Magic Wand mode - only selected holds are clickable
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    return props.magicWandSelection.selectedIndices.includes(holdIndex) ? 'selectable' : 'none';
  }

  const problemId = getHoldProblemId(holdIndex);

  if (problemId) {
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    // Hidden holds are not interactive
    if (problem?.hidden) {
      return 'none';
    }

    // Holds being edited are selectable
    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      return 'selectable';
    }
    if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      return 'selectable';
    }

    // Holds belonging to other problems are FORBIDDEN when creating/editing
    if (props.isCreatingProblem || props.isEditingProblem) {
      return 'forbidden';
    }

    // Other problem holds are selectable for navigation (when not creating/editing)
    return 'selectable';
  } else {
    // Available holds are selectable when creating/editing problems
    if (props.isCreatingProblem || props.isEditingProblem) {
      return 'selectable';
    }
    return 'none';
  }
};

// Get color for hold based on its state
const getHoldColor = (holdIndex) => {
  // Magic Wand uses purple colors
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    if (holdIndex === props.magicWandSelection.targetHoldIndex) {
      return '#9333ea'; // purple-700 for target
    } else if (props.magicWandSelection.selectedIndices.includes(holdIndex)) {
      return '#a855f7'; // purple-500 for proximity
    }
  }

  const problemId = getHoldProblemId(holdIndex);

  if (problemId) {
    // Find the problem to get its color
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      return '#22c55e'; // green-500 for being edited
    } else if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      return '#22c55e'; // green-500 for being edited
    } else if (problem?.color) {
      return problem.color; // Use problem's color
    } else {
      return '#6b7280'; // gray-500 for assigned holds
    }
  } else {
    // Available holds use blue
    return '#3b82f6'; // blue-500
  }
};

// Hold interaction handlers
const handleHoldClick = (hold, index) => {
  emit('hold-click', hold, index);
};

const handleHoldHover = (index, isEntering, event) => {
  hoveredHoldIndex.value = isEntering ? index : null;

  if (isEntering) {
    // Find which problem this hold belongs to and highlight all holds in that problem
    const problemId = getHoldProblemId(index);
    hoveredProblemIdLocal.value = problemId;
  } else {
    hoveredProblemIdLocal.value = null;
  }

  emit('hold-hover', index, isEntering, event);
};

// Simplified overlay - no complex positioning needed
// The SVG is absolutely positioned over the image with inset-0

// Expose public methods for compatibility
defineExpose({
  recalculatePosition: () => {
    // No longer needed with simplified positioning
  },
});
</script>

<style scoped>
/* No additional styles needed - HoldSvg component handles all styling */
</style>
