<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Boulder Problems</h3>
      
      <!-- Create New Problem -->
      <div v-if="!boulderProblemsStore.isCreatingProblem" class="mb-6">
        <button
          @click="startCreatingProblem"
          :disabled="!hasDetectionResults"
          class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create New Problem</span>
        </button>
        <p v-if="!hasDetectionResults" class="text-sm text-gray-500 mt-2 text-center">
          Run hold detection first to create boulder problems
        </p>
      </div>

      <!-- Problem Creation Form -->
      <div v-if="boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-semibold text-green-800">Creating Problem #{{ boulderProblemsStore.activeProblem.id }}</h4>
          <div 
            class="w-4 h-4 rounded-full border-2 border-green-600"
            :style="{ backgroundColor: boulderProblemsStore.activeProblemColor }"
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
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            <span class="font-medium text-green-700">{{ boulderProblemsStore.activeProblem.holds.length }}</span>
          </div>
        </div>

        <!-- Instructions -->
        <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-800">
            <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click on the detected holds in the image to add them to this problem.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            @click="finishProblem"
            :disabled="boulderProblemsStore.activeProblem.holds.length === 0"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            Finish Problem
          </button>
          <button
            @click="cancelProblem"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
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
            class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
            :class="{
              'border-blue-500 bg-blue-50': boulderProblemsStore.activeProblem?.id === problem.id && !boulderProblemsStore.isCreatingProblem,
              'opacity-50': boulderProblemsStore.isCreatingProblem && boulderProblemsStore.activeProblem?.id !== problem.id
            }"
          >
            <div class="flex items-center space-x-3">
              <div 
                class="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                :style="{ backgroundColor: problem.color }"
              ></div>
              <div>
                <div class="font-medium text-gray-900">{{ problem.name }}</div>
                <div class="text-sm text-gray-500">
                  Grade {{ problem.grade }} • {{ problem.holds.length }} holds
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-gray-600">#{{ problem.id }}</span>
              <button
                @click.stop="deleteProblem(problem.id)"
                :disabled="boulderProblemsStore.isCreatingProblem"
                class="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete problem"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Clear All Button -->
      <div v-if="boulderProblemsStore.sortedProblems.length > 0 && !boulderProblemsStore.isCreatingProblem" class="mt-4 pt-4 border-t border-gray-200">
        <button
          @click="clearAllProblems"
          class="w-full px-4 py-2 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
        >
          Clear All Problems
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useBoulderProblemsStore } from '@/stores/boulderProblemsStore';

defineProps({
  hasDetectionResults: {
    type: Boolean,
    default: false
  }
});

const boulderProblemsStore = useBoulderProblemsStore();

// Local reactive state for the form
const problemName = ref('');
const selectedGrade = ref('V0');

const startCreatingProblem = () => {
  boulderProblemsStore.createNewProblem(selectedGrade.value, problemName.value);
  // Reset form
  problemName.value = '';
  selectedGrade.value = 'V0';
};

const finishProblem = () => {
  // Update the problem with the final name and grade
  if (boulderProblemsStore.activeProblem) {
    boulderProblemsStore.updateProblemName(boulderProblemsStore.activeProblem.id, problemName.value || boulderProblemsStore.activeProblem.name);
    boulderProblemsStore.updateProblemGrade(boulderProblemsStore.activeProblem.id, selectedGrade.value);
  }
  
  boulderProblemsStore.finishCreatingProblem();
  
  // Reset form
  problemName.value = '';
  selectedGrade.value = 'V0';
};

const cancelProblem = () => {
  boulderProblemsStore.cancelCreatingProblem();
  
  // Reset form
  problemName.value = '';
  selectedGrade.value = 'V0';
};

const selectProblem = (problem) => {
  boulderProblemsStore.selectProblem(problem);
};

const deleteProblem = (problemId) => {
  if (confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
    boulderProblemsStore.deleteProblem(problemId);
  }
};

const clearAllProblems = () => {
  if (confirm('Are you sure you want to delete all problems? This action cannot be undone.')) {
    boulderProblemsStore.clearAllProblems();
  }
};
</script>
