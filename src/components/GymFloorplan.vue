<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <FloorplanToolbar
      :is-edit-mode="isEditMode"
      :draw-mode="drawMode"
      :edit-outline="editOutline"
      :has-selected-section="!!selectedSection"
      @toggle-edit-mode="toggleEditMode"
      @toggle-draw-mode="toggleDrawMode"
      @toggle-edit-outline="toggleEditOutline"
      @delete-section="deleteSection"
    />

    <!-- Viewer or Editor -->
    <FloorplanViewer
      v-if="!isEditMode"
      :sections="sections"
      :outline="outline"
      :active-section="selectedSectionId"
      @section-click="handleSectionClick"
    />

    <FloorplanEditor
      v-else
      :sections="sections"
      :outline="outline"
      :selected-section="selectedSectionId"
      :draw-mode="drawMode"
      :edit-outline="editOutline"
      @section-select="handleSectionSelect"
      @vertex-move="handleVertexMove"
      @drawing-finish="handleDrawingFinish"
      @add-outline-vertex="addOutlineVertex"
      @remove-outline-vertex="removeOutlineVertex"
      @add-section-vertex="addSectionVertex"
      @remove-section-vertex="removeSectionVertex"
    />

    <!-- Section properties panel -->
    <FloorplanPropertiesPanel
      v-if="selectedSection && isEditMode && drawMode === 'none'"
      :section="selectedSection"
      @update-field="updateSectionField"
    />

    <!-- Section detail (photo gallery) -->
    <FloorplanSectionDetail
      v-if="selectedSection && !isEditMode"
      :section="selectedSection"
      :images="images"
      @image-reorder="handleImageReorder"
    />

    <!-- Empty state -->
    <div v-if="!selectedSection && !isEditMode" class="flex flex-col items-center justify-center text-center py-12">
      <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
      <p class="text-gray-500 text-sm">
        Select a section on the floorplan to see wall photos
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FloorplanViewer from './floorplan/FloorplanViewer.vue';
import FloorplanEditor from './floorplan/FloorplanEditor.vue';
import FloorplanToolbar from './floorplan/FloorplanToolbar.vue';
import FloorplanPropertiesPanel from './floorplan/FloorplanPropertiesPanel.vue';
import FloorplanSectionDetail from './floorplan/FloorplanSectionDetail.vue';

defineProps({
  images: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['section-select', 'sections-change', 'outline-change']);

const GRID = 10;

// State
const isEditMode = ref(false);
const editOutline = ref(false);
const drawMode = ref('none');
const selectedSectionId = ref(null);

// Sample data (will be replaced with Firestore data)
const outline = ref([
  { x: 20, y: 20 },
  { x: 480, y: 20 },
  { x: 480, y: 300 },
  { x: 400, y: 380 },
  { x: 100, y: 380 },
  { x: 20, y: 320 }
]);

const sections = ref([
  {
    id: 'slab-zone',
    name: 'Slab Zone',
    type: 'slab',
    imageIndexes: [0, 1, 2],
    points: [
      { x: 40, y: 40 },
      { x: 230, y: 40 },
      { x: 230, y: 170 },
      { x: 40, y: 170 }
    ]
  },
  {
    id: 'overhang-wall',
    name: 'Overhang Wall',
    type: 'overhang',
    imageIndexes: [1, 3, 0],
    points: [
      { x: 250, y: 40 },
      { x: 460, y: 40 },
      { x: 460, y: 170 },
      { x: 250, y: 170 }
    ]
  }
]);

// Computed
const selectedSection = computed(() => {
  return sections.value.find(s => s.id === selectedSectionId.value);
});

// Actions
function snap(v) {
  return Math.round(v / GRID) * GRID;
}

function toggleEditMode() {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    drawMode.value = 'none';
    editOutline.value = false;
    selectedSectionId.value = null;
  }
}

function toggleDrawMode(mode) {
  if (drawMode.value === mode) {
    drawMode.value = 'none';
  } else {
    drawMode.value = mode;
    editOutline.value = false;
  }
}

function toggleEditOutline() {
  editOutline.value = !editOutline.value;
  if (editOutline.value) {
    drawMode.value = 'none';
  }
}

function handleSectionClick(sectionId) {
  selectedSectionId.value = selectedSectionId.value === sectionId ? null : sectionId;
  emit('section-select', selectedSectionId.value);
}

function handleSectionSelect(sectionId) {
  selectedSectionId.value = sectionId;
  emit('section-select', sectionId);
}

function handleVertexMove({ target, dx, dy, origPoints }) {
  if (target.kind === 'section-vertex') {
    const section = sections.value.find(s => s.id === target.sectionId);
    if (section) {
      section.points = origPoints.map((p, i) =>
        i === target.vertexIdx
          ? { x: snap(p.x + dx), y: snap(p.y + dy) }
          : { ...p }
      );
    }
  } else if (target.kind === 'section-move') {
    const section = sections.value.find(s => s.id === target.sectionId);
    if (section) {
      section.points = origPoints.map(p => ({
        x: snap(p.x + dx),
        y: snap(p.y + dy)
      }));
    }
  } else if (target.kind === 'outline-vertex') {
    outline.value = origPoints.map((p, i) =>
      i === target.vertexIdx
        ? { x: snap(p.x + dx), y: snap(p.y + dy) }
        : { ...p }
    );
  }
}

function handleDrawingFinish(mode, points) {
  if (mode === 'section' && points.length >= 3) {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      type: 'vertical',
      imageIndexes: [],
      points
    };
    sections.value.push(newSection);
    selectedSectionId.value = newSection.id;
    emit('sections-change', sections.value);
  } else if (mode === 'outline' && points.length >= 3) {
    outline.value = points;
    emit('outline-change', outline.value);
  }
  drawMode.value = 'none';
}

function deleteSection() {
  if (!selectedSection.value) return;
  sections.value = sections.value.filter(s => s.id !== selectedSectionId.value);
  selectedSectionId.value = null;
  emit('sections-change', sections.value);
}

function addOutlineVertex(afterIdx) {
  const a = outline.value[afterIdx];
  const b = outline.value[(afterIdx + 1) % outline.value.length];
  const mid = {
    x: snap((a.x + b.x) / 2),
    y: snap((a.y + b.y) / 2)
  };
  outline.value.splice(afterIdx + 1, 0, mid);
  emit('outline-change', outline.value);
}

function removeOutlineVertex(idx) {
  if (outline.value.length <= 3) return;
  outline.value = outline.value.filter((_, i) => i !== idx);
  emit('outline-change', outline.value);
}

function addSectionVertex(sectionId, afterIdx) {
  const section = sections.value.find(s => s.id === sectionId);
  if (!section) return;
  const a = section.points[afterIdx];
  const b = section.points[(afterIdx + 1) % section.points.length];
  const mid = {
    x: snap((a.x + b.x) / 2),
    y: snap((a.y + b.y) / 2)
  };
  section.points.splice(afterIdx + 1, 0, mid);
  emit('sections-change', sections.value);
}

function removeSectionVertex(sectionId, idx) {
  const section = sections.value.find(s => s.id === sectionId);
  if (!section || section.points.length <= 3) return;
  section.points = section.points.filter((_, i) => i !== idx);
  emit('sections-change', sections.value);
}

function updateSectionField(field, value) {
  if (selectedSection.value) {
    selectedSection.value[field] = value;
    emit('sections-change', sections.value);
  }
}

function handleImageReorder(sectionId, newIndexes) {
  const section = sections.value.find(s => s.id === sectionId);
  if (section) {
    section.imageIndexes = newIndexes;
    emit('sections-change', sections.value);
  }
}
</script>

