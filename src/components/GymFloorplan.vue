<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <FloorplanToolbar
      :is-edit-mode="props.isEditMode"
      :draw-mode="drawMode"
      :edit-outline="editOutline"
      :has-selected-section="!!selectedSection"
      @toggle-edit-mode="toggleEditMode"
      @toggle-draw-mode="toggleDrawMode"
      @delete-section="deleteSection"
      @delete-outline="deleteOutline"
    />

    <!-- Viewer or Editor -->
    <div v-if="!props.isEditMode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="overflow-hidden" style="max-height: 400px">
        <FloorplanViewer
          :sections="sections"
          :outline="outline"
          :active-section="selectedSectionId"
          @section-click="handleSectionClick"
        />
      </div>
      
      <!-- Right panel: Section detail or empty state -->
      <div class="overflow-hidden flex flex-col" style="max-height: 400px">
        <!-- Section detail (photo gallery) when section is selected -->
        <FloorplanSectionDetail
          v-if="selectedSection"
          :section="selectedSection"
          :images="images"
          :all-sections="sections"
          @image-reorder="handleImageReorder"
          @analyze-holds="(image) => $emit('analyze-holds', image)"
          @delete-image="(image) => $emit('delete-image', image)"
          @move-to-section="(image, sectionId) => $emit('move-to-section', image, sectionId)"
          @add-photos-to-section="$emit('add-photos-to-section')"
        />
        
        <!-- Empty state when no section is selected -->
        <div v-else class="flex flex-col items-center justify-center text-center py-8 md:py-0 md:min-h-[300px]">
          <!-- Loading state -->
          <template v-if="loading">
            <div class="animate-pulse">
              <div class="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div class="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </template>
          <!-- Show message based on whether location has any photos -->
          <template v-else-if="hasAnyPhotos">
            <svg class="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p class="text-gray-500 text-xs">
              Select a section on the floorplan to see wall photos
            </p>
          </template>
          <template v-else>
            <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No photos yet</h3>
            <p class="text-[13px] text-gray-500" :class="canUpload ? 'mb-6' : 'mb-0'">
              Share photos of boulder problems, climbing routes, or the area to help other climbers visualize this location.
            </p>
            <button
              v-if="canUpload"
              @click="$emit('upload-photos')"
              class="btn inline-flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload Photos
            </button>
          </template>
        </div>
      </div>
    </div>

    <FloorplanEditor
      v-if="props.isEditMode"
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
      v-if="selectedSection && props.isEditMode && drawMode === 'none'"
      :section="selectedSection"
      @update-field="updateSectionField"
    />

    <!-- Hint when editing and no outline -->
    <p v-if="props.isEditMode && outline.length === 0 && drawMode === 'none'" class="text-xs text-gray-500">
      💡 Start by clicking points on the canvas to draw the gym outline. Double-click to finish (min 3 points). Or click "Add Section" to draw sections directly.
    </p>
    <p v-else-if="props.isEditMode && drawMode === 'outline'" class="text-xs text-gray-500">
      Click to place vertices. Double-click to close the shape (min 3 points). This will replace the current outline.
    </p>
    <p v-else-if="props.isEditMode && drawMode === 'section'" class="text-xs text-gray-500">
      Click to place vertices. Double-click to close the shape (min 3 points).
    </p>
    <p v-else-if="props.isEditMode && editOutline" class="text-xs text-gray-500">
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
  hasAnyPhotos: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  canUpload: {
    type: Boolean,
    default: false
  },
  images: {
    type: Array,
    default: () => []
  },
  floorplan: {
    type: Object,
    default: () => ({ outline: [], sections: [] })
  },
  isEditMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['section-select', 'sections-change', 'outline-change', 'update:isEditMode', 'analyze-holds', 'delete-image', 'move-to-section', 'upload-photos', 'add-photos-to-section']);

const GRID = 10;

// State
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
  const newValue = !props.isEditMode;
  emit('update:isEditMode', newValue);
  
  if (!newValue) {
    // Exiting edit mode - clean up
    drawMode.value = 'none';
    editOutline.value = false;
    selectedSectionId.value = null;
  } else {
    // Entering edit mode - auto-start outline drawing if no outline exists
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

