import { Capacitor } from '@capacitor/core';
import IosImageMatching from '../plugins/IosImageMatching';

/**
 * Adapter for native iOS image matching
 * Converts between native iOS format and the format expected by videoAnalysisQueueStore
 */

/**
 * Check if we should use native iOS image matching
 */
export function shouldUseNativeMatching() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/**
 * Convert ImageData to base64 JPEG for native iOS
 */
async function imageDataToBase64(imageData) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data:image/jpeg;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.95);
  });
}

/**
 * Convert image URL to base64 for native iOS
 */
async function imageUrlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Transform native iOS results to match WASM format
 * 
 * Native returns: { keypoints, matches, mscores, keypointsShape, matchesShape, stats }
 * Need to return format compatible with inferenceStore results
 */
function transformNativeResults(nativeResult, frameWidth, frameHeight, imageWidth, imageHeight) {
  const { keypoints, matches, mscores, keypointsShape } = nativeResult;
  
  // keypointsShape is [2, N, 2] - 2 images, N keypoints each, x,y coords
  const numKeypoints = keypointsShape[1];
  
  // Split keypoints into frame and location image
  const keypoints0 = []; // Frame keypoints
  const keypoints1 = []; // Location image keypoints
  
  // Keypoints are interleaved: [img0_kp0_x, img0_kp0_y, img0_kp1_x, img0_kp1_y, ..., img1_kp0_x, img1_kp0_y, ...]
  for (let i = 0; i < numKeypoints; i++) {
    const x0 = keypoints[i * 2];
    const y0 = keypoints[i * 2 + 1];
    keypoints0.push([x0, y0]);
  }
  
  const offset = numKeypoints * 2;
  for (let i = 0; i < numKeypoints; i++) {
    const x1 = keypoints[offset + i * 2];
    const y1 = keypoints[offset + i * 2 + 1];
    keypoints1.push([x1, y1]);
  }
  
  // Scale keypoints from 256x256 (model space) to original dimensions
  // Model uses normalized coords [0-1] on 256x256 image
  const scaledKeypoints0 = keypoints0.map(([x, y]) => [
    x * frameWidth / 256,
    y * frameHeight / 256
  ]);
  
  const scaledKeypoints1 = keypoints1.map(([x, y]) => [
    x * imageWidth / 256,
    y * imageHeight / 256
  ]);
  
  // Filter matches based on scores (mscores)
  // matches array contains indices, but we need to pair with scores
  const validMatches = [];
  const matchedKeypoints0 = [];
  const matchedKeypoints1 = [];
  
  // Iterate through matches and their scores
  for (let i = 0; i < Math.min(matches.length, mscores.length); i++) {
    const score = mscores[i];
    if (score > 0.3) { // Minimum confidence threshold
      const matchIdx = matches[i];
      if (matchIdx >= 0 && matchIdx < keypoints1.length) {
        validMatches.push([i, matchIdx]);
        matchedKeypoints0.push(scaledKeypoints0[i]);
        matchedKeypoints1.push(scaledKeypoints1[matchIdx]);
      }
    }
  }
  
  console.log(`   [NativeAdapter] Filtered ${validMatches.length} matches (score > 0.3) from ${matches.length} total`);
  
  return {
    rawData: {
      keypoints0: scaledKeypoints0,
      keypoints1: scaledKeypoints1,
      matches: validMatches,
      matchedKeypoints0,
      matchedKeypoints1,
      mscores: Array.from(mscores)
    },
    matchCount: validMatches.length,
    stats: nativeResult.stats
  };
}

/**
 * Match a video frame against location images using native iOS
 * Compatible with videoAnalysisQueueStore's batch inference pattern
 * 
 * @param {File|Blob} frameFile - Video frame to match
 * @param {string[]} imageUrls - Location image URLs to match against
 * @param {Function} onComplete - Callback when all matches complete
 * @param {Function} onProgress - Progress callback (currentIndex, totalImages)
 * @returns {Object} Results object compatible with inferenceStore format
 */
export async function runNativeImageMatching(frameFile, imageUrls, onComplete, onProgress) {
  console.log(`🍎 [NativeMatching] Starting native iOS matching for ${imageUrls.length} images...`);
  
  const results = {};
  const matchCounts = {};
  
  try {
    // Convert frame to base64
    const frameBlob = frameFile instanceof File ? frameFile : new Blob([frameFile]);
    const frameBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(frameBlob);
    });
    
    // Get frame dimensions (needed for scaling keypoints back)
    const frameImg = await createImageBitmap(frameBlob);
    const frameWidth = frameImg.width;
    const frameHeight = frameImg.height;
    
    // Match against each location image
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`   [${i + 1}/${imageUrls.length}] Matching against: ${imageUrl.substring(0, 50)}...`);
      
      // Convert location image to base64
      const imageBase64 = await imageUrlToBase64(imageUrl);
      
      // Get image dimensions
      const imgBlob = await fetch(imageUrl).then(r => r.blob());
      const img = await createImageBitmap(imgBlob);
      const imageWidth = img.width;
      const imageHeight = img.height;
      
      // Call native iOS plugin
      const startTime = performance.now();
      const nativeResult = await IosImageMatching.matchImages({
        image0: frameBase64,
        image1: imageBase64
      });
      const endTime = performance.now();
      
      console.log(`   ✅ Native matching completed in ${(endTime - startTime).toFixed(0)}ms`);
      console.log(`      High-confidence matches: ${nativeResult.stats.highConfidenceMatches}`);
      
      // Transform to WASM-compatible format
      const transformed = transformNativeResults(nativeResult, frameWidth, frameHeight, imageWidth, imageHeight);
      
      results[imageUrl] = transformed;
      matchCounts[imageUrl] = transformed.matchCount;
      
      // Progress callback
      if (onProgress) {
        onProgress(i + 1, imageUrls.length);
      }
    }
    
    console.log(`✅ [NativeMatching] All ${imageUrls.length} images matched`);
    
    // Call completion callback
    if (onComplete) {
      onComplete();
    }
    
    return { results, matchCounts };
    
  } catch (error) {
    console.error('❌ [NativeMatching] Error:', error);
    throw error;
  }
}
