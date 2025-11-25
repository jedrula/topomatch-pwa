import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ascentService } from '../services/ascentService.js';
import { extractPoseKeypoints } from '../utils/homographyUtils.js';

/**
 * Video Analysis Queue Store
 * 
 * Manages video analysis jobs independently of component lifecycle.
 * This allows analysis to continue even if the modal/component unmounts.
 * 
 * Responsibilities:
 * - Queue analysis jobs
 * - Track analysis progress/status
 * - Update ascents with results
 * - Provide observable state for UI
 * 
 * Note: Frame extraction requires DOM (video element, canvas) so it's 
 * still handled by utilities. This store orchestrates and tracks progress.
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
   * Add an analysis job to the queue
   * Component should call this with video file and comparison images
   * 
   * @param {string} ascentId - Pre-generated ascent ID
   * @param {File} videoFile - The video file to analyze
   * @param {string} locationId - Location ID
   * @param {Array} comparisonImages - Array of location images with boulder problems
   * @returns {string} Job ID for tracking
   */
  const addJob = (ascentId, videoFile, locationId, comparisonImages) => {
    const jobId = crypto.randomUUID();
    
    const job = {
      id: jobId,
      ascentId,
      locationId,
      videoFile,
      comparisonImages,
      
      status: 'queued',
      progress: 0,
      
      extractedFrames: [],
      matchResults: [],
      scores: null,
      
      error: null,
      createdAt: Date.now(),
      completedAt: null,
    };
    
    jobs.value[ascentId] = job;
    
    console.log(`📊 Analysis job queued: ${jobId} for ascent ${ascentId}`);
    
    return jobId;
  };

  /**
   * Set extracted frames and start processing
   * Called by component after frame extraction (DOM work)
   */
  const setFrames = async (ascentId, frames) => {
    const job = jobs.value[ascentId];
    if (!job) {
      console.warn(`Job ${ascentId} not found`);
      return;
    }
    
    job.extractedFrames = frames;
    job.status = 'extracting-complete';
    
    console.log(`📊 Frames received for ascent ${ascentId}, starting analysis...`);
    
    // Start processing pipeline
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
   * Internal: Process analysis job
   * Runs pose detection, image matching, scoring, and ascent updates
   */
  const _processJob = async (ascentId) => {
    const job = jobs.value[ascentId];
    if (!job) return;

    try {
      // Step 1: Pose Detection
      job.status = 'detecting';
      job.progress = 0;
      console.log(`🔍 Starting pose detection for ${job.extractedFrames.length} frames...`);

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

        // Update progress (0-33% for pose detection)
        job.progress = Math.round((i / job.extractedFrames.length) * 33);

        // Small delay between frames for mobile devices
        if (i < job.extractedFrames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successfulDetections = job.extractedFrames.filter(f => f.poseData).length;
      console.log(`✅ Pose detection complete: ${successfulDetections}/${job.extractedFrames.length} frames`);

      // Step 2: Image Matching & Scoring (33-100%)
      // This will be handled by the component's existing logic for now
      // We'll migrate this in a follow-up step
      job.status = 'matching';
      job.progress = 50;
      
      console.log(`🎯 Pose detection complete, waiting for matching results...`);
      // Note: Component will call _updateAscentWithResults when scoring completes

    } catch (error) {
      console.error(`❌ Error processing job ${ascentId}:`, error);
      job.status = 'error';
      job.error = error.message;
    }
  };

  /**
   * Internal: Update ascent with analysis results
   */
  const _updateAscentWithResults = async (ascentId, scores) => {
    const job = jobs.value[ascentId];
    if (!job) return;

    try {
      const winner = scores[0]; // Best matching problem
      console.log(`🎯 Updating ascent ${ascentId} with analysis results...`);
      console.log(`   Winner: ${winner.name} (${(winner.totalScore * 100).toFixed(1)}%)`);

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
          allScores: scores.slice(0, 3).map(s => ({
            problemId: s.id,
            name: s.name,
            score: s.totalScore
          }))
        }
      };

      // Update using ascentService
      await ascentService.updateAscent(ascentId, updateData);

      console.log(`✅ Ascent updated with analysis results`);
      if (winner.totalScore > 0.5) {
        console.log(`   Problem detected: ${winner.name} (${(winner.totalScore * 100).toFixed(1)}%)`);
      } else {
        console.log(`   No confident problem match (score < 50%)`);
      }
      console.log(`   Video status managed by upload queue (uploading → transcoding → ready)`);

      // Mark job as completed
      job.completedAt = Date.now();

    } catch (error) {
      console.error('❌ Failed to update ascent with analysis results:', error);
      job.error = error.message;
    }
  };

  /**
   * Complete analysis with scores (called by component after scoring)
   */
  const completeAnalysis = async (ascentId, scores) => {
    const job = jobs.value[ascentId];
    if (!job) {
      console.warn(`Job ${ascentId} not found`);
      return;
    }

    job.scores = scores;
    job.progress = 100;
    job.status = 'complete';
    job.completedAt = Date.now();

    console.log(`✅ Analysis complete for ascent ${ascentId}`);

    // Update ascent in Firestore
    await _updateAscentWithResults(ascentId, scores);
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
    addJob,
    setFrames,
    completeAnalysis,
    updateJobStatus,
    getJob,
    cancelJob,
    clearAll,
  };
});
