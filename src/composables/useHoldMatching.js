/**
 * Composable for hold matching logic
 * Provides utilities for finding and scoring holds relative to keypoints
 */

/**
 * Extract hold coordinates in a consistent way
 * @param {Object} hold - The hold object from various sources
 * @returns {Object|null} - {x, y} coordinates or null if not found
 */
export function extractHoldCoordinates(hold) {
  let holdX, holdY;

  // PRIORITY 1: Check for explicit center coordinates
  if (hold.centerX !== undefined && hold.centerY !== undefined) {
    holdX = hold.centerX;
    holdY = hold.centerY;
  } 
  // PRIORITY 2: Check for center_x/center_y (alternative naming)
  else if (hold.center_x !== undefined && hold.center_y !== undefined) {
    holdX = hold.center_x;
    holdY = hold.center_y;
  }
  // PRIORITY 3: Calculate from coordinates object (bounding box format)
  else if (hold.coordinates) {
    holdX = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
    holdY = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
  } 
  // PRIORITY 4: Calculate from bbox array
  else if (hold.bbox && Array.isArray(hold.bbox)) {
    holdX = hold.bbox[0] + hold.bbox[2] / 2;
    holdY = hold.bbox[1] + hold.bbox[3] / 2;
  } 
  // PRIORITY 5: Calculate from bbox object
  else if (hold.bbox && typeof hold.bbox === 'object') {
    holdX = hold.bbox.x + (hold.bbox.width || 0) / 2;
    holdY = hold.bbox.y + (hold.bbox.height || 0) / 2;
  } 
  // PRIORITY 6: Use x,y coordinates (may be center or top-left depending on source)
  else if (hold.x !== undefined && hold.y !== undefined) {
    // Check if this is already a center coordinate (from our processed AI holds)
    // Our AI holds from the server have x,y as center coordinates already
    if (hold.source === 'ai-detected' || hold.aiModel === 'server-detection') {
      holdX = hold.x; // Already center coordinate in detection space (e.g., 1080x1440)
      holdY = hold.y; // Already center coordinate in detection space
    } else {
      // For other holds, treat x,y as top-left and calculate center
      holdX = hold.x + (hold.width || 0) / 2;
      holdY = hold.y + (hold.height || 0) / 2;
    }
  } 
  else {
    console.warn('❌ Unknown hold coordinate format:', hold);
    return null;
  }

  // NOTE: Holds are kept in their stored coordinate space (detection image space, e.g., 1080x1440)
  // Keypoints will be scaled to match this space in findClosestHolds()
  return { x: holdX, y: holdY };
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
export function findClosestHolds(keypointX, keypointY, bestMatchImage, boulderProblems) {
  if (!bestMatchImage || !bestMatchImage.name) {
    return { 
      closest: { hold: null, problem: null, distance: Infinity, score: 0 },
      secondClosest: { hold: null, problem: null, distance: Infinity, score: 0 },
      thirdClosest: { hold: null, problem: null, distance: Infinity, score: 0 }
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

    const distance = Math.sqrt(
      Math.pow(scaledKeypointX - coords.x, 2) + 
      Math.pow(scaledKeypointY - coords.y, 2)
    );
    const score = distance <= proximityThreshold ? 
      Math.round(((proximityThreshold - distance) / proximityThreshold) * 1000) / 1000 : 0;

    return {
      hold,
      distance: Math.round(distance),
      score,
      problem: null // Will be assigned for top 3 only
    };
  }).filter(Boolean); // Remove nulls from failed coordinate extraction

  // STEP 3: Sort and get top 3
  holdsWithDistances.sort((a, b) => a.distance - b.distance);
  const top3 = holdsWithDistances.slice(0, 3);
  
  // STEP 4: Find boulder problems ONLY for the top 3 winners
  top3.forEach(item => {
    if (boulderProblems && item.hold.id) {
      item.problem = findBoulderProblemForHold(item.hold.id, boulderProblems);
    }
  });
  
  // Extract results
  const closest = top3[0] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const secondClosest = top3[1] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const thirdClosest = top3[2] || { hold: null, problem: null, distance: Infinity, score: 0 };

  return { 
    closest, 
    secondClosest, 
    thirdClosest,
    allHoldsCount: allHolds.length
  };
}

/**
 * Process keypoints for a frame and find closest holds
 * @param {Object} frame - The frame data with original and transformed points
 * @param {Array} extractedFrames - Array of all extracted frames
 * @param {Object} bestMatchImage - The matched image data
 * @param {Array} boulderProblems - Array of boulder problems
 * @returns {Array} - Array of keypoint data with hold matching info
 */
export function getKeypointRows(frame, extractedFrames, bestMatchImage, boulderProblems) {
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

      keypointData.push({
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
      });
    });
  }

  return keypointData;
}
