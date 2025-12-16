<template>
  <!-- Floating indicator for active video analysis -->
  <div
    v-if="analysisQueue.hasActiveJobs || showCompleted"
    class="fixed bottom-4 right-4 z-50 animate-fade-in"
  >
    <button
      @click="handleClick"
      class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-3 group"
    >
      <!-- Animated spinner for active analysis -->
      <div
        v-if="analysisQueue.hasActiveJobs"
        class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
      ></div>
      <!-- Checkmark for completed -->
      <svg
        v-else
        class="w-5 h-5 text-green-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      
      <!-- Status text -->
      <div class="text-left">
        <div class="text-sm font-semibold">
          {{ analysisQueue.hasActiveJobs ? 'Analyzing Video' : 'Analysis Complete' }}
        </div>
        <div class="text-xs opacity-90">
          {{ analysisQueue.hasActiveJobs ? getProgressText() : 'Click to review' }}
        </div>
      </div>

      <!-- Expand icon -->
      <svg
        class="w-4 h-4 opacity-75 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>

      <!-- Close button for completed state -->
      <button
        v-if="!analysisQueue.hasActiveJobs"
        @click.stop="dismissCompleted"
        class="ml-1 -mr-1 p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useVideoAnalysisQueueStore, getCurrentStep } from '../stores/videoAnalysisQueueStore.js';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';

const router = useRouter();
const analysisQueue = useVideoAnalysisQueueStore();
const uploadQueue = useVideoUploadQueueStore();
const showCompleted = ref(false);
let completedTimeout = null;

// Check if there's an active upload for this job
const hasActiveUpload = computed(() => {
  const job = analysisQueue.getActiveJob;
  if (!job) return false;
  
  const upload = uploadQueue.uploads[job.ascentId];
  return upload && (upload.status === 'uploading' || upload.status === 'pending');
});

// Get upload progress if available
const getUploadProgress = computed(() => {
  const job = analysisQueue.getActiveJob;
  if (!job) return 0;
  
  const upload = uploadQueue.uploads[job.ascentId];
  return upload?.progress || 0;
});

const getProgressText = () => {
  const job = analysisQueue.getActiveJob;
  if (!job) return 'Processing...';
  
  const progress = Math.round(job.progress || 0);
  
  // Show upload progress if still uploading
  if (hasActiveUpload.value) {
    return `Uploading video... ${Math.round(getUploadProgress.value)}%`;
  }
  
  // Get current step object and show message with percentage
  const currentStep = getCurrentStep(job.progress || 0);
  return `${currentStep.message} ${progress}%`;
};

// Watch for analysis completion
watch(
  () => analysisQueue.hasActiveJobs,
  (hasActive, wasActive) => {
    // When analysis completes (was active, now not active)
    if (wasActive && !hasActive && analysisQueue.completedJobs.length > 0) {
      showCompleted.value = true;
      
      // Auto-dismiss after 10 seconds
      if (completedTimeout) clearTimeout(completedTimeout);
      completedTimeout = setTimeout(() => {
        showCompleted.value = false;
      }, 10000);
    }
  }
);

const handleClick = () => {
  // Navigate to location page if not already there
  // The modal is on LocationDetailView
  const job = analysisQueue.getActiveJob || analysisQueue.completedJobs[0];
  if (!job?.locationId) return;
  
  // Emit event to parent to maximize modal
  // This allows LocationDetailView to handle the modal maximization
  router.push(`/location/${job.locationId}`);
  
  // Use event bus or emit to notify LocationDetailView to maximize modal
  // For now, we'll use a simple custom event
  window.dispatchEvent(new CustomEvent('maximize-analysis-modal'));
};

const dismissCompleted = () => {
  showCompleted.value = false;
  if (completedTimeout) clearTimeout(completedTimeout);
};
</script>

<style scoped>
/* Fade-in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
