<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Boulder Problems</h3>

      <!-- Error Message -->
      <div
        v-if="boulderProblemsStore.error"
        class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm text-red-700">{{ boulderProblemsStore.error }}</p>
          <button
            @click="boulderProblemsStore.clearError()"
            class="text-red-400 hover:text-red-600"
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

      <!-- Loading State -->
      <div v-if="boulderProblemsStore.isLoading" class="mb-4 text-center py-4">
        <div
          class="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"
        ></div>
        <p class="text-sm text-gray-600">Loading boulder problems...</p>
      </div>

      <!-- Create New Problem -->
      <div v-if="!boulderProblemsStore.isCreatingProblem" class="mb-6">
        <button
          @click="startCreatingProblem"
          :disabled="!hasAnyHolds || boulderProblemsStore.isLoading"
          class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Create New Problem</span>
        </button>
        <p class="text-sm text-gray-500 mt-2 text-center">
          <span v-if="hasAnyHolds">
            {{ totalHoldCount }} holds available ({{
              props.hasDetectionResults ? serverStore.holdCount : 0
            }}
            AI + {{ serverStore.manualHolds.length }} manual)
          </span>
          <span v-else> No holds detected. Use AI detection or draw holds manually first. </span>
        </p>
      </div>

      <!-- Problem Creation/Edit Form -->
      <div
        v-if="
          (boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem) ||
          editingProblem
        "
        class="mb-6 p-4 rounded-lg"
        :class="
          editingProblem
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-green-50 border border-green-200'
        "
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-semibold" :class="editingProblem ? 'text-blue-800' : 'text-green-800'">
            {{
              editingProblem
                ? `Editing Problem #${editingProblem.id}`
                : `Creating Problem #${boulderProblemsStore.activeProblem.id}`
            }}
          </h4>
          <div
            class="w-4 h-4 rounded-full border-2"
            :class="editingProblem ? 'border-blue-600' : 'border-green-600'"
            :style="{
              backgroundColor: editingProblem
                ? editingProblem.color
                : boulderProblemsStore.activeProblemColor,
            }"
          ></div>
        </div>

        <!-- Problem Name Input -->
        <div class="mb-4">
          <label for="problem-name" class="block text-sm font-medium text-gray-700 mb-1">
            Problem Name
          </label>
          <input
            id="problem-name"
            type="text"
            v-model="problemName"
            placeholder="Enter problem name (optional)"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Grade Selection -->
        <div class="mb-4">
          <label for="problem-grade" class="block text-sm font-medium text-gray-700 mb-1">
            Grade
          </label>
          <select
            id="problem-grade"
            v-model="selectedGrade"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option v-for="grade in boulderProblemsStore.grades" :key="grade" :value="grade">
              {{ grade }}
            </option>
          </select>
        </div>

        <!-- Holds Count -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Holds added:</span>
            <span class="font-medium" :class="editingProblem ? 'text-blue-700' : 'text-green-700'">
              {{
                editingProblem
                  ? editingProblem.holds.length
                  : boulderProblemsStore.activeProblem.holds.length
              }}
            </span>
          </div>
          <!-- Show unsaved changes indicator for editing -->
          <div
            v-if="editingProblem && boulderProblemsStore.hasUnsavedChanges(editingProblem.id)"
            class="mt-2"
          >
            <div class="flex items-center text-sm text-orange-600">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span>Unsaved changes</span>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-800">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {{
              editingProblem
                ? "Use the tool picker below to select holds for this problem."
                : "Use the tool picker below to add holds to this problem."
            }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            @click="editingProblem ? saveEdit() : finishProblem()"
            :disabled="
              editingProblem
                ? boulderProblemsStore.isSaving
                : boulderProblemsStore.activeProblem.holds.length === 0
            "
            class="flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            :class="
              editingProblem
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
            "
          >
            <div
              v-if="editingProblem && boulderProblemsStore.isSaving"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="editingProblem"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{{ editingProblem ? "Save Changes" : "Finish Problem" }}</span>
          </button>
          <button
            @click="editingProblem ? cancelEdit() : cancelProblem()"
            :disabled="boulderProblemsStore.isSaving"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Existing Problems List -->
      <div v-if="boulderProblemsStore.sortedProblems.length > 0" class="space-y-3">
        <h4 class="font-medium text-gray-900">Created Problems</h4>

        <!-- Grade Filter Section -->
        <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-sm font-medium text-gray-700">Filter by Grade</h5>
            <button
              v-if="hasActiveGradeFilter"
              @click="clearGradeFilter"
              class="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear Filter
            </button>
          </div>

          <div class="space-y-3">
            <!-- Grade Range Display -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Range:</span>
              <span class="font-medium text-gray-900"
                >{{ selectedMinGrade }} - {{ selectedMaxGrade }}</span
              >
            </div>

            <!-- Single Range Slider -->
            <div>
              <label class="block text-xs text-gray-600 mb-2">Grade Range</label>
              <Slider
                v-model="gradeRange"
                :min="0"
                :max="boulderProblemsStore.grades.length - 1"
                :format="(value) => boulderProblemsStore.grades[value]"
                :tooltips="false"
                :lazy="true"
                :step="1"
                @update="handleSliderUpdate"
                @change="handleSliderChange"
                class="grade-range-slider"
              />
            </div>

            <!-- Filtered Results Summary -->
            <div class="pt-2 border-t border-gray-300">
              <div class="flex items-center justify-between text-xs text-gray-600">
                <span>Showing:</span>
                <span class="font-medium">
                  {{ filteredProblems.length }} of
                  {{ boulderProblemsStore.sortedProblems.length }} problems
                </span>
              </div>
              <div v-if="hasActiveGradeFilter" class="mt-1 text-xs text-blue-600">
                Only holds from filtered problems are visible on the image
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <BoulderProblemCard
            v-for="problem in filteredProblems"
            :key="problem.id"
            :problem="problem"
            :is-active="
              boulderProblemsStore.activeProblem?.id === problem.id &&
              !boulderProblemsStore.isCreatingProblem &&
              !editingProblem
            "
            :is-disabled="boulderProblemsStore.isCreatingProblem || editingProblem"
            :has-unsaved-changes="boulderProblemsStore.hasUnsavedChanges(problem.id)"
            @click="selectProblem"
            @mouseenter="handleProblemHover(problem, true)"
            @mouseleave="handleProblemHover(problem, false)"
            @view-detail="viewProblemDetail"
            @toggle-visibility="toggleProblemVisibility"
            @edit="editProblem"
            @delete="deleteProblem"
          />
        </div>
      </div>

      <!-- Clear All Button -->
      <div
        v-if="
          boulderProblemsStore.sortedProblems.length > 0 &&
          !boulderProblemsStore.isCreatingProblem &&
          !editingProblem
        "
        class="mt-4 pt-4 border-t border-gray-200"
      >
        <button
          @click="clearAllProblems"
          class="w-full px-4 py-2 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
        >
          Clear All Problems
        </button>
      </div>

      <!-- Global Unsaved Changes Indicator -->
      <div
        v-if="boulderProblemsStore.getUnsavedChangesCount() > 0 && !editingProblem"
        class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center text-sm text-orange-800">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span
              >{{ boulderProblemsStore.getUnsavedChangesCount() }} problem{{
                boulderProblemsStore.getUnsavedChangesCount() > 1 ? "s" : ""
              }}
              with unsaved changes</span
            >
          </div>
          <button
            @click="saveAllChanges"
            :disabled="boulderProblemsStore.isSaving"
            class="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-sm font-medium rounded transition-colors duration-200 flex items-center space-x-1"
          >
            <div
              v-if="boulderProblemsStore.isSaving"
              class="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Save All</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore";
import { useHoldDetectionServerStore } from "@/stores/holdDetectionServerStore";
import { getGradeLabel } from "@/utils/gradingUtils.js";
import BoulderProblemCard from "@/components/BoulderProblemCard.vue";
import Slider from "@vueform/slider";

const props = defineProps({
  hasDetectionResults: {
    type: Boolean,
    default: false,
  },
  editingProblemId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "problem-hover",
  "start-editing",
  "stop-editing",
  "tool-selection-change",
  "filtered-problems-change",
]);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
const serverStore = useHoldDetectionServerStore();

// Local reactive state for the form
const problemName = ref("");
const selectedGrade = ref("");

// Initialize selectedGrade with first grade from the system
const initializeDefaultGrade = () => {
  if (boulderProblemsStore.grades.length > 0) {
    selectedGrade.value = boulderProblemsStore.grades[0];
  }
};

// Grade filtering state - single range array [min, max]
const gradeRange = ref([0, boulderProblemsStore.grades.length - 1]);

// Computed properties for grade filtering
const selectedMinGrade = computed(() => boulderProblemsStore.grades[gradeRange.value[0]]);
const selectedMaxGrade = computed(() => boulderProblemsStore.grades[gradeRange.value[1]]);

const hasActiveGradeFilter = computed(() => {
  return gradeRange.value[0] > 0 || gradeRange.value[1] < boulderProblemsStore.grades.length - 1;
});

const filteredProblems = computed(() => {
  if (!hasActiveGradeFilter.value) {
    return boulderProblemsStore.sortedProblems;
  }

  return boulderProblemsStore.sortedProblems.filter((problem) => {
    const gradeLabel = getGradeLabel(problem.grade);
    const gradeIndex = boulderProblemsStore.grades.indexOf(gradeLabel);
    return gradeIndex >= gradeRange.value[0] && gradeIndex <= gradeRange.value[1];
  });
});

// Check if there are any holds available (AI detection + manual)
const hasAnyHolds = computed(() => {
  const aiHolds = props.hasDetectionResults ? serverStore.holdCount : 0;
  const manualHolds = serverStore.manualHolds.length;
  return aiHolds + manualHolds > 0;
});

const totalHoldCount = computed(() => {
  const aiHolds = props.hasDetectionResults ? serverStore.holdCount : 0;
  const manualHolds = serverStore.manualHolds.length;
  return aiHolds + manualHolds;
});

// Edit mode state (now derived from props instead of local state)
const editingProblem = computed(() => {
  return props.editingProblemId
    ? boulderProblemsStore.sortedProblems.find((p) => p.id === props.editingProblemId)
    : null;
});

// Tool selection state
const holdSelectionTool = ref("single");

const setHoldSelectionTool = (tool) => {
  holdSelectionTool.value = tool;
  // Emit tool selection change to parent
  emit("tool-selection-change", tool);
};

const startCreatingProblem = async () => {
  try {
    await boulderProblemsStore.createNewProblem(selectedGrade.value, problemName.value);
    // Reset form
    problemName.value = "";
    initializeDefaultGrade();
  } catch (error) {
    console.error("Error starting boulder problem creation:", error);
    // Error is already handled in the store and displayed in the UI
  }
};

const finishProblem = async () => {
  // Update the problem with the final name and grade
  if (boulderProblemsStore.activeProblem) {
    await boulderProblemsStore.updateProblemName(
      boulderProblemsStore.activeProblem.id,
      problemName.value || boulderProblemsStore.activeProblem.name
    );
    await boulderProblemsStore.updateProblemGrade(
      boulderProblemsStore.activeProblem.id,
      selectedGrade.value
    );
  }

  await boulderProblemsStore.finishCreatingProblem();

  // Reset form and tool selection
  problemName.value = "";
  initializeDefaultGrade();
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const cancelProblem = async () => {
  await boulderProblemsStore.cancelCreatingProblem();

  // Reset form and tool selection
  problemName.value = "";
  initializeDefaultGrade();
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const selectProblem = (problem) => {
  boulderProblemsStore.selectProblem(problem);
};

const viewProblemDetail = (problem) => {
  router.push({
    name: "boulder-problem-detail",
    params: {
      locationId: boulderProblemsStore.currentLocationId,
      problemId: problem.id,
    },
  });
};

const toggleProblemVisibility = (problem) => {
  // Check if we're showing only this problem or showing all problems
  if (boulderProblemsStore.isShowingOnlyOneProblem && !problem.hidden) {
    // Currently showing only this problem - show all problems
    boulderProblemsStore.showAllProblems();
  } else {
    // Show only this problem (hide all others)
    boulderProblemsStore.showOnlyProblem(problem.id);
  }
};

const editProblem = (problem) => {
  // Emit to parent to start editing (URL-based state management)
  emit("start-editing", problem);

  // Pre-populate the form with existing values
  problemName.value = problem.name;
  selectedGrade.value = getGradeLabel(problem.grade);

  // Reset tool selection to single when starting edit
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const saveEdit = async () => {
  // Get current editing problem from URL-based state (via editingProblemId prop)
  const currentEditingProblem = props.editingProblemId
    ? boulderProblemsStore.sortedProblems.find((p) => p.id === props.editingProblemId)
    : null;

  if (!currentEditingProblem) return;

  try {
    // Update the local problem data
    boulderProblemsStore.updateProblemName(currentEditingProblem.id, problemName.value);
    boulderProblemsStore.updateProblemGrade(currentEditingProblem.id, selectedGrade.value);

    // Save all changes to server
    await boulderProblemsStore.saveProblemChanges(currentEditingProblem.id);

    // After successful save, stop editing
    emit("stop-editing");

    // Reset form state
    problemName.value = "";
    initializeDefaultGrade();
  } catch (error) {
    console.error("Error saving boulder problem:", error);
    // Error is already handled in the store and displayed in the UI
  }
};

const cancelEdit = async () => {
  // Get current editing problem from URL-based state (via editingProblemId prop)
  const currentEditingProblem = props.editingProblemId
    ? boulderProblemsStore.sortedProblems.find((p) => p.id === props.editingProblemId)
    : null;

  if (!currentEditingProblem) return;

  // If there are unsaved changes, ask for confirmation
  if (boulderProblemsStore.hasUnsavedChanges(currentEditingProblem.id)) {
    if (
      !confirm(
        "You have unsaved changes. Are you sure you want to cancel? All changes will be lost."
      )
    ) {
      return;
    }

    try {
      // Discard changes by reloading from server
      await boulderProblemsStore.discardProblemChanges(currentEditingProblem.id);
    } catch (error) {
      console.error("Error discarding changes:", error);
    }
  }

  // Emit to parent to stop editing (URL-based state management)
  emit("stop-editing");

  // Reset form state
  problemName.value = "";
  initializeDefaultGrade();
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const deleteProblem = async (problemId) => {
  if (confirm("Are you sure you want to delete this problem? This action cannot be undone.")) {
    try {
      await boulderProblemsStore.deleteProblem(problemId);
    } catch (error) {
      console.error("Error deleting boulder problem:", error);
      // Error is already handled in the store and displayed in the UI
    }
  }
};

const clearAllProblems = async () => {
  if (confirm("Are you sure you want to delete all problems? This action cannot be undone.")) {
    await boulderProblemsStore.clearAllProblems();
  }
};

const saveAllChanges = async () => {
  try {
    await boulderProblemsStore.saveAllPendingChanges();
  } catch (error) {
    console.error("Error saving all changes:", error);
    // Error is already handled in the store and displayed in the UI
  }
};

const handleProblemHover = (problem, isEntering) => {
  // Emit problem hover event to parent component
  emit("problem-hover", problem, isEntering);
};

// Grade filtering functions
let updateTimeout = null;
let isUpdating = false;

const handleSliderUpdate = (value) => {
  // Real-time UI update while dragging - no URL update yet
  console.log("🎚️ Slider update (dragging):", value);
  isUpdating = true;

  // Clear any pending timeout
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
};

const handleSliderChange = (value) => {
  console.log("🎚️ Slider change (final):", value);
  isUpdating = false;

  // Debounce URL updates to avoid excessive navigation
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    updateGradeFilter();
  }, 500); // Increased debounce time for better performance
};

const updateGradeFilter = () => {
  if (isUpdating) {
    console.log("⏭️ Skipping URL update - still dragging");
    return;
  }

  console.log("🔄 Updating URL with grade filter");

  // Update URL query parameters
  const query = { ...route.query };

  if (hasActiveGradeFilter.value) {
    query.minGrade = selectedMinGrade.value;
    query.maxGrade = selectedMaxGrade.value;
  } else {
    delete query.minGrade;
    delete query.maxGrade;
  }

  router.push({ query });
};

const clearGradeFilter = () => {
  gradeRange.value = [0, boulderProblemsStore.grades.length - 1];
  updateGradeFilter();
};

const initializeGradeFilterFromQuery = () => {
  const minGrade = route.query.minGrade;
  const maxGrade = route.query.maxGrade;

  let newRange = [0, boulderProblemsStore.grades.length - 1];

  if (minGrade) {
    const minIndex = boulderProblemsStore.grades.indexOf(minGrade);
    if (minIndex !== -1) {
      newRange[0] = minIndex;
    }
  }

  if (maxGrade) {
    const maxIndex = boulderProblemsStore.grades.indexOf(maxGrade);
    if (maxIndex !== -1) {
      newRange[1] = maxIndex;
    }
  }

  gradeRange.value = newRange;
};

// Cancel edit mode when starting to create a new problem
watch(
  () => boulderProblemsStore.isCreatingProblem,
  (isCreating) => {
    if (isCreating) {
      cancelEdit();
    }
  }
);

// Watch editing state for internal component logic (no longer emits to parent)
watch(
  () => props.editingProblemId,
  (newEditingProblemId, oldEditingProblemId) => {
    console.log("📝 BoulderProblemsManager editing problem ID changed:", newEditingProblemId);

    // When starting to edit a problem, populate the form
    if (newEditingProblemId && editingProblem.value) {
      problemName.value = editingProblem.value.name;
      selectedGrade.value = getGradeLabel(editingProblem.value.grade);
    }

    // When stopping editing, clear the form
    if (!newEditingProblemId && oldEditingProblemId) {
      problemName.value = "";
      initializeDefaultGrade();
    }
  },
  { immediate: true }
);

// Watch for changes in the grading system to update default grade
watch(
  () => boulderProblemsStore.grades,
  () => {
    // Initialize default grade when grading system changes
    if (!selectedGrade.value || !boulderProblemsStore.grades.includes(selectedGrade.value)) {
      initializeDefaultGrade();
    }
    // Update grade range max when grades change
    gradeRange.value = [0, boulderProblemsStore.grades.length - 1];
  },
  { immediate: true }
);

// Initialize grade filter from URL on mount
watch(
  () => route.query,
  () => {
    initializeGradeFilterFromQuery();
  },
  { immediate: true }
);

// Watch filtered problems and emit them to parent for hold highlighting
watch(
  filteredProblems,
  (newFilteredProblems) => {
    emit("filtered-problems-change", newFilteredProblems);
  },
  { immediate: true }
);

// Cleanup timeout on unmount
onUnmounted(() => {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
});
</script>

<style>
@import "@vueform/slider/themes/default.css";

.grade-range-slider {
  --slider-bg: #e5e7eb;
  --slider-connect-bg: #3b82f6;
  --slider-tooltip-bg: #1f2937;
  --slider-handle-ring-color: #3b82f630;
  --slider-handle-bg: #ffffff;
  --slider-handle-border: #3b82f6;
  margin: 0.5rem 0;
}
</style>
