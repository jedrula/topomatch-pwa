/**
 * Coordinate scaling utilities for handling different viewBox/coordinate systems
 * Used when pose projections and hold coordinates are in different coordinate systems
 */

/**
 * Calculate scaling factors between two coordinate systems
 * @param {Object} fromSystem - Source coordinate system {width, height}
 * @param {Object} toSystem - Target coordinate system {width, height}
 * @returns {Object} Scaling factors {scaleX, scaleY}
 */
export function getScalingFactors(fromSystem, toSystem) {
  if (!fromSystem || !toSystem || fromSystem.width <= 0 || fromSystem.height <= 0 || toSystem.width <= 0 || toSystem.height <= 0) {
    return { scaleX: 1, scaleY: 1 };
  }
  
  return {
    scaleX: toSystem.width / fromSystem.width,
    scaleY: toSystem.height / fromSystem.height
  };
}

/**
 * Scale a single point from one coordinate system to another
 * @param {Object} point - Point to scale {x, y}
 * @param {Object} scalingFactors - Scaling factors {scaleX, scaleY}
 * @returns {Object} Scaled point {x, y}
 */
export function scalePoint(point, scalingFactors) {
  if (!point || !scalingFactors) {
    return point;
  }
  
  return {
    x: point.x * scalingFactors.scaleX,
    y: point.y * scalingFactors.scaleY
  };
}

/**
 * Scale multiple points from one coordinate system to another
 * @param {Array} points - Array of points to scale [{x, y}, ...]
 * @param {Object} scalingFactors - Scaling factors {scaleX, scaleY}
 * @returns {Array} Array of scaled points
 */
export function scalePoints(points, scalingFactors) {
  if (!points || !scalingFactors) {
    return points;
  }
  
  return points.map(point => scalePoint(point, scalingFactors));
}

/**
 * Parse viewBox string to coordinate system dimensions
 * @param {String} viewBoxString - ViewBox string like "0 0 1080 1440"
 * @returns {Object} Dimensions {width, height} or null if invalid
 */
export function parseViewBoxDimensions(viewBoxString) {
  if (!viewBoxString || typeof viewBoxString !== 'string') {
    return null;
  }
  
  const parts = viewBoxString.split(' ');
  if (parts.length < 4) {
    return null;
  }
  
  const width = parseFloat(parts[2]);
  const height = parseFloat(parts[3]);
  
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return null;
  }
  
  return { width, height };
}

/**
 * Convert projected points from natural coordinates to stored coordinates for distance calculation
 * @param {Array} projectedPoints - Points in natural coordinate system
 * @param {Object} naturalDimensions - Natural image dimensions {width, height}
 * @param {String} storedViewBox - Stored viewBox string
 * @returns {Array} Points scaled to stored coordinate system
 */
export function convertProjectedPointsForDistanceCalculation(projectedPoints, naturalDimensions, storedViewBox) {
  const storedDimensions = parseViewBoxDimensions(storedViewBox);
  if (!storedDimensions || !naturalDimensions) {
    return projectedPoints; // No scaling possible
  }
  
  const scalingFactors = getScalingFactors(naturalDimensions, storedDimensions);
  
  console.log(`Converting projected points for distance calculation: ${naturalDimensions.width}×${naturalDimensions.height} → ${storedDimensions.width}×${storedDimensions.height} (scale: ${scalingFactors.scaleX.toFixed(3)}x, ${scalingFactors.scaleY.toFixed(3)}y)`);
  
  return scalePoints(projectedPoints, scalingFactors);
}

/**
 * Convert hold coordinates from stored coordinates to natural coordinates for display
 * @param {Array} holdCoordinates - Hold coordinates in stored coordinate system
 * @param {String} storedViewBox - Stored viewBox string
 * @param {Object} naturalDimensions - Natural image dimensions {width, height}
 * @returns {Array} Hold coordinates scaled to natural coordinate system
 */
export function convertHoldCoordinatesForDisplay(holdCoordinates, storedViewBox, naturalDimensions) {
  const storedDimensions = parseViewBoxDimensions(storedViewBox);
  if (!storedDimensions || !naturalDimensions) {
    return holdCoordinates; // No scaling possible
  }
  
  const scalingFactors = getScalingFactors(storedDimensions, naturalDimensions);
  
  console.log(`Converting hold coordinates for display: ${storedDimensions.width}×${storedDimensions.height} → ${naturalDimensions.width}×${naturalDimensions.height} (scale: ${scalingFactors.scaleX.toFixed(3)}x, ${scalingFactors.scaleY.toFixed(3)}y)`);
  
  return scalePoints(holdCoordinates, scalingFactors);
}

/**
 * Check if coordinate scaling is needed between two systems
 * @param {Object} system1 - First coordinate system {width, height}
 * @param {Object} system2 - Second coordinate system {width, height}
 * @param {Number} tolerance - Tolerance for considering systems equal (default: 0.01)
 * @returns {Boolean} True if scaling is needed
 */
export function isScalingNeeded(system1, system2, tolerance = 0.01) {
  if (!system1 || !system2) {
    return false;
  }
  
  const scalingFactors = getScalingFactors(system1, system2);
  
  return Math.abs(scalingFactors.scaleX - 1) > tolerance || 
         Math.abs(scalingFactors.scaleY - 1) > tolerance;
}