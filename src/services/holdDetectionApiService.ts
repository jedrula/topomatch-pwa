/**
 * TypeScript-enhanced Hold Detection API Service
 * 
 * This demonstrates the first practical use of TypeScript in the app.
 * It provides type-safe versions of key functions used by the hold detection store.
 */

import type {
  HoldDetectionStatusResponse,
  HoldDetectionUploadResponse,
  HoldDetectionHealthResponse,
  FrontendDetectionResults,
  ProcessingStatus
} from '@/types/holdDetectionApi'

import {
  isHoldDetectionStatusResponse,
  isProcessingComplete,
  isProcessingFailed,
  CONFIDENCE_THRESHOLDS
} from '@/types/holdDetectionApi'

import { convertApiResponseToFrontendFormat } from '@/types/holdDetectionUtils'
import { configService } from './configService.js'

/**
 * Get the configured API URL
 */
function getApiUrl(): string {
  return configService.getHoldDetectionServerUrl()
}

/**
 * Type-safe API health check
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const baseUrl = getApiUrl()
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true' // Required for ngrok tunnels
      }
    })
    
    if (!response.ok) {
      console.warn(`Health check failed: ${response.status} ${response.statusText}`)
      return false
    }
    
    const data = await response.json() as HoldDetectionHealthResponse
    console.log('✅ API Health check successful:', data)
    return true
  } catch (error) {
    console.error('❌ API Health check failed:', error)
    return false
  }
}

/**
 * Type-safe image upload to processing API
 */
export async function uploadImageForProcessing(
  imageFile: File,
  options?: {
    confidence_threshold?: number
    max_detections?: number
  }
): Promise<string> {
  try {
    const baseUrl = getApiUrl()
    const formData = new FormData()
    formData.append('file', imageFile, imageFile.name)
    
    if (options?.confidence_threshold) {
      formData.append('confidence_threshold', options.confidence_threshold.toString())
    }
    if (options?.max_detections) {
      formData.append('max_detections', options.max_detections.toString())
    }
    
    const response = await fetch(`${baseUrl}/api/v1/process`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true' // Required for ngrok tunnels
        // Note: Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status}: ${errorText}`)
    }
    
    const result = await response.json() as HoldDetectionUploadResponse
    
    if (!result.job_id) {
      throw new Error('Server response missing job_id')
    }
    
    return result.job_id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error'
    throw new Error(`Failed to upload image: ${errorMessage}`)
  }
}

/**
 * Type-safe job result polling with progress callback
 */
export async function pollForJobResults(
  jobId: string,
  progressCallback?: (status: ProcessingStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<FrontendDetectionResults> {
  let attempts = 0
  const baseUrl = getApiUrl()
  
  const poll = async (): Promise<FrontendDetectionResults> => {
    attempts++
    
    if (attempts > maxAttempts) {
      throw new Error('Polling timeout: Maximum attempts exceeded')
    }
    
    console.log(`🔄 Polling job ${jobId}, attempt ${attempts}/${maxAttempts}`)
    
    const response = await fetch(`${baseUrl}/api/v1/status/${jobId}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`)
    }
    
    const statusResponse = await response.json()
    
    // Type guard to ensure we have a valid response structure
    if (!isHoldDetectionStatusResponse(statusResponse)) {
      throw new Error('Invalid status response structure')
    }
    
    const { status, result } = statusResponse
    
    // Call progress callback if provided
    if (progressCallback) {
      progressCallback(status)
    }
    
    if (isProcessingComplete(status)) {
      if (!result) {
        throw new Error('Processing completed but no result data received')
      }
      
      // Convert API response to frontend format with full type safety
      return convertApiResponseToFrontendFormat(statusResponse)
    }
    
    if (isProcessingFailed(status)) {
      const errorMsg = result?.error_message || 'Unknown processing error'
      throw new Error(`Processing failed: ${errorMsg}`)
    }
    
    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    return poll()
  }
  
  return poll()
}

/**
 * Type-safe helper to filter high-confidence holds
 */
export function getHighConfidenceHolds(results: FrontendDetectionResults) {
  return results.holds.filter(hold => 
    hold.confidence >= CONFIDENCE_THRESHOLDS.HIGH
  )
}

/**
 * Type-safe helper to get processing statistics
 */
export function getProcessingStats(results: FrontendDetectionResults) {
  return {
    totalHolds: results.holds.length,
    highConfidenceHolds: getHighConfidenceHolds(results).length,
    processingTime: results.processing_time || 0,
    yoloInferenceTime: results.yolo_results?.inference_time || 0,
    sam2ProcessingTime: results.sam2_results?.processing_time || 0,
    avgConfidence: results.holds.length > 0 
      ? results.holds.reduce((sum, hold) => sum + hold.confidence, 0) / results.holds.length 
      : 0
  }
}

/**
 * Export types for use in other files
 */
export type {
  HoldDetectionStatusResponse,
  FrontendDetectionResults,
  ProcessingStatus
} from '@/types/holdDetectionApi'

/**
 * Main service object for easy importing
 */
export const holdDetectionApiService = {
  checkApiHealth,
  uploadImageForProcessing,
  pollForJobResults,
  getHighConfidenceHolds,
  getProcessingStats
}