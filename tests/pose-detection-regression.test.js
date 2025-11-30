/**
 * Pose Detection Regression Test (Playwright)
 * 
 * Tests that pose detection produces deterministic, consistent results.
 * 
 * Run with: npm test
 * Generate baseline: npm run test:baseline
 * 
 * This test:
 * - Loads real test image in real browser
 * - Runs actual YOLO pose detection (WASM)
 * - Compares coordinates to baseline
 * - Fails on ANY coordinate change (deterministic)
 */

import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASELINE_FILE = join(__dirname, 'pose-detection-baseline.json');
const TEST_IMAGE = '/test-data/wibrem/test-pose.png';

// Keypoints we care about (unified format)
const KEYPOINTS_TO_TEST = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'];

test.describe('Pose Detection Regression', () => {
  test('should detect pose with exact coordinates matching baseline', async ({ page }) => {
    // Load baseline
    let baseline;
    try {
      const baselineData = await readFile(BASELINE_FILE, 'utf-8');
      baseline = JSON.parse(baselineData);
      console.log(`📋 Loaded baseline from ${BASELINE_FILE}`);
      console.log(`   Model: ${baseline.model}`);
      console.log(`   Timestamp: ${baseline.timestamp}`);
    } catch (error) {
      throw new Error(
        `❌ No baseline found at ${BASELINE_FILE}\n` +
        `   Run: npm run test:baseline\n` +
        `   This will generate the baseline on first run.`
      );
    }

    // Navigate to ISOLATED test harness (not full app)
    await page.goto('/tests/pose-detection-harness.html');
    await page.waitForLoadState('networkidle');

    // Run pose detection via harness API
    const result = await page.evaluate(async () => {
      return await window.poseDetectionTest.run();
    });

    // Verify we got keypoints
    expect(result).toBeDefined();
    expect(result.keypoints).toBeDefined();

    // Compare each keypoint against baseline
    let allMatch = true;
    const mismatches = [];

    for (const name of KEYPOINTS_TO_TEST) {
      const current = result.keypoints[name];
      const expected = baseline.keypoints[name];

      // Exact coordinate match (deterministic)
      const xMatches = current.x === expected.x;
      const yMatches = current.y === expected.y;
      const confMatches = current.confidence === expected.confidence;
      const matches = xMatches && yMatches && confMatches;

      if (!matches) {
        allMatch = false;
        mismatches.push({
          name,
          expected,
          current,
          xDiff: current.x - expected.x,
          yDiff: current.y - expected.y,
          confDiff: current.confidence - expected.confidence,
        });
      }

      // Individual assertions for clear error messages
      expect(current.x, `${name} x-coordinate should match baseline`).toBe(expected.x);
      expect(current.y, `${name} y-coordinate should match baseline`).toBe(expected.y);
      expect(current.confidence, `${name} confidence should match baseline`).toBe(expected.confidence);
    }

    // If we get here, all coordinates matched!
    console.log('✅ All keypoints match baseline exactly');
    console.log(`   Inference time: ${result.inferenceTime}ms (baseline: ${baseline.inferenceTime}ms)`);
    
    // Check memory usage (warning, not failure)
    if (result.memory && baseline.memory) {
      console.log(`\n💾 Memory Comparison:`);
      console.log(`   Initialization: ${result.memory.initializationMemoryMB} MB (baseline: ${baseline.memory.initializationMemoryMB} MB)`);
      console.log(`   Inference: ${result.memory.inferenceMemoryMB} MB (baseline: ${baseline.memory.inferenceMemoryMB} MB)`);
      console.log(`   Total Heap: ${result.memory.totalUsedMB} MB (baseline: ${baseline.memory.totalUsedMB} MB)`);
      
      // Warn if memory increased significantly (>20%)
      const initMemIncrease = (parseFloat(result.memory.initializationMemoryMB) - parseFloat(baseline.memory.initializationMemoryMB)) / parseFloat(baseline.memory.initializationMemoryMB);
      const inferMemIncrease = (parseFloat(result.memory.inferenceMemoryMB) - parseFloat(baseline.memory.inferenceMemoryMB)) / parseFloat(baseline.memory.inferenceMemoryMB);
      
      if (initMemIncrease > 0.2) {
        console.warn(`⚠️  Initialization memory increased by ${(initMemIncrease * 100).toFixed(0)}%`);
      }
      if (inferMemIncrease > 0.2) {
        console.warn(`⚠️  Inference memory increased by ${(inferMemIncrease * 100).toFixed(0)}%`);
      }
    }

    // Generate visual artifact for this test run
    const visualArtifactDataUrl = await page.evaluate(async (keypoints) => {
      return await window.poseDetectionTest.generateVisualArtifact(null, keypoints);
    }, result.keypoints);

    // Save visual artifact
    const visualArtifactPath = join(__dirname, 'pose-detection-latest-run.png');
    const base64Data = visualArtifactDataUrl.replace(/^data:image\/png;base64,/, '');
    await writeFile(visualArtifactPath, base64Data, 'base64');
    
    console.log(`🖼️  Visual artifact saved: ${visualArtifactPath}`);
  });
});
