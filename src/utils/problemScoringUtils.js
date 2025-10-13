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
 * SCORING APPROACH: Proportional credit to TOP 3 closest holds
 * - If hold A is 51px away and hold B is 55px away, BOTH get credit
 * - Scores are weighted: 1st place gets full credit, 2nd/3rd get proportional credit
 * - This avoids harsh "winner takes all" and recognizes ambiguous matches
 * 
 * @param {Array} transformedFrames - Array of frames with transformed keypoints
 * @param {Function} getKeypointRowsForFrame - Function that returns keypoint rows for a frame
 * @returns {Array} Sorted array of problem scores
 */
export function calculateProblemScores(transformedFrames, getKeypointRowsForFrame) {
  if (!transformedFrames || transformedFrames.length === 0) {
    return [];
  }
  
  const problemScoresMap = new Map(); // problemId -> {name, totalScore, matchCount, uniqueHolds}
  
  // Process all frames and keypoints
  transformedFrames.forEach(frame => {
    const keypointRows = getKeypointRowsForFrame(frame);
    
    keypointRows.forEach(keypoint => {
      // 🎯 PROPORTIONAL SCORING: Give credit to top 3 closest holds
      // This handles cases where multiple holds are similarly close
      const candidates = [
        { problem: keypoint.closestProblem, hold: keypoint.closestHold, score: keypoint.closestScore, weight: 1.0 },
        { problem: keypoint.secondClosestProblem, hold: keypoint.secondClosestHold, score: keypoint.secondClosestScore, weight: 0.5 },
        { problem: keypoint.thirdClosestProblem, hold: keypoint.thirdClosestHold, score: keypoint.thirdClosestScore, weight: 0.25 }
      ];
      
      candidates.forEach(({ problem, hold, score, weight }) => {
        if (!problem || !hold || !score || score <= 0) return;
        
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
            uniqueHolds: new Map() // holdId -> best score
          });
        }
        
        const problemData = problemScoresMap.get(problemId);
        problemData.matchCount++;
        
        // Apply weighted score
        const weightedScore = score * weight;
        
        // Track unique holds with their best scores (avoid double-counting)
        const currentBestScore = problemData.uniqueHolds.get(holdId) || 0;
        if (weightedScore > currentBestScore) {
          const scoreDiff = weightedScore - currentBestScore;
          problemData.totalScore += scoreDiff;
          problemData.uniqueHolds.set(holdId, weightedScore);
        }
      });
    });
  });
  
  // Convert to array and sort by total score (highest first)
  const results = Array.from(problemScoresMap.values())
    .map(problem => ({
      problem: problem.problem,
      score: problem.totalScore,
      confidence: Math.min(problem.totalScore, 1.0), // Legacy compatibility
      // Debug/display info
      uniqueHoldsMatched: problem.uniqueHolds.size,
      matchCount: problem.matchCount,
      averageScorePerHold: problem.uniqueHolds.size > 0 ? 
        problem.totalScore / problem.uniqueHolds.size : 0
    }))
    .sort((a, b) => b.score - a.score);
  
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
