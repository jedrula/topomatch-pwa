import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoulderProblemsStore } from '../stores/boulderProblemsStore.js';
import { getGradeLabel, getGradeColor } from '../utils/gradingUtils.js';
import { transformPoint } from '../utils/homographyUtils.js';

export function useVideoAnalysis() {
  const route = useRoute();
  const router = useRouter();
  const boulderProblemsStore = useBoulderProblemsStore();

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
    // Reset previous results and start matching phase
    videoAnalysisResult.value = null;
    extractedFrame.value = null;
    matchedBoulderImage.value = null;
    allFrames.value = [];
    poseResults.value = [];
    isAnalyzing.value = true;
    analysisPhase.value = 'matching';
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

  // Handle video cleared
  const handleBetaVideoCleared = () => {
    resetAnalysisState();
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
    console.log('📊 TABLE SCORES RECEIVED in useVideoAnalysis:', tableScoresData);
    
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
      
      console.log('✅ UPDATED WINNER from table scores:', formattedScores[0].problem.name);
    }
  };

  // Handle manual continue after analysis review
  const continueToUpload = async () => {
    if (!pendingRedirectData.value) {
      console.error('No pending redirect data available');
      return;
    }

    const { analysisData, problem } = pendingRedirectData.value;
    await redirectToProblemPageWithVideo(analysisData, problem);
  };

  // Redirect to problem page with video data
  const redirectToProblemPageWithVideo = async (analysisData, problem) => {
    try {
      // Store enhanced data for visual confirmation in sessionStorage
      const minimalData = {
        videoFile: {
          name: analysisData.video.name,
          size: analysisData.video.size,
          type: analysisData.video.type,
        },
        analysisResult: {
          matchFound: !!analysisData.match,
          matchedProblemId: problem.id,
          matchedProblemName: problem.name,
          matchedProblem: {
            id: problem.id,
            name: problem.name,
            grade: problem.grade,
            description: problem.description,
            color: problem.color,
            holds: problem.holds,
          },
          matchedImage: analysisData.match
            ? {
                id: analysisData.match.id,
                url: analysisData.match.url,
                name: analysisData.match.name,
                width: analysisData.match.width,
                height: analysisData.match.height,
              }
            : null,
          confidence: 0.95,
          keypoints:
            videoAnalysisResult.value?.poseResults?.filter((r) => r.poses.length > 0).length || 0,
          timestamp: Date.now(),
        },
      };

      sessionStorage.setItem('prefilledVideoData', JSON.stringify(minimalData));
    } catch (storageError) {
      console.warn('⚠️ Could not store data in sessionStorage:', storageError);
    }

    // Store the actual File object
    window.tempVideoFile = analysisData.video;

    // Navigate to the problem page
    await router.push({
      name: 'boulder-problem-detail',
      params: {
        locationId: route.params.locationId || route.params.id,
        problemId: problem.id,
      },
      query: {
        action: 'log-ascent',
        hasPrefilledVideo: 'true',
      },
    });
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
    handleBetaVideoCleared,
    handleTryAnotherVideo,
    resetAnalysisState,
    continueToUpload,
    redirectToProblemPageWithVideo
  };
}
