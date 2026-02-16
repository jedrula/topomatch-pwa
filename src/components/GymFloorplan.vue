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
      @delete-section="deleteSection"
      @delete-outline="deleteOutline"
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
      @outline-select="handleOutlineSelect"
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

    <!-- Hint when editing and no outline -->
    <p v-if="isEditMode && outline.length === 0 && drawMode === 'none'" class="text-xs text-gray-500">
      💡 Start by clicking points on the canvas to draw the gym outline. Double-click to finish (min 3 points). Or click "Add Section" to draw sections directly.
    </p>
    <p v-else-if="isEditMode && drawMode === 'outline'" class="text-xs text-gray-500">
      Click to place vertices. Double-click to close the shape (min 3 points). This will replace the current outline.
    </p>
    <p v-else-if="isEditMode && drawMode === 'section'" class="text-xs text-gray-500">
      Click to place vertices. Double-click to close the shape (min 3 points).
    </p>
    <p v-else-if="isEditMode && editOutline" class="text-xs text-gray-500">
      Drag vertices to reshape. Click midpoints to add vertices. Double-click a vertex to remove it.
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import FloorplanViewer from './floorplan/FloorplanViewer.vue';
import FloorplanEditor from './floorplan/FloorplanEditor.vue';
import FloorplanToolbar from './floorplan/FloorplanToolbar.vue';
import FloorplanPropertiesPanel from './floorplan/FloorplanPropertiesPanel.vue';
import FloorplanSectionDetail from './floorplan/FloorplanSectionDetail.vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  floorplan: {
    type: Object,
    default: () => ({ outline: [], sections: [] })
  }
});

const emit = defineEmits(['section-select', 'sections-change', 'outline-change']);

const GRID = 10;

// State
const isEditMode = ref(false);
const editOutline = ref(false);
const drawMode = ref('none');
const selectedSectionId = ref(null);

// Use computed properties directly from props - no watchers needed
const outline = computed(() => props.floorplan?.outline || []);
const sections = computed(() => props.floorplan?.sections || []);

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
  } else {
    // Auto-start outline drawing if no outline exists
    if (outline.value.length === 0) {
      drawMode.value = 'outline';
    }
  }
}

function toggleDrawMode(mode) {
  if (drawMode.value === mode) {
    drawMode.value = 'none';
  } else {
    drawMode.value = mode;
    editOutline.value = false;
    selectedSectionId.value = null;
  }
}

function handleOutlineSelect() {
  // Select outline for editing
  editOutline.value = true;
  selectedSectionId.value = null;
  drawMode.value = 'none';
  console.log('Outline selected for editing');
}

function handleSectionClick(sectionId) {
  selectedSectionId.value = selectedSectionId.value === sectionId ? null : sectionId;
  emit('section-select', selectedSectionId.value);
}

function handleSectionSelect(sectionId) {
  selectedSectionId.value = sectionId;
  editOutline.value = false; // Deselect outline when selecting section
  emit('section-select', sectionId);
}

function handleVertexMove({ target, dx, dy, origPoints }) {
  if (target.kind === 'section-vertex') {
    const updatedSections = sections.value.map(s => {
      if (s.id !== target.sectionId) return s;
      return {
        ...s,
        points: origPoints.map((p, i) =>
          i === target.vertexIdx
            ? { x: snap(p.x + dx), y: snap(p.y + dy) }
            : { ...p }
        )
      };
    });
    selectedSectionId.value = target.sectionId;
    emit('sections-change', updatedSections);
  } else if (target.kind === 'section-move') {
    const updatedSections = sections.value.map(s => {
      if (s.id !== target.sectionId) return s;
      return {
        ...s,
        points: origPoints.map(p => ({
          x: snap(p.x + dx),
          y: snap(p.y + dy)
        }))
      };
    });
    selectedSectionId.value = target.sectionId;
    emit('sections-change', updatedSections);
  } else if (target.kind === 'outline-vertex') {
    const updatedOutline = origPoints.map((p, i) =>
      i === target.vertexIdx
        ? { x: snap(p.x + dx), y: snap(p.y + dy) }
        : { ...p }
    );
    editOutline.value = true;
    emit('outline-change', updatedOutline);
  }
}

function handleDrawingFinish(mode, points) {
  if (mode === 'section' && points.length >= 3) {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      type: 'vertical',
      imageIds: [],
      points
    };
    selectedSectionId.value = newSection.id;
    emit('sections-change', [...sections.value, newSection]);
  } else if (mode === 'outline' && points.length >= 3) {
    emit('outline-change', points);
  }
  drawMode.value = 'none';
}

function deleteSection() {
  if (!selectedSection.value) return;
  const updatedSections = sections.value.filter(s => s.id !== selectedSectionId.value);
  selectedSectionId.value = null;
  emit('sections-change', updatedSections);
}

function deleteOutline() {
  editOutline.value = false;
  drawMode.value = 'outline';
  emit('outline-change', []);
  console.log('Outline deleted, starting redraw');
}

function addOutlineVertex(afterIdx) {
  const a = outline.value[afterIdx];
  const b = outline.value[(afterIdx + 1) % outline.value.length];
  const mid = {
    x: snap((a.x + b.x) / 2),
    y: snap((a.y + b.y) / 2)
  };
  const updatedOutline = [...outline.value];
  updatedOutline.splice(afterIdx + 1, 0, mid);
  emit('outline-change', updatedOutline);
}

function removeOutlineVertex(idx) {
  if (outline.value.length <= 3) return;
  const updatedOutline = outline.value.filter((_, i) => i !== idx);
  emit('outline-change', updatedOutline);
}

function addSectionVertex(sectionId, afterIdx) {
  const updatedSections = sections.value.map(s => {
    if (s.id !== sectionId) return s;
    const a = s.points[afterIdx];
    const b = s.points[(afterIdx + 1) % s.points.length];
    const mid = {
      x: snap((a.x + b.x) / 2),
      y: snap((a.y + b.y) / 2)
    };
    const newPoints = [...s.points];
    newPoints.splice(afterIdx + 1, 0, mid);
    return { ...s, points: newPoints };
  });
  emit('sections-change', updatedSections);
}

function removeSectionVertex(sectionId, idx) {
  const updatedSections = sections.value.map(s => {
    if (s.id !== sectionId) return s;
    if (s.points.length <= 3) return s;
    return { ...s, points: s.points.filter((_, i) => i !== idx) };
  });
  emit('sections-change', updatedSections);
}

function updateSectionField(field, value) {
  if (!selectedSection.value) return;
  const updatedSections = sections.value.map(s =>
    s.id === selectedSection.value.id ? { ...s, [field]: value } : s
  );
  emit('sections-change', updatedSections);
}

function handleImageReorder(sectionId, newIds) {
  const updatedSections = sections.value.map(s =>
    s.id === sectionId ? { ...s, imageIds: newIds } : s
  );
  emit('sections-change', updatedSections);
}
</script>

