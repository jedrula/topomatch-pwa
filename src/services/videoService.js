import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  list,
  getMetadata,
} from 'firebase/storage';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';
import { getCurrentUser } from './authService';

export const videoService = {
  /**
   * Upload a beta video for a boulder problem ascent
   * Videos are automatically transcoded for optimal playback
   * @param {string} locationId - The location ID
   * @param {string} problemId - The boulder problem ID
   * @param {string} ascentId - The ascent ID
   * @param {File} videoFile - The video file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<{videoId: string, downloadUrl: string, metadata: Object, firestoreDocPath: string}>}
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

      // NEW PATH: videos/raw/{userId}/{videoId}.ext - this triggers transcoding
      const videoPath = `videos/raw/${user.uid}/${fileName}`;
      const storageRef = ref(storage, videoPath);

      // Create Firestore document first (with 'pending' status)
      const videoDocRef = doc(db, 'climbVideos', videoId);
      const videoData = {
        videoId,
        userId: user.uid,
        status: 'pending',
        originalPath: videoPath,
        originalFileName: videoFile.name,
        originalFileSize: videoFile.size,
        mimeType: videoFile.type,
        // Associated boulder problem metadata
        locationId,
        problemId,
        ascentId,
        uploadedBy: user.email || user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(videoDocRef, videoData);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, videoFile, {
        contentType: videoFile.type,
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
          async (error) => {
            console.error('Error uploading video:', error);
            // Update Firestore with error status
            try {
              await setDoc(
                videoDocRef,
                { status: 'error', error: error.message, updatedAt: serverTimestamp() },
                { merge: true }
              );
            } catch (e) {
              console.error('Failed to update error status:', e);
            }
            reject(error);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

              // Update Firestore with upload completion
              await setDoc(
                videoDocRef,
                {
                  originalDownloadURL: downloadUrl,
                  uploadedAt: serverTimestamp(),
                  status: 'uploaded', // Cloud Function will change this to 'processing'
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );

              const result = {
                videoId,
                downloadUrl,
                firestoreDocPath: `climbVideos/${videoId}`,
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
                  // Transcoding info
                  transcodingEnabled: true,
                  status: 'uploaded',
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
        throw new Error('User must be authenticated to delete videos');
      }

      const videoPath = `locations/${locationId}/problems/${problemId}/videos/${videoId}`;
      const storageRef = ref(storage, videoPath);

      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  /**
   * Load a climb video with automatic transcoding fallback
   * Tries transcoded version first (SD quality, optimized), falls back to original
   * @param {string} videoId - The video ID to load
   * @param {Object} options - Loading options
   * @param {string} options.quality - Preferred quality ('sd', 'hd'). Default: 'sd'
   * @param {Function} options.onStatusChange - Callback for status changes
   * @returns {Promise<{videoUrl: string, isTranscoded: boolean, status: string, videoData: Object}>}
   */
  async loadClimbVideo(videoId, options = {}) {
    try {
      const quality = options.quality || 'sd';

      // Get video document from Firestore
      const videoDocRef = doc(db, 'climbVideos', videoId);
      const docSnapshot = await getDoc(videoDocRef);

      if (!docSnapshot.exists()) {
        throw new Error('Video not found');
      }

      const data = docSnapshot.data();

      // Try to use transcoded version if ready
      if (data.status === 'ready' && data.transcodedVersions?.length > 0) {
        const transcodedVersion =
          data.transcodedVersions.find((v) => v.quality === quality) ||
          data.transcodedVersions[0]; // Fallback to first available quality

        if (transcodedVersion?.path) {
          try {
            // Get download URL from Storage
            const videoStorageRef = ref(storage, transcodedVersion.path);
            const url = await getDownloadURL(videoStorageRef);

            return {
              videoUrl: url,
              isTranscoded: true,
              status: data.status,
              videoData: data,
            };
          } catch (error) {
            console.warn('Failed to load transcoded version, falling back to original:', error);
          }
        }
      }

      // Fallback to original video
      if (data.originalDownloadURL) {
        return {
          videoUrl: data.originalDownloadURL,
          isTranscoded: false,
          status: data.status,
          videoData: data,
        };
      } else if (data.originalPath) {
        // If no download URL stored, fetch it from Storage
        const videoStorageRef = ref(storage, data.originalPath);
        const url = await getDownloadURL(videoStorageRef);

        return {
          videoUrl: url,
          isTranscoded: false,
          status: data.status,
          videoData: data,
        };
      }

      throw new Error('No video URL available');
    } catch (error) {
      console.error('Error loading climb video:', error);
      throw error;
    }
  },

  /**
   * Watch a climb video for real-time transcoding status updates
   * @param {string} videoId - The video ID to watch
   * @param {Function} callback - Callback function (videoData) => void
   * @returns {Function} Unsubscribe function
   */
  watchClimbVideo(videoId, callback) {
    const videoDocRef = doc(db, 'climbVideos', videoId);

    return onSnapshot(
      videoDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback(docSnapshot.data());
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error watching climb video:', error);
        callback(null, error);
      }
    );
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
      // Query /climbVideos collection for videos associated with this problem
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const climbVideosRef = collection(db, 'climbVideos');
      const q = query(
        climbVideosRef,
        where('problemId', '==', problemId),
        where('locationId', '==', locationId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const videos = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        try {
          // Load video URL using transcoding-aware function
          const videoResult = await this.loadClimbVideo(docSnapshot.id);
          
          const video = {
            id: docSnapshot.id,
            videoId: data.videoId,
            name: data.originalFileName || 'Beta Video',
            downloadUrl: videoResult.videoUrl,
            isTranscoded: videoResult.isTranscoded,
            status: data.status,
            size: videoResult.isTranscoded 
              ? (data.transcodedVersions?.[0]?.fileSize || data.originalFileSize)
              : data.originalFileSize,
            contentType: data.mimeType,
            uploadedAt: data.createdAt?.toDate?.() || new Date(),
            uploadedBy: data.uploadedBy || 'Unknown',
            userId: data.userId,
            ascentId: data.ascentId,
            locationId: data.locationId,
            problemId: data.problemId,
          };

          videos.push(video);
        } catch (error) {
          console.warn(`Failed to load video ${docSnapshot.id}:`, error);
          // Fallback to original URL if transcoded version fails
          if (data.originalDownloadURL) {
            const video = {
              id: docSnapshot.id,
              videoId: data.videoId,
              name: data.originalFileName || 'Beta Video',
              downloadUrl: data.originalDownloadURL,
              isTranscoded: false,
              status: data.status,
              size: data.originalFileSize,
              contentType: data.mimeType,
              uploadedAt: data.createdAt?.toDate?.() || new Date(),
              uploadedBy: data.uploadedBy || 'Unknown',
              userId: data.userId,
              ascentId: data.ascentId,
              locationId: data.locationId,
              problemId: data.problemId,
            };
            videos.push(video);
          }
        }
      }

      return videos;
    } catch (error) {
      console.error('Error fetching problem videos:', error);
      throw error;
    }
  },

  /**
   * Get all videos for a location (across all problems)
   * @param {string} locationId - The location ID
   * @returns {Promise<Array>} Array of video objects with metadata and problem info
   */
  async getLocationVideos(locationId) {
    try {
      const locationPath = `locations/${locationId}/problems/`;
      const listRef = ref(storage, locationPath);

      const result = await list(listRef, { delimiter: '/' });
      const allVideos = [];

      // Iterate through each problem folder
      for (const folder of result.prefixes) {
        const problemId = folder.name;
        try {
          const problemVideos = await this.getProblemVideos(locationId, problemId);
          // Add problem info to each video
          const videosWithProblemInfo = problemVideos.map((video) => ({
            ...video,
            problemId,
          }));
          allVideos.push(...videosWithProblemInfo);
        } catch (error) {
          console.warn(`Failed to get videos for problem ${problemId}:`, error);
        }
      }

      // Sort all videos by upload date (newest first)
      allVideos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      return allVideos;
    } catch (error) {
      console.error('Error fetching location videos:', error);
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
};
