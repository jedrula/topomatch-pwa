/**
 * Composable for handling image overlay with SVG holds
 * Provides reusable logic for image loading, viewBox calculation, and hold overlay
 */
import { ref, computed } from 'vue';

export function useImageOverlay() {
  // Image loading state
  const imageElement = ref(null);
  const imageLoaded = ref(false);

  // SVG viewBox for overlay positioning
  const imageViewBox = computed(() => {
    if (!imageElement.value) return '0 0 1000 1000';

    const img = imageElement.value;
    const naturalWidth = img.naturalWidth || 1000;
    const naturalHeight = img.naturalHeight || 1000;

    return `0 0 ${naturalWidth} ${naturalHeight}`;
  });

  // Handle image load event
  const onImageLoad = () => {
    imageLoaded.value = true;
    console.log('🖼️ Image loaded, viewBox:', imageViewBox.value);
  };

  // Reset state (useful when image changes)
  const resetImageState = () => {
    imageLoaded.value = false;
    imageElement.value = null;
  };

  return {
    // Reactive state
    imageElement,
    imageLoaded,
    imageViewBox,
    
    // Methods
    onImageLoad,
    resetImageState,
  };
}
