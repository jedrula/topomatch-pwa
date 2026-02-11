/**
 * Composable for hold matching logic
 * Provides utilities for finding and scoring holds relative to keypoints
 */

/**
 * Extract hold center coordinates and dimensions
 * REQUIRED: Hold MUST have center point AND dimensions
 * 
 * Supported formats:
 * 1. AI holds: { centerX, centerY, width, height }
 * 2. Manual holds: { centerPoint: {x, y}, width, height } OR extract from SVG path
 * 
 * @param {Object} hold - The hold object
 * @returns {Object} - {x, y, width, height} or throws error
 */
export function extractHoldCoordinates(hold) {
  let centerX, centerY, width, height;
  
  // Extract center coordinates
  if (hold.centerX !== undefined && hold.centerY !== undefined) {
    // Format 1: AI holds with centerX/centerY
    centerX = hold.centerX;
    centerY = hold.centerY;
  } else if (hold.centerPoint?.x !== undefined && hold.centerPoint?.y !== undefined) {
    // Format 2: Manual holds with centerPoint object
    centerX = hold.centerPoint.x;
    centerY = hold.centerPoint.y;
  } else {
    throw new Error(`Hold missing center coordinates (need centerX/centerY OR centerPoint.x/.y): ${JSON.stringify(hold)}`);
  }
  
  // Extract dimensions
  if (hold.width !== undefined && hold.height !== undefined) {
    width = hold.width;
    height = hold.height;
  } else if (hold.svgMarkup) {
    // Manual hold with SVG path - calculate bounding box from path
    const bounds = calculateSVGPathBounds(hold.svgMarkup);
    if (bounds) {
      width = bounds.width;
      height = bounds.height;
    } else {
      throw new Error(`Manual hold has SVG but cannot extract bounds: ${hold.svgMarkup.substring(0, 100)}...`);
    }
  } else {
    throw new Error(`Hold missing dimensions (need width/height OR svgMarkup): ${JSON.stringify(hold)}`);
  }

  return { x: centerX, y: centerY, width, height };
}

/**
 * Calculate bounding box from SVG path string
 * @param {string} svgMarkup - SVG path markup
 * @returns {Object|null} - {width, height} or null if parsing fails
 */
function calculateSVGPathBounds(svgMarkup) {
  try {
    // Extract all coordinates from path (M, L commands)
    const coordPattern = /([ML])\s*([\d.]+)\s+([\d.]+)/g;
    const coords = [];
    let match;
    
    while ((match = coordPattern.exec(svgMarkup)) !== null) {
      coords.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
    }
    
    if (coords.length === 0) return null;
    
    // Find bounding box
    const xs = coords.map(c => c.x);
    const ys = coords.map(c => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      width: maxX - minX,
      height: maxY - minY
    };
  } catch (err) {
    console.error('Failed to parse SVG path bounds:', err);
    return null;
  }
}

/**
 * Find which boulder problem a hold belongs to
 * @param {string} holdId - The hold ID to search for
 * @param {Array} boulderProblems - Array of boulder problem objects
 * @returns {Object|null} - The boulder problem or null if not found
 */
export function findBoulderProblemForHold(holdId, boulderProblems) {
  if (!boulderProblems || !holdId) return null;
  
  for (const problem of boulderProblems) {
    if (problem.holds && problem.holds.some(h => h.holdId === holdId)) {
      return problem;
    }
  }
  return null;
}

/**
 * Find the three closest holds to a keypoint
 * @param {number} keypointX - X coordinate of the keypoint
 * @param {number} keypointY - Y coordinate of the keypoint
 * @param {Object} bestMatchImage - The matched image data with holds
 * @param {Array} boulderProblems - Array of boulder problem objects
 * @returns {Object} - Object with closest, secondClosest, thirdClosest holds
 */
/**
 * Number of closest holds to track per keypoint
 * Increase this to track more alternatives (e.g., top 5 instead of top 3)
 */
const CLOSEST_HOLDS_COUNT = 3;

/**
 * Find closest holds to a keypoint
 * Returns the N closest holds with their distances and associated problems
 * 
 * @param {number} keypointX - Transformed keypoint X in reference image space
 * @param {number} keypointY - Transformed keypoint Y in reference image space
 * @param {Object} bestMatchImage - Matched image with dimensions and holds
 * @param {Array} boulderProblems - Boulder problems with hold associations
 * @returns {Object} { closestHolds: [{hold, problem, distance, score}], allHoldsCount, allDistances, skippedProblems }
 */
export function findClosestHolds(keypointX, keypointY, bestMatchImage, boulderProblems) {
  if (!bestMatchImage || !bestMatchImage.name) {
    return { 
      closestHolds: Array(CLOSEST_HOLDS_COUNT).fill({ hold: null, problem: null, distance: Infinity, score: 0 }),
      allHoldsCount: 0,
      allDistances: [],
      skippedProblems: []
    };
  }

  // CRITICAL COORDINATE SPACE CONVERSION
  // Transformed keypoints are in REFERENCE IMAGE space (the actual loaded image dimensions, e.g., 1200x1600)
  // Holds are stored in DETECTION IMAGE space (the resized dimensions from AI detection, e.g., 1080x1440)
  // We MUST scale the keypoint to match the hold coordinate space before calculating distances!
  
  const referenceImageDims = bestMatchImage.referenceImageDimensions; // The actual loaded image (e.g., 1200x1600)
  const metadata = bestMatchImage.detectionResults?.imageMetadata;
  const detectionImageDims = metadata?.imageDimensions; // The AI detection dimensions (e.g., 1080x1440)
  
  let scaledKeypointX = keypointX;
  let scaledKeypointY = keypointY;
  
  if (referenceImageDims && detectionImageDims) {
    const scaleX = detectionImageDims.width / referenceImageDims.width;
    const scaleY = detectionImageDims.height / referenceImageDims.height;
    
    scaledKeypointX = keypointX * scaleX;
    scaledKeypointY = keypointY * scaleY;
  } else {
    console.warn(`⚠️ Missing dimensions for coordinate conversion:`, {
      hasReferenceImageDims: !!referenceImageDims,
      referenceImageDims,
      hasDetectionImageDims: !!detectionImageDims,
      detectionImageDims
    });
  }

  const proximityThreshold = 300;

  // STEP 1: Collect ALL holds (AI + Manual) - no need to iterate boulder problems!
  const allHolds = [];
  
  // Source 1: AI-detected holds
  if (bestMatchImage.detectionResults?.results) {
    bestMatchImage.detectionResults.results.forEach((hold, index) => {
      const holdId = hold.id || `ai_hold_${index}`;
      allHolds.push({ ...hold, id: holdId, source: 'ai-detected' });
    });
  }
  
  // Source 2: Manual holds
  if (bestMatchImage.manualHolds?.length > 0) {
    bestMatchImage.manualHolds.forEach((hold) => {
      const holdId = hold.id || `manual_${Date.now()}_${Math.random()}`;
      allHolds.push({ ...hold, id: holdId, source: 'manual' });
    });
  }
  
  console.log(`🔍 Collected ${allHolds.length} holds (${bestMatchImage.detectionResults?.results?.length || 0} AI + ${bestMatchImage.manualHolds?.length || 0} manual)`);

  // STEP 2: Calculate distances for all holds
  const holdsWithDistances = allHolds.map((hold) => {
    const coords = extractHoldCoordinates(hold);
    if (!coords) {
      console.warn(`⚠️ Could not extract coords from hold:`, hold);
      return null;
    }

    // 🎯 ELLIPSE-BASED DISTANCE CALCULATION
    // Approximate hold as ellipse using width/height from canonical format
    // If limb inside ellipse → distance = 0 (full score)
    // If limb outside ellipse → distance to closest point on ellipse edge
    
    // coords already contains {x, y, width, height} from extractHoldCoordinates
    const radiusX = coords.width / 2;
    const radiusY = coords.height / 2;
    
    // Translate keypoint to ellipse-centered coordinate system
    const dx = scaledKeypointX - coords.x;
    const dy = scaledKeypointY - coords.y;
    
    // Calculate normalized distance in ellipse space
    // Point is inside ellipse if: (dx/rx)² + (dy/ry)² ≤ 1
    const normalizedDistSq = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);
    
    let distance;
    if (normalizedDistSq <= 1.0) {
      // Keypoint is INSIDE ellipse → perfect match!
      distance = 0;
    } else {
      // Keypoint is OUTSIDE ellipse → find distance to nearest point on ellipse edge
      // Scale the vector to the ellipse boundary
      const scale = 1.0 / Math.sqrt(normalizedDistSq);
      const nearestX = coords.x + dx * scale;
      const nearestY = coords.y + dy * scale;
      
      distance = Math.sqrt(
        Math.pow(scaledKeypointX - nearestX, 2) + 
        Math.pow(scaledKeypointY - nearestY, 2)
      );
    }

    const score = distance <= proximityThreshold ? 
      Math.round(((proximityThreshold - distance) / proximityThreshold) * 1000) / 1000 : 0;

    return {
      hold,
      distance: Math.round(distance),
      score,
      problem: null, // Will be assigned for top 3 only
      skippedReason: null // Track if hold was skipped and why
    };
  }).filter((item) => {
    // Collect skipped holds for debugging
    if (!item) {
      return false; // Filter out nulls from failed coordinate extraction
    }
    return true;
  });

  // Track skipped holds (those that failed coordinate extraction)
  const skippedHolds = allHolds.map((hold) => {
    try {
      extractHoldCoordinates(hold);
      return null; // Successfully extracted, not skipped
    } catch (err) {
      // Find problem name if this hold belongs to one
      const problem = boulderProblems && hold.id ? 
        findBoulderProblemForHold(hold.id, boulderProblems) : null;
      return {
        problemName: problem?.name || 'Unknown',
        holdId: hold.id,
        reason: err.message
      };
    }
  }).filter(Boolean);

  // STEP 3: Sort and get top N
  holdsWithDistances.sort((a, b) => a.distance - b.distance);
  const topN = holdsWithDistances.slice(0, CLOSEST_HOLDS_COUNT);
  
  // STEP 4: Find boulder problems ONLY for the top N winners
  topN.forEach(item => {
    if (boulderProblems && item.hold.id) {
      item.problem = findBoulderProblemForHold(item.hold.id, boulderProblems);
    }
  });
  
  // Pad with null entries if we didn't find enough holds
  while (topN.length < CLOSEST_HOLDS_COUNT) {
    topN.push({ hold: null, problem: null, distance: Infinity, score: 0 });
  }
  
  // Legacy named properties (for backward compatibility - will be removed)
  const closest = topN[0];
  const secondClosest = topN[1];
  const thirdClosest = topN[2];

  // Build debug data (all distances with problem names)
  const allDistances = holdsWithDistances.map(item => {
    const problem = boulderProblems && item.hold.id ? 
      findBoulderProblemForHold(item.hold.id, boulderProblems) : null;
    return {
      problemName: problem?.name || `Hold ${item.hold.id}`,
      distance: item.distance
    };
  });

  return { 
    // New array-based API (use this going forward)
    closestHolds: topN,
    
    // Legacy named properties (DEPRECATED - for backward compatibility only)
    closest, 
    secondClosest, 
    thirdClosest,
    
    // Metadata
    allHoldsCount: allHolds.length,
    debugData: {
      totalHolds: allHolds.length,
      allDistances,
      skippedHolds
    }
  };
}

/**
 * Process keypoints for a frame and find closest holds
 * @param {Object} frame - The frame data with original and transformed points
 * @param {Array} extractedFrames - Array of all extracted frames
 * @param {Object} bestMatchImage - The matched image data
 * @param {Array} boulderProblems - Array of boulder problems
 * @param {boolean} includeDebugData - Whether to include detailed debug data for diagnostics
 * @returns {Array} - Array of keypoint data with hold matching info
 */
export function getKeypointRows(frame, extractedFrames, bestMatchImage, boulderProblems, includeDebugData = false) {
  const keypointData = [];

  // Simplified: The transformed points already have all the data we need!
  // Each point has: {name, x, y, confidence, ...}
  if (frame.originalPoints && frame.transformedPoints) {
    frame.transformedPoints.forEach((transformedPoint, index) => {
      const originalPoint = frame.originalPoints[index];
      
      // Find the closest holds - no contextual filtering, just pure distance
      const holdsInfo = findClosestHolds(
        transformedPoint.x,
        transformedPoint.y,
        bestMatchImage,
        boulderProblems
      );

      // Map technical names to display names
      const displayNames = {
        'leftHand': 'Left Wrist',
        'rightHand': 'Right Wrist',
        'leftFoot': 'Left Ankle',
        'rightFoot': 'Right Ankle'
      };

      const keypointRow = {
        name: displayNames[transformedPoint.name] || transformedPoint.name,
        original: originalPoint,
        transformed: transformedPoint,
        confidence: transformedPoint.confidence || 0,
        closestHold: holdsInfo.closest.hold,
        closestProblem: holdsInfo.closest.problem,
        distanceToHold: holdsInfo.closest.distance,
        closestScore: holdsInfo.closest.score,
        // Add second and third closest data
        secondClosestHold: holdsInfo.secondClosest.hold,
        secondClosestProblem: holdsInfo.secondClosest.problem,
        secondClosestDistance: holdsInfo.secondClosest.distance,
        secondClosestScore: holdsInfo.secondClosest.score,
        thirdClosestHold: holdsInfo.thirdClosest.hold,
        thirdClosestProblem: holdsInfo.thirdClosest.problem,
        thirdClosestDistance: holdsInfo.thirdClosest.distance,
        thirdClosestScore: holdsInfo.thirdClosest.score,
      };

      // Add debug data if requested (for diagnostics)
      if (includeDebugData && holdsInfo.debugData) {
        keypointRow.keypointX = transformedPoint.x;
        keypointRow.keypointY = transformedPoint.y;
        keypointRow.totalProblemsEvaluated = holdsInfo.debugData.totalHolds;
        keypointRow.allDistances = holdsInfo.debugData.allDistances;
        keypointRow.skippedProblems = holdsInfo.debugData.skippedHolds;
      }

      keypointData.push(keypointRow);
    });
  }

  return keypointData;
}
