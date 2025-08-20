<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Boulder Problems</h2>
        <p v-if="totalProblems > 0" class="text-sm text-gray-600">
          {{ totalProblems }} problems total
        </p>
      </div>
    </div>

    <!-- Expandable Grade Groups -->
    <div v-if="totalProblems > 0" class="space-y-3">
      <div
        v-for="gradeGroup in problemsByGrade"
        :key="gradeGroup.label"
        class="border border-gray-200 rounded-lg overflow-hidden"
      >
        <!-- Grade Header (Clickable) -->
        <button
          @click="toggleGradeExpansion(gradeGroup.label)"
          class="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: getGradeColor(gradeGroup.label) }"
            ></div>
            <span class="font-medium text-gray-900">Grade {{ gradeGroup.label }}</span>
            <span class="text-sm text-gray-500">
              ({{ gradeGroup.count }} {{ gradeGroup.count === 1 ? "problem" : "problems" }})
            </span>
          </div>
          <svg
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
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
          <router-link
            v-for="problem in gradeGroup.problems"
            :key="problem.id"
            :to="{
              name: 'boulder-problem-detail',
              params: {
                locationId: locationId,
                problemId: problem.id,
              },
            }"
            class="block px-4 py-3 hover:bg-blue-50 transition-colors group"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: problem.color }"
                ></div>
                <span class="font-medium text-gray-900 group-hover:text-blue-700">
                  {{ problem.name }}
                </span>
              </div>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <span>{{ problem.holds?.length || 0 }} holds</span>
                <svg
                  class="w-4 h-4 text-gray-400 group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- No problems message -->
    <div v-else class="text-center py-8">
      <svg
        class="w-16 h-16 mx-auto mb-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No boulder problems yet</h3>
      <p class="text-gray-500 mb-4">
        Upload images and use the hold detection tool to create boulder problems
      </p>
      <slot name="empty-state-actions">
        <!-- Parent can provide custom actions for empty state -->
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { getGradeColor } from "@/utils/gradingUtils";

const props = defineProps({
  /**
   * Array of boulder problems to display
   */
  problems: {
    type: Array,
    default: () => [],
  },
  /**
   * Location ID for generating problem detail links
   */
  locationId: {
    type: String,
    required: true,
  },
});

// Reactive state for expanded grades
const expandedGrades = ref(new Set());

// Computed property to group problems by grade
const problemsByGrade = computed(() => {
  const gradeGroups = {};

  props.problems.forEach((problem) => {
    // Handle grade as either string or object
    let gradeLabel = "Unknown";
    if (problem.grade) {
      if (typeof problem.grade === "string") {
        gradeLabel = problem.grade;
      } else if (problem.grade.label) {
        gradeLabel = problem.grade.label;
      }
    }
    
    if (!gradeGroups[gradeLabel]) {
      gradeGroups[gradeLabel] = {
        label: gradeLabel,
        count: 0,
        problems: [],
      };
    }
    gradeGroups[gradeLabel].count++;
    gradeGroups[gradeLabel].problems.push(problem);
  });

  // Convert to array and sort by grade
  return Object.values(gradeGroups).sort((a, b) => {
    // Custom sort for boulder grades (V0, V1, V2, etc.)
    const getGradeNumber = (grade) => {
      const match = grade.match(/V(\d+)/);
      return match ? parseInt(match[1]) : 999; // Unknown grades go to end
    };
    return getGradeNumber(a.label) - getGradeNumber(b.label);
  });
});

// Total number of problems
const totalProblems = computed(() => props.problems.length);

// Functions
const toggleGradeExpansion = (grade) => {
  if (expandedGrades.value.has(grade)) {
    expandedGrades.value.delete(grade);
  } else {
    expandedGrades.value.add(grade);
  }
  // Trigger reactivity
  expandedGrades.value = new Set(expandedGrades.value);
};
</script>
