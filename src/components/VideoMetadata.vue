<template>
  <div class="text-white text-right bg-black bg-opacity-50 p-3 rounded-lg text-sm">
    <h3 class="font-medium mb-1 text-gray-200">{{ video.name }}</h3>
    <div class="text-xs text-gray-400 space-y-0.5">
      <p v-if="video.uploadedBy && video.userId">
        <router-link
          :to="{ name: 'user-profile', params: { userId: video.userId } }"
          class="text-blue-400 hover:text-blue-300 transition-colors pointer-events-auto cursor-pointer"
          @click.stop
        >
          {{ video.uploadedBy }}
        </router-link>
      </p>
      <p v-else-if="video.uploadedBy">{{ video.uploadedBy }}</p>
      <p v-if="video.uploadedAt">{{ formatDate(video.uploadedAt) }}</p>
      <p v-if="video.size">{{ formatFileSize(video.size) }}</p>
      <div v-if="video.isTranscoded" class="flex items-center justify-end space-x-1 bg-green-500/20 text-green-300 px-2 py-1 rounded mt-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>HD</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { videoService } from '@/services/videoService';

defineProps({
  video: {
    type: Object,
    required: true
  }
});

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatFileSize = (bytes) => {
  return videoService.formatFileSize(bytes);
};
</script>
