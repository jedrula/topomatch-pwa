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
 * References hold by immutable ID (not array index)
 */
export interface ProblemHold {
  holdId: string;                // ✅ IMMUTABLE ID - stable across deletions
  hold: Hold;                    // Full hold object (for display)
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
export function createProblemHold(hold: Hold, role: ProblemHold['role'] = null): ProblemHold {
  return {
    holdId: hold.id,             // Use immutable hold ID
    hold,
    addedAt: new Date().toISOString(),
    role,
  };
}