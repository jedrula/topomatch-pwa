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
 * @param {number} holdIndex - The hold index to search for
 * @param {Array} boulderProblems - Array of boulder problem objects
 * @returns {Object|null} - The boulder problem or null if not found
 */
export function findBoulderProblemForHold(holdIndex, boulderProblems) {
  if (!boulderProblems) return null;
  
  for (const problem of boulderProblems) {
    if (problem.holds && problem.holds.some(h => h.holdIndex === holdIndex)) {
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
  const allHoldsWithDistances = [];

  // DUAL SOURCE: Check both AI detection results AND manual holds from boulder problems
  // Source 1: AI detection results from Firestore hold detection service
  if (bestMatchImage.detectionResults && bestMatchImage.detectionResults.results) {
    bestMatchImage.detectionResults.results.forEach((detectedHold, index) => {
      const coords = extractHoldCoordinates(detectedHold);
      if (!coords) {
        console.warn(`⚠️ Could not extract coords from AI hold #${index}:`, detectedHold);
        return;
      }

      const distance = Math.sqrt(Math.pow(scaledKeypointX - coords.x, 2) + Math.pow(scaledKeypointY - coords.y, 2));
      const score = distance <= proximityThreshold ? 
        Math.round(((proximityThreshold - distance) / proximityThreshold) * 1000) / 1000 : 0;

      // Look up which boulder problem this hold belongs to
      const holdIndex = detectedHold.holdIndex ?? index;
      const associatedProblem = findBoulderProblemForHold(holdIndex, boulderProblems);

      allHoldsWithDistances.push({
        hold: {
          ...detectedHold,
          id: detectedHold.id || `detected_hold_${index}`,
          holdIndex: holdIndex,
          source: 'ai-detection'
        },
        problem: associatedProblem,
        distance: Math.round(distance),
        score: score
      });
    });
  }
  
  // Source 2: Manual holds from boulder problems  
  if (boulderProblems && boulderProblems.length > 0) {
    boulderProblems.forEach((problem) => {
      if (problem.holds && Array.isArray(problem.holds)) {
        problem.holds.forEach((holdWrapper) => {
          // Manual holds from boulder problems have structure: {holdIndex, hold: {...}, addedAt, role}
          // The actual hold data is in the nested 'hold' property
          const hold = holdWrapper.hold || holdWrapper;
          const coords = extractHoldCoordinates(hold);
          if (!coords) return;

          const distance = Math.sqrt(Math.pow(scaledKeypointX - coords.x, 2) + Math.pow(scaledKeypointY - coords.y, 2));
          const score = distance <= proximityThreshold ? 
            Math.round(((proximityThreshold - distance) / proximityThreshold) * 1000) / 1000 : 0;

          allHoldsWithDistances.push({
            hold: {
              ...hold,
              id: hold.id || `manual_hold_${holdWrapper.holdIndex || hold.holdIndex}`,
              holdIndex: holdWrapper.holdIndex || hold.holdIndex,
              source: 'manual'
            },
            problem: problem,
            distance: Math.round(distance),
            score: score
          });
        });
      }
    });
  }

  // Sort by distance and get top 3
  allHoldsWithDistances.sort((a, b) => a.distance - b.distance);
  
  const closest = allHoldsWithDistances[0] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const secondClosest = allHoldsWithDistances[1] || { hold: null, problem: null, distance: Infinity, score: 0 };
  const thirdClosest = allHoldsWithDistances[2] || { hold: null, problem: null, distance: Infinity, score: 0 };

  return { 
    closest, 
    secondClosest, 
    thirdClosest,
    allHoldsCount: allHoldsWithDistances.length
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
  const keypointNames = ['Left Wrist', 'Right Wrist', 'Left Ankle', 'Right Ankle'];
  const keypointData = [];

  // Get confidence values from the original pose data
  const originalFrame = extractedFrames[frame.frameIndex];
  const poseKeypoints = originalFrame?.poseData?.keypoints;

  if (frame.originalPoints && frame.transformedPoints) {
    frame.originalPoints.forEach((originalPoint, index) => {
      if (index < keypointNames.length) {
        // Get confidence for this specific keypoint
        let confidence = 0.5; // default
        if (poseKeypoints) {
          switch (index) {
            case 0:
              confidence = poseKeypoints.leftWrist?.confidence || 0;
              break;
            case 1:
              confidence = poseKeypoints.rightWrist?.confidence || 0;
              break;
            case 2:
              confidence = poseKeypoints.leftAnkle?.confidence || 0;
              break;
            case 3:
              confidence = poseKeypoints.rightAnkle?.confidence || 0;
              break;
          }
        }

        // Find the closest holds - no contextual filtering, just pure distance
        const holdsInfo = findClosestHolds(
          frame.transformedPoints[index].x,
          frame.transformedPoints[index].y,
          bestMatchImage,
          boulderProblems
        );

        keypointData.push({
          name: keypointNames[index],
          original: originalPoint,
          transformed: frame.transformedPoints[index],
          confidence: confidence,
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
      }
    });
  }

  return keypointData;
}
