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

    // Analyze holds using homography and boulder problem data

    let holdAnalysisResult = null;
    try {
      holdAnalysisResult = await runHoldAnalysis(
        frameResults,
        analysisData.match?.homographyMatrix,
        analysisData.match
      );

      if (holdAnalysisResult?.bestMatch) {
        analysisPhase.value = 'complete';

        // Store data for potential redirect but don't redirect automatically
        pendingRedirectData.value = {
          analysisData,
          problem: holdAnalysisResult.bestMatch.problem,
        };
      } else if (holdAnalysisResult) {
        analysisPhase.value = 'complete';
      } else {
        console.log('❌ Hold analysis failed to return results');
        analysisPhase.value = 'hold-analysis-failed';
      }
    } catch (error) {
      console.error('❌ Hold analysis error:', error);
      analysisPhase.value = 'hold-analysis-error';
    }

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

  // Handle manual continue after analysis review
  const continueToUpload = async () => {
    if (!pendingRedirectData.value) {
      console.error('No pending redirect data available');
      return;
    }

    const { analysisData, problem } = pendingRedirectData.value;
    await redirectToProblemPageWithVideo(analysisData, problem);
  };

  // Run hold analysis - compare poses with boulder problems
  const runHoldAnalysis = async (frameResults, homographyMatrix, matchedImage) => {
    if (!homographyMatrix) {
      return {
        error: 'No homography matrix available',
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }

    try {
      // Get boulder problems for the matched image only
      let problemsForLocation;

      if (matchedImage?.id) {
        // Filter to only boulder problems that exist on the matched image
        problemsForLocation = boulderProblemsStore.sortedProblems.filter(
          (problem) => problem.locationId === route.params.id && problem.imageId === matchedImage.id
        );
      } else {
        // Fallback: use all problems for the location (old behavior)
        problemsForLocation = boulderProblemsStore.sortedProblems.filter(
          (problem) => problem.locationId === route.params.id
        );
      }

      if (problemsForLocation.length === 0) {
        return {
          error: 'No boulder problems found for this location',
          bestMatch: null,
          allScores: [],
          transformedFrames: [],
        };
      }

      // Transform pose keypoints to boulder image space
      const transformedFrames = [];

      for (const frameResult of frameResults) {
        if (!frameResult.poses || frameResult.poses.length === 0) {
          continue;
        }

        // Use the first pose from the frame
        const firstPose = frameResult.poses[0];

        if (!firstPose.keypoints) {
          continue;
        }

        // Extract relevant keypoints for climbing analysis (wrists and ankles)
        const climbingKeypoints = [
          { type: 'leftWrist', point: firstPose.keypoints[9] },
          { type: 'rightWrist', point: firstPose.keypoints[10] },
          { type: 'leftAnkle', point: firstPose.keypoints[15] },
          { type: 'rightAnkle', point: firstPose.keypoints[16] },
        ].filter((kp) => {
          // Lower confidence threshold to be more inclusive
          const hasPoint = kp.point && kp.point.confidence > 0.3;
          return hasPoint;
        });


        // Skip frame if we don't have enough valid keypoints
        if (climbingKeypoints.length < 2) {
          continue;
        }

        // Transform each keypoint to boulder image coordinates using homography
        const transformedKeypoints = [];

        for (const keypoint of climbingKeypoints) {
          const transformed = transformPoint(keypoint.point.x, keypoint.point.y, homographyMatrix);

          if (transformed) {
            transformedKeypoints.push({
              type: keypoint.type,
              x: transformed.x,
              y: transformed.y,
              confidence: keypoint.point.confidence,
            });
          } else {
            console.log(`❌ Failed to transform ${keypoint.type}`);
          }
        }

        if (transformedKeypoints.length > 0) {
          transformedFrames.push({
            frameIndex: frameResult.frameIndex,
            timePercent: frameResult.frame.timePercent,
            keypoints: transformedKeypoints,
          });
        }
      }


      if (transformedFrames.length === 0) {
        return {
          error: 'No valid poses found for analysis',
          bestMatch: null,
          allScores: [],
          transformedFrames: [],
        };
      }

      // Score each boulder problem based on hold proximity
      const problemScores = [];

      for (const problem of problemsForLocation) {
        const score = calculateProblemScoreSimple(problem, transformedFrames);

        // Include ALL problems in the results, not just those with score > 0
        problemScores.push({
          problem,
          score,
          confidence: Math.min(score, 1.0), // Cap at 1.0
        });

        if (score > 0) {
        } else {
        }
      }

      // Sort by score (highest first)
      problemScores.sort((a, b) => b.score - a.score);

      const result = {
        bestMatch: problemScores[0] || null,
        allScores: problemScores,
        transformedFrames,
        debugInfo: {
          totalProblems: problemsForLocation.length,
          validFrames: transformedFrames.length,
          totalScores: problemScores.length,
        },
      };

      return result;
    } catch (error) {
      console.error('❌ Hold analysis error:', error);
      return {
        error: error.message,
        bestMatch: null,
        allScores: [],
        transformedFrames: [],
      };
    }
  };

  // Calculate how well pose keypoints match with problem holds
  const calculateProblemScoreSimple = (problem, transformedFrames) => {
    
    if (!problem.holds || problem.holds.length === 0) {
      return 0;
    }

    let totalScore = 0;
    const proximityThreshold = 300;
    const problemMatches = [];

    // For each transformed frame, check proximity to holds  
    for (const frame of transformedFrames) {

      for (const keypoint of frame.keypoints) {
        // Skip very low-confidence keypoints
        if (keypoint.confidence < 0.2) {
          continue;
        }

        // Get hold center positions from the problem
        const holdDistances = problem.holds
          .map((holdData, index) => {
            const hold = holdData.hold;
            let x, y;

            // Extract coordinates
            if (hold.coordinates) {
              x = hold.coordinates.x + (hold.coordinates.width || 0) / 2;
              y = hold.coordinates.y + (hold.coordinates.height || 0) / 2;
            } else if (hold.bbox && Array.isArray(hold.bbox)) {
              x = hold.bbox[0] + hold.bbox[2] / 2;
              y = hold.bbox[1] + hold.bbox[3] / 2;
            } else if (hold.x !== undefined && hold.y !== undefined) {
              x = hold.x + (hold.width || 0) / 2;
              y = hold.y + (hold.height || 0) / 2;
            } else if (hold.center_x !== undefined && hold.center_y !== undefined) {
              x = hold.center_x;
              y = hold.center_y;
            } else {
              console.warn('Unknown hold coordinate format:', hold);
              return null;
            }

            const distance = Math.sqrt(
              Math.pow(keypoint.x - x, 2) + Math.pow(keypoint.y - y, 2)
            );

            // Calculate score
            const score = distance <= proximityThreshold ? 
              (proximityThreshold - distance) / proximityThreshold : 0;

            return {
              holdIndex: holdData.holdIndex || index,
              distance: Math.round(distance),
              score: score
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);

        // Get the best scoring hold for this keypoint
        const bestHold = holdDistances[0];
        if (bestHold && bestHold.score > 0) {
          totalScore += bestHold.score;
          problemMatches.push({
            keypoint: keypoint.type,
            frame: frame.frameIndex,
            holdIndex: bestHold.holdIndex,
            distance: bestHold.distance,
            score: bestHold.score
          });
        }
      }
    }

    return totalScore;
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
    handleBetaProcessingError,
    handleBetaVideoCleared,
    handleTryAnotherVideo,
    resetAnalysisState,
    continueToUpload,
    runHoldAnalysis,
    calculateProblemScoreSimple,
    redirectToProblemPageWithVideo
  };
}
