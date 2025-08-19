<template>
  <div class="absolute inset-0 w-full h-full pointer-events-none">
    <!-- Main SVG overlay with both AI and manual holds -->
    <svg
      v-if="hasAnyHolds || serverStore.isDrawingMode"
      class="absolute inset-0 w-full h-full pointer-events-none z-10"
      :viewBox="svgViewBox"
      preserveAspectRatio="xMidYMid meet"
      ref="svgElement"
    >
      <!-- AI-detected holds -->
      <HoldSvg
        v-for="(svgMarkup, index) in aiSvgMarkups"
        :key="`ai-hold-${aiHolds[index]?.id || index}`"
        :svg-markup="svgMarkup"
        :interaction="getHoldInteraction(index)"
        :interaction-allowed="getHoldInteractionAllowed(index)"
        :color="getHoldColor(index)"
        @click="handleHoldClick(aiHolds[index], index)"
        @hover="(isEntering, event) => handleHoldHover(index, isEntering, event)"
      />

      <!-- Manual holds -->
      <HoldSvg
        v-for="(hold, index) in serverStore.manualHolds"
        :key="`manual-hold-${hold.id}`"
        :svg-markup="hold.svgMarkup"
        :interaction="getManualHoldInteraction(hold, index)"
        :interaction-allowed="getManualHoldInteractionAllowed(hold, index)"
        :color="getManualHoldColor(hold, index)"
        @click="handleManualHoldClick(hold, index)"
        @hover="(isEntering, event) => handleManualHoldHover(hold, index, isEntering, event)"
      />

      <!-- Drawing preview -->
      <g v-if="drawingPath.length > 1 && isAnyDrawingMode">
        <path
          :d="createPreviewPath()"
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </g>
    </svg>

    <!-- Drawing canvas overlay -->
    <canvas
      v-if="isAnyDrawingMode"
      ref="drawingCanvas"
      class="absolute inset-0 w-full h-full z-30 cursor-crosshair pointer-events-auto"
      @mousedown="startDrawing"
      @mousemove="updateDrawing"
      @mouseup="finishDrawing"
      @mouseleave="cancelDrawing"
    />

    <!-- Drawing controls -->
    <div
      v-if="serverStore.isDrawingMode"
      class="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-40 pointer-events-auto"
    >
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-gray-700">Free Drawing Mode</span>

        <div class="border-l border-gray-300 pl-3">
          <button
            @click="exitDrawingMode"
            class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Exit Drawing
          </button>
        </div>
      </div>

      <div class="mt-2 text-xs text-gray-600">
        Draw around a hold - shape will close automatically when you release
      </div>
    </div>

    <!-- Boulder Problem Tool Selection (only when creating/editing boulder problems) -->
    <div
      v-if="
        (props.isCreatingProblem || props.isEditingProblem) &&
        !serverStore.isDrawingMode &&
        !serverStore.isDeleteMode
      "
      class="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40 pointer-events-auto"
    >
      <div class="mb-2">
        <span class="text-sm font-medium text-gray-700">Hold Selection Mode</span>
      </div>

      <div class="flex space-x-2">
        <!-- Single Mode -->
        <button
          @click="handleToolChange('single')"
          :class="[
            'px-3 py-2 text-sm rounded transition-colors flex items-center space-x-1',
            isSingleModeEnabled
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <span>👆</span>
          <span>Single</span>
        </button>

        <!-- Quick Draw Mode -->
        <button
          @click="handleToolChange('quick-draw')"
          :class="[
            'px-3 py-2 text-sm rounded transition-colors flex items-center space-x-1',
            isQuickDrawEnabled
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <span>⚡</span>
          <span>Quick Draw</span>
        </button>

        <!-- Magic Wand Mode -->
        <button
          @click="handleToolChange('magic-wand')"
          :class="[
            'px-3 py-2 text-sm rounded transition-colors flex items-center space-x-1',
            isMagicWandModeEnabled
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <span>🪄</span>
          <span>Magic Wand</span>
        </button>
      </div>

      <!-- Mode description -->
      <div class="mt-2 text-xs text-gray-600">
        <span v-if="isSingleModeEnabled">Click individual holds to add to problem</span>
        <span v-else-if="isQuickDrawEnabled"
          >Click holds or drag on empty areas to draw new holds</span
        >
        <span v-else-if="isMagicWandModeEnabled"
          >Click a hold to select nearby holds automatically</span
        >
      </div>
    </div>

    <!-- Delete controls -->
    <div
      v-if="serverStore.isDeleteMode"
      class="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-40 pointer-events-auto"
    >
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-red-700">🗑️ Delete Mode</span>

        <div class="border-l border-gray-300 pl-3">
          <button
            @click="exitDeleteMode"
            class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Exit Delete
          </button>
        </div>
      </div>

      <div class="mt-2 text-xs text-red-600">Click on any hold to delete it</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useHoldDetectionServerStore } from "@/stores/holdDetectionServerStore";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore";
import HoldSvg from "./HoldSvg.vue";
import { ensureHoldHasSvgMarkup } from "@/utils/svgUtils.js";

const props = defineProps({
  detectionResults: {
    type: Object,
    default: null,
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
  magicWandActive: {
    type: Boolean,
    default: false,
  },
  magicWandSelection: {
    type: Array,
    default: () => [],
  },
  showHoldOverlay: {
    type: Boolean,
    default: true,
  },
  isShowingOnlyOneProblem: {
    type: Boolean,
    default: false,
  },
  isolatedProblem: {
    type: Object,
    default: null,
  },
  filteredProblems: {
    type: Array,
    default: () => [],
  },
  // Firestore integration props
  locationId: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    default: null,
  },
  // Boulder hold selection tool (single, magic-wand, etc.)
  boulderHoldSelectionTool: {
    type: String,
    default: "single",
  },
});

const emit = defineEmits(["hold-click", "hold-hover", "tool-selection-change"]);

const serverStore = useHoldDetectionServerStore();
const boulderProblemsStore = useBoulderProblemsStore();
const svgElement = ref(null);
const drawingCanvas = ref(null);

// Hold interaction state (from UnifiedHoldOverlay)
const hoveredHoldIndex = ref(null);
const hoveredProblemIdLocal = ref(null);

// Drawing state
const isDrawing = ref(false);
const drawingPath = ref([]); // Points that make up the free drawing path

// Quick draw mode - enabled when creating/editing boulder problems with quick-draw tool
const isQuickDrawEnabled = computed(() => {
  return (
    (props.isCreatingProblem || props.isEditingProblem) &&
    props.boulderHoldSelectionTool === "quick-draw" &&
    !serverStore.isDeleteMode
  );
});

// Magic wand mode - enabled when creating/editing boulder problems with magic-wand tool
const isMagicWandModeEnabled = computed(() => {
  return (
    (props.isCreatingProblem || props.isEditingProblem) &&
    props.boulderHoldSelectionTool === "magic-wand"
  );
});

// Single mode - enabled when creating/editing boulder problems with single tool
const isSingleModeEnabled = computed(() => {
  return (
    (props.isCreatingProblem || props.isEditingProblem) &&
    props.boulderHoldSelectionTool === "single"
  );
});

// Combined drawing mode - either explicit drawing mode or quick draw mode
const isAnyDrawingMode = computed(() => {
  return serverStore.isDrawingMode || isQuickDrawEnabled.value;
});

// Computed properties
const aiHolds = computed(() => props.detectionResults?.holds || []);
const aiSvgMarkups = computed(() => props.detectionResults?.svg_markups || []);

const hasAnyHolds = computed(() => {
  return aiSvgMarkups.value.length > 0 || serverStore.manualHolds.length > 0;
});

const svgViewBox = computed(() => {
  if (!props.imageElement) return "0 0 100 100";
  const { naturalWidth, naturalHeight } = props.imageElement;
  return `0 0 ${naturalWidth} ${naturalHeight}`;
});

// Drawing methods
const getCanvasCoordinates = (event) => {
  const canvas = drawingCanvas.value;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const coords = {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };

  console.log("getCanvasCoordinates:", {
    event: { clientX: event.clientX, clientY: event.clientY },
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    canvas: { width: canvas.width, height: canvas.height },
    scale: { scaleX, scaleY },
    coords,
  });

  return coords;
};

const getImageCoordinates = (canvasX, canvasY) => {
  const canvas = drawingCanvas.value;
  const image = props.imageElement;

  const scaleX = image.naturalWidth / canvas.width;
  const scaleY = image.naturalHeight / canvas.height;

  const coords = {
    x: canvasX * scaleX,
    y: canvasY * scaleY,
  };

  console.log("getImageCoordinates:", {
    input: { canvasX, canvasY },
    image: { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight },
    canvas: { width: canvas.width, height: canvas.height },
    scale: { scaleX, scaleY },
    coords,
  });

  return coords;
};

// Helper function to check if click/drag started on an existing hold
const isClickOnExistingHold = (event) => {
  // Get the coordinates of the click
  const coords = getCanvasCoordinates(event);
  const imageCoords = getImageCoordinates(coords.x, coords.y);

  // Check if click is within any existing hold's bounding box
  const allHolds = [...aiHolds.value, ...serverStore.manualHolds];

  for (const hold of allHolds) {
    if (hold.x && hold.y && hold.width && hold.height) {
      // Check if click is within this hold's bounding box
      if (
        imageCoords.x >= hold.x &&
        imageCoords.x <= hold.x + hold.width &&
        imageCoords.y >= hold.y &&
        imageCoords.y <= hold.y + hold.height
      ) {
        return true;
      }
    }
  }

  return false;
};

const startDrawing = (event) => {
  // In explicit drawing mode, always allow drawing
  if (serverStore.isDrawingMode) {
    isDrawing.value = true;
    const coords = getCanvasCoordinates(event);
    drawingPath.value = [coords]; // Start new path
    return;
  }

  // In quick draw mode, only allow drawing if not clicking on existing hold
  if (isQuickDrawEnabled.value) {
    if (isClickOnExistingHold(event)) {
      // Let the click pass through to hold selection by not starting drawing
      // The canvas will not intercept this event
      console.log("🎯 Click on existing hold detected - allowing pass-through");
      return;
    }

    // Start drawing in empty area
    console.log("⚡ Quick Draw: Starting draw in empty area");
    isDrawing.value = true;
    const coords = getCanvasCoordinates(event);
    drawingPath.value = [coords]; // Start new path
    return;
  }
};

const updateDrawing = (event) => {
  if (!isDrawing.value || !isAnyDrawingMode.value) return;

  const coords = getCanvasCoordinates(event);
  drawingPath.value.push(coords); // Add point to path
};

const finishDrawing = (event) => {
  if (!isDrawing.value || !isAnyDrawingMode.value) return;

  // Add final point if different from last point
  const coords = getCanvasCoordinates(event);
  const lastPoint = drawingPath.value[drawingPath.value.length - 1];
  if (lastPoint && (Math.abs(coords.x - lastPoint.x) > 2 || Math.abs(coords.y - lastPoint.y) > 2)) {
    drawingPath.value.push(coords);
  }

  // Create hold from the free drawing path
  if (drawingPath.value.length >= 3) {
    createHoldFromPath();
  }

  // Reset drawing state
  isDrawing.value = false;
  drawingPath.value = [];
};

const cancelDrawing = () => {
  isDrawing.value = false;
  drawingPath.value = [];
};

// Create SVG path string for preview
const createPreviewPath = () => {
  if (drawingPath.value.length < 2) return "";

  // Convert canvas coordinates to image coordinates for preview
  const pathPoints = drawingPath.value.map((point) => getImageCoordinates(point.x, point.y));

  const pathData = pathPoints
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ");

  // Show preview with auto-close line
  if (pathPoints.length > 2) {
    return pathData + ` L ${pathPoints[0].x} ${pathPoints[0].y}`;
  }

  return pathData;
};

const createHoldFromPath = () => {
  if (drawingPath.value.length < 3) return;

  // Convert canvas coordinates to image coordinates
  const pathPoints = drawingPath.value.map((point) => getImageCoordinates(point.x, point.y));

  // Auto-close the path by connecting last point to first point
  const closedPath = [...pathPoints];
  const firstPoint = pathPoints[0];
  const lastPoint = pathPoints[pathPoints.length - 1];

  // Only add closing point if it's not already close to the start
  const distance = Math.sqrt(
    Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
  );

  if (distance > 10) {
    // If end is more than 10 pixels from start, auto-close
    closedPath.push(firstPoint);
  }

  // Create SVG path with auto-close
  const pathData =
    closedPath
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(" ") + " Z"; // Z closes the path

  const svgMarkup = `<path d="${pathData}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2"/>`;

  // Calculate bounding box
  const xs = pathPoints.map((p) => p.x);
  const ys = pathPoints.map((p) => p.y);
  const boundingBox = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };

  // Create hold with the same structure as AI detection results
  const hold = {
    // Core bounding box properties (match YOLO output)
    x: boundingBox.x,
    y: boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,

    // Detection metadata
    confidence: 1.0, // Manual holds have 100% confidence
    type: "manual", // Mark as manual hold

    // Center point (like YOLO center)
    centerPoint: {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2,
    },

    // Segmentation info (manual holds are already precisely defined)
    segmented: true,
    iouScore: 1.0, // Perfect "segmentation" since it's manually drawn

    // SVG rendering data (for display)
    svgMarkup,

    // Manual-specific metadata
    tool: "freehand",
    pathPoints: closedPath,
    timestamp: new Date().toISOString(),
  };

  // Save the manual hold to Firestore
  serverStore.addManualHold(hold, props.locationId, props.imageUrl);

  // If in quick draw mode (boulder problem creation/editing),
  // automatically add the hold to the active problem
  if (isQuickDrawEnabled.value) {
    const activeProblem = props.activeProblem || props.editingProblem;
    if (activeProblem) {
      // Get the index of the newly created hold in the combined holds array
      // Manual holds come after AI holds in the combined array
      const aiHoldsCount = aiHolds.value.length;
      const manualHoldIndex = aiHoldsCount + serverStore.manualHolds.length - 1; // -1 because we just added it

      // Ensure the hold has svgMarkup for consistent display
      const enrichedHold = ensureHoldHasSvgMarkup(hold);

      // Add to the active problem
      boulderProblemsStore.addHoldToProblem(activeProblem.id, enrichedHold, manualHoldIndex);

      console.log(`⚡ Quick Draw: Added hold to boulder problem "${activeProblem.name}"`);
    }
  }
};

// Computed properties for filtering (from UnifiedHoldOverlay)
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

// Get which problem a hold belongs to (works with combined holds)
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

// Get interaction state for hold based on its current state (from UnifiedHoldOverlay)
const getHoldInteraction = (holdIndex) => {
  // During delete mode, AI holds are not deletable but show as disabled
  if (serverStore.isDeleteMode) {
    // AI holds (first part of combined holds array) cannot be deleted
    if (holdIndex < aiHolds.value.length) {
      return "disabled"; // AI holds cannot be deleted
    } else {
      // Manual holds can be deleted
      if (hoveredHoldIndex.value === holdIndex) {
        return "delete-hover"; // Special hover state for delete mode
      } else {
        return "delete-target"; // Show as deletable
      }
    }
  }

  // During drawing mode, make existing holds visible with reduced opacity
  if (serverStore.isDrawingMode) {
    if (hoveredHoldIndex.value === holdIndex) {
      return "hover";
    } else {
      return "drawing-background"; // Show existing holds with low opacity during drawing mode
    }
  }

  // Magic Wand highlighting takes priority when active
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    if (props.magicWandSelection.selectedIndices.includes(holdIndex)) {
      return "selected"; // Show magic wand selected holds as selected
    } else {
      return "default"; // Other holds are invisible during magic wand
    }
  }

  const problemId = getHoldProblemId(holdIndex);

  // "Show only one problem" mode - hide all holds except those belonging to the isolated problem
  if (props.isShowingOnlyOneProblem && props.isolatedProblem) {
    if (problemId === props.isolatedProblem.id) {
      if (hoveredHoldIndex.value === holdIndex) {
        return "hover";
      } else if (
        props.hoveredProblemId === problemId ||
        hoveredProblemIdLocal.value === problemId
      ) {
        return "hover";
      } else {
        return "selected";
      }
    } else {
      return "hidden";
    }
  }

  // Grade filtering - hide holds that don't belong to filtered problems
  if (hasActiveGradeFilter.value) {
    if (problemId) {
      if (!filteredProblemIds.value.has(problemId)) {
        return "hidden";
      }
    } else {
      return "hidden";
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
      return hoveredHoldIndex.value === holdIndex ? "hover" : "selected";
    } else if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      // Hold is part of the problem being edited
      return hoveredHoldIndex.value === holdIndex ? "hover" : "selected";
    } else {
      // Check if the problem is hidden
      if (problem?.hidden) {
        return "hidden";
      } else {
        // Hold belongs to a different problem
        if (props.hoveredProblemId === problemId || hoveredProblemIdLocal.value === problemId) {
          return "hover";
        } else {
          return props.showHoldOverlay ? "selected" : "default";
        }
      }
    }
  } else {
    // Hold is available for selection (unclassified)
    if (hoveredHoldIndex.value === holdIndex) {
      return "hover";
    } else {
      return props.showHoldOverlay ? "default" : "default";
    }
  }
};

// Get interaction allowed state for hold (from UnifiedHoldOverlay)
const getHoldInteractionAllowed = (holdIndex) => {
  // Magic Wand mode - only selected holds are clickable
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    return props.magicWandSelection.selectedIndices.includes(holdIndex) ? "selectable" : "none";
  }

  const problemId = getHoldProblemId(holdIndex);

  if (problemId) {
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    // Hidden holds are not interactive
    if (problem?.hidden) {
      return "none";
    }

    // Holds being edited are selectable
    if (props.isCreatingProblem && props.activeProblem?.id === problemId) {
      return "selectable";
    }
    if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      return "selectable";
    }

    // Holds belonging to other problems are FORBIDDEN when creating/editing
    if (props.isCreatingProblem || props.isEditingProblem) {
      return "forbidden";
    }

    // Other problem holds are selectable for navigation (when not creating/editing)
    return "selectable";
  } else {
    // Available holds are selectable when creating/editing problems
    if (props.isCreatingProblem || props.isEditingProblem) {
      return "selectable";
    }
    return "none";
  }
};

// Get color for hold based on its state (from UnifiedHoldOverlay)
const getHoldColor = (holdIndex) => {
  // Magic Wand uses purple colors
  if (props.magicWandActive && props.magicWandSelection.selectedIndices.length > 0) {
    if (holdIndex === props.magicWandSelection.targetHoldIndex) {
      return "#9333ea"; // purple-700 for target
    } else if (props.magicWandSelection.selectedIndices.includes(holdIndex)) {
      return "#a855f7"; // purple-500 for proximity
    }
  }

  const problemId = getHoldProblemId(holdIndex);

  if (problemId) {
    // Find the actual problem object
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    if (problem) {
      return problem.color || "#6b7280"; // Use problem color or gray-500 fallback
    } else {
      return "#6b7280"; // gray-500 for assigned holds
    }
  } else {
    // Available holds use blue (unless it's a manual hold)
    return "#3b82f6"; // blue-500
  }
};

// Manual hold interaction methods - match AI hold logic exactly
const getManualHoldInteraction = (hold, manualIndex) => {
  // Calculate the combined index (AI holds + manual hold position)
  const combinedIndex = aiHolds.value.length + manualIndex;

  // Use the same logic as AI holds
  return getHoldInteraction(combinedIndex);
};

const getManualHoldInteractionAllowed = (hold, manualIndex) => {
  // Calculate the combined index (AI holds + manual hold position)
  const combinedIndex = aiHolds.value.length + manualIndex;

  // Use the same logic as AI holds
  return getHoldInteractionAllowed(combinedIndex);
};

const getManualHoldColor = (hold, manualIndex) => {
  // Calculate the combined index (AI holds + manual hold position)
  const combinedIndex = aiHolds.value.length + manualIndex;

  // Use the same logic as AI holds but with green base color for manual holds
  const baseColor = getHoldColor(combinedIndex);

  // If it's a default color, use green for manual holds
  if (baseColor === "#3b82f6") {
    // blue-500 (default AI color)
    return "#059669"; // green-600 for manual holds
  }

  return baseColor; // Keep special colors (purple for magic wand, etc.)
};

const handleHoldClick = (hold, index) => {
  // In delete mode, AI holds cannot be deleted
  if (serverStore.isDeleteMode) {
    console.log("🗑️ Cannot delete AI-detected holds");
    return;
  }

  emit("hold-click", hold, index);
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

  emit("hold-hover", index, isEntering, event);
};

const handleManualHoldClick = (hold, manualIndex) => {
  // In delete mode, delete the manual hold
  if (serverStore.isDeleteMode) {
    console.log("🗑️ Deleting manual hold:", hold);
    serverStore.removeManualHold(hold.id, props.locationId, props.imageUrl);
    return;
  }

  // Calculate the combined index (AI holds + manual hold position)
  const combinedIndex = aiHolds.value.length + manualIndex;

  console.log("Manual hold clicked:", { hold, manualIndex, combinedIndex });

  // Emit the same event that AI holds emit
  emit("hold-click", hold, combinedIndex);
};

const handleManualHoldHover = (hold, manualIndex, isEntering, event) => {
  // Calculate the combined index (AI holds + manual hold position)
  const combinedIndex = aiHolds.value.length + manualIndex;

  console.log("Manual hold hover:", { hold, manualIndex, combinedIndex, isEntering });

  // Update local hover state
  hoveredHoldIndex.value = isEntering ? combinedIndex : null;

  if (isEntering) {
    // Find which problem this hold belongs to and highlight all holds in that problem
    const problemId = getHoldProblemId(combinedIndex);
    hoveredProblemIdLocal.value = problemId;
  } else {
    hoveredProblemIdLocal.value = null;
  }

  // Emit the same event that AI holds emit
  emit("hold-hover", combinedIndex, isEntering, event);
};

const exitDrawingMode = () => {
  serverStore.setDrawingMode(false);
  isDrawing.value = false;
  drawingPath.value = [];
};

const exitDeleteMode = () => {
  serverStore.setDeleteMode(false);
};

const handleToolChange = (tool) => {
  console.log("🔧 Tool selection changed:", tool);
  emit("tool-selection-change", tool);
};

// Canvas setup
function setupCanvas() {
  console.log("setupCanvas called", {
    isAnyDrawingMode: isAnyDrawingMode.value,
    canvasRef: !!drawingCanvas.value,
    imageElement: !!props.imageElement,
  });

  if (!isAnyDrawingMode.value || !drawingCanvas.value || !props.imageElement) {
    console.log("setupCanvas early return - conditions not met");
    return;
  }

  const canvas = drawingCanvas.value;
  const img = props.imageElement;

  // Wait for next tick to ensure DOM is updated
  nextTick(() => {
    console.log("setupCanvas - setting dimensions", {
      imageWidth: img.clientWidth,
      imageHeight: img.clientHeight,
      imageOffsetWidth: img.offsetWidth,
      imageOffsetHeight: img.offsetHeight,
    });

    // Set canvas size to match the actual displayed image size
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set canvas style dimensions to match
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    console.log("setupCanvas - canvas dimensions set", {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasStyleWidth: canvas.style.width,
      canvasStyleHeight: canvas.style.height,
    });

    // Clear any existing drawing
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

onMounted(() => {
  console.log("🎨 InteractiveHoldOverlay mounted");
  nextTick(() => {
    setupCanvas();
    console.log("🎨 Canvas setup completed");
  });
});

onUnmounted(() => {
  console.log("🎨 InteractiveHoldOverlay unmounted");
});

// Watch for drawing mode changes
watch(
  [() => serverStore.isDrawingMode, () => isQuickDrawEnabled.value],
  ([newDrawingMode, newQuickDrawMode]) => {
    console.log("🎨 Drawing mode changed:", {
      drawingMode: newDrawingMode,
      quickDrawMode: newQuickDrawMode,
      anyDrawingMode: isAnyDrawingMode.value,
    });
    if (newDrawingMode || newQuickDrawMode) {
      nextTick(() => {
        setupCanvas();
      });
    }
  }
);
</script>

<style scoped>
.cursor-crosshair {
  cursor: crosshair;
}
</style>
