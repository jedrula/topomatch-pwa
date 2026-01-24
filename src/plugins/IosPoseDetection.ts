/**
 * iOS Pose Detection Plugin
 * 
 * Capacitor plugin that wraps iOS Vision Framework for native pose detection.
 * Step 1: Echo test to verify Capacitor bridge works
 * 
 * ⚠️ iOS ONLY - Factory pattern ensures this is never called on web
 */

import { registerPlugin } from '@capacitor/core';

export interface IosPoseDetectionPlugin {
  /**
   * Echo test - verify plugin communication works
   * @param options - { message: string }
   * @returns Promise<{ message: string }>
   */
  echo(options: { message: string }): Promise<{ message: string }>;
  
  /**
   * Step 2: Process image data - verify base64 transfer works
   * @param options - { imageData: string } - base64 encoded image
   * @returns Promise<{ width: number, height: number, success: boolean }>
   */
  processImage(options: { imageData: string }): Promise<{ 
    width: number; 
    height: number; 
    success: boolean 
  }>;
  
  /**
   * Step 3: Detect pose using Vision Framework
   * @param options - { imageData: string } - base64 encoded image
   * @returns Promise<{ keypoints: Array<{name: string, x: number, y: number, confidence: number}>, success: boolean }>
   */
  detectPose(options: { imageData: string }): Promise<{
    keypoints: Array<{ name: string; x: number; y: number; confidence: number }>;
    success: boolean;
  }>;
}

const IosPoseDetection = registerPlugin<IosPoseDetectionPlugin>('IosPoseDetection');

export default IosPoseDetection;
