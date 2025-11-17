<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4">
    <h4 class="text-md font-semibold text-gray-900 mb-4">Log Your Ascent</h4>
    <p class="text-sm text-gray-600 mb-4">
      Fill in the details while we identify the problem for you
    </p>

    <form @submit.prevent="$emit('submit', formData)" class="space-y-4">
      <!-- Attempt Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          How did you send it? *
        </label>
        <div class="space-y-2">
          <div
            v-for="type in attemptTypes"
            :key="type.value"
            class="flex items-start"
          >
            <input
              :id="`attempt-${type.value}`"
              v-model="formData.attemptType"
              :value="type.value"
              type="radio"
              name="attemptType"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
              required
            />
            <label :for="`attempt-${type.value}`" class="ml-3 block text-sm">
              <div class="font-medium text-gray-900">{{ type.label }}</div>
              <div class="text-xs text-gray-500">{{ type.description }}</div>
            </label>
          </div>
        </div>
      </div>

      <!-- User Grade (Optional) -->
      <div>
        <label for="userGrade" class="block text-sm font-medium text-gray-700 mb-1">
          Your grade opinion (optional)
        </label>
        <select
          id="userGrade"
          v-model="formData.userGrade"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select grade (optional)</option>
          <option v-for="grade in grades" :key="grade" :value="grade">
            {{ grade }}
          </option>
        </select>
        <p class="text-xs text-gray-500 mt-1">Rate what you think this problem is graded</p>
      </div>

      <!-- Notes -->
      <div>
        <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          v-model="formData.notes"
          rows="3"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any notes about your ascent..."
        ></textarea>
      </div>

      <!-- Date -->
      <div>
        <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          id="date"
          v-model="formData.date"
          type="date"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :max="today"
          required
        />
      </div>

      <!-- Detected Problem Info (shown when problem is identified) -->
      <div
        v-if="detectedProblem"
        class="p-3 bg-green-50 border border-green-200 rounded-lg"
      >
        <div class="flex items-center space-x-2 mb-2">
          <svg
            class="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span class="text-sm font-medium text-green-800">Problem Identified!</span>
        </div>
        <div class="text-sm text-green-700 mb-2">
          <strong>{{ detectedProblem.name }}</strong>
          <span v-if="detectedProblem.grade" class="ml-2 text-xs">
            {{ detectedProblem.grade }}
          </span>
          <span v-if="detectedProblem.displayScore" class="ml-2 text-xs font-semibold">
            {{ detectedProblem.displayScore }}
          </span>
        </div>
        
        <!-- Top 3 Scores -->
        <div v-if="top3Scores.length > 1" class="text-xs text-gray-600 space-y-1 pt-2 border-t border-green-200">
          <div class="font-medium text-gray-700 mb-1">Top Matches:</div>
          <div v-for="(score, index) in top3Scores" :key="index" class="flex items-center justify-between">
            <span :class="index === 0 ? 'font-semibold text-green-700' : ''">
              {{ index + 1 }}. {{ score.name }}
            </span>
            <span :class="index === 0 ? 'font-semibold text-green-700' : 'text-gray-500'">
              {{ score.displayScore }}
            </span>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="!canSubmit || isSubmitting"
        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <div
          v-if="isSubmitting"
          class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <span v-if="isSubmitting">Logging ascent & uploading video...</span>
        <span v-else>Log Send</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  detectedProblem: {
    type: Object,
    default: null
  },
  top3Scores: {
    type: Array,
    default: () => []
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
});

defineEmits(['submit']);

// Attempt types from AscentStore
const attemptTypes = [
  {
    value: 'flash',
    label: 'Flash',
    description: 'First attempt, no beta'
  },
  {
    value: 'onsight',
    label: 'Onsight',
    description: 'First attempt, with beta'
  },
  {
    value: 'redpoint',
    label: 'Redpoint',
    description: 'After working the problem'
  },
  {
    value: 'repeat',
    label: 'Repeat',
    description: 'Sending again'
  }
];

// Grades from AscentStore
const grades = [
  '4', '4+', '5', '5+', '6A', '6A+', '6B', '6B+', '6C', '6C+',
  '7A', '7A+', '7B', '7B+', '7C', '7C+',
  '8A', '8A+', '8B', '8B+', '8C', '8C+',
  '9A'
];

// Form data
const formData = ref({
  attemptType: '',
  userGrade: '',
  notes: '',
  date: new Date().toISOString().split('T')[0]
});

// Today's date for max date validation
const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Can submit when form is valid (problem detection not required)
const canSubmit = computed(() => {
  // Can submit when basic fields are filled
  return formData.value.attemptType && formData.value.date;
});

// Expose formData for parent component to access
defineExpose({
  formData
});
</script>
