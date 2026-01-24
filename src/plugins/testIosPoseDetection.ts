/**
 * Test script for iOS Pose Detection Plugin - Step 1
 * 
 * Run this in browser console or create a test button in your app
 */

import IosPoseDetection from '@/plugins/IosPoseDetection';

export async function testIosPoseDetectionEcho() {
  console.log('🧪 Testing iOS Pose Detection Plugin - Echo Test...');
  
  // Debug: Check if Capacitor is available
  if (window.Capacitor) {
    console.log('✅ Capacitor is available');
    console.log('   Platform:', window.Capacitor.getPlatform());
    console.log('   Is native:', window.Capacitor.isNativePlatform());
    
    // NEW: List all registered plugins
    console.log('📋 Checking registered plugins...');
    try {
      // @ts-ignore - accessing internal API for debugging
      const pluginRegistry = window.Capacitor.Plugins;
      console.log('   Available plugins:', Object.keys(pluginRegistry));
      console.log('   IosPoseDetection exists?', 'IosPoseDetection' in pluginRegistry);
    } catch (e) {
      console.log('   Could not access plugin registry:', e);
    }
  } else {
    console.log('❌ Capacitor not available');
  }
  
  try {
    const result = await IosPoseDetection.echo({ message: 'Hello from JavaScript!' });
    console.log('✅ Echo test successful!');
    console.log('   Sent: "Hello from JavaScript!"');
    console.log('   Received:', result.message);
    return true;
  } catch (error) {
    console.error('❌ Echo test failed:', error);
    console.error('   Error details:', error.message);
    return false;
  }
}

/**
 * Step 2: Test image data transfer
 * Creates a small test image and sends to native
 */
export async function testImageTransfer() {
  console.log('🧪 Step 2: Testing image data transfer...');
  
  try {
    // Create a small test canvas (640x480 like video frames)
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Failed to get canvas context');
      return false;
    }
    
    // Draw something simple to verify
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = 'white';
    ctx.fillText('Test Frame', 320, 240);
    
    // Convert to base64 (JPEG for smaller size)
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    console.log('   Base64 data length:', base64Data.length);
    
    const result = await IosPoseDetection.processImage({ imageData: base64Data });
    
    console.log('✅ Image transfer successful!');
    console.log('   Sent: 640x480');
    console.log('   Received:', `${result.width}x${result.height}`);
    
    if (result.width === 640 && result.height === 480) {
      console.log('✅ Dimensions match! Step 2 complete.');
      return true;
    } else {
      console.warn('⚠️ Dimensions mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Image transfer failed:', error);
    return false;
  }
}

// Auto-run test if in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode detected - iOS Pose Detection plugin registered');
  console.log('   Run testIosPoseDetectionEcho() to test the bridge');
}
