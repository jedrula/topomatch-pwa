/**
 * Pose Detection Memory Leak Test
 * 
 * Tests that memory is properly freed between inference runs.
 * Runs inference 5 times and checks for memory leaks.
 * 
 * Run with: npx playwright test tests/pose-detection-memory-leak.spec.js
 */

import { test, expect } from '@playwright/test';

const NUM_RUNS = 5;
const MAX_ACCEPTABLE_GROWTH_PERCENT = 20;

test.describe('Pose Detection Memory Leak Test', () => {
  test('should not leak memory across multiple inference runs', async ({ page }) => {
    console.log(`🧪 Testing memory stability across ${NUM_RUNS} inference runs...\n`);

    // Navigate to isolated test harness (DRY: reuse harness)
    await page.goto('/tests/pose-detection-harness.html');
    await page.waitForLoadState('networkidle');

    // Run inference multiple times and collect stats
    const runs = [];

    for (let i = 0; i < NUM_RUNS; i++) {
      console.log(`🔄 Run ${i + 1}/${NUM_RUNS}...`);

      // DRY: Just call the harness run() method
      const result = await page.evaluate(async () => {
        // Force GC if available
        if (window.gc) {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Run inference (harness handles everything)
        return await window.poseDetectionTest.run();
      });

      runs.push(result);

      console.log(`   Inference: ${result.inferenceTime}ms`);
      console.log(`   JS Heap: init ${(result.memory.initializationMemory / 1024 / 1024).toFixed(2)} MB, ` +
                  `inference ${(result.memory.inferenceMemory / 1024 / 1024).toFixed(2)} MB, ` +
                  `total ${(result.memory.totalHeapSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Log WASM info if available
      if (result.memory.wasm && result.memory.wasm.afterInference) {
        console.log(`   WASM: supported=${result.memory.wasm.afterInference.supported}, ` +
                    `available=${result.memory.wasm.afterInference.available}`);
      }
      console.log('');

      // Wait between runs to allow GC
      await page.waitForTimeout(500);
    }

    // Analyze results
    console.log('📊 Analysis:\n');

    // Inference time consistency (exclude first run which includes warmup)
    const times = runs.map(r => r.inferenceTime);
    const timesExcludingWarmup = times.slice(1); // Exclude first run
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minTimeAfterWarmup = Math.min(...timesExcludingWarmup);
    const maxTimeAfterWarmup = Math.max(...timesExcludingWarmup);

    console.log(`⏱️  Inference Time:`);
    console.log(`   Average: ${avgTime.toFixed(0)}ms`);
    console.log(`   Range: ${minTime}ms - ${maxTime}ms`);
    console.log(`   After warmup: ${minTimeAfterWarmup}ms - ${maxTimeAfterWarmup}ms`);

    // Memory leak detection (JS Heap)
    const heapSizes = runs.map(r => r.memory.totalHeapSize / 1024 / 1024);
    const firstHeap = heapSizes[0];
    const lastHeap = heapSizes[NUM_RUNS - 1];
    const heapGrowth = lastHeap - firstHeap;
    const heapGrowthPercent = (heapGrowth / firstHeap) * 100;

    console.log(`\n💾 JS Heap Memory Check:`);
    console.log(`   First run heap: ${firstHeap.toFixed(2)} MB`);
    console.log(`   Last run heap: ${lastHeap.toFixed(2)} MB`);
    console.log(`   Growth: ${heapGrowth.toFixed(2)} MB (${heapGrowthPercent.toFixed(1)}%)`);
    
    if (heapGrowthPercent > MAX_ACCEPTABLE_GROWTH_PERCENT) {
      console.log(`\n❌ MEMORY LEAK DETECTED!`);
      console.log(`   Heap grew ${heapGrowthPercent.toFixed(1)}% over ${NUM_RUNS} runs`);
      console.log(`   Threshold: ${MAX_ACCEPTABLE_GROWTH_PERCENT}%\n`);
      
      heapSizes.forEach((size, i) => {
        const growth = i > 0 ? size - heapSizes[i - 1] : 0;
        console.log(`   Run ${i + 1}: ${size.toFixed(2)} MB (${growth >= 0 ? '+' : ''}${growth.toFixed(2)} MB)`);
      });
    } else {
      console.log(`   ✅ No leak (growth ${heapGrowthPercent.toFixed(1)}% < ${MAX_ACCEPTABLE_GROWTH_PERCENT}%)`);
    }

    // WASM Memory Info
    console.log(`\n🔧 WASM Configuration:`);
    if (runs[0].memory.wasm && runs[0].memory.wasm.afterInference) {
      const wasmInfo = runs[0].memory.wasm.afterInference;
      console.log(`   Supported: ${wasmInfo.supported}`);
      if (wasmInfo.ortWasmConfig) {
        console.log(`   Threads: ${wasmInfo.ortWasmConfig.numThreads}`);
        console.log(`   SIMD: ${wasmInfo.ortWasmConfig.simd}`);
      }
      console.log(`   Note: WASM linear memory is managed internally by ONNX Runtime`);
      console.log(`   The JS heap measurements above include WASM-related JS objects`);
    } else {
      console.log(`   WASM info not available (expected on non-Chromium browsers)`);
    }

    // Assertions
    expect(heapGrowthPercent).toBeLessThan(MAX_ACCEPTABLE_GROWTH_PERCENT);
    // Check performance consistency after warmup (exclude first run)
    expect(maxTimeAfterWarmup).toBeLessThan(minTimeAfterWarmup * 2);

    console.log(`\n✅ Memory leak test passed!`);
  });
});
