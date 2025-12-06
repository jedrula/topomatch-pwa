/**
 * Image Matching Service
 * 
 * Sends winning image and frame to server for LoFTR-based feature matching.
 * 
 * **Phase 1 (Current):** Fire-and-forget to test server integration
 * - Sends video frame + location image to /api/v1/match-images
 * - Logs match quality metrics (inliers, ratio) for verification
 * - Does not block or affect current scoring pipeline
 * - Purpose: Verify server can receive and process images correctly
 * 
 * **Phase 2 (Future):** Superior homography for enhanced scoring
 * - Will return homography matrix from server (more accurate than frontend)
 * - Will use for improved keypoint transformation and problem detection
 * - Will reduce frontend computational load
 * 
 * **Server API:** Uses LoFTR (Local Feature Matching with Transformers)
 * - CUDA-accelerated on NVIDIA RTX 4060 Ti
 * - Returns: total_matches, inlier_matches, inlier_ratio, visualization URL
 * - Processing time: ~1-6 seconds depending on image size
 * 
 * **Integration:** Called from videoAnalysisQueueStore after best match is found
 */

const MATCH_API_BASE = import.meta.env.VITE_HOLD_DETECTION_API_URL || 'http://localhost:8000';

/**
 * Extract dimensions from image source
 */
function extractDimensions(imageSource) {
  if (imageSource instanceof ImageData) {
    return { width: imageSource.width, height: imageSource.height };
  }
  if (imageSource instanceof HTMLImageElement) {
    return { width: imageSource.naturalWidth, height: imageSource.naturalHeight };
  }
  if (imageSource instanceof HTMLCanvasElement) {
    return { width: imageSource.width, height: imageSource.height };
  }
  return { width: null, height: null };
}

/**
 * Convert image to base64 (without data URL prefix)
 * Backend will convert to grayscale as needed for LoFTR
 */
async function imageToBase64(imageSource) {
  // If it's already a data URL, extract base64
  if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
    return imageSource.split(',')[1];
  }
  
  // If it's a Blob/File
  if (imageSource instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    });
  }
  
  // If it's an Image element or canvas
  if (imageSource instanceof HTMLImageElement || imageSource instanceof HTMLCanvasElement) {
    const canvas = imageSource instanceof HTMLCanvasElement 
      ? imageSource 
      : await imageElementToCanvas(imageSource);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  }
  
  // If it's ImageData
  if (imageSource instanceof ImageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageSource.width;
    canvas.height = imageSource.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageSource, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  }
  
  throw new Error('Unsupported image source type');
}

/**
 * Convert image element to canvas
 */
function imageElementToCanvas(img) {
  return new Promise((resolve, reject) => {
    if (!img.complete) {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    }
  });
}

/**
 * Match two images using server-side LoFTR
 * Returns full result with homography matrix (when backend implements it)
 * 
 * @param {string|Blob|ImageData|HTMLImageElement} videoFrame - Video frame image
 * @param {string|Blob|ImageData|HTMLImageElement} locationImage - Location image
 * @param {string} outputFilename - Optional output filename
 * @param {Object} videoDimensions - {width, height} of video frame for coordinate space
 * @param {Object} locationDimensions - {width, height} of location image (null = auto-detect)
 * @returns {Promise<Object>} Match result with homography_matrix
 */
export async function matchImagesOnServer(videoFrame, locationImage, outputFilename = 'match_result.jpg', videoDimensions = null, locationDimensions = null) {
  try {
    console.log('🚀 [Server Matching] Starting image match request...');
    const startTime = performance.now();
    
    // Extract dimensions if not provided
    const video_dims = videoDimensions || extractDimensions(videoFrame);
    const location_dims = locationDimensions || { width: null, height: null }; // Server will detect if null
    
    console.log(`   📐 Video frame: ${video_dims.width}×${video_dims.height}`);
    console.log(`   📐 Location image: ${location_dims.width}×${location_dims.height}`);
    
    // Convert images to base64 (backend will convert to grayscale for LoFTR)
    console.log('   📸 Converting video frame to base64...');
    const image1Base64 = await imageToBase64(videoFrame);
    console.log(`   ✓ Video frame converted (${(image1Base64.length / 1024).toFixed(1)}KB)`);
    
    console.log('   📸 Converting location image to base64...');
    const image2Base64 = await imageToBase64(locationImage);
    console.log(`   ✓ Location image converted (${(image2Base64.length / 1024).toFixed(1)}KB)`);
    
    const conversionTime = performance.now() - startTime;
    console.log(`   ⏱️  Conversion took ${(conversionTime / 1000).toFixed(2)}s`);
    
    // Make API request
    const requestStartTime = performance.now();
    console.log(`   🌐 Sending request to ${MATCH_API_BASE}/api/v1/match-images...`);
    
    // Build request body - only include location_dimensions if we have valid values
    const requestBody = {
      image1: image1Base64,
      image2: image2Base64,
      output_filename: outputFilename,
      video_dimensions: video_dims
    };
    
    // Only add location_dimensions if we have actual values (not null)
    if (location_dims.width && location_dims.height) {
      requestBody.location_dimensions = location_dims;
    }
    
    const response = await fetch(`${MATCH_API_BASE}/api/v1/match-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const requestTime = performance.now() - requestStartTime;
    console.log(`   ⏱️  Request took ${(requestTime / 1000).toFixed(2)}s`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ [Server Matching] Complete in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`   📊 Matches: ${result.inlier_matches}/${result.total_matches} inliers (${(result.inlier_ratio * 100).toFixed(1)}%)`);
    console.log(`   🎯 Quality: ${assessMatchQuality(result.inlier_ratio)}`);
    console.log(`   🖼️  Visualization: ${MATCH_API_BASE}${result.download_url}`);
    
    return {
      ...result,
      matchQuality: assessMatchQuality(result.inlier_ratio),
      visualizationUrl: `${MATCH_API_BASE}${result.download_url}`,
      processingTime: totalTime
    };
    
  } catch (error) {
    console.error('❌ [Server Matching] Failed:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

/**
 * Fire-and-forget version - starts the request but doesn't wait for result
 * Phase 1: Just test that server receives and processes requests
 * 
 * @param {string|Blob|ImageData|HTMLImageElement} videoFrame - Video frame image
 * @param {string|Blob|ImageData|HTMLImageElement} locationImage - Location image
 * @param {string} ascentId - Ascent ID for tracking
 */
export function matchImagesOnServerAsync(videoFrame, locationImage, ascentId) {
  // Fire and forget - don't await
  matchImagesOnServer(videoFrame, locationImage, `${ascentId}_match.jpg`)
    .then(result => {
      console.log('🔥 [Server Matching] Result:', result);
    })
    .catch(error => {
      console.log('🔥 [Server Matching] Error:', error.message);
    });
}

/**
 * Assess match quality based on inlier ratio
 */
function assessMatchQuality(inlierRatio) {
  if (inlierRatio > 0.7) return 'excellent';
  if (inlierRatio > 0.4) return 'good';
  if (inlierRatio > 0.2) return 'moderate';
  return 'poor';
}

/**
 * Get processing recommendation based on match quality
 */
export function getProcessingRecommendation(result) {
  const ratio = result.inlier_ratio || result.inlierRatio;
  
  if (ratio > 0.5) {
    return {
      proceed: true,
      message: 'High-quality matches detected. Proceed with scoring.',
      confidence: 'high'
    };
  } else if (ratio > 0.2) {
    return {
      proceed: true,
      message: 'Moderate matches. Consider manual verification.',
      confidence: 'medium'
    };
  } else {
    return {
      proceed: false,
      message: 'Low match quality. Images may not be suitable for comparison.',
      confidence: 'low'
    };
  }
}

export default {
  matchImagesOnServer,
  matchImagesOnServerAsync,
  getProcessingRecommendation
};
