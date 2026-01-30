import { ref } from 'vue';
import { videoService } from '@/services/videoService';
import { getCurrentUser } from '@/services/authService';

/**
 * Composable for handling video deletion
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback after successful deletion (receives deletedVideoId)
 * @returns {Object} Delete state and methods
 */
export function useVideoDelete(options = {}) {
  const { onSuccess } = options;

  const showDeleteConfirm = ref(false);
  const videoToDelete = ref(null);
  const deleting = ref(false);

  /**
   * Check if current user can delete a video
   */
  const canDeleteVideo = (video) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    return video.userId === currentUser.uid;
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = (video) => {
    videoToDelete.value = video;
    showDeleteConfirm.value = true;
  };

  /**
   * Cancel deletion and close dialog
   */
  const cancelDelete = () => {
    if (deleting.value) return;
    showDeleteConfirm.value = false;
    videoToDelete.value = null;
  };

  /**
   * Confirm and execute video deletion
   */
  const confirmDelete = async () => {
    if (!videoToDelete.value || deleting.value) return;

    try {
      deleting.value = true;
      
      const deletedVideoId = videoToDelete.value.id;
      
      // Delete the video using videoService
      await videoService.deleteVideo(deletedVideoId);
      
      // Close dialog
      showDeleteConfirm.value = false;
      videoToDelete.value = null;

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(deletedVideoId);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert(`Failed to delete video: ${error.message}`);
    } finally {
      deleting.value = false;
    }
  };

  return {
    // State
    showDeleteConfirm,
    videoToDelete,
    deleting,
    
    // Methods
    canDeleteVideo,
    handleDeleteClick,
    cancelDelete,
    confirmDelete,
  };
}
