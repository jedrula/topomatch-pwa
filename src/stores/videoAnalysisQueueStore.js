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
export const useVideoAnalysisQueueStore = defineStore('videoAnalysisQueue', () => {
  // Analysis queue: { [ascentId]: analysisJob }
  const jobs = ref({});

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
      console.log(`📊 Creating analysis job for ascent ${ascentId}`);
      const jobId = crypto.randomUUID();
      
      job = {
        id: jobId,
        ascentId,
        locationId,
        videoFile: null,   // Not needed for analysis
        comparisonImages: plainComparisonImages,   // For image matching (Step 2)
        boulderProblems: plainBoulderProblems,     // For scoring (Step 4)
        
        status: 'queued',
        progress: 0,
        
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
      job.progress = 100;
      job.completedAt = Date.now();

      console.log(`\n╔════════════════════════════════════════════════════════════╗`);
      console.log(`║  ✅ FULL PIPELINE COMPLETE                                 ║`);
      console.log(`╚════════════════════════════════════════════════════════════╝`);
      console.log(`   Duration: ${((job.completedAt - job.createdAt) / 1000).toFixed(2)}s`);
      console.log(`   Detected: ${job.scores?.[0]?.name || 'No match'}`);
      console.log(`   Score: ${job.scores?.[0]?.totalScore ? (job.scores[0].totalScore * 100).toFixed(1) + '%' : 'N/A'}\n`);

      // Trigger completion callback if registered for this location
      if (job.locationId && completionCallbacks.has(job.locationId)) {
        const callback = completionCallbacks.get(job.locationId);
        try {
          callback(job.ascentId, job);
        } catch (error) {
          console.error('Error in completion callback:', error);
        }
      }

    } catch (error) {
      console.error(`❌ Error in analysis pipeline:`, error);
      job.status = 'error';
      job.error = error.message;
    }
  };

  /**
   * Step 1: Detect poses in all frames
   */
  const _detectPoses = async (job) => {
    console.log(`\n🔍 Starting pose detection...`);
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
        
        if (poseResult && poseResult.error) {
          frame.poseData = null;
          frame.poseError = poseResult.message;
        } else if (poseResult) {
          frame.poseData = poseResult;
          frame.poseError = null;
        } else {
          frame.poseData = null;
          frame.poseError = 'No person visible in frame';
        }
      } catch (err) {
        console.error(`Error in frame ${i + 1}:`, err);
        frame.poseData = null;
        frame.poseError = `Detection failed: ${err.message}`;
      }

      // Update progress (0-15%)
      job.progress = Math.round((i / job.extractedFrames.length) * 15);

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
    job.progress = 15;
    
    // Extract image URLs from comparison images
    const imageUrls = job.comparisonImages.map(img => img.url).filter(Boolean);
    
    if (imageUrls.length === 0) {
      throw new Error('No valid image URLs in comparison images');
    }
    
    console.log(`   Comparing against ${imageUrls.length} location images...`);
    
    // Get the inference store for SuperPoint
    const inferenceStore = useInferenceStore();
    
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
          // Image matching takes longest: 15% → 70% (55% of total)
          // progressCallback receives (currentIndex, totalImages), convert to 0-1 range
          const progressRatio = currentIndex / totalImages;
          job.progress = 15 + Math.round(progressRatio * 55);
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
    job.matchedImageDimensions = topoImageDims; // Store the actual location image dimensions
    job.progress = 70;  // Image matching complete (70%)
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
    job.progress = 70;
    
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
    
    job.progress = 80;  // Hold loading complete (80%)
  };

  /**
   * Step 4: Score problems by transforming poses to image coordinates
   */
  const _scoreProblems = async (job) => {
    console.log(`\n🎯 Starting problem scoring...`);
    console.log(`   Problems to score: ${job.boulderProblems.length}`);
    console.log(`   Frames with poses: ${job.extractedFrames.filter(f => f.poseData).length}`);
    console.log(`   Available holds: ${job.holds.length}`);
    
    job.status = 'scoring';
    job.progress = 80;
    
    if (!job.homographyMatrix) {
      throw new Error('No homography matrix - cannot transform coordinates');
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
    const imageKeypoints = transformPoints(videoKeypoints, job.homographyMatrix);
    
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
    const getKeypointRowsForFrame = (frame) => {
      const rows = getKeypointRows(frame, transformedFrames, bestMatchImage, job.boulderProblems);
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
    console.log(`   boulderProblems.length: ${job.boulderProblems.length}`);
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
    job.progress = 95;  // Scoring complete (95%)
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

      job.progress = 100;

    } catch (error) {
      console.error('❌ Failed to update ascent with analysis results:', error);
      throw error;
    }
  };

  /**
   * Get analysis job by ascent ID
   */
  const getJob = (ascentId) => {
    return jobs.value[ascentId] || null;
  };

  /**
   * Cancel an analysis job
   */
  const cancelJob = (ascentId) => {
    if (jobs.value[ascentId]) {
      delete jobs.value[ascentId];
      console.log(`❌ Analysis job cancelled: ${ascentId}`);
    }
  };

  /**
   * Clear all jobs (for testing/debugging)
   */
  const clearAll = () => {
    jobs.value = {};
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

  return {
    // State
    jobs,
    
    // Computed
    activeJobs,
    completedJobs,
    hasActiveJobs,
    getActiveJob,
    
    // Actions
    setFrames,      // Main entry point - component calls this after frame extraction
    getJob,         // Get job status
    cancelJob,      // Cancel job
    clearAll,       // Clear all jobs (testing)
    onJobComplete,  // Register completion callback (returns unregister function)
  };
});
