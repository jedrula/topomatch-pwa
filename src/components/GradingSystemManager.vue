<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">Grading System</h3>
    </div>

    <!-- System Type Selection -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3">
          Choose a grading system for this location
        </label>

        <!-- V-Scale Option -->
        <div class="space-y-3">
          <label
            class="flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50"
            :class="
              selectedSystemType === 'v-scale' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            "
          >
            <input type="radio" value="v-scale" v-model="selectedSystemType" class="mt-1 mr-3" />
            <div class="flex-1">
              <div class="font-medium text-gray-900">V-Scale (Traditional Bouldering)</div>
              <div class="text-sm text-gray-600 mt-1">
                Standard bouldering grades: VB, V0, V1, V2, ..., V17
              </div>
            </div>
          </label>

          <!-- Fontainebleau Option -->
          <label
            class="flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50"
            :class="
              selectedSystemType === 'fontainebleau'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            "
          >
            <input
              type="radio"
              value="fontainebleau"
              v-model="selectedSystemType"
              class="mt-1 mr-3"
            />
            <div class="flex-1">
              <div class="font-medium text-gray-900">Fontainebleau (French System)</div>
              <div class="text-sm text-gray-600 mt-1">
                Classic French bouldering grades: 3, 4, 5a, 5b, 5c, 6a, ..., 8c+
              </div>
            </div>
          </label>

          <!-- Numeric Option -->
          <label
            class="flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50"
            :class="
              selectedSystemType === 'numeric' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            "
          >
            <input type="radio" value="numeric" v-model="selectedSystemType" class="mt-1 mr-3" />
            <div class="flex-1">
              <div class="font-medium text-gray-900">Numeric Scale</div>
              <div class="text-sm text-gray-600 mt-1">
                Simple numbered grades from 1 to your chosen maximum
              </div>

              <!-- Max Level Selection (shown when numeric is selected) -->
              <div v-if="selectedSystemType === 'numeric'" class="mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">Maximum Level:</label>
                <select
                  v-model="numericMaxLevel"
                  class="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option v-for="n in 7" :key="n + 5" :value="n + 5">{{ n + 5 }}</option>
                </select>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const emit = defineEmits(["system-selected"]);

// Simple system types
const selectedSystemType = ref("v-scale");
const numericMaxLevel = ref(8);

// Predefined systems
const vScaleGrades = [
  { value: 0, label: "VB", difficulty: 0 },
  { value: 1, label: "V0", difficulty: 1 },
  { value: 2, label: "V1", difficulty: 2 },
  { value: 3, label: "V2", difficulty: 3 },
  { value: 4, label: "V3", difficulty: 4 },
  { value: 5, label: "V4", difficulty: 5 },
  { value: 6, label: "V5", difficulty: 6 },
  { value: 7, label: "V6", difficulty: 7 },
  { value: 8, label: "V7", difficulty: 8 },
  { value: 9, label: "V8", difficulty: 9 },
  { value: 10, label: "V9", difficulty: 10 },
  { value: 11, label: "V10", difficulty: 11 },
  { value: 12, label: "V11", difficulty: 12 },
  { value: 13, label: "V12", difficulty: 13 },
  { value: 14, label: "V13", difficulty: 14 },
  { value: 15, label: "V14", difficulty: 15 },
  { value: 16, label: "V15", difficulty: 16 },
  { value: 17, label: "V16", difficulty: 17 },
  { value: 18, label: "V17", difficulty: 18 },
];

const fontainebleauGrades = [
  { value: 0, label: "3", difficulty: 0 },
  { value: 1, label: "4", difficulty: 1 },
  { value: 2, label: "5a", difficulty: 2 },
  { value: 3, label: "5b", difficulty: 3 },
  { value: 4, label: "5c", difficulty: 4 },
  { value: 5, label: "6a", difficulty: 5 },
  { value: 6, label: "6a+", difficulty: 6 },
  { value: 7, label: "6b", difficulty: 7 },
  { value: 8, label: "6b+", difficulty: 8 },
  { value: 9, label: "6c", difficulty: 9 },
  { value: 10, label: "6c+", difficulty: 10 },
  { value: 11, label: "7a", difficulty: 11 },
  { value: 12, label: "7a+", difficulty: 12 },
  { value: 13, label: "7b", difficulty: 13 },
  { value: 14, label: "7b+", difficulty: 14 },
  { value: 15, label: "7c", difficulty: 15 },
  { value: 16, label: "7c+", difficulty: 16 },
  { value: 17, label: "8a", difficulty: 17 },
  { value: 18, label: "8a+", difficulty: 18 },
  { value: 19, label: "8b", difficulty: 19 },
  { value: 20, label: "8b+", difficulty: 20 },
  { value: 21, label: "8c", difficulty: 21 },
  { value: 22, label: "8c+", difficulty: 22 },
];

// Generate numeric grades based on max level
const generateNumericGrades = (maxLevel) => {
  const grades = [];
  for (let i = 1; i <= maxLevel; i++) {
    grades.push({
      value: i - 1,
      label: i.toString(),
      difficulty: i - 1,
    });
  }
  return grades;
};

// Computed system based on selection
const selectedSystem = computed(() => {
  switch (selectedSystemType.value) {
    case "v-scale":
      return {
        id: "v-scale",
        name: "V-Scale (Traditional Bouldering)",
        type: "preset",
        grades: vScaleGrades,
      };
    case "fontainebleau":
      return {
        id: "fontainebleau",
        name: "Fontainebleau (French System)",
        type: "preset",
        grades: fontainebleauGrades,
      };
    case "numeric":
      return {
        id: `numeric-${numericMaxLevel.value}`,
        name: `Numeric Scale (1-${numericMaxLevel.value})`,
        type: "numeric",
        maxLevel: numericMaxLevel.value,
        grades: generateNumericGrades(numericMaxLevel.value),
      };
    default:
      return null;
  }
});

// Auto-emit when selection changes
watch(
  selectedSystem,
  (newSystem) => {
    if (newSystem) {
      emit("system-selected", newSystem);
    }
  },
  { deep: true }
);
</script>
