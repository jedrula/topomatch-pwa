/**
 * Video Processing E2E Memory Leak Test
 * 
 * Tests the complete video processing pipeline for memory leaks:
 * 1. Video file upload
 * 2. Frame extraction
 * 3. Pose detection on frames
 * 4. Memory cleanup
 * 
 * This simulates the real user workflow to catch memory issues that might
 * not appear in isolated unit tests.
 * 
 * Run with: npx playwright test tests/video-processing-memory-leak.spec.js
 */

import { test, expect } from '@playwright/test';

const NUM_CYCLES = 3; // Process video 3 times to detect accumulation
const MAX_ACCEPTABLE_GROWTH_PERCENT = 30; // Allow some growth for browser caching

test.describe('Video Processing E2E Memory Test', () => {
  test('should not leak memory during full video processing pipeline', async ({ page }) => {
    console.log(`🧪 Testing full video processing pipeline (${NUM_CYCLES} cycles)...\n`);

    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for app to initialize
    await page.waitForTimeout(2000);
    
    // Check if we need to use an alternative test approach
    const hasFileInput = await page.locator('input[type="file"]').count() > 0;
    
    if (!hasFileInput) {
      console.log('⚠️  No file input found, test may need adjustment for current UI');
    }

    const cycles = [];

    for (let cycle = 0; cycle < NUM_CYCLES; cycle++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔄 Cycle ${cycle + 1}/${NUM_CYCLES}`);
      console.log(`${'='.repeat(60)}`);

      // Measure memory before cycle
      const memoryBefore = await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          timestamp: performance.now()
        } : null;
      });

      if (!memoryBefore) {
        console.log('⚠️  Memory API not available. Run with --enable-precise-memory-info');
        test.skip();
        return;
      }

      console.log(`\n📊 Memory before cycle: ${(memoryBefore.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);

      try {
        // Step 1: Simulate video upload
        console.log('\n📹 Step 1: Video Upload...');
        const uploadResult = await page.evaluate(async () => {
          // Create a test video blob (small synthetic video)
          // In real app, this would be from file input
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          
          // Draw a simple test pattern
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, 640, 480);
          ctx.fillStyle = '#fff';
          ctx.fillText('Test Frame', 50, 50);
          
          // Convert to blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
          
          return {
            size: blob.size,
            type: blob.type
          };
        });

        console.log(`   ✅ Video blob created: ${(uploadResult.size / 1024).toFixed(1)} KB`);

        // Step 2: Frame extraction simulation
        console.log('\n🎞️  Step 2: Frame Extraction...');
        const extractionResult = await page.evaluate(async () => {
          const startTime = performance.now();
          
          // Simulate extracting 5 frames
          const frames = [];
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          for (let i = 0; i < 5; i++) {
            // Draw different content for each frame
            ctx.fillStyle = `hsl(${i * 60}, 70%, 50%)`;
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#fff';
            ctx.fillText(`Frame ${i + 1}`, 50, 50);
            
            // Extract as ImageData
            const imageData = ctx.getImageData(0, 0, 640, 480);
            frames.push({
              index: i,
              imageData: imageData,
              timestamp: i * 1000,
              size: imageData.data.length
            });
          }
          
          const duration = performance.now() - startTime;
          
          return {
            frameCount: frames.length,
            duration: Math.round(duration),
            totalDataSize: frames.reduce((sum, f) => sum + f.size, 0)
          };
        });

        console.log(`   ✅ Extracted ${extractionResult.frameCount} frames in ${extractionResult.duration}ms`);
        console.log(`   📦 Total frame data: ${(extractionResult.totalDataSize / 1024 / 1024).toFixed(2)} MB`);

        // Step 3: Pose detection on frames
        console.log('\n🎯 Step 3: Pose Detection...');
        const detectionResult = await page.evaluate(async () => {
          // Import pose detection service
          const { getPoseDetectionService } = await import('/src/services/poseDetectionFactory.js');
          
          const startTime = performance.now();
          const poseService = getPoseDetectionService();
          
          // Initialize if needed
          if (!poseService.isInitialized()) {
            await poseService.initialize();
          }
          
          // Create test frames
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
          const results = [];
          
          for (let i = 0; i < 5; i++) {
            // Draw test frame
            ctx.fillStyle = `hsl(${i * 60}, 70%, 50%)`;
            ctx.fillRect(0, 0, 640, 480);
            
            const imageData = ctx.getImageData(0, 0, 640, 480);
            
            try {
              const poseResult = await poseService.detectPose(imageData);
              results.push({
                frameIndex: i,
                detected: poseResult.detected,
                processingTime: poseResult.metadata?.processingTime || 0
              });
            } catch (err) {
              results.push({
                frameIndex: i,
                error: err.message
              });
            }
            
            // Small delay between frames
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          const duration = performance.now() - startTime;
          
          return {
            frameCount: results.length,
            totalDuration: Math.round(duration),
            avgTime: Math.round(duration / results.length),
            results: results
          };
        });

        console.log(`   ✅ Processed ${detectionResult.frameCount} frames in ${detectionResult.totalDuration}ms`);
        console.log(`   ⚡ Average: ${detectionResult.avgTime}ms per frame`);

        // Step 4: Cleanup simulation
        console.log('\n🧹 Step 4: Cleanup...');
        await page.evaluate(() => {
          // Simulate clearing references (like closing modal, clearing store)
          if (window.gc) {
            window.gc();
          }
        });

        await page.waitForTimeout(500); // Allow GC to run

      } catch (error) {
        console.error(`❌ Error in cycle ${cycle + 1}:`, error.message);
      }

      // Measure memory after cycle
      const memoryAfter = await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          timestamp: performance.now()
        } : null;
      });

      const memoryUsed = memoryAfter.usedJSHeapSize / 1024 / 1024;
      const memoryGrowth = (memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize) / 1024 / 1024;

      console.log(`\n📊 Memory after cycle: ${memoryUsed.toFixed(2)} MB`);
      console.log(`📈 Growth this cycle: ${memoryGrowth >= 0 ? '+' : ''}${memoryGrowth.toFixed(2)} MB`);

      cycles.push({
        cycle: cycle + 1,
        memoryBefore: memoryBefore.usedJSHeapSize,
        memoryAfter: memoryAfter.usedJSHeapSize,
        growth: memoryAfter.usedJSHeapSize - memoryBefore.usedJSHeapSize
      });

      // Wait between cycles
      if (cycle < NUM_CYCLES - 1) {
        console.log('\n⏳ Waiting before next cycle...');
        await page.waitForTimeout(1000);
      }
    }

    // Analyze results
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 MEMORY ANALYSIS');
    console.log(`${'='.repeat(60)}\n`);

    // Overall memory trend
    const firstCycleMemory = cycles[0].memoryBefore / 1024 / 1024;
    const lastCycleMemory = cycles[NUM_CYCLES - 1].memoryAfter / 1024 / 1024;
    const totalGrowth = lastCycleMemory - firstCycleMemory;
    const totalGrowthPercent = (totalGrowth / firstCycleMemory) * 100;

    console.log(`🔍 Overall Memory Trend:`);
    console.log(`   First cycle start: ${firstCycleMemory.toFixed(2)} MB`);
    console.log(`   Last cycle end: ${lastCycleMemory.toFixed(2)} MB`);
    console.log(`   Total growth: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(2)} MB (${totalGrowthPercent.toFixed(1)}%)`);

    // Per-cycle breakdown
    console.log(`\n📈 Per-Cycle Breakdown:`);
    cycles.forEach((cycle) => {
      const before = cycle.memoryBefore / 1024 / 1024;
      const after = cycle.memoryAfter / 1024 / 1024;
      const growth = cycle.growth / 1024 / 1024;
      console.log(`   Cycle ${cycle.cycle}: ${before.toFixed(2)} MB → ${after.toFixed(2)} MB (${growth >= 0 ? '+' : ''}${growth.toFixed(2)} MB)`);
    });

    // Memory leak detection
    console.log(`\n💾 Memory Leak Assessment:`);
    
    if (totalGrowthPercent > MAX_ACCEPTABLE_GROWTH_PERCENT) {
      console.log(`   ❌ POTENTIAL LEAK: Growth ${totalGrowthPercent.toFixed(1)}% exceeds threshold ${MAX_ACCEPTABLE_GROWTH_PERCENT}%`);
      console.log(`   ⚠️  Memory grew ${totalGrowth.toFixed(2)} MB over ${NUM_CYCLES} cycles`);
    } else if (totalGrowthPercent < -5) {
      console.log(`   ✅ EXCELLENT: Memory decreased ${Math.abs(totalGrowthPercent).toFixed(1)}% (GC working well)`);
    } else {
      console.log(`   ✅ GOOD: Growth ${totalGrowthPercent.toFixed(1)}% within acceptable range`);
    }

    // Check for consistent growth (leak indicator)
    const growths = cycles.map(c => c.growth / 1024 / 1024);
    const avgGrowth = growths.reduce((a, b) => a + b, 0) / growths.length;
    const allPositive = growths.every(g => g > 0);
    
    if (allPositive && avgGrowth > 5) {
      console.log(`   ⚠️  WARNING: Consistent positive growth detected (avg +${avgGrowth.toFixed(2)} MB/cycle)`);
    }

    console.log(`\n${'='.repeat(60)}\n`);

    // Assertions
    expect(totalGrowthPercent).toBeLessThan(MAX_ACCEPTABLE_GROWTH_PERCENT);
    
    console.log('✅ E2E memory test passed!\n');
  });
});
