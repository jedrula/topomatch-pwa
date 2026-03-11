<template>
  <div
    ref="panelElement"
    :class="[
      'bg-white rounded-lg border border-gray-200',
      props.isFullscreen ? 'fixed z-50' : 'shadow-sm',
      props.isFullscreen && isDragging ? 'shadow-2xl' : props.isFullscreen ? 'shadow-lg' : '',
    ]"
    :style="
      props.isFullscreen
        ? {
            left: panelX + 'px',
            top: panelY + 'px',
            maxWidth: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            opacity: isDragging ? '0.9' : '1',
            transition: isDragging ? 'none' : 'opacity 0.2s ease',
          }
        : {}
    "
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          Boulder Problems
          <span v-if="props.isFullscreen" class="text-xs text-gray-500 ml-2">(Drag to move)</span>
        </h3>
        <!-- Drag handle for fullscreen mode -->
        <div
          v-if="props.isFullscreen"
          class="flex items-center text-gray-400 hover:text-gray-600 cursor-move transition-colors"
          title="Drag to move panel"
          @mousedown="startDrag"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            />
          </svg>
        </div>
      </div>

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
          <div class="flex items-center gap-1">
            <input
              type="color"
              v-model="problemColor"
              @input="onColorChange"
              title="Problem color"
              class="w-8 h-8 rounded-full border-2 cursor-pointer p-0.5"
              :class="editingProblem ? 'border-blue-600' : 'border-green-600'"
            />
            <button
              @click="resetColorFromHolds"
              :disabled="isExtractingColor"
              title="Auto-detect color from holds"
              class="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <svg
                class="w-3.5 h-3.5"
                :class="isExtractingColor ? 'animate-spin' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
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
          <!-- Grade-based expandable sections -->
          <div
            v-for="gradeGroup in problemsByGrade"
            :key="gradeGroup.grade"
            class="border border-gray-200 rounded-lg"
          >
            <!-- Grade header (clickable to expand/collapse) -->
            <button
              @click="toggleGradeExpansion(gradeGroup.grade)"
              class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg border-b border-gray-200 flex items-center justify-between transition-colors"
            >
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                  <div
                    class="w-4 h-4 rounded-full border-2"
                    :style="{ backgroundColor: gradeGroup.color, borderColor: gradeGroup.color }"
                  ></div>
                  <span class="font-medium text-gray-900">{{ gradeGroup.grade }}</span>
                </div>
                <span class="text-sm text-gray-500"
                  >{{ gradeGroup.problems.length }} problem{{
                    gradeGroup.problems.length !== 1 ? "s" : ""
                  }}</span
                >
              </div>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': expandedGrades.has(gradeGroup.grade) }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <!-- Problems list (collapsible) -->
            <div v-if="expandedGrades.has(gradeGroup.grade)" class="divide-y divide-gray-100">
              <div
                v-for="problem in gradeGroup.problems"
                :key="problem.id"
                class="p-3 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <!-- Problem name as link -->
                  <button
                    @click="navigateToProblem(problem)"
                    class="flex-1 text-left text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {{ problem.name }}
                  </button>

                  <!-- Action buttons -->
                  <div class="flex items-center space-x-1 ml-3">
                    <!-- Visibility toggle -->
                    <button
                      @click="toggleProblemVisibility(problem)"
                      :title="problem.hidden ? 'Show problem' : 'Hide problem'"
                      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          v-if="problem.hidden"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464M14.121 14.121l3.535 3.536m-2.656-7.07l-3.536 3.536"
                        />
                        <path
                          v-else
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>

                    <!-- Edit button -->
                    <button
                      @click="editProblem(problem)"
                      :disabled="boulderProblemsStore.isCreatingProblem || editingProblem"
                      title="Edit problem"
                      class="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

                    <!-- Delete button -->
                    <button
                      @click="deleteProblem(problem.id)"
                      :disabled="boulderProblemsStore.isCreatingProblem || editingProblem"
                      title="Delete problem"
                      class="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

                <!-- Problem metadata -->
                <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                  <span>{{ problem.holds?.length || 0 }} holds</span>
                  <span v-if="problem.createdAt">
                    {{ formatDate(problem.createdAt) }}
                  </span>
                  <span
                    v-if="boulderProblemsStore.hasUnsavedChanges(problem.id)"
                    class="text-orange-600 font-medium"
                  >
                    Unsaved changes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Show message when no problems match filter -->
          <div v-if="filteredProblems.length === 0" class="text-center py-8 text-gray-500">
            <svg
              class="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p class="text-sm">No problems found for the selected grade range</p>
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';
import { useHoldDetectionServerStore } from '@/stores/holdDetectionServerStore';
import { useDraggable } from '@/composables/useDraggable.js';
import { getGradeLabel } from '@/utils/gradingUtils.js';
import { getDominantHoldColor } from '@/utils/colorUtils.js';
import Slider from '@vueform/slider';

const props = defineProps({
  hasDetectionResults: {
    type: Boolean,
    default: false,
  },
  editingProblemId: {
    type: String,
    default: null,
  },
  isFullscreen: {
    type: Boolean,
    default: false,
  },
  modelValueProblemName: {
    type: String,
    default: '',
  },
  modelValueSelectedGrade: {
    type: String,
    default: '',
  },
  modelValueProblemColor: {
    type: String,
    default: '#ffffff',
  },
  climbingImage: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  'problem-hover',
  'start-editing',
  'stop-editing',
  'tool-selection-change',
  'filtered-problems-change',
  'update:modelValueProblemName',
  'update:modelValueSelectedGrade',
  'update:modelValueProblemColor',
]);

const route = useRoute();
const router = useRouter();
const boulderProblemsStore = useBoulderProblemsStore();
const serverStore = useHoldDetectionServerStore();

// Local reactive state for the form - synced with parent via v-model
const problemName = computed({
  get: () => props.modelValueProblemName,
  set: (value) => emit('update:modelValueProblemName', value)
});
const selectedGrade = computed({
  get: () => props.modelValueSelectedGrade,
  set: (value) => emit('update:modelValueSelectedGrade', value)
});
const problemColor = computed({
  get: () => props.modelValueProblemColor,
  set: (value) => emit('update:modelValueProblemColor', value)
});

const onColorChange = (e) => {
  const newColor = e.target.value;
  if (boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem) {
    boulderProblemsStore.updateProblemColor(boulderProblemsStore.activeProblem.id, newColor);
  } else if (editingProblem.value) {
    boulderProblemsStore.updateProblemColor(editingProblem.value.id, newColor);
  }
};

// Expandable grade sections state
const expandedGrades = ref(new Set());

// Extracting dominant color from hold regions
const isExtractingColor = ref(false);

const resetColorFromHolds = async () => {
  const problem = editingProblem.value || boulderProblemsStore.activeProblem;
  const holds = problem?.holds;
  isExtractingColor.value = true;
  try {
    const color = (holds?.length && props.climbingImage)
      ? await getDominantHoldColor(props.climbingImage, holds)
      : null;
    const resolved = color ?? '#ffffff';
    problemColor.value = resolved;
    onColorChange({ target: { value: resolved } });
  } finally {
    isExtractingColor.value = false;
  }
};

// Initialize selectedGrade with first grade from the system
const initializeDefaultGrade = () => {
  if (boulderProblemsStore.grades.length > 0) {
    selectedGrade.value = boulderProblemsStore.grades[0];
  }
};

// Grade filtering state - single range array [min, max]
const gradeRange = ref([0, boulderProblemsStore.grades.length - 1]);

// Dragging functionality for fullscreen mode
const {
  isDragging,
  x: panelX,
  y: panelY,
  elementRef: panelElement,
  startDrag,
} = useDraggable(20, 20);

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

// Group problems by grade for expandable sections
const problemsByGrade = computed(() => {
  const grouped = {};

  filteredProblems.value.forEach((problem) => {
    const gradeLabel = getGradeLabel(problem.grade);
    if (!grouped[gradeLabel]) {
      grouped[gradeLabel] = {
        grade: gradeLabel,
        problems: [],
        color: problem.color || '#6b7280', // Use problem color or gray fallback
      };
    }
    grouped[gradeLabel].problems.push(problem);
  });

  // Sort by grade difficulty (using the grades array order)
  return Object.values(grouped).sort((a, b) => {
    const aIndex = boulderProblemsStore.grades.indexOf(a.grade);
    const bIndex = boulderProblemsStore.grades.indexOf(b.grade);
    return aIndex - bIndex;
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

const startCreatingProblem = async () => {
  try {
    await boulderProblemsStore.createNewProblem(selectedGrade.value, problemName.value, problemColor.value);
    // Reset form
    problemName.value = '';
    initializeDefaultGrade();
  } catch (error) {
    console.error('Error starting boulder problem creation:', error);
    // Error is already handled in the store and displayed in the UI
  }
};

const finishProblem = async () => {
  // Update the problem with the final name, grade and color
  if (boulderProblemsStore.activeProblem) {
    await boulderProblemsStore.updateProblemName(
      boulderProblemsStore.activeProblem.id,
      problemName.value || boulderProblemsStore.activeProblem.name
    );
    await boulderProblemsStore.updateProblemGrade(
      boulderProblemsStore.activeProblem.id,
      selectedGrade.value
    );
    boulderProblemsStore.updateProblemColor(
      boulderProblemsStore.activeProblem.id,
      problemColor.value
    );
  }

  await boulderProblemsStore.finishCreatingProblem();

  // Reset form
  problemName.value = '';
  initializeDefaultGrade();
  problemColor.value = '#ffffff';
  emit('tool-selection-change', 'single');
};

const cancelProblem = async () => {
  await boulderProblemsStore.cancelCreatingProblem();

  // Reset form
  problemName.value = '';
  initializeDefaultGrade();
  problemColor.value = '#ffffff';
  emit('tool-selection-change', 'single');
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
  emit('start-editing', problem);

  // Pre-populate the form with existing values
  problemName.value = problem.name;
  selectedGrade.value = getGradeLabel(problem.grade);
  problemColor.value = problem.color || '#ffffff';

  // Reset tool selection to single when starting edit
  emit('tool-selection-change', 'single');
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
    boulderProblemsStore.updateProblemColor(currentEditingProblem.id, problemColor.value);

    // Save all changes to server
    await boulderProblemsStore.saveProblemChanges(currentEditingProblem.id);

    // After successful save, stop editing
    emit('stop-editing');

    // Reset form state
    problemName.value = '';
    initializeDefaultGrade();
    problemColor.value = '#ffffff';
  } catch (error) {
    console.error('Error saving boulder problem:', error);
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
        'You have unsaved changes. Are you sure you want to cancel? All changes will be lost.'
      )
    ) {
      return;
    }

    try {
      // Discard changes by reloading from server
      await boulderProblemsStore.discardProblemChanges(currentEditingProblem.id);
    } catch (error) {
      console.error('Error discarding changes:', error);
    }
  }

  // Emit to parent to stop editing (URL-based state management)
  emit('stop-editing');

  // Reset form state
  problemName.value = '';
  initializeDefaultGrade();
  problemColor.value = '#ffffff';
  emit('tool-selection-change', 'single');
};

const deleteProblem = async (problemId) => {
  if (confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
    try {
      await boulderProblemsStore.deleteProblem(problemId);
    } catch (error) {
      console.error('Error deleting boulder problem:', error);
      // Error is already handled in the store and displayed in the UI
    }
  }
};

const clearAllProblems = async () => {
  if (confirm('Are you sure you want to delete all problems? This action cannot be undone.')) {
    await boulderProblemsStore.clearAllProblems();
  }
};

// Grade expansion/collapse functions
const toggleGradeExpansion = (grade) => {
  if (expandedGrades.value.has(grade)) {
    expandedGrades.value.delete(grade);
  } else {
    expandedGrades.value.add(grade);
  }
  // Trigger reactivity for Set changes
  expandedGrades.value = new Set(expandedGrades.value);
};

// Date formatting helper - handles Firestore Timestamps, Date objects, and strings
const formatDate = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    // If it's a Firestore Timestamp with toDate method
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    // If it's already a Date object
    else if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString();
    }
    // If it's a string or number, try to parse it
    else {
      return new Date(dateValue).toLocaleDateString();
    }
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return '';
  }
};

// Navigation function
const navigateToProblem = (problem) => {
  const locationId = route.params.locationId;
  if (locationId) {
    router.push(`/location/${locationId}/problem/${problem.id}`);
  } else {
    console.warn('Cannot navigate to problem: locationId not found in route params');
  }
};

const saveAllChanges = async () => {
  try {
    await boulderProblemsStore.saveAllPendingChanges();
  } catch (error) {
    console.error('Error saving all changes:', error);
    // Error is already handled in the store and displayed in the UI
  }
};

// Grade filtering functions
let updateTimeout = null;
let isUpdating = false;

const handleSliderUpdate = () => {
  // Real-time UI update while dragging - no URL update yet
  isUpdating = true;

  // Clear any pending timeout
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
};

const handleSliderChange = (value) => {
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
    return;
  }


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

// Initialize component state when mounted
onMounted(() => {
  // Initialize grade range once grades are available
  if (boulderProblemsStore.grades && boulderProblemsStore.grades.length > 0) {
    gradeRange.value = [0, boulderProblemsStore.grades.length - 1];
    initializeGradeFilterFromQuery();
    initializeDefaultGrade();
  }
  
  // Emit initial filtered problems
  emit('filtered-problems-change', filteredProblems.value);
});

// Cancel edit mode when starting to create a new problem
watch(
  () => boulderProblemsStore.isCreatingProblem,
  (isCreating) => {
    if (isCreating) {
      cancelEdit();
    }
  }
);

// Watch editing problem to populate form when problem loads or changes
watch(
  editingProblem,
  (newEditingProblem, oldEditingProblem) => {
    // When starting to edit a problem, populate the form
    if (newEditingProblem) {
      problemName.value = newEditingProblem.name;
      selectedGrade.value = getGradeLabel(newEditingProblem.grade);
      problemColor.value = newEditingProblem.color || '#ffffff';
    }

    // When stopping editing, clear the form
    if (!newEditingProblem && oldEditingProblem) {
      problemName.value = '';
      initializeDefaultGrade();
      problemColor.value = '#ffffff';
    }
  },
  { immediate: true }
);

// Watch filtered problems and emit them to parent for hold highlighting
watch(
  filteredProblems,
  (newFilteredProblems) => {
    emit('filtered-problems-change', newFilteredProblems);
  }
);

// Reset panel position when entering/exiting fullscreen
watch(
  () => props.isFullscreen,
  (newIsFullscreen) => {
    if (newIsFullscreen) {
      // Reset to default position when entering fullscreen
      panelX.value = 20;
      panelY.value = 20;
    }
  }
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
