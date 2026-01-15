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
import { ascentService } from './ascentService';

/**
 * Construct Firebase Storage download URL without network request
 * @param {string} storagePath - The storage path (e.g., "videos/raw/userId/video.mp4")
 * @returns {string} The download URL
 */
import { isUsingEmulators } from '../utils/platform.js';

export function constructStorageUrl(storagePath) {
  const useEmulators = isUsingEmulators();
  
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

/**
 * Get video URL from ascent video data
 * @param {Object} video - The video object from ascent
 * @returns {string} The video URL
 */
export function getVideoUrlFromAscent(video) {
  if (!video) return null;
  
  // If direct URL exists, use it
  if (video.downloadUrl || video.url) {
    return video.downloadUrl || video.url;
  }
  
  // Otherwise construct from path
  const videoPath = video.status === 'ready'
    ? (video.transcodedPath || video.originalPath)
    : video.originalPath;
  
  return videoPath ? constructStorageUrl(videoPath) : null;
}

export const videoService = {
  /**
   * Internal helper: Transform ascent document to video object with download URL
   * @private
   */
  _transformAscentToVideo(docSnapshot) {
    const data = docSnapshot.data();
    
    // Skip if no video or video has error status
    if (!data.video || data.video.status === 'error') {
      return null;
    }
    
    try {
      // Get video URL
      // Use transcoded path if ready, otherwise use original (for emulator)
      // Note: In emulator, transcoding doesn't run, so videos stay at status='transcoding'
      // and we play them using originalPath
      const videoPath = data.video.status === 'ready'
        ? (data.video.transcodedPath || data.video.originalPath)
        : data.video.originalPath;
      
      // Handle corrupted data or videos that failed during upload
      // Still return the ascent object even without a valid path (for re-analysis UI)
      let videoUrl = null;
      if (videoPath?.trim()) {
        // Construct URL directly without network request
        videoUrl = constructStorageUrl(videoPath);
      } else {
        console.warn(`Ascent ${docSnapshot.id} has no valid video path (status: ${data.video.status})`);
      }
      
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
        locationName: data.locationName || null,
        problemId: data.problemId,
        problemName: data.problemSnapshot?.name || 'Unknown Problem',
        routesetting: data.routesetting || null, // For filtering unassigned videos
        thumbnailUrl: data.video.thumbnailUrl, // Include thumbnail if available
        likeCount: data.likeCount || 0, // Like count from ascent document
        likedByUserIds: data.likedByUserIds || [], // Array of user IDs who liked
        commentCount: data.commentCount || 0, // Comment count from ascent document
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
   * @param {number} limitCount - Maximum number of videos to fetch
   * @param {number} offset - Number of videos to skip (for pagination)
   * @returns {Promise<Array>} Array of video objects with metadata
   */
  async getUserVideos(userId, limitCount = 20, offset = 0) {
    try {
      // Reuse getUserAscents from ascentService and transform the results
      const ascents = await ascentService.getUserAscents(userId, limitCount, offset);
      
      // Transform each ascent to video format
      const videos = ascents
        .map(ascent => {
          // Create a mock doc object for the transform function
          const mockDoc = {
            id: ascent.id,
            data: () => ascent
          };
          return this._transformAscentToVideo(mockDoc);
        })
        .filter(v => v !== null);

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

      // Validate file size (limit to 150MB for beta videos)
      const maxSize = 150 * 1024 * 1024; // 150MB
      if (videoFile.size > maxSize) {
        throw new Error('Video file size must be less than 150MB');
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
      const videos = querySnapshot.docs
        .map(doc => this._transformAscentToVideo(doc))
        .filter(v => v !== null);

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
      const videos = querySnapshot.docs
        .map(doc => this._transformAscentToVideo(doc))
        .filter(v => v !== null);

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
      
      return this._transformAscentToVideo(docSnapshot);
    } catch (error) {
      console.error(`Error fetching video for ascent ${ascentId}:`, error);
      return null;
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

  /**
   * Manually assign a problem to a video/ascent
   * @param {string} ascentId - The ascent/video ID
   * @param {string} problemId - The problem ID to assign
   * @param {string} locationId - The location ID
   * @returns {Promise<void>}
   */
  async assignProblemToVideo(ascentId, problemId, locationId) {
    try {
      const { doc, updateDoc, getDoc } = await import('firebase/firestore');
      const { boulderProblemsServiceV2 } = await import('./boulderProblemsServiceV2.js');
      
      // Get the problem details to create a snapshot
      const problem = await boulderProblemsServiceV2.getBoulderProblem(locationId, problemId);
      if (!problem) {
        throw new Error('Problem not found');
      }
      
      // Update the ascent document
      const ascentRef = doc(db, 'ascents', ascentId);
      await updateDoc(ascentRef, {
        problemId: problemId,
        locationId: locationId,
        problemSnapshot: {
          name: problem.name,
          grade: problem.grade,
        },
      });
      
      console.log(`✅ Successfully assigned problem ${problemId} to video ${ascentId}`);
    } catch (error) {
      console.error('Error assigning problem to video:', error);
      throw error;
    }
  },
};

export default videoService;
