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
      console.log(`Calculating homography from ${matches.length} point matches`);

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

      console.log('✅ Homography calculated:', {
        inliers: inlierCount,
        total: matches.length,
        successRate: ((inlierCount / matches.length) * 100).toFixed(1) + '%'
      });

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
 * Transform a point using homography matrix
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @param {Array} homographyMatrix - 3x3 homography matrix as flat array
 * @param {boolean} inverse - Whether to apply inverse transformation
 * @returns {{x: number, y: number}|null} Transformed point or null if failed
 */
export function transformPoint(x, y, homographyMatrix, inverse = false) {
  if (!window.cv || !homographyMatrix) {
    console.warn('Transform point failed: OpenCV or homography matrix not available');
    return null;
  }

  try {
    const cv = window.cv;
    
    // Create homography matrix from stored data
    const H = new cv.Mat(3, 3, cv.CV_64F);
    for (let i = 0; i < 9; i++) {
      H.data64F[i] = homographyMatrix[i];
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
 * @param {Array} points - Array of {x, y} points
 * @param {Array} homographyMatrix - 3x3 homography matrix as flat array
 * @param {boolean} inverse - Whether to apply inverse transformation
 * @returns {Array} Array of transformed {x, y} points
 */
export function transformPoints(points, homographyMatrix, inverse = false) {
  return points.map(point => transformPoint(point.x, point.y, homographyMatrix, inverse))
    .filter(point => point !== null);
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
    const ctx = canvas.getContext('2d');
    const frames = [];
    let currentTimestampIndex = 0;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Convert percentage timestamps to actual time
      const actualTimestamps = timestamps.map(t => t * video.duration);
      
      const seekToNextFrame = () => {
        if (currentTimestampIndex >= actualTimestamps.length) {
          resolve(frames);
          return;
        }
        
        video.currentTime = actualTimestamps[currentTimestampIndex];
      };
      
      seekToNextFrame();
    });

    video.addEventListener('seeked', () => {
      // Draw current frame to canvas
      ctx.drawImage(video, 0, 0);
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
        const actualTimestamps = timestamps.map(t => t * video.duration);
        video.currentTime = actualTimestamps[currentTimestampIndex];
      } else {
        resolve(frames);
      }
    });

    video.addEventListener('error', (e) => {
      reject(new Error('Failed to load video: ' + e.message));
    });

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Extract pose keypoints from an image using pose detection model
 * @param {ImageData} imageData - Image data from canvas
 * @returns {Promise<Object>} Pose keypoints with confidence scores
 */
export async function extractPoseKeypoints(imageData) {
  // This will need to integrate with your pose detection worker
  // For now, returning a placeholder structure
  return new Promise((resolve) => {
    // TODO: Integrate with pose detection worker
    // This should extract wrist and ankle positions
    const mockPose = {
      keypoints: {
        leftWrist: { x: 100, y: 200, confidence: 0.8 },
        rightWrist: { x: 150, y: 190, confidence: 0.9 },
        leftAnkle: { x: 110, y: 400, confidence: 0.7 },
        rightAnkle: { x: 140, y: 410, confidence: 0.8 }
      },
      confidence: 0.85
    };
    
    // Simulate async processing
    setTimeout(() => resolve(mockPose), 100);
  });
}
