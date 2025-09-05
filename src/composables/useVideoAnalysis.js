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
    console.log('Beta video selected:', videoFile.name);
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
    console.log('🎉 Enhanced analysis complete:', analysisData);

    if (!analysisData.match) {
      console.log('❌ No match found in analysis');
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

        console.log(`🔍 Processing frame ${i}:`, {
          hasPoseData: !!frame.poseData,
          poseDataStructure: frame.poseData ? Object.keys(frame.poseData) : 'none',
        });

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

          console.log(`✅ Frame ${i} converted with keypoints:`, {
            leftWrist: keypoints[9],
            rightWrist: keypoints[10],
            leftAnkle: keypoints[15],
            rightAnkle: keypoints[16],
          });
        } else {
          console.log(`⚠️ Frame ${i} has no valid pose data`);
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
    console.log('🧗 Analyzing hold usage...');
    console.log('🔗 Homography matrix available:', !!analysisData.match?.homographyMatrix);

    let holdAnalysisResult = null;
    try {
      holdAnalysisResult = await runHoldAnalysis(
        frameResults,
        analysisData.match?.homographyMatrix,
        analysisData.match
      );

      if (holdAnalysisResult?.bestMatch) {
        console.log('🎯 Best matching problem:', holdAnalysisResult.bestMatch.problem.name);
        analysisPhase.value = 'complete';

        // Store data for potential redirect but don't redirect automatically
        pendingRedirectData.value = {
          analysisData,
          problem: holdAnalysisResult.bestMatch.problem,
        };
      } else if (holdAnalysisResult) {
        console.log('⚠️ Hold analysis completed but no matches found');
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
    console.log('✅ Complete video analysis finished!');
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
    console.log('Beta video cleared');
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
    console.log('🎯 Phase 4: Starting hold analysis...');
    console.log('📊 Input data:', {
      frameResultsLength: frameResults?.length || 0,
      hasHomography: !!homographyMatrix,
      locationId: route.params.id,
      matchedImageId: matchedImage?.id,
      matchedImageName: matchedImage?.name,
    });

    if (!homographyMatrix) {
      console.log('⚠️ No homography matrix available for hold analysis');
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
        console.log(
          `🔍 Found ${problemsForLocation.length} boulder problems for matched image "${matchedImage.name}" (ID: ${matchedImage.id})`
        );
      } else {
        // Fallback: use all problems for the location (old behavior)
        problemsForLocation = boulderProblemsStore.sortedProblems.filter(
          (problem) => problem.locationId === route.params.id
        );
        console.log(
          `⚠️ No matched image ID available, using all ${problemsForLocation.length} boulder problems for location ${route.params.id}`
        );
      }

      if (problemsForLocation.length === 0) {
        console.log('ℹ️ No boulder problems found for this location');
        return {
          error: 'No boulder problems found for this location',
          bestMatch: null,
          allScores: [],
          transformedFrames: [],
        };
      }

      console.log(
        '🏔️ Boulder problems:',
        problemsForLocation.map((p) => ({
          id: p.id,
          name: p.name,
          nameType: typeof p.name,
          nameLength: p.name?.length,
          grade: p.grade,
          holdsCount: p.holds?.length || 0,
          allKeys: Object.keys(p).slice(0, 10), // Show first 10 keys to avoid huge logs
        }))
      );

      // Transform pose keypoints to boulder image space
      const transformedFrames = [];

      for (const frameResult of frameResults) {
        console.log(`🔍 Processing frame ${frameResult.frameIndex}:`, {
          hasPoses: !!(frameResult.poses && frameResult.poses.length > 0),
          posesCount: frameResult.poses?.length || 0,
        });

        if (!frameResult.poses || frameResult.poses.length === 0) {
          console.log(`⚠️ Frame ${frameResult.frameIndex} has no poses`);
          continue;
        }

        // Use the first pose from the frame
        const firstPose = frameResult.poses[0];
        console.log(`👤 First pose keypoints:`, {
          hasKeypoints: !!firstPose.keypoints,
          keypointsLength: firstPose.keypoints?.length || 0,
          confidence: firstPose.confidence,
        });

        if (!firstPose.keypoints) {
          console.log(`⚠️ Frame ${frameResult.frameIndex} pose has no keypoints`);
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
          if (!hasPoint) {
            console.log(
              `❌ ${kp.type} keypoint missing or low confidence:`,
              kp.point?.confidence || 'undefined'
            );
          }
          return hasPoint;
        });

        console.log(`📊 Frame ${frameResult.frameIndex} keypoint summary:`, {
          totalKeypoints: firstPose.keypoints?.length || 0,
          validClimbingKeypoints: climbingKeypoints.length,
          requiredMinimum: 2,
        });

        // Skip frame if we don't have enough valid keypoints
        if (climbingKeypoints.length < 2) {
          console.log(
            `⚠️ Frame ${frameResult.frameIndex} skipped: insufficient valid keypoints (${climbingKeypoints.length}/2 minimum)`
          );
          continue;
        }

        console.log(
          `🎯 Frame ${frameResult.frameIndex} valid keypoints:`,
          climbingKeypoints.map((kp) => ({
            type: kp.type,
            x: kp.point.x,
            y: kp.point.y,
            confidence: kp.point.confidence,
          }))
        );

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
            console.log(
              `✅ Transformed ${keypoint.type}: (${keypoint.point.x}, ${
                keypoint.point.y
              }) → (${transformed.x.toFixed(1)}, ${transformed.y.toFixed(1)})`
            );
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

      console.log(`✅ Transformed ${transformedFrames.length} frames with valid poses`);

      if (transformedFrames.length === 0) {
        console.log('⚠️ No valid poses to analyze');
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
        console.log(`🔍 Scoring problem "${problem.name}" with ${problem.holds?.length || 0} holds`);
        const score = calculateProblemScoreSimple(problem, transformedFrames);

        // Include ALL problems in the results, not just those with score > 0
        problemScores.push({
          problem,
          score,
          confidence: Math.min(score, 1.0), // Cap at 1.0
        });

        if (score > 0) {
          console.log(`✅ Problem "${problem.name}" scored: ${score.toFixed(3)}`);
        } else {
          console.log(`❌ Problem "${problem.name}" scored: 0 (no matches)`);
        }
      }

      // Sort by score (highest first)
      problemScores.sort((a, b) => b.score - a.score);

      console.log(
        '🏆 Final problem scores:',
        problemScores.map((p) => ({
          name: p.problem.name,
          score: p.score.toFixed(3),
          confidence: `${Math.round(p.confidence * 100)}%`,
        }))
      );

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

      console.log('🎯 Hold analysis complete:', {
        hasBestMatch: !!result.bestMatch,
        bestMatchName: result.bestMatch?.problem?.name,
        totalCandidates: result.allScores.length,
      });

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
    console.log(`🎯 Scoring problem "${problem.name}" with ${problem.holds?.length || 0} holds`);
    
    if (!problem.holds || problem.holds.length === 0) {
      console.log(`❌ Problem "${problem.name}" has no holds defined`);
      return 0;
    }

    let totalScore = 0;
    const proximityThreshold = 300;
    const problemMatches = [];

    // For each transformed frame, check proximity to holds  
    for (const frame of transformedFrames) {
      console.log(`🎯 Analyzing frame ${frame.frameIndex} with ${frame.keypoints.length} keypoints`);

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

          console.log(
            `✅ ${keypoint.type} (frame ${frame.frameIndex}) matches hold #${bestHold.holdIndex} ` +
            `(${bestHold.distance}px, score: ${bestHold.score.toFixed(3)})`
          );
        }
      }
    }

    console.log(`📊 Problem "${problem.name}" total score: ${totalScore.toFixed(3)} from ${problemMatches.length} matches`);
    return totalScore;
  };

  // Redirect to problem page with video data
  const redirectToProblemPageWithVideo = async (analysisData, problem) => {
    console.log('🚀 Redirecting to problem page with video data:', {
      problemId: problem.id,
      problemName: problem.name,
      hasVideo: !!analysisData.video,
      hasFrames: !!(analysisData.frames && analysisData.frames.length > 0),
    });

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
      console.log('📁 Stored minimal data in sessionStorage:', minimalData);
    } catch (storageError) {
      console.warn('⚠️ Could not store data in sessionStorage:', storageError);
    }

    // Store the actual File object
    window.tempVideoFile = analysisData.video;
    console.log('📁 Stored video file in window.tempVideoFile');

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
