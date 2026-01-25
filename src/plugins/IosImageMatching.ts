import { registerPlugin } from '@capacitor/core';

export interface IosImageMatchingPlugin {
  /**
   * Match two images using SuperPoint + LightGlue on iOS
   * 
   * @param options.image0 - Base64 encoded first image (JPEG/PNG)
   * @param options.image1 - Base64 encoded second image (JPEG/PNG)
   * @returns Match results with keypoints, matches, and scores
   */
  matchImages(options: { 
    image0: string; 
    image1: string; 
  }): Promise<ImageMatchResult>;
}

export interface ImageMatchResult {
  /** Keypoints array [2, N, 2] - N keypoints per image with x,y coords */
  keypoints: number[];
  /** Matches array - indices of matched keypoints */
  matches: number[];
  /** Match confidence scores [0-1] */
  mscores: number[];
  /** Shape of keypoints output */
  keypointsShape: number[];
  /** Shape of matches output */
  matchesShape: number[];
  /** Performance and quality statistics */
  stats: {
    highConfidenceMatches: number;
    averageScore: number;
    preprocessTimeMs: number;
    inferenceTimeMs: number;
    totalTimeMs: number;
  };
}

const IosImageMatching = registerPlugin<IosImageMatchingPlugin>('IosImageMatching', {
  web: () => {
    throw new Error('IosImageMatching is only available on iOS');
  },
});

export default IosImageMatching;
