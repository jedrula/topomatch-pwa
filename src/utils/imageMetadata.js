/**
 * Utility functions for working with image metadata and detection result dimensions
 * 
 * IMPORTANT: Hold coordinates are always relative to the image dimensions that were 
 * actually used for hold detection, not the original image or the displayed image.
 * 
 * For server-side detection: coordinates are relative to the compressed image dimensions
 * For client-side detection: coordinates are relative to the uploaded image dimensions
 */

import { getCachedDetectionResult } from '@/services/detectionCacheService'

/**
 * Get the correct image dimensions for SVG viewBox based on detection results
 * This ensures that hold coordinates are positioned correctly regardless of 
 * responsive image loading or server-side compression
 * 
 * @param {Object} detectionResults - The detection results object
 * @param {string} imageUrl - The image URL to check for cached detection results
 * @param {Object} compressionSettings - The compression settings used for detection
 * @param {Object} fallbackImage - Fallback image element for dimensions
 * @returns {string} - SVG viewBox string in format "0 0 width height"
 */
export function getDetectionImageViewBox(detectionResults, imageUrl = null, compressionSettings = null, fallbackImage = null) {
  // Priority 1: Use detection results dimensions (server-side or client-side)
  if (detectionResults) {
    // Server-side detection results have image_info
    if (detectionResults.image_info) {
      const { width, height } = detectionResults.image_info;
      console.log('� Using server detection image dimensions:', { width, height });
      return `0 0 ${width} ${height}`;
    }
    
    // Client-side detection results have imageWidth/imageHeight
    if (detectionResults.imageWidth && detectionResults.imageHeight) {
      const { imageWidth: width, imageHeight: height } = detectionResults;
      console.log('📐 Using client detection image dimensions:', { width, height });
      return `0 0 ${width} ${height}`;
    }
    
    // Fallback: check for other possible dimension properties
    if (detectionResults.width && detectionResults.height) {
      const { width, height } = detectionResults;
      console.log('📐 Using detection result dimensions:', { width, height });
      return `0 0 ${width} ${height}`;
    }
  }
  
  // Priority 2: Try to get cached detection results for this image
  if (imageUrl && compressionSettings) {
    try {
      const cachedResults = getCachedDetectionResult(imageUrl, compressionSettings);
      if (cachedResults && hasDetectionImageDimensions(cachedResults.result)) {
        console.log('Using cached detection image dimensions for:', imageUrl);
        return getDetectionImageViewBox(cachedResults.result);
      }
    } catch (error) {
      console.warn('Could not get cached detection results:', error);
    }
  }
  
  // Priority 3: Use fallback image natural dimensions
  if (fallbackImage && fallbackImage.naturalWidth && fallbackImage.naturalHeight) {
    const width = fallbackImage.naturalWidth;
    const height = fallbackImage.naturalHeight;
    console.log('📐 Using fallback image dimensions:', { width, height });
    return `0 0 ${width} ${height}`;
  }
  
  // Priority 3: Default fallback
  console.warn('📐 No detection or image dimensions found, using default viewBox');
  return '0 0 1000 1000';
}

/**
 * Check if detection results contain valid image dimensions
 * 
 * @param {Object} detectionResults - The detection results object
 * @returns {boolean} - True if valid dimensions are found
 */
export function hasDetectionImageDimensions(detectionResults) {
  if (!detectionResults) return false;
  
  // Server-side detection
  if (detectionResults.image_info?.width && detectionResults.image_info?.height) {
    return true;
  }
  
  // Client-side detection
  if (detectionResults.imageWidth && detectionResults.imageHeight) {
    return true;
  }
  
  // Generic dimensions
  if (detectionResults.width && detectionResults.height) {
    return true;
  }
  
  return false;
}

/**
 * Get detection image dimensions as an object
 * 
 * @param {Object} detectionResults - The detection results object
 * @param {Object} fallbackImage - Fallback image element for dimensions
 * @returns {Object} - { width, height } object
 */
export function getDetectionImageDimensions(detectionResults, fallbackImage = null) {
  // Server-side detection results
  if (detectionResults?.image_info?.width && detectionResults?.image_info?.height) {
    return {
      width: detectionResults.image_info.width,
      height: detectionResults.image_info.height
    };
  }
  
  // Client-side detection results
  if (detectionResults?.imageWidth && detectionResults?.imageHeight) {
    return {
      width: detectionResults.imageWidth,
      height: detectionResults.imageHeight
    };
  }
  
  // Generic dimensions
  if (detectionResults?.width && detectionResults?.height) {
    return {
      width: detectionResults.width,
      height: detectionResults.height
    };
  }
  
  // Fallback to image element
  if (fallbackImage?.naturalWidth && fallbackImage?.naturalHeight) {
    return {
      width: fallbackImage.naturalWidth,
      height: fallbackImage.naturalHeight
    };
  }
  
  // Default fallback
  return { width: 1000, height: 1000 };
}

/**
 * Get default compression settings for cached detection lookup
 * These should match the compression settings used in the hold detection server
 */
export function getDefaultCompressionSettings() {
  return {
    enabled: true,
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
}
