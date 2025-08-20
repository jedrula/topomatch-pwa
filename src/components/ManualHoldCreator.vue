<template>
  <div class="manual-hold-creator">
    <!-- Drawing Tools -->
    <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 class="text-sm font-medium text-blue-800 mb-3">Manual Hold Creation</h4>

      <!-- Tool Selection -->
      <div class="flex space-x-2 mb-3">
        <button
          @click="setDrawingMode('circle')"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
            drawingMode === 'circle'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span>Circle</span>
        </button>

        <button
          @click="setDrawingMode('polygon')"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
            drawingMode === 'polygon'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polygon points="12,2 22,20 2,20"></polygon>
          </svg>
          <span>Polygon</span>
        </button>

        <button
          @click="setDrawingMode('rectangle')"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
            drawingMode === 'rectangle'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18"></rect>
          </svg>
          <span>Rectangle</span>
        </button>
      </div>

      <!-- Instructions -->
      <div class="text-xs text-blue-700">
        <div v-if="drawingMode === 'circle'">Click and drag to draw a circle around a hold</div>
        <div v-else-if="drawingMode === 'rectangle'">
          Click and drag to draw a rectangle around a hold
        </div>
        <div v-else-if="drawingMode === 'polygon'">
          Click to add points, double-click to finish the polygon
        </div>
      </div>

      <!-- Active Drawing Status -->
      <div
        v-if="isDrawing"
        class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs"
      >
        <div v-if="drawingMode === 'polygon'">
          Drawing polygon... Click to add points, double-click to finish
        </div>
        <div v-else>Drawing {{ drawingMode }}... Drag to complete</div>
      </div>
    </div>

    <!-- Canvas for Drawing -->
    <div class="relative inline-block">
      <img
        ref="imageElement"
        :src="imageUrl"
        :alt="imageAlt"
        class="max-w-full h-auto"
        @load="onImageLoad"
      />

      <!-- Drawing Canvas Overlay -->
      <canvas
        ref="drawingCanvas"
        class="absolute top-0 left-0 cursor-crosshair"
        :class="{ 'pointer-events-none': !drawingMode }"
        @mousedown="startDrawing"
        @mousemove="continueDraw"
        @mouseup="finishDrawing"
        @dblclick="finishPolygon"
      ></canvas>

      <!-- Preview of drawn holds -->
      <svg
        v-if="manualHolds.length > 0"
        class="absolute top-0 left-0 pointer-events-none"
        :width="canvasWidth"
        :height="canvasHeight"
      >
        <g v-for="(hold, index) in manualHolds" :key="`manual-hold-${index}`" class="manual-hold">
          <!-- Render different shapes based on type -->
          <circle
            v-if="hold.type === 'circle'"
            :cx="hold.cx"
            :cy="hold.cy"
            :r="hold.r"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="#22c55e"
            stroke-width="2"
          />
          <rect
            v-else-if="hold.type === 'rectangle'"
            :x="hold.x"
            :y="hold.y"
            :width="hold.width"
            :height="hold.height"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="#22c55e"
            stroke-width="2"
          />
          <polygon
            v-else-if="hold.type === 'polygon'"
            :points="hold.points"
            fill="rgba(34, 197, 94, 0.3)"
            stroke="#22c55e"
            stroke-width="2"
          />

          <!-- Hold label -->
          <text
            :x="hold.centerX"
            :y="hold.centerY"
            text-anchor="middle"
            fill="#16a34a"
            font-size="12"
            font-weight="bold"
          >
            H{{ index + 1 }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Manual Holds List -->
    <div v-if="manualHolds.length > 0" class="mt-4">
      <h5 class="text-sm font-medium text-gray-700 mb-2">
        Manual Holds Created ({{ manualHolds.length }})
      </h5>
      <div class="space-y-1">
        <div
          v-for="(hold, index) in manualHolds"
          :key="`hold-item-${index}`"
          class="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm"
        >
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Hold {{ index + 1 }} ({{ hold.type }})</span>
          </div>
          <button
            @click="removeManualHold(index)"
            class="text-red-500 hover:text-red-700 p-1"
            title="Remove hold"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

defineProps({
  imageUrl: {
    type: String,
    required: true,
  },
  imageAlt: {
    type: String,
    default: 'Climbing image',
  },
});

const emit = defineEmits(['holds-created', 'hold-added']);

// Refs
const imageElement = ref(null);
const drawingCanvas = ref(null);

// Drawing state
const drawingMode = ref('circle'); // 'circle', 'rectangle', 'polygon'
const isDrawing = ref(false);
const currentShape = ref(null);
const polygonPoints = ref([]);

// Canvas dimensions
const canvasWidth = ref(0);
const canvasHeight = ref(0);

// Manual holds array
const manualHolds = ref([]);

// Drawing methods
const setDrawingMode = (mode) => {
  drawingMode.value = mode;
  isDrawing.value = false;
  currentShape.value = null;
  polygonPoints.value = [];
  clearCanvas();
};

const onImageLoad = async () => {
  await nextTick();
  if (!imageElement.value || !drawingCanvas.value) return;

  canvasWidth.value = imageElement.value.offsetWidth;
  canvasHeight.value = imageElement.value.offsetHeight;

  drawingCanvas.value.width = canvasWidth.value;
  drawingCanvas.value.height = canvasHeight.value;

  console.log('Canvas initialized:', { width: canvasWidth.value, height: canvasHeight.value });
};

const getMousePos = (event) => {
  const rect = drawingCanvas.value.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const startDrawing = (event) => {
  if (!drawingMode.value) return;

  const pos = getMousePos(event);
  isDrawing.value = true;

  if (drawingMode.value === 'polygon') {
    // Add point to polygon
    polygonPoints.value.push(pos);
    drawPolygonPreview();
  } else {
    // Start circle or rectangle
    currentShape.value = {
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    };
  }
};

const continueDraw = (event) => {
  if (!isDrawing.value || !currentShape.value) return;

  const pos = getMousePos(event);
  currentShape.value.currentX = pos.x;
  currentShape.value.currentY = pos.y;

  drawShapePreview();
};

const finishDrawing = () => {
  if (!isDrawing.value) return;

  if (drawingMode.value === 'polygon') {
    // Polygon continues until double-click
    return;
  }

  if (currentShape.value) {
    const shape = createHoldFromShape();
    if (shape) {
      manualHolds.value.push(shape);
      emit('hold-added', shape);
      emit('holds-created', manualHolds.value);
    }
  }

  isDrawing.value = false;
  currentShape.value = null;
  clearCanvas();
};

const finishPolygon = () => {
  if (drawingMode.value !== 'polygon' || polygonPoints.value.length < 3) return;

  const shape = createPolygonHold();
  if (shape) {
    manualHolds.value.push(shape);
    emit('hold-added', shape);
    emit('holds-created', manualHolds.value);
  }

  isDrawing.value = false;
  polygonPoints.value = [];
  clearCanvas();
};

const createHoldFromShape = () => {
  if (!currentShape.value) return null;

  const { startX, startY, currentX, currentY } = currentShape.value;

  if (drawingMode.value === 'circle') {
    const centerX = (startX + currentX) / 2;
    const centerY = (startY + currentY) / 2;
    const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;

    if (radius < 5) return null; // Too small

    return {
      type: 'circle',
      cx: centerX,
      cy: centerY,
      r: radius,
      centerX,
      centerY,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      detectionSource: 'user_drawn',
      svgMarkup: `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2"/>`,
      coordinates: {
        x: centerX - radius,
        y: centerY - radius,
        width: radius * 2,
        height: radius * 2,
      },
    };
  } else if (drawingMode.value === 'rectangle') {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    if (width < 5 || height < 5) return null; // Too small

    return {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      detectionSource: 'user_drawn',
      svgMarkup: `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2"/>`,
      coordinates: { x, y, width, height },
    };
  }

  return null;
};

const createPolygonHold = () => {
  if (polygonPoints.value.length < 3) return null;

  const points = polygonPoints.value.map((p) => `${p.x},${p.y}`).join(' ');

  // Calculate center and bounding box
  const xs = polygonPoints.value.map((p) => p.x);
  const ys = polygonPoints.value.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    type: 'polygon',
    points,
    centerX,
    centerY,
    id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    detectionSource: 'user_drawn',
    svgMarkup: `<polygon points="${points}" fill="rgba(34, 197, 94, 0.3)" stroke="#22c55e" stroke-width="2"/>`,
    coordinates: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
};

const drawShapePreview = () => {
  if (!drawingCanvas.value || !currentShape.value) return;

  const ctx = drawingCanvas.value.getContext('2d');
  clearCanvas();

  const { startX, startY, currentX, currentY } = currentShape.value;

  ctx.strokeStyle = '#22c55e';
  ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 2;

  if (drawingMode.value === 'circle') {
    const centerX = (startX + currentX) / 2;
    const centerY = (startY + currentY) / 2;
    const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  } else if (drawingMode.value === 'rectangle') {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  }
};

const drawPolygonPreview = () => {
  if (!drawingCanvas.value || polygonPoints.value.length === 0) return;

  const ctx = drawingCanvas.value.getContext('2d');
  clearCanvas();

  ctx.strokeStyle = '#22c55e';
  ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 2;

  if (polygonPoints.value.length > 0) {
    ctx.beginPath();
    ctx.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y);

    for (let i = 1; i < polygonPoints.value.length; i++) {
      ctx.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y);
    }

    if (polygonPoints.value.length > 2) {
      ctx.closePath();
      ctx.fill();
    }
    ctx.stroke();

    // Draw points
    polygonPoints.value.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#16a34a';
      ctx.fill();
    });
  }
};

const clearCanvas = () => {
  if (!drawingCanvas.value) return;
  const ctx = drawingCanvas.value.getContext('2d');
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value);
};

const removeManualHold = (index) => {
  manualHolds.value.splice(index, 1);
  emit('holds-created', manualHolds.value);
};

// Expose methods
defineExpose({
  clearAllHolds: () => {
    manualHolds.value = [];
    clearCanvas();
    emit('holds-created', []);
  },
  getHolds: () => manualHolds.value,
});

onMounted(() => {
  if (imageElement.value) {
    onImageLoad();
  }
});
</script>

<style scoped>
.manual-hold-creator .cursor-crosshair {
  cursor: crosshair;
}
</style>
