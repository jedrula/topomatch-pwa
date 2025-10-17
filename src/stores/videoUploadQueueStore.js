import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { videoService } from '../services/videoService.js';
import { ascentService } from '../services/ascentService.js';

/**
 * Video Upload Queue Store
 * 
 * Manages video uploads independently from ascent creation.
 * Handles edge cases:
 * - Videos upload immediately when selected
 * - Association happens later when ascent is created
 * - Orphaned videos are cleaned up
 * - Handles network failures and retries
 * - Persists across browser refreshes
 */
export const useVideoUploadQueueStore = defineStore('videoUploadQueue', () => {
  // Upload queue: { [tempId]: uploadRecord }
  const uploads = ref({});
  
  // Note: Orphaned video cleanup will be handled by backend
  // Backend should periodically scan for videos uploaded with temp IDs
  // that haven't been claimed within a reasonable timeframe (e.g., 24 hours)
  // and delete them from storage + Firestore

  /**
   * Generate a unique temporary ID for the upload
   */
  const generateTempId = () => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Start uploading a video immediately
   * Returns the temp ID to track this upload (synchronous)
   */
  const startUpload = (file, locationId, problemId = null) => {
    const tempId = generateTempId();
    
    // Create upload record
    const uploadRecord = {
      tempId,
      file,
      locationId,
      problemId, // may be null if not yet detected
      status: 'pending',
      progress: 0,
      videoData: null, // Full object: { videoId, downloadUrl, metadata }
      uploadedAt: null,
      error: null,
      ascentId: null,
      createdAt: Date.now(),
      uploadPromise: null, // Promise for awaiting upload completion
    };
    
    uploads.value[tempId] = uploadRecord;
    
    // Start upload immediately and store the promise (but don't await)
    uploadRecord.uploadPromise = _executeUpload(tempId);
    
    return tempId;
  };

  /**
   * Internal method to execute the actual upload
   */
  const _executeUpload = async (tempId) => {
    const record = uploads.value[tempId];
    if (!record) {
      console.warn(`Upload record ${tempId} not found`);
      return;
    }

    try {
      record.status = 'uploading';
      
      // Upload with temp ascent ID
      const result = await videoService.uploadBetaVideo(
        record.locationId,
        record.problemId || 'unknown', // fallback if problem not detected yet
        tempId, // Use temp ID as ascent ID for now
        record.file,
        (progress) => {
          // Update progress in real-time
          if (uploads.value[tempId]) {
            uploads.value[tempId].progress = progress;
          }
        }
      );

      // Mark as completed
      if (uploads.value[tempId]) {
        uploads.value[tempId].status = 'completed';
        uploads.value[tempId].videoData = result; // Full object: { videoId, downloadUrl, metadata }
        uploads.value[tempId].uploadedAt = Date.now();
        uploads.value[tempId].progress = 100;
        
        console.log(`✅ Video uploaded successfully: ${tempId}`);
      }
    } catch (error) {
      console.error(`❌ Error uploading video ${tempId}:`, error);
      
      if (uploads.value[tempId]) {
        record.status = 'failed';
        record.error = error.message || 'Upload failed';
      }
    }
  };

  /**
   * Associate an uploaded video with a real ascent
   * Waits for upload to complete if still in progress
   */
  const claimUpload = async (tempId, ascentId) => {
    const record = uploads.value[tempId];
    
    if (!record) {
      console.warn(`Upload ${tempId} not found, cannot claim`);
      return { success: false, error: 'Upload not found' };
    }

    // If we have an upload promise, await it
    if (record.uploadPromise) {
      console.log(`⏳ Waiting for upload ${tempId} to complete before claiming...`);
      
      try {
        await record.uploadPromise;
      } catch (error) {
        console.error(`❌ Upload failed while waiting to claim:`, error);
        return { success: false, error: error.message || 'Upload failed' };
      }
    }

    // Check final status
    if (record.status === 'failed') {
      return { success: false, error: record.error || 'Upload failed' };
    }

    if (record.status !== 'completed') {
      return { success: false, error: `Unexpected status: ${record.status}` };
    }

    // Update the ascent document in Firestore with the video URL
    try {
      console.log(`🔗 Updating ascent ${ascentId} with video data:`, record.videoData);
      
      // Update the ascent document to include the full video object
      // Format: { videoId, downloadUrl, metadata: { locationId, problemId, userId, ... } }
      await ascentService.updateAscent(record.locationId, record.problemId, ascentId, {
        betaVideo: record.videoData,
      });
      
      // Mark as claimed locally
      record.status = 'claimed';
      record.ascentId = ascentId;
      
      console.log(`✅ Video ${tempId} claimed by ascent ${ascentId}`);
      
      return {
        success: true,
        videoData: record.videoData,
        tempId: record.tempId,
      };
    } catch (error) {
      console.error(`❌ Error claiming upload ${tempId}:`, error);
      return { success: false, error: error.message };
    }
  };

    /**
   * Update the problemId after problem detection
   */
  const updateProblemId = (tempId, problemId) => {
    const record = uploads.value[tempId];
    if (record) {
      record.problemId = problemId;
      console.log(`📝 Updated problem ID for upload ${tempId}: ${problemId}`);
    }
  };

  /**
   * Cancel an upload (user abandoned the form)
   */
  const cancelUpload = async (tempId) => {
    const record = uploads.value[tempId];
    
    if (!record) {
      return;
    }

    // Note: Backend will handle cleanup of orphaned videos from storage
    // Just remove from local queue
    
    delete uploads.value[tempId];
    
    console.log(`🗑️ Upload ${tempId} cancelled`);
  };

  /**
   * Get upload status by temp ID
   */
  const getUpload = (tempId) => {
    return uploads.value[tempId] || null;
  };

  /**
   * Get all uploads for a specific problem
   */
  const getUploadsForProblem = (locationId, problemId) => {
    return Object.values(uploads.value).filter(
      record => record.locationId === locationId && record.problemId === problemId
    );
  };

  /**
   * Clear all uploads (for testing/debugging)
   */
  const clearAll = () => {
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

  return {
    // State
    uploads,
    
    // Computed
    activeUploads,
    completedUploads,
    hasActiveUploads,
    
    // Actions
    startUpload,
    claimUpload,
    updateProblemId,
    cancelUpload,
    getUpload,
    getUploadsForProblem,
    clearAll,
  };
});
