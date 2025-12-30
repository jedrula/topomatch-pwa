import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ascentService } from '../services/ascentService.js';
import { getPoseDetectionService } from '../services/poseDetectionFactory.js';
import { calculateHomographyMatrix, transformPoints } from '../utils/homographyUtils.js';
import { useInferenceStore } from './inferenceStore.js';
import { holdDetectionService } from '../services/holdDetectionService.js';
import { manualHoldsService } from '../services/manualHoldsService.js';
import { calculateProblemScores } from '../utils/problemScoringUtils.js';
import { getKeypointRows } from '../composables/useHoldMatching.js';
import { generateUUID } from '../utils/uuid.js';
import { matchImagesOnServer } from '../services/imageMatchingService.js';

/**
 * Video Analysis Queue Store
 * 
 * Manages video analysis jobs independently of component lifecycle.
 * Runs full autonomous pipeline: pose detection → image matching → hold loading → scoring → Firestore update
 * 
 * Component responsibilities:
 * - Extract frames (requires DOM: video element, canvas)
 * - Call setFrames() to hand off to store
 * - Can unmount immediately - store handles everything else
 * 
 * Store responsibilities:
 * - Step 1: Detect poses in frames (YOLO pose detection)
 * - Step 2: Match frames to location images (SuperPoint + homography)
 * - Step 3: Load holds for matched image (YOLO + manual holds)
 * - Step 4: Score problems (transform poses, calculate matches)
 * - Step 5: Update Firestore ascent record
 */

// 📊 PROGRESS STEPS: Define progress ranges for each pipeline step
// Each step contains: start, end, and message
const PROGRESS_STEPS = [
  { name: 'POSE', start: 0, end: 30, message: 'Detecting pose...' },
  { name: 'MATCHING', start: 30, end: 70, message: 'Matching to location...' },  // Longest step
  { name: 'HOLDS', start: 70, end: 80, message: 'Loading holds...' },
  { name: 'SCORING', start: 80, end: 95, message: 'Scoring problems...' },
  { name: 'FIRESTORE', start: 95, end: 100, message: 'Saving results...' },
];

// Build lookup object for convenience (e.g., PROGRESS.POSE.start)
const PROGRESS = PROGRESS_STEPS.reduce((acc, step) => {
  acc[step.name] = step;
  return acc;
}, { COMPLETE: 100 });

// Helper to calculate range for progress interpolation
const range = (step) => step.end - step.start;

// Helper to get current step for a given progress value
const getCurrentStep = (progress) => {
  for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
    if (progress >= PROGRESS_STEPS[i].start) {
      return PROGRESS_STEPS[i];
    }
  }
  return { message: 'Starting analysis...', start: 0, end: 0 };
};

export const useVideoAnalysisQueueStore = defineStore('videoAnalysisQueue', () => {
  // 🐛 DEBUG MODE: Set VITE_DEBUG_KEEP_JOBS=true to keep completed jobs in memory for debugging
  // WARNING: This will cause memory leaks (~80MB per job) - only use for development!
  const DEBUG_KEEP_JOBS = import.meta.env.VITE_DEBUG_KEEP_JOBS === 'true';
  if (DEBUG_KEEP_JOBS) {
    console.warn('🐛 DEBUG MODE: Completed jobs will NOT be deleted (memory will accumulate!)');
  }

  // 🔬 EXPERIMENTAL: Use server-side LoFTR homography instead of frontend SuperPoint homography
  // Set VITE_USE_SERVER_HOMOGRAPHY=true to enable
  const USE_SERVER_HOMOGRAPHY = import.meta.env.VITE_USE_SERVER_HOMOGRAPHY === 'true';
  if (USE_SERVER_HOMOGRAPHY) {
    console.log('🔬 EXPERIMENTAL: Using server-side LoFTR homography for coordinate transformation');
  }

  // Analysis queue: { [ascentId]: analysisJob }
  const jobs = ref({});

  // 🎯 COMPLETED JOBS REGISTRY: Lightweight tracking with PRIMITIVES ONLY (no object references!)
  // After job completes and is deleted (for memory cleanup), we store minimal completion info.
  // CRITICAL: Only primitive values (strings, numbers, booleans) - NO references to heavy objects!
  // Structure: { [ascentId]: { status: 'complete', completedAt: timestamp, problemId: string, score: number } }
  // Purpose:
  // 1. Tests can check if job completed without keeping heavy job objects in memory
  // 2. UI can show "recently analyzed" without memory leak
  // 3. Each entry is ~100 bytes vs ~80MB for full job with frames
  const completionRegistry = ref({});

  // Track which ascents have been loaded as videos (to avoid showing placeholders)
  // Map<locationId, Set<ascentId>>
  const loadedAscentsByLocation = ref(new Map());

  // Completion callbacks: Map<locationId, callback>
  const completionCallbacks = new Map();

  /**
   * Analysis job structure:
   * {
   *   id: string (crypto.randomUUID())
   *   ascentId: string
   *   locationId: string
   *   videoFile: File
   *   comparisonImages: Array<{imageId, url, boulderProblems}>
   *   
   *   status: 'queued' | 'extracting' | 'detecting' | 'matching' | 'complete' | 'error'
   *   progress: number (0-100)
   *   
   *   extractedFrames: Array (with pose data)
   *   matchResults: Array (feature matches per frame)
   *   scores: Array (problem scores)
   *   
   *   error: string | null
   *   createdAt: number
   *   completedAt: number | null
   * }
   */

  /**
   * Set frames, images, and problems, then start autonomous pipeline
   * Called by component after frame extraction (DOM work)
   * Auto-creates job if it doesn't exist (simplified flow)
   * 
   * @param {string} ascentId - Pre-generated ascent ID
   * @param {Array} frames - Extracted frames with imageData
   * @param {Array} comparisonImages - Location images with {id, url} (for Step 2 matching)
   * @param {Array} boulderProblems - Boulder problems with {id, name, grade, imageId, holds} (for Step 4 scoring)
   * @param {string} locationId - Location ID (for hold loading)
   */
  const setFrames = async (ascentId, frames, comparisonImages = [], boulderProblems = [], locationId = null) => {
    let job = jobs.value[ascentId];
    
    // Convert to plain arrays (unwrap Pinia reactive refs if passed)
    const plainComparisonImages = Array.isArray(comparisonImages) ? [...comparisonImages] : [];
    const plainBoulderProblems = Array.isArray(boulderProblems) ? [...boulderProblems] : [];
    
    // Auto-create job if it doesn't exist (simplified component flow)
    if (!job) {
      console.log(`[PROGRESS] 📊 [ANALYSIS] Creating analysis job for ascent ${ascentId}`);
      const jobId = generateUUID();
      
      job = {
        id: jobId,
        ascentId,
        locationId,
        videoFile: null,   // Not needed for analysis
        comparisonImages: plainComparisonImages,   // For image matching (Step 2)
        boulderProblems: plainBoulderProblems,     // For scoring (Step 4)
        
        status: 'queued',
        progress: PROGRESS.START,  // Start at 10% (upload complete, frame extraction done)
        
        extractedFrames: [],
        matchedImageId: null,    // Set by Step 2
        homographyMatrix: null,  // Set by Step 2
        holds: [],               // Set by Step 3
        scores: null,            // Set by Step 4
        
        error: null,
        createdAt: Date.now(),
        completedAt: null,
      };
      
      jobs.value[ascentId] = job;
    }
    
    job.extractedFrames = frames;
    job.status = 'extracting-complete';
    
    if (plainComparisonImages && plainComparisonImages.length > 0) {
      job.comparisonImages = plainComparisonImages;
    }
    if (plainBoulderProblems && plainBoulderProblems.length > 0) {
      job.boulderProblems = plainBoulderProblems;
    }
    
    console.log(`📊 Frames + data received for ascent ${ascentId}`);
    console.log(`   Frames: ${frames.length}, Images: ${plainComparisonImages.length}, Problems: ${plainBoulderProblems.length}`);
    
    // Start autonomous pipeline
    await _processJob(ascentId);
  };

  /**
   * Update job status (called internally during processing)
   */
  const updateJobStatus = (ascentId, updates) => {
    const job = jobs.value[ascentId];
    if (!job) {
      console.warn(`Job ${ascentId} not found`);
      return;
    }
    
    Object.assign(job, updates);
  };

  /**
   * Internal: Full autonomous pipeline
   * Step 1: Pose detection → Step 2: Image matching → Step 3: Hold loading → Step 4: Scoring → Step 5: Firestore update
   */
  const _processJob = async (ascentId) => {
    const job = jobs.value[ascentId];
    if (!job) return;

    try {
      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║  🚀 STARTING AUTONOMOUS ANALYSIS PIPELINE                  ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝`);
      console.log(`   Ascent: ${ascentId}`);
      console.log(`   Frames: ${job.extractedFrames.length}`);
      console.log(`   Images: ${job.comparisonImages.length}`);
      console.log(`   Problems: ${job.boulderProblems.length}`);

      // Step 1: Pose Detection (0-20%)
      await _detectPoses(job);
      
      // Step 2: Image Matching (20-40%)
      await _matchImagesToFrames(job);
      
      // Step 3: Load Hold Data (40-60%)
      await _loadHoldData(job);
      
      // Step 4: Score Problems (60-90%)
      await _scoreProblems(job);
      
      // Step 5: Update Firestore (90-100%)
      await _updateAscentWithResults(job);

      // Complete!
      job.status = 'complete';
      job.progress = PROGRESS.COMPLETE;
      job.completedAt = Date.now();

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║  ✅ FULL PIPELINE COMPLETE                                 ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝`);
      console.log(`   Duration: ${((job.completedAt - job.createdAt) / 1000).toFixed(2)}s`);
      console.log(`   Detected: ${job.scores?.[0]?.name || 'No match'}`);
      console.log(`   Score: ${job.scores?.[0]?.totalScore ? (job.scores[0].totalScore * 100).toFixed(1) + '%' : 'N/A'}\n`);

      // 🧹 MEMORY CLEANUP: Free frames to prevent 80MB memory leak!
      // ROOT CAUSE: Job object stays in Pinia reactive store (jobs.value), keeping frames reachable
      // SOLUTION: Delete job entirely from store after completion callback
      console.log(`\n🧹 MEMORY CLEANUP STARTING...`);
      
      if (job.extractedFrames && job.extractedFrames.length > 0) {
        const frameCount = job.extractedFrames.length;
        let revokedUrls = 0;
        let clearedImageData = 0;
        
        job.extractedFrames.forEach(frame => {
          // Revoke blob URLs to free blob memory
          if (frame.url) {
            try {
              URL.revokeObjectURL(frame.url);
              revokedUrls++;
            } catch (e) {
              // URL might already be revoked, ignore
            }
          }
          
          // Clear ImageData reference (this is the 8MB per frame!)
          if (frame.imageData) {
            clearedImageData++;
            frame.imageData = null;
          }
          
          // Clear pose data too (smaller but still helpful)
          if (frame.poseData) {
            frame.poseData = null;
          }
        });
        
        console.log(`   ✓ Freed ${frameCount} frames (~${frameCount * 8}MB)`);
        console.log(`   ✓ Revoked ${revokedUrls} blob URLs`);
        console.log(`   ✓ Cleared ${clearedImageData} ImageData objects`);
      }

      // Trigger completion callback if registered for this location
      // (callback needs to run BEFORE we delete the job)
      if (job.locationId && completionCallbacks.has(job.locationId)) {
        const callback = completionCallbacks.get(job.locationId);
        try {
          callback(job.ascentId, job);
        } catch (error) {
          console.error('Error in completion callback:', error);
        }
      }

      // � RECORD COMPLETION: Store lightweight completion state BEFORE deleting job
      // Tests and UI components can check this registry to see if processing is done
      // PRIMITIVES ONLY - no object references!
      completionRegistry.value[ascentId] = {
        status: 'complete',                                    // string
        completedAt: job.completedAt,                          // number (timestamp)
        detectedProblemId: job.detectedProblemId || null,      // string or null
        topScore: job.scores?.[0]?.totalScore || null,         // number or null
        topProblemName: job.scores?.[0]?.name || null,         // string or null
        // This entry is ~100 bytes vs ~80MB for the full job with frames!
      };
      console.log(`   📝 Completion recorded (primitives only, ~100 bytes)`);

      // �🗑️ DELETE JOB FROM STORE: This is the KEY to memory cleanup!
      // Even with null refs above, the job object in Pinia reactive store keeps everything reachable
      // Deleting the job allows JavaScript GC to collect ALL nested data (frames, ImageData, etc.)
      console.log(`   🗑️  Removing job from store to enable garbage collection...`);
      delete jobs.value[ascentId];
      console.log(`   ✅ Job removed - memory now eligible for GC\n`);

    } catch (error) {
      console.error(`❌ Error in analysis pipeline:`, error);
      job.status = 'error';
      job.error = error.message;
      
      // 🧹 CLEANUP ON ERROR: Still need to free memory even if job failed!
      console.log(`\n🧹 ERROR CLEANUP: Freeing memory...`);
      if (job.extractedFrames && job.extractedFrames.length > 0) {
        const frameCount = job.extractedFrames.length;
        job.extractedFrames.forEach(frame => {
          if (frame.url) {
            try {
              URL.revokeObjectURL(frame.url);
            } catch (e) {
              // Ignore revoke errors
            }
          }
          frame.imageData = null;
          frame.poseData = null;
        });
        console.log(`   ✓ Freed ${frameCount} frames (~${frameCount * 8}MB)`);
      }
      
      // 📝 RECORD ERROR: Store error state in completion registry
      completionRegistry.value[ascentId] = {
        status: 'error',                   // string
        completedAt: Date.now(),           // number
        error: error.message,              // string
        detectedProblemId: null,           // null
        topScore: null,                    // null
      };
      console.log(`   📝 Error recorded in completion registry`);
      
      // 🗑️ DELETE JOB: Free memory even on error
      if (!DEBUG_KEEP_JOBS) {
        console.log(`   🗑️  Removing failed job from store...`);
        delete jobs.value[ascentId];
        console.log(`   ✅ Job removed - memory freed despite error\n`);
      } else {
        console.log(`   🐛 DEBUG: Keeping failed job in memory (VITE_DEBUG_KEEP_JOBS=true)\n`);
      }
    }
  };

  /**
   * Step 1: Detect poses in all frames
   */
  const _detectPoses = async (job) => {
    console.log(`[PROGRESS] 🔍 [ANALYSIS] Starting pose detection (progress: ${job.progress}%)...`);
    console.log(`   Frames to analyze: ${job.extractedFrames.length}`);
    
    job.status = 'detecting';
    
    // Get pose detection service (uses factory to get YOLO or other configured model)
    const poseService = getPoseDetectionService();
    await poseService.initialize();
    
    for (let i = 0; i < job.extractedFrames.length; i++) {
      const frame = job.extractedFrames[i];
      
      try {
        // Use real pose detection service (goes through YOLO adapter)
        const poseResult = await poseService.detectPose(frame.imageData);
        
        console.log(`   Frame ${i + 1}/${job.extractedFrames.length}: detected=${poseResult?.detected}, error=${poseResult?.error}`);
        
        if (poseResult && poseResult.error) {
          frame.poseData = null;
          frame.poseError = poseResult.message;
        } else if (poseResult && poseResult.detected) {
          // Only set poseData if a pose was actually detected
          frame.poseData = poseResult;
          frame.poseError = null;
          console.log(`      ✓ Pose detected with confidence: ${poseResult.confidence || 'N/A'}`);
        } else {
          frame.poseData = null;
          frame.poseError = 'No person visible in frame';
          console.log(`      ✗ No pose detected`);
        }
      } catch (err) {
        console.error(`Error in frame ${i + 1}:`, err);
        frame.poseData = null;
        frame.poseError = `Detection failed: ${err.message}`;
      }

      // Update progress (pose detection range)
      const newProgress = job.extractedFrames.length > 0 
        ? PROGRESS.POSE.start + Math.round((i / job.extractedFrames.length) * range(PROGRESS.POSE))
        : PROGRESS.POSE.start;
      console.log(`[PROGRESS] 🤸 [ANALYSIS] Pose detection frame ${i + 1}/${job.extractedFrames.length}: ${newProgress}%`);
      job.progress = newProgress;

      // Small delay between frames for mobile devices
      if (i < job.extractedFrames.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successfulDetections = job.extractedFrames.filter(f => f.poseData).length;
    console.log(`✅ Pose detection complete: ${successfulDetections}/${job.extractedFrames.length} frames with poses`);
    
    if (successfulDetections === 0) {
      throw new Error('No poses detected in any frames');
    }
    
    // Select best frame for image matching using multi-factor scoring
    job.bestFrameIndex = _selectBestFrame(job.extractedFrames);
    console.log(`🎯 Selected frame ${job.bestFrameIndex + 1} as best for image matching`);
  };

  /**
   * Helper: Select best frame for image matching
   * Uses multi-factor scoring: pose confidence (50%), temporal position (30%), keypoint spread (20%)
   */
  const _selectBestFrame = (frames) => {
    const framesWithPoses = frames.map((frame, index) => ({ frame, index }))
      .filter(({ frame }) => frame.poseData);
    
    if (framesWithPoses.length === 0) return 0;
    
    console.log(`\n🎯 Selecting best frame from ${framesWithPoses.length} frames with poses...`);
    
    const scoredFrames = framesWithPoses.map(({ frame, index }) => {
      const keypoints = frame.poseData.keypoints;
      
      // 1️⃣ Pose Confidence (50%) - How confident are we about the pose?
      const validKeypoints = Object.values(keypoints).filter(kp => kp && typeof kp.confidence === 'number');
      const poseConfidence = validKeypoints.length > 0
        ? validKeypoints.reduce((sum, kp) => sum + kp.confidence, 0) / validKeypoints.length
        : 0;
      
      // 2️⃣ Keypoint Spread (20%) - How spread out are the limbs?
      const keypointPositions = validKeypoints.map(kp => ({ x: kp.x, y: kp.y }));
      let spread = 0;
      if (keypointPositions.length >= 2) {
        let totalDistance = 0;
        let pairs = 0;
        for (let i = 0; i < keypointPositions.length; i++) {
          for (let j = i + 1; j < keypointPositions.length; j++) {
            const dx = keypointPositions[i].x - keypointPositions[j].x;
            const dy = keypointPositions[i].y - keypointPositions[j].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
            pairs++;
          }
        }
        spread = pairs > 0 ? totalDistance / pairs : 0;
      }
      const normalizedSpread = Math.min(spread / 1.4, 1.0);
      
      // 3️⃣ Temporal Stability (30%) - Prefer middle frames (around frame 5)
      const framePosition = index / (frames.length - 1);
      const temporalScore = 1.0 - Math.abs(framePosition - 0.5) * 2;
      
      // Weighted composite score
      const compositeScore = 
        poseConfidence * 0.50 +
        normalizedSpread * 0.20 +
        temporalScore * 0.30;
      
      return { index, poseConfidence, normalizedSpread, temporalScore, compositeScore };
    });
    
    scoredFrames.sort((a, b) => b.compositeScore - a.compositeScore);
    const best = scoredFrames[0];
    
    console.log(`   Frame Selection Scores:`);
    scoredFrames.slice(0, 3).forEach((scored, rank) => {
      console.log(`   ${rank + 1}. Frame ${scored.index + 1}: ${(scored.compositeScore * 100).toFixed(1)}% ` +
        `(pose: ${(scored.poseConfidence * 100).toFixed(0)}%, ` +
        `spread: ${(scored.normalizedSpread * 100).toFixed(0)}%, ` +
        `tempo: ${(scored.temporalScore * 100).toFixed(0)}%)`);
    });
    
    return best.index;
  };

  /**
   * Step 2: Match video frames to location images using SuperPoint + homography
   */
  const _matchImagesToFrames = async (job) => {
    console.log(`\n🖼️ Starting image matching (SuperPoint + LightGlue)...`);
    console.log(`   Frames: ${job.extractedFrames.length}`);
    console.log(`   Images: ${job.comparisonImages.length}`);
    
    job.status = 'matching';
    job.progress = PROGRESS.MATCHING.start;
    console.log(`[PROGRESS] 🖼️ [ANALYSIS] Step 2: Matching video frame to location image (progress: ${PROGRESS.MATCHING.start}%)...`);
    
    // Extract image URLs from comparison images
    const imageUrls = job.comparisonImages.map(img => img.url).filter(Boolean);
    
    if (imageUrls.length === 0) {
      throw new Error('No valid image URLs in comparison images');
    }
    
    console.log(`   Comparing against ${imageUrls.length} location images...`);
    
    // Get the inference store for SuperPoint
    const inferenceStore = useInferenceStore();
    
    // Wait for inference session to be ready
    console.log(`   Waiting for inference session to initialize...`);
    await inferenceStore.ensureSessionReady();
    console.log(`   ✅ Inference session ready`);
    
    // Use the best frame selected in Step 1
    if (job.bestFrameIndex === undefined || !job.extractedFrames[job.bestFrameIndex]) {
      throw new Error('Best frame not found - pose detection may have failed');
    }
    
    const bestFrame = job.extractedFrames[job.bestFrameIndex];
    console.log(`   Using frame ${job.bestFrameIndex + 1} (best frame from pose detection)`);
    
    // Run SuperPoint feature matching using batch inference
    console.log(`   Running batch inference...`);
    
    // Convert video frame to blob for inference
    const frameBlob = await fetch(bestFrame.url).then(r => r.blob());
    const frameFile = new File([frameBlob], 'frame.jpg', { type: 'image/jpeg' });
    
    // Run inference batch and wait for results
    await new Promise((resolve) => {
      inferenceStore.runInferenceBatch(
        frameFile,
        imageUrls,
        resolve,  // onComplete callback
        (currentIndex, totalImages) => {
          // Image matching takes longest: uses PROGRESS.MATCHING.start → PROGRESS.MATCHING.end
          // progressCallback receives (currentIndex, totalImages), convert to 0-1 range
          const progressRatio = totalImages > 0 ? currentIndex / totalImages : 0;
          job.progress = PROGRESS.MATCHING.start + Math.round(progressRatio * range(PROGRESS.MATCHING));
        }
      );
    });
    
    // Get results from store
    const results = inferenceStore.inferenceResults;
    const matchCounts = inferenceStore.matchCounts;
    const matchResults = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const result = results[imageUrl];
      const matchCount = matchCounts[imageUrl] || 0;
      
      if (result && matchCount > 0) {
        // Extract match data from raw results
        const rawData = result.rawData;
        const matches = rawData?.matches;
        const keypoints0 = rawData?.keypoints0;
        const keypoints1 = rawData?.keypoints1;
        
        matchResults.push({
          imageId: job.comparisonImages[i].imageId || job.comparisonImages[i].id,  // Support both field names
          imageUrl,
          matchCount,
          confidence: matchCount,
          keypoints0,
          keypoints1,
          matches,
        });
        
        console.log(`   ✓ Image ${i + 1}/${imageUrls.length}: ${matchCount} matches`);
      } else {
        console.log(`   ✗ Image ${i + 1}/${imageUrls.length}: No matches`);
      }
    }
    
    if (matchResults.length === 0) {
      throw new Error('No matching location images found');
    }
    
    // Sort by match count
    matchResults.sort((a, b) => b.matchCount - a.matchCount);
    const bestMatch = matchResults[0];
    
    console.log(`✅ Best match found: ${bestMatch.matchCount} feature matches`);
    console.log(`   Image ID: ${bestMatch.imageId}`);
    
    // 🔬 Server-side LoFTR matching for improved homography
    const matchedImage = job.comparisonImages?.find(img => img.imageId === bestMatch.imageId);
    
    if (USE_SERVER_HOMOGRAPHY && bestFrame?.imageData && matchedImage?.url) {
      console.log(`\n🔬 Requesting server-side LoFTR homography...`);
      try {
        // Pass video frame dimensions so server knows coordinate space
        const videoDimensions = {
          width: bestFrame.imageData.width,
          height: bestFrame.imageData.height
        };
        
        // Fetch location image
        const locationImageBlob = await fetch(matchedImage.url).then(r => r.blob());
        
        // Load blob as image to get dimensions
        const locationImage = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = URL.createObjectURL(locationImageBlob);
        });
        
        const locationDimensions = {
          width: locationImage.naturalWidth,
          height: locationImage.naturalHeight
        };
        
        console.log(`   📐 Sending dimensions: video ${videoDimensions.width}×${videoDimensions.height}, location ${locationDimensions.width}×${locationDimensions.height}`);
        
        // Extract 4 body extremity keypoints for localized homography
        const transformPoints = [];
        if (bestFrame.poseData?.keypoints) {
          const extremityMapping = {
            left_wrist: 'leftHand',
            right_wrist: 'rightHand',
            left_ankle: 'leftFoot',
            right_ankle: 'rightFoot'
          };
          
          for (const [id, keypointType] of Object.entries(extremityMapping)) {
            const kp = bestFrame.poseData.keypoints[keypointType];
            if (kp && kp.confidence > 0.5) {  // Only use confident keypoints
              transformPoints.push({
                x: kp.x,
                y: kp.y,
                id: id,
                name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              });
            }
          }
          
          if (transformPoints.length > 0) {
            console.log(`   🎯 Requesting localized homography for ${transformPoints.length} body extremities`);
          }
        }
        
        // Send to server with explicit dimensions and transform points
        const serverResult = await matchImagesOnServer(
          bestFrame.imageData, 
          locationImageBlob, 
          job.ascentId,
          videoDimensions,
          locationDimensions,
          transformPoints  // Include extremity points for localized transforms
        );
        
        // Clean up object URL
        URL.revokeObjectURL(locationImage.src);
        
        if (serverResult?.homography_matrix) {
          console.log(`✅ Server homography received!`);
          console.log(`   Inliers: ${serverResult.inlier_matches}/${serverResult.total_matches} (${(serverResult.inlier_ratio * 100).toFixed(1)}%)`);
          console.log(`   Quality: ${serverResult.matchQuality}`);
          
          // Store server homography - will be used in Step 4 (scoring)
          job.serverHomographyMatrix = serverResult.homography_matrix;
          job.serverHomographyQuality = {
            inlierMatches: serverResult.inlier_matches,
            totalMatches: serverResult.total_matches,
            inlierRatio: serverResult.inlier_ratio,
            quality: serverResult.matchQuality
          };
      
        } else {
          console.warn(`⚠️ Server response missing homography_matrix, falling back to frontend`);
        }
        // Store localized transforms if received
        if (serverResult.localized_transforms && serverResult.localized_transforms.length > 0) {
          job.localizedTransforms = serverResult.localized_transforms;
          console.log(`   🎯 Stored ${serverResult.localized_transforms.length} localized transformations`);
        }
      } catch (err) {
        console.warn(`⚠️ Server homography failed: ${err.message}, falling back to frontend`);
      }
    }
    // Convert raw ONNX data to match objects for homography calculation
    // SuperPoint/LightGlue uses 256x256 inference size - scale keypoints back to original dimensions
    const result = results[bestMatch.imageUrl];
    const rawData = result.rawData;
    const inferenceSize = 256;
    const userImageDims = result.userImageDims || { width: inferenceSize, height: inferenceSize };
    const topoImageDims = result.topoImageDims || { width: inferenceSize, height: inferenceSize };
    
    // Calculate scaling factors
    const userScaleX = userImageDims.width / inferenceSize;
    const userScaleY = userImageDims.height / inferenceSize;
    const topoScaleX = topoImageDims.width / inferenceSize;
    const topoScaleY = topoImageDims.height / inferenceSize;
    
    // Build match array in format expected by calculateHomographyMatrix
    const matches = [];
    const maxMatches = rawData.matches.dims[0];
    
    for (let i = 0; i < maxMatches; i++) {
      const matchBaseIndex = i * rawData.matches.dims[1];
      const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
      const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);
      
      // Scale keypoints back to original image coordinates
      const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]) * userScaleX;
      const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]) * userScaleY;
      const x1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) * topoScaleX;
      const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]) * topoScaleY;
      
      matches.push({
        point1: { x: x0, y: y0 },
        point2: { x: x1, y: y1 },
      });
    }
    
    console.log(`   ✓ Converted ${matches.length} matches for homography calculation`);
    
    if (matches.length < 4) {
      throw new Error(`Not enough matches for homography (${matches.length} < 4)`);
    }
    
    // Calculate homography matrix
    const homographyResult = await calculateHomographyMatrix(matches);
    
    if (!homographyResult || !homographyResult.matrix) {
      throw new Error('Failed to calculate homography matrix');
    }
    
    console.log(`✅ Homography matrix calculated (${homographyResult.inliers}/${matches.length} inliers)`);
    
    job.matchedImageId = bestMatch.imageId;
    job.homographyMatrix = homographyResult.matrix;
    job.featureMatches = matches;  // Store for debugging/visualization
    job.homographyInliers = homographyResult.inliers;  // Number of inlier matches
    job.matchedImageDimensions = topoImageDims; // Store the actual location image dimensions
    job.progress = PROGRESS.MATCHING.end;  // Image matching complete
  };

  /**
   * Step 3: Load hold data for the matched image
   */
  const _loadHoldData = async (job) => {
    console.log(`\n📍 Loading hold data for matched image...`);
    
    if (!job.matchedImageId) {
      throw new Error('No matched image - cannot load holds');
    }
    
    if (!job.locationId) {
      throw new Error('No location ID - cannot load holds');
    }
    
    job.status = 'loading-holds';
    job.progress = PROGRESS.HOLDS.start;
    
    // Load FULL hold detection document (not just holds array)
    // We need the full structure with metadata for findClosestHolds
    let holdDetection = null;
    let allHolds = [];
    try {
      console.log(`   Loading hold detection for: location=${job.locationId}, image=${job.matchedImageId}`);
      holdDetection = await holdDetectionService.getHoldDetection(
        job.locationId,
        job.matchedImageId
      );
      
      if (holdDetection) {
        allHolds = await holdDetectionService.getAllHolds(
          job.locationId,
          job.matchedImageId
        );
        console.log(`   ✓ Loaded ${allHolds.length} holds (AI + manual combined)`);
        console.log(`   ✓ Detection metadata:`, holdDetection.detectionResults?.metadata);
      } else {
        console.log(`   ⚠ No hold detection document found`);
      }
    } catch (err) {
      console.warn(`   ⚠ Failed to load hold detection:`, err);
    }
    
    // Also check standalone manual holds collection (legacy/fallback)
    let standaloneManualHolds = [];
    try {
      standaloneManualHolds = await manualHoldsService.loadManualHolds(
        job.locationId,
        job.matchedImageId
      );
      
      if (standaloneManualHolds && standaloneManualHolds.length > 0) {
        console.log(`   ✓ Loaded ${standaloneManualHolds.length} standalone manual holds`);
      }
    } catch (err) {
      console.warn(`   ⚠ Failed to load standalone manual holds:`, err);
    }
    
    // Combine all holds (deduplicate by holdId if needed)
    job.holds = [...allHolds, ...standaloneManualHolds];
    job.holdDetection = holdDetection; // Store full detection document
    
    console.log(`✅ Total holds loaded: ${job.holds.length}`);
    
    if (job.holds.length === 0) {
      console.warn(`   ⚠ No holds found for image ${job.matchedImageId}`);
    }
    
    job.progress = PROGRESS.HOLDS.end;  // Hold loading complete
  };

  /**
   * Step 4: Score problems by transforming poses to image coordinates
   */
  const _scoreProblems = async (job) => {
    console.log(`\n🎯 Starting problem scoring...`);
    
    job.status = 'scoring';
    job.progress = PROGRESS.SCORING.start;
    
    if (!job.homographyMatrix) {
      throw new Error('No homography matrix - cannot transform coordinates');
    }
    
    // 🎯 CRITICAL: Only score problems that belong to the matched image
    const matchedImageProblems = job.boulderProblems.filter(problem => {
      // Support both field names: imageId or referenceImageId
      const problemImageId = problem.imageId || problem.referenceImageId;
      return problemImageId === job.matchedImageId;
    });
    
    console.log(`   Total problems in location: ${job.boulderProblems.length}`);
    console.log(`   Problems on matched image (${job.matchedImageId}): ${matchedImageProblems.length}`);
    console.log(`   Frames with poses: ${job.extractedFrames.filter(f => f.poseData).length}`);
    console.log(`   Available holds: ${job.holds.length}`);
    
    // 🔍 DEBUG: Check problem-hold association structure
    if (matchedImageProblems.length > 0) {
      const firstProblem = matchedImageProblems[0];
      console.log(`   🔍 First problem structure:`, {
        id: firstProblem.id,
        name: firstProblem.name,
        holdsCount: firstProblem.holds?.length || 0,
        holdsFieldName: Object.keys(firstProblem).find(k => k.toLowerCase().includes('hold')),
        firstHoldStructure: firstProblem.holds?.[0]
      });
      console.log(`   🔍 First hold from job.holds:`, job.holds[0]);
    }
    
    if (matchedImageProblems.length === 0) {
      console.warn(`   ⚠️ No problems found on matched image ${job.matchedImageId}`);
      job.scores = [];
      job.progress = PROGRESS.SCORING.end;
      return;
    }
    
    console.log(`✓ Homography matrix exists`);
    console.log(`📊 Frame poseData structure check:`, job.extractedFrames[0]?.poseData);
    
    // Transform ONLY the best frame (not all frames)
    const transformedFrames = [];
    const bestFrame = job.extractedFrames[job.bestFrameIndex];
    
    console.log(`\n🔄 Transforming keypoints for BEST frame (${job.bestFrameIndex + 1})...`);
    
    if (!bestFrame.poseData) {
      throw new Error('Best frame has no pose data');
    }
      
    console.log(`   ✓ Has pose data, extracting keypoints...`);
    
    const videoKeypoints = [];
    const keypointTypes = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'];
    
    for (const type of keypointTypes) {
      const kp = bestFrame.poseData.keypoints[type];
      if (kp && kp.confidence > 0.3) {
        videoKeypoints.push({ x: kp.x, y: kp.y, type, confidence: kp.confidence });
        console.log(`   ✓ ${type}: confidence=${kp.confidence.toFixed(2)}`);
      }
    }
    
    if (videoKeypoints.length === 0) {
      throw new Error('Best frame has no valid keypoints');
    }
    
    console.log(`   Collected ${videoKeypoints.length} keypoints`);
    
    // Transform keypoints from video coordinates to image coordinates
    // Use localized transforms if available (most accurate), otherwise fallback to global homography
    let imageKeypoints = [];
    
    if (job.localizedTransforms && job.localizedTransforms.length > 0) {
      console.log(`   🎯 Using localized transformations for ${job.localizedTransforms.length} keypoints`);
      
      // Map keypoint types to localized transform names
      const typeToName = {
        'leftHand': 'Left Wrist',
        'rightHand': 'Right Wrist',
        'leftFoot': 'Left Ankle',
        'rightFoot': 'Right Ankle'
      };
      
      // Use localized transform for each keypoint
      for (const kp of videoKeypoints) {
        const transformName = typeToName[kp.type];
        const localizedTransform = job.localizedTransforms.find(t => t.name === transformName);
        
        if (localizedTransform) {
          // Use the pre-transformed target point from server
          imageKeypoints.push({
            x: localizedTransform.target_point.x,
            y: localizedTransform.target_point.y,
            type: kp.type,
            confidence: kp.confidence
          });
          const fallbackIndicator = localizedTransform.fallback_used ? ' (fallback)' : '';
          console.log(`   ✓ ${kp.type}: localized transform${fallbackIndicator}`);
        } else {
          // Fallback to global homography for this keypoint if no localized transform
          const homographyToUse = job.serverHomographyMatrix || job.homographyMatrix;
          const transformed = transformPoints([kp], homographyToUse);
          imageKeypoints.push(transformed[0]);
          console.log(`   ⚠️ ${kp.type}: using global homography (no localized transform)`);
        }
      }
    } else {
      // Use global homography (legacy path)
      const homographyToUse = job.serverHomographyMatrix || job.homographyMatrix;
      const homographySource = job.serverHomographyMatrix ? '(server homography)' : 'SuperPoint (frontend)';
      
      console.log(`   🔄 Using ${homographySource} global homography for transformation`);
      if (job.serverHomographyQuality) {
        console.log(`      Server quality: ${job.serverHomographyQuality.inlierMatches} inliers (${(job.serverHomographyQuality.inlierRatio * 100).toFixed(1)}%)`);
      }
      
      imageKeypoints = transformPoints(videoKeypoints, homographyToUse);
    }
    
    if (!imageKeypoints || !Array.isArray(imageKeypoints) || imageKeypoints.length === 0) {
      throw new Error('Keypoint transformation failed');
    }
    
    // Build originalPoints and transformedPoints arrays for getKeypointRows
    const originalPoints = videoKeypoints.map(kp => ({
      name: kp.type,
      x: kp.x,
      y: kp.y,
      confidence: kp.confidence
    }));
    
    const transformedPoints = imageKeypoints.map(kp => ({
      name: kp.type,
      x: kp.x,
      y: kp.y,
      confidence: kp.confidence
    }));
    
    transformedFrames.push({
      ...bestFrame,
      frameIndex: job.bestFrameIndex, // Preserve original frame number for logging
      originalPoints,
      transformedPoints,
      poseData: {
        keypoints: imageKeypoints.reduce((acc, kp) => {
          acc[kp.type] = { x: kp.x, y: kp.y, confidence: kp.confidence };
          return acc;
        }, {}),
        confidence: bestFrame.poseData.confidence
      }
    });
    
    console.log(`   ✓ Transformed ${transformedFrames.length} frames to image coordinates`);
    
    // Validate boulder problems is an array
    if (!Array.isArray(job.boulderProblems)) {
      console.error(`   ❌ boulderProblems is not an array:`, typeof job.boulderProblems, job.boulderProblems);
      throw new Error(`Invalid boulderProblems: expected array, got ${typeof job.boulderProblems}`);
    }
    
    // Create bestMatchImage object for hold matching
    // findClosestHolds needs: name, referenceImageDimensions, detectionResults with results + metadata
    // CRITICAL: referenceImageDimensions must be the LOCATION IMAGE dimensions (from topoImageDims),
    // NOT the video frame dimensions. The homography transforms video coords → location image coords.
    const bestMatchImage = {
      name: 'matched-image', // Required by findClosestHolds
      referenceImageDimensions: job.matchedImageDimensions || {
        width: 640, // Fallback if dimensions not available
        height: 480
      },
      detectionResults: {
        results: job.holds,  // All holds (AI + manual combined)
        imageMetadata: job.holdDetection?.detectionResults?.metadata || {}
      }
    };
    
    console.log(`\n📦 bestMatchImage structure:`, {
      name: bestMatchImage.name,
      referenceImageDims: bestMatchImage.referenceImageDimensions,
      detectionImageDims: job.holdDetection?.detectionResults?.metadata?.imageDimensions,
      holdsCount: job.holds.length,
      hasMetadata: !!job.holdDetection?.detectionResults?.metadata
    });
    console.log(`   📐 Coordinate spaces:`);
    console.log(`      Video frame: ${bestFrame.imageData?.width}×${bestFrame.imageData?.height}`);
    console.log(`      Location image (topo): ${bestMatchImage.referenceImageDimensions.width}×${bestMatchImage.referenceImageDimensions.height}`);
    console.log(`      Detection image (AI): ${job.holdDetection?.detectionResults?.metadata?.imageDimensions?.width}×${job.holdDetection?.detectionResults?.metadata?.imageDimensions?.height}`);
    
    // Create the getKeypointRowsForFrame function that calculateProblemScores expects
    // 🎯 IMPORTANT: Pass matchedImageProblems (filtered), not all problems
    const getKeypointRowsForFrame = (frame) => {
      const rows = getKeypointRows(frame, transformedFrames, bestMatchImage, matchedImageProblems);
      console.log(`   🔍 getKeypointRows returned ${rows.length} rows for frame`);
      if (rows.length > 0) {
        console.log(`      First keypoint's 3 closest holds:`);
        console.log(`        1st: ${rows[0].closestHold?.id} (problem: ${rows[0].closestProblem?.name || 'none'})`);
        console.log(`        2nd: ${rows[0].secondClosestHold?.id} (problem: ${rows[0].secondClosestProblem?.name || 'none'})`);
        console.log(`        3rd: ${rows[0].thirdClosestHold?.id} (problem: ${rows[0].thirdClosestProblem?.name || 'none'})`);
      }
      return rows;
    };
    
    // Score problems using the shared utility
    console.log(`\n🎲 Calling calculateProblemScores...`);
    console.log(`   transformedFrames.length: ${transformedFrames.length}`);
    console.log(`   matchedImageProblems.length: ${matchedImageProblems.length} (filtered from ${job.boulderProblems.length} total)`);
    console.log(`   holds.length: ${job.holds.length}`);
    
    const scores = calculateProblemScores(
      transformedFrames,
      getKeypointRowsForFrame
    );
    
    console.log(`\n📈 Raw scores returned:`, scores);
    console.log(`   Scores array length: ${scores ? scores.length : 'null/undefined'}`);
    
    if (!scores || scores.length === 0) {
      console.warn(`   ⚠ calculateProblemScores returned no scores!`);
      job.scores = [];
    } else {
      // Map score structure: calculateProblemScores returns {problem, score, confidence}
      // But we need {id, name, grade, totalScore} for Firestore
      const mappedScores = scores.map(s => ({
        id: s.problem.id,
        name: s.problem.name,
        grade: s.problem.grade,
        color: s.problem.color,
        totalScore: s.score,
        confidence: s.confidence,
        matchCount: s.matchCount,
        uniqueHoldsMatched: s.uniqueHoldsMatched
      }));
      
      mappedScores.sort((a, b) => b.totalScore - a.totalScore);
      
      console.log(`✅ Scoring complete!`);
      console.log(`   Top 3 matches:`);
      for (let i = 0; i < Math.min(3, mappedScores.length); i++) {
        const s = mappedScores[i];
        console.log(`   ${i + 1}. ${s.name}: ${(s.totalScore * 100).toFixed(1)}%`);
      }
      
      job.scores = mappedScores;
      
      // Set detected problem ID (for UI display)
      if (mappedScores.length > 0) {
        job.detectedProblemId = mappedScores[0].id;
      }
    }
    job.progress = PROGRESS.SCORING.end;  // Scoring complete
  };

  /**
   * Step 5: Update Firestore with analysis results
   */
  const _updateAscentWithResults = async (job) => {
    console.log(`\n💾 Updating ascent in Firestore...`);
    
    if (!job.scores || job.scores.length === 0) {
      console.warn('   ⚠ No scores to save');
      return;
    }

    const winner = job.scores[0];
    console.log(`   Winner: ${winner.name} (${(winner.totalScore * 100).toFixed(1)}%)`);

    try {
      // Prepare update data - DON'T touch video object (upload queue manages that)
      const updateData = {
        // Add detected problem if score is high enough (>50%)
        ...(winner.totalScore > 0.5 && {
          problemId: winner.id,
          problemSnapshot: {
            name: winner.name,
            grade: winner.grade || null,
            color: winner.color || null,
          }
        }),
        // Add analysis metadata
        analysisMetadata: {
          detectedAt: new Date(),
          topScore: winner.totalScore,
          topProblemId: winner.id,
          topProblemName: winner.name,
          allScores: job.scores.slice(0, 3).map(s => ({
            problemId: s.id,
            name: s.name,
            score: s.totalScore
          }))
        }
      };

      // Update using ascentService
      await ascentService.updateAscent(job.ascentId, updateData);

      console.log(`✅ Ascent updated with analysis results`);
      if (winner.totalScore > 0.5) {
        console.log(`   Problem detected: ${winner.name}`);
      } else {
        console.log(`   No confident problem match (score < 50%)`);
      }

      job.progress = PROGRESS.COMPLETE;

    } catch (error) {
      console.error('❌ Failed to update ascent with analysis results:', error);
      throw error;
    }
  };

  /**
   * Get analysis job by ascent ID
   * Returns active job OR completion record (lightweight status after job deleted)
   */
  const getJob = (ascentId) => {
    // Check active jobs first
    if (jobs.value[ascentId]) {
      return jobs.value[ascentId];
    }
    
    // Check completion registry (job was completed and deleted for memory cleanup)
    if (completionRegistry.value[ascentId]) {
      return completionRegistry.value[ascentId];
    }
    
    return null;
  };

  /**
   * Cancel an analysis job
   */
  const cancelJob = (ascentId) => {
    if (jobs.value[ascentId]) {
      if (!DEBUG_KEEP_JOBS) {
        delete jobs.value[ascentId];
        console.log(`❌ Analysis job cancelled: ${ascentId}`);
      } else {
        console.log(`🐛 DEBUG: Would cancel job ${ascentId} but VITE_DEBUG_KEEP_JOBS=true`);
      }
    }
    // Also clear from completion registry if exists
    if (completionRegistry.value[ascentId]) {
      if (!DEBUG_KEEP_JOBS) {
        delete completionRegistry.value[ascentId];
      }
    }
  };

  /**
   * Clear all jobs (for testing/debugging)
   */
  const clearAll = () => {
    if (!DEBUG_KEEP_JOBS) {
      jobs.value = {};
      completionRegistry.value = {}; // Also clear completion records
      console.log('🗑️ All jobs and completion records cleared');
    } else {
      console.log('🐛 DEBUG: clearAll() skipped (VITE_DEBUG_KEEP_JOBS=true)');
    }
  };

  /**
   * Register a callback for when jobs complete at a specific location
   * @param {string} locationId - Location to watch
   * @param {Function} callback - Called with (ascentId, job) when job completes
   * @returns {Function} Unregister function
   */
  const onJobComplete = (locationId, callback) => {
    if (!locationId || typeof callback !== 'function') {
      console.warn('onJobComplete: invalid locationId or callback');
      return () => {};
    }

    completionCallbacks.set(locationId, callback);
    console.log(`📡 Registered completion callback for location ${locationId}`);

    // Return unregister function
    return () => {
      completionCallbacks.delete(locationId);
      console.log(`📡 Unregistered completion callback for location ${locationId}`);
    };
  };

  // Computed properties
  const activeJobs = computed(() => {
    return Object.values(jobs.value).filter(
      job => job.status !== 'complete' && job.status !== 'error'
    );
  });

  const completedJobs = computed(() => {
    return Object.values(jobs.value).filter(
      job => job.status === 'complete'
    );
  });

  const hasActiveJobs = computed(() => {
    return activeJobs.value.length > 0;
  });

  /**
   * Get active job for a specific ascent (for UI display)
   */
  const getActiveJob = computed(() => {
    return activeJobs.value[0] || null;
  });

  /**
   * Mark ascent as loaded (video exists in UI)
   */
  const markAscentLoaded = (locationId, ascentId) => {
    if (!loadedAscentsByLocation.value.has(locationId)) {
      loadedAscentsByLocation.value.set(locationId, new Set());
    }
    loadedAscentsByLocation.value.get(locationId).add(ascentId);
  };

  /**
   * Check if ascent is already loaded
   */
  const isAscentLoaded = (locationId, ascentId) => {
    return loadedAscentsByLocation.value.get(locationId)?.has(ascentId) || false;
  };

  /**
   * Get active jobs for a location (not loaded yet)
   */
  const getActiveJobsForLocation = (locationId) => {
    return Object.values(jobs.value).filter(job => 
      job.locationId === locationId && 
      job.status !== 'complete' &&
      job.status !== 'error'
    );
  };

  /**
   * Get completed jobs for a location (that haven't been loaded as videos yet)
   */
  const getCompletedJobsForLocation = (locationId) => {
    return Object.values(jobs.value).filter(job => 
      job.locationId === locationId && 
      job.status === 'complete' &&
      !isAscentLoaded(locationId, job.ascentId)
    );
  };

  /**
   * Clear completion error for an ascent (when re-processing)
   */
  const clearCompletionError = (ascentId) => {
    if (completionRegistry.value[ascentId]) {
      console.log(`🧹 Clearing completion error for ascent ${ascentId}`);
      delete completionRegistry.value[ascentId];
    }
  };

  return {
    // State
    jobs,
    completionRegistry,  // Expose for tests (lightweight completion tracking)
    
    // Computed
    activeJobs,
    completedJobs,
    hasActiveJobs,
    getActiveJob,
    
    // Actions
    setFrames,      // Main entry point - component calls this after frame extraction
    getJob,         // Get job status
    markAscentLoaded,  // Mark ascent as loaded in UI
    isAscentLoaded,    // Check if ascent is loaded
    getActiveJobsForLocation,     // Get active jobs for location
    getCompletedJobsForLocation,  // Get completed jobs not yet loaded
    cancelJob,      // Cancel job
    clearCompletionError,  // Clear completion error (for re-processing)
    clearAll,       // Clear all jobs (testing)
    onJobComplete,  // Register completion callback (returns unregister function)
    
    // Export progress steps and helpers for UI components
    PROGRESS_STEPS,
    getCurrentStep,
  };
});

// Export progress steps and helpers for external use
export { PROGRESS_STEPS, getCurrentStep };
