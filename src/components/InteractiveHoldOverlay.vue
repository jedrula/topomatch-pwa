<template>
  <div class="absolute inset-0 w-full h-full pointer-events-none">
    <!-- Main SVG overlay with both AI and manual holds -->
    <svg
      v-if="hasAnyHolds || serverStore.isDrawingMode"
      class="absolute inset-0 w-full h-full pointer-events-none"
      :viewBox="svgViewBox"
      preserveAspectRatio="none"
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
      <g v-if="drawingPreview && serverStore.isDrawingMode">
        <path
          :d="drawingPreview"
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </g>
    </svg>

    <!-- Drawing canvas overlay -->
    <canvas
      v-if="serverStore.isDrawingMode"
      ref="drawingCanvas"
      class="absolute inset-0 w-full h-full cursor-crosshair pointer-events-auto z-20"
      @mousedown="startDrawing"
      @mousemove="updateDrawing"
      @mouseup="finishDrawing"
      @mouseleave="cancelDrawing"
    />

    <!-- Drawing controls -->
    <div
      v-if="serverStore.isDrawingMode"
      class="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-30 pointer-events-auto"
    >
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-gray-700">Draw:</span>

        <button
          @click="serverStore.setDrawingTool('circle')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            serverStore.drawingTool === 'circle'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
        >
          Circle
        </button>

        <button
          @click="serverStore.setDrawingTool('rectangle')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            serverStore.drawingTool === 'rectangle'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
        >
          Rectangle
        </button>

        <button
          @click="serverStore.setDrawingTool('polygon')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            serverStore.drawingTool === 'polygon'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
        >
          Polygon
        </button>

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
        {{ getDrawingInstructions() }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useHoldDetectionServerStore } from "@/stores/holdDetectionServerStore";
import HoldSvg from "./HoldSvg.vue";

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
});

const emit = defineEmits(["hold-click", "hold-hover"]);

const serverStore = useHoldDetectionServerStore();
const svgElement = ref(null);
const drawingCanvas = ref(null);

// Hold interaction state (from UnifiedHoldOverlay)
const hoveredHoldIndex = ref(null);
const hoveredProblemIdLocal = ref(null);

// Drawing state
const isDrawing = ref(false);
const drawingStart = ref(null);
const drawingPreview = ref(null);
const currentPath = ref([]);

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

const startDrawing = (event) => {
  if (!serverStore.isDrawingMode) return;

  isDrawing.value = true;
  const coords = getCanvasCoordinates(event);
  drawingStart.value = coords;

  if (serverStore.drawingTool === "polygon") {
    if (currentPath.value.length === 0) {
      currentPath.value.push(coords);
    }
  }
};

const updateDrawing = (event) => {
  if (!isDrawing.value || !serverStore.isDrawingMode) return;

  const coords = getCanvasCoordinates(event);

  // Convert both start and current coordinates to image coordinates for SVG
  const startImg = getImageCoordinates(drawingStart.value.x, drawingStart.value.y);
  const currentImg = getImageCoordinates(coords.x, coords.y);

  if (serverStore.drawingTool === "circle") {
    const dx = currentImg.x - startImg.x;
    const dy = currentImg.y - startImg.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    drawingPreview.value = `M ${startImg.x + radius} ${startImg.y} A ${radius} ${radius} 0 1 1 ${
      startImg.x - radius
    } ${startImg.y} A ${radius} ${radius} 0 1 1 ${startImg.x + radius} ${startImg.y}`;
  } else if (serverStore.drawingTool === "rectangle") {
    const x = Math.min(startImg.x, currentImg.x);
    const y = Math.min(startImg.y, currentImg.y);
    const width = Math.abs(currentImg.x - startImg.x);
    const height = Math.abs(currentImg.y - startImg.y);
    drawingPreview.value = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${
      y + height
    } Z`;
  }
};

const finishDrawing = (event) => {
  if (!isDrawing.value || !serverStore.isDrawingMode) return;

  const coords = getCanvasCoordinates(event);

  if (serverStore.drawingTool === "polygon") {
    // Add point to polygon
    currentPath.value.push(coords);
    isDrawing.value = false;
    return; // Don't finish polygon yet
  }

  // Create hold from drawing
  createHoldFromDrawing(coords);

  isDrawing.value = false;
  drawingPreview.value = null;
};

const cancelDrawing = () => {
  isDrawing.value = false;
  drawingPreview.value = null;
};

const createHoldFromDrawing = (endCoords) => {
  if (!drawingStart.value) return;

  const startImg = getImageCoordinates(drawingStart.value.x, drawingStart.value.y);
  const endImg = getImageCoordinates(endCoords.x, endCoords.y);

  let svgMarkup = "";
  let boundingBox = {};

  if (serverStore.drawingTool === "circle") {
    const dx = endImg.x - startImg.x;
    const dy = endImg.y - startImg.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    svgMarkup = `<circle cx="${startImg.x}" cy="${startImg.y}" r="${radius}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2"/>`;
    boundingBox = {
      x: startImg.x - radius,
      y: startImg.y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  } else if (serverStore.drawingTool === "rectangle") {
    const x = Math.min(startImg.x, endImg.x);
    const y = Math.min(startImg.y, endImg.y);
    const width = Math.abs(endImg.x - startImg.x);
    const height = Math.abs(endImg.y - startImg.y);

    svgMarkup = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2"/>`;
    boundingBox = { x, y, width, height };
  }

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
    tool: serverStore.drawingTool,
    timestamp: new Date().toISOString(),
  };

  serverStore.addManualHold(hold, props.locationId, props.imageUrl);
};

const finishPolygon = () => {
  if (currentPath.value.length < 3) return;

  // Convert to image coordinates
  const pathPoints = currentPath.value.map((point) => getImageCoordinates(point.x, point.y));

  // Create SVG path
  const pathData =
    pathPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(" ") + " Z";

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
    tool: "polygon",
    pathPoints,
    timestamp: new Date().toISOString(),
  };

  serverStore.addManualHold(hold, props.locationId, props.imageUrl);
  currentPath.value = [];
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
  drawingPreview.value = null;
  currentPath.value = [];
};

const getDrawingInstructions = () => {
  switch (serverStore.drawingTool) {
    case "circle":
      return "Click and drag to draw a circle";
    case "rectangle":
      return "Click and drag to draw a rectangle";
    case "polygon":
      return "Click to add points, double-click to finish";
    default:
      return "";
  }
};

// Canvas setup
function setupCanvas() {
  console.log("setupCanvas called", {
    drawingMode: serverStore.isDrawingMode,
    canvasRef: !!drawingCanvas.value,
    imageElement: !!props.imageElement,
  });

  if (!serverStore.isDrawingMode || !drawingCanvas.value || !props.imageElement) {
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

// Handle polygon double-click
const handleDoubleClick = () => {
  if (serverStore.drawingTool === "polygon" && currentPath.value.length >= 3) {
    finishPolygon();
  }
};

onMounted(() => {
  console.log("🎨 InteractiveHoldOverlay mounted");
  nextTick(() => {
    setupCanvas();
    if (drawingCanvas.value) {
      drawingCanvas.value.addEventListener("dblclick", handleDoubleClick);
      console.log("🎨 Canvas event listeners added");
    }
  });
});

onUnmounted(() => {
  if (drawingCanvas.value) {
    drawingCanvas.value.removeEventListener("dblclick", handleDoubleClick);
  }
});

// Watch for drawing mode changes
watch(
  () => serverStore.isDrawingMode,
  (newMode) => {
    console.log("🎨 Drawing mode changed to:", newMode);
    if (newMode) {
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
