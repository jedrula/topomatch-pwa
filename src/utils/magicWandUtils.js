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
  const distances = allHolds
    .map((hold, index) => ({
      hold,
      distance: calculateDistance(targetHold, hold),
      index,
    }))
    .filter((item) => item.hold !== targetHold) // Exclude the target hold itself
    .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
    .slice(0, count); // Take only the requested number

  return distances;
};

/**
 * Magic Wand main function - selects target hold + N closest holds with color filtering
 * @param {number} targetHoldIndex - Index of the clicked hold
 * @param {Array} allHolds - Array of all detection results
 * @param {number} proximityCount - Number of proximity holds to select (default: 10)
 * @param {boolean} enableColorFiltering - Whether to apply color similarity filtering (default: true)
 * @param {number} maxColorDistance - Maximum color distance for similarity (default: 50)
 * @returns {Object} Selection result with target and proximity holds
 */
export const performMagicWandSelection = (
  targetHoldIndex,
  allHolds,
  proximityCount = 10,
  enableColorFiltering = true,
  maxColorDistance = 50
) => {
  if (
    !allHolds ||
    allHolds.length === 0 ||
    targetHoldIndex < 0 ||
    targetHoldIndex >= allHolds.length
  ) {
    console.warn("Magic Wand: Invalid input parameters");
    return {
      success: false,
      targetHold: null,
      proximityHolds: [],
      selectedIndices: [],
    };
  }

  const targetHold = allHolds[targetHoldIndex];

  // Step 1: Find closest holds by proximity
  const proximityResults = findClosestHolds(targetHold, allHolds, proximityCount);

  let finalProximityHolds = proximityResults;

  // Step 2: Apply color filtering if enabled
  if (enableColorFiltering && proximityResults.length > 0) {
    const candidateHolds = proximityResults.map((result) => result.hold);
    const colorSimilarHolds = findSimilarColorHolds(targetHold, candidateHolds, maxColorDistance);

    // Filter proximity results to only include color-similar holds
    finalProximityHolds = proximityResults.filter((result) =>
      colorSimilarHolds.includes(result.hold)
    );

    console.log(
      `Magic Wand: Color filtering reduced selection from ${proximityResults.length} to ${finalProximityHolds.length} holds`
    );
  }

  // Extract the hold indices for easy selection tracking
  const selectedIndices = [targetHoldIndex, ...finalProximityHolds.map((result) => result.index)];

  const result = {
    success: true,
    targetHold: {
      hold: targetHold,
      index: targetHoldIndex,
    },
    proximityHolds: finalProximityHolds,
    selectedIndices: selectedIndices,
    stats: {
      totalHolds: allHolds.length,
      proximityFiltered: proximityResults.length,
      colorFiltered: enableColorFiltering ? finalProximityHolds.length : proximityResults.length,
      selected: selectedIndices.length,
      colorFilteringEnabled: enableColorFiltering,
      averageDistance:
        finalProximityHolds.length > 0
          ? Math.round(
              finalProximityHolds.reduce((sum, r) => sum + r.distance, 0) /
                finalProximityHolds.length
            )
          : 0,
      maxDistance:
        finalProximityHolds.length > 0
          ? Math.round(Math.max(...finalProximityHolds.map((r) => r.distance)))
          : 0,
    },
  };

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
    y: hold.y + (hold.height || 0) / 2,
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
 * Calculate color difference using RGB Euclidean distance
 * @param {Object} color1 - RGB color object { r, g, b }
 * @param {Object} color2 - RGB color object { r, g, b }
 * @returns {number} Color distance (0 = identical, higher = more different)
 */
export const calculateColorDistance = (color1, color2) => {
  if (!color1 || !color2) return Infinity;

  const dr = (color1.r || 0) - (color2.r || 0);
  const dg = (color1.g || 0) - (color2.g || 0);
  const db = (color1.b || 0) - (color2.b || 0);

  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Extract color from hold data
 * @param {Object} hold - Hold object that may contain color information
 * @returns {Object|null} RGB color object or null if no color found
 */
export const extractHoldColor = (hold) => {
  if (!hold?.color_analysis) return null;

  // Primary: Use dominant color RGB array
  const rgb = hold.color_analysis.dominant_color_rgb;
  if (Array.isArray(rgb) && rgb.length >= 3) {
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }

  // Fallback: Use mean color RGB array
  const meanRgb = hold.color_analysis.mean_color_rgb;
  if (Array.isArray(meanRgb) && meanRgb.length >= 3) {
    return { r: meanRgb[0], g: meanRgb[1], b: meanRgb[2] };
  }

  return null;
};

/**
 * Find holds with similar colors using smart color matching
 * @param {Object} targetHold - The reference hold
 * @param {Array} candidateHolds - Array of holds to filter by color similarity
 * @param {number} maxColorDistance - Maximum color distance for similarity (default: 50)
 * @returns {Array} Filtered holds with similar colors
 */
export const findSimilarColorHolds = (targetHold, candidateHolds, maxColorDistance = 50) => {
  if (!targetHold || !candidateHolds || candidateHolds.length === 0) {
    return candidateHolds || [];
  }

  const targetColor = extractHoldColor(targetHold);
  const targetCategory = targetHold.color_analysis?.color_category;

  if (!targetColor) {
    console.log("Magic Wand: No color data found for target hold, returning all candidates");
    return candidateHolds;
  }

  const similarHolds = candidateHolds.filter((hold) => {
    const holdColor = extractHoldColor(hold);
    if (!holdColor) return false; // Skip holds without color data

    const colorDistance = calculateColorDistance(targetColor, holdColor);

    // First filter: RGB color distance
    if (colorDistance > maxColorDistance) {
      return false;
    }

    // Second filter: If we have color categories, prefer exact category matches
    // but be defensive and allow some cross-category matches for similar colors
    if (targetCategory && hold.color_analysis?.color_category) {
      const holdCategory = hold.color_analysis.color_category;

      // Exact category match is always good
      if (targetCategory === holdCategory) {
        return true;
      }

      // For non-exact category matches, be more strict with color distance
      if (colorDistance > maxColorDistance * 0.6) {
        return false;
      }
    }

    return true;
  });

  const targetCategoryInfo = targetCategory ? ` (${targetCategory})` : "";
  console.log(
    `Magic Wand: Color filtering - Target: RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b})${targetCategoryInfo}, Found ${similarHolds.length}/${candidateHolds.length} similar holds (max distance: ${maxColorDistance})`
  );

  return similarHolds;
};
