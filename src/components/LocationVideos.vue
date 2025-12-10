<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
      <div>
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">Beta Videos</h2>
        <p v-if="!loading && videos.length > 0" class="text-sm text-gray-600 mt-1">
          {{ videos.length }} {{ videos.length === 1 ? 'video' : 'videos' }}
        </p>
      </div>
      
      <!-- Delete All Button (Admin Only) -->
      <button
        v-if="userStore.isAdmin && !loading && videos.length > 0"
        @click="confirmDeleteAll"
        class="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-300 hover:border-red-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        :disabled="isDeletingAll"
      >
        <span v-if="!isDeletingAll" class="flex items-center space-x-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete All</span>
        </span>
        <span v-else class="flex items-center space-x-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Deleting...</span>
        </span>
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6 pt-3 sm:pt-4">
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
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group"
        >
          <!-- Uploading State -->
          <div v-if="video.isUploading" class="w-full h-full relative bg-gray-200">
            <div class="absolute inset-0 flex flex-col items-center justify-center p-4">
              <svg class="w-12 h-12 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-sm font-medium text-gray-700 mb-2">Uploading Video...</p>
              <div class="w-full max-w-[200px] bg-gray-300 rounded-full h-2 overflow-hidden">
                <div 
                  class="bg-blue-500 h-full transition-all duration-300"
                  :style="{ width: `${video.progress || 0}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ Math.round(video.progress || 0) }}%</p>
            </div>
          </div>

          <!-- Video thumbnail/preview -->
          <div 
            v-else
            class="w-full h-full relative cursor-pointer"
            @click="openVideoPlayer(index)"
            :aria-label="`Play beta video ${index + 1}`"
            role="button"
            tabindex="0"
            @keydown.enter="openVideoPlayer(index)"
            @keydown.space.prevent="openVideoPlayer(index)"
          >
            <video
              :src="video.downloadUrl"
              :poster="video.thumbnailBase64 || defaultPoster"
              class="w-full h-full object-cover transition-transform group-hover:scale-105"
              muted
              preload="none"
              crossorigin="anonymous"
            />

            <!-- Play button overlay -->
            <div class="absolute inset-0 flex items-center justify-center transition-all duration-200 pointer-events-none">
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

          <!-- Delete button (only for video owner) -->
          <button
            v-if="canDeleteVideo(video)"
            @click.stop="handleDeleteClick(video)"
            class="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700 z-10"
            :aria-label="`Delete video ${index + 1}`"
            title="Delete video"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Video?</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to delete this video? This action cannot be undone.
        </p>
        <div class="flex gap-3 justify-end">
          <button
            @click="cancelDelete"
            :disabled="deleting"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Video Player Shorts -->
    <VideoPlayerShorts
      v-if="route.query.videoId && !route.query.showVideosForProblem"
      :get-videos="getPlayerVideos"
      title="Beta Videos"
      @close="closeVideoPlayer"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { videoService } from '@/services/videoService';
import { getCurrentUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import { getDefaultVideoPoster, formatVideoDuration } from '@/utils/videoUtils';
import VideoPlayerShorts from './VideoPlayerShorts.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const props = defineProps({
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

const emit = defineEmits(['video-deleted']);

const showDeleteConfirm = ref(false);
const videoToDelete = ref(null);
const deleting = ref(false);
const isDeletingAll = ref(false);

// Default poster image (gray placeholder with play icon)
const defaultPoster = getDefaultVideoPoster();

const formatDuration = formatVideoDuration;

const canDeleteVideo = (video) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // User can delete their own videos
  return video.userId === currentUser.uid;
};

const handleDeleteClick = (video) => {
  videoToDelete.value = video;
  showDeleteConfirm.value = true;
};

const cancelDelete = () => {
  if (deleting.value) return;
  showDeleteConfirm.value = false;
  videoToDelete.value = null;
};

const confirmDelete = async () => {
  if (!videoToDelete.value || deleting.value) return;

  try {
    deleting.value = true;
    
    // Delete the video using videoService
    await videoService.deleteVideo(videoToDelete.value.id);
    
    // Notify parent component to refresh the video list
    emit('video-deleted', videoToDelete.value.id);
    
    // Close dialog
    showDeleteConfirm.value = false;
    videoToDelete.value = null;
  } catch (error) {
    console.error('Error deleting video:', error);
    alert(`Failed to delete video: ${error.message}`);
  } finally {
    deleting.value = false;
  }
};

// Delete all videos (admin only)
const confirmDeleteAll = () => {
  if (isDeletingAll.value) return;
  
  const confirmed = window.confirm(
    `Are you sure you want to delete ALL ${props.videos.length} videos? This action cannot be undone.`
  );
  
  if (confirmed) {
    deleteAllVideos();
  }
};

const deleteAllVideos = async () => {
  if (isDeletingAll.value || !props.videos || props.videos.length === 0) return;
  
  try {
    isDeletingAll.value = true;
    
    console.log(`🗑️ Deleting ${props.videos.length} videos...`);
    
    // Delete all videos sequentially
    let successCount = 0;
    let failCount = 0;
    
    for (const video of props.videos) {
      try {
        await videoService.deleteVideo(video.id);
        emit('video-deleted', video.id);
        successCount++;
        console.log(`✅ Deleted video ${successCount}/${props.videos.length}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to delete video ${video.id}:`, error);
      }
    }
    
    if (failCount > 0) {
      alert(`Deleted ${successCount} videos. ${failCount} videos failed to delete.`);
    } else {
      alert(`Successfully deleted all ${successCount} videos!`);
    }
  } catch (error) {
    console.error('Error during bulk delete:', error);
    alert(`Failed to delete videos: ${error.message}`);
  } finally {
    isDeletingAll.value = false;
  }
};

// Video player methods
const openVideoPlayer = (index) => {
  const video = props.videos[index];
  if (video && !video.isUploading) {
    // Add videoId to URL to open the player
    router.push({
      query: {
        ...route.query,
        videoId: video.id,
      },
    });
  }
};

const closeVideoPlayer = () => {
  // Remove videoId from URL to close the player
  const query = { ...route.query };
  delete query.videoId;
  router.push({ query });
};

// Function to provide videos to VideoPlayerShorts
const getPlayerVideos = async () => {
  // Filter out uploading videos and return only completed ones
  return props.videos.filter(video => !video.isUploading);
};
</script>
