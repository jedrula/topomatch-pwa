import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ascentService } from '../services/ascentService.js';
import { extractPoseKeypoints } from '../utils/homographyUtils.js';
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
   * Set frames and comparison problems, then start autonomous pipeline
   * Called by component after frame extraction (DOM work)
   * Auto-creates job if it doesn't exist (simplified flow)
   * 
   * @param {string} ascentId - Pre-generated ascent ID
   * @param {Array} frames - Extracted frames with imageData
   * @param {Array} comparisonProblems - Boulder problems with {id, name, grade, imageId, imageUrl, locationId, holds}
   * @param {string} locationId - Location ID (for hold loading)
   */
  const setFrames = async (ascentId, frames, comparisonProblems = [], locationId = null) => {
    let job = jobs.value[ascentId];
    
    // Auto-create job if it doesn't exist (simplified component flow)
    if (!job) {
      console.log(`📊 Creating analysis job for ascent ${ascentId}`);
      const jobId = crypto.randomUUID();
      
      // Extract locationId from first problem if not provided
      const finalLocationId = locationId || comparisonProblems[0]?.locationId || null;
      
      job = {
        id: jobId,
        ascentId,
        locationId: finalLocationId,
        videoFile: null,   // Not needed for analysis
        comparisonProblems: comparisonProblems || [],
        
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
    
    if (comparisonProblems && comparisonProblems.length > 0) {
      job.comparisonProblems = comparisonProblems;
      console.log(`📊 Frames + problems received for ascent ${ascentId}`);
      console.log(`   Frames: ${frames.length}, Problems: ${comparisonProblems.length}`);
    }
    
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
      console.log(`   Problems: ${job.comparisonProblems.length}`);

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
    
    for (let i = 0; i < job.extractedFrames.length; i++) {
      const frame = job.extractedFrames[i];
      
      try {
        const poseResult = await extractPoseKeypoints(frame.imageData);
        
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

      // Update progress (0-20%)
      job.progress = Math.round((i / job.extractedFrames.length) * 20);

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
  };

  /**
   * Step 2: Match video frames to location images using SuperPoint + homography
   */
  const _matchImagesToFrames = async (job) => {
    console.log(`\n🖼️ Starting image matching (SuperPoint + LightGlue)...`);
    console.log(`   Frames: ${job.extractedFrames.length}`);
    console.log(`   Problems: ${job.comparisonProblems.length}`);
    
    job.status = 'matching';
    job.progress = 20;
    
    // Extract image URLs from comparison problems
    const imageUrls = job.comparisonProblems.map(problem => problem.imageUrl).filter(Boolean);
    
    if (imageUrls.length === 0) {
      throw new Error('No valid image URLs in comparison problems');
    }
    
    console.log(`   Comparing against ${imageUrls.length} location images...`);
    
    // Get the inference store for SuperPoint
    const inferenceStore = useInferenceStore();
    
    // Find frame with best pose (most confident keypoints)
    const framesWithPoses = job.extractedFrames.filter(f => f.poseData);
    if (framesWithPoses.length === 0) {
      throw new Error('No frames with pose data for matching');
    }
    
    // Use first frame with pose for now (could pick best based on pose confidence)
    const bestFrame = framesWithPoses[0];
    console.log(`   Using frame for matching (has pose data)`);
    
    // Run SuperPoint feature matching on all location images
    const matchResults = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      
      try {
        // Match features using SuperPoint + LightGlue
        const result = await inferenceStore.matchImages(
          bestFrame.url,  // Video frame
          imageUrl        // Location image
        );
        
        if (result && result.matchCount > 0) {
          matchResults.push({
            imageId: job.comparisonProblems[i].imageId,
            imageUrl,
            matchCount: result.matchCount,
            confidence: result.confidence || result.matchCount,
            keypoints0: result.keypoints0,
            keypoints1: result.keypoints1,
            matches: result.matches,
          });
          
          console.log(`   ✓ Image ${i + 1}/${imageUrls.length}: ${result.matchCount} matches`);
        } else {
          console.log(`   ✗ Image ${i + 1}/${imageUrls.length}: No matches`);
        }
      } catch (err) {
        console.error(`   ✗ Image ${i + 1}/${imageUrls.length}: Error - ${err.message}`);
      }
      
      job.progress = 20 + Math.round((i / imageUrls.length) * 20);
    }
    
    if (matchResults.length === 0) {
      throw new Error('No matching location images found');
    }
    
    // Sort by match count
    matchResults.sort((a, b) => b.matchCount - a.matchCount);
    const bestMatch = matchResults[0];
    
    console.log(`✅ Best match found: ${bestMatch.matchCount} feature matches`);
    console.log(`   Image ID: ${bestMatch.imageId}`);
    
    // Calculate homography matrix
    const homographyMatrix = calculateHomographyMatrix(
      bestMatch.keypoints0,
      bestMatch.keypoints1,
      bestMatch.matches
    );
    
    if (!homographyMatrix) {
      throw new Error('Failed to calculate homography matrix');
    }
    
    console.log(`✅ Homography matrix calculated`);
    
    job.matchedImageId = bestMatch.imageId;
    job.homographyMatrix = homographyMatrix;
    job.progress = 40;
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
    job.progress = 40;
    
    // Load AI holds
    let aiHolds = [];
    try {
      const holdData = await holdDetectionService.getHoldDetection(
        job.locationId,
        job.matchedImageId
      );
      
      if (holdData && holdData.holds) {
        aiHolds = holdData.holds;
        console.log(`   ✓ Loaded ${aiHolds.length} AI-detected holds`);
      }
    } catch (err) {
      console.warn(`   ⚠ Failed to load AI holds:`, err.message);
    }
    
    // Load manual holds
    let manualHolds = [];
    try {
      manualHolds = await manualHoldsService.loadManualHolds(
        job.locationId,
        job.matchedImageId
      );
      
      if (manualHolds && manualHolds.length > 0) {
        console.log(`   ✓ Loaded ${manualHolds.length} manual holds`);
      }
    } catch (err) {
      console.warn(`   ⚠ Failed to load manual holds:`, err.message);
    }
    
    job.holds = [...aiHolds, ...manualHolds];
    
    console.log(`✅ Total holds loaded: ${job.holds.length}`);
    
    if (job.holds.length === 0) {
      console.warn(`   ⚠ No holds found for image ${job.matchedImageId}`);
    }
    
    job.progress = 60;
  };

  /**
   * Step 4: Score problems by transforming poses to image coordinates
   */
  const _scoreProblems = async (job) => {
    console.log(`\n🎯 Starting problem scoring...`);
    console.log(`   Problems to score: ${job.comparisonProblems.length}`);
    console.log(`   Frames with poses: ${job.extractedFrames.filter(f => f.poseData).length}`);
    console.log(`   Available holds: ${job.holds.length}`);
    
    job.status = 'scoring';
    job.progress = 60;
    
    if (!job.homographyMatrix) {
      throw new Error('No homography matrix - cannot transform coordinates');
    }
    
    // Transform poses to image coordinates
    const transformedFrames = [];
    
    for (const frame of job.extractedFrames) {
      if (!frame.poseData) continue;
      
      const videoKeypoints = [];
      const keypointTypes = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'];
      
      for (const type of keypointTypes) {
        const kp = frame.poseData.keypoints[type];
        if (kp && kp.confidence > 0.3) {
          videoKeypoints.push([kp.x, kp.y]);
        }
      }
      
      if (videoKeypoints.length === 0) continue;
      
      const imageKeypoints = transformPoints(videoKeypoints, job.homographyMatrix);
      
      const transformedPose = {
        keypoints: {},
        confidence: frame.poseData.confidence
      };
      
      let kpIndex = 0;
      for (const type of keypointTypes) {
        const kp = frame.poseData.keypoints[type];
        if (kp && kp.confidence > 0.3 && kpIndex < imageKeypoints.length) {
          const [x, y] = imageKeypoints[kpIndex];
          transformedPose.keypoints[type] = { x, y, confidence: kp.confidence };
          kpIndex++;
        }
      }
      
      transformedFrames.push({
        ...frame,
        poseData: transformedPose
      });
    }
    
    console.log(`   ✓ Transformed ${transformedFrames.length} frames to image coordinates`);
    
    // Build problem-to-hold mapping
    const problemHoldMap = {};
    for (const problem of job.comparisonProblems) {
      if (problem.holds && Array.isArray(problem.holds)) {
        problemHoldMap[problem.id] = problem.holds;
      }
    }
    
    // Score problems
    const scores = calculateProblemScores(
      transformedFrames,
      job.comparisonProblems,
      job.holds,
      problemHoldMap
    );
    
    scores.sort((a, b) => b.totalScore - a.totalScore);
    
    console.log(`✅ Scoring complete!`);
    console.log(`   Top 3 matches:`);
    for (let i = 0; i < Math.min(3, scores.length); i++) {
      const s = scores[i];
      console.log(`   ${i + 1}. ${s.name}: ${(s.totalScore * 100).toFixed(1)}%`);
    }
    
    job.scores = scores;
    job.progress = 90;
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
  };
});
