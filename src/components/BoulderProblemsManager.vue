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
          :disabled="!hasDetectionResults || boulderProblemsStore.isLoading"
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
        <p v-if="!hasDetectionResults" class="text-sm text-gray-500 mt-2 text-center">
          Run hold detection first to create boulder problems
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

        <!-- Tool Picker -->
        <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 class="text-sm font-medium text-gray-700 mb-3">Select Tool:</h5>
          <div class="flex space-x-2">
            <button
              @click="setHoldSelectionTool('single')"
              :class="[
                'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                holdSelectionTool === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
              title="Single Hold Selector - Click individual holds to add/remove them"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
              <span>Single</span>
            </button>
            <button
              @click="setHoldSelectionTool('magic-wand')"
              :class="[
                'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2',
                holdSelectionTool === 'magic-wand'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
              title="Magic Wand - Click a hold to select an entire connected route of similar-colored holds"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.929 2.929l1.414 1.414M2.929 7.071l1.414-1.414m0 0L7.071 2.93m-2.728 2.728L6.929 7.243m9.9-2.122l1.414-1.414m-2.122 9.9l1.414 1.414M12 3v3m6 6h3M9 21h6m-9-6h3m6 0h3"
                />
              </svg>
              <span>Magic Wand</span>
            </button>
          </div>
          <div class="mt-2 text-xs text-gray-600">
            {{
              holdSelectionTool === 'single'
                ? 'Click individual holds to add or remove them from the problem.'
                : 'Click any hold to automatically select an entire connected route of similar-colored holds.'
            }}
          </div>
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

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="problem in boulderProblemsStore.sortedProblems"
            :key="problem.id"
            @click="selectProblem(problem)"
            @mouseenter="handleProblemHover(problem, true)"
            @mouseleave="handleProblemHover(problem, false)"
            class="flex items-center justify-between p-3 rounded-lg border border-gray-200 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer"
            :class="{
              'border-blue-500 bg-blue-50':
                boulderProblemsStore.activeProblem?.id === problem.id &&
                !boulderProblemsStore.isCreatingProblem &&
                !editingProblem,
              'opacity-50': boulderProblemsStore.isCreatingProblem || editingProblem,
            }"
          >
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <div
                class="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                :style="{ backgroundColor: problem.color }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 min-w-0">
                  <div class="font-medium text-gray-900 truncate" :title="problem.name">
                    {{ problem.name }}
                  </div>
                  <!-- Unsaved changes indicator -->
                  <div
                    v-if="boulderProblemsStore.hasUnsavedChanges(problem.id)"
                    class="flex items-center flex-shrink-0"
                  >
                    <div class="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes"></div>
                  </div>
                </div>
                <div class="text-sm text-gray-500">
                  Grade {{ problem.grade }} • {{ problem.holds.length }} holds
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2 flex-shrink-0">
              <span
                class="text-sm font-medium text-gray-600 max-w-24 truncate"
                :title="`#${problem.id}`"
                >#{{ problem.id }}</span
              >
              <button
                @click.stop="viewProblemDetail(problem)"
                class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200"
                title="View Details"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
              <button
                @click.stop="editProblem(problem)"
                :disabled="boulderProblemsStore.isCreatingProblem || editingProblem"
                class="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit problem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                @click.stop="deleteProblem(problem.id)"
                :disabled="boulderProblemsStore.isCreatingProblem || editingProblem"
                class="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete problem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
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
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useBoulderProblemsStore } from "@/stores/boulderProblemsStore";

defineProps({
  hasDetectionResults: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["problem-hover", "editing-state-change", "tool-selection-change"]);

const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();

// Local reactive state for the form
const problemName = ref("");
const selectedGrade = ref("V0");

// Edit mode state
const editingProblem = ref(null);

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
    selectedGrade.value = "V0";
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
  selectedGrade.value = "V0";
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const cancelProblem = async () => {
  await boulderProblemsStore.cancelCreatingProblem();

  // Reset form and tool selection
  problemName.value = "";
  selectedGrade.value = "V0";
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

const editProblem = (problem) => {
  // Set the problem as the editing problem and select it
  editingProblem.value = problem;
  boulderProblemsStore.selectProblem(problem);

  // Pre-populate the form with existing values
  problemName.value = problem.name;
  selectedGrade.value = problem.grade;
  
  // Reset tool selection to single when starting edit
  holdSelectionTool.value = "single";
  emit("tool-selection-change", "single");
};

const saveEdit = async () => {
  if (!editingProblem.value) return;

  try {
    // Update the local problem data
    boulderProblemsStore.updateProblemName(editingProblem.value.id, problemName.value);
    boulderProblemsStore.updateProblemGrade(editingProblem.value.id, selectedGrade.value);

    // Save all changes to server
    await boulderProblemsStore.saveProblemChanges(editingProblem.value.id);

    cancelEdit();
  } catch (error) {
    console.error("Error saving boulder problem:", error);
    // Error is already handled in the store and displayed in the UI
  }
};

const cancelEdit = async () => {
  if (!editingProblem.value) return;

  // If there are unsaved changes, ask for confirmation
  if (boulderProblemsStore.hasUnsavedChanges(editingProblem.value.id)) {
    if (
      !confirm(
        "You have unsaved changes. Are you sure you want to cancel? All changes will be lost."
      )
    ) {
      return;
    }

    try {
      // Discard changes by reloading from server
      await boulderProblemsStore.discardProblemChanges(editingProblem.value.id);
    } catch (error) {
      console.error("Error discarding changes:", error);
    }
  }

  editingProblem.value = null;
  problemName.value = "";
  selectedGrade.value = "V0";
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

// Cancel edit mode when starting to create a new problem
watch(
  () => boulderProblemsStore.isCreatingProblem,
  (isCreating) => {
    if (isCreating) {
      cancelEdit();
    }
  }
);

// Emit editing state changes to parent
watch(
  editingProblem,
  (newEditingProblem) => {
    emit("editing-state-change", {
      isEditing: !!newEditingProblem,
      editingProblem: newEditingProblem,
    });
  },
  { immediate: true }
);
</script>
