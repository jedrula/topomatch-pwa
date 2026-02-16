<template>
  <div class="space-y-4">
    <!-- SVG Canvas -->
    <div class="relative w-full">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
        :class="[
          'w-full h-auto border-2 rounded-lg',
          drawMode !== 'none' ? 'border-blue-500 cursor-crosshair' : 'border-gray-200'
        ]"
        style="max-height: 300px"
        @click="handleSvgClick"
        @dblclick="handleSvgDoubleClick"
      >
        <!-- Grid -->
        <defs>
          <pattern id="grid-editor" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.5" fill="currentColor" class="text-gray-400" opacity="0.15" />
          </pattern>
        </defs>
        <rect x="0" y="0" :width="viewBox.width" :height="viewBox.height" class="fill-white" />
        <rect x="0" y="0" :width="viewBox.width" :height="viewBox.height" fill="url(#grid-editor)" />

        <!-- Floorplan outline -->
        <polygon
          :points="pointsToString(offsetPoints(outline))"
          class="floorplan-outline"
          :class="{ 'editing': editOutline, 'cursor-pointer': !drawMode }"
          @click.stop="handleOutlineClick"
        />

        <!-- Outline vertices (when editing outline) -->
        <template v-if="editOutline">
          <g v-for="(point, i) in outline" :key="`ov-${i}`">
            <circle
              :cx="point.x + offset.x"
              :cy="point.y + offset.y"
              :r="HANDLE_RADIUS + 2"
              class="fill-blue-600 cursor-grab"
              @mousedown="handleVertexDown($event, 'outline-vertex', null, i)"
              @dblclick.stop="$emit('remove-outline-vertex', i)"
            />
            <!-- Midpoint handle -->
            <circle
              v-if="outline.length < 20"
              :cx="midpoint(point, outline[(i + 1) % outline.length]).x + offset.x"
              :cy="midpoint(point, outline[(i + 1) % outline.length]).y + offset.y"
              r="5"
              class="fill-blue-400 opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
              @click.stop="$emit('add-outline-vertex', i)"
            />
          </g>
        </template>

        <!-- Sections -->
        <g v-for="section in sections" :key="section.id">
          <polygon
            :points="pointsToString(offsetPoints(section.points))"
            :class="[
              'floorplan-section transition-all duration-200',
              { 'active': selectedSection === section.id }
            ]"
            @click.stop="handleSectionClick(section.id)"
          />
          
          <!-- Section label -->
          <text
            :x="centroid(offsetPoints(section.points)).x"
            :y="centroid(offsetPoints(section.points)).y - 14"
            text-anchor="middle"
            font-size="18"
            :class="[
              'transition-colors duration-200 pointer-events-none',
              selectedSection === section.id ? 'fill-blue-600' : 'fill-gray-500'
            ]"
          >
            {{ typeIcons[section.type] || '▮' }}
          </text>
          <text
            :x="centroid(offsetPoints(section.points)).x"
            :y="centroid(offsetPoints(section.points)).y + 6"
            text-anchor="middle"
            font-size="12"
            font-weight="600"
            :class="[
              'transition-colors duration-200 pointer-events-none',
              selectedSection === section.id ? 'fill-gray-900' : 'fill-gray-700'
            ]"
          >
            {{ section.name }}
          </text>
          <text
            :x="centroid(offsetPoints(section.points)).x"
            :y="centroid(offsetPoints(section.points)).y + 22"
            text-anchor="middle"
            font-size="10"
            class="fill-gray-500 pointer-events-none"
          >
            {{ section.imageIds?.length || 0 }} photos
          </text>

          <!-- Section vertices (show when selected) -->
          <template v-if="drawMode === 'none' && selectedSection === section.id">
            <g v-for="(point, i) in section.points" :key="`sv-${section.id}-${i}`">
              <circle
                :cx="point.x + offset.x"
                :cy="point.y + offset.y"
                :r="HANDLE_RADIUS + 2"
                class="cursor-grab transition-all fill-blue-600"
                @mousedown="handleVertexDown($event, 'section-vertex', section.id, i)"
                @dblclick.stop="$emit('remove-section-vertex', section.id, i)"
              />
              <!-- Midpoint handle -->
              <circle
                v-if="section.points.length < 20"
                :cx="midpoint(point, section.points[(i + 1) % section.points.length]).x + offset.x"
                :cy="midpoint(point, section.points[(i + 1) % section.points.length]).y + offset.y"
                r="5"
                class="fill-blue-400 opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
                @click.stop="$emit('add-section-vertex', section.id, i)"
              />
            </g>
            
            <!-- Section drag handle (move entire section) -->
            <circle
              v-if="selectedSection === section.id"
              :cx="centroid(offsetPoints(section.points)).x"
              :cy="centroid(offsetPoints(section.points)).y"
              r="10"
              class="fill-blue-600 opacity-30 cursor-move hover:opacity-50 transition-opacity"
              @mousedown="handleVertexDown($event, 'section-move', section.id, -1)"
            />
          </template>
        </g>

        <!-- Drawing preview -->
        <g v-if="drawingPoints.length > 0">
          <polyline
            :points="pointsToString(offsetPoints(drawingPoints))"
            fill="none"
            stroke="rgb(37, 99, 235)"
            stroke-width="2"
            stroke-dasharray="5,5"
          />
          <circle
            v-for="(point, i) in drawingPoints"
            :key="`draw-${i}`"
            :cx="point.x + offset.x"
            :cy="point.y + offset.y"
            r="4"
            class="fill-blue-600"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  sections: {
    type: Array,
    required: true
  },
  outline: {
    type: Array,
    required: true
  },
  selectedSection: {
    type: String,
    default: null
  },
  drawMode: {
    type: String,
    default: 'none'
  },
  editOutline: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'section-select',
  'outline-select',
  'vertex-move',
  'drawing-finish',
  'add-outline-vertex',
  'remove-outline-vertex',
  'add-section-vertex',
  'remove-section-vertex'
]);

const GRID = 10;
const HANDLE_RADIUS = 6;

const typeIcons = {
  slab: '◣',
  overhang: '◤',
  cave: '◠',
  vertical: '▮'
};

const svgRef = ref(null);
const drawingPoints = ref([]);
const editTarget = ref(null);
const dragStart = ref({ x: 0, y: 0 });
const origPoints = ref([]);
const wasDragging = ref(false);

function snap(v) {
  return Math.round(v / GRID) * GRID;
}

function getBBox(points) {
  if (!points || points.length === 0) {
    // Default viewBox when no outline exists (larger = more zoomed out)
    return {
      minX: 0,
      minY: 0,
      maxX: 2000,
      maxY: 1500
    };
  }
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function pointsToString(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function centroid(points) {
  const n = points.length;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n
  };
}

function midpoint(a, b) {
  return {
    x: snap((a.x + b.x) / 2),
    y: snap((a.y + b.y) / 2)
  };
}

const viewBox = computed(() => {
  const bbox = getBBox(props.outline);
  const pad = 40;
  return {
    width: bbox.maxX - bbox.minX + pad * 2,
    height: bbox.maxY - bbox.minY + pad * 2
  };
});

const offset = computed(() => {
  const bbox = getBBox(props.outline);
  const pad = 40;
  return {
    x: -bbox.minX + pad,
    y: -bbox.minY + pad
  };
});

function offsetPoints(points) {
  return points.map(p => ({ x: p.x + offset.value.x, y: p.y + offset.value.y }));
}

function getSVGPoint(e) {
  const svg = svgRef.value;
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x - offset.value.x, y: svgPt.y - offset.value.y };
}

function handleSectionClick(sectionId) {
  if (props.drawMode !== 'none') return;
  emit('section-select', sectionId);
}

function handleOutlineClick() {
  if (props.drawMode !== 'none') return;
  if (props.outline.length === 0) return;
  emit('outline-select');
}

function handleSvgClick(e) {
  // Ignore click if we just finished dragging
  if (wasDragging.value) {
    wasDragging.value = false;
    return;
  }
  
  if (props.drawMode === 'none') {
    emit('section-select', null);
    return;
  }
  const pt = getSVGPoint(e);
  const snapped = { x: snap(pt.x), y: snap(pt.y) };
  drawingPoints.value.push(snapped);
  emit('drawing-point-add', snapped);
}

function handleSvgDoubleClick(e) {
  e.preventDefault();
  if (props.drawMode === 'none' || drawingPoints.value.length < 3) return;

  const pts = drawingPoints.value.slice(0, -1);
  emit('drawing-finish', props.drawMode, pts);
  drawingPoints.value = [];
}

function handleVertexDown(e, kind, sectionId, vertexIdx) {
  e.stopPropagation();
  e.preventDefault();
  if (props.drawMode !== 'none') return;

  const pt = getSVGPoint(e);
  editTarget.value = { kind, sectionId, vertexIdx };
  dragStart.value = pt;

  if (kind === 'section-vertex' || kind === 'section-move') {
    const section = props.sections.find(s => s.id === sectionId);
    if (section) {
      origPoints.value = section.points.map(p => ({ ...p }));
      emit('section-select', sectionId);
    }
  } else if (kind === 'outline-vertex') {
    origPoints.value = props.outline.map(p => ({ ...p }));
    emit('outline-select');
  }
}

function handleMouseMove(e) {
  if (!editTarget.value) return;

  wasDragging.value = true;
  const pt = getSVGPoint(e);
  const dx = pt.x - dragStart.value.x;
  const dy = pt.y - dragStart.value.y;

  emit('vertex-move', {
    target: editTarget.value,
    dx,
    dy,
    origPoints: origPoints.value
  });
}

function handleMouseUp() {
  editTarget.value = null;
  // wasDragging will be checked and cleared by the next click event
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.floorplan-outline {
  fill: hsl(var(--floorplan-bg));
  stroke: hsl(var(--floorplan-border));
  stroke-width: 1.5;
}

.floorplan-outline.editing {
  stroke: rgb(37, 99, 235);
  stroke-width: 2;
}

.floorplan-section {
  fill: hsl(var(--floorplan-section));
  stroke: hsl(var(--floorplan-border));
  stroke-width: 1.5;
}

.floorplan-section.active {
  fill: hsl(var(--floorplan-section-active));
  stroke: rgb(37, 99, 235);
  stroke-width: 2.5;
}
</style>
