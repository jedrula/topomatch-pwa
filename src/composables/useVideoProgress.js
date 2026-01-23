/**
 * Shared composable for video upload and analysis progress
 * Used by VideoAnalysisIndicator (floating button) and LocationVideos (tile spinner)
 */

import { computed } from 'vue';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';
import { useVideoAnalysisQueueStore, getCurrentStep } from '../stores/videoAnalysisQueueStore.js';

/**
 * Get progress information for a video (upload + analysis)
 * @param {Object} video - Video object with id/ascentId
 * @returns {Object} - { progressText, progress, isUploading, isAnalyzing, hasActiveWork }
 */
export function useVideoProgress(video) {
  const uploadQueue = useVideoUploadQueueStore();
  const analysisQueue = useVideoAnalysisQueueStore();

  // Get upload status
  const upload = computed(() => {
    if (!video?.id) return null;
    return uploadQueue.uploads[video.id];
  });

  // Get analysis job status
  const analysisJob = computed(() => {
    if (!video?.id) return null;
    return analysisQueue.getJob(video.id);
  });

  // Check if uploading
  const isUploading = computed(() => {
    return upload.value && (upload.value.status === 'uploading' || upload.value.status === 'pending');
  });

  // Check if analyzing (has active analysis job)
  const isAnalyzing = computed(() => {
    return analysisJob.value && 
           analysisJob.value.status !== 'complete' && 
           analysisJob.value.status !== 'error';
  });

  // Has any active work
  const hasActiveWork = computed(() => {
    return isUploading.value || isAnalyzing.value;
  });

  // Get current progress percentage
  const progress = computed(() => {
    if (isUploading.value) {
      return Math.round(upload.value.progress || 0);
    }
    if (isAnalyzing.value) {
      return Math.round(analysisJob.value.progress || 0);
    }
    return 0;
  });

  // Get current progress text
  const progressText = computed(() => {
    // Priority 1: Show upload progress if uploading
    if (isUploading.value) {
      return `Uploading video... ${progress.value}%`;
    }

    // Priority 2: Show analysis progress if analyzing
    if (isAnalyzing.value) {
      const currentStep = getCurrentStep(analysisJob.value.progress || 0);
      return `${currentStep.message} ${progress.value}%`;
    }

    return 'Processing...';
  });

  // Get short status text (for compact display)
  const statusText = computed(() => {
    if (isUploading.value) {
      return 'Uploading';
    }
    if (isAnalyzing.value) {
      const currentStep = getCurrentStep(analysisJob.value.progress || 0);
      return currentStep.message.replace('...', ''); // Remove ellipsis for compact view
    }
    return 'Processing';
  });

  return {
    progressText,
    statusText,
    progress,
    isUploading,
    isAnalyzing,
    hasActiveWork,
    upload,
    analysisJob,
  };
}
