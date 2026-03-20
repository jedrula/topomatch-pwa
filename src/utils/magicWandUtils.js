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
 * Magic Wand main function - finds connected route of similar-colored holds
 * @param {string} targetHoldId - ID of the clicked hold
 * @param {Array} allHolds - Array of all holds in the image
 * @param {number} maxColorDistance - Maximum LAB color distance for similarity (default: 33)
 * @param {number} maxReachDistance - Maximum pixel distance between reachable holds (default: 500)
 * @returns {Object} Selection result with connected route holds
 */
export const performMagicWandSelection = (
  targetHoldId,
  allHolds,
  maxColorDistance = 33,
  maxReachDistance = 500,
  hueMap = null
) => {
  if (!allHolds || allHolds.length === 0 || !targetHoldId) {
    console.warn('Magic Wand: Invalid input parameters');
    return {
      success: false,
      targetHold: null,
      routeHolds: [],
      selectedHoldIds: [],
    };
  }

  const targetHoldIndex = allHolds.findIndex(h => h.id === targetHoldId);
  if (targetHoldIndex < 0) {
    console.warn('Magic Wand: Hold not found with id', targetHoldId);
    return { success: false, targetHold: null, routeHolds: [], selectedHoldIds: [] };
  }

  const targetHold = allHolds[targetHoldIndex];

  // Step 1: Find ALL color-similar holds across the entire image
  const colorSimilarHolds = findAllSimilarColorHolds(targetHold, allHolds, maxColorDistance, hueMap);

  if (colorSimilarHolds.length === 0) {
    return {
      success: true,
      targetHold: { hold: targetHold, index: targetHoldIndex },
      routeHolds: [],
      selectedHoldIds: [targetHoldId],
      stats: {
        totalHolds: allHolds.length,
        colorSimilar: 0,
        connected: 1,
        selected: 1,
      },
    };
  }

  // Step 2: Build reachability graph between color-similar holds
  const reachabilityGraph = buildReachabilityGraph(colorSimilarHolds, maxReachDistance);

  // Step 3: Find connected component containing the target hold
  const connectedIndices = findConnectedComponent(reachabilityGraph, targetHoldIndex);

  // Step 4: Build result — map indices back to hold IDs
  const routeHolds = colorSimilarHolds
    .filter(({ index }) => connectedIndices.has(index) && index !== targetHoldIndex)
    .map(({ hold, index }) => ({ hold, index }));

  const selectedHoldIds = Array.from(connectedIndices).map(i => allHolds[i].id);

  const result = {
    success: true,
    targetHold: {
      hold: targetHold,
      index: targetHoldIndex,
    },
    routeHolds: routeHolds,
    selectedHoldIds: selectedHoldIds,
    stats: {
      totalHolds: allHolds.length,
      colorSimilar: colorSimilarHolds.length,
      connected: connectedIndices.size,
      selected: selectedHoldIds.length,
      maxColorDistance: maxColorDistance,
      maxReachDistance: maxReachDistance,
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
 * Check if a hold is in the magic wand selection
 * @param {string} holdId - Hold ID to check
 * @param {Array} selectedHoldIds - Array of selected hold IDs
 * @returns {boolean} True if hold is selected
 */
export const isHoldInMagicWandSelection = (holdId, selectedHoldIds) => {
  return selectedHoldIds && selectedHoldIds.includes(holdId);
};

/**
 * Circular hue distance in degrees (result is 0–180).
 */
const hueDistance = (h1, h2) => {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

/**
 * Calculate color difference using LAB Euclidean distance
 * LAB color space is perceptually uniform, so Euclidean distance corresponds to human perception
 * @param {Object} color1 - LAB color object { l, a, b }
 * @param {Object} color2 - LAB color object { l, a, b }
 * @returns {number} Color distance (0 = identical, higher = more different)
 */
export const calculateColorDistance = (color1, color2) => {
  if (!color1 || !color2) return Infinity;

  const dl = (color1.l || 0) - (color2.l || 0);
  const da = (color1.a || 0) - (color2.a || 0);
  const db = (color1.b || 0) - (color2.b || 0);

  return Math.sqrt(dl * dl + da * da + db * db);
};

/**
 * Extract color from hold data
 * @param {Object} hold - Hold object that may contain color information
 * @returns {Object|null} LAB color object or null if no color found
 */
export const extractHoldColor = (hold) => {
  if (!hold?.color_analysis) return null;

  // Use primary color LAB array (perceptually uniform color space)
  const labColor = hold.color_analysis.primary_color_lab;
  if (Array.isArray(labColor) && labColor.length >= 3) {
    return { l: labColor[0], a: labColor[1], b: labColor[2] };
  }

  return null;
};

/**
 * Find all holds with similar colors across the entire image.
 * Uses LAB color distance when color_analysis is available, otherwise falls back
 * to matching by color category (hold.type).
 * @param {Object} targetHold - The reference hold
 * @param {Array} allHolds - All holds in the image
 * @param {number} maxColorDistance - Max LAB distance, or max hue degrees when hueMap is provided
 * @param {Map<number,number|null>|null} hueMap - Pixel-sampled hue per hold index (from precomputeHoldHues)
 * @returns {Array} All color-similar holds with their indices
 */
export const findAllSimilarColorHolds = (targetHold, allHolds, maxColorDistance = 33, hueMap = null) => {
  // Pixel-sampled hue comparison — most accurate, uses actual image data
  if (hueMap) {
    const targetIndex = allHolds.indexOf(targetHold);
    const targetHue = hueMap.get(targetIndex);
    if (targetHue !== null && targetHue !== undefined) {
      return allHolds
        .map((hold, index) => {
          const hue = hueMap.get(index);
          if (hue === null || hue === undefined) return null;
          const dist = hueDistance(targetHue, hue);
          return dist <= maxColorDistance ? { hold, index, colorDistance: dist } : null;
        })
        .filter(Boolean);
    }
  }

  const targetColor = extractHoldColor(targetHold);

  // LAB data available — use perceptual color distance
  if (targetColor) {
    const similarHolds = allHolds
      .map((hold, index) => {
        const holdColor = extractHoldColor(hold);
        if (!holdColor) return null;
        const colorDistance = calculateColorDistance(targetColor, holdColor);
        return colorDistance <= maxColorDistance ? { hold, index, colorDistance } : null;
      })
      .filter(Boolean);
    return similarHolds;
  }

  // Fallback: match by color category (hold.type)
  const targetType = targetHold.type;
  if (!targetType || targetType === 'unknown') {
    // No color info at all — return all holds so proximity graph still works
    return allHolds.map((hold, index) => ({ hold, index, colorDistance: 0 }));
  }

  return allHolds
    .map((hold, index) => ({ hold, index, colorDistance: 0 }))
    .filter(({ hold }) => hold.type === targetType);
};

/**
 * Build reachability graph - each hold connects to nearby holds within reach distance
 * @param {Array} holds - Array of {hold, index} objects
 * @param {number} maxReachDistance - Maximum pixel distance between reachable holds
 * @returns {Map} Adjacency list graph: holdIndex -> [neighborIndices]
 */
export const buildReachabilityGraph = (holds, maxReachDistance = 500) => {
  const graph = new Map();

  // Initialize empty adjacency lists
  holds.forEach(({ index }) => {
    graph.set(index, []);
  });

  // Build connections between all pairs within reach distance
  for (let i = 0; i < holds.length; i++) {
    for (let j = i + 1; j < holds.length; j++) {
      const hold1 = holds[i];
      const hold2 = holds[j];

      const distance = calculateDistance(hold1.hold, hold2.hold);

      if (distance <= maxReachDistance) {
        // Add bidirectional connection
        graph.get(hold1.index).push(hold2.index);
        graph.get(hold2.index).push(hold1.index);
      }
    }
  }

  return graph;
};

/**
 * Find connected component containing the target hold using BFS
 * @param {Map} graph - Adjacency list graph
 * @param {number} targetHoldIndex - Index of the clicked hold
 * @returns {Set} Set of hold indices in the same connected component
 */
export const findConnectedComponent = (graph, targetHoldIndex) => {
  const visited = new Set();
  const component = new Set();
  const queue = [targetHoldIndex];

  visited.add(targetHoldIndex);
  component.add(targetHoldIndex);

  while (queue.length > 0) {
    const currentIndex = queue.shift();
    const neighbors = graph.get(currentIndex) || [];

    for (const neighborIndex of neighbors) {
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        component.add(neighborIndex);
        queue.push(neighborIndex);
      }
    }
  }

  return component;
};
/**
 * Legacy function - kept for compatibility (now redirects to new implementation)
 * Find holds with similar colors using smart color matching
 * @param {Object} targetHold - The reference hold
 * @param {Array} candidateHolds - Array of holds to filter by color similarity
 * @param {number} maxColorDistance - Maximum color distance for similarity
 * @returns {Array} Filtered holds with similar colors
 */
export const findSimilarColorHolds = (targetHold, candidateHolds, maxColorDistance = 33) => {
  const targetColor = extractHoldColor(targetHold);
  if (!targetColor) {
    return candidateHolds || [];
  }

  return candidateHolds.filter((hold) => {
    const holdColor = extractHoldColor(hold);
    if (!holdColor) return false;

    const colorDistance = calculateColorDistance(targetColor, holdColor);
    return colorDistance <= maxColorDistance;
  });
};
