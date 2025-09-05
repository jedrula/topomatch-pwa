<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Beta Videos</h2>
        <p v-if="!loading && videos.length > 0" class="text-sm text-gray-600 mt-1">
          {{ videos.length }} {{ videos.length === 1 ? 'video' : 'videos' }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6 pt-4">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <div class="mx-auto w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 text-sm">Loading videos...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="videos.length === 0" class="text-center py-8">
        <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No beta videos yet</h3>
        <p class="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Beta videos show climbing techniques and sequences for boulder problems at this location.
        </p>
      </div>

      <!-- Videos grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer hover:shadow-md transition-all duration-200"
          @click="$emit('video-click', index)"
          :aria-label="`Play beta video ${index + 1}`"
          role="button"
          tabindex="0"
          @keydown.enter="$emit('video-click', index)"
          @keydown.space.prevent="$emit('video-click', index)"
        >
          <!-- Video thumbnail/preview -->
          <div class="w-full h-full relative">
            <video
              :src="video.downloadUrl"
              class="w-full h-full object-cover transition-transform group-hover:scale-105"
              muted
              preload="metadata"
              @loadedmetadata="handleVideoMetadata"
              @seeked="handleVideoSeeked"
              style="opacity: 0; transition: opacity 0.3s ease"
            />

            <!-- Loading placeholder -->
            <div class="loading-placeholder absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div class="text-center">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <p class="text-xs text-gray-500">Loading preview...</p>
              </div>
            </div>

            <!-- Play button overlay -->
            <div class="absolute inset-0 flex items-center justify-center transition-all duration-200">
              <div class="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                <svg class="w-6 h-6 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <!-- Video info overlay -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <p v-if="video.metadata?.problemName" class="text-white text-xs font-medium truncate">
                {{ video.metadata.problemName }}
              </p>
              <p v-if="video.metadata?.duration" class="text-white text-xs opacity-75">
                {{ formatDuration(video.metadata.duration) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  videos: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['video-click']);

const handleVideoMetadata = (event) => {
  const video = event.target;
  video.currentTime = 1; // Seek to 1 second for thumbnail
};

const handleVideoSeeked = (event) => {
  const video = event.target;
  video.style.opacity = '1';
  const placeholder = video.parentElement.querySelector('.loading-placeholder');
  if (placeholder) {
    placeholder.style.display = 'none';
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>
