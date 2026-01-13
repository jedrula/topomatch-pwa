<template>
  <div class="video-metadata text-white p-2 rounded text-xs">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div class="min-w-0">
        <p v-if="video.uploadedBy && video.userId" class="text-sm text-white font-semibold truncate" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">
          <router-link
            :to="{ name: 'user-profile', params: { userId: video.userId } }"
            class="text-white"
            @click.stop
          >
            {{ video.uploadedBy }}
          </router-link>
        </p>
        <p v-else-if="video.uploadedBy" class="text-sm text-white font-semibold truncate" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">{{ video.uploadedBy }}</p>
        <p v-if="video.uploadedAt" class="text-xs text-gray-300 font-medium" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">{{ formatDate(video.uploadedAt) }}</p>
      </div>
    </div>
    
    <div class="mt-2 flex items-start gap-1">
      <svg class="w-3 h-3 text-white flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p class="text-xs text-white font-semibold" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">
        <router-link
          v-if="video.problemId && video.locationId"
          :to="{ name: 'boulder-problem-detail', params: { locationId: video.locationId, problemId: video.problemId } }"
          class="text-white"
          @click.stop
        >
          {{ video.name }}<template v-if="video.locationName">, {{ video.locationName }}</template>
        </router-link>
        <span v-else>{{ video.name }}<template v-if="video.locationName">, {{ video.locationName }}</template></span>
      </p>
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