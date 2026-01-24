/**
 * iOS Vision Framework Pose Detection Service
 * 
 * Implements the unified PoseDetectionService interface using iOS Vision Framework.
 * This is a thin adapter that wraps the Capacitor plugin.
 * 
 * Vision Framework detects:
 * - Wrist joints → maps to leftHand/rightHand
 * - Ankle joints → maps to leftFoot/rightFoot
 */

import { PoseDetectionService, createKeypoint, createEmptyResult, createPoseResult } from '../types/poseDetection.js';
import { Capacitor } from '@capacitor/core';

export class IosVisionPoseService extends PoseDetectionService {
  constructor() {
    super();
    this.plugin = null;
    this.initialized = false;
  }

  async initialize() {
    console.log('🔧 iOS Vision: initialize() called, current state:', this.initialized);
    
    if (this.initialized) {
      console.log('✅ Already initialized, skipping');
      return;
    }

    // Verify we're on iOS
    console.log('📱 Checking platform...');
    if (Capacitor.getPlatform() !== 'ios') {
      throw new Error('iOS Vision service only available on iOS platform');
    }
    console.log('✅ Platform check passed: iOS');

    // Dynamically import the plugin (only loads on iOS)
    console.log('📦 Importing IosPoseDetection plugin...');
    try {
      const module = await import('../plugins/IosPoseDetection');
      console.log('📦 Module loaded:', module);
      console.log('📦 Module keys:', Object.keys(module));
      this.plugin = module.default; // Plugin is default export
      console.log('✅ Plugin assigned:', this.plugin);
    } catch (error) {
      console.error('❌ Failed to import plugin:', error);
      throw new Error(`Failed to import iOS Vision plugin: ${error.message}`);
    }
    
    // Test the connection with echo
    console.log('🔊 Testing plugin with echo...');
    try {
      console.log('   Calling plugin.echo...');
      const result = await this.plugin.echo({ message: 'Initialization test' });
      console.log('   Echo result:', result);
      console.log('✅ iOS Vision service initialized:', result.message);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Echo test failed - raw error:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error constructor:', error?.constructor?.name);
      console.error('   Error keys:', error ? Object.keys(error) : 'null');
      console.error('   Error.message:', error?.message);
      console.error('   Error.code:', error?.code);
      console.error('   Error string:', String(error));
      throw error;
    }
  }

  async detectPose(imageData) {
    console.log('🔍 iOS Vision detectPose called, initialized:', this.initialized);
    
    if (!this.initialized) {
      console.log('⚠️ Not initialized, initializing now...');
      await this.initialize();
    }

    console.log('📸 Converting ImageData to base64...');
    // Convert ImageData to base64
    const base64 = await this._imageDataToBase64(imageData);
    console.log('✅ Base64 conversion complete, length:', base64.length);
    
    try {
      console.log('🎯 Calling Vision plugin detectPose...');
      const result = await this.plugin.detectPose({ imageData: base64 });
      console.log('📦 Vision plugin result:', result);
      
      if (!result.detected || !result.keypoints) {
        return createEmptyResult('ios-vision', 'vision', result.processingTimeMs || 0);
      }

      // Convert Vision format to unified format
      // Vision already returns { leftHand, rightHand, leftFoot, rightFoot }
      // with normalized coordinates (0-1) and Y already flipped
      const keypoints = {
        leftHand: result.keypoints.leftHand ? createKeypoint(
          result.keypoints.leftHand.x,
          result.keypoints.leftHand.y,
          result.keypoints.leftHand.confidence
        ) : null,
        rightHand: result.keypoints.rightHand ? createKeypoint(
          result.keypoints.rightHand.x,
          result.keypoints.rightHand.y,
          result.keypoints.rightHand.confidence
        ) : null,
        leftFoot: result.keypoints.leftFoot ? createKeypoint(
          result.keypoints.leftFoot.x,
          result.keypoints.leftFoot.y,
          result.keypoints.leftFoot.confidence
        ) : null,
        rightFoot: result.keypoints.rightFoot ? createKeypoint(
          result.keypoints.rightFoot.x,
          result.keypoints.rightFoot.y,
          result.keypoints.rightFoot.confidence
        ) : null,
      };

      return createPoseResult(
        keypoints,
        'ios-vision',
        'vision',
        result.processingTimeMs || 0
      );
    } catch (error) {
      console.error('❌ iOS Vision detection failed:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      return createEmptyResult('ios-vision', 'vision', 0);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  async dispose() {
    // No cleanup needed for iOS plugin
    this.initialized = false;
    this.plugin = null;
  }

  getModelInfo() {
    return {
      name: 'iOS Vision Framework',
      provider: 'vision',
      keypointCount: 4,
      format: 'wrists + ankles',
      trackedPoints: 'wrists + ankles',
    };
  }

  /**
   * Convert ImageData to base64 string
   * @private
   */
  async _imageDataToBase64(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to base64 (JPEG for smaller size)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(base64);
    });
  }
}
