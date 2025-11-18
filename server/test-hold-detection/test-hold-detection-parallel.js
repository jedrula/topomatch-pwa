#!/usr/bin/env node
/**
 * Test script for hold detection server - parallel uploads
 * Tests multiple concurrent image uploads to measure server capacity
 * 
 * Usage:
 *   HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection-parallel.js <image-path> [count]
 */

import { readFileSync } from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DETECTION_SERVER_URL = process.env.HOLD_DETECTION_SERVER_URL;

if (!DETECTION_SERVER_URL) {
  console.error('❌ Error: HOLD_DETECTION_SERVER_URL environment variable not set');
  console.error('');
  console.error('Usage:');
  console.error('  HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection-parallel.js <image-path> [count]');
  process.exit(1);
}

const imagePath = process.argv[2];
const parallelCount = parseInt(process.argv[3] || '4', 10);

if (!imagePath) {
  console.error('❌ Error: No image path provided');
  console.error('Usage: HOLD_DETECTION_SERVER_URL=https://your-url.ngrok.io node test-hold-detection-parallel.js <image-path> [count]');
  process.exit(1);
}

async function uploadImage(imagePath, requestNumber) {
  try {
    // Read file and prepare FormData
    const buffer = readFileSync(imagePath);
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: 'climbing_wall.jpg',
      contentType: 'image/jpeg'
    });
    
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
      return {
        requestNumber,
        success: false,
        status: response.status,
        elapsed,
        error: errorText.substring(0, 100)
      };
    }
    
    const result = await response.json();
    return {
      requestNumber,
      success: true,
      jobId: result.job_id,
      elapsed,
      status: response.status
    };
    
  } catch (error) {
    return {
      requestNumber,
      success: false,
      error: error.message,
      elapsed: 0
    };
  }
}

// Run parallel tests
(async () => {
  console.log('🧪 Hold Detection Server - Parallel Upload Test');
  console.log('===============================================');
  console.log(`📂 File: ${imagePath}`);
  
  const buffer = readFileSync(imagePath);
  console.log(`📦 Size: ${buffer.length.toLocaleString()} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`🌐 Server: ${DETECTION_SERVER_URL}`);
  console.log(`🔄 Parallel uploads: ${parallelCount}`);
  console.log('');
  console.log('📤 Starting parallel uploads...');
  console.log('');
  
  const startTime = Date.now();
  
  // Launch all requests in parallel
  const promises = [];
  for (let i = 1; i <= parallelCount; i++) {
    promises.push(uploadImage(imagePath, i));
  }
  
  // Wait for all to complete
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  // Display results
  console.log('📊 Results:');
  console.log('===========');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = `${(result.elapsed / 1000).toFixed(1)}s`;
    const info = result.success 
      ? `Job ID: ${result.jobId}`
      : `Error: ${result.error || 'Unknown'}`;
    console.log(`${status} Request #${result.requestNumber}: ${time.padStart(6)} - ${info}`);
  });
  
  // Summary statistics
  console.log('');
  console.log('📈 Summary:');
  console.log('===========');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.elapsed, 0) / successCount;
  const minTime = Math.min(...results.filter(r => r.success).map(r => r.elapsed));
  const maxTime = Math.max(...results.filter(r => r.success).map(r => r.elapsed));
  
  console.log(`✅ Successful: ${successCount}/${parallelCount}`);
  console.log(`❌ Failed: ${failCount}/${parallelCount}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);
  
  if (successCount > 0) {
    console.log(`📊 Response times:`);
    console.log(`   Min: ${(minTime / 1000).toFixed(1)}s`);
    console.log(`   Avg: ${(avgTime / 1000).toFixed(1)}s`);
    console.log(`   Max: ${(maxTime / 1000).toFixed(1)}s`);
  }
  
  // Exit with error if any failed
  process.exit(failCount > 0 ? 1 : 0);
})();
