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

// Auto-run test if in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode detected - iOS Pose Detection plugin registered');
  console.log('   Run testIosPoseDetectionEcho() to test the bridge');
}
