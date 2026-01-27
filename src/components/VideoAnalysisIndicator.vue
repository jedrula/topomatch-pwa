<template>
  <!-- Floating indicator for active video upload/analysis -->
  <div
    v-if="hasActiveWork || showCompleted"
    class="fixed bottom-4 right-4 z-50 animate-fade-in"
  >
    <button
      @click="handleClick"
      class="px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
    >
      <!-- Animated spinner for active work -->
      <div
        v-if="hasActiveWork"
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
          {{ statusText }}
        </div>
        <div class="text-xs opacity-90">
          {{ statusDetail }}
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

      <!-- Close button for completed/failed state -->
      <button
        v-if="!hasActiveWork"
        @click.stop="dismiss"
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
import { ref, computed, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVideoAnalysisQueueStore } from '../stores/videoAnalysisQueueStore.js';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';
import { useVideoProgress } from '../composables/useVideoProgress.js';

const router = useRouter();
const analysisQueue = useVideoAnalysisQueueStore();
const uploadQueue = useVideoUploadQueueStore();
const showCompleted = ref(false);
let completedTimeout = null;

// Get the active job/video from BOTH queues
// Priority: analysis queue first, then upload queue
const activeJobData = computed(() => {
  // Check analysis queue first
  const analysisJob = analysisQueue.getActiveJob;
  if (analysisJob) {
    return { id: analysisJob.ascentId };
  }
  
  // Check upload queue for any active uploads
  const activeUploads = Object.values(uploadQueue.uploads).filter(
    upload => upload.status === 'uploading' || upload.status === 'pending'
  );
  
  if (activeUploads.length > 0) {
    // Return the first active upload
    return { id: activeUploads[0].ascentId };
  }
  
  return null;
});

// Use shared composable for progress tracking
const activeVideo = computed(() => {
  if (!activeJobData.value) return null;
  return useVideoProgress(activeJobData.value);
});

// Has any active work (upload or analysis)
const hasActiveWork = computed(() => {
  return activeVideo.value?.hasActiveWork || false;
});

// Status display text
const statusText = computed(() => {
  if (hasActiveWork.value) {
    return activeVideo.value?.isUploading ? 'Uploading Video' : 'Analyzing Video';
  }
  return 'Processing Complete';
});

const statusDetail = computed(() => {
  if (hasActiveWork.value) return activeVideo.value?.progressText;
  return 'Click to review';
});

// Watch for work completion - show success message briefly
watch(
  () => hasActiveWork.value,
  (hasActive, wasActive) => {
    // When work completes (transition from active → inactive)
    if (wasActive && !hasActive) {
      showCompleted.value = true;
      
      // Auto-dismiss after 10 seconds
      if (completedTimeout) clearTimeout(completedTimeout);
      completedTimeout = setTimeout(() => {
        showCompleted.value = false;
      }, 10000);
    }
  }
);

// Cleanup timeout on unmount
onUnmounted(() => {
  if (completedTimeout) clearTimeout(completedTimeout);
});

const handleClick = () => {
  // Navigate to location page if not already there
  // The modal is on LocationDetailView
  const job = analysisQueue.getActiveJob || analysisQueue.completedJobs[0];
  if (!job?.locationId) return;
  
  // Navigate to location (where user can see video list with progress)
  router.push(`/location/${job.locationId}`);
  // For now, we'll use a simple custom event
  window.dispatchEvent(new CustomEvent('maximize-analysis-modal'));
};

const dismiss = () => {
  if (showCompleted.value) {
    showCompleted.value = false;
    if (completedTimeout) clearTimeout(completedTimeout);
  }
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
