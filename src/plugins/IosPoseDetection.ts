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
}

const IosPoseDetection = registerPlugin<IosPoseDetectionPlugin>('IosPoseDetection');

export default IosPoseDetection;
