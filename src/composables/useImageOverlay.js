/**
 * Composable for handling image overlay with SVG holds
 * Provides reusable logic for image loading, viewBox calculation, and hold overlay
 * 
 * IMPORTANT: This composable now uses original image dimensions for the viewBox
 * to ensure hold coordinates work correctly across responsive image sizes
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { getDetectionImageViewBox, hasDetectionImageDimensions, getDefaultCompressionSettings } from '@/utils/imageMetadata'

/**
 * Composable for handling image overlay with SVG holds
 * 
 * This composable ensures that hold coordinates are always positioned correctly
 * by using the same image dimensions that were used during hold detection.
 * 
 * IMPORTANT: Hold coordinates are relative to the image dimensions that were 
 * actually used for detection, not the displayed image or original image.
 */
export function useImageOverlay() {
  const containerRef = ref(null)
  const imageRef = ref(null)
  const svgRef = ref(null)
  
  const isImageLoaded = ref(false)
  
  /**
   * Calculate the correct viewBox for SVG overlays based on detection results
   * This is the key to ensuring holds align correctly on all screen sizes
   * 
   * @param {Object} detectionResults - Detection results containing image dimensions
   * @param {string} imageUrl - Image URL for cache lookup if no detection results
   * @returns {string} - SVG viewBox string
   */
  const getViewBox = (detectionResults, imageUrl = null) => {
    // Use detection results dimensions first (most accurate)
    if (hasDetectionImageDimensions(detectionResults)) {
      return getDetectionImageViewBox(detectionResults)
    }
    
    // Try to get cached detection results for the image
    if (imageUrl) {
      const compressionSettings = getDefaultCompressionSettings()
      const viewBox = getDetectionImageViewBox(null, imageUrl, compressionSettings, imageRef.value)
      return viewBox
    }
    
    // Fallback to loaded image dimensions if no detection results or cache
    if (isImageLoaded.value && imageRef.value) {
      return getDetectionImageViewBox(null, null, null, imageRef.value)
    }
    
    // Default fallback
    return '0 0 1000 1000'
  }
  
  /**
   * Get SVG styles that make the overlay cover the entire image container
   */
  const getSvgStyles = () => ({
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 10
  })
  
  /**
   * Handle image load event
   */
  const handleImageLoad = async () => {
    isImageLoaded.value = true
    await nextTick()
    console.log('🖼️ Image loaded, overlay ready')
  }
  
  /**
   * Handle image error
   */
  const handleImageError = (error) => {
    console.error('Image failed to load:', error)
    isImageLoaded.value = false
  }
  
  /**
   * Initialize the overlay system
   */
  const initializeOverlay = () => {
    if (imageRef.value) {
      // If image is already loaded
      if (imageRef.value.complete && imageRef.value.naturalWidth > 0) {
        handleImageLoad()
      } else {
        // Wait for image to load
        imageRef.value.addEventListener('load', handleImageLoad)
        imageRef.value.addEventListener('error', handleImageError)
      }
    }
  }
  
  /**
   * Cleanup event listeners
   */
  const cleanup = () => {
    if (imageRef.value) {
      imageRef.value.removeEventListener('load', handleImageLoad)
      imageRef.value.removeEventListener('error', handleImageError)
    }
  }
  
  onMounted(() => {
    initializeOverlay()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    containerRef,
    imageRef,
    svgRef,
    isImageLoaded,
    getViewBox,
    getSvgStyles,
    handleImageLoad,
    handleImageError,
    initializeOverlay,
    cleanup
  }
}
