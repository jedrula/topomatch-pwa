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

/**
 * Step 3: Test Vision Framework pose detection
 * Creates test image with a person-like shape and detects pose
 */
export async function testPoseDetection() {
  console.log('🧪 Step 3: Testing Vision Framework pose detection...');
  
  try {
    // Create a test canvas with person-like shape
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ Failed to get canvas context');
      return false;
    }
    
    // Draw a simple stick figure for testing
    // (In real use, we'll pass actual video frames)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 640, 480);
    
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    
    // Head
    ctx.beginPath();
    ctx.arc(320, 100, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.beginPath();
    ctx.moveTo(320, 130);
    ctx.lineTo(320, 280);
    ctx.stroke();
    
    // Arms
    ctx.beginPath();
    ctx.moveTo(320, 180);
    ctx.lineTo(260, 220);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(320, 180);
    ctx.lineTo(380, 220);
    ctx.stroke();
    
    // Legs
    ctx.beginPath();
    ctx.moveTo(320, 280);
    ctx.lineTo(280, 380);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(320, 280);
    ctx.lineTo(360, 380);
    ctx.stroke();
    
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    console.log('   Detecting pose in test image...');
    
    const result = await IosPoseDetection.detectPose({ imageData: base64Data });
    
    console.log('✅ Pose detection successful!');
    console.log('   Detected keypoints:', result.keypoints.length);
    console.log('   Keypoint names:', result.keypoints.map(kp => kp.name).join(', '));
    
    // Log a few sample keypoints
    const samplePoints = result.keypoints.slice(0, 3);
    samplePoints.forEach((point) => {
      console.log(`   ${point.name}: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) confidence: ${point.confidence.toFixed(3)}`);
    });
    
    if (result.keypoints.length > 0) {
      console.log('✅ Vision Framework working! Step 3 complete.');
      return true;
    } else {
      console.warn('⚠️ No keypoints detected (expected for simple test image)');
      return false;
    }
  } catch (error) {
    console.error('❌ Pose detection failed:', error);
    return false;
  }
}

// Auto-run test if in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode detected - iOS Pose Detection plugin registered');
  console.log('   Run testIosPoseDetectionEcho() to test the bridge');
}
