/**
 * Utility functions for video handling
 */

/**
 * Default poster image (climbing placeholder)
 * Used as fallback when video thumbnails are not available
 */
export const getDefaultVideoPoster = () => {
  return '/climbing-placeholder.svg';
};

/**
 * Format video duration in MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatVideoDuration = (seconds) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
