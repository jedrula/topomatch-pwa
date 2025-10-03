/**
 * TypeScript utility functions for Hold Detection API
 * 
 * This file shows examples of how to use the TypeScript types 
 * with existing API calls. You can gradually convert existing 
 * JavaScript functions to use these types.
 */

import type {
  HoldDetectionStatusResponse,
  HoldDetectionUploadResponse,
  HoldDetectionHealthResponse,
  HoldDetectionErrorResponse,
  FrontendDetectionResults,
  SimpleHold,
  ProcessingStatus,
  HoldType
} from './holdDetectionApi';

import {
  HOLD_TYPES,
  CONFIDENCE_THRESHOLDS
} from './holdDetectionApi';

// Type-safe API client class (example of how to gradually migrate)
export class HoldDetectionApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Test API health with proper typing
   */
  async testHealth(): Promise<{ success: boolean; data?: HoldDetectionHealthResponse; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        const data: HoldDetectionHealthResponse = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload image for processing with proper typing
   */
  async uploadImage(imageBlob: Blob): Promise<{ success: boolean; data?: HoldDetectionUploadResponse; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'climbing_wall.jpg');

      const response = await fetch(`${this.baseUrl}/api/v1/process`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        body: formData
      });

      if (response.ok) {
        const data: HoldDetectionUploadResponse = await response.json();
        return { success: true, data };
      } else {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status}: ${errorText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Poll for job status with proper typing
   */
  async getJobStatus(jobId: string): Promise<{ success: boolean; data?: HoldDetectionStatusResponse; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/status/${jobId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        const data: HoldDetectionStatusResponse = await response.json();
        return { success: true, data };
      } else {
        throw new Error(`Status check failed: ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}

/**
 * Convert API response to frontend-compatible format
 */
export function convertApiResponseToFrontendFormat(
  apiResponse: HoldDetectionStatusResponse
): FrontendDetectionResults | null {
  if (!apiResponse.result || !apiResponse.result.holds) {
    return null;
  }

  const { result } = apiResponse;
  
  // Convert processed holds to simple holds format
  const holds: SimpleHold[] = result.holds.map(hold => ({
    id: hold.id,
    x: hold.bbox.x,
    y: hold.bbox.y,
    width: hold.bbox.width,
    height: hold.bbox.height,
    confidence: hold.confidence,
    type: hold.id.includes('start') ? HOLD_TYPES.START : 
          hold.id.includes('finish') ? HOLD_TYPES.FINISH : 
          HOLD_TYPES.HOLD,
    bbox: [hold.bbox.x, hold.bbox.y, hold.bbox.width, hold.bbox.height],
    svgMarkup: result.svg_markups?.[result.holds.indexOf(hold)],
    detectionConfidence: hold.confidence,
    holdType: hold.color_analysis?.color_category || 'unknown'
  }));

  return {
    holds,
    svg_markups: result.svg_markups || [],
    processing_time: result.processing_time,
    yolo_results: result.yolo_results ? {
      inference_time: result.yolo_results.inference_time
    } : undefined,
    sam2_results: result.sam2_results ? {
      processing_time: result.sam2_results.inference_time
    } : undefined,
    svg_generation_time: 0, // Not provided in API response
    metadata: {
      processingTime: result.processing_time,
      yoloInferenceTime: result.yolo_results?.inference_time,
      sam2ProcessingTime: result.sam2_results?.inference_time,
      svgGenerationTime: 0
    }
  };
}

/**
 * Filter holds by confidence level
 */
export function filterHoldsByConfidence(
  holds: SimpleHold[], 
  minConfidence: number = CONFIDENCE_THRESHOLDS.LOW
): SimpleHold[] {
  return holds.filter(hold => hold.confidence >= minConfidence);
}

/**
 * Filter holds by type
 */
export function filterHoldsByType(holds: SimpleHold[], type: HoldType): SimpleHold[] {
  return holds.filter(hold => hold.type === type);
}

/**
 * Get high confidence holds
 */
export function getHighConfidenceHolds(holds: SimpleHold[]): SimpleHold[] {
  return filterHoldsByConfidence(holds, CONFIDENCE_THRESHOLDS.HIGH);
}

/**
 * Type guard to check if processing is complete
 */
export function isProcessingComplete(status: ProcessingStatus): status is 'completed' {
  return status === 'completed';
}

/**
 * Type guard to check if processing failed
 */
export function isProcessingFailed(status: ProcessingStatus): status is 'failed' {
  return status === 'failed';
}

/**
 * Example of how to use these types in a Vue composable
 */
export function useHoldDetectionApi(baseUrl: string) {
  const client = new HoldDetectionApiClient(baseUrl);

  const processImageWithTypes = async (imageBlob: Blob): Promise<FrontendDetectionResults | null> => {
    // Upload image
    const uploadResult = await client.uploadImage(imageBlob);
    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    const jobId = uploadResult.data.job_id;

    // Poll for results
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const statusResult = await client.getJobStatus(jobId);
      if (!statusResult.success || !statusResult.data) {
        throw new Error(statusResult.error || 'Status check failed');
      }

      const { status } = statusResult.data;
      
      if (isProcessingComplete(status)) {
        return convertApiResponseToFrontendFormat(statusResult.data);
      }
      
      if (isProcessingFailed(status)) {
        throw new Error(`Processing failed: ${statusResult.data.result?.error_message || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Polling timeout: Maximum attempts exceeded');
  };

  return {
    client,
    processImageWithTypes,
    testHealth: () => client.testHealth(),
    getJobStatus: (jobId: string) => client.getJobStatus(jobId)
  };
}

// Export utility functions for type checking
export {
  HOLD_TYPES,
  CONFIDENCE_THRESHOLDS
} from './holdDetectionApi';