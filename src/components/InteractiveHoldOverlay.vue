<template>
  <div class="absolute inset-0 w-full h-full pointer-events-none">
    <!-- Main SVG overlay with both AI and manual holds -->
    <svg
      v-if="aiSvgMarkups.length > 0 || serverStore.manualHolds.length > 0 || serverStore.isDrawingMode || serverStore.isDeleteMode || serverStore.isVolumeMode || serverStore.isCropMode"
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
        :interaction="getHoldInteraction(aiHolds[index])"
        :interaction-allowed="getHoldInteractionAllowed(aiHolds[index])"
        :color="getHoldColor(aiHolds[index])"
        :hit-area-size="hitAreaSize"
        @click="handleHoldClick(aiHolds[index], index)"
        @hover="(isEntering, event) => handleHoldHover(aiHolds[index], isEntering, event)"
      />

      <!-- Manual holds -->
      <HoldSvg
        v-for="(hold, index) in serverStore.manualHolds"
        :key="`manual-hold-${hold.id}`"
        :svg-markup="hold.svgMarkup"
        :interaction="getManualHoldInteraction(hold)"
        :interaction-allowed="getManualHoldInteractionAllowed(hold)"
        :color="getManualHoldColor(hold)"
        :hit-area-size="hitAreaSize"
        @click="handleManualHoldClick(hold, index)"
        @hover="(isEntering, event) => handleManualHoldHover(hold, index, isEntering, event)"
      />

      <!-- Drawing preview -->
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

      <!-- Crop polygon preview -->
      <g v-if="serverStore.isCropMode">
        <!-- Filled polygon when we have points -->
        <polygon
          v-if="cropPoints.length >= 2"
          :points="cropPoints.map(p => `${p.x},${p.y}`).join(' ')"
          fill="rgba(225, 29, 72, 0.15)"
          stroke="#e11d48"
          stroke-width="3"
          stroke-dasharray="8,4"
        />
        <!-- Line from last point to cursor -->
        <line
          v-if="cropPoints.length >= 1 && cropCursorPos"
          :x1="cropPoints[cropPoints.length - 1].x"
          :y1="cropPoints[cropPoints.length - 1].y"
          :x2="cropCursorPos.x"
          :y2="cropCursorPos.y"
          stroke="#e11d48"
          stroke-width="2"
          stroke-dasharray="4,4"
          opacity="0.6"
        />
        <!-- Vertex circles -->
        <circle
          v-for="(point, idx) in cropPoints"
          :key="'crop-pt-' + idx"
          :cx="point.x"
          :cy="point.y"
          :r="idx === 0 && cropPoints.length >= 3 ? 12 : 6"
          :fill="idx === 0 && cropPoints.length >= 3 ? '#e11d48' : '#fff'"
          :stroke="idx === 0 && cropPoints.length >= 3 ? '#fff' : '#e11d48'"
          stroke-width="2"
          class="pointer-events-none"
        />
        <!-- Close hint on first point -->
        <text
          v-if="cropPoints.length >= 3 && cropCursorNearFirst"
          :x="cropPoints[0].x"
          :y="cropPoints[0].y - 18"
          text-anchor="middle"
          fill="#e11d48"
          font-size="14"
          font-weight="bold"
          class="pointer-events-none"
        >Click to close</text>
        <!-- Click target overlay for crop (transparent rect over entire SVG) -->
        <rect
          x="0" y="0"
          width="100%" height="100%"
          fill="transparent"
          class="pointer-events-auto cursor-crosshair"
          @click="handleCropClick"
          @dblclick="handleCropDoubleClick"
          @mousemove="handleCropMouseMove"
        />
      </g>
    </svg>

    <!-- Drawing canvas overlay -->
    <canvas
      v-if="isAnyDrawingMode"
      ref="drawingCanvas"
      class="z-30 cursor-crosshair pointer-events-auto"
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

    <!-- Crop mode controls -->
    <div
      v-if="serverStore.isCropMode"
      class="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-40 pointer-events-auto"
    >
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-rose-700">Crop Holds Mode</span>

        <div class="border-l border-gray-300 pl-3 flex items-center space-x-2">
          <button
            v-if="cropPoints.length > 0"
            @click="cropPoints.pop()"
            class="px-3 py-1 text-sm bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors"
          >
            Undo Point
          </button>
          <button
            v-if="cropPoints.length > 0"
            @click="resetCropPolygon"
            class="px-3 py-1 text-sm bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors"
          >
            Reset
          </button>
          <button
            @click="resetCropPolygon(); serverStore.setCropMode(false)"
            class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <div class="mt-2 text-xs text-gray-600">
        {{ cropPoints.length === 0
          ? 'Click to place polygon points around the area to keep'
          : cropPoints.length < 3
            ? `${cropPoints.length} point${cropPoints.length > 1 ? 's' : ''} placed — need at least 3`
            : `${cropPoints.length} points — click first point or double-click to close`
        }}
      </div>
    </div>

    <!-- Boulder Problem Tool Selection (only when creating/editing boulder problems) -->
    <div
      v-if="
        (props.isCreatingProblem || props.isEditingProblem) &&
        !serverStore.isDrawingMode &&
        !serverStore.isDeleteMode
      "
      ref="toolPanelElement"
      class="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40 pointer-events-auto hidden md:block cursor-move"
      :class="{ 'shadow-2xl': isDraggingToolPanel }"
      :style="{
        left: `${toolPanelX}px`,
        top: `${toolPanelY}px`,
        opacity: isDraggingToolPanel ? '0.9' : '1',
        transition: isDraggingToolPanel ? 'none' : 'opacity 0.2s ease',
      }"
      @mousedown="startDragToolPanel"
    >
      <div class="mb-2">
        <span class="text-sm font-medium text-gray-700">Hold Selection Mode</span>
        <span class="text-xs text-gray-500 ml-2">(Drag to move)</span>
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
          title="Quick Draw Mode - Click holds or drag to draw new holds. TIP: Hold ⌘/Ctrl to temporarily activate Quick Draw!"
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

      <div class="mt-2 text-xs text-red-600">Click on any hold to delete it (AI or manual)</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useHoldDetectionServerStore } from '@/stores/holdDetectionServerStore';
import { useHoldDetectionPersistenceStore } from '@/stores/holdDetectionPersistenceStore';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useDraggable } from '@/composables/useDraggable.js';
import HoldSvg from './HoldSvg.vue';
import { ensureHoldHasSvgMarkup } from '@/utils/svgUtils.js';

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
  // Magic Wand props
  magicWandActive: {
    type: Boolean,
    default: false,
  },
  magicWandSelection: {
    type: Object,
    default: () => ({ selectedHoldIds: [], targetHoldIndex: null, stats: null }),
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
  imageId: {
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
    default: 'single',
  },
});

const emit = defineEmits(['hold-click', 'hold-hover', 'tool-selection-change', 'delete-hold', 'crop-complete']);

const serverStore = useHoldDetectionServerStore();
const persistenceStore = useHoldDetectionPersistenceStore();
const boulderProblemsStore = useBoulderProblemsStore();
const svgElement = ref(null);
const drawingCanvas = ref(null);

// Hold interaction state (from UnifiedHoldOverlay)
const hoveredHoldIndex = ref(null);
const hoveredProblemIdLocal = ref(null);

// Drawing state
const isDrawing = ref(false);
const drawingPath = ref([]); // Points that make up the free drawing path

// Command key shortcut state for temporary quick-draw mode
const isCommandKeyHeld = ref(false);
const previousToolBeforeCommand = ref(null);

// Dragging functionality for Hold Selection Mode panel
const {
  isDragging: isDraggingToolPanel,
  x: toolPanelX,
  y: toolPanelY,
  elementRef: toolPanelElement,
  startDrag: startDragToolPanel,
} = useDraggable(16, 16);

// Boulder tool modes - unified computed properties
const isCreatingOrEditing = computed(() => props.isCreatingProblem || props.isEditingProblem);

const toolModeChecks = computed(() => {
  const baseCondition = isCreatingOrEditing.value && !serverStore.isDeleteMode;
  return {
    single: baseCondition && props.boulderHoldSelectionTool === 'single',
    quickDraw: baseCondition && props.boulderHoldSelectionTool === 'quick-draw',
    magicWand: baseCondition && props.boulderHoldSelectionTool === 'magic-wand',
  };
});

// Individual mode checks (for backward compatibility)
const isQuickDrawEnabled = computed(() => toolModeChecks.value.quickDraw);
const isMagicWandModeEnabled = computed(() => toolModeChecks.value.magicWand);
const isSingleModeEnabled = computed(() => toolModeChecks.value.single);

// Combined drawing mode - either explicit drawing mode or quick draw mode
const isAnyDrawingMode = computed(() => {
  return serverStore.isDrawingMode || isQuickDrawEnabled.value;
});

// Use small hit area when creating/editing boulder problems for precision
const hitAreaSize = computed(() => {
  return (props.isCreatingProblem || props.isEditingProblem) ? 'small' : 'large';
});

// Computed properties
const aiHolds = computed(() => props.detectionResults?.holds || []);
const aiSvgMarkups = computed(() => props.detectionResults?.svg_markups || []);

const svgViewBox = computed(() => {
  if (!props.imageElement) return '0 0 100 100';
  
  const { naturalWidth, naturalHeight } = props.imageElement;
  
  // If we have compression info, calculate the actual processed image dimensions
  if (props.detectionResults?.compressionRatio && props.detectionResults.compressionRatio > 1) {
    // Get compression settings from the server store to determine processed dimensions
    const serverStore = useHoldDetectionServerStore();
    const compressionSettings = serverStore.compressionSettings;
    
    
    if (compressionSettings.enabled && compressionSettings.maxWidthOrHeight) {
      const maxDimension = compressionSettings.maxWidthOrHeight;
      
      // Calculate the processed dimensions based on the maxWidthOrHeight constraint
      let processedWidth, processedHeight;
      
      if (naturalWidth > naturalHeight) {
        // Landscape orientation
        if (naturalWidth > maxDimension) {
          processedWidth = maxDimension;
          processedHeight = Math.round((naturalHeight * maxDimension) / naturalWidth);
        } else {
          processedWidth = naturalWidth;
          processedHeight = naturalHeight;
        }
      } else {
        // Portrait orientation
        if (naturalHeight > maxDimension) {
          processedHeight = maxDimension;
          processedWidth = Math.round((naturalWidth * maxDimension) / naturalHeight);
        } else {
          processedWidth = naturalWidth;
          processedHeight = naturalHeight;
        }
      }
      
      
      return `0 0 ${processedWidth} ${processedHeight}`;
    }
  }
  
  // No compression or compression info - use natural dimensions
  return `0 0 ${naturalWidth} ${naturalHeight}`;
});

// Drawing methods
const getCanvasCoordinates = (event) => {
  const canvas = drawingCanvas.value;
  const rect = canvas.getBoundingClientRect();
  
  // For touch events, use the first touch point
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  
  // Calculate coordinates relative to canvas (no scaling needed - canvas size = display size)
  const coords = {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };

  console.log('🖱️ Canvas coords:', coords, 'from client:', { clientX, clientY }, 'rect:', { left: rect.left, top: rect.top });

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
console.log('🖼️ Image coords:', coords, 'from canvas:', { canvasX, canvasY }, 'scale:', { scaleX, scaleY });

  
  return coords;
};

const startDrawing = (event) => {
  // In explicit drawing mode, always allow drawing
  if (serverStore.isDrawingMode) {
    isDrawing.value = true;
    const coords = getCanvasCoordinates(event);
    drawingPath.value = [coords]; // Start new path
    return;
  }

  // In quick draw mode, always allow drawing
  // Small hit areas on holds allow clicking through to select them
  if (isQuickDrawEnabled.value) {
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

const finishDrawing = async (event) => {
  if (!isDrawing.value || !isAnyDrawingMode.value) return;

  // Add final point if different from last point
  const coords = getCanvasCoordinates(event);
  const lastPoint = drawingPath.value[drawingPath.value.length - 1];
  if (lastPoint && (Math.abs(coords.x - lastPoint.x) > 2 || Math.abs(coords.y - lastPoint.y) > 2)) {
    drawingPath.value.push(coords);
  }

  // Create hold from the free drawing path
  if (drawingPath.value.length >= 3) {
    await createHoldFromPath();
  }

  // Reset drawing state
  isDrawing.value = false;
  drawingPath.value = [];
};

const cancelDrawing = () => {
  isDrawing.value = false;
  drawingPath.value = [];
};

// ============================================================================
// Crop polygon builder - click to place points, close by clicking first point or double-click
// ============================================================================
const cropPoints = ref([]);
const cropCursorPos = ref(null);
const cropCursorNearFirst = ref(false);

const CLOSE_THRESHOLD = 20; // pixels in SVG/image coords to snap to first point

const getSvgCoordinates = (event) => {
  const svg = svgElement.value;
  if (!svg) return null;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgPt.x, y: svgPt.y };
};

const handleCropClick = (event) => {
  const coords = getSvgCoordinates(event);
  if (!coords) return;

  // If we have 3+ points and click near the first point, close the polygon
  if (cropPoints.value.length >= 3) {
    const first = cropPoints.value[0];
    const dist = Math.sqrt((coords.x - first.x) ** 2 + (coords.y - first.y) ** 2);
    if (dist < CLOSE_THRESHOLD) {
      finishCropPolygon();
      return;
    }
  }

  cropPoints.value.push(coords);
};

const handleCropDoubleClick = () => {
  if (cropPoints.value.length >= 3) {
    finishCropPolygon();
  }
};

const handleCropMouseMove = (event) => {
  const coords = getSvgCoordinates(event);
  if (!coords) return;
  cropCursorPos.value = coords;

  // Check proximity to first point for visual feedback
  if (cropPoints.value.length >= 3) {
    const first = cropPoints.value[0];
    const dist = Math.sqrt((coords.x - first.x) ** 2 + (coords.y - first.y) ** 2);
    cropCursorNearFirst.value = dist < CLOSE_THRESHOLD;
  } else {
    cropCursorNearFirst.value = false;
  }
};

const finishCropPolygon = () => {
  const polygon = [...cropPoints.value];
  cropPoints.value = [];
  cropCursorPos.value = null;
  cropCursorNearFirst.value = false;
  emit('crop-complete', polygon);
};

const resetCropPolygon = () => {
  cropPoints.value = [];
  cropCursorPos.value = null;
  cropCursorNearFirst.value = false;
};

// Create SVG path string for preview
const createPreviewPath = () => {
  if (drawingPath.value.length < 2) return '';

  // Convert canvas coordinates to image coordinates for preview
  const pathPoints = drawingPath.value.map((point) => getImageCoordinates(point.x, point.y));

  const pathData = pathPoints
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(' ');

  // Show preview with auto-close line
  if (pathPoints.length > 2) {
    return pathData + ` L ${pathPoints[0].x} ${pathPoints[0].y}`;
  }

  return pathData;
};

const createHoldFromPath = async () => {
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
      .join(' ') + ' Z'; // Z closes the path

  // Create SVG without styling - HoldSvg component will handle all styling based on interaction state
  const svgMarkup = `<path d="${pathData}" fill="transparent" stroke="transparent" stroke-width="2"/>`;

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
    // Unique identifier for manual hold
    id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    
    // Core bounding box properties (match YOLO output)
    x: boundingBox.x,
    y: boundingBox.y,
    width: boundingBox.width,
    height: boundingBox.height,

    // Detection metadata
    confidence: 1.0, // Manual holds have 100% confidence
    type: 'manual', // Mark as manual hold

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
    tool: 'freehand',
    pathPoints: closedPath,
    timestamp: new Date().toISOString(),
  };

  // Add to local store immediately for instant preview
  serverStore.addManualHold(hold);

  // Save the manual hold to Firestore using persistence store
  try {
    await persistenceStore.addManualHold(props.imageId, hold);
    
    // If in quick draw mode (boulder problem creation/editing),
    // automatically add the hold to the active problem
    if (isQuickDrawEnabled.value) {
      const activeProblem = props.activeProblem || props.editingProblem;
      if (activeProblem) {
        // Save was successful - add the persistent hold to the problem
        serverStore.addManualHold(hold);

        // Ensure the hold has svgMarkup for consistent display
        const enrichedHold = ensureHoldHasSvgMarkup(hold);

        // Add to the active problem (uses hold.id internally)
        boulderProblemsStore.addHoldToProblem(activeProblem.id, enrichedHold);
      }
    }
  } catch (error) {
    console.error('❌ Failed to save manual hold:', error);
    // Remove from local store since persistence failed
    serverStore.removeManualHold(hold);
    return; // Don't add to problem if save failed
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
const getHoldProblemId = (hold) => {
  if (!hold) return null;
  
  const holdIdentifier = hold.id;
  
  for (const problem of props.boulderProblems) {
    const holdFound = problem.holds?.some((h) => h.holdId === holdIdentifier);
    if (holdFound) {
      return problem.id;
    }
  }

  // Check if it's in the active problem being created
  if (props.isCreatingProblem && props.activeProblem) {
    const inActiveProblem = props.activeProblem.holds?.some((h) => h.holdId === holdIdentifier);
    if (inActiveProblem) {
      return props.activeProblem.id;
    }
  }

  // Check if it's in the problem being edited
  if (props.isEditingProblem && props.editingProblem) {
    const inEditingProblem = props.editingProblem.holds?.some((h) => h.holdId === holdIdentifier);
    if (inEditingProblem) {
      return props.editingProblem.id;
    }
  }

  return null;
};

// Get interaction state for hold based on its current state (from UnifiedHoldOverlay)
const getHoldInteraction = (hold) => {
  if (!hold) return 'default';
  
  // During delete mode, both AI and manual holds can be deleted
  if (serverStore.isDeleteMode) {
    if (hoveredHoldIndex.value === hold.id) {
      return 'delete-hover'; // Special hover state for delete mode
    } else {
      return 'delete-target'; // Show as deletable
    }
  }

  // Volume mode: highlight volumes and make all holds interactive
  if (serverStore.isVolumeMode) {
    if (hoveredHoldIndex.value === hold.id) {
      return 'volume-hover';
    }
    return hold.volume ? 'volume-marked' : 'volume-target';
  }

  // During drawing mode, make existing holds visible with reduced opacity
  if (serverStore.isDrawingMode || serverStore.isCropMode) {
    if (hoveredHoldIndex.value === hold.id) {
      return 'hover';
    } else {
      return 'drawing-background'; // Show existing holds with low opacity during drawing/crop mode
    }
  }

  // Magic Wand highlighting takes priority when active
  if (props.magicWandActive && props.magicWandSelection.selectedHoldIds.length > 0) {
    if (props.magicWandSelection.selectedHoldIds.includes(hold.id)) {
      return 'selected'; // Show magic wand selected holds as selected
    } else {
      return 'default'; // Other holds are invisible during magic wand
    }
  }

  const problemId = getHoldProblemId(hold);

  // "Show only one problem" mode - hide all holds except those belonging to the isolated problem
  if (props.isShowingOnlyOneProblem && props.isolatedProblem) {
    if (problemId === props.isolatedProblem.id) {
      if (hoveredHoldIndex.value === hold.id) {
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
      return 'hidden';
    }
  }

  // Grade filtering - hide holds that don't belong to filtered problems
  if (hasActiveGradeFilter.value) {
    if (problemId) {
      if (!filteredProblemIds.value.has(problemId)) {
        return 'hidden';
      }
    } else {
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
      return hoveredHoldIndex.value === hold.id ? 'hover' : 'selected';
    } else if (props.isEditingProblem && props.editingProblem?.id === problemId) {
      // Hold is part of the problem being edited
      return hoveredHoldIndex.value === hold.id ? 'hover' : 'selected';
    } else {
      // Check if the problem is hidden
      if (problem?.hidden) {
        return 'hidden';
      } else {
        // Hold belongs to a different problem
        if (props.hoveredProblemId === problemId || hoveredProblemIdLocal.value === problemId) {
          return 'hover';
        } else {
          return props.showHoldOverlay ? 'selected' : 'default';
        }
      }
    }
  } else {
    // Hold is available for selection (unclassified)
    if (hoveredHoldIndex.value === hold.id) {
      return 'hover';
    } else {
      return props.showHoldOverlay ? 'default' : 'default';
    }
  }
};

// Get interaction allowed state for hold (from UnifiedHoldOverlay)
const getHoldInteractionAllowed = (hold) => {
  if (!hold) return 'none';
  
  // In delete mode, both AI and manual holds are selectable for deletion
  if (serverStore.isDeleteMode) {
    return 'selectable'; // All holds can be deleted
  }

  // In volume mode, all holds are selectable for volume marking
  if (serverStore.isVolumeMode) {
    return 'selectable';
  }

  // Magic Wand mode - only selected holds are clickable
  if (props.magicWandActive && props.magicWandSelection.selectedHoldIds.length > 0) {
    return props.magicWandSelection.selectedHoldIds.includes(hold.id) ? 'selectable' : 'none';
  }

  const problemId = getHoldProblemId(hold);

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

// Get color for hold based on its state (from UnifiedHoldOverlay)
const getHoldColor = (hold) => {
  if (!hold) return '#6b7280';
  
  // Magic Wand uses purple colors
  if (props.magicWandActive && props.magicWandSelection.selectedHoldIds.length > 0) {
    if (hold.id === props.magicWandSelection.targetHoldIndex) {
      return '#9333ea'; // purple-700 for target
    } else if (props.magicWandSelection.selectedHoldIds.includes(hold.id)) {
      return '#a855f7'; // purple-500 for proximity
    }
  }

  const problemId = getHoldProblemId(hold);

  if (problemId) {
    // Find the actual problem object
    const problem =
      props.boulderProblems.find((p) => p.id === problemId) ||
      (props.activeProblem?.id === problemId ? props.activeProblem : null) ||
      (props.editingProblem?.id === problemId ? props.editingProblem : null);

    if (problem) {
      return problem.color || '#6b7280'; // Use problem color or gray-500 fallback
    } else {
      return '#6b7280'; // gray-500 for assigned holds
    }
  } else {
    // Available holds use blue (unless it's a manual hold)
    return '#3b82f6'; // blue-500
  }
};

// Helper to calculate combined index for manual holds (DRY principle)
const getCombinedHoldIndex = (manualIndex) => aiHolds.value.length + manualIndex;

// Manual hold interaction methods - use hold object directly
const getManualHoldInteraction = (hold) =>
  getHoldInteraction(hold);

const getManualHoldInteractionAllowed = (hold) =>
  getHoldInteractionAllowed(hold);

const getManualHoldColor = (hold) => {
  const baseColor = getHoldColor(hold);
  // Use green for manual holds instead of default blue
  return baseColor === '#3b82f6' ? '#059669' : baseColor;
};

const handleHoldClick = (hold, index) => {
  // In delete mode, both AI and manual holds can be deleted
  if (serverStore.isDeleteMode) {
    // For AI holds, we need to remove them from the detection results
    // This will require updating the parent component or store
    emit('delete-hold', { hold, index, type: 'ai' });
    return;
  }

  emit('hold-click', hold, index);
};

const handleHoldHover = (hold, isEntering, event) => {
  hoveredHoldIndex.value = isEntering ? hold?.id : null;

  if (isEntering && hold) {
    // Find which problem this hold belongs to and highlight all holds in that problem
    const problemId = getHoldProblemId(hold);
    hoveredProblemIdLocal.value = problemId;
  } else {
    hoveredProblemIdLocal.value = null;
  }

  emit('hold-hover', hold, isEntering, event);
};

const handleManualHoldClick = (hold, manualIndex) => {
  if (serverStore.isDeleteMode) {
    // Emit delete event - parent view will handle the actual deletion
    emit('delete-hold', { hold, index: manualIndex, type: 'manual' });
    return;
  }

  // Note: index parameter kept for legacy magic wand functionality
  // TODO: Refactor magic wand to use hold IDs instead of indices
  const combinedIndex = getCombinedHoldIndex(manualIndex);
  emit('hold-click', hold, combinedIndex);
};

const handleManualHoldHover = (hold, manualIndex, isEntering, event) => {
  hoveredHoldIndex.value = isEntering ? hold.id : null;

  if (isEntering) {
    const problemId = getHoldProblemId(hold);
    hoveredProblemIdLocal.value = problemId;
  } else {
    hoveredProblemIdLocal.value = null;
  }

  emit('hold-hover', hold, isEntering, event);
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
  emit('tool-selection-change', tool);
};

// Canvas setup
function setupCanvas() {
  if (!isAnyDrawingMode.value || !drawingCanvas.value || !props.imageElement) {
    return;
  }

  const canvas = drawingCanvas.value;
  const img = props.imageElement;

  // Wait for next tick to ensure DOM is updated
  nextTick(() => {
    // Get the actual position and size of the image
    const imgRect = img.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();
    
    // Set canvas internal resolution to match image display size
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;

    // Position canvas to exactly overlay the image
    // Calculate offset from container to image
    const offsetLeft = imgRect.left - containerRect.left;
    const offsetTop = imgRect.top - containerRect.top;
    
    canvas.style.position = 'absolute';
    canvas.style.left = offsetLeft + 'px';
    canvas.style.top = offsetTop + 'px';
    canvas.style.width = imgRect.width + 'px';
    canvas.style.height = imgRect.height + 'px';

    console.log('📐 Canvas setup:', {
      canvasInternalSize: { width: canvas.width, height: canvas.height },
      canvasPosition: { left: offsetLeft, top: offsetTop },
      canvasDisplaySize: { width: imgRect.width, height: imgRect.height },
      imagePosition: { left: imgRect.left, top: imgRect.top },
      imageNaturalSize: { width: img.naturalWidth, height: img.naturalHeight },
      containerPosition: { left: containerRect.left, top: containerRect.top }
    });

    // Clear any existing drawing
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}

// Command key handlers for temporary quick-draw activation
const handleKeyDown = (event) => {
  // Only activate when creating/editing a boulder problem and Command/Ctrl is pressed
  if ((event.metaKey || event.ctrlKey) && isCreatingOrEditing.value && !isCommandKeyHeld.value) {
    isCommandKeyHeld.value = true;
    
    // Store current tool if not already in quick-draw mode
    if (props.boulderHoldSelectionTool !== 'quick-draw') {
      previousToolBeforeCommand.value = props.boulderHoldSelectionTool;
      emit('tool-selection-change', 'quick-draw');
    }
  }
};

const handleKeyUp = (event) => {
  // Restore previous tool when Command/Ctrl is released
  if ((!event.metaKey && !event.ctrlKey) && isCommandKeyHeld.value) {
    isCommandKeyHeld.value = false;
    
    // Restore previous tool if we stored one
    if (previousToolBeforeCommand.value) {
      emit('tool-selection-change', previousToolBeforeCommand.value);
      previousToolBeforeCommand.value = null;
    }
  }
};

onMounted(() => {
  nextTick(() => {
    setupCanvas();
  });
  
  // Add keyboard event listeners for Command key shortcut
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  // Clean up keyboard event listeners
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

// Watch for drawing mode changes
watch(
  [() => serverStore.isDrawingMode, () => isQuickDrawEnabled.value],
  ([newDrawingMode, newQuickDrawMode]) => {
    if (newDrawingMode || newQuickDrawMode) {
      nextTick(() => {
        setupCanvas();
      });
    }
  }
);

// Reset crop polygon when crop mode is turned off
watch(() => serverStore.isCropMode, (newVal) => {
  if (!newVal) {
    resetCropPolygon();
  }
});
</script>

<style scoped>
.cursor-crosshair {
  cursor: crosshair;
}
</style>
