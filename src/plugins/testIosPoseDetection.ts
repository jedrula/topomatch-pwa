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
    // Load a real climbing photo from test-data
    const testImagePath = '/test-images/kamil-pose.png';
    console.log('   Loading test image:', testImagePath);
    
    // Fetch the image
    const response = await fetch(testImagePath);
    const blob = await response.blob();
    
    // Convert to base64
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/png;base64, prefix
      };
      reader.readAsDataURL(blob);
    });
    
    console.log('   Detecting pose in real climbing photo...');
    const result = await IosPoseDetection.detectPose({ imageData: base64Data });
    
    console.log('✅ Pose detection successful!');
    console.log('   Detected keypoints:', result.keypoints.length);
    console.log('   Keypoint names:', result.keypoints.map(kp => kp.name).join(', '));
    
    // Log a few sample keypoints
    const samplePoints = result.keypoints.slice(0, 5);
    samplePoints.forEach((point) => {
      console.log(`   ${point.name}: (${point.x.toFixed(3)}, ${point.y.toFixed(3)}) confidence: ${point.confidence.toFixed(3)}`);
    });
    
    // Draw keypoints on the image for visual verification
    if (result.keypoints.length > 0) {
      await drawPoseOverlay(blob, result.keypoints);
    }
    
    if (result.keypoints.length > 0) {
      console.log('✅ Vision Framework detected real human pose! Step 3 validated.');
      return true;
    } else {
      console.warn('⚠️ No keypoints detected');
      return false;
    }
  } catch (error) {
    console.error('❌ Pose detection failed:', error);
    return false;
  }
}

/**
 * Draw pose keypoints overlay on image for visual verification
 */
async function drawPoseOverlay(imageBlob: Blob, keypoints: Array<{name: string, x: number, y: number, confidence: number}>) {
  const img = new Image();
  const imgUrl = URL.createObjectURL(imageBlob);
  
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imgUrl;
  });
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Draw keypoints as circles
  // Note: Vision uses bottom-left origin, Canvas uses top-left, so flip Y
  keypoints.forEach((kp) => {
    const x = kp.x * img.width;
    const y = (1 - kp.y) * img.height;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(kp.name.replace('_joint', ''), x + 12, y + 4);
  });
  
  // Draw skeleton connections
  const connections = [
    ['neck_1_joint', 'left_shoulder_1_joint'],
    ['neck_1_joint', 'right_shoulder_1_joint'],
    ['left_shoulder_1_joint', 'left_forearm_joint'],
    ['left_forearm_joint', 'left_hand_joint'],
    ['right_shoulder_1_joint', 'right_forearm_joint'],
    ['right_forearm_joint', 'right_hand_joint'],
    ['root', 'left_upLeg_joint'],
    ['root', 'right_upLeg_joint'],
    ['left_upLeg_joint', 'left_leg_joint'],
    ['left_leg_joint', 'left_foot_joint'],
    ['right_upLeg_joint', 'right_leg_joint'],
    ['right_leg_joint', 'right_foot_joint'],
  ];
  
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
  ctx.lineWidth = 3;
  
  connections.forEach(([from, to]) => {
    const fromKp = keypoints.find(kp => kp.name === from);
    const toKp = keypoints.find(kp => kp.name === to);
    
    if (fromKp && toKp) {
      ctx.beginPath();
      ctx.moveTo(fromKp.x * img.width, (1 - fromKp.y) * img.height);
      ctx.lineTo(toKp.x * img.width, (1 - toKp.y) * img.height);
      ctx.stroke();
    }
  });
  
  // Convert to data URL and display
  const dataUrl = canvas.toDataURL('image/png');
  
  // Create overlay div with image
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const imgElement = document.createElement('img');
  imgElement.src = dataUrl;
  imgElement.style.cssText = `
    max-width: 100%;
    max-height: 80%;
    object-fit: contain;
  `;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close (Tap anywhere)';
  closeButton.style.cssText = `
    margin-top: 20px;
    padding: 10px 20px;
    background: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
  `;
  
  overlay.appendChild(imgElement);
  overlay.appendChild(closeButton);
  
  overlay.onclick = () => {
    document.body.removeChild(overlay);
    URL.revokeObjectURL(imgUrl);
  };
  
  document.body.appendChild(overlay);
  
  console.log('👁️ Visual overlay displayed - tap to close');
}

// Auto-run test if in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Dev mode detected - iOS Pose Detection plugin registered');
  console.log('   Run testIosPoseDetectionEcho() to test the bridge');
}
