import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";
import { getCurrentUser } from "./authService";

export const videoService = {
  /**
   * Upload a beta video for a boulder problem ascent
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} ascentId - The ascent ID
   * @param {File} videoFile - The video file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{videoId: string, downloadUrl: string, metadata: Object}>}
   */
  async uploadBetaVideo(locationId, problemId, ascentId, videoFile, onProgress = null) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to upload videos");
      }

      // Validate file type
      if (!videoFile.type.startsWith("video/")) {
        throw new Error("File must be a video");
      }

      // Validate file size (limit to 100MB for beta videos)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        throw new Error("Video file size must be less than 100MB");
      }

      // Generate unique video ID
      const videoId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create storage path: locations/{locationId}/problems/{problemId}/videos/{videoId}
      const videoPath = `locations/${locationId}/problems/${problemId}/videos/${videoId}`;
      const storageRef = ref(storage, videoPath);

      // Create metadata
      const metadata = {
        customMetadata: {
          locationId,
          problemId,
          ascentId,
          userId: user.uid,
          uploadedBy: user.email || user.uid,
          originalName: videoFile.name,
          fileSize: videoFile.size.toString(),
          uploadedAt: new Date().toISOString(),
        },
        contentType: videoFile.type,
      };

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, videoFile, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress, snapshot.state);
            }
          },
          (error) => {
            console.error("Error uploading video:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              const result = {
                videoId,
                downloadUrl,
                metadata: {
                  ...metadata.customMetadata,
                  contentType: videoFile.type,
                  path: videoPath,
                },
              };

              console.log("Video uploaded successfully:", result);
              resolve(result);
            } catch (error) {
              console.error("Error getting download URL:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in uploadBetaVideo:", error);
      throw error;
    }
  },

  /**
   * Delete a beta video
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} videoId - The video ID
   * @returns {Promise<void>}
   */
  async deleteBetaVideo(locationId, problemId, videoId) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to delete videos");
      }

      const videoPath = `locations/${locationId}/problems/${problemId}/videos/${videoId}`;
      const storageRef = ref(storage, videoPath);

      await deleteObject(storageRef);
      console.log("Video deleted successfully:", videoId);
    } catch (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  },

  /**
   * Upload a beta video at location level (for AI processing)
   * @param {string} locationId - The location ID
   * @param {File} videoFile - The video file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{videoId: string, downloadUrl: string, metadata: Object}>}
   */
  async uploadLocationVideo(locationId, videoFile, onProgress = null) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("User must be authenticated to upload videos");
      }

      // Validate file type
      if (!videoFile.type.startsWith("video/")) {
        throw new Error("File must be a video");
      }

      // Validate file size (limit to 100MB for beta videos)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        throw new Error("Video file size must be less than 100MB");
      }

      // Generate unique video ID
      const videoId = `location-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create storage path for location-level videos: locations/{locationId}/location-videos/{videoId}
      const videoPath = `locations/${locationId}/location-videos/${videoId}`;
      const storageRef = ref(storage, videoPath);

      // Create metadata
      const metadata = {
        customMetadata: {
          locationId,
          userId: user.uid,
          uploadedBy: user.email || user.uid,
          originalName: videoFile.name,
          fileSize: videoFile.size.toString(),
          uploadedAt: new Date().toISOString(),
          videoType: "location-beta", // Distinguish from problem-specific videos
        },
      };

      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, videoFile, metadata);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              const result = {
                videoId,
                downloadUrl,
                metadata: {
                  locationId,
                  userId: user.uid,
                  uploadedBy: user.email || user.uid,
                  originalName: videoFile.name,
                  fileSize: videoFile.size,
                  uploadedAt: new Date().toISOString(),
                  videoType: "location-beta",
                  contentType: videoFile.type,
                  path: videoPath,
                },
              };

              console.log("Location video uploaded successfully:", result);
              resolve(result);
            } catch (error) {
              console.error("Error getting download URL:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in uploadLocationVideo:", error);
      throw error;
    }
  },

  /**
   * Get video metadata from download URL
   * @param {string} downloadUrl - The video download URL
   * @returns {Object} Parsed metadata from URL
   */
  getVideoMetadataFromUrl(downloadUrl) {
    try {
      const url = new URL(downloadUrl);
      const pathParts = url.pathname.split("/");

      // Extract video ID from path
      const videoId = pathParts[pathParts.length - 1];

      return {
        videoId,
        downloadUrl,
      };
    } catch (error) {
      console.error("Error parsing video URL:", error);
      return null;
    }
  },

  /**
   * Validate video file before upload
   * @param {File} file - The file to validate
   * @returns {Object} Validation result
   */
  validateVideoFile(file) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if it's a video file
    if (!file.type.startsWith("video/")) {
      result.isValid = false;
      result.errors.push("File must be a video");
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push("Video file size must be less than 100MB");
    }

    // Check file size warning (50MB)
    const warningSize = 50 * 1024 * 1024;
    if (file.size > warningSize) {
      result.warnings.push("Large video files may take longer to upload and process");
    }

    // Check supported formats
    const supportedFormats = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!supportedFormats.includes(file.type)) {
      result.warnings.push("For best compatibility, use MP4, WebM, or MOV format");
    }

    return result;
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Format video duration for display
   * @param {number} duration - Duration in seconds
   * @returns {string} Formatted duration (mm:ss)
   */
  formatDuration(duration) {
    if (!duration || isNaN(duration)) return "0:00";

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  },
};
