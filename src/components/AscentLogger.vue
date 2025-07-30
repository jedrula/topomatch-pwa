<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Log Ascent</h3>
    <!-- Previous Ascents Summary -->
    <div
      v-if="ascentStore.hasUserSent"
      class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
    >
      <div class="flex items-center space-x-2 mb-2">
        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <span class="font-medium text-green-800">You've sent this problem!</span>
      </div>
      <div class="text-sm text-green-700">
        <div>
          Latest send: {{ ascentStore.formatDateTime(ascentStore.latestUserAscent.createdAt) }}
        </div>
        <div>
          Type: {{ ascentStore.getAttemptTypeLabel(ascentStore.latestUserAscent.attemptType) }}
        </div>
        <div v-if="ascentStore.latestUserAscent.userGrade">
          Your grade: {{ ascentStore.latestUserAscent.userGrade }}
        </div>
        <div class="mt-1">Total sends: {{ ascentStore.userSentCount }}</div>
      </div>
    </div>

    <!-- Ascent Form -->
    <form @submit.prevent="submitAscent" class="space-y-4">
      <!-- Attempt Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> How did you send it? </label>
        <div class="space-y-2">
          <div v-for="type in ascentStore.attemptTypes" :key="type.value" class="flex items-center">
            <input
              :id="`attempt-${type.value}`"
              v-model="formData.attemptType"
              :value="type.value"
              type="radio"
              name="attemptType"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              required
            />
            <label :for="`attempt-${type.value}`" class="ml-3 block text-sm">
              <div class="font-medium text-gray-900">{{ type.label }}</div>
              <div class="text-gray-500">{{ type.description }}</div>
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
          <option v-for="grade in ascentStore.grades" :key="grade" :value="grade">
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
        <label for="date" class="block text-sm font-medium text-gray-700 mb-1"> Date </label>
        <input
          id="date"
          v-model="formData.date"
          type="date"
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          :max="today"
          required
        />
      </div>

      <!-- Beta Video Upload -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2"> Beta Video (optional) </label>
        <VideoUpload
          v-model="formData.betaVideo"
          :location-id="locationId"
          :problem-id="problemId"
          :ascent-id="null"
          @upload-start="onVideoUploadStart"
          @upload-complete="onVideoUploadComplete"
          @upload-error="onVideoUploadError"
        />
        <p class="text-xs text-gray-500 mt-1">Share a video of your climbing technique</p>
      </div>

      <!-- Error Message -->
      <div v-if="ascentStore.error" class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex items-center">
          <svg
            class="w-5 h-5 text-red-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <p class="text-red-700 text-sm">{{ ascentStore.error }}</p>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="ascentStore.isLoading || !formData.attemptType || isVideoUploading"
        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center justify-center space-x-2"
      >
        <div
          v-if="ascentStore.isLoading || isVideoUploading"
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
        <span>
          {{ 
            isVideoUploading ? "Uploading video..." : 
            ascentStore.isLoading ? "Logging..." : 
            "Log Send" 
          }}
        </span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAscentStore } from "@/stores/ascentStore";
import VideoUpload from "@/components/VideoUpload.vue";

const props = defineProps({
  locationId: {
    type: String,
    required: true,
  },
  problemId: {
    type: String,
    required: true,
  },
});

const ascentStore = useAscentStore();

// Form data
const formData = ref({
  attemptType: "",
  userGrade: "",
  notes: "",
  date: new Date().toISOString().split("T")[0], // Today's date
  betaVideo: null, // Video upload data
});

// Video upload state
const isVideoUploading = ref(false);

// Get today's date for max date validation
const today = computed(() => {
  return new Date().toISOString().split("T")[0];
});

const emit = defineEmits(["ascent-logged"]);

const submitAscent = async () => {
  try {
    // Convert date string to Date object
    const ascentData = {
      ...formData.value,
      date: new Date(formData.value.date),
    };

    // Remove empty fields
    if (!ascentData.userGrade) {
      delete ascentData.userGrade;
    }
    if (!ascentData.notes) {
      delete ascentData.notes;
    }
    if (!ascentData.betaVideo) {
      delete ascentData.betaVideo;
    }

    console.log("Submitting ascent with data:", ascentData);

    await ascentStore.logAscent(ascentData);

    // Reset form
    formData.value = {
      attemptType: "",
      userGrade: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      betaVideo: null,
    };

    // Emit success event
    emit("ascent-logged");
  } catch (error) {
    console.error("Error logging ascent:", error);
    // Error is already handled by the store
  }
};

const onVideoUploadStart = () => {
  console.log("Video upload started");
  isVideoUploading.value = true;
};

const onVideoUploadComplete = (videoData) => {
  console.log("Video upload complete:", videoData);
  isVideoUploading.value = false;
  // Video data is already bound to formData.betaVideo via v-model
};

const onVideoUploadError = (error) => {
  console.error("Video upload error:", error);
  isVideoUploading.value = false;
  // Error handling could be added here if needed
};

// Initialize the store with props
ascentStore.initializeForProblem(props.locationId, props.problemId);
</script>
