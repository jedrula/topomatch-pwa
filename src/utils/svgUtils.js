/**
 * Utility functions for SVG conversion and manipulation
 */

/**
 * Convert pathPoints array to SVG path data string
 * @param {Array} pathPoints - Array of {x, y} coordinates
 * @returns {string} SVG path data string
 */
export function pathPointsToPathData(pathPoints) {
  if (!pathPoints || pathPoints.length === 0) {
    return "";
  }

  const commands = pathPoints.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${point.x} ${point.y}`;
  });

  // Auto-close the path
  commands.push("Z");

  return commands.join(" ");
}

/**
 * Convert pathPoints array to complete SVG markup string
 * @param {Array} pathPoints - Array of {x, y} coordinates
 * @param {Object} options - SVG styling options
 * @param {string} options.fill - Fill color (default: 'rgba(34, 197, 94, 0.3)')
 * @param {string} options.stroke - Stroke color (default: '#22c55e')
 * @param {number} options.strokeWidth - Stroke width (default: 2)
 * @returns {string} Complete SVG markup string
 */
export function pathPointsToSvgMarkup(pathPoints, options = {}) {
  if (!pathPoints || pathPoints.length === 0) {
    return "";
  }

  const { fill = "rgba(34, 197, 94, 0.3)", stroke = "#22c55e", strokeWidth = 2 } = options;

  const pathData = pathPointsToPathData(pathPoints);

  return `<path d="${pathData}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

/**
 * Ensure a hold object has the svgMarkup property
 * Converts from pathPoints if needed
 * @param {Object} hold - Hold object
 * @returns {Object} Hold object with svgMarkup property
 */
export function ensureHoldHasSvgMarkup(hold) {
  if (!hold) return hold;

  // If hold already has svgMarkup, return as-is
  if (hold.svgMarkup) {
    return hold;
  }

  // If hold has pathPoints, convert to svgMarkup
  if (hold.pathPoints && hold.pathPoints.length > 0) {
    return {
      ...hold,
      svgMarkup: pathPointsToSvgMarkup(hold.pathPoints),
    };
  }

  // Return hold as-is if no conversion possible
  return hold;
}
