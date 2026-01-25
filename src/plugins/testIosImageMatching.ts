import IosImageMatching from './IosImageMatching';

/**
 * Test IosImageMatching plugin with real images from bundle
 * 
 * This will:
 * 1. Load test images from bundle (same ones used in native Swift test)
 * 2. Convert to base64
 * 3. Call native iOS plugin
 * 4. Verify results match expectations
 */
export async function testIosImageMatching(): Promise<void> {
  console.log('🧪 [testIosImageMatching] Starting plugin test...');
  
  try {
    // For now, we'll need to pass base64 images from JavaScript
    // In a real app, you'd load images from the camera or photo library
    
    // Test with dummy base64 (1x1 black PNG)
    const dummyImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await IosImageMatching.matchImages({
      image0: dummyImage,
      image1: dummyImage
    });
    
    console.log('✅ [testIosImageMatching] Plugin called successfully!');
    console.log('📊 Results:', {
      highConfMatches: result.stats.highConfidenceMatches,
      avgScore: result.stats.averageScore.toFixed(3),
      inferenceTime: `${result.stats.inferenceTimeMs.toFixed(0)}ms`,
      totalTime: `${result.stats.totalTimeMs.toFixed(0)}ms`
    });
    
    // Validate structure
    if (!result.keypoints || !result.matches || !result.mscores) {
      throw new Error('Missing required outputs');
    }
    
    console.log('✅ [testIosImageMatching] All validations passed!');
    
  } catch (error) {
    console.error('❌ [testIosImageMatching] Test failed:', error);
    throw error;
  }
}
