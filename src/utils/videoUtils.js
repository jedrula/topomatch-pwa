/**
 * Utility functions for video handling
 */

/**
 * Default poster image (gray placeholder with play icon)
 * Used as fallback when video thumbnails are not available
 */
export const getDefaultVideoPoster = () => {
  return 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <rect width="320" height="180" fill="#f3f4f6"/>
      <g transform="translate(160, 90)">
        <circle r="24" fill="#9ca3af" opacity="0.8"/>
        <path d="M-6,-9 L-6,9 L12,0 Z" fill="white"/>
      </g>
      <text x="160" y="140" font-family="Arial, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">No preview</text>
    </svg>
  `);
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
