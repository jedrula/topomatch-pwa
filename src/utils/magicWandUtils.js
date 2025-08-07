/**
 * Magic Wand Utility Service
 * Handles proximity calculations and hold selection algorithms
 */

/**
 * Calculate Euclidean distance between two holds
 * @param {Object} hold1 - First hold with x, y coordinates
 * @param {Object} hold2 - Second hold with x, y coordinates
 * @returns {number} Distance between the two holds
 */
export const calculateDistance = (hold1, hold2) => {
  // Use the center point of each hold for distance calculation
  const x1 = hold1.x + (hold1.width || 0) / 2;
  const y1 = hold1.y + (hold1.height || 0) / 2;
  const x2 = hold2.x + (hold2.width || 0) / 2;
  const y2 = hold2.y + (hold2.height || 0) / 2;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Find the N closest holds to a target hold
 * @param {Object} targetHold - The hold to find neighbors for
 * @param {Array} allHolds - Array of all available holds
 * @param {number} count - Number of closest holds to return (default: 10)
 * @returns {Array} Array of objects with { hold, distance, index }
 */
export const findClosestHolds = (targetHold, allHolds, count = 10) => {
  console.time('magicWand-findClosestHolds');
  
  const distances = allHolds
    .map((hold, index) => ({
      hold,
      distance: calculateDistance(targetHold, hold),
      index
    }))
    .filter(item => item.hold !== targetHold) // Exclude the target hold itself
    .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
    .slice(0, count); // Take only the requested number
  
  console.timeEnd('magicWand-findClosestHolds');
  
  console.log(`Magic Wand: Found ${distances.length} closest holds to target:`, {
    targetHold: { x: targetHold.x, y: targetHold.y, confidence: targetHold.confidence },
    closestDistances: distances.slice(0, 3).map(d => ({ 
      distance: Math.round(d.distance), 
      confidence: d.hold.confidence?.toFixed(3) 
    }))
  });
  
  return distances;
};

/**
 * Magic Wand main function - selects target hold + N closest holds
 * @param {number} targetHoldIndex - Index of the clicked hold
 * @param {Array} allHolds - Array of all detection results
 * @param {number} proximityCount - Number of proximity holds to select (default: 10)
 * @returns {Object} Selection result with target and proximity holds
 */
export const performMagicWandSelection = (targetHoldIndex, allHolds, proximityCount = 10) => {
  console.time('magicWand-performSelection');
  
  if (!allHolds || allHolds.length === 0 || targetHoldIndex < 0 || targetHoldIndex >= allHolds.length) {
    console.warn('Magic Wand: Invalid input parameters');
    return {
      success: false,
      targetHold: null,
      proximityHolds: [],
      selectedIndices: []
    };
  }
  
  const targetHold = allHolds[targetHoldIndex];
  const proximityResults = findClosestHolds(targetHold, allHolds, proximityCount);
  
  // Extract the hold indices for easy selection tracking
  const selectedIndices = [targetHoldIndex, ...proximityResults.map(result => result.index)];
  
  const result = {
    success: true,
    targetHold: {
      hold: targetHold,
      index: targetHoldIndex
    },
    proximityHolds: proximityResults,
    selectedIndices: selectedIndices,
    stats: {
      totalHolds: allHolds.length,
      selected: selectedIndices.length,
      averageDistance: proximityResults.length > 0 
        ? Math.round(proximityResults.reduce((sum, r) => sum + r.distance, 0) / proximityResults.length)
        : 0,
      maxDistance: proximityResults.length > 0 
        ? Math.round(Math.max(...proximityResults.map(r => r.distance)))
        : 0
    }
  };
  
  console.timeEnd('magicWand-performSelection');
  
  console.log('Magic Wand Selection Result:', {
    targetIndex: targetHoldIndex,
    proximityCount: proximityResults.length,
    totalSelected: selectedIndices.length,
    stats: result.stats
  });
  
  return result;
};

/**
 * Get hold center point coordinates
 * @param {Object} hold - Hold object with x, y, width, height
 * @returns {Object} Center coordinates { x, y }
 */
export const getHoldCenter = (hold) => {
  return {
    x: hold.x + (hold.width || 0) / 2,
    y: hold.y + (hold.height || 0) / 2
  };
};

/**
 * Check if a hold index is in the magic wand selection
 * @param {number} holdIndex - Index to check
 * @param {Array} selectedIndices - Array of selected hold indices
 * @returns {boolean} True if hold is selected
 */
export const isHoldInMagicWandSelection = (holdIndex, selectedIndices) => {
  return selectedIndices && selectedIndices.includes(holdIndex);
};

/**
 * Future enhancement placeholder: Find holds with similar colors
 * @param {Object} targetHold - The reference hold
 * @param {Array} candidateHolds - Array of holds to filter by color similarity
 * @returns {Array} Filtered holds with similar colors
 */
export const findSimilarColorHolds = (targetHold, candidateHolds) => {
  // TODO: Implement color similarity algorithm
  // This would analyze the hold.color property or RGB values
  console.log('Color similarity filtering - coming in future iteration');
  return candidateHolds;
};
