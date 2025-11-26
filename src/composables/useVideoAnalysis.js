import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoulderProblemsStore } from '../stores/boulderProblemsStore.js';
import { useVideoUploadQueueStore } from '../stores/videoUploadQueueStore.js';
import { getGradeLabel, getGradeColor } from '../utils/gradingUtils.js';
import { transformPoint } from '../utils/homographyUtils.js';

export function useVideoAnalysis() {
  const route = useRoute();
  const router = useRouter();
  const boulderProblemsStore = useBoulderProblemsStore();
  const videoUploadQueue = useVideoUploadQueueStore();

  // Video analysis state
  const videoAnalysisResult = ref(null);
  const extractedFrame = ref(null);
  const isAnalyzing = ref(false);
  const matchedBoulderImage = ref(null);
  const allFrames = ref([]);
  const poseResults = ref([]);
  const analysisPhase = ref('');
  const pendingRedirectData = ref(null);

  // Handle beta video selection
  const handleBetaVideoSelected = (videoFile) => {
    console.log('🔥 useVideoAnalysis.handleBetaVideoSelected called with:', videoFile);
    // Reset previous results and start matching phase
    videoAnalysisResult.value = null;
    extractedFrame.value = null;
    matchedBoulderImage.value = null;
    allFrames.value = [];
    poseResults.value = [];
    isAnalyzing.value = true;
    analysisPhase.value = 'matching';
    console.log('✅ useVideoAnalysis state updated, isAnalyzing:', isAnalyzing.value);
  };

  // Handle complete beta analysis
  const handleBetaAnalysisComplete = async (analysisData) => {

    if (!analysisData.match) {
      videoAnalysisResult.value = {
        success: false,
        error: true,
        message: 'No matching boulder found in the uploaded video.',
      };
      isAnalyzing.value = false;
      return;
    }

    // Store basic results
    matchedBoulderImage.value = analysisData.match;
    allFrames.value = analysisData.frames || [];
    extractedFrame.value = analysisData.frames?.[1] || null;

    // Convert Enhanced component frame data to expected format
    const frameResults = [];
    if (analysisData.frames) {
      for (let i = 0; i < analysisData.frames.length; i++) {
        const frame = analysisData.frames[i];

        if (frame.poseData && frame.poseData.keypoints) {
          // Convert Enhanced component keypoints format to array format expected by hold analysis
          const keypoints = [];

          // Initialize array with 17 keypoints (COCO format)
          for (let j = 0; j < 17; j++) {
            keypoints[j] = { x: 0, y: 0, confidence: 0 };
          }

          // Map the Enhanced component keypoints to COCO pose format
          if (frame.poseData.keypoints.leftWrist) {
            keypoints[9] = frame.poseData.keypoints.leftWrist;
          }
          if (frame.poseData.keypoints.rightWrist) {
            keypoints[10] = frame.poseData.keypoints.rightWrist;
          }
          if (frame.poseData.keypoints.leftAnkle) {
            keypoints[15] = frame.poseData.keypoints.leftAnkle;
          }
          if (frame.poseData.keypoints.rightAnkle) {
            keypoints[16] = frame.poseData.keypoints.rightAnkle;
          }

          frameResults.push({
            frameIndex: i,
            frame: frame,
            poses: [
              {
                keypoints: keypoints,
                confidence: frame.poseData.confidence || 1.0,
              },
            ],
          });
        } else {
          frameResults.push({
            frameIndex: i,
            frame: frame,
            poses: [],
          });
        }
      }
    }

    poseResults.value = frameResults;
    analysisPhase.value = 'analyzing-holds';

    // ✅ SIMPLIFIED: Don't calculate scores here - wait for table scores from VideoFrameMatcherEnhanced
    // The table uses the same shared utility (calculateProblemScores) and will emit results via 'table-scores-ready'
    // This avoids duplicate calculation and ensures single source of truth
    
    // Set initial placeholder - will be replaced by table scores
    const holdAnalysisResult = {
      bestMatch: null,
      allScores: [],
      transformedFrames: [],
      debugInfo: {
        note: 'Waiting for table scores from VideoFrameMatcherEnhanced'
      }
    };

    analysisPhase.value = 'complete';

    // Store complete result
    videoAnalysisResult.value = {
      success: true,
      match: analysisData.match,
      frame: analysisData.frames?.[1] || null,
      video: analysisData.video,
      allFrames: analysisData.frames || [],
      poseResults: frameResults,
      holdAnalysis: holdAnalysisResult,
      phase: analysisPhase.value,
    };

    isAnalyzing.value = false;
  };

  // Handle processing errors
  const handleBetaProcessingError = (error) => {
    console.error('Beta processing error:', error);
    isAnalyzing.value = false;
    videoAnalysisResult.value = {
      success: false,
      error: true,
      message: 'Error processing video: ' + error.message,
    };
  };

  // Handle "Try Another Video" action
  const handleTryAnotherVideo = () => {
    resetAnalysisState();
  };

  // Reset all analysis state
  const resetAnalysisState = () => {
    videoAnalysisResult.value = null;
    extractedFrame.value = null;
    isAnalyzing.value = false;
    matchedBoulderImage.value = null;
    allFrames.value = [];
    poseResults.value = [];
    analysisPhase.value = '';
    pendingRedirectData.value = null;
  };

  // ✅ Handle table scores from VideoFrameMatcherEnhanced (CORRECT scoring)
  // This replaces the buggy holdAnalysis results with the table-based scores
  const handleTableScoresReady = (tableScoresData) => {
    if (!videoAnalysisResult.value || !tableScoresData.scores || tableScoresData.scores.length === 0) {
      return;
    }

    // Convert table scores to the format expected by the UI
    const winner = tableScoresData.winner;
    const allScores = tableScoresData.scores;
    
    // Create proper score objects for display
    const formattedScores = allScores.map(scoreData => {
      // Find the full problem object
      const problem = tableScoresData.allProblems?.find(p => p.id === scoreData.id);
      
      return {
        problem: problem || { id: scoreData.id, name: scoreData.name },
        score: scoreData.totalScore, // Raw score (e.g., 7.499)
        confidence: Math.min(scoreData.totalScore, 1.0),
        // Additional metadata
        uniqueHoldsMatched: scoreData.uniqueHoldsCount,
        matchCount: scoreData.matchCount,
        averageScorePerHold: parseFloat(scoreData.averageScore)
      };
    });

    // ✅ REPLACE the buggy holdAnalysis with correct table scores
    videoAnalysisResult.value.holdAnalysis = {
      bestMatch: formattedScores[0], // Winner
      allScores: formattedScores, // All problems sorted
      transformedFrames: videoAnalysisResult.value.holdAnalysis?.transformedFrames || []
    };

    // Update pending redirect data with the CORRECT winner
    if (formattedScores[0]) {
      pendingRedirectData.value = {
        analysisData: {
          match: videoAnalysisResult.value.match,
          frames: videoAnalysisResult.value.allFrames,
          video: videoAnalysisResult.value.video
        },
        problem: formattedScores[0].problem
      };
    }
  };

  // Handle manual continue after analysis review
  const continueToUpload = async () => {
    if (!pendingRedirectData.value) {
      console.error('No pending redirect data available');
      return;
    }

    const { problem } = pendingRedirectData.value;
    await redirectToProblemPage(problem);
  };

  // Redirect to problem page after analysis
  const redirectToProblemPage = async (problem) => {
    const locationId = route.params.locationId || route.params.id;

    // Just navigate to the problem page
    // Video upload and ascent creation happen in handleAscentFormSubmit
    await router.push({
      name: 'boulder-problem-detail',
      params: {
        locationId,
        problemId: problem.id,
      },
    });
  };

  // Handle ascent form submission from the video upload flow
  const handleAscentFormSubmit = async (submitData) => {
    try {
      // The submitData contains:
      // - formData: { attemptType, userGrade, notes, date }
      // - video: the uploaded video file
      // - detectedProblem: { id, name, grade } (required)
      // - analysisScores: array of all problem scores
      // - bestMatch: the matched image data
      
      if (!submitData.detectedProblem) {
        console.error('No problem detected - cannot create ascent');
        return;
      }
      
      // Find the full problem object
      const problem = boulderProblemsStore.boulderProblems.find(
        (p) => p.id === submitData.detectedProblem.id
      );
      
      if (!problem) {
        console.error('Could not find problem in store');
        return;
      }
      
      // Import required services
      const { useAscentStore } = await import('../stores/ascentStore.js');
      const { generateAscentId } = await import('../services/ascentService.js');
      const ascentStore = useAscentStore();
      const locationId = route.params.locationId || route.params.id;
      
      // CRITICAL: Generate ascent ID on client FIRST
      const ascentId = generateAscentId();
      
      // Initialize ascent store
      ascentStore.initializeForProblem(locationId, problem.id);
      
      // Start video upload
      videoUploadQueue.startUpload(
        submitData.video,
        locationId,
        problem.id,
        ascentId
      );
      
      // Prepare ascent data
      const ascentData = {
        attemptType: submitData.formData.attemptType,
        userGrade: submitData.formData.userGrade || undefined,
        notes: submitData.formData.notes || undefined,
        date: new Date(submitData.formData.date),
        problemSnapshot: {
          name: problem.name,
          grade: problem.grade,
          color: problem.color,
        },
      };
      
      // Create the ascent immediately
      await ascentStore.logAscent(ascentData, ascentId);
      
      // Return problem info for parent to handle (toast, navigation, etc.)
      return {
        success: true,
        problem,
        locationId,
        ascentId
      };
      
    } catch (error) {
      console.error('Error handling ascent form submission:', error);
      // Show error to user (could emit an event here)
      return {
        success: false,
        error
      };
    }
  };

  return {
    // State
    videoAnalysisResult,
    extractedFrame,
    isAnalyzing,
    matchedBoulderImage,
    allFrames,
    poseResults,
    analysisPhase,
    pendingRedirectData,
    
    // Methods
    handleBetaVideoSelected,
    handleBetaAnalysisComplete,
    handleTableScoresReady, // ✅ Handle table-based scores (single source of truth)
    handleBetaProcessingError,
    handleTryAnotherVideo,
    handleAscentFormSubmit, // ✅ NEW: Handle ascent form submission
    resetAnalysisState,
    continueToUpload,
  };
}
