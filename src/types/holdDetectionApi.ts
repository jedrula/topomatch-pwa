/**
 * TypeScript type definitions for Hold Detection Server API
 * 
 * This file defines the complete type structure for the hold detection server API responses.
 * Used for the /api/v1/status/{jobId} endpoint and related processing results.
 */

// Basic coordinate and detection types
export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YoloHold {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: string;
}

export interface ColorAnalysis {
  primary_color_rgb: [number, number, number];
  primary_color_bgr: [number, number, number];
  primary_color_hex: string;
  primary_color_hsv: [number, number, number];
  primary_color_lab: [number, number, number];
  median_color_lab: [number, number, number];
  mean_color_lab: [number, number, number];
  lab_based_hex: string;
  dominant_color_bgr: [number, number, number];
  dominant_color_rgb: [number, number, number];
  dominant_color_hex: string;
  mean_color_rgb: [number, number, number];
  median_color_rgb: [number, number, number];
  hsv_mean: [number, number, number];
  color_variance_rgb: number;
  color_variance_lab: number;
  brightness: number;
  saturation: number;
  lightness_lab: number;
  pixel_count: number;
  confidence_score: number;
  color_category: string;
  analysis_method: string;
}

export interface ProcessedHold {
  id: string;
  confidence: number;
  center_x: number;
  center_y: number;
  bbox: BBox;
  svg_path: string;
  segmentation_score: number | null;
  color_analysis: ColorAnalysis;
}

// Image information
export interface ImageInfo {
  filename: string;
  width: number;
  height: number;
  size_mb: number;
}

// YOLO processing results
export interface YoloResults {
  holds: YoloHold[];
  image_width: number;
  image_height: number;
  total_detections: number;
  inference_time: number;
  model_input_size: number;
  scale_factor: number;
}

// SAM2 processing results
export interface Sam2Results {
  total_points: number;
  successful_segmentations: number;
  success_rate: number;
  inference_time: number;
}

// Complete processing result
export interface ProcessingResult {
  job_id: string;
  timestamp: string;
  status: string;
  image_info: ImageInfo;
  yolo_results: YoloResults;
  sam2_results: Sam2Results;
  holds: ProcessedHold[];
  processing_time: number;
  svg_files: string[];
  svg_markups: string[];
  composite_svg: string;
  error_message: string | null;
}

// API Status Response (main response type)
export interface HoldDetectionStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: string;
  result: ProcessingResult;
}

// API Upload Response
export interface HoldDetectionUploadResponse {
  job_id: string;
  message?: string;
}

// API Health Response
export interface HoldDetectionHealthResponse {
  status: string;
  message?: string;
  version?: string;
  timestamp?: string;
}

// Error response type
export interface HoldDetectionErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

// Union type for all possible API responses
export type HoldDetectionApiResponse = 
  | HoldDetectionStatusResponse
  | HoldDetectionUploadResponse
  | HoldDetectionHealthResponse
  | HoldDetectionErrorResponse;

// Simplified hold type for frontend use (matching current store structure)
export interface SimpleHold {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: string;
  bbox?: [number, number, number, number]; // Alternative format [x, y, width, height]
  svgMarkup?: string;
  holdType?: string;
}

// Frontend store compatible results type
export interface FrontendDetectionResults {
  holds: SimpleHold[];
  svg_markups: string[];
  processing_time?: number;
  yolo_results?: {
    inference_time: number;
  };
  sam2_results?: {
    processing_time: number;
  };
  svg_generation_time?: number;
  metadata?: {
    processingTime?: number;
    yoloInferenceTime?: number;
    sam2ProcessingTime?: number;
    svgGenerationTime?: number;
  };
}

// Type guards for runtime type checking
export function isHoldDetectionStatusResponse(response: any): response is HoldDetectionStatusResponse {
  return response && 
    typeof response.job_id === 'string' && 
    typeof response.status === 'string' && 
    typeof response.progress === 'string' && 
    response.result;
}

export function isHoldDetectionErrorResponse(response: any): response is HoldDetectionErrorResponse {
  return response && typeof response.error === 'string';
}

export function isProcessingComplete(status: ProcessingStatus): boolean {
  return status === 'completed';
}

export function isProcessingFailed(status: ProcessingStatus): boolean {
  return status === 'failed';
}

// Utility types for specific use cases
export type HoldCoordinates = Pick<SimpleHold, 'x' | 'y' | 'width' | 'height'>;
export type HoldWithId = Pick<SimpleHold, 'id' | 'x' | 'y' | 'width' | 'height'>;
export type ProcessingStatus = HoldDetectionStatusResponse['status'];

// Constants for hold types and confidence thresholds
export const HOLD_TYPES = {
  HOLD: 'hold',
  START: 'start',
  FINISH: 'finish',
  UNKNOWN: 'unknown'
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5
} as const;

export type HoldType = typeof HOLD_TYPES[keyof typeof HOLD_TYPES];
export type ConfidenceLevel = keyof typeof CONFIDENCE_THRESHOLDS;