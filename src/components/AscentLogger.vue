<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Log Ascent</h3>
    <!-- Previous Ascents Summary -->
    <div
      v-if="ascentStore.hasUserSent"
      class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
    >
      <div class="fle  );
    if (pendingUploads.length > 0) {
    console.log('Found pending uploads:', pendingUploads.length);
    
    // Use the most recent one
    const mostRecent = pendingUploads.sort((a, b) => b.createdAt - a.createdAt)[0]; (pendingUploads.length > 0) {
    console.log('Found pending video uploads for this problem:', pendingUploads.length);
    
    // Use the most recent one(pendingUploads.length > 0) {
    console.log('Found ' + pendingUploads.length + ' pending video uploads for this problem');tems-center space-x-2 mb-2">
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

        <!-- AI Visual Confirmation -->
        <div
          v-if="aiAnalysisData && formData.betaVideo"
          class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-start space-x-2 mb-3">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5"
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
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-800">🤖 AI Analysis Complete</h4>
              <p class="text-xs text-blue-600">
                Your video was automatically matched to this problem:
              </p>
            </div>
          </div>

          <!-- Visual Confirmation -->
          <div class="bg-white border border-blue-200 rounded-lg p-3">
            <div class="flex items-start space-x-4">
              <!-- Boulder Image with Problem Highlight -->
              <div class="flex-shrink-0">
                <BoulderImageWithHolds
                  v-if="aiAnalysisData.matchedImage"
                  :image-url="aiAnalysisData.matchedImage.url"
                  :image-alt="aiAnalysisData.matchedImage.name"
                  :problems="aiAnalysisData.problem ? [aiAnalysisData.problem] : []"
                  image-class="w-32 h-32 object-contain rounded border"
                  :show-holds="true"
                  :selected-problem-id="aiAnalysisData.problem?.id"
                />
                <p class="text-xs text-gray-500 mt-1 text-center max-w-32 truncate">
                  {{ aiAnalysisData.matchedImage?.name || "Boulder Image" }}
                </p>
              </div>

              <!-- Problem Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <div
                    v-if="aiAnalysisData.detectedProblem?.grade"
                    class="w-3 h-3 rounded-full"
                    :style="{
                      backgroundColor: getGradeColor(aiAnalysisData.detectedProblem.grade),
                    }"
                  ></div>
                  <span class="font-medium text-gray-900">{{
                    aiAnalysisData.detectedProblem?.name || "Detected Problem"
                  }}</span>
                  <span v-if="aiAnalysisData.detectedProblem?.grade" class="text-sm text-gray-600">
                    {{ getGradeLabel(aiAnalysisData.detectedProblem.grade) }}
                  </span>
                </div>

                <p
                  v-if="aiAnalysisData.detectedProblem?.description"
                  class="text-sm text-gray-600 mb-2"
                >
                  {{ aiAnalysisData.detectedProblem.description }}
                </p>

                <!-- Analysis Confidence -->
                <div class="text-xs text-gray-500 space-y-1">
                  <div v-if="aiAnalysisData.confidence">
                    <strong>Match confidence:</strong>
                    {{ Math.round(aiAnalysisData.confidence * 100) }}%
                  </div>
                  <div v-if="aiAnalysisData.keypoints">
                    <strong>Keypoints analyzed:</strong> {{ aiAnalysisData.keypoints }} poses
                    detected
                  </div>
                </div>

                <!-- Verification -->
                <div class="mt-2 flex items-center space-x-2 text-xs">
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
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span class="text-green-700">Video will be tagged with this problem</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Auto-upload indicator -->
        <div
          v-if="isVideoUploading && formData.notes.includes('🤖')"
          class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <div>
              <p class="text-sm font-medium text-blue-800">🤖 AI-Detected Video</p>
              <p class="text-xs text-blue-600">
                Uploading video automatically matched by AI analysis...
              </p>
            </div>
          </div>
        </div>

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
            isVideoUploading
              ? "Uploading video..."

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAscentStore } from '@/stores/ascentStore';
import { useVideoUploadQueueStore } from '@/stores/videoUploadQueueStore';
import VideoUpload from '@/components/VideoUpload.vue';
import BoulderImageWithHolds from '@/components/BoulderImageWithHolds.vue';
import { getGradeLabel, getGradeColor } from '@/utils/gradingUtils';

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

const route = useRoute();
const ascentStore = useAscentStore();
const videoUploadQueue = useVideoUploadQueueStore();

// Form data
const formData = ref({
  attemptType: '',
  userGrade: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  betaVideo: null,
});

// Video upload state
const isVideoUploading = ref(false);
const aiAnalysisData = ref(null);
const currentUploadTempId = ref(null);

onMounted(() => {
  // Check if we have a temp upload ID from query params (coming from video analysis)
  if (route.query.uploadTempId) {
    currentUploadTempId.value = route.query.uploadTempId;
    console.log(`📌 Tracking upload: ${route.query.uploadTempId}`);
  }
  
  // Also check for any pending uploads for this problem
  checkForPendingUploads();
});

const checkForPendingUploads = () => {
  const pendingUploads = videoUploadQueue.getUploadsForProblem(
    props.locationId,
    props.problemId
  );
  
  if (pendingUploads.length > 0) {
    console.log('Found pending uploads:', pendingUploads.length);
    const mostRecent = pendingUploads.sort((a, b) => b.createdAt - a.createdAt)[0];
    
    // Only set if we don't already have one from query params
    if (!currentUploadTempId.value && (mostRecent.status === 'completed' || mostRecent.status === 'uploading')) {
      currentUploadTempId.value = mostRecent.tempId;
      if (mostRecent.status === 'uploading') {
        isVideoUploading.value = true;
      }
    }
  }
};

const today = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const emit = defineEmits(['ascent-logged']);

const submitAscent = async () => {
  try {
    const ascentData = {
      ...formData.value,
      date: new Date(formData.value.date),
    };

    if (!ascentData.userGrade) delete ascentData.userGrade;
    if (!ascentData.notes) delete ascentData.notes;
    if (!ascentData.betaVideo) delete ascentData.betaVideo;

    await ascentStore.logAscent(ascentData);
    
    if (currentUploadTempId.value) {
      const latestAscent = ascentStore.latestUserAscent;
      
      if (latestAscent && latestAscent.id) {
        const result = await videoUploadQueue.claimUpload(
          currentUploadTempId.value,
          latestAscent.id
        );
        
        if (result.success) {
          console.log('Video successfully associated with ascent');
        } else {
          console.error('Failed to associate video:', result.error);
        }
      }
      
      currentUploadTempId.value = null;
    }

    formData.value = {
      attemptType: '',
      userGrade: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      betaVideo: null,
    };

    emit('ascent-logged');
  } catch (error) {
    console.error('Error logging ascent:', error);
  }
};

const onVideoUploadStart = () => {
  isVideoUploading.value = true;
};

const onVideoUploadComplete = () => {
  isVideoUploading.value = false;
};

const onVideoUploadError = (error) => {
  console.error('Video upload error:', error);
  isVideoUploading.value = false;
};

ascentStore.initializeForProblem(props.locationId, props.problemId);
</script>

