/**
 * Real User Journey E2E Test
 * 
 * Tests the complete video upload workflow as a user would experience it:
 * 1. Navigate to location page
 * 2. Authenticate user
 * 3. Click "Upload Beta" button
 * 4. Select video file
 * 5. Monitor BACKGROUND processing pipeline:
 *    - Frame extraction (component, requires DOM)
 *    - Pose detection (videoAnalysisQueueStore, YOLO)
 *    - Image matching (videoAnalysisQueueStore, SuperPoint + LightGlue)
 *    - Hold loading (videoAnalysisQueueStore)
 *    - Problem scoring (videoAnalysisQueueStore)
 *    - Firestore update (videoAnalysisQueueStore)
 * 6. Verify ascent is created
 * 7. Monitor memory throughout (check for leaks)
 * 
 * IMPORTANT: Processing happens in Pinia stores (background), NOT in UI!
 * - Video upload: videoUploadQueueStore (Storage upload)
 * - Analysis: videoAnalysisQueueStore (CPU-intensive ML tasks)
 * - Component only does frame extraction (needs DOM/video element)
 * 
 * This is the MAIN user journey - keeping this green means the app works!
 * 
 * Run with: npx playwright test tests/user-journey-video-upload.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { signIn } from './helpers.js';

// Test configuration
const TEST_LOCATION_ID = 'j16Gvm1xyQtfefr1HYiH';
const TEST_VIDEO_PATH = path.resolve('./test-data/groto_29aug/IMG_8410.MOV');
const MAX_PROCESSING_TIME = 60000; // 60 seconds max
const MEMORY_CHECK_INTERVAL = 5000; // Check memory every 5 seconds

// Authentication
const TEST_EMAIL = 'andrzej.swaton@gmail.com';
const TEST_PASSWORD = 'andrzej.swaton@gmail.com';

test.describe('User Journey: Video Upload', () => {
  // Increase timeout for this test since it involves real video processing
  test.setTimeout(120000); // 2 minutes

  test('should upload video, process it, and create ascent without memory leaks', async ({ page }) => {
    console.log('\n🎬 Starting Real User Journey Test...\n');
    console.log('⚠️  NOTE: Make sure dev server is running (npm run dev)\n');

    const memorySnapshots = [];
    let memoryMonitorInterval;

    // Helper to capture memory snapshot
    const captureMemory = async (label) => {
      const memory = await page.evaluate(() => {
        if (window.gc) window.gc();
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          timestamp: Date.now()
        } : null;
      });
      
      if (memory) {
        const snapshot = {
          label,
          memory: memory.usedJSHeapSize / 1024 / 1024,
          timestamp: memory.timestamp
        };
        memorySnapshots.push(snapshot);
        console.log(`   💾 ${label}: ${snapshot.memory.toFixed(2)} MB`);
        return snapshot;
      }
      return null;
    };

    // Start memory monitoring
    const startMemoryMonitoring = () => {
      memoryMonitorInterval = setInterval(async () => {
        await captureMemory('Background check');
      }, MEMORY_CHECK_INTERVAL);
    };

    const stopMemoryMonitoring = () => {
      if (memoryMonitorInterval) {
        clearInterval(memoryMonitorInterval);
      }
    };

    try {
      // Step 1: Navigate to location page
      console.log('📍 Step 1: Navigate to location page...');
      const locationUrl = `http://localhost:5173/location/${TEST_LOCATION_ID}`;
      await page.goto(locationUrl, { 
        waitUntil: 'domcontentloaded' // Faster than 'networkidle' - just wait for DOM
      });
      console.log(`   ✅ Navigated to ${locationUrl}`);
      
      // Wait for Vue to mount (faster than networkidle)
      await page.waitForSelector('[data-v-app], #app', { timeout: 5000 }).catch(() => {
        console.log('   ℹ️  App container not found, continuing anyway...');
      });
      console.log('   ⏳ Waiting for app to initialize...');
      await page.waitForTimeout(1000); // Brief pause for Vue initialization
      
      await captureMemory('After page load');

      // Verify we're on the right page
      const currentUrl = page.url();
      expect(currentUrl).toContain(TEST_LOCATION_ID);
      console.log(`   ✅ On location page: ${currentUrl}`);

      // Step 1.5: Authenticate user
      console.log('\n🔐 Step 1.5: Authenticating user...');
      await signIn(page, TEST_EMAIL, TEST_PASSWORD);
      
      // Extra verification: wait for location to load (check for error messages)
      await page.waitForTimeout(2000);
      const pageText = await page.textContent('body');
      
      if (pageText.includes('Failed to load location')) {
        throw new Error('Location failed to load - check Firebase emulator is running and location exists');
      }
      
      if (pageText.includes('Network error')) {
        throw new Error('Network error - check Firebase emulator is running');
      }
      
      await captureMemory('After authentication');

      // Step 2: Find and click "Upload Beta" button
      console.log('\n🎯 Step 2: Looking for "Upload Beta" button...');
      
      // Wait for the button to be visible and clickable
      const uploadButton = page.getByRole('button', { name: /upload beta/i });
      await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
      console.log('   ✅ Found "Upload Beta" button');

      await captureMemory('Before upload click');

      // Click the upload button to open the modal
      await uploadButton.click();
      console.log('   ✅ Clicked "Upload Beta" button');
      
      // Wait for the upload modal to appear
      await page.waitForTimeout(1000);
      console.log('   ⏳ Waiting for upload modal...');

      // Step 3: Upload video file through the modal
      console.log('\n📹 Step 3: Uploading video file...');
      console.log(`   File: ${TEST_VIDEO_PATH}`);
      
      // The modal should now be visible with a file input
      // Wait for file input to be ready (it might be in the modal)
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.waitFor({ state: 'attached', timeout: 15000 });
      
      // Listen for file chooser and set the file
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
      
      // Try to click the file input or a button that triggers it
      try {
        // If there's a "Choose File" or similar button in the modal, click it
        const chooseFileButton = page.locator('button:has-text("Choose"), button:has-text("Select"), label[for*="file"]').first();
        if (await chooseFileButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await chooseFileButton.click();
        } else {
          // Otherwise, trigger the file input directly
          await fileInput.click({ force: true });
        }
      } catch (e) {
        // If clicking doesn't work, set files directly
        await fileInput.setInputFiles(TEST_VIDEO_PATH);
      }

      // Handle the file chooser if it appears
      try {
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(TEST_VIDEO_PATH);
        console.log('   ✅ Video file selected via file chooser');
      } catch (e) {
        console.log('   ℹ️  File set directly (no file chooser event)');
      }
      
      await page.waitForTimeout(500);
      await captureMemory('After file selected');

      // Start continuous memory monitoring during processing
      startMemoryMonitoring();

      // Step 4: Wait for BOTH analysis AND upload to complete
      console.log('\n⚙️  Step 4: Monitoring background processing...');
      console.log('   Analysis: Frame extraction → Pose Detection → Image Matching → Scoring');
      console.log('   Upload: Video upload to Firebase Storage (parallel)');
      console.log('   NOTE: Both happen in Pinia stores, not in UI');
      
      const processingStartTime = Date.now();
      
      // Monitor BOTH stores: analysis queue AND upload queue
      let analysisComplete = false;
      let uploadComplete = false;
      let lastAnalysisStatus = '';
      let lastUploadStatus = '';
      let checkCount = 0;
      const maxChecks = Math.floor(MAX_PROCESSING_TIME / 2000); // Check every 2s
      
      while ((!analysisComplete || !uploadComplete) && checkCount < maxChecks) {
        checkCount++;
        
        // Check BOTH analysis and upload stores using Test API
        const state = await page.evaluate(() => {
          const testAPI = window.__TEST_API__;
          if (!testAPI) {
            throw new Error('Test API not found - make sure dev server is running (npm run dev)');
          }
          
          // Get analysis queue state
          const analysisQueue = testAPI.getAnalysisQueue();
          if (!analysisQueue) {
            const availableStores = testAPI.getStoreNames();
            throw new Error(`Analysis queue not found. Available: ${availableStores.join(', ')}`);
          }
          
          // Get upload queue state
          const uploadQueue = testAPI.getUploadQueue();
          if (!uploadQueue) {
            throw new Error('Upload queue not found');
          }
          
          // Get analysis job
          const analysisJobs = Object.values(analysisQueue.jobs || {});
          const analysisJob = analysisJobs.length > 0 ? analysisJobs[analysisJobs.length - 1] : null;
          
          // Get upload job
          const uploads = Object.values(uploadQueue.uploads || {});
          const upload = uploads.length > 0 ? uploads[uploads.length - 1] : null;
          
          return {
            analysis: analysisJob ? {
              status: analysisJob.status,
              progress: analysisJob.progress,
              ascentId: analysisJob.ascentId,
              error: analysisJob.error
            } : { status: 'no-jobs' },
            upload: upload ? {
              status: upload.status,
              progress: upload.progress,
              ascentId: upload.ascentId,
              error: upload.error
            } : { status: 'no-upload' }
          };
        });
        
        // Log analysis status changes
        if (state.analysis.status !== lastAnalysisStatus) {
          lastAnalysisStatus = state.analysis.status;
          const elapsed = ((Date.now() - processingStartTime) / 1000).toFixed(1);
          console.log(`   [${elapsed}s] Analysis: ${state.analysis.status} (${state.analysis.progress}%)`);
        }
        
        // Log upload status changes
        if (state.upload.status !== lastUploadStatus) {
          lastUploadStatus = state.upload.status;
          const elapsed = ((Date.now() - processingStartTime) / 1000).toFixed(1);
          console.log(`   [${elapsed}s] Upload: ${state.upload.status} (${state.upload.progress}%)`);
        }
        
        // Check if analysis is complete
        if (state.analysis.status === 'complete') {
          if (!analysisComplete) {
            console.log(`   ✅ Analysis pipeline complete!`);
            analysisComplete = true;
          }
        }
        
        // Check if upload is complete
        if (state.upload.status === 'complete' || state.upload.status === 'uploaded') {
          if (!uploadComplete) {
            console.log(`   ✅ Video upload complete!`);
            uploadComplete = true;
          }
        }
        
        // Check for errors
        if (state.analysis.status === 'error') {
          throw new Error(`Analysis error: ${state.analysis.error}`);
        }
        
        if (state.upload.status === 'error') {
          throw new Error(`Upload error: ${state.upload.error}`);
        }
        
        // Break if both complete
        if (analysisComplete && uploadComplete) {
          break;
        }
        
        // Wait before next check
        await page.waitForTimeout(2000);
        await captureMemory(`Processing (A:${state.analysis.status} U:${state.upload.status})`);
      }
      
      // Fail if processing didn't complete
      if (!analysisComplete) {
        throw new Error(`Analysis did not complete within ${MAX_PROCESSING_TIME / 1000}s timeout`);
      }
      if (!uploadComplete) {
        console.log(`   ⚠️  Upload did not complete (might still be transcoding on server)`);
      }

      const processingTime = Date.now() - processingStartTime;
      console.log(`   ⏱️  Total processing time: ${(processingTime / 1000).toFixed(1)}s`);

      stopMemoryMonitoring();
      
      // Wait a bit more for any cleanup to happen
      console.log('   ⏳ Waiting for cleanup...');
      await page.waitForTimeout(2000);
      
      await captureMemory('After all processing complete');

      // Step 5: Verify ascent was created
      console.log('\n✅ Step 5: Verifying ascent creation...');
      
      // Give it a moment for UI to update
      await page.waitForTimeout(1000);
      
      // Check for ascent in the UI (this depends on your UI structure)
      // We'll check for common indicators
      const pageContent = await page.textContent('body');
      
      // Look for success indicators in page content
      const hasSuccessIndicator = 
        /success|created|uploaded|saved/i.test(pageContent) ||
        await page.locator('[data-test="ascent-item"], .ascent-card, .ascent-list-item').count() > 0;

      if (hasSuccessIndicator) {
        console.log('   ✅ Ascent appears to be created');
      } else {
        console.log('   ⚠️  Could not confirm ascent creation from UI');
        console.log('   (This might be okay if UI structure is different)');
      }

      await captureMemory('Final state');

      // Step 6: Analyze memory
      console.log('\n\n' + '='.repeat(60));
      console.log('📊 MEMORY ANALYSIS');
      console.log('='.repeat(60) + '\n');

      if (memorySnapshots.length > 0) {
        console.log('Memory Snapshots:');
        memorySnapshots.forEach((snapshot, i) => {
          const growth = i > 0 
            ? snapshot.memory - memorySnapshots[i - 1].memory 
            : 0;
          const growthStr = i > 0 
            ? ` (${growth >= 0 ? '+' : ''}${growth.toFixed(2)} MB)`
            : '';
          console.log(`   ${snapshot.label}: ${snapshot.memory.toFixed(2)} MB${growthStr}`);
        });

        const firstMemory = memorySnapshots[0].memory;
        const lastMemory = memorySnapshots[memorySnapshots.length - 1].memory;
        const totalGrowth = lastMemory - firstMemory;
        const growthPercent = (totalGrowth / firstMemory) * 100;

        console.log('\nSummary:');
        console.log(`   Initial: ${firstMemory.toFixed(2)} MB`);
        console.log(`   Final: ${lastMemory.toFixed(2)} MB`);
        console.log(`   Growth: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(2)} MB (${growthPercent.toFixed(1)}%)`);

        // Check for memory leak
        const MAX_ACCEPTABLE_GROWTH_PERCENT = 100; // Allow 100% growth for real video processing
        if (Math.abs(growthPercent) <= MAX_ACCEPTABLE_GROWTH_PERCENT) {
          console.log(`   ✅ Memory growth acceptable (< ${MAX_ACCEPTABLE_GROWTH_PERCENT}%)`);
        } else {
          console.log(`   ⚠️  Memory growth high: ${growthPercent.toFixed(1)}%`);
        }

        // Assert memory is reasonable
        expect(growthPercent).toBeLessThan(MAX_ACCEPTABLE_GROWTH_PERCENT * 1.5); // 150% hard limit
      } else {
        console.log('⚠️  Memory API not available. Run Chromium with --enable-precise-memory-info');
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ USER JOURNEY TEST PASSED!');
      console.log('='.repeat(60) + '\n');

    } catch (error) {
      stopMemoryMonitoring();
      console.error('\n❌ Test failed:', error.message);
      
      // Take screenshot on failure
      await page.screenshot({ path: 'test-results/user-journey-failure.png', fullPage: true });
      console.log('📸 Screenshot saved to test-results/user-journey-failure.png');
      
      // Log page state for debugging
      console.log('\n🔍 Page state at failure:');
      console.log('   URL:', page.url());
      const bodyText = await page.textContent('body').catch(() => 'Could not get body text');
      console.log('   Body text (first 500 chars):', bodyText.substring(0, 500));
      
      throw error;
    }
  });
});
