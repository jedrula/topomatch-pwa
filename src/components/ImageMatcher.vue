<template>
  <div class="image-matcher-component">
    <!-- Analysis Status -->
    <div v-if="isAnalyzing" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        <div class="flex-1">
          <p class="text-sm font-medium text-blue-900">{{ analysisStatus }}</p>
          <div class="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${analysisProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-blue-700 mt-1">
            {{ currentImageIndex }}/{{ totalImages }} images analyzed
          </p>
        </div>
      </div>
    </div>

    <!-- No Match Found -->
    <div
      v-else-if="analysisComplete && !bestMatch"
      class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg
            class="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-yellow-900">No Clear Match</h4>
          <p class="text-sm text-yellow-700 mt-1">
            No strong match found among the comparison images. You may need to select manually.
          </p>
        </div>
      </div>
    </div>

    <!-- Match Found (Success) -->
    <div
      v-else-if="analysisComplete && bestMatch"
      class="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-green-900">Match Found!</h4>
          <p class="text-sm text-green-700 mt-1">
            {{ bestMatch.name || 'Problem identified' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-medium text-red-900">Analysis Failed</h4>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Manual Trigger Button -->
    <div
      v-if="!isAnalyzing && !analysisComplete && sourceImage && comparisonImages.length > 0"
      class="text-center"
    >
      <button
        type="button"
        @click="startAnalysis"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Image Analysis
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStore';
import { calculateHomographyMatrix } from '@/utils/homographyUtils';

const props = defineProps({
  sourceImage: {
    type: [File, String], // Can be File object or URL string
    default: null,
  },
  comparisonImages: {
    type: Array, // Array of {id, url, name} objects
    default: () => [],
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['match-found', 'analysis-complete', 'analysis-error', 'analysis-start']);

// Get inference store for image analysis
const inferenceStore = useInferenceStore();

// Reactive state
const isAnalyzing = ref(false);
const analysisComplete = ref(false);
const analysisStartTime = ref(null);
const analysisTotalTime = ref(null);
const analysisStatus = ref('');
const currentImageIndex = ref(0);
const totalImages = ref(0);
const bestMatch = ref(null);
const error = ref(null);
const sourceImageUrl = ref(null);

// Computed
const analysisProgress = computed(() => {
  if (totalImages.value === 0) return 0;
  return Math.round((currentImageIndex.value / totalImages.value) * 100);
});

// Methods
const resetAnalysis = () => {
  isAnalyzing.value = false;
  analysisComplete.value = false;
  analysisStartTime.value = null;
  analysisTotalTime.value = null;
  analysisStatus.value = '';
  currentImageIndex.value = 0;
  totalImages.value = 0;
  bestMatch.value = null;
  error.value = null;
  sourceImageUrl.value = null;
};

const prepareSourceImage = async () => {
  if (!props.sourceImage) return null;

  if (props.sourceImage instanceof File) {
    // Create object URL for display
    sourceImageUrl.value = URL.createObjectURL(props.sourceImage);
    return props.sourceImage;
  } else if (typeof props.sourceImage === 'string') {
    // It's already a URL
    sourceImageUrl.value = props.sourceImage;

    // Convert URL to File object for inference
    try {
      const response = await fetch(props.sourceImage);
      const blob = await response.blob();
      return new File([blob], 'source-image.jpg', { type: blob.type });
    } catch (fetchError) {
      throw new Error('Failed to load source image from URL: ' + fetchError.message);
    }
  }

  return null;
};

// Helper function to wait for inference session to be ready
const waitForInferenceSession = async (maxWaitTime = 300000) => {
  const checkInterval = 100; // Check every 100ms
  const maxAttempts = maxWaitTime / checkInterval;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const checkSession = () => {
      if (inferenceStore.sessionReady) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Timeout waiting for AI session to initialize (5 minute timeout - 13MB model download + initialization can be slow on first load)'));
      } else {
        attempts++;
        setTimeout(checkSession, checkInterval);
      }
    };

    checkSession();
  });
};

const startAnalysis = async () => {
  console.log('🎬 ImageMatcher.startAnalysis() called');
  
  if (!props.sourceImage || props.comparisonImages.length === 0) {
    error.value = 'Missing source image or comparison images';
    console.warn('⚠️ Cannot start analysis:', { 
      hasSource: !!props.sourceImage, 
      comparisonCount: props.comparisonImages.length 
    });
    return;
  }

  // Wait for inference session to be ready
  if (!inferenceStore.sessionReady) {
    try {
      console.log('⏳ [ImageMatcher] Waiting for inference session to be ready...');
      console.log('   sessionReady:', inferenceStore.sessionReady);
      console.log('   isLoading:', inferenceStore.isLoading);
      console.log('   errorString:', inferenceStore.errorString);
      console.log('📊 Check browser console for worker logs (look for [InferenceWorker] messages)');
      
      resetAnalysis();
      isAnalyzing.value = true;
      const initStartTime = Date.now();
      analysisStatus.value = 'Initializing AI session (downloading model on first load)...';

      // Update status with elapsed time every second
      const statusInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - initStartTime) / 1000);
        analysisStatus.value = `Initializing AI session... ${elapsed}s elapsed (check console for details)`;
        
        // Log every 10 seconds to show we're still waiting
        if (elapsed % 10 === 0) {
          console.log(`⏳ [ImageMatcher] Still waiting for session... ${elapsed}s elapsed`);
          console.log('   sessionReady:', inferenceStore.sessionReady);
          console.log('   If you see no [InferenceWorker] logs, the worker may have failed silently');
        }
      }, 1000);

      try {
        // Wait for session to be ready with timeout
        await waitForInferenceSession();
        console.log('✅ [ImageMatcher] Session is ready!');
      } finally {
        clearInterval(statusInterval);
      }
    } catch (sessionError) {
      console.error('❌ [ImageMatcher] Session initialization failed:', sessionError);
      
      // Format error message based on type
      let userMessage = sessionError.message;
      if (sessionError.message.includes('Insufficient memory') || sessionError.message.includes('GB RAM')) {
        userMessage = '❌ ' + sessionError.message + '\n\n💡 Suggestions:\n• Close all other browser tabs\n• Close background apps\n• Restart your browser\n• Try on a device with more RAM';
      } else if (sessionError.message.includes('Out of memory')) {
        userMessage = '❌ Device ran out of memory.\n\n💡 To fix:\n• Close other tabs and apps\n• Restart browser\n• If problem persists, device may not support this feature';
      } else {
        userMessage = 'Failed to initialize AI session: ' + sessionError.message;
      }
      
      error.value = userMessage;
      isAnalyzing.value = false;
      return;
    }
  }

  try {
    if (!isAnalyzing.value) {
      resetAnalysis();
      isAnalyzing.value = true;
    }
    
    // Start timing AFTER reset (so it doesn't get cleared)
    analysisStartTime.value = performance.now();
    console.log(`⏱️ Analysis timer started at ${analysisStartTime.value.toFixed(2)}`);
    
    analysisStatus.value = 'Preparing source image...';

    // Prepare source image
    const sourceImageFile = await prepareSourceImage();
    if (!sourceImageFile) {
      throw new Error('Failed to prepare source image');
    }

    analysisStatus.value = 'Analyzing against comparison images...';
    totalImages.value = props.comparisonImages.length;
    currentImageIndex.value = 0;

    // Convert comparison images to URLs array
    const comparisonUrls = props.comparisonImages.map((img) => img.url);

    // Run inference with progress tracking
    await inferenceStore.runInferenceBatch(
      sourceImageFile,
      comparisonUrls,
      (bestMatchUrl) => {
        console.log('📊 Analysis callback triggered with:', bestMatchUrl);
        
        // Find the comparison image that matches the best result
        const matchedImage = props.comparisonImages.find((img) => img.url === bestMatchUrl);

        if (matchedImage) {
          bestMatch.value = matchedImage;
          analysisStatus.value = `Best match: ${matchedImage.name || 'Found match'}`;

          // Emit match found event
          emit('match-found', matchedImage);
        } else {
          analysisStatus.value = 'No clear match found';
        }

        // Complete analysis
        analysisComplete.value = true;
        isAnalyzing.value = false;

        console.log('⏰ Calculating timing...', {
          hasStartTime: !!analysisStartTime.value,
          startTime: analysisStartTime.value,
          currentTime: performance.now(),
          totalImages: totalImages.value
        });

        // Calculate total time
        if (analysisStartTime.value) {
          analysisTotalTime.value = performance.now() - analysisStartTime.value;
          const totalTimeMs = analysisTotalTime.value;
          const totalTimeSec = totalTimeMs / 1000;
          const avgPerImage = totalTimeMs / totalImages.value;
          
          // Measure memory asynchronously without blocking
          const measureMemory = async () => {
            try {
              // Try new Memory API first (includes workers, requires Cross-Origin Isolation)
              if (performance.measureUserAgentSpecificMemory) {
                const memoryMeasurement = await performance.measureUserAgentSpecificMemory();
                const totalBytes = memoryMeasurement.bytes;
                const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
                
                // Break down by attribution (main thread, workers, etc.)
                const breakdown = memoryMeasurement.breakdown || [];
                let workerMemory = 0;
                let mainMemory = 0;
                
                breakdown.forEach(entry => {
                  const bytes = entry.bytes;
                  if (entry.types?.includes('Worker') || entry.attribution?.[0]?.scope === 'DedicatedWorkerGlobalScope') {
                    workerMemory += bytes;
                  } else {
                    mainMemory += bytes;
                  }
                });
                
                const workerMB = (workerMemory / 1024 / 1024).toFixed(1);
                const mainMB = (mainMemory / 1024 / 1024).toFixed(1);
                
                return `
║  Memory Total:      ${totalMB} MB
║  ├─ Main Thread:    ${mainMB} MB
║  └─ Workers:        ${workerMB} MB`;
              } else if (performance.memory) {
                // Fallback to legacy API (Chrome-only, main thread only)
                const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
                const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1);
                const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
                return `
║  Memory Used:       ${usedMB} MB / ${totalMB} MB (main thread only)
║  Memory Limit:      ${limitMB} MB`;
              }
            } catch (err) {
              console.warn('Could not measure memory:', err.message);
            }
            return '';
          };
          
          // Log performance with memory info
          const logPerformance = (memInfo) => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║  🔍 IMAGE MATCHING ANALYSIS COMPLETE                       ║
╔════════════════════════════════════════════════════════════╗
║  Total Time:        ${totalTimeSec.toFixed(2)}s
║  Images Analyzed:   ${totalImages.value}
║  Avg per Image:     ${avgPerImage.toFixed(0)}ms
║  Match Found:       ${matchedImage ? '✅ Yes' : '❌ No'}${memInfo}
║  Status:            Analysis ready
╚════════════════════════════════════════════════════════════╝
            `);
          };
          
          // Measure memory and log (async, non-blocking)
          measureMemory().then(logPerformance).catch(err => {
            console.error('Memory measurement failed:', err);
            logPerformance(''); // Log without memory info on error
          });
        } else {
          console.warn('⚠️ No start time recorded - cannot calculate performance');
        }

        // Emit completion event
        emit('analysis-complete', bestMatch.value);
      },
      (currentIndex, totalCount) => {
        // Progress callback
        currentImageIndex.value = currentIndex + 1;
        totalImages.value = totalCount;
        analysisStatus.value = `Analyzing image ${currentIndex + 1} of ${totalCount}...`;
      }
    );
  } catch (err) {
    console.error('Image analysis error:', err);
    error.value = err.message || 'Analysis failed';
    isAnalyzing.value = false;
    analysisComplete.value = true;

    // Calculate total time even on error
    if (analysisStartTime.value) {
      analysisTotalTime.value = performance.now() - analysisStartTime.value;
      console.log(`
╔════════════════════════════════════════════════════════════╗
║  ❌ IMAGE ANALYSIS FAILED                                  ║
╔════════════════════════════════════════════════════════════╗
║  Time Before Error: ${(analysisTotalTime.value / 1000).toFixed(2)}s (${analysisTotalTime.value.toFixed(0)}ms)
║  Error:             ${err.message}
╚════════════════════════════════════════════════════════════╝
      `);
    }

    // Emit error event
    emit('analysis-error', err);
  }
};

// Watch for changes in source image or comparison images
watch(
  () => [props.sourceImage, props.comparisonImages],
  async () => {
    console.log('🔍 ImageMatcher watch triggered:', {
      hasSourceImage: !!props.sourceImage,
      comparisonCount: props.comparisonImages.length,
      autoStart: props.autoStart
    });
    resetAnalysis();
    if (props.autoStart && props.sourceImage && props.comparisonImages.length > 0) {
      console.log('🚀 Auto-starting image analysis...');
      // Use setTimeout to avoid blocking the watcher
      setTimeout(() => {
        startAnalysis().catch((err) => {
          console.error('Auto-analysis failed:', err);
          error.value = 'Auto-analysis failed: ' + err.message;
        });
      }, 100);
    }
  },
  { immediate: true }
);

// Expose methods for parent component
defineExpose({
  startAnalysis,
  resetAnalysis,
});
</script>

<style scoped>
/* Image matcher component styles */
</style>
