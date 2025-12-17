import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { videoService } from '../services/videoService.js';

/**
 * Video Upload Queue Store
 * 
 * Simplified: Videos are uploaded with pre-generated ascentId from client.
 * No temp IDs, no claiming - just track upload progress.
 */
export const useVideoUploadQueueStore = defineStore('videoUploadQueue', () => {
  // Upload queue: { [ascentId]: uploadRecord }
  const uploads = ref({});

  /**
   * Start uploading a video with a pre-generated ascentId
   * @param {File} file - The video file
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {string} ascentId - The pre-generated ascent ID
   * @returns {string} The ascentId for tracking
   */
  const startUpload = (file, locationId, problemId, ascentId) => {
    // Create blob URL for local video playback (instant UX)
    const localUrl = URL.createObjectURL(file);
    
    // Create upload record
    const uploadRecord = {
      ascentId,
      file,
      localUrl,  // Store blob URL for reuse
      locationId,
      problemId,
      status: 'pending',
      progress: 0,
      videoData: null,
      uploadedAt: null,
      error: null,
      createdAt: Date.now(),
      uploadPromise: null,
    };
    
    uploads.value[ascentId] = uploadRecord;
    
    // Start upload immediately
    uploadRecord.uploadPromise = _executeUpload(ascentId);
    
    return ascentId;
  };

  /**
   * Internal method to execute the actual upload
   */
  const _executeUpload = async (ascentId) => {
    const record = uploads.value[ascentId];
    if (!record) {
      console.warn(`Upload record ${ascentId} not found`);
      return;
    }

    try {
      record.status = 'uploading';
      
      // Upload with real ascent ID
      const result = await videoService.uploadBetaVideo(
        record.locationId,
        record.problemId,
        ascentId,
        record.file,
        (progress) => {
          // Update progress in real-time
          console.log(`[PROGRESS] 📤 [UPLOAD] Ascent ${ascentId}: ${progress.toFixed(1)}%`);
          if (uploads.value[ascentId]) {
            uploads.value[ascentId].progress = progress;
          }
        }
      );

      // Mark as completed
      console.log(`[PROGRESS] ✅ [UPLOAD] Ascent ${ascentId}: Upload complete (100%)`);
      if (uploads.value[ascentId]) {
        uploads.value[ascentId].status = 'completed';
        uploads.value[ascentId].videoData = result;
        uploads.value[ascentId].uploadedAt = Date.now();
        uploads.value[ascentId].progress = 100;
      }
    } catch (error) {
      console.error(`❌ Error uploading video for ascent ${ascentId}:`, error);
      
      if (uploads.value[ascentId]) {
        uploads.value[ascentId].status = 'failed';
        uploads.value[ascentId].error = error.message || 'Upload failed';
      }
    }
  };

  /**
   * Wait for an upload to complete
   * @param {string} ascentId - The ascent ID to wait for
   * @returns {Promise<Object>} The upload result
   */
  const waitForUpload = async (ascentId) => {
    const record = uploads.value[ascentId];
    
    if (!record) {
      throw new Error(`Upload ${ascentId} not found`);
    }

    // Wait for upload promise to complete
    if (record.uploadPromise) {
      await record.uploadPromise;
    }

    // Check final status
    if (record.status === 'failed') {
      throw new Error(record.error || 'Upload failed');
    }

    if (record.status !== 'completed') {
      throw new Error(`Unexpected upload status: ${record.status}`);
    }

    return record.videoData;
  };

  /**
   * Get upload status by ascent ID
   */
  const getUpload = (ascentId) => {
    return uploads.value[ascentId] || null;
  };

  /**
   * Cancel an upload
   */
  const cancelUpload = async (ascentId) => {
    const record = uploads.value[ascentId];
    
    if (!record) {
      return;
    }

    // Clean up blob URL if it exists
    if (record.localUrl) {
      try {
        URL.revokeObjectURL(record.localUrl);
      } catch (err) {
        console.error(`Failed to revoke blob URL for ${ascentId}:`, err);
      }
    }

    delete uploads.value[ascentId];
  };

  /**
   * Clear all uploads (for testing/debugging)
   */
  const clearAll = () => {
    // Clean up all blob URLs first
    Object.values(uploads.value).forEach(record => {
      if (record.localUrl) {
        try {
          URL.revokeObjectURL(record.localUrl);
        } catch (err) {
          console.error(`Failed to revoke blob URL for ${record.ascentId}:`, err);
        }
      }
    });
    
    uploads.value = {};
  };

  // Computed properties
  const activeUploads = computed(() => {
    return Object.values(uploads.value).filter(
      record => record.status === 'uploading' || record.status === 'pending'
    );
  });

  const completedUploads = computed(() => {
    return Object.values(uploads.value).filter(
      record => record.status === 'completed'
    );
  });

  const hasActiveUploads = computed(() => {
    return activeUploads.value.length > 0;
  });

  /**
   * Get active uploads for a specific problem
   * @param {string} problemId - The problem ID
   * @returns {Array} Active uploads for this problem
   */
  const getActiveUploadsForProblem = (problemId) => {
    return Object.values(uploads.value).filter(
      record => record.problemId === problemId && 
                (record.status === 'uploading' || record.status === 'pending')
    );
  };

  return {
    // State
    uploads,
    
    // Computed
    activeUploads,
    completedUploads,
    hasActiveUploads,
    
    // Actions
    startUpload,
    waitForUpload,
    cancelUpload,
    getUpload,
    getActiveUploadsForProblem,
    clearAll,
  };
});
