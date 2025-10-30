<template>
  <div>
    <!-- Recording/Upload Mode Selection -->
    <div class="mb-4">
      <div class="flex items-center justify-center space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          @click="mode = 'upload'"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            mode === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          📁 Upload File
        </button>
        <button
          @click="mode = 'record'"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            mode === 'record'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          🎥 Record Video
        </button>
      </div>
    </div>

    <!-- Video File Selection or Recording -->
    <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <!-- Upload Mode -->
      <div v-if="mode === 'upload'" class="text-center">
        <svg
          class="w-12 h-12 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          ></path>
        </svg>
        <div class="mb-4">
          <h4 class="text-lg font-medium text-gray-900 mb-1">{{ title }}</h4>
          <p class="text-xs text-gray-500">{{ subtitle }}</p>
        </div>

        <!-- File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="video/*"
          @change="handleFileChange"
          class="hidden"
        />

        <button
          type="button"
          @click="$refs.fileInput.click()"
          :disabled="isDisabled"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Choose Video File
        </button>

        <p class="text-xs text-gray-500 mt-2">MP4, WebM, MOV up to 100MB</p>
      </div>

      <!-- Record Mode -->
      <VideoRecorder 
        v-else-if="mode === 'record'"
        @video-recorded="handleVideoRecorded"
        @recording-cancelled="mode = 'upload'"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import VideoRecorder from './VideoRecorder.vue';

defineProps({
  title: {
    type: String,
    default: 'Upload Beta Video',
  },
  subtitle: {
    type: String,
    default: 'Share your climbing videos and link them to boulder problems',
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['video-selected']);

const fileInput = ref(null);
const mode = ref('upload'); // 'upload' or 'record'

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    emit('video-selected', file);
  }
  // Clear the input so the same file can be selected again
  event.target.value = '';
};

const handleVideoRecorded = (file) => {
  emit('video-selected', file);
};
</script>
