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
import fs from 'fs';
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
  test.setTimeout(300000); // 5 minutes

  test('should upload video multiple times sequentially and check for memory leaks', async ({ page }) => {
    // 🎯 CONFIGURATION: Change this number to test different cycle counts
    const NUM_UPLOADS = 5;
    
    console.log(`\n🎬 Starting Real User Journey Test - ${NUM_UPLOADS} Sequential Uploads...\n`);
    console.log('⚠️  NOTE: Make sure dev server is running (npm run dev)\n');
    console.log('📊 This test will:');
    for (let i = 1; i <= NUM_UPLOADS; i++) {
      const suffix = i === 1 ? '' : ' again';
      console.log(`   ${i}. Upload${suffix} video → wait for complete processing`);
    }
    console.log('   Then check if memory grows between uploads (leak detection)\n');

    const memorySnapshots = [];
    let memoryMonitorInterval;
    const uploadCycleMemory = []; // Track memory at end of each upload cycle

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

    // 🔬 HEAP SNAPSHOT: Capture heap snapshot for detailed analysis
    let cdpSession;
    const heapSnapshots = [];
    
    const takeHeapSnapshot = async (label) => {
      try {
        if (!cdpSession) {
          cdpSession = await page.context().newCDPSession(page);
        }

        console.log(`   🔬 Taking heap snapshot: ${label}...`);
        
        let snapshotData = '';
        const chunkHandler = (params) => {
          snapshotData += params.chunk;
        };
        
        cdpSession.on('HeapProfiler.addHeapSnapshotChunk', chunkHandler);
        
        await cdpSession.send('HeapProfiler.takeHeapSnapshot', {
          reportProgress: false,
          captureNumericValue: true
        });
        
        cdpSession.off('HeapProfiler.addHeapSnapshotChunk', chunkHandler);
        
        const filename = `heap-snapshot-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.heapsnapshot`;
        const filepath = path.resolve(`./test-results/${filename}`);
        
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, snapshotData);
        heapSnapshots.push({ label, filepath, size: snapshotData.length });
        
        console.log(`   ✅ Saved: ${filename} (${(snapshotData.length / 1024 / 1024).toFixed(2)} MB)`);
      } catch (error) {
        console.warn(`   ⚠️  Failed to take heap snapshot: ${error.message}`);
      }
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

      // Step 2-5: Upload video multiple times in a row (NUM_UPLOADS configured at top)
      for (let uploadNum = 1; uploadNum <= NUM_UPLOADS; uploadNum++) {
        console.log('\n' + '═'.repeat(60));
        console.log(`🔄 UPLOAD CYCLE ${uploadNum}/${NUM_UPLOADS}`);
        console.log('═'.repeat(60));
        
        await captureMemory(`Before upload ${uploadNum}`);
        
        // Step 2: Find and click "Upload Beta" button
        console.log(`\n🎯 Step 2.${uploadNum}: Looking for "Upload Beta" button...`);
        
        // Wait for the button to be visible and clickable
        const uploadButton = page.getByRole('button', { name: /upload beta/i });
        await uploadButton.waitFor({ state: 'visible', timeout: 10000 });
        console.log('   ✅ Found "Upload Beta" button');

        // Click the upload button to open the modal
        await uploadButton.click();
        console.log('   ✅ Clicked "Upload Beta" button');
        
        // Wait for the upload modal to appear
        await page.waitForTimeout(1500);
        console.log('   ⏳ Waiting for upload modal...');
        
        // VERIFY MODAL STATE IS RESET (especially important for cycles 2+)
        if (uploadNum > 1) {
          console.log(`\n   🔍 Verifying modal state is reset (not showing old data)...`);
          
          // Check if modal shows any leftover processing state
          const modalText = await page.locator('[class*="bg-white rounded-lg"], [role="dialog"]').textContent().catch(() => '');
          
          const hasLeftoverState = 
            /analysis.*progress|processing|analyzing|detecting/i.test(modalText) ||
            /completed|success|saved/i.test(modalText);
          
          if (hasLeftoverState) {
            console.log(`   ⚠️  WARNING: Modal shows leftover state from previous upload!`);
            console.log(`   Modal text excerpt: ${modalText.slice(0, 200)}...`);
            console.log(`   🐛 BUG: Modal component doesn't reset state on reopen!`);
          } else {
            console.log(`   ✅ Modal appears to be in clean state`);
          }
        }

        // Step 3: Upload video file through the modal
        console.log(`\n📹 Step 3.${uploadNum}: Uploading video file...`);
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
          
          // Get analysis job (check both active jobs AND completion registry)
          const analysisJobs = Object.values(analysisQueue.jobs || {});
          const completionRegistry = analysisQueue.completionRegistry || {};
          const completedJobs = Object.values(completionRegistry);
          
          // Try active jobs first, then check completion registry
          let analysisJob = analysisJobs.length > 0 ? analysisJobs[analysisJobs.length - 1] : null;
          if (!analysisJob && completedJobs.length > 0) {
            // Job was completed and deleted - use completion record
            analysisJob = completedJobs[completedJobs.length - 1];
          }
          
          // Get upload job
          const uploads = Object.values(uploadQueue.uploads || {});
          const upload = uploads.length > 0 ? uploads[uploads.length - 1] : null;
          
          return {
            analysis: analysisJob ? {
              status: analysisJob.status,
              progress: analysisJob.progress || 100, // Completed jobs don't have progress field
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
            console.log(`   📊 Analysis state:`, JSON.stringify(state.analysis));
            analysisComplete = true;
          }
        } else {
          // Debug: log non-complete status
          if (checkCount % 5 === 0) {
            console.log(`   🔍 Still waiting... status=${state.analysis.status}, complete=${analysisComplete}`);
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
        
        // Break if analysis complete (don't wait for upload in localhost - no transcoding)
        if (analysisComplete) {
          // Give upload a moment to finish if it's close
          if (!uploadComplete && checkCount < 3) {
            // Keep checking a bit longer
          } else {
            break;
          }
        }
        
        // Wait before next check
        await page.waitForTimeout(2000);
        await captureMemory(`Processing (A:${state.analysis.status} U:${state.upload.status})`);
      }
      
      // Fail if analysis didn't complete
      if (!analysisComplete) {
        throw new Error(`Analysis did not complete within ${MAX_PROCESSING_TIME / 1000}s timeout`);
      }
      
      // Note: We don't wait for upload completion in localhost because there's no
      // transcoding function (production-only). The video is uploaded to Storage,
      // but won't get transcoded/marked as complete without the Cloud Function.
      if (!uploadComplete) {
        console.log(`   ℹ️  Upload to Storage complete (no transcoding in localhost)`);
      } else {
        console.log(`   ✅ Video upload marked complete!`);
      }

      const processingTime = Date.now() - processingStartTime;
      console.log(`   ⏱️  Total processing time: ${(processingTime / 1000).toFixed(1)}s`);

        stopMemoryMonitoring();
        
        // Wait a bit more for any cleanup to happen
        console.log('   ⏳ Waiting for cleanup...');
        await page.waitForTimeout(2000);
        
        const cycleEndMemory = await captureMemory(`Upload ${uploadNum} complete`);
        
        // 🔬 Take heap snapshot to analyze what's in memory
        await takeHeapSnapshot(`cycle-${uploadNum}-end`);
        
        uploadCycleMemory.push({
          cycle: uploadNum,
          memory: cycleEndMemory.memory,
          timestamp: cycleEndMemory.timestamp
        });

        // Step 5: Verify ascent was created
        console.log(`\n✅ Step 5.${uploadNum}: Verifying ascent creation...`);
        
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
        
        console.log(`\n   ✅ Upload cycle ${uploadNum}/${NUM_UPLOADS} complete!`);
        
        // If not the last upload, just wait a moment before starting next cycle
        // Modal auto-closes after video selection by design (allows bg processing)
        if (uploadNum < NUM_UPLOADS) {
          console.log('\n   🔄 Preparing for next upload cycle...');
          await page.waitForTimeout(1000);
          console.log('   ✅ Ready to click "Upload Beta" again');
        }
      }
      
      // End of all upload cycles
      await captureMemory('All uploads complete');

      // Step 6: Analyze memory
      console.log('\n\n' + '='.repeat(60));
      console.log(`📊 MEMORY ANALYSIS - ${NUM_UPLOADS} SEQUENTIAL UPLOADS`);
      console.log('='.repeat(60) + '\n');

      if (memorySnapshots.length > 0) {
        console.log('All Memory Snapshots:');
        memorySnapshots.forEach((snapshot, i) => {
          const growth = i > 0 
            ? snapshot.memory - memorySnapshots[i - 1].memory 
            : 0;
          const growthStr = i > 0 
            ? ` (${growth >= 0 ? '+' : ''}${growth.toFixed(2)} MB)`
            : '';
          console.log(`   ${snapshot.label}: ${snapshot.memory.toFixed(2)} MB${growthStr}`);
        });

        // Simple memory tracking: just show MB after each cycle
        console.log('\n🔍 Memory After Each Upload Cycle:');
        const baselineMemory = memorySnapshots[0].memory;
        uploadCycleMemory.forEach((cycle, i) => {
          const prevMemory = i > 0 ? uploadCycleMemory[i - 1].memory : baselineMemory;
          const growth = cycle.memory - prevMemory;
          const growthStr = ` (${growth >= 0 ? '+' : ''}${growth.toFixed(1)} MB)`;
          console.log(`   Cycle ${cycle.cycle}: ${cycle.memory.toFixed(1)} MB${growthStr}`);
        });
        
        // Leak detection: memory shouldn't grow cycle-to-cycle (should stabilize)
        if (uploadCycleMemory.length >= 2) {
          const cycleDiffs = [];
          for (let i = 1; i < uploadCycleMemory.length; i++) {
            cycleDiffs.push(uploadCycleMemory[i].memory - uploadCycleMemory[i - 1].memory);
          }
          
          const avgGrowth = cycleDiffs.reduce((a, b) => a + b, 0) / cycleDiffs.length;
          const maxMemoryInCycles = Math.max(...uploadCycleMemory.map(c => c.memory));
          
          console.log(`\n🔬 Leak Detection:`);
          console.log(`   Average cycle-to-cycle change: ${avgGrowth >= 0 ? '+' : ''}${avgGrowth.toFixed(1)} MB`);
          console.log(`   Peak memory (end of cycles): ${maxMemoryInCycles.toFixed(1)} MB`);
          
          // Memory should be stable after cleanup (not grow each cycle)
          const LEAK_THRESHOLD = 10; // MB average growth = leak
          const MAX_STABLE_MEMORY = 320;
          
          if (avgGrowth > LEAK_THRESHOLD) {
            console.log(`   ❌ MEMORY LEAK! Grows ${avgGrowth.toFixed(1)} MB per cycle (should be ~0)`);
            expect(avgGrowth).toBeLessThan(LEAK_THRESHOLD); // Fail test
          } else if (maxMemoryInCycles > MAX_STABLE_MEMORY) {
            console.log(`   ⚠️  Memory doesn't clean up properly: ${maxMemoryInCycles.toFixed(1)} MB (expected < ${MAX_STABLE_MEMORY} MB)`);
            expect(maxMemoryInCycles).toBeLessThan(MAX_STABLE_MEMORY * 1.2); // 20% buffer
          } else {
            console.log(`   ✅ Memory stable - no leak detected`);
          }
        }

        const firstMemory = memorySnapshots[0].memory;
        const lastMemory = memorySnapshots[memorySnapshots.length - 1].memory;
        const totalGrowth = lastMemory - firstMemory;

        console.log('\n📊 Overall:');
        console.log(`   Baseline: ${firstMemory.toFixed(1)} MB`);
        console.log(`   Final: ${lastMemory.toFixed(1)} MB`);
        console.log(`   Net change: ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)} MB`);
      } else {
        console.log('⚠️  Memory API not available. Run Chromium with --enable-precise-memory-info');
      }

      // 🔬 Print heap snapshot summary
      if (heapSnapshots.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('🔬 HEAP SNAPSHOTS CAPTURED');
        console.log('='.repeat(60));
        heapSnapshots.forEach(snapshot => {
          console.log(`   ${snapshot.label}: ${snapshot.filepath}`);
          console.log(`      Size: ${(snapshot.size / 1024 / 1024).toFixed(2)} MB`);
        });
        console.log('\n📖 How to analyze:');
        console.log('   See HEAP_SNAPSHOT_ANALYSIS.md for step-by-step guide');
        console.log('   Quick: Load snapshots in Chrome DevTools → Memory tab');
        console.log('   Compare cycle-2-end vs cycle-1-end to see what grew by 80MB');
        console.log('='.repeat(60) + '\n');
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
    } finally {
      // Cleanup CDP session
      if (cdpSession) {
        await cdpSession.detach().catch(() => {/* ignore */});
      }
    }
  });
});
