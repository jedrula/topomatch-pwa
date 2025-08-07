<template>
  <svg
    v-if="detectionResults?.svg_markups && detectionResults?.holds"
    class="absolute inset-0 w-full h-full pointer-events-auto"
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
      @click.stop="handleHoldClick(detectionResults.holds[index], index)"
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
  hoveredProblemId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["hold-click"]);

// Reactive state
const svgElement = ref(null);

// SVG viewBox based on image dimensions
const svgViewBox = computed(() => {
  if (!props.detectionResults?.image_info) return "0 0 1000 1000";
  const { width, height } = props.detectionResults.image_info;
  return `0 0 ${width} ${height}`;
});

// Get which problem a hold belongs to
const getHoldProblemId = (holdIndex) => {
  for (const problem of props.boulderProblems) {
    const holdFound = problem.holds?.some(h => h.holdIndex === holdIndex);
    if (holdFound) {
      return problem.id;
    }
  }
  
  // Check if it's in the active problem being created
  if (props.isCreatingProblem && props.activeProblem) {
    const inActiveProblem = props.activeProblem.holds?.some(h => h.holdIndex === holdIndex);
    if (inActiveProblem) {
      return props.activeProblem.id;
    }
  }
  
  return null;
};

// Get CSS classes for hold based on its state
const getHoldClasses = (holdIndex) => {
  const classes = ['hold-svg'];
  
  const problemId = getHoldProblemId(holdIndex);
  
  if (problemId) {
    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      // Hold is part of the problem being created
      classes.push('hold-being-edited');
    } else {
      // Hold is part of an existing problem
      classes.push('hold-assigned');
      
      // Check if this problem is being hovered
      if (props.hoveredProblemId === problemId) {
        classes.push('hold-problem-hovered');
      }
    }
  } else {
    // Hold is available for selection
    classes.push('hold-available');
  }
  
  return classes;
};

// Hold interaction handlers
const handleHoldClick = (hold, index) => {
  console.log(`🎯 Hold clicked:`, { hold, index });
  emit("hold-click", hold, index);
};

// Simplified overlay - no complex positioning needed
// The SVG is absolutely positioned over the image with inset-0

// Expose public methods for compatibility
defineExpose({
  recalculatePosition: () => {
    // No longer needed with simplified positioning
    console.log("📐 Recalculate position called (simplified overlay)");
  },
});
</script>

<style scoped>
/* Base hold styles */
.hold-svg {
  opacity: 0.7;
  transition: opacity 0.2s ease, filter 0.2s ease;
  cursor: pointer;
}

/* Available holds - can be selected */
.hold-available {
  opacity: 0.6;
  filter: none;
}

.hold-available:hover {
  opacity: 0.9;
  filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8));
}

/* Holds being edited in active problem */
.hold-being-edited {
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 1));
}

.hold-being-edited:hover {
  filter: drop-shadow(0 0 12px rgba(34, 197, 94, 1));
}

/* Holds assigned to existing problems */
.hold-assigned {
  opacity: 0.4;
  filter: drop-shadow(0 0 4px rgba(107, 114, 128, 0.6));
  cursor: help;
}

.hold-assigned:hover {
  opacity: 0.6;
  filter: drop-shadow(0 0 6px rgba(107, 114, 128, 0.8));
}

/* When hovering over a problem in the manager, highlight all its holds */
.hold-problem-hovered {
  opacity: 0.9 !important;
  filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) !important;
}

/* Add subtle borders for better visibility */
.hold-svg g {
  stroke-width: 1;
  stroke: rgba(255, 255, 255, 0.3);
}

.hold-being-edited g {
  stroke: rgba(34, 197, 94, 0.8);
  stroke-width: 2;
}

.hold-assigned g {
  stroke: rgba(107, 114, 128, 0.5);
  stroke-width: 1;
}

/* Hover effects on the inner SVG elements */
.hold-available:hover g {
  stroke: rgba(59, 130, 246, 0.8);
  stroke-width: 2;
}

.hold-being-edited:hover g {
  stroke: rgba(34, 197, 94, 1);
  stroke-width: 3;
}

.hold-assigned:hover g {
  stroke: rgba(107, 114, 128, 0.8);
  stroke-width: 2;
}
</style>
