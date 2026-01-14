/**
 * Extract a thumbnail from a video file
 * @param {File} videoFile - The video file to extract thumbnail from
 * @param {number} seekTime - Time in seconds to seek to (default: 1)
 * @param {number} maxWidth - Maximum thumbnail width (default: 320)
 * @returns {Promise<string>} Base64 encoded JPEG thumbnail
 */
export async function extractVideoThumbnail(videoFile, seekTime = 1, maxWidth = 320) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let blobUrl = null;

    // Clean up function
    const cleanup = () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
      }
      video.src = '';
      video.load();
    };

    // Error handler with timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Video thumbnail extraction timed out (iOS 15 blob URL issue?)'));
    }, 10000); // 10 second timeout

    video.onerror = (e) => {
      clearTimeout(timeoutId);
      cleanup();
      console.error('Video load error:', e);
      reject(new Error(`Failed to load video for thumbnail extraction: ${video.error?.message || 'unknown error'}`));
    };

    // When metadata is loaded, seek to the desired time
    video.onloadedmetadata = () => {
      try {
        // Ensure seek time is valid
        const actualSeekTime = Math.min(seekTime, video.duration - 0.1);
        video.currentTime = actualSeekTime;
      } catch (error) {
        clearTimeout(timeoutId);
        cleanup();
        reject(new Error('Failed to seek video: ' + error.message));
      }
    };

    // When seek completes, capture the frame
    video.onseeked = () => {
      try {
        clearTimeout(timeoutId);

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = video.videoHeight / video.videoWidth;
        canvas.width = maxWidth;
        canvas.height = maxWidth * aspectRatio;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 JPEG (quality: 0.8 for good balance)
        const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8);

        cleanup();
        resolve(thumbnailBase64);
      } catch (error) {
        clearTimeout(timeoutId);
        cleanup();
        reject(error);
      }
    };

    // Load video from file - create blob URL
    try {
      blobUrl = URL.createObjectURL(videoFile);
      video.src = blobUrl;
    } catch (error) {
      clearTimeout(timeoutId);
      cleanup();
      reject(new Error('Failed to create blob URL: ' + error.message));
    }
  });
}

/**
 * Get size of base64 string in KB
 * @param {string} base64String - Base64 encoded string
 * @returns {number} Size in KB
 */
export function getBase64Size(base64String) {
  // Remove data URL prefix if present
  const base64 = base64String.split(',')[1] || base64String;
  // Base64 encoding increases size by ~33%
  const bytes = (base64.length * 3) / 4;
  return bytes / 1024;
}
