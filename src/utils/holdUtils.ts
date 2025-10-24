/**
 * Utility functions for working with Hold types across the application
 */

import type { 
  Hold, 
  AIDetectedHold, 
  ManualHold, 
  ProblemHold
} from '@/types/holds';

import { 
  isAIDetectedHold, 
  isManualHold, 
  createAIHold, 
  createManualHold,
  createProblemHold
} from '@/types/holds';

// Re-export type guards and creators for convenience
export {
  isAIDetectedHold,
  isManualHold,
  createAIHold,
  createManualHold,
  createProblemHold
};

// ============================================================================
// COMBINING AND SEPARATING HOLDS
// ============================================================================

/**
 * Combine AI and manual holds into a single array
 */
export function combineHolds(aiHolds: AIDetectedHold[], manualHolds: ManualHold[]): Hold[] {
  return [...aiHolds, ...manualHolds];
}

/**
 * Separate a mixed array of holds into AI and manual arrays
 */
export function separateHolds(holds: Hold[]): { aiHolds: AIDetectedHold[], manualHolds: ManualHold[] } {
  const aiHolds = holds.filter(isAIDetectedHold);
  const manualHolds = holds.filter(isManualHold);
  return { aiHolds, manualHolds };
}

// ============================================================================
// FILTERING AND SEARCHING
// ============================================================================

/**
 * Filter holds by type (manual, ai, or specific hold classifications)
 */
export function filterHoldsByType(holds: Hold[], type: string): Hold[] {
  return holds.filter(hold => hold.type === type);
}

/**
 * Get AI holds only
 */
export function getAIHolds(holds: Hold[]): AIDetectedHold[] {
  return holds.filter(isAIDetectedHold);
}

/**
 * Get manual holds only
 */
export function getManualHolds(holds: Hold[]): ManualHold[] {
  return holds.filter(isManualHold);
}

/**
 * Find a hold by ID
 */
export function findHoldById(holds: Hold[], id: string): Hold | undefined {
  return holds.find(hold => hold.id === id);
}

/**
 * Filter holds by confidence threshold
 */
export function filterHoldsByConfidence(holds: Hold[], minConfidence: number = 0.5): Hold[] {
  return holds.filter(hold => hold.confidence >= minConfidence);
}

/**
 * Get high confidence holds only (> 0.8 for AI, all manual holds)
 */
export function getHighConfidenceHolds(holds: Hold[]): Hold[] {
  return holds.filter(hold => {
    if (isManualHold(hold)) return true; // Manual holds are always high confidence
    return hold.confidence > 0.8;
  });
}

// ============================================================================
// SPATIAL UTILITIES
// ============================================================================

/**
 * Calculate distance between two holds
 */
export function calculateHoldDistance(hold1: Hold, hold2: Hold): number {
  const dx = (hold1.centerPoint?.x || hold1.x + hold1.width / 2) - (hold2.centerPoint?.x || hold2.x + hold2.width / 2);
  const dy = (hold1.centerPoint?.y || hold1.y + hold1.height / 2) - (hold2.centerPoint?.y || hold2.y + hold2.height / 2);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Find holds within a certain radius of a target hold
 */
export function findNearbyHolds(targetHold: Hold, allHolds: Hold[], radius: number): Hold[] {
  return allHolds.filter(hold => {
    if (hold.id === targetHold.id) return false; // Exclude the target hold itself
    return calculateHoldDistance(targetHold, hold) <= radius;
  });
}

/**
 * Check if two holds overlap
 */
export function doHoldsOverlap(hold1: Hold, hold2: Hold): boolean {
  return !(
    hold1.x + hold1.width < hold2.x ||
    hold2.x + hold2.width < hold1.x ||
    hold1.y + hold1.height < hold2.y ||
    hold2.y + hold2.height < hold1.y
  );
}

/**
 * Find overlapping holds
 */
export function findOverlappingHolds(holds: Hold[]): { hold1: Hold, hold2: Hold }[] {
  const overlaps: { hold1: Hold, hold2: Hold }[] = [];
  
  for (let i = 0; i < holds.length; i++) {
    for (let j = i + 1; j < holds.length; j++) {
      if (doHoldsOverlap(holds[i], holds[j])) {
        overlaps.push({ hold1: holds[i], hold2: holds[j] });
      }
    }
  }
  
  return overlaps;
}

// ============================================================================
// STATISTICS AND ANALYSIS
// ============================================================================

/**
 * Get basic statistics about a collection of holds
 */
export function getHoldStatistics(holds: Hold[]): {
  total: number;
  aiDetected: number;
  manual: number;
  averageConfidence: number;
  confidenceDistribution: { low: number; medium: number; high: number };
} {
  const aiHolds = getAIHolds(holds);
  const manualHolds = getManualHolds(holds);
  
  const totalConfidence = holds.reduce((sum, hold) => sum + hold.confidence, 0);
  const averageConfidence = holds.length > 0 ? totalConfidence / holds.length : 0;
  
  // Confidence distribution for AI holds only (manual holds are always 1.0)
  const aiConfidences = aiHolds.map(hold => hold.confidence);
  const confidenceDistribution = {
    low: aiConfidences.filter(conf => conf < 0.4).length,
    medium: aiConfidences.filter(conf => conf >= 0.4 && conf < 0.8).length,
    high: aiConfidences.filter(conf => conf >= 0.8).length + manualHolds.length, // Include all manual holds as high confidence
  };
  
  return {
    total: holds.length,
    aiDetected: aiHolds.length,
    manual: manualHolds.length,
    averageConfidence,
    confidenceDistribution,
  };
}

/**
 * Group holds by their type classification
 */
export function groupHoldsByType(holds: Hold[]): Record<string, Hold[]> {
  return holds.reduce((groups, hold) => {
    const type = hold.type || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(hold);
    return groups;
  }, {} as Record<string, Hold[]>);
}

// ============================================================================
// SERIALIZATION UTILITIES
// ============================================================================

/**
 * Serialize holds to JSON string
 */
export function serializeHolds(holds: Hold[]): string {
  return JSON.stringify(holds);
}

/**
 * Deserialize holds from JSON string
 * Note: Assumes data is already in correct Hold format (greenfield development)
 */
export function deserializeHolds(json: string): Hold[] {
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to deserialize holds:', error);
    return [];
  }
}

// ============================================================================
// BOULDER PROBLEM UTILITIES
// ============================================================================

/**
 * Create a problem hold from a regular hold
 */
export function createProblemHoldFromHold(
  hold: Hold, 
  holdIndex: number, 
  role: ProblemHold['role'] = null
): ProblemHold {
  return {
    holdIndex,
    hold,
    addedAt: new Date().toISOString(),
    role,
  };
}

/**
 * Extract holds from problem holds array
 */
export function extractHoldsFromProblemHolds(problemHolds: ProblemHold[]): Hold[] {
  return problemHolds.map(ph => ph.hold);
}

/**
 * Sort problem holds by their index
 */
export function sortProblemHoldsByIndex(problemHolds: ProblemHold[]): ProblemHold[] {
  return [...problemHolds].sort((a, b) => a.holdIndex - b.holdIndex);
}

/**
 * Filter problem holds by role
 */
export function filterProblemHoldsByRole(
  problemHolds: ProblemHold[], 
  role: ProblemHold['role']
): ProblemHold[] {
  return problemHolds.filter(ph => ph.role === role);
}
