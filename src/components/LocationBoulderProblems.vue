<template>
  <div>
    <!-- Header -->
    <h2 class="section-header mb-4">
      Boulder problems
      <span v-if="totalProblems > 0" class="section-header-count ml-1.5">({{ totalProblems }})</span>
    </h2>

    <!-- Content -->
    <div>
      <!-- Expandable Grade Groups -->
      <div v-if="totalProblems > 0" class="space-y-3">
        <div
          v-for="gradeGroup in boulderProblemsSummary"
          :key="gradeGroup.label"
          class="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
        >
          <!-- Grade Header (Clickable) -->
          <button
            @click="toggleGradeExpansion(gradeGroup.label)"
            class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            :aria-expanded="expandedGrades.has(gradeGroup.label)"
            :aria-label="`${expandedGrades.has(gradeGroup.label) ? 'Collapse' : 'Expand'} grade ${gradeGroup.label} problems`"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: getGradeColor(gradeGroup.label) }"
              ></div>
              <span class="font-medium text-gray-900">Grade {{ gradeGroup.label }}</span>
              <span class="text-sm text-gray-500">
                ({{ gradeGroup.count }} {{ gradeGroup.count === 1 ? "problem" : "problems" }})
              </span>
            </div>
            <svg
              class="w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0"
              :class="{ 'rotate-180': expandedGrades.has(gradeGroup.label) }"
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

          <!-- Expanded Problems List -->
          <div
            v-if="expandedGrades.has(gradeGroup.label)"
            class="bg-white divide-y divide-gray-100"
          >
            <div
              v-for="problem in gradeGroup.problems"
              :key="problem.id"
              class="px-4 py-3 hover:bg-blue-50 transition-colors group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: problem.color }"
                  ></div>
                  <router-link
                    :to="getProblemDetailRoute(problem.id)"
                    class="font-medium text-gray-900 group-hover:text-blue-700 truncate hover:underline focus:outline-none focus:underline"
                  >
                    {{ problem.name }}
                  </router-link>
                  <!-- Linked-problem indicator -->
                  <span
                    v-if="problem.linkedProblemId"
                    title="This problem continues on an adjacent image"
                    class="text-xs text-indigo-500 select-none"
                    aria-label="Linked across images"
                  >↔</span>
                </div>
                <div class="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
                  <span>{{ problem.holds?.length || 0 }} holds</span>
                  <span>•</span>
                  <span>{{ getProblemVideoCount(problem.id) }} videos</span>
                  
                  <!-- Quick video access button -->
                  <button
                    v-if="getProblemVideoCount(problem.id) > 0"
                    @click="$emit('open-problem-videos', problem)"
                    class="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="View beta videos"
                    :aria-label="`View ${getProblemVideoCount(problem.id)} beta videos for ${problem.name}`"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  
                  <!-- Problem detail link arrow -->
                  <router-link
                    :to="getProblemDetailRoute(problem.id)"
                    class="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="View problem details"
                    :aria-label="`View details for ${problem.name}`"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No boulder problems yet</h3>
        <p class="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Upload photos and use the hold detection tool to identify climbing holds and create boulder problems.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  boulderProblemsSummary: {
    type: Array,
    required: true,
    default: () => []
  },
  totalProblems: {
    type: Number,
    required: true,
    default: 0
  },
  locationId: {
    type: String,
    required: true
  },
  getGradeColor: {
    type: Function,
    required: true
  },
  getProblemVideoCount: {
    type: Function,
    required: true
  }
});

defineEmits(['open-problem-videos']);

// Local state for expanded grades
const expandedGrades = ref(new Set());

const toggleGradeExpansion = (gradeLabel) => {
  if (expandedGrades.value.has(gradeLabel)) {
    expandedGrades.value.delete(gradeLabel);
  } else {
    expandedGrades.value.add(gradeLabel);
  }
};

const getProblemDetailRoute = (problemId) => {
  return {
    name: 'boulder-problem-detail',
    params: {
      locationId: props.locationId,
      problemId: problemId,
    },
  };
};
</script>
