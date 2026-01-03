<template>
  <div class="card">
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-gray-200/60">
      <div>
        <h2 class="text-[15px] font-semibold text-gray-900">Beta Videos</h2>
        <p v-if="!loading && videos.length > 0" class="text-[13px] text-gray-600 mt-0.5">
          {{ videos.length }} {{ videos.length === 1 ? 'video' : 'videos' }}
        </p>
      </div>
      
      <!-- Delete All Button (Admin Only) -->
      <button
        v-if="userStore.isAdmin && !loading && videos.length > 0"
        @click="confirmDeleteAll"
        class="h-9 px-3 text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-md transition-all active:scale-[0.98] inline-flex items-center gap-1.5 font-medium"
        :disabled="isDeletingAll"
      >
        <span v-if="!isDeletingAll" class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete All</span>
        </span>
        <span v-else class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Deleting...</span>
        </span>
      </button>
    </div>

    <!-- Content -->
    <div class="pt-4">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="mx-auto w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-600 text-[13px]">Loading videos...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="videos.length === 0" class="text-center py-12">
        <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No beta videos yet</h3>
        <p class="text-gray-500 text-[13px] max-w-sm mx-auto">
          Beta videos show climbing techniques and sequences for boulder problems at this location.
        </p>
      </div>

      <!-- Videos grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          class="relative"
        >
          <!-- Uploading State (only if no video URL available) -->
          <div v-if="video.isUploading && !video.url && !video.downloadUrl" class="aspect-video w-full relative bg-gray-100 rounded-lg overflow-hidden">
            <div class="absolute inset-0 flex flex-col items-center justify-center p-4">
              <svg class="w-10 h-10 text-gray-900 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p class="text-[13px] font-medium text-gray-700 mb-2">
                {{ video.statusMessage || (video.isAnalyzing ? 'Processing video...' : 'Uploading video...') }}
              </p>
              <div class="w-full max-w-[200px] bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  class="bg-gray-900 h-full transition-all duration-300"
                  :style="{ width: `${video.progress || 0}%` }"
                ></div>
              </div>
              <p class="text-[11px] text-gray-500 mt-2">{{ Math.round(video.progress || 0) }}%</p>
            </div>
          </div>

          <!-- Video thumbnail (show if URL available OR if it's a failed video needing re-analysis) -->
          <VideoGridItem
            v-else
            :video-url="video.url || video.downloadUrl || ''"
            :thumbnail-url="video.thumbnailBase64 || defaultPoster"
            :problem-name="video.metadata?.problemName"
            :problem-grade="video.metadata?.problemGrade"
            :user-name="video.uploadedBy"
            :like-count="video.likeCount"
            @click="(video.url || video.downloadUrl) ? openVideoPlayer(index) : null"
          >
            <template #actions>
              <!-- Analyzing indicator (show when video is uploading or analyzing) -->
              <div
                v-if="video.isUploading || video.isAnalyzing"
                class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm z-10"
                title="Analyzing video..."
              >
                <svg class="w-4 h-4 text-gray-900 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <!-- Action buttons (only shown when NOT analyzing) -->
              <template v-else>
                <!-- Delete button (only for video owner) -->
                <button
                  v-if="canDeleteVideo(video)"
                  @click.stop="handleDeleteClick(video)"
                  class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-red-600 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                  :aria-label="`Delete video ${index + 1}`"
                  title="Delete video"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>

                <!-- Re-process button (only for unclassified videos that belong to user) -->
                <button
                  v-if="canReprocessVideo(video)"
                  @click.stop="handleReprocessClick(video)"
                  class="absolute top-2 right-12 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                  :aria-label="`Re-process video ${index + 1}`"
                  title="Re-analyze video to detect problem"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>

                <!-- Manual assign button (only for unclassified videos that belong to user) -->
                <button
                  v-if="canReprocessVideo(video)"
                  @click.stop="handleManualAssignClick(video)"
                  class="absolute top-2 right-[88px] w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                  :aria-label="`Manually assign problem to video ${index + 1}`"
                  title="Pick a problem from images"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
                  </svg>
                </button>
              </template>
            </template>
          </VideoGridItem>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="cancelDelete"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-[15px] font-semibold text-gray-900 mb-2">Delete Video?</h3>
        <p class="text-gray-600 text-[13px] mb-6">
          Are you sure you want to delete this video? This action cannot be undone.
        </p>
        <div class="flex gap-3 justify-end">
          <button
            @click="cancelDelete"
            :disabled="deleting"
            class="btn-secondary h-9 px-4"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="h-9 px-4 bg-red-600 text-white text-[13px] font-medium rounded-md hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2"
          >
            <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Video Player Shorts -->
    <VideoPlayerShorts
      v-if="route.query.videoId"
      :get-videos="getPlayerVideos"
      :title="videoPlayerTitle"
      @close="closeVideoPlayer"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { videoService } from '@/services/videoService';
import { getCurrentUser } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import { getDefaultVideoPoster, formatVideoDuration } from '@/utils/videoUtils';
import VideoPlayerShorts from './VideoPlayerShorts.vue';
import VideoGridItem from './VideoGridItem.vue';

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

const emit = defineEmits(['video-deleted', 'reprocess-video']);

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

const canReprocessVideo = (video) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Can re-process if:
  // 1. It's the user's video
  // 2. Video doesn't have a problemId (unclassified)
  // 3. Video is not currently uploading or analyzing
  return (
    video.userId === currentUser.uid &&
    !video.problemId &&
    !video.isUploading &&
    !video.isAnalyzing
  );
};

const handleDeleteClick = (video) => {
  videoToDelete.value = video;
  showDeleteConfirm.value = true;
};

const handleReprocessClick = (video) => {
  emit('reprocess-video', video);
};

const handleManualAssignClick = (video) => {
  // Navigate to image gallery with assignVideoId query param
  // This will enable "assignment mode" where user can pick a problem
  // Emit event to parent to get first image ID
  emit('open-manual-assign', video.id);
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
  // Allow opening if video has a URL (local or server)
  if (video && (video.url || video.downloadUrl)) {
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
  // Remove videoId and problemId from URL to close the player
  const query = { ...route.query };
  delete query.videoId;
  delete query.problemId;
  router.push({ query });
};

// Computed title for video player
const videoPlayerTitle = computed(() => {
  const problemId = route.query.problemId;
  if (problemId) {
    // Find a video with this problemId to get the problem name
    const problemVideo = props.videos.find(video => video.problemId === problemId);
    if (problemVideo?.metadata?.problemName) {
      return `${problemVideo.metadata.problemName} Videos`;
    }
  }
  return 'Beta Videos';
});

// Function to provide videos to VideoPlayerShorts
const getPlayerVideos = async () => {
  // Get videos that have a URL (local or server)
  let filteredVideos = props.videos.filter(video => video.url || video.downloadUrl);
  
  // If problemId is in query params, filter to only that problem's videos
  const problemId = route.query.problemId;
  if (problemId) {
    filteredVideos = filteredVideos.filter(video => video.problemId === problemId);
  }
  
  return filteredVideos;
};
</script>
