#!/usr/bin/env node
/**
 * Test script for hold detection server
 * Tests image upload and measures response time
 * 
 * Usage:
 *   HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection.js <image-path>
 */

import { readFileSync } from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DETECTION_SERVER_URL = process.env.HOLD_DETECTION_SERVER_URL;

if (!DETECTION_SERVER_URL) {
  console.error('❌ Error: HOLD_DETECTION_SERVER_URL environment variable not set');
  console.error('');
  console.error('Usage:');
  console.error('  HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection.js <image-path>');
  process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('❌ Error: No image path provided');
  console.error('Usage: HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection.js <image-path>');
  process.exit(1);
}

async function uploadImage(imagePath) {
  try {
    // Read file and prepare FormData
    const buffer = readFileSync(imagePath);
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'climbing_wall.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log(`📂 File: ${imagePath}`);
    console.log(`📦 Size: ${buffer.length.toLocaleString()} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
    console.log(`🌐 Server: ${DETECTION_SERVER_URL}`);
    console.log('📤 Uploading...');
    
    // Send request and measure time
    const startTime = Date.now();
    const response = await fetch(`${DETECTION_SERVER_URL}/api/v1/process`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...formData.getHeaders()
      },
      body: formData
    });
    const elapsed = Date.now() - startTime;
    
    // Parse response
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
      console.log(`Error: ${errorText.substring(0, 200)}`);
      return { success: false, status: response.status, elapsed };
    }
    
    const result = await response.json();
    console.log(`✅ Success in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`📋 Job ID: ${result.job_id}`);
    
    return {
      success: true,
      jobId: result.job_id,
      elapsed,
      status: response.status
    };
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run test
(async () => {
  console.log('🧪 Hold Detection Server Test');
  console.log('==============================');
  const result = await uploadImage(imagePath);
  process.exit(result.success ? 0 : 1);
})();
