/**
 * Orders image records according to a section's imageIds array.
 * Images whose IDs appear in sectionImageIds are returned in that order.
 * Images not present in sectionImageIds are silently dropped (they belong
 * to a different section or routesetting).
 *
 * Falls back to the original array when no sectionImageIds are provided.
 *
 * @param {string[] | undefined} sectionImageIds - Ordered image IDs from floorplan section
 * @param {Array} images - Full image records (must have imageId field)
 * @returns {Array}
 */
export function orderImagesBySection(sectionImageIds, images) {
  if (!sectionImageIds?.length) return images;
  return sectionImageIds
    .map(imageId => images.find(img => img.imageId === imageId))
    .filter(Boolean);
}

/**
 * Finds the section that contains a given imageId and orders `images`
 * according to that section's imageIds array.
 * Falls back to the original images array if no matching section is found.
 *
 * @param {string} imageId - The current image's ID (used to locate its section)
 * @param {Array} sections - floorplan.sections array
 * @param {Array} images - Full image records (must have imageId field)
 * @returns {Array}
 */
export function orderImagesBySectionOf(imageId, sections, images) {
  const section = (sections || []).find(s => (s.imageIds || []).includes(imageId));
  return orderImagesBySection(section?.imageIds, images);
}
