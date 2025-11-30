/**
 * Generate Baseline for Pose Detection Regression Test
 * 
 * Run once to create the baseline.json file that tests will compare against.
 * Re-run when intentionally changing models or preprocessing.
 */

import { test } from '@playwright/test';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASELINE_FILE = join(__dirname, 'pose-detection-baseline.json');
const TEST_IMAGE = '/test-data/wibrem/test-pose.png';

// Keypoints we care about (COCO format indices)
const KEYPOINTS_TO_TEST = {
  'Left Wrist': 9,
  'Right Wrist': 10,
  'Left Ankle': 15,
  'Right Ankle': 16,
};

test('generate pose detection baseline', async ({ page }) => {
  console.log('🔄 Generating pose detection baseline...\n');

  // Navigate to ISOLATED test harness (not full app)
  await page.goto('/tests/pose-detection-harness.html');
  await page.waitForLoadState('networkidle');

  // Run pose detection via harness API
  const baseline = await page.evaluate(async () => {
    return await window.poseDetectionTest.run();
  });

  // Generate visual artifact
  const visualArtifactDataUrl = await page.evaluate(async () => {
    const baseline = await window.poseDetectionTest.result;
    return await window.poseDetectionTest.generateVisualArtifact(
      null, // Not needed, function loads image internally
      baseline.keypoints
    );
  });

  // Save visual artifact as PNG
  const visualArtifactPath = join(__dirname, 'pose-detection-baseline-visual.png');
  const base64Data = visualArtifactDataUrl.replace(/^data:image\/png;base64,/, '');
  await writeFile(visualArtifactPath, base64Data, 'base64');

  // Save baseline JSON
  await writeFile(BASELINE_FILE, JSON.stringify(baseline, null, 2));

  console.log('✅ Baseline generated successfully!\n');
  console.log(`📁 Saved to: ${BASELINE_FILE}`);
  console.log(`🖼️  Visual artifact: ${visualArtifactPath}`);
  console.log(`📋 Model: ${baseline.model}`);
  console.log(`⏱️  Inference time: ${baseline.inferenceTime}ms`);
  console.log(`📸 Image size: ${baseline.imageSize.width}x${baseline.imageSize.height}`);
  console.log(`\n🔑 Keypoints saved:`);
  
  for (const [name, kp] of Object.entries(baseline.keypoints)) {
    console.log(`   ${name}: (${kp.x.toFixed(2)}, ${kp.y.toFixed(2)}) conf: ${kp.confidence.toFixed(3)}`);
  }

  console.log(`\n✅ Baseline ready! Run tests with: npm test`);
});
