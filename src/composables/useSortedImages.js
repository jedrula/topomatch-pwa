import { computed } from 'vue';

const byBatchOrder = (a, b) =>
  b.batchUploadedAt !== a.batchUploadedAt
    ? b.batchUploadedAt - a.batchUploadedAt
    : a.pickOrder - b.pickOrder;

export function useSortedImages(images, floorplan) {
  return computed(() => {
    if (!floorplan.value?.sections || floorplan.value.sections.length === 0) {
      return [...images.value].sort(byBatchOrder);
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
    
    // Append unassigned images at the end, sorted by batchUploadedAt desc → pickOrder asc
    const unassigned = images.value.filter(image => !assignedImageIds.has(image.imageId));
    result.push(...unassigned.sort(byBatchOrder));
    
    return result;
  });
}
