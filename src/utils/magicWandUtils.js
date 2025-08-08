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
  // Try center coordinates first (processed holds format)
  if (
    hold1.center_x !== undefined &&
    hold1.center_y !== undefined &&
    hold2.center_x !== undefined &&
    hold2.center_y !== undefined
  ) {
    const dx = hold2.center_x - hold1.center_x;
    const dy = hold2.center_y - hold1.center_y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Fallback to bbox format
  const x1 = hold1.bbox?.x || hold1.x || 0;
  const y1 = hold1.bbox?.y || hold1.y || 0;
  const width1 = hold1.bbox?.width || hold1.width || 0;
  const height1 = hold1.bbox?.height || hold1.height || 0;

  const x2 = hold2.bbox?.x || hold2.x || 0;
  const y2 = hold2.bbox?.y || hold2.y || 0;
  const width2 = hold2.bbox?.width || hold2.width || 0;
  const height2 = hold2.bbox?.height || hold2.height || 0;

  // Calculate center points
  const centerX1 = x1 + width1 / 2;
  const centerY1 = y1 + height1 / 2;
  const centerX2 = x2 + width2 / 2;
  const centerY2 = y2 + height2 / 2;

  const dx = centerX2 - centerX1;
  const dy = centerY2 - centerY1;

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
  proximityCount = 20,
  enableColorFiltering = true,
  maxColorDistance = 40
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

  // Use median color RGB array
  const medianRgb = hold.color_analysis.median_color_rgb;
  if (Array.isArray(medianRgb) && medianRgb.length >= 3) {
    return { r: medianRgb[0], g: medianRgb[1], b: medianRgb[2] };
  }

  return null;
};

/**
 * Find holds with similar colors using smart color matching
 * @param {Object} targetHold - The reference hold
 * @param {Array} candidateHolds - Array of holds to filter by color similarity
 * @param {number} maxColorDistance - Maximum color distance for similarity (default: 50)
 * @returns {Array} Filtered holds with similar colors (always returns at least one if candidates exist)
 */
export const findSimilarColorHolds = (targetHold, candidateHolds, maxColorDistance = 40) => {
  if (!targetHold || !candidateHolds || candidateHolds.length === 0) {
    return candidateHolds || [];
  }

  const targetColor = extractHoldColor(targetHold);

  if (!targetColor) {
    console.log("Magic Wand: No color data found for target hold, returning all candidates");
    return candidateHolds;
  }

  // Calculate color distances for all candidates
  const holdsWithDistances = candidateHolds
    .map((hold, index) => {
      const holdColor = extractHoldColor(hold);
      if (!holdColor) return null;

      const colorDistance = calculateColorDistance(targetColor, holdColor);
      return { hold, holdColor, colorDistance, candidateIndex: index };
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.colorDistance - b.colorDistance); // Sort by color similarity

  if (holdsWithDistances.length === 0) {
    console.log("Magic Wand: No holds with color data, returning all candidates");
    return candidateHolds;
  }

  // Always return at least the most similar one, plus any others within threshold
  const similarHolds = holdsWithDistances.filter((item) => item.colorDistance <= maxColorDistance);

  // If no holds within threshold, return the most similar one
  const finalItems = similarHolds.length > 0 ? similarHolds : [holdsWithDistances[0]];
  const finalHolds = finalItems.map((item) => item.hold);

  // Enhanced logging with detailed color information
  console.log(`🎯 Magic Wand Color Analysis:`);
  console.log(
    `Target: RGB(${targetColor.r}, ${targetColor.g}, ${targetColor.b}) - Category: ${
      targetHold.color_analysis?.color_category || "unknown"
    }`
  );
  console.log(
    `Found ${finalHolds.length}/${candidateHolds.length} similar holds (max distance: ${maxColorDistance})`
  );

  console.log(`📊 Selected holds details:`);
  finalItems.forEach((item, i) => {
    const category = item.hold.color_analysis?.color_category || "unknown";
    const holdId = item.hold.id || `hold_${item.candidateIndex}`;
    console.log(
      `  ${i + 1}. ${holdId}: RGB(${item.holdColor.r}, ${item.holdColor.g}, ${
        item.holdColor.b
      }) - Category: ${category} - Distance: ${item.colorDistance.toFixed(1)}`
    );
  });

  // Also log rejected holds if any
  const rejectedHolds = holdsWithDistances.filter((item) => item.colorDistance > maxColorDistance);
  if (rejectedHolds.length > 0 && similarHolds.length > 0) {
    console.log(`❌ Rejected holds (too different):`);
    rejectedHolds.slice(0, 3).forEach((item, i) => {
      // Show first 3 rejected
      const category = item.hold.color_analysis?.color_category || "unknown";
      const holdId = item.hold.id || `hold_${item.candidateIndex}`;
      console.log(
        `  ${i + 1}. ${holdId}: RGB(${item.holdColor.r}, ${item.holdColor.g}, ${
          item.holdColor.b
        }) - Category: ${category} - Distance: ${item.colorDistance.toFixed(1)}`
      );
    });
  }

  return finalHolds;
};
