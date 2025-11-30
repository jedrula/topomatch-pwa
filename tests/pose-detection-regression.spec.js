import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASELINE_PATH = join(__dirname, 'pose-detection-baseline.json');
const TEST_HARNESS_PATH = '/tests/pose-detection-harness.html';

/**
 * Pose Detection Regression Tests
 * 
 * Uses isolated test harness (pose-detection-harness.html) instead of full app.
 * This ensures:
 * - Only pose detection code is tested
 * - No app dependencies (Firebase, router, etc.)
 * - Deterministic, reproducible results
 * - Fast test execution
 */

test.describe('Pose Detection Regression', () => {
  test('should match baseline coordinates exactly', async ({ page }) => {
    // Navigate to isolated test harness
    await page.goto(`http://localhost:5173${TEST_HARNESS_PATH}`);
    
    // Wait for harness to load
    await page.waitForLoadState('networkidle');

    // Run pose detection via the harness API
    const result = await page.evaluate(async () => {
      return await window.poseDetectionTest.run();
    });

    // Load baseline
    const baselineText = await readFile(BASELINE_PATH, 'utf-8');
    const baseline = JSON.parse(baselineText);

    // Verify we have a valid baseline
    if (!baseline.keypoints || Object.keys(baseline.keypoints).length === 0) {
      throw new Error('Baseline is empty. Run: npm run test:baseline first');
    }

    console.log('\n📊 Comparing results:');
    console.log(`Baseline: ${baseline.model} (${baseline.timestamp})`);
    console.log(`Current:  ${result.model} (${result.timestamp})`);
    console.log(`Inference time: ${result.inferenceTime}ms (baseline: ${baseline.inferenceTime}ms)\n`);

    // Test each keypoint for exact match
    const keypoints = ['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'];
    
    for (const name of keypoints) {
      const expected = baseline.keypoints[name];
      const actual = result.keypoints[name];

      console.log(`Testing ${name}:`);
      console.log(`  Expected: (${expected.x}, ${expected.y}, conf: ${expected.confidence})`);
      console.log(`  Actual:   (${actual.x}, ${actual.y}, conf: ${actual.confidence})`);

      // Exact coordinate match (deterministic)
      expect(actual.x).toBe(expected.x);
      expect(actual.y).toBe(expected.y);
      expect(actual.confidence).toBe(expected.confidence);

      console.log(`  ✅ MATCH\n`);
    }

    // Check inference time hasn't regressed significantly (±20%)
    const timeVariance = Math.abs(result.inferenceTime - baseline.inferenceTime) / baseline.inferenceTime;
    if (timeVariance > 0.2) {
      console.warn(`⚠️  Inference time variance: ${(timeVariance * 100).toFixed(1)}%`);
    }

    console.log('✅ All keypoints match baseline exactly!');
  });
});
