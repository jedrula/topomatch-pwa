/**
 * Video frame extraction utilities
 */

/**
 * Extract a frame from video file at specified time
 * @param {File} videoFile - The video file
 * @param {number} timeInSeconds - Time to extract frame (default: 5 seconds)
 * @returns {Promise<{file: File, url: string}>} - Frame as File object and display URL
 */
export const extractVideoFrame = (videoFile, timeInSeconds = 5) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to the specified time (or middle of video if shorter)
      const seekTime = Math.min(timeInSeconds, video.duration / 2);
      video.currentTime = seekTime;

      // Store seekTime for later use
      video.seekTime = seekTime;
    };

    video.onseeked = () => {
      try {
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a File object from the blob
              const frameFile = new File([blob], `frame_${timeInSeconds}s.jpg`, {
                type: "image/jpeg",
              });

              // Create display URL
              const frameUrl = URL.createObjectURL(blob);

              // Clean up video object URL
              URL.revokeObjectURL(video.src);

              resolve({
                file: frameFile,
                url: frameUrl,
                timeExtracted: video.seekTime,
                videoDuration: video.duration,
              });
            } else {
              reject(new Error("Failed to extract frame"));
            }
          },
          "image/jpeg",
          0.8
        );
      } catch (error) {
        reject(new Error("Failed to draw video frame: " + error.message));
      }
    };

    video.onerror = (error) => {
      reject(new Error("Failed to load video: " + error.message));
    };

    video.onabort = () => {
      reject(new Error("Video loading was aborted"));
    };

    // Load the video file
    try {
      const url = URL.createObjectURL(videoFile);
      video.src = url;
    } catch (error) {
      reject(new Error("Failed to create video URL: " + error.message));
    }
  });
};

/**
 * Extract multiple frames from video at different time intervals
 * @param {File} videoFile - The video file
 * @param {number} frameCount - Number of frames to extract (default: 3)
 * @returns {Promise<Array<{file: File, url: string, timeExtracted: number}>>} - Array of frame objects
 */
export const extractMultipleVideoFrames = async (videoFile, frameCount = 3) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        const timeInterval = duration / (frameCount + 1); // Evenly space frames
        const frames = [];

        for (let i = 1; i <= frameCount; i++) {
          const timeInSeconds = timeInterval * i;
          try {
            const frame = await extractVideoFrame(videoFile, timeInSeconds);
            frames.push(frame);
          } catch (error) {
            console.warn(`Failed to extract frame at ${timeInSeconds}s:`, error);
          }
        }

        if (frames.length === 0) {
          reject(new Error("Failed to extract any frames"));
        } else {
          resolve(frames);
        }
      } catch (error) {
        reject(new Error("Failed to extract multiple frames: " + error.message));
      }
    };

    video.onerror = (error) => {
      reject(new Error("Failed to load video for multiple frame extraction: " + error.message));
    };

    // Load the video file
    try {
      const url = URL.createObjectURL(videoFile);
      video.src = url;
    } catch (error) {
      reject(new Error("Failed to create video URL: " + error.message));
    }
  });
};

/**
 * Get video metadata without extracting frames
 * @param {File} videoFile - The video file
 * @returns {Promise<{duration: number, width: number, height: number}>} - Video metadata
 */
export const getVideoMetadata = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      };

      // Clean up
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };

    video.onerror = (error) => {
      reject(new Error("Failed to load video metadata: " + error.message));
    };

    // Load the video file
    try {
      const url = URL.createObjectURL(videoFile);
      video.src = url;
    } catch (error) {
      reject(new Error("Failed to create video URL: " + error.message));
    }
  });
};

/**
 * Validate video file before processing
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateVideoFile = (file) => {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check if it's a video file
  if (!file.type.startsWith("video/")) {
    result.isValid = false;
    result.errors.push("File must be a video");
    return result;
  }

  // Check file size (limit to 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    result.isValid = false;
    result.errors.push("Video file size must be less than 100MB");
  }

  // Check if file size is very small (might be corrupted)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    result.warnings.push("Video file seems very small, might be corrupted");
  }

  // Check supported formats
  const supportedFormats = ["video/mp4", "video/webm", "video/mov", "video/quicktime"];
  if (!supportedFormats.includes(file.type.toLowerCase())) {
    result.warnings.push(`Format ${file.type} might not be supported on all browsers`);
  }

  return result;
};
