<template>
  <!-- iOS Native Video Picker Button -->
  <button
    @click="showChoiceDialog = true"
    :class="[
      'fixed bottom-15 right-4 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 hover:bg-green-700 z-40',
      showText ? 'w-auto px-4 gap-2' : 'w-14'
    ]"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
    <span v-if="showText" class="font-semibold text-sm whitespace-nowrap">Upload Beta</span>
  </button>

  <!-- Choice Dialog -->
  <div
    v-if="showChoiceDialog"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showChoiceDialog = false"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Add Video</h3>
        <p class="text-sm text-gray-600 mb-6">Choose how you'd like to add your climbing video</p>
        
        <div class="space-y-3">
          <!-- Record New Video -->
          <button
            @click="pickVideo('camera')"
            class="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg transition-colors group"
          >
            <div class="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="text-left flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-purple-900">Record New Video</div>
              <div class="text-xs text-gray-600">Capture a new climbing video</div>
            </div>
          </button>

          <!-- Pick from Library -->
          <button
            @click="pickVideo('photos')"
            class="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg transition-colors group"
          >
            <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="text-left flex-1">
              <div class="font-semibold text-gray-900 group-hover:text-green-900">Choose from Library</div>
              <div class="text-xs text-gray-600">Pick an existing video</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Cancel -->
      <div class="bg-gray-50 px-6 py-3 flex justify-end">
        <button
          @click="showChoiceDialog = false"
          class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';

const props = defineProps({
  showText: {
    type: Boolean,
    default: false,
  },
  allowTrim: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['video-selected']);

const showChoiceDialog = ref(false);

const pickVideo = async (source) => {
  showChoiceDialog.value = false;
  
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      // Use native iOS video editor
      const { IosVideoEditor } = await import('capacitor-plugin-ios-video-editor');
      
      const result = await IosVideoEditor.pickAndEditVideo({
        source: source,
        allowTrim: props.allowTrim,
        quality: 'medium',
      });
      
      console.log('✅ Video picked from iOS:', result);
      
      // Convert file path to File object
      const response = await fetch(`capacitor://localhost/_capacitor_file_${result.path}`);
      const blob = await response.blob();
      const file = new File([blob], `video_${Date.now()}.mov`, { type: 'video/quicktime' });
      
      emit('video-selected', file);
    } else {
      // Fallback to web file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      if (source === 'camera') {
        input.capture = 'environment'; // Request camera on mobile web
      }
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          emit('video-selected', file);
        }
      };
      input.click();
    }
  } catch (error) {
    console.error('Error picking video:', error);
    if (!error.message?.includes('cancel')) {
      // Fallback to web picker on error (but not on user cancellation)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          emit('video-selected', file);
        }
      };
      input.click();
    }
  }
};
</script>
