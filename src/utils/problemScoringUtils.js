/**
 * Problem Scoring Utilities
 * Single source of truth for calculating boulder problem match scores
 */

/**
 * Calculate scores for all boulder problems based on keypoint-to-hold matches
 * 
 * This is the CANONICAL scoring function used everywhere:
 * - Table display in VideoFrameMatcherEnhanced
 * - Winner selection in useVideoAnalysis
 * - Any other scoring needs
 * 
 * SCORING APPROACH: Proportional credit to TOP 3 closest holds with CONFIDENCE WEIGHTING
 * - Each hold contributes: proximityScore × confidenceScore
 * - Proximity score: (300 - distance) / 300, ranges 0.0 to 1.0
 * - Confidence score: AI model's certainty about keypoint position (0.0 to 1.0)
 * - Example: Hold 51px away (proximity 0.83) but only 20% confident → final score: 0.83 × 0.2 = 0.166
 * - This prevents unreliable keypoint detections from skewing problem matches
 * 
 * @param {Array} transformedFrames - Array of frames with transformed keypoints
 * @param {Function} getKeypointRowsForFrame - Function that returns keypoint rows for a frame
 * @returns {Array} Sorted array of problem scores
 */
export function calculateProblemScores(transformedFrames, getKeypointRowsForFrame) {
  if (!transformedFrames || transformedFrames.length === 0) {
    return [];
  }
  
  const problemScoresMap = new Map(); // problemId -> {name, totalScore, matchCount, keypointContributions}
  
  console.log('🎯 === PROBLEM SCORING CALCULATION START ===');
  console.log(`Processing ${transformedFrames.length} frame(s)`);
  
  // Process all frames and keypoints
  transformedFrames.forEach((frame, frameIndex) => {
    const keypointRows = getKeypointRowsForFrame(frame);
    console.log(`\n📊 Frame ${frameIndex + 1}: ${keypointRows.length} keypoints`);
    
    keypointRows.forEach(keypoint => {
      // 🎯 ONE SCORE PER KEYPOINT PER PROBLEM: Only count the closest hold for each problem
      // ✨ CONFIDENCE WEIGHTING: Multiply score by keypoint confidence (0.0 to 1.0)
      // - If model is 20% confident about ankle position, that keypoint contributes only 20% of its proximity score
      // - This prevents unreliable detections from skewing results
      const confidence = keypoint.confidence || 0.5; // Default to 50% if missing
      
      const candidates = [
        { problem: keypoint.closestProblem, hold: keypoint.closestHold, score: keypoint.closestScore },
        { problem: keypoint.secondClosestProblem, hold: keypoint.secondClosestHold, score: keypoint.secondClosestScore },
        { problem: keypoint.thirdClosestProblem, hold: keypoint.thirdClosestHold, score: keypoint.thirdClosestScore }
      ];
      
      // Group candidates by problem to only count the best (closest) hold per problem
      const bestByProblem = new Map(); // problemId -> { problem, hold, score }
      
      candidates.forEach(({ problem, hold, score }) => {
        if (!problem || !hold || !score || score <= 0) return;
        
        const problemId = problem.id;
        const existing = bestByProblem.get(problemId);
        
        // Keep only the closest hold (highest score) for each problem
        if (!existing || score > existing.score) {
          bestByProblem.set(problemId, { problem, hold, score });
        }
      });
      
      // Now add scores - each problem gets credit for only its BEST hold per keypoint
      bestByProblem.forEach(({ problem, hold, score }) => {
        // Apply confidence weighting: finalScore = proximityScore × confidence
        const confidenceWeightedScore = score * confidence;
        
        const problemId = problem.id;
        const holdId = hold.id || hold.holdIndex;
        
        if (!problemScoresMap.has(problemId)) {
          problemScoresMap.set(problemId, {
            id: problemId,
            name: problem.name,
            grade: problem.grade,
            problem: problem, // Keep full problem reference
            totalScore: 0,
            matchCount: 0,
            keypointContributions: [] // Track each keypoint's contribution
          });
        }
        
        const problemData = problemScoresMap.get(problemId);
        
        // 🔥 NEW: Count EVERY keypoint match, even if same hold
        // If both hands are on the same hold, that's STRONG evidence!
        problemData.totalScore += confidenceWeightedScore;
        problemData.matchCount++;
        
        // Log the contribution
        problemData.keypointContributions.push({
          keypoint: keypoint.name,
          hold: holdId,
          proximityScore: score.toFixed(3),
          confidence: confidence.toFixed(2),
          finalScore: confidenceWeightedScore.toFixed(3)
        });
        
        console.log(`  ✅ ${keypoint.name} → ${problem.name} (${holdId}): ${score.toFixed(3)} × ${confidence.toFixed(2)} = ${confidenceWeightedScore.toFixed(3)}`);
      });
    });
  });
  
  // Convert to array and sort by total score (highest first)
  const results = Array.from(problemScoresMap.values())
    .map(problem => {
      // Count unique holds
      const uniqueHolds = new Set(problem.keypointContributions.map(c => c.hold));
      
      return {
        problem: problem.problem,
        score: problem.totalScore,
        confidence: Math.min(problem.totalScore, 1.0), // Legacy compatibility
        // Debug/display info
        uniqueHoldsMatched: uniqueHolds.size,
        matchCount: problem.matchCount,
        averageScorePerMatch: problem.matchCount > 0 ? 
          problem.totalScore / problem.matchCount : 0
      };
    })
    .sort((a, b) => b.score - a.score);
  
  console.log('\n🏆 === FINAL RANKINGS ===');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.problem.name}: ${(result.score * 100).toFixed(1)}% (${result.matchCount} matches, ${result.uniqueHoldsMatched} unique holds)`);
  });
  console.log('🎯 === SCORING CALCULATION END ===\n');
  
  return results;
}

/**
 * Format score for display
 * @param {number} score - Raw score value
 * @param {string} format - Display format: 'percentage', 'raw', or 'quality'
 * @returns {string} Formatted score
 */
export function formatScore(score, format = 'raw') {
  switch (format) {
    case 'percentage':
      return `${(score * 100).toFixed(1)}%`;
    case 'raw':
      return score.toFixed(2);
    case 'quality':
      return `${score.toFixed(2)} points`;
    default:
      return score.toFixed(2);
  }
}

/**
 * Get quality label for a score
 * @param {number} score - Raw score value
 * @returns {string} Quality label
 */
export function getScoreQuality(score) {
  if (score >= 8) return 'Excellent Match';
  if (score >= 5) return 'Very Good Match';
  if (score >= 3) return 'Good Match';
  if (score >= 1) return 'Fair Match';
  return 'Weak Match';
}
