<template>
  <svg
    v-if="detectionResults?.svg_markups && detectionResults?.holds"
    class="absolute inset-0 w-full h-full pointer-events-none"
    :class="{ 'show-overlay': showHoldOverlay }"
    :viewBox="svgViewBox"
    preserveAspectRatio="none"
    ref="svgElement"
  >
    <!-- Individual Hold SVGs -->
    <g
      v-for="(svgMarkup, index) in detectionResults.svg_markups"
      :key="`hold-${detectionResults.holds[index]?.id || index}`"
      :data-hold-index="index"
      :data-hold-id="detectionResults.holds[index]?.id"
      :data-problem-id="getHoldProblemId(index)"
      :class="getHoldClasses(index)"
      class="pointer-events-auto cursor-pointer"
      @click.stop="handleHoldClick(detectionResults.holds[index], index)"
      @mouseenter="handleHoldHover(index, true)"
      @mouseleave="handleHoldHover(index, false)"
    >
      <!-- Render SVG content directly -->
      <g v-html="svgMarkup"></g>
    </g>
  </svg>
</template>

<script setup>
import { ref, computed } from "vue";

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
});

const emit = defineEmits(["hold-click", "hold-hover"]);

// Reactive state
const svgElement = ref(null);
const hoveredHoldIndex = ref(null);
const hoveredProblemIdLocal = ref(null);

// SVG viewBox based on image dimensions
const svgViewBox = computed(() => {
  if (!props.detectionResults?.image_info) return "0 0 1000 1000";
  const { width, height } = props.detectionResults.image_info;
  return `0 0 ${width} ${height}`;
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

// Get CSS classes for hold based on its state
const getHoldClasses = (holdIndex) => {
  const classes = ["hold-svg"];

  // Magic Wand highlighting takes priority when active
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    if (props.magicWandSelection.selectedIndices.includes(holdIndex)) {
      if (holdIndex === props.magicWandSelection.targetHoldIndex) {
        classes.push("magic-wand-target"); // Target hold (the one clicked)
      } else {
        classes.push("magic-wand-proximity"); // Proximity holds
      }
    } else {
      classes.push("magic-wand-dimmed"); // Other holds are dimmed
    }
    return classes; // Return early for magic wand mode
  }

  const problemId = getHoldProblemId(holdIndex);

  if (problemId) {
    // Find the actual problem object to check if it's hidden
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    // Hold belongs to a problem
    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      // Hold is part of the problem being created
      classes.push("hold-being-edited");
    } else if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      // Hold is part of the problem being edited - make it prominent
      classes.push("hold-being-edited");
    } else {
      // Check if the problem is hidden
      if (problem?.hidden) {
        classes.push("hold-hidden");
      } else {
        // Hold belongs to a different problem - not selectable
        classes.push("hold-assigned-other");

        // Check if this problem is being hovered (from parent or local hover)
        if (props.hoveredProblemId === problemId || hoveredProblemIdLocal.value === problemId) {
          classes.push("hold-problem-hovered");
        }
      }
    }
  } else {
    // Hold is available for selection
    classes.push("hold-available");
  }

  // Individual hold hover state
  if (hoveredHoldIndex.value === holdIndex) {
    classes.push("hold-hovered");
  }

  return classes;
};

// Hold interaction handlers
const handleHoldClick = (hold, index) => {
  console.log(`🎯 Hold clicked:`, { hold, index });
  emit("hold-click", hold, index);
};

const handleHoldHover = (index, isEntering) => {
  hoveredHoldIndex.value = isEntering ? index : null;

  if (isEntering) {
    // Find which problem this hold belongs to and highlight all holds in that problem
    const problemId = getHoldProblemId(index);
    hoveredProblemIdLocal.value = problemId;
  } else {
    hoveredProblemIdLocal.value = null;
  }

  emit("hold-hover", index, isEntering);
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
/* Default: Holds are invisible but clickable */
.hold-svg {
  opacity: 0;
  transition: opacity 0.2s ease, filter 0.2s ease;
  cursor: pointer;
  fill: transparent; /* Default fill to avoid flickering */
}

/* When overlay is enabled, show holds */
.show-overlay .hold-svg {
  opacity: 0.7;
}

/* Available holds - only visible when overlay is enabled */
.show-overlay .hold-available {
  opacity: 0.6;
  filter: none;
}

.show-overlay .hold-available:hover,
.show-overlay .hold-available.hold-hovered {
  opacity: 0.9;
  filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8));
}

/* Holds being edited - always visible regardless of overlay setting */
.hold-being-edited {
  opacity: 1 !important;
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 1));
  stroke: rgba(34, 197, 94, 0.8);
  stroke-width: 8;
}

.hold-being-edited:hover,
.hold-being-edited.hold-hovered {
  filter: drop-shadow(0 0 12px rgba(34, 197, 94, 1));
}

/* Holds assigned to existing problems - only visible when overlay enabled */
.show-overlay .hold-assigned {
  opacity: 0.4;
  filter: drop-shadow(0 0 4px rgba(107, 114, 128, 0.6));
  cursor: help;
}

.show-overlay .hold-assigned:hover,
.show-overlay .hold-assigned.hold-hovered {
  opacity: 0.6;
  filter: drop-shadow(0 0 6px rgba(107, 114, 128, 0.8));
}

/* Holds assigned to other problems - always visible when editing */
.hold-assigned-other {
  opacity: 0.3 !important;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4));
  cursor: not-allowed;
}

.hold-assigned-other:hover,
.hold-assigned-other.hold-hovered {
  opacity: 0.4 !important;
  filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6));
}

/* When hovering over a problem (all holds in that problem) */
.hold-problem-hovered {
  opacity: 0.9 !important;
  filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) !important;
}

/* Hidden holds - overlay to cover the real hold completely */
.hold-hidden {
  opacity: 1 !important; /* Always visible to hide the real hold underneath */
}

.hold-hidden g {
  transform: scale(1.1);
  transform-origin: center;
  transform-box: fill-box;
  /* fill: oklch(0.87 0.05 85.04) !important; Specified hidden color */
  fill: lab(82 5.83 24.45) !important;
  stroke: lab(82 5.83 24.45) !important;
}

.hold-hidden path {
  /* fill: oklch(0.87 0.05 85.04) !important; Specified hidden color */
  /* stroke: oklch(0.87 0.05 85.04) !important; */
  /* stroke-width: 0 !important; No border to make it a solid overlay */
  opacity: 1 !important;
}

/* Add subtle borders for better visibility - only when overlay enabled */
.show-overlay .hold-svg path {
  stroke-width: 1;
  stroke: rgba(255, 255, 255, 0.3);
}

/* Transform scaling for better visibility */
.hold-being-edited g {
  transform: scale(1.1);
  transform-origin: center;
  transform-box: fill-box;
}

.hold-being-edited path {
  stroke: rgba(34, 197, 94, 0.8) !important;
  stroke-width: 6 !important;
  fill: rgba(34, 197, 94, 0.3) !important;
}

.show-overlay .hold-assigned path {
  stroke: rgba(107, 114, 128, 0.5);
  stroke-width: 3;
  fill: rgba(107, 114, 128, 0.3);
}

.hold-assigned-other path {
  stroke: rgba(239, 68, 68, 0.4);
  stroke-width: 1;
  fill: rgba(239, 68, 68, 0.2);
}

/* Hover effects on the path elements */
.show-overlay .hold-available:hover path,
.show-overlay .hold-available.hold-hovered path {
  stroke: rgba(59, 130, 246, 0.8);
  stroke-width: 3;
  fill: rgba(59, 130, 246, 0.3);
}

.hold-being-edited:hover path,
.hold-being-edited.hold-hovered path {
  stroke: rgba(34, 197, 94, 1) !important;
  stroke-width: 8 !important;
  fill: rgba(34, 197, 94, 0.4) !important;
}

.show-overlay .hold-assigned:hover path,
.show-overlay .hold-assigned.hold-hovered path {
  stroke: rgba(107, 114, 128, 0.8);
  stroke-width: 4;
  fill: rgba(107, 114, 128, 0.4);
}

.hold-assigned-other:hover path,
.hold-assigned-other.hold-hovered path {
  stroke: rgba(239, 68, 68, 0.6);
  stroke-width: 2;
  fill: rgba(239, 68, 68, 0.3);
}

/* Problem hover - highlight all holds with a white border */
.hold-problem-hovered path {
  stroke: rgba(255, 255, 255, 1) !important;
  stroke-width: 4 !important;
  fill: rgba(168, 85, 247, 0.3) !important;
}

/* Magic Wand Styles - Always visible regardless of show-overlay */
.magic-wand-target {
  opacity: 1 !important; /* Ensure it's fully visible */
}

.magic-wand-target path {
  stroke: rgba(147, 51, 234, 1) !important; /* Bright purple for target hold */
  stroke-width: 6 !important;
  fill: rgba(147, 51, 234, 0.4) !important; /* Solid purple fill */
  filter: drop-shadow(0 0 12px rgba(147, 51, 234, 0.8)) !important;
  animation: magicWandPulse 1.5s ease-in-out infinite;
}

.magic-wand-proximity {
  opacity: 1 !important; /* Ensure it's fully visible */
}

.magic-wand-proximity path {
  stroke: rgba(168, 85, 247, 1) !important; /* Bright lighter purple for proximity holds */
  stroke-width: 4 !important;
  fill: rgba(168, 85, 247, 0.3) !important; /* Semi-transparent purple fill */
  filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.6)) !important;
}

.magic-wand-dimmed {
  opacity: 0.15 !important; /* Much more dimmed for better contrast */
}

.magic-wand-dimmed path {
  opacity: 0.3 !important;
  stroke: rgba(156, 163, 175, 0.3) !important;
  stroke-width: 1 !important;
  fill: rgba(156, 163, 175, 0.1) !important;
}

/* Magic Wand Target Hold Animation - More dramatic pulsing */
@keyframes magicWandPulse {
  0% {
    stroke-width: 6;
    stroke-opacity: 1;
    filter: drop-shadow(0 0 12px rgba(147, 51, 234, 0.8));
  }
  50% {
    stroke-width: 8;
    stroke-opacity: 0.8;
    filter: drop-shadow(0 0 20px rgba(147, 51, 234, 1));
  }
  100% {
    stroke-width: 6;
    stroke-opacity: 1;
    filter: drop-shadow(0 0 12px rgba(147, 51, 234, 0.8));
  }
}

/* Magic Wand Hover Effects - Even more prominent */
.magic-wand-target:hover path {
  stroke: rgba(147, 51, 234, 1) !important;
  stroke-width: 8 !important;
  fill: rgba(147, 51, 234, 0.5) !important;
  filter: drop-shadow(0 0 16px rgba(147, 51, 234, 1)) !important;
}

.magic-wand-proximity:hover path {
  stroke: rgba(168, 85, 247, 1) !important;
  stroke-width: 5 !important;
  fill: rgba(168, 85, 247, 0.5) !important;
  filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.8)) !important;
}
</style>
