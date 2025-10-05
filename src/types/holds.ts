/**
 * Comprehensive TypeScript type definitions for Hold entities across the application
 * 
 * This file defines consistent hold types that can be used across:
 * - AI hold detection results
 * - Manual holds (user-drawn)
 * - Boulder problem holds (holds assigned to routes)
 */

// Re-export hold detection types for consistency
export type { 
  HoldType, 
  HOLD_TYPES,
  YoloHold,
  ProcessedHold,
  SimpleHold,
  ColorAnalysis
} from './holdDetectionApi';

// ============================================================================
// CORE HOLD TYPES
// ============================================================================

/**
 * Point coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Base hold interface with common properties (matching API structure)
 */
export interface BaseHold {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number; // All holds have confidence (AI: 0-1, manual: 1)
  type: string; // Source type ('manual', 'ai') or hold classification ('jug', 'crimp', etc.)
  centerPoint?: Point;
  segmented?: boolean;
  iouScore?: number;
  svgMarkup?: string;
  tool?: string; // e.g., 'freehand'
  pathPoints?: Point[];
  timestamp?: string;
}

/**
 * AI-detected hold with detection metadata
 */
export interface AIDetectedHold extends BaseHold {
  // AI-specific properties
  bbox?: [number, number, number, number]; // [x, y, width, height]
  segmentationScore?: number;
  colorAnalysis?: any; // Will be typed more specifically when needed
}

/**
 * Manually placed hold
 */
export interface ManualHold extends BaseHold {
  // Manual hold specific properties
  notes?: string;
  userId?: string;
}

/**
 * Union type for all hold types
 */
export type Hold = AIDetectedHold | ManualHold;

/**
 * Hold with role information for boulder problems
 */
export interface ProblemHold {
  holdIndex: number;
  hold: Hold;
  addedAt: string;
  role: 'start' | 'finish' | 'intermediate' | null;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a hold is AI-detected
 */
export function isAIDetectedHold(hold: Hold): hold is AIDetectedHold {
  return hold.type !== 'manual' && hold.confidence < 1;
}

/**
 * Type guard to check if a hold is manual
 */
export function isManualHold(hold: Hold): hold is ManualHold {
  return hold.type === 'manual' || hold.confidence === 1;
}

// ============================================================================
// CREATION HELPERS
// ============================================================================

/**
 * Create a new AI-detected hold
 */
export function createAIHold(holdData: Omit<AIDetectedHold, 'timestamp'>): AIDetectedHold {
  return {
    ...holdData,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a new manual hold
 */
export function createManualHold(holdData: Omit<ManualHold, 'timestamp' | 'confidence'>): ManualHold {
  return {
    ...holdData,
    confidence: 1, // Manual holds always have confidence = 1
    timestamp: new Date().toISOString(),
  };
}

/**
 * Add a hold to a boulder problem with role information
 */
export function createProblemHold(hold: Hold, holdIndex: number, role: ProblemHold['role'] = null): ProblemHold {
  return {
    holdIndex,
    hold,
    addedAt: new Date().toISOString(),
    role,
  };
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert legacy SimpleHold to our new Hold type
 */
export function convertSimpleHoldToHold(simpleHold: any): Hold {
  // Determine if it's AI or manual based on available fields
  const isAI = simpleHold.type !== 'manual' && simpleHold.confidence < 1;
  
  const baseData = {
    id: simpleHold.id,
    x: simpleHold.x,
    y: simpleHold.y,
    width: simpleHold.width,
    height: simpleHold.height,
    confidence: simpleHold.confidence || 1,
    type: simpleHold.type || 'manual',
    centerPoint: simpleHold.centerPoint,
    segmented: simpleHold.segmented,
    iouScore: simpleHold.iouScore,
    svgMarkup: simpleHold.svgMarkup,
    tool: simpleHold.tool,
    pathPoints: simpleHold.pathPoints,
    timestamp: simpleHold.timestamp,
  };
  
  if (isAI) {
    return createAIHold({
      ...baseData,
      bbox: simpleHold.bbox,
      segmentationScore: simpleHold.segmentationScore,
      colorAnalysis: simpleHold.colorAnalysis,
    });
  } else {
    return createManualHold({
      ...baseData,
      notes: simpleHold.notes,
      userId: simpleHold.userId,
    });
  }
}

/**
 * Convert Hold back to SimpleHold for backward compatibility
 */
export function convertHoldToSimpleHold(hold: Hold): any {
  const base = {
    id: hold.id,
    x: hold.x,
    y: hold.y,
    width: hold.width,
    height: hold.height,
    confidence: hold.confidence,
    type: hold.type,
    centerPoint: hold.centerPoint,
    segmented: hold.segmented,
    iouScore: hold.iouScore,
    svgMarkup: hold.svgMarkup,
    tool: hold.tool,
    pathPoints: hold.pathPoints,
    timestamp: hold.timestamp,
  };

  if (isAIDetectedHold(hold)) {
    return {
      ...base,
      bbox: hold.bbox,
      segmentationScore: hold.segmentationScore,
      colorAnalysis: hold.colorAnalysis,
    };
  } else {
    return {
      ...base,
      notes: hold.notes,
      userId: hold.userId,
    };
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * @deprecated Use convertSimpleHoldToHold instead
 */
export const convertLegacyDetectionResults = convertSimpleHoldToHold;