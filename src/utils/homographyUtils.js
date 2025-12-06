/**
 * Homography utilities for point transformation between images
 * Extracted from playground implementation for reuse across components
 */

/**
 * Calculate homography matrix from matching point pairs
 * @param {Array} matches - Array of {point1: {x, y}, point2: {x, y}} matches
 * @returns {Promise<{matrix: Array, inliers: number}>} Homography matrix and inlier count
 */
export async function calculateHomographyMatrix(matches) {
  return new Promise((resolve, reject) => {
    if (!window.cv) {
      reject(new Error('OpenCV.js not loaded'));
      return;
    }

    if (!matches || matches.length < 4) {
      reject(new Error('Need at least 4 point matches to calculate homography'));
      return;
    }

    try {
      const cv = window.cv;

      // Create OpenCV point arrays
      const srcMat = new cv.Mat(matches.length, 1, cv.CV_32FC2);
      const dstMat = new cv.Mat(matches.length, 1, cv.CV_32FC2);

      // Fill matrices with point data
      for (let i = 0; i < matches.length; i++) {
        srcMat.data32F[i * 2] = matches[i].point1.x;
        srcMat.data32F[i * 2 + 1] = matches[i].point1.y;
        dstMat.data32F[i * 2] = matches[i].point2.x;
        dstMat.data32F[i * 2 + 1] = matches[i].point2.y;
      }

      const mask = new cv.Mat();

      // Calculate homography using RANSAC
      const homography = cv.findHomography(srcMat, dstMat, cv.RANSAC, 5.0, mask);

      // Count inliers
      let inlierCount = 0;
      for (let i = 0; i < mask.rows; i++) {
        if (mask.ucharPtr(i, 0)[0] === 1) inlierCount++;
      }

      // Extract matrix data
      const matrixData = [];
      for (let i = 0; i < 9; i++) {
        matrixData.push(homography.data64F[i]);
      }

      // Cleanup
      srcMat.delete();
      dstMat.delete();
      mask.delete();
      homography.delete();

      resolve({
        matrix: matrixData,
        inliers: inlierCount,
        total: matches.length
      });

    } catch (error) {
      console.error('Homography calculation error:', error);
      reject(error);
    }
  });
}

/**
 * 🎭 MOCK MODE: Import fixtures for mocked transformPoint
 */
const useMockOpenCV = import.meta.env.VITE_USE_OPENCV_MOCK === 'true';
let mockFixtures = null;

if (useMockOpenCV) {
  console.warn('⚠️ OpenCV MOCK Mode ENABLED - using recorded fixtures (saves ~20 MB memory)');
  import('../mocks/transformPointFixtures.js').then(module => {
    mockFixtures = module.transformPointFixtures;
    console.log(`✅ Loaded ${mockFixtures.length} transformPoint fixtures`);
  });
}

/**
 * Transform a point using homography matrix
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @param {Array} homographyMatrix - 3x3 homography matrix (flat array [h0..h8] or nested array [[r0],[r1],[r2]])
 * @param {boolean} inverse - Whether to apply inverse transformation
 * @returns {{x: number, y: number}|null} Transformed point or null if failed
 */
export function transformPoint(x, y, homographyMatrix, inverse = false) {
  // 🎭 MOCK MODE: Use recorded fixtures instead of OpenCV
  if (useMockOpenCV && mockFixtures) {
    const TOLERANCE = 0.5; // Allow 0.5px tolerance for fuzzy matching
    
    const match = mockFixtures.find(fixture => 
      Math.abs(fixture.input.x - x) < TOLERANCE &&
      Math.abs(fixture.input.y - y) < TOLERANCE &&
      fixture.input.inverse === inverse
    );
    
    if (match) {
      return { x: match.output.x, y: match.output.y };
    } else {
      console.warn(`⚠️ transformPoint mock: No fixture found for (${x}, ${y}, inverse=${inverse})`);
      return null;
    }
  }

  if (!window.cv || !homographyMatrix) {
    console.warn('Transform point failed: OpenCV or homography matrix not available');
    return null;
  }

  try {
    const cv = window.cv;
    
    // Convert homography matrix to flat array if it's 3x3 nested array
    let flatMatrix;
    if (Array.isArray(homographyMatrix[0])) {
      // 3x3 nested array from server (LoFTR) - flatten it
      flatMatrix = [
        homographyMatrix[0][0], homographyMatrix[0][1], homographyMatrix[0][2],
        homographyMatrix[1][0], homographyMatrix[1][1], homographyMatrix[1][2],
        homographyMatrix[2][0], homographyMatrix[2][1], homographyMatrix[2][2]
      ];
    } else {
      // Already flat array from frontend (SuperPoint)
      flatMatrix = homographyMatrix;
    }
    
    // Create homography matrix from flat array
    const H = new cv.Mat(3, 3, cv.CV_64F);
    for (let i = 0; i < 9; i++) {
      H.data64F[i] = flatMatrix[i];
    }

    // Create point matrix
    const point = new cv.Mat(1, 1, cv.CV_32FC2);
    point.data32F[0] = x;
    point.data32F[1] = y;

    const transformedPoint = new cv.Mat();

    if (inverse) {
      // Use inverse transformation
      const HInv = new cv.Mat();
      cv.invert(H, HInv, cv.DECOMP_SVD);
      cv.perspectiveTransform(point, transformedPoint, HInv);
      HInv.delete();
    } else {
      // Use forward transformation
      cv.perspectiveTransform(point, transformedPoint, H);
    }

    const result = {
      x: transformedPoint.data32F[0],
      y: transformedPoint.data32F[1]
    };

    // Cleanup
    H.delete();
    point.delete();
    transformedPoint.delete();

    return result;

  } catch (error) {
    console.error('Point transformation error:', error);
    return null;
  }
}

/**
 * Transform multiple points using homography matrix
 * @param {Array} points - Array of {x, y, ...} points (additional properties preserved)
 * @param {Array} homographyMatrix - 3x3 homography matrix (flat array [h0..h8] or nested array [[r0],[r1],[r2]])
 * @param {boolean} inverse - Whether to apply inverse transformation
 * @returns {Array} Array of transformed points with preserved properties
 */
export function transformPoints(points, homographyMatrix, inverse = false) {
  return points.map(point => {
    const transformed = transformPoint(point.x, point.y, homographyMatrix, inverse);
    if (transformed === null) return null;
    
    // Preserve all additional properties (like confidence, name, etc.)
    return { ...point, x: transformed.x, y: transformed.y };
  }).filter(point => point !== null);
}

/**
 * Extract video frames at specified timestamps
 * @param {File} videoFile - Video file
 * @param {Array} timestamps - Array of timestamps in seconds (e.g., [0.25, 0.5, 0.75] for 25%, 50%, 75%)
 * @returns {Promise<Array>} Array of ImageData objects
 */
export async function extractVideoFrames(videoFile, timestamps) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const frames = [];
    let currentTimestampIndex = 0;

    video.addEventListener('loadedmetadata', () => {
      // 🎯 MEMORY OPTIMIZATION: Configurable downscaling
      const DOWNSCALE_IMAGES = true; // Set to true in production for memory savings
      const MAX_DIMENSION = 640; // Optimal for YOLOv8 (trained on 640x640)
      
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      let targetWidth = videoWidth;
      let targetHeight = videoHeight;
      
      if (DOWNSCALE_IMAGES && (videoWidth > MAX_DIMENSION || videoHeight > MAX_DIMENSION)) {
        const scale = Math.min(MAX_DIMENSION / videoWidth, MAX_DIMENSION / videoHeight);
        targetWidth = Math.floor(videoWidth * scale);
        targetHeight = Math.floor(videoHeight * scale);
        console.log(`📐 Downscaling video frames: ${videoWidth}×${videoHeight} → ${targetWidth}×${targetHeight}`);
      } else {
        console.log(`📐 Extracting frames at full resolution: ${videoWidth}×${videoHeight} (DOWNSCALE_IMAGES=${DOWNSCALE_IMAGES})`);
      }
      
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // Simple validation for MP4 videos
      if (isFinite(video.duration) && video.duration > 0) {
        processFrames();
      } else {
        reject(new Error('Video duration is invalid. Please try recording again or use a different video format.'));
      }
    });

    video.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      reject(new Error('Failed to load video for processing.'));
    });
    
    function processFrames() {
      // Convert percentage timestamps to actual time
      const actualTimestamps = timestamps.map(t => {
        const time = t * video.duration;
        if (!isFinite(time)) {
          console.error('Invalid timestamp calculated:', t, '*', video.duration, '=', time);
          return 0; // Fallback to beginning
        }
        return Math.min(time, video.duration - 0.1); // Ensure we don't exceed duration
      });
      
      const seekToNextFrame = () => {
        if (currentTimestampIndex >= actualTimestamps.length) {
          resolve(frames);
          return;
        }
        
        const targetTime = actualTimestamps[currentTimestampIndex];
        
        if (!isFinite(targetTime)) {
          console.error('Attempting to seek to non-finite time:', targetTime);
          currentTimestampIndex++;
          seekToNextFrame();
          return;
        }
        
        video.currentTime = targetTime;
      };
      
      seekToNextFrame();
    }

    video.addEventListener('seeked', () => {
      // Draw current frame to canvas (scaled to target dimensions)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      frames.push({
        timestamp: video.currentTime,
        percentage: (video.currentTime / video.duration),
        imageData,
        width: canvas.width,
        height: canvas.height
      });
      
      currentTimestampIndex++;
      
      // Seek to next frame
      if (currentTimestampIndex < timestamps.length) {
        const nextTime = timestamps[currentTimestampIndex] * video.duration;
        if (isFinite(nextTime)) {
          video.currentTime = Math.min(nextTime, video.duration - 0.1);
        } else {
          console.error('Invalid next timestamp:', nextTime);
          resolve(frames);
        }
      } else {
        resolve(frames);
      }
    });

    video.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      reject(new Error('Failed to load video for processing. Please try recording again.'));
    });

    // Simple timeout - MP4 videos should load quickly
    const timeout = setTimeout(() => {
      reject(new Error('Video loading timeout. Please try recording again.'));
    }, 10000); // 10 second timeout

    // Clear timeout when done
    const originalResolve = resolve;
    const originalReject = reject;
    resolve = (...args) => {
      clearTimeout(timeout);
      originalResolve(...args);
    };
    reject = (...args) => {
      clearTimeout(timeout);
      originalReject(...args);
    };

    // Configure video element for reliable playback
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

// Mock function removed - now using real pose detection service from poseDetectionFactory.js
