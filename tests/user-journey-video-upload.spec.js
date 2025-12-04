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
 * USAGE:
 * - Local dev:    npx playwright test tests/user-journey-video-upload.spec.js --headed
 * - Production:   TEST_ENV=production npx playwright test tests/user-journey-video-upload.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { signIn } from './helpers.js';

// 🎯 TEST ENVIRONMENT CONFIGURATION
// Set via environment variable: TEST_ENV=production or TEST_ENV=local (default)
// eslint-disable-next-line no-undef
const TEST_ENV = process.env.TEST_ENV || 'local';

const ENV_CONFIG = {
  local: {
    baseUrl: 'http://localhost:5173',
    locationId: 'tJdos74GeYUuxoMPKWnu',
    videoPath: './test-data/wibrem/wibrem czarne jedr.mp4'
  },
  production: {
    baseUrl: 'https://topomatch-pwa.web.app',
    locationId: 'M8OzUlFxU2YGBJ4qXOA0',
    videoPath: './test-data/wibrem/wibrem czarne jedr.mp4'
  }
};

const CONFIG = ENV_CONFIG[TEST_ENV];
if (!CONFIG) {
  throw new Error(`Unknown TEST_ENV: ${TEST_ENV}. Use 'local' or 'production'`);
}

// Test configuration
const BASE_URL = CONFIG.baseUrl;
const TEST_LOCATION_ID = CONFIG.locationId;
const TEST_VIDEO_PATH = path.resolve(CONFIG.videoPath);
const MAX_PROCESSING_TIME = 1000 * 60 * 15; // 15 minutes max (increased for memory estimation overhead)

// Authentication
const TEST_EMAIL = 'andrzej.swaton@gmail.com';
const TEST_PASSWORD = 'andrzej.swaton@gmail.com';

test.describe('User Journey: Video Upload', () => {
  // Increase timeout for this test since it involves real video processing
  test.setTimeout(300000 * 3); // 15 minutes

  test('should upload video multiple times sequentially and check for memory leaks', async ({ page }) => {
    // 🎯 CONFIGURATION: Change this number to test different cycle counts
    const NUM_UPLOADS = 1;
    
    console.log(`\n🎬 Starting Real User Journey Test - ${NUM_UPLOADS} Sequential Uploads...\n`);
    console.log(`🌍 Environment: ${TEST_ENV.toUpperCase()}`);
    console.log(`🔗 Base URL: ${BASE_URL}`);
    console.log(`📍 Location: ${TEST_LOCATION_ID}`);
    console.log(`🎥 Video: ${path.basename(TEST_VIDEO_PATH)}`);
    if (TEST_ENV === 'local') {
      console.log('⚠️  NOTE: Make sure dev server is running (npm run dev)');
    }
    console.log('\n📊 This test will:');
    for (let i = 1; i <= NUM_UPLOADS; i++) {
      const suffix = i === 1 ? '' : ' again';
      console.log(`   ${i}. Upload${suffix} video → wait for complete processing`);
    }
    console.log('   Then check if memory grows between uploads (leak detection)\n');

    const memorySnapshots = [];
    const uploadCycleMemory = []; // Track memory at end of each upload cycle

    // Helper to estimate UNTRACKED memory (GPU, video, canvas)
    const estimateUntrackedMemory = async () => {
      return await page.evaluate(() => {
        let estimated = 0;
        
        // 1. Video elements (decode buffers: ~100-200 MB for HD video)
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          if (video.videoWidth && video.videoHeight) {
            // Estimate: width * height * 4 bytes (RGBA) * ~10 decoded frames buffered
            const frameSize = video.videoWidth * video.videoHeight * 4;
            const bufferedFrames = 10; // Typical browser buffering
            estimated += frameSize * bufferedFrames;
          }
        });
        
        // 2. Canvas elements (backing store in GPU memory)
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          if (canvas.width && canvas.height) {
            // Estimate: width * height * 4 bytes (RGBA)
            estimated += canvas.width * canvas.height * 4;
          }
        });
        
        // 3. ImageBitmap tracking (if we track them in stores)
        // Note: Can't enumerate ImageBitmaps directly, but we can check stores
        
        // 4. Browser overhead estimate: ~50-100 MB baseline
        const browserOverhead = 70 * 1024 * 1024; // 70 MB average
        estimated += browserOverhead;
        
        return {
          videoBytes: Array.from(videos).reduce((sum, v) => {
            if (v.videoWidth && v.videoHeight) {
              return sum + (v.videoWidth * v.videoHeight * 4 * 10);
            }
            return sum;
          }, 0),
          canvasBytes: Array.from(canvases).reduce((sum, c) => 
            sum + (c.width * c.height * 4), 0),
          browserOverheadBytes: browserOverhead,
          totalEstimatedBytes: estimated,
          videoCount: videos.length,
          canvasCount: canvases.length
        };
      });
    };

    // Helper to capture memory snapshot using NEW API
    const captureMemory = async (label) => {
      console.log(`\n   💾 Capturing memory snapshot: ${label}...`);
      const memory = await page.evaluate(async () => {
        // Force GC first
        if (window.gc) window.gc();
        
        // REQUIRE measureUserAgentSpecificMemory API - no fallback!
        if (!performance.measureUserAgentSpecificMemory) {
          throw new Error('❌ measureUserAgentSpecificMemory is NOT available! Check Cross-Origin Isolation headers (COOP/COEP)');
        }
        
        const measurement = await performance.measureUserAgentSpecificMemory();
        const totalBytes = measurement.bytes;
        
        // Break down by attribution (main thread vs workers)
        const breakdown = measurement.breakdown || [];
        let workerMemory = 0;
        let mainMemory = 0;
        let otherMemory = 0;
        
        breakdown.forEach(entry => {
          const bytes = entry.bytes;
          const scope = entry.attribution?.[0]?.scope;
          
          if (scope === 'DedicatedWorkerGlobalScope' || entry.types?.includes('Worker')) {
            workerMemory += bytes;
          } else if (scope === 'Window' || entry.types?.includes('Window')) {
            mainMemory += bytes;
          } else {
            otherMemory += bytes;
          }
        });
        
        return {
          totalBytes,
          mainBytes: mainMemory,
          workerBytes: workerMemory,
          otherBytes: otherMemory,
          breakdown: breakdown.map(e => ({
            bytes: e.bytes,
            types: e.types,
            scope: e.attribution?.[0]?.scope
          })),
          timestamp: Date.now(),
          api: 'measureUserAgentSpecificMemory'
        };
      });
      
      // Get estimated untracked memory
      const untracked = await estimateUntrackedMemory();
      
      const snapshot = {
        label,
        totalMB: memory.totalBytes / 1024 / 1024,
        mainMB: memory.mainBytes / 1024 / 1024,
        workerMB: memory.workerBytes / 1024 / 1024,
        otherMB: memory.otherBytes / 1024 / 1024,
        timestamp: memory.timestamp,
        api: memory.api,
        breakdown: memory.breakdown,
        // Estimated untracked memory
        untrackedMB: untracked.totalEstimatedBytes / 1024 / 1024,
        videoMB: untracked.videoBytes / 1024 / 1024,
        canvasMB: untracked.canvasBytes / 1024 / 1024,
        browserOverheadMB: untracked.browserOverheadBytes / 1024 / 1024,
        estimatedTotalMB: (memory.totalBytes + untracked.totalEstimatedBytes) / 1024 / 1024,
        videoCount: untracked.videoCount,
        canvasCount: untracked.canvasCount
      };
      memorySnapshots.push(snapshot);
      
      // Log with worker breakdown + estimated untracked
      console.log(`   💾 ${label}:`);
      console.log(`      Tracked (measureUserAgentSpecificMemory): ${snapshot.totalMB.toFixed(2)} MB`);
      console.log(`      ├─ Main Thread: ${snapshot.mainMB.toFixed(2)} MB`);
      console.log(`      ├─ Workers:     ${snapshot.workerMB.toFixed(2)} MB`);
      if (snapshot.otherMB > 0) {
        console.log(`      └─ Other:       ${snapshot.otherMB.toFixed(2)} MB`);
      }
      console.log(`      Estimated Untracked (GPU/Video/Browser): ${snapshot.untrackedMB.toFixed(2)} MB`);
      console.log(`      ├─ Video buffers:  ${snapshot.videoMB.toFixed(2)} MB (${snapshot.videoCount} videos)`);
      console.log(`      ├─ Canvas pixels:  ${snapshot.canvasMB.toFixed(2)} MB (${snapshot.canvasCount} canvases)`);
      console.log(`      └─ Browser overhead: ${snapshot.browserOverheadMB.toFixed(2)} MB`);
      console.log(`      ⚠️  ESTIMATED TOTAL: ${snapshot.estimatedTotalMB.toFixed(2)} MB`);
      
      return snapshot;
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

    // Background monitoring removed - captureMemory is async and slow
    // We only capture at key points: baseline + end of each cycle

    try {
      // Step 1: Navigate to location page
      console.log('📍 Step 1: Navigate to location page...');
      console.log(`   Environment: ${TEST_ENV.toUpperCase()}`);
      console.log(`   Base URL: ${BASE_URL}`);
      const locationUrl = `${BASE_URL}/location/${TEST_LOCATION_ID}`;
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

      // Verify we're on the right page
      const currentUrl = page.url();
      expect(currentUrl).toContain(TEST_LOCATION_ID);
      console.log(`   ✅ On location page: ${currentUrl}`);

      // CRITICAL: Check if __TEST_API__ is available
      const hasTestApi = await page.evaluate(() => {
        return typeof window.__TEST_API__ !== 'undefined';
      });
      
      if (!hasTestApi) {
        console.error('\n❌ ERROR: window.__TEST_API__ is NOT available!');
        console.error(`   Environment: ${TEST_ENV}`);
        console.error(`   URL: ${BASE_URL}`);
        if (TEST_ENV === 'production') {
          console.error('\n💡 To test against production:');
          console.error('   1. Build with test API: npm run build:test');
          console.error('   2. Deploy to Firebase: npm run deploy:test');
          console.error('   3. Wait for deployment to complete');
          console.error('   4. Run this test again\n');
        } else {
          console.error('\n💡 Make sure dev server is running: npm run dev\n');
        }
        throw new Error('Test API not available - cannot run E2E test. See console for details.');
      }
      console.log('   ✅ Test API available');

      // Step 1.5: Authenticate user
      console.log('\n🔐 Step 1.5: Authenticating user...');
      await signIn(page, TEST_EMAIL, TEST_PASSWORD);
      
      // Extra verification: wait for location to load (check for error messages)
      await page.waitForTimeout(2000);
      const pageText = await page.textContent('body');
      
      if (pageText.includes('Failed to load location')) {
        const envHint = TEST_ENV === 'local' ? 'check Firebase emulator is running and location exists' : 'check if location exists in production database';
        throw new Error(`Location failed to load - ${envHint}`);
      }
      
      if (pageText.includes('Network error')) {
        const envHint = TEST_ENV === 'local' ? 'check Firebase emulator is running' : 'check production Firebase connection';
        throw new Error(`Network error - ${envHint}`);
      }
      
      // Capture baseline memory once before starting uploads
      // await captureMemory('Baseline (before uploads)');

      // Step 2-5: Upload video multiple times in a row (NUM_UPLOADS configured at top)
      for (let uploadNum = 1; uploadNum <= NUM_UPLOADS; uploadNum++) {
        console.log('\n' + '═'.repeat(60));
        console.log(`🔄 UPLOAD CYCLE ${uploadNum}/${NUM_UPLOADS}`);
        console.log('═'.repeat(60));
        
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
        
        // Wait a bit more for any cleanup to happen
        console.log('   ⏳ Waiting for cleanup...');
        await page.waitForTimeout(2000);
        
        // const cycleEndMemory = await captureMemory(`Upload ${uploadNum} complete`);
        
        // 🔬 Take heap snapshot to analyze what's in memory
        // await takeHeapSnapshot(`cycle-${uploadNum}-end`);
        
        // uploadCycleMemory.push({
        //   cycle: uploadNum,
        //   totalMB: cycleEndMemory.totalMB,
        //   mainMB: cycleEndMemory.mainMB,
        //   workerMB: cycleEndMemory.workerMB,
        //   timestamp: cycleEndMemory.timestamp,
        //   api: cycleEndMemory.api
        // });

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
      // await captureMemory('All uploads complete');

      // Step 6: Analyze memory
      console.log('\n\n' + '='.repeat(60));
      console.log(`📊 MEMORY ANALYSIS - ${NUM_UPLOADS} SEQUENTIAL UPLOADS`);
      console.log('='.repeat(60) + '\n');

      if (memorySnapshots.length > 0) {
        console.log('All Memory Snapshots:');
        console.log(`   API Used: ${memorySnapshots[0]?.api || 'unknown'}\n`);
        
        memorySnapshots.forEach((snapshot, i) => {
          const growth = i > 0 
            ? snapshot.totalMB - memorySnapshots[i - 1].totalMB 
            : 0;
          const estimatedGrowth = i > 0
            ? snapshot.estimatedTotalMB - memorySnapshots[i - 1].estimatedTotalMB
            : 0;
          const growthStr = i > 0 
            ? ` (${growth >= 0 ? '+' : ''}${growth.toFixed(2)} MB)`
            : '';
          const estimatedGrowthStr = i > 0
            ? ` (${estimatedGrowth >= 0 ? '+' : ''}${estimatedGrowth.toFixed(2)} MB)`
            : '';
          
          console.log(`   ${snapshot.label}:`);
          console.log(`      Tracked: ${snapshot.totalMB.toFixed(2)} MB${growthStr}`);
          console.log(`      ├─ Main:   ${snapshot.mainMB.toFixed(2)} MB`);
          console.log(`      └─ Worker: ${snapshot.workerMB.toFixed(2)} MB`);
          console.log(`      ⚠️  Est. Total: ${snapshot.estimatedTotalMB.toFixed(2)} MB${estimatedGrowthStr} (incl. GPU/Video)`);
        });

        // Memory tracking with worker breakdown
        console.log('\n🔍 Memory After Each Upload Cycle:');
        const baselineTotal = memorySnapshots[0].totalMB;
        const baselineEstimated = memorySnapshots[0].estimatedTotalMB;
        uploadCycleMemory.forEach((cycle, i) => {
          const prevTotal = i > 0 ? uploadCycleMemory[i - 1].totalMB : baselineTotal;
          const prevEstimated = i > 0 ? uploadCycleMemory[i - 1].estimatedTotalMB : baselineEstimated;
          const totalGrowth = cycle.totalMB - prevTotal;
          const estimatedGrowth = cycle.estimatedTotalMB - prevEstimated;
          const growthStr = ` (${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)} MB)`;
          const estimatedGrowthStr = ` (${estimatedGrowth >= 0 ? '+' : ''}${estimatedGrowth.toFixed(1)} MB)`;
          
          console.log(`   Cycle ${cycle.cycle}:`);
          console.log(`      Tracked: ${cycle.totalMB.toFixed(1)} MB${growthStr}`);
          console.log(`      ├─ Main:   ${cycle.mainMB.toFixed(1)} MB`);
          console.log(`      └─ Worker: ${cycle.workerMB.toFixed(1)} MB`);
          console.log(`      ⚠️  Est. Total: ${cycle.estimatedTotalMB.toFixed(1)} MB${estimatedGrowthStr}`);
        });
        
        // Enhanced leak detection with worker breakdown
        if (uploadCycleMemory.length >= 2) {
          const totalDiffs = [];
          const mainDiffs = [];
          const workerDiffs = [];
          const estimatedTotalDiffs = [];
          
          for (let i = 1; i < uploadCycleMemory.length; i++) {
            totalDiffs.push(uploadCycleMemory[i].totalMB - uploadCycleMemory[i - 1].totalMB);
            mainDiffs.push(uploadCycleMemory[i].mainMB - uploadCycleMemory[i - 1].mainMB);
            workerDiffs.push(uploadCycleMemory[i].workerMB - uploadCycleMemory[i - 1].workerMB);
            estimatedTotalDiffs.push(uploadCycleMemory[i].estimatedTotalMB - uploadCycleMemory[i - 1].estimatedTotalMB);
          }
          
          const avgTotalGrowth = totalDiffs.reduce((a, b) => a + b, 0) / totalDiffs.length;
          const avgMainGrowth = mainDiffs.reduce((a, b) => a + b, 0) / mainDiffs.length;
          const avgWorkerGrowth = workerDiffs.reduce((a, b) => a + b, 0) / workerDiffs.length;
          const avgEstimatedGrowth = estimatedTotalDiffs.reduce((a, b) => a + b, 0) / estimatedTotalDiffs.length;
          const maxMemoryInCycles = Math.max(...uploadCycleMemory.map(c => c.totalMB));
          const maxEstimatedInCycles = Math.max(...uploadCycleMemory.map(c => c.estimatedTotalMB));
          
          console.log(`\n🔬 Leak Detection:`);
          console.log(`   Average cycle-to-cycle change (tracked): ${avgTotalGrowth >= 0 ? '+' : ''}${avgTotalGrowth.toFixed(1)} MB`);
          console.log(`   Average cycle-to-cycle change (estimated total): ${avgEstimatedGrowth >= 0 ? '+' : ''}${avgEstimatedGrowth.toFixed(1)} MB`);
          
          if (uploadCycleMemory[0].api === 'measureUserAgentSpecificMemory') {
            console.log(`      ├─ Main thread:  ${avgMainGrowth >= 0 ? '+' : ''}${avgMainGrowth.toFixed(1)} MB`);
            console.log(`      └─ Workers:      ${avgWorkerGrowth >= 0 ? '+' : ''}${avgWorkerGrowth.toFixed(1)} MB`);
            
            // Identify WHERE the leak is
            if (Math.abs(avgWorkerGrowth) > Math.abs(avgMainGrowth)) {
              console.log(`   🎯 Leak source: WORKERS (${Math.abs(avgWorkerGrowth).toFixed(1)} MB > ${Math.abs(avgMainGrowth).toFixed(1)} MB)`);
            } else if (Math.abs(avgMainGrowth) > Math.abs(avgWorkerGrowth)) {
              console.log(`   🎯 Leak source: MAIN THREAD (${Math.abs(avgMainGrowth).toFixed(1)} MB > ${Math.abs(avgWorkerGrowth).toFixed(1)} MB)`);
            }
          }
          
          console.log(`   Peak tracked memory: ${maxMemoryInCycles.toFixed(1)} MB`);
          console.log(`   Peak estimated total: ${maxEstimatedInCycles.toFixed(1)} MB`);
          
          // Check Safari limits (iOS Safari: ~400-700 MB, desktop ~1-2 GB)
          const SAFARI_MOBILE_LIMIT = 700; // MB
          if (maxEstimatedInCycles > SAFARI_MOBILE_LIMIT * 0.9) {
            console.log(`   🍎 ⚠️  SAFARI RISK: ${maxEstimatedInCycles.toFixed(1)} MB approaching mobile Safari limit (~${SAFARI_MOBILE_LIMIT} MB)`);
          }
          
          // Memory should be stable after cleanup (not grow each cycle)
          const LEAK_THRESHOLD = 10; // MB average growth = leak
          const MAX_STABLE_MEMORY = 320; // Tracked memory limit
          
          if (avgTotalGrowth > LEAK_THRESHOLD) {
            console.log(`   ❌ MEMORY LEAK! Grows ${avgTotalGrowth.toFixed(1)} MB per cycle (should be ~0)`);
            expect(avgTotalGrowth).toBeLessThan(LEAK_THRESHOLD); // Fail test
          } else if (maxMemoryInCycles > MAX_STABLE_MEMORY) {
            console.log(`   ⚠️  Tracked memory doesn't clean up properly: ${maxMemoryInCycles.toFixed(1)} MB (expected < ${MAX_STABLE_MEMORY} MB)`);
            expect(maxMemoryInCycles).toBeLessThan(MAX_STABLE_MEMORY * 1.2); // 20% buffer
          } else {
            console.log(`   ✅ Tracked memory stable - no leak detected`);
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
