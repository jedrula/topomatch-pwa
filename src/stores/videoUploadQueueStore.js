import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { videoService } from '../services/videoService.js';
import { diagnostics } from '../services/diagnostics.js';

/**
 * Video Upload Queue Store
 * 
 * Simplified: Videos are uploaded with pre-generated ascentId from client.
 * No temp IDs, no claiming - just track upload progress.
 */
export const useVideoUploadQueueStore = defineStore('videoUploadQueue', () => {
  // Upload queue: { [ascentId]: uploadRecord }
  const uploads = ref({});
  
  // Callbacks for when videos become ready (used by views to update their lists)
  const videoReadyCallbacks = ref([]);

  /**
   * Start uploading a video with a pre-generated ascentId
   * @param {File} file - The video file
   * @param {string} locationId - The location ID
   * @param {string} problemId - The problem ID
   * @param {string} ascentId - The pre-generated ascent ID
   * @param {Object} metadata - Optional metadata (locationName, problemName)
   * @returns {string} The ascentId for tracking
   */
  const startUpload = (file, locationId, problemId, ascentId, metadata = {}) => {
    // Create blob URL for local video playback (instant UX)
    const localUrl = URL.createObjectURL(file);
    
    // Create upload record
    const uploadRecord = {
      ascentId,
      file,
      localUrl,  // Store blob URL for reuse
      // thumbnailUrl will be generated server-side after transcoding
      locationId,
      locationName: metadata.locationName || null,  // Store for display
      problemId,
      problemName: metadata.problemName || null,  // Store for display
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
      
      diagnostics.log('info', 'Video upload started', {
        ascentId,
        fileSize: record.file.size,
        fileType: record.file.type
      });

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

      // Mark as completed and start tracking server-side processing
      console.log(`[PROGRESS] ✅ [UPLOAD] Ascent ${ascentId}: Upload complete (100%)`);
      if (uploads.value[ascentId]) {
        uploads.value[ascentId].status = 'server-processing';
        uploads.value[ascentId].videoData = result;
        uploads.value[ascentId].uploadedAt = Date.now();
        uploads.value[ascentId].progress = 100;
        
        // Start listening for server-side processing updates
        _startServerProcessingListener(ascentId);
      }
      
      diagnostics.log('info', 'Video upload completed', {
        ascentId,
        fileSize: record.file?.size
      });
    } catch (error) {
      console.error(`❌ Error uploading video for ascent ${ascentId}:`, error);
      
      diagnostics.log('error', 'Video upload failed', {
        ascentId,
        error: error.message,
        code: error.code,
        fileSize: record.file?.size
      });
      
      if (uploads.value[ascentId]) {
        uploads.value[ascentId].status = 'failed';
        uploads.value[ascentId].error = error.message || 'Upload failed';
      }
    }
  };

  /**
   * Listen for server-side processing updates (transcoding + thumbnail generation)
   */
  const _startServerProcessingListener = async (ascentId) => {
    try {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../services/firebase.js');
      
      const ascentRef = doc(db, 'ascents', ascentId);
      
      // Listen for video status updates
      const unsubscribe = onSnapshot(ascentRef, (snapshot) => {
        if (!snapshot.exists()) return;
        
        const data = snapshot.data();
        const record = uploads.value[ascentId];
        if (!record) {
          // Upload record removed, stop listening
          unsubscribe();
          return;
        }
        
        // ✅ Check for problem detection IMMEDIATELY (independent of video status)
        // Analysis writes problemId/problemSnapshot as soon as it completes
        if (data.problemId && data.problemSnapshot) {
          if (!record.problemId) {
            // First time detecting problem - log it
            console.log(`[PROGRESS] 🎯 [ANALYSIS] Ascent ${ascentId}: Problem detected - ${data.problemSnapshot.name}`);
          }
          record.problemId = data.problemId;
          record.problemName = data.problemSnapshot.name;
        }
        
        // Check video processing status
        if (data.video?.status === 'transcoding') {
          console.log(`[PROGRESS] 🎬 [SERVER] Ascent ${ascentId}: Transcoding video...`);
          record.status = 'transcoding';
        } else if (data.video?.status === 'failed') {
          console.log(`[PROGRESS] ❌ [SERVER] Ascent ${ascentId}: Video processing failed - ${data.video?.error || 'Unknown error'}`);
          record.status = 'failed';
          record.error = data.video?.error || 'Video processing failed';
        } else if (data.video?.status === 'ready') {
          console.log(`[PROGRESS] 🖼️  [SERVER] Ascent ${ascentId}: Video transcoded, generating thumbnail...`);
          record.status = 'generating-thumbnail';
          record.isTranscoded = true;  // ✅ Mark as transcoded (HD ready!)
          
          // Check if thumbnail is ready
          if (data.video?.thumbnailUrl) {
            console.log(`[PROGRESS] ✨ [SERVER] Ascent ${ascentId}: Processing complete!`);
            record.status = 'ready';
            record.thumbnailUrl = data.video.thumbnailUrl;
            
            // Notify any registered callbacks with full video data
            videoReadyCallbacks.value.forEach(callback => {
              callback({
                ascentId,
                locationId: data.locationId,
                videoData: data // Full ascent document data
              });
            });
            
            // Stop listening - fully complete
            unsubscribe();
          }
        }
      });
      
      // Store unsubscribe for cleanup
      if (uploads.value[ascentId]) {
        uploads.value[ascentId].serverListener = unsubscribe;
      }
    } catch (error) {
      console.error(`Error setting up server processing listener for ${ascentId}:`, error);
    }
  };

  /**
   * Wait for an upload to complete (upload phase, not full server processing)
   * Resolves when file upload finishes and server processing begins
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

    // Upload is successful if it reached any server-side processing status
    const successStatuses = ['server-processing', 'transcoding', 'generating-thumbnail', 'ready'];
    if (!successStatuses.includes(record.status)) {
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

    // Stop server processing listener if active
    if (record.serverListener && typeof record.serverListener === 'function') {
      try {
        record.serverListener();
        console.log(`🔇 Stopped server processing listener for ${ascentId}`);
      } catch (err) {
        console.error(`Failed to stop listener for ${ascentId}:`, err);
      }
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
    const successStatuses = ['server-processing', 'transcoding', 'generating-thumbnail', 'ready'];
    return Object.values(uploads.value).filter(
      record => successStatuses.includes(record.status)
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

  /**
   * Register a callback to be notified when videos become ready
   * @param {Function} callback - Called with { ascentId, locationId, videoData }
   * @returns {Function} Unregister function
   */
  const onVideoReady = (callback) => {
    videoReadyCallbacks.value.push(callback);
    
    // Return unregister function
    return () => {
      const index = videoReadyCallbacks.value.indexOf(callback);
      if (index > -1) {
        videoReadyCallbacks.value.splice(index, 1);
      }
    };
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
    onVideoReady,
  };
});
