import { computed } from 'vue';

/**
 * Composable to sort images by floorplan sections
 * 
 * Images are ordered by:
 * 1. First, images assigned to sections (in section order)
 * 2. Then, unassigned images
 * 
 * @param {Ref<Array>} images - Array of image objects with imageId
 * @param {Ref<Object>} floorplan - Floorplan object with sections array
 * @returns {ComputedRef<Array>} Sorted images
 */
export function useSortedImages(images, floorplan) {
  return computed(() => {
    if (!floorplan.value?.sections || floorplan.value.sections.length === 0) {
      return images.value; // No sections, return original order
    }
    
    const result = [];
    const assignedImageIds = new Set();
    
    // Iterate through sections in order (array order = section order)
    floorplan.value.sections.forEach(section => {
      if (section.imageIds && Array.isArray(section.imageIds)) {
        // For each imageId in this section, find the actual image object
        section.imageIds.forEach(imageId => {
          const image = images.value.find(img => img.imageId === imageId);
          if (image) {
            result.push(image);
            assignedImageIds.add(imageId);
          }
        });
      }
    });
    
    // Append unassigned images at the end
    images.value.forEach(image => {
      if (!assignedImageIds.has(image.imageId)) {
        result.push(image);
      }
    });
    
    return result;
  });
}
