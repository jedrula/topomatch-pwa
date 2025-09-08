<template>
  <div class="video-recorder-component">
    <!-- Recording Interface -->
    <div v-if="!recordedVideoFile" class="text-center">
      <svg
        class="w-12 h-12 text-red-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
      <div class="mb-4">
        <h4 class="text-lg font-medium text-gray-900 mb-2">Record Your Beta</h4>
        <p class="text-sm text-gray-500">Record a climbing video directly from your camera</p>
      </div>

      <!-- Camera Preview -->
      <div v-if="isRecording || recordedBlob || isPreparingToRecord" class="mb-4">
        <video
          ref="cameraPreview"
          :class="[
            'w-full max-w-md mx-auto rounded-lg',
            isRecording ? 'border-2 border-red-500' : 'border border-gray-300'
          ]"
          :autoplay="isRecording"
          :muted="isRecording"
          playsinline
          style="min-height: 240px; background: #f3f4f6;"
        ></video>
        
        <!-- Recording indicator -->
        <div v-if="isRecording" class="flex items-center justify-center mt-2 text-red-600">
          <div class="animate-pulse w-3 h-3 bg-red-600 rounded-full mr-2"></div>
          <span class="text-sm font-medium">Recording... {{ recordingDuration }}s</span>
        </div>
      </div>

      <!-- Recording Controls -->
      <div class="space-y-3">
        <button
          v-if="!isRecording && !recordedBlob"
          @click="startRecording"
          :disabled="isProcessing"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
          </svg>
          Start Recording
        </button>

        <button
          v-if="isRecording"
          @click="stopRecording"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
          Stop Recording
        </button>

        <!-- Post-recording actions -->
        <div v-if="recordedBlob && !showTrimControls" class="space-x-2">
          <button
            @click="enableTrimMode"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20h9" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            ✂️ Trim Video
          </button>
          <button
            @click="useRecordedVideo"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Use This Recording
          </button>
          <button
            @click="discardRecording"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Record Again
          </button>
        </div>

        <!-- Trim Controls (Mobile-Friendly) -->
        <div v-if="recordedBlob && showTrimControls" class="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 class="text-sm font-medium text-gray-900 mb-3">✂️ Trim Video</h4>
          
          <!-- Simple input-based trimming for mobile compatibility -->
          <div class="space-y-4">
            <!-- Duration Info -->
            <div class="text-center text-sm text-gray-600 mb-3">
              Original duration: {{ formatTime(originalVideoDuration) }}
            </div>
            
            <!-- Visual Timeline -->
            <div class="relative bg-gray-200 h-4 rounded">
              <div 
                class="absolute h-full bg-blue-500 rounded opacity-60"
                :style="{
                  left: `${(trimStartTime / originalVideoDuration) * 100}%`,
                  width: `${((trimEndTime - trimStartTime) / originalVideoDuration) * 100}%`
                }"
              ></div>
            </div>
            
            <!-- Start Time Control -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label class="text-xs text-gray-700">Start:</label>
              <input
                v-model.number="trimStartTime"
                type="range"
                :min="0"
                :max="Math.max(0, trimEndTime - 1)"
                :step="0.1"
                class="col-span-1"
                @input="seekToTrimStart"
              />
              <span class="text-xs text-gray-600">{{ formatTime(trimStartTime) }}</span>
            </div>
            
            <!-- End Time Control -->
            <div class="grid grid-cols-3 gap-2 items-center">
              <label class="text-xs text-gray-700">End:</label>
              <input
                v-model.number="trimEndTime"
                type="range"
                :min="Math.max(1, trimStartTime + 1)"
                :max="originalVideoDuration"
                :step="0.1"
                class="col-span-1"
                @input="seekToTrimEnd"
              />
              <span class="text-xs text-gray-600">{{ formatTime(trimEndTime) }}</span>
            </div>
            
            <!-- Trimmed Duration -->
            <div class="text-center text-xs text-gray-600 bg-gray-100 p-2 rounded">
              Trimmed duration: {{ formatTime(trimEndTime - trimStartTime) }} 
              ({{ Math.round(((trimEndTime - trimStartTime) / originalVideoDuration) * 100) }}% of original)
            </div>
            
            <!-- Quick Presets -->
            <div class="grid grid-cols-3 gap-2">
              <button
                @click="applyTrimPreset(0.1, 0.9)"
                class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Trim 10%
              </button>
              <button
                @click="applyTrimPreset(0.2, 0.8)"
                class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Middle 60%
              </button>
              <button
                @click="resetTrim"
                class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
            
            <!-- Preview Controls -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="previewTrimmedSection"
                class="text-xs px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                🎬 Preview
              </button>
              <button
                @click="seekToTrimStart"
                class="text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                ⏮ Go to Start
              </button>
            </div>
          </div>
          
          <!-- Trim Actions -->
          <div class="flex space-x-2 mt-4">
            <button
              @click="useRecordedVideo"
              class="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Use Trimmed Video
            </button>
            <button
              @click="showTrimControls = false"
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-500 mt-2">
        {{ isRecording ? 'Recording in progress...' : 'Record a video up to 3 minutes' }}
      </p>
    </div>

    <!-- Success State -->
    <div v-else class="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
      <svg class="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <h4 class="text-sm font-medium text-green-900 mb-1">Video Ready</h4>
      <p class="text-xs text-green-700">{{ recordedVideoFile.name }} ({{ formatFileSize(recordedVideoFile.size) }})</p>
      <button
        @click="resetRecording"
        class="mt-2 text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
      >
        Record Again
      </button>
    </div>

    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="text-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p class="text-xs text-gray-600">Processing video...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, nextTick } from 'vue';

// Props and emits
const emit = defineEmits(['video-recorded', 'recording-cancelled']);

// Recording state
const isRecording = ref(false);
const isPreparingToRecord = ref(false);
const isProcessing = ref(false);
const recordedBlob = ref(null);
const recordedVideoFile = ref(null);
const recordingDuration = ref(0);
const recordingTimer = ref(null);
const mediaStream = ref(null);
const mediaRecorder = ref(null);
const cameraPreview = ref(null);
const recordingMimeType = ref('video/webm');

// Trimming state
const showTrimControls = ref(false);
const trimStartTime = ref(0);
const trimEndTime = ref(0);
const originalVideoDuration = ref(0);

// Recording functionality
const startRecording = async () => {
  try {
    isPreparingToRecord.value = true;

    // Get camera stream with optimized settings
    mediaStream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 854 },  // 480p width
        height: { ideal: 480 }, // 480p height
        frameRate: { ideal: 30 }
      },
      audio: true
    });

    // Set up camera preview
    if (cameraPreview.value) {
      cameraPreview.value.srcObject = mediaStream.value;
      await nextTick();
    }

    // Determine best recording format - prioritize MP4
    const supportedTypes = [
      'video/mp4;codecs=h264,aac',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,vorbis',
      'video/webm'
    ];

    recordingMimeType.value = supportedTypes.find(type => 
      MediaRecorder.isTypeSupported(type)
    ) || 'video/webm';

    // Create MediaRecorder with optimized settings
    mediaRecorder.value = new MediaRecorder(mediaStream.value, {
      mimeType: recordingMimeType.value,
      videoBitsPerSecond: 1000000, // 1 Mbps
      audioBitsPerSecond: 64000,   // 64 kbps
    });

    const chunks = [];

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.value.onstop = async () => {
      isRecording.value = false;
      
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
        recordingTimer.value = null;
      }

      // Create blob - MP4 should have reliable metadata
      recordedBlob.value = new Blob(chunks, { type: recordingMimeType.value });
      
      // Set up video preview with recorded blob
      if (cameraPreview.value) {
        const videoUrl = URL.createObjectURL(recordedBlob.value);
        cameraPreview.value.srcObject = null;
        cameraPreview.value.src = videoUrl;
        cameraPreview.value.controls = true;
        cameraPreview.value.autoplay = false;
        cameraPreview.value.muted = false;
        
        // Wait for video metadata to load
        cameraPreview.value.onloadedmetadata = () => {
          if (cameraPreview.value.duration && isFinite(cameraPreview.value.duration)) {
            originalVideoDuration.value = cameraPreview.value.duration;
            console.log('Recorded video duration:', originalVideoDuration.value, 'seconds');
          }
        };
      }
    };

    mediaRecorder.value.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      isRecording.value = false;
      isPreparingToRecord.value = false;
    };

    // Start recording
    mediaRecorder.value.start();
    isRecording.value = true;
    isPreparingToRecord.value = false;
    recordingDuration.value = 0;
    
    // Start duration timer
    recordingTimer.value = setInterval(() => {
      recordingDuration.value += 1;
      
      // Auto-stop after 180 seconds (3 minutes)
      if (recordingDuration.value >= 180) {
        stopRecording();
      }
    }, 1000);

  } catch (err) {
    console.error('Error starting recording:', err);
    isPreparingToRecord.value = false;
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    
    // Stop camera stream
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop());
      mediaStream.value = null;
    }
  }
};

const useRecordedVideo = async () => {
  if (!recordedBlob.value) return;
  
  isProcessing.value = true;
  
  try {
    let finalBlob = recordedBlob.value;
    
    // If trimming is active, create a trimmed video
    if (showTrimControls.value && (trimStartTime.value > 0 || trimEndTime.value < originalVideoDuration.value)) {
      finalBlob = await createTrimmedVideo();
    }
    
    // Determine file extension based on MIME type
    const extension = recordingMimeType.value.includes('mp4') ? 'mp4' : 'webm';
    
    // Create a File object from the blob
    const file = new File([finalBlob], `recorded_video_${Date.now()}.${extension}`, {
      type: recordingMimeType.value
    });
    
    recordedVideoFile.value = file;
    emit('video-recorded', file);
    
  } catch (err) {
    console.error('Error processing recorded video:', err);
  } finally {
    isProcessing.value = false;
  }
};

const discardRecording = () => {
  if (recordedBlob.value) {
    URL.revokeObjectURL(recordedBlob.value);
    recordedBlob.value = null;
  }
  recordingDuration.value = 0;
  showTrimControls.value = false;
  trimStartTime.value = 0;
  trimEndTime.value = 0;
  originalVideoDuration.value = 0;
  
  // Reset camera preview
  if (cameraPreview.value) {
    cameraPreview.value.src = '';
    cameraPreview.value.srcObject = null;
    cameraPreview.value.controls = false;
  }
};

const resetRecording = () => {
  recordedVideoFile.value = null;
  discardRecording();
  emit('recording-cancelled');
};

// Trimming functionality
const enableTrimMode = () => {
  if (!recordedBlob.value) return;
  
  showTrimControls.value = true;
  
  // Set initial trim values to full video duration
  const videoElement = cameraPreview.value;
  if (videoElement && videoElement.duration && isFinite(videoElement.duration)) {
    originalVideoDuration.value = videoElement.duration;
    trimStartTime.value = 0;
    trimEndTime.value = videoElement.duration;
  } else {
    // Fallback values if duration isn't available
    originalVideoDuration.value = 60;
    trimStartTime.value = 0;
    trimEndTime.value = 60;
  }
};

const seekToTrimStart = () => {
  const videoElement = cameraPreview.value;
  if (videoElement) {
    videoElement.currentTime = trimStartTime.value;
  }
};

const seekToTrimEnd = () => {
  const videoElement = cameraPreview.value;
  if (videoElement) {
    videoElement.currentTime = trimEndTime.value;
  }
};

const previewTrimmedSection = () => {
  const videoElement = cameraPreview.value;
  if (videoElement) {
    videoElement.currentTime = trimStartTime.value;
    videoElement.play().then(() => {
      // Set up a timer to pause at the end time
      const checkTime = () => {
        if (videoElement.currentTime >= trimEndTime.value) {
          videoElement.pause();
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      checkTime();
    }).catch(console.error);
  }
};

const resetTrim = () => {
  trimStartTime.value = 0;
  trimEndTime.value = originalVideoDuration.value;
  seekToTrimStart();
};

const applyTrimPreset = (startPercentage, endPercentage) => {
  trimStartTime.value = originalVideoDuration.value * startPercentage;
  trimEndTime.value = originalVideoDuration.value * endPercentage;
};

const createTrimmedVideo = async () => {
  return new Promise((resolve, reject) => {
    try {
      // Create a video element for processing
      const video = document.createElement('video');
      video.src = URL.createObjectURL(recordedBlob.value);
      
      video.onloadedmetadata = () => {
        // Create canvas for capturing frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create MediaRecorder for the trimmed video
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: recordingMimeType.value,
          videoBitsPerSecond: 1000000, // 1 Mbps
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: recordingMimeType.value });
          URL.revokeObjectURL(video.src);
          resolve(trimmedBlob);
        };
        
        // Start recording the trimmed section
        video.currentTime = trimStartTime.value;
        
        video.onseeked = () => {
          mediaRecorder.start();
          video.play();
          
          // Draw frames to canvas while playing
          const drawFrame = () => {
            if (video.currentTime <= trimEndTime.value && !video.paused) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            } else {
              video.pause();
              mediaRecorder.stop();
            }
          };
          
          drawFrame();
        };
      };
      
      video.onerror = (err) => {
        console.error('Video processing error:', err);
        reject(new Error('Failed to process video for trimming'));
      };
      
    } catch (err) {
      reject(err);
    }
  });
};

// Utility functions
const formatTime = (seconds) => {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Cleanup
const cleanup = () => {
  if (recordedBlob.value) {
    URL.revokeObjectURL(recordedBlob.value);
  }
  
  if (isRecording.value) {
    stopRecording();
  }
  
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
    mediaStream.value = null;
  }
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
};

onUnmounted(() => {
  cleanup();
});

// Expose cleanup method for parent component
defineExpose({
  cleanup
});
</script>

<style scoped>
.video-recorder-component {
  width: 100%;
}

/* Custom range slider styling for better mobile experience */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>
