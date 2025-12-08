import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  list,
  getMetadata,
} from 'firebase/storage';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { storage, db } from './firebase';
import { getCurrentUser } from './authService';

/**
 * Construct Firebase Storage download URL without network request
 * @param {string} storagePath - The storage path (e.g., "videos/raw/userId/video.mp4")
 * @returns {string} The download URL
 */
function constructStorageUrl(storagePath) {
  const useEmulators = import.meta.env.MODE === 'development' || import.meta.env.VITE_USE_EMULATORS === 'true';
  
  if (useEmulators) {
    // Emulator URL format
    const emulatorHost = import.meta.env.VITE_EMULATOR_HOST || window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    const encodedPath = encodeURIComponent(storagePath);
    return `http://${emulatorHost}:9199/v0/b/topomatch-pwa.firebasestorage.app/o/${encodedPath}?alt=media`;
  } else {
    // Production URL format
    const encodedPath = encodeURIComponent(storagePath);
    return `https://firebasestorage.googleapis.com/v0/b/topomatch-pwa.firebasestorage.app/o/${encodedPath}?alt=media`;
  }
}

export const videoService = {
  /**
   * Internal helper: Transform ascent document to video object with download URL
   * @private
   */
  async _transformAscentToVideo(docSnapshot) {
    const data = docSnapshot.data();
    
    // Skip if no video or video has error status
    if (!data.video || data.video.status === 'error') {
      return null;
    }
    
    try {
      // Get video URL
      // Use transcoded path if ready, otherwise use original (for emulator)
      const videoPath = data.video.status === 'ready'
        ? (data.video.transcodedPath || data.video.originalPath)
        : data.video.originalPath;
      
      // Handle corrupted data: video object exists but no path (use optional chaining)
      if (!videoPath?.trim()) {
        console.warn(`Ascent ${docSnapshot.id} has video object but no valid path:`, data.video);
        return null;
      }
      
      // Construct URL directly without network request
      const videoUrl = constructStorageUrl(videoPath);
      
      return {
        id: docSnapshot.id,
        videoId: docSnapshot.id,
        name: data.problemSnapshot?.name || 'Beta Video',
        downloadUrl: videoUrl,
        isTranscoded: !!data.video.transcodedPath,
        status: data.video.status,
        size: data.video.transcodedFileSize || data.video.fileSize,
        contentType: 'video/mp4',
        uploadedAt: data.video.uploadedAt?.toDate?.() || data.date?.toDate?.() || new Date(),
        uploadedBy: data.userName || 'Unknown',
        userId: data.userId,
        ascentId: docSnapshot.id,
        locationId: data.locationId,
        problemId: data.problemId,
        problemName: data.problemSnapshot?.name || 'Unknown Problem',
        thumbnailBase64: data.video.thumbnailBase64, // Include thumbnail if available
        metadata: {
          problemName: data.problemSnapshot?.name,
          problemGrade: data.problemSnapshot?.grade,
          attemptType: data.attemptType,
        }
      };
    } catch (error) {
      console.warn(`Failed to load video for ascent ${docSnapshot.id}:`, error);
      return null;
    }
  },

  /**
   * Upload a beta video to Firebase Storage
   * Videos are uploaded to videos/raw/{userId}/{videoId}.      return videos;
    } catch (error) {
      console.error('Error fetching location videos:', error);
      throw error;
    }
  },

  /**
   * Get all videos for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of video objects with metadata
   */
  async getUserVideos(userId) {
    try {
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const videos = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Skip if no video
        // Show videos with status: 'transcoding' (emulator) or 'ready' (production)
        if (!data.video || data.video.status === 'error') {
          continue;
        }
        
        try {
          // Get video URL
          // Use transcoded path if ready, otherwise use original (for emulator)
          const videoPath = data.video.status === 'ready'
            ? (data.video.transcodedPath || data.video.originalPath)
            : data.video.originalPath;
          
          if (!videoPath || videoPath.trim() === '') {
            console.warn(`Ascent ${docSnapshot.id} has video object but no valid path:`, data.video);
            continue;
          }
          
          // Construct URL directly without network request
          const videoUrl = constructStorageUrl(videoPath);
          
          const video = {
            id: docSnapshot.id,
            videoId: docSnapshot.id,
            name: data.problemSnapshot?.name || 'Beta Video',
            downloadUrl: videoUrl,
            isTranscoded: !!data.video.transcodedPath,
            status: data.video.status,
            size: data.video.transcodedFileSize || data.video.fileSize,
            contentType: 'video/mp4',
            uploadedAt: data.video.uploadedAt?.toDate?.() || data.date?.toDate?.() || new Date(),
            uploadedBy: data.userName || 'Unknown',
            userId: data.userId,
            ascentId: docSnapshot.id,
            locationId: data.locationId,
            problemId: data.problemId,
            problemName: data.problemSnapshot?.name || 'Unknown Problem',
            metadata: {
              problemName: data.problemSnapshot?.name,
              problemGrade: data.problemSnapshot?.grade,
              attemptType: data.attemptType,
            }
          };

          videos.push(video);
        } catch (error) {
          console.warn(`Failed to load video for ascent ${docSnapshot.id}:`, error);
        }
      }

      return videos;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  },

  /**
   * Get video count for a boulder problem triggers transcoding
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} ascentId - The ascent ID (can be temp ID during upload)
   * @param {File} videoFile - The video file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{videoId: string, downloadUrl: string, metadata: Object}>}
   */
  async uploadBetaVideo(locationId, problemId, ascentId, videoFile, onProgress = null) {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User must be authenticated to upload videos');
      }

      // Validate file type
      if (!videoFile.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      // Validate file size (limit to 500MB for videos with transcoding)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (videoFile.size > maxSize) {
        throw new Error('Video file size must be less than 500MB');
      }

      // Generate unique video ID
      const videoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Determine file extension from the original file
      const fileExtension = videoFile.name.split('.').pop() || 'mp4';
      const fileName = `${videoId}.${fileExtension}`;

      // Upload to videos/raw/{userId}/{videoId}.ext - this triggers transcoding
      const videoPath = `videos/raw/${user.uid}/${fileName}`;
      const storageRef = ref(storage, videoPath);

      // Upload file with progress tracking and custom metadata
      const uploadTask = uploadBytesResumable(storageRef, videoFile, {
        contentType: videoFile.type,
        customMetadata: {
          ascentId: ascentId,
          locationId: locationId,
          problemId: problemId,
          userId: user.uid,
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (onProgress) {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              onProgress(progress, snapshot.state);
            }
          },
          (error) => {
            console.error('Error uploading video:', error);
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
                  problemId,
                  ascentId,
                  userId: user.uid,
                  uploadedBy: user.email || user.uid,
                  originalName: videoFile.name,
                  fileSize: videoFile.size,
                  uploadedAt: new Date().toISOString(),
                  contentType: videoFile.type,
                  path: videoPath,
                },
              };

              resolve(result);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadBetaVideo:', error);
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
        throw new Error('User must be authenticated to upload videos');
      }

      // Validate file type
      if (!videoFile.type.startsWith('video/')) {
        throw new Error('File must be a video');
      }

      // Validate file size (limit to 100MB for beta videos)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (videoFile.size > maxSize) {
        throw new Error('Video file size must be less than 100MB');
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
          videoType: 'location-beta', // Distinguish from problem-specific videos
        },
      };

      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, videoFile, metadata);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload failed:', error);
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
                  videoType: 'location-beta',
                  contentType: videoFile.type,
                  path: videoPath,
                },
              };

              resolve(result);
            } catch (error) {
              console.error('Error getting download URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error in uploadLocationVideo:', error);
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
      const pathParts = url.pathname.split('/');

      // Extract video ID from path
      const videoId = pathParts[pathParts.length - 1];

      return {
        videoId,
        downloadUrl,
      };
    } catch (error) {
      console.error('Error parsing video URL:', error);
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
    if (!file.type.startsWith('video/')) {
      result.isValid = false;
      result.errors.push('File must be a video');
    }

    // Check file size (500MB limit - transcoding will optimize the file)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push('Video file size must be less than 500MB');
    }

    // Check file size warning (100MB)
    const warningSize = 100 * 1024 * 1024;
    if (file.size > warningSize) {
      result.warnings.push(
        'Large video files will be automatically transcoded for optimal playback'
      );
    }

    // Check supported formats
    const supportedFormats = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!supportedFormats.includes(file.type)) {
      result.warnings.push('For best compatibility, use MP4, WebM, or MOV format');
    }

    return result;
  },

  /**
   * Get all videos for a specific boulder problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @returns {Promise<Array>} Array of video objects with metadata
   */
  async getProblemVideos(locationId, problemId) {
    try {
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('problemId', '==', problemId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const videoPromises = querySnapshot.docs.map(doc => this._transformAscentToVideo(doc));
      const videos = (await Promise.all(videoPromises)).filter(v => v !== null);

      return videos;
    } catch (error) {
      console.error('Error fetching problem videos:', error);
      throw error;
    }
  },

  /**
   * Get all videos for a location (across all problems)
   * @param {string} locationId - The location ID
   * @returns {Promise<Array>} Array of video objects with metadata
   */
  async getLocationVideos(locationId) {
    try {
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('locationId', '==', locationId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const videoPromises = querySnapshot.docs.map(doc => this._transformAscentToVideo(doc));
      const videos = (await Promise.all(videoPromises)).filter(v => v !== null);

      return videos;
    } catch (error) {
      console.error('Error fetching location videos:', error);
      throw error;
    }
  },

  /**
   * Get a single video by ascent ID
   * @param {string} ascentId - The ascent ID
   * @returns {Promise<Object|null>} Video object with metadata or null
   */
  async getVideoByAscentId(ascentId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const ascentRef = doc(db, 'ascents', ascentId);
      const docSnapshot = await getDoc(ascentRef);
      
      if (!docSnapshot.exists()) {
        console.warn(`Ascent ${ascentId} not found`);
        return null;
      }
      
      return await this._transformAscentToVideo(docSnapshot);
    } catch (error) {
      console.error(`Error fetching video for ascent ${ascentId}:`, error);
      return null;
    }
  },

  /**
   * Get all videos for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of video objects with metadata
   */
  async getUserVideos(userId) {
    try {
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const ascentsRef = collection(db, 'ascents');
      const q = query(
        ascentsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const videoPromises = querySnapshot.docs.map(doc => this._transformAscentToVideo(doc));
      const videos = (await Promise.all(videoPromises)).filter(v => v !== null);

      return videos;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  },

  /**
   * Get video count for a specific problem
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @returns {Promise<number>} Number of videos for the problem
   */
  async getProblemVideoCount(locationId, problemId) {
    try {
      const videos = await this.getProblemVideos(locationId, problemId);
      return videos.length;
    } catch (error) {
      console.warn(`Failed to get video count for problem ${problemId}:`, error);
      return 0;
    }
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format video duration for display
   * @param {number} duration - Duration in seconds
   * @returns {string} Formatted duration (mm:ss)
   */
  formatDuration(duration) {
    if (!duration || isNaN(duration)) return '0:00';

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Delete a video (deletes the associated ascent)
   * Videos are embedded in ascents, so deleting a video means deleting the ascent
   * The onAscentDeleted Cloud Function will handle video file cleanup
   * @param {string} ascentId - The ascent ID (same as video ID in new architecture)
   * @returns {Promise<void>}
   */
  async deleteVideo(ascentId) {
    try {
      // Import ascentService dynamically to avoid circular dependency
      const { ascentService } = await import('./ascentService.js');
      await ascentService.deleteAscent(ascentId);
    } catch (error) {
      console.error('Error deleting video/ascent:', error);
      throw error;
    }
  },
};

export default videoService;
