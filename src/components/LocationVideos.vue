<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="section-header">
        Beta videos
        <span v-if="!loading && videos.length > 0" class="section-header-count ml-1.5">({{ videos.length }})</span>
      </h2>
      
      <!-- Delete All Button (Admin Only) -->
      <button
        v-if="userStore.isAdmin && !loading && videos.length > 0"
        @click="confirmDeleteAll"
        class="h-8 px-3 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-md transition-all inline-flex items-center gap-1.5 font-medium"
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
    <div>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="mx-auto w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-600 text-[13px]">Loading videos...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="videos.length === 0 && !route.query.videoId" class="text-center py-12">
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
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="(video, index) in videos"
          :key="video.id"
          :data-ascent-id="video.ascentId || video.id"
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
            :ascent="normalizeToAscent(video)"
            @click="(video.url || video.downloadUrl || video.video?.transcodedPath) ? openVideoPlayer(index) : null"
          >
            <template #actions>
              <!-- Failed indicator (show error state for failed videos) -->
              <div
                v-if="video.hasFailed"
                class="absolute top-2 right-2 flex items-center gap-2 bg-red-500/90 rounded-full shadow-sm z-10 px-3 py-2"
                :title="video.statusMessage || 'Processing failed'"
              >
                <svg class="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs text-white font-medium">Failed</span>
              </div>
              
              <!-- Analyzing indicator (show when video is uploading or analyzing) -->
              <div
                v-else-if="video.isUploading || video.isAnalyzing"
                class="absolute top-2 right-2 flex items-center gap-2 bg-white/90 rounded-full shadow-sm z-10 px-3 py-2"
                :title="getVideoProgressText(video)"
              >
                <svg class="w-4 h-4 text-gray-900 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-xs text-gray-700 font-medium">{{ getVideoProgressText(video) }}</span>
              </div>

              <!-- Action buttons container (top-right) - all buttons in one container to prevent overlap -->
              <div
                v-else
                class="absolute top-2 right-2 flex gap-1 z-10"
              >
                <!-- Diagnostics button (admin only) -->
                <router-link
                  v-if="userStore.isAdmin && video.ascentId"
                  :to="`/admin/diagnostics?ascentId=${video.ascentId}`"
                  @click.stop
                  class="w-8 h-8 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  :aria-label="`View diagnostics for video ${index + 1}`"
                  title="View analysis diagnostics (right-click to open in new tab)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </router-link>

                <!-- Change routesetting button (admin only) -->
                <button
                  v-if="userStore.isAdmin"
                  @click.stop="handleChangeRoutesettingClick(video)"
                  class="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-purple-600 hover:text-purple-700 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  :aria-label="`Change routesetting for video ${index + 1}`"
                  title="Change routesetting (clears problem assignment)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </button>

                <!-- Reassign climber button (admin or owner) -->
                <button
                  v-if="canReassignVideo(video)"
                  @click.stop="handleReassignClick(video)"
                  class="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-green-600 hover:text-green-700 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  :aria-label="`Reassign climber for video ${index + 1}`"
                  title="Reassign to different climber"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                <!-- Manual assign button (pick problem) -->
                <button
                  v-if="canReprocessVideo(video)"
                  @click.stop="handleManualAssignClick(video)"
                  class="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 rounded-full shadow-sm transition-all"
                  :class="[isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
                  :aria-label="`Manually assign problem to video ${index + 1}`"
                  title="Pick a problem from images"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
                  </svg>
                </button>

                <!-- Re-process button -->
                <button
                  v-if="canReprocessVideo(video)"
                  @click.stop="handleReprocessClick(video)"
                  class="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  :aria-label="`Re-process video ${index + 1}`"
                  title="Re-analyze video to detect problem (or fix wrong detection)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                </button>

                <!-- Delete button -->
                <button
                  v-if="canDeleteVideo(video)"
                  @click.stop="handleDeleteClick(video)"
                  class="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-red-600 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                  :aria-label="`Delete video ${index + 1}`"
                  title="Delete video"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </template>
          </VideoGridItem>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <VideoDeleteConfirmDialog
      :model-value="showDeleteConfirm"
      :deleting="deleting"
      @confirm="executeDelete"
      @cancel="cancelDelete"
    />

    <!-- Change Routesetting Dialog -->
    <ChangeRoutesettingDialog
      :video="videoToChangeRoutesetting"
      :available-routesettings="availableRoutesettings"
      @close="videoToChangeRoutesetting = null"
      @success="handleRoutesettingChanged"
    />

    <!-- Reassign Climber Dialog -->
    <ReassignClimberDialog
      :video="videoToReassign"
      @close="videoToReassign = null"
      @success="handleClimberReassigned"
    />

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
import { isTouchDevice as detectTouchDevice } from '@/utils/platform';
import { useVideoProgress } from '@/composables/useVideoProgress';
import { useVideoDelete } from '@/composables/useVideoDelete';
import VideoPlayerShorts from './VideoPlayerShorts.vue';
import VideoGridItem from './VideoGridItem.vue';
import ChangeRoutesettingDialog from './ChangeRoutesettingDialog.vue';
import VideoDeleteConfirmDialog from './VideoDeleteConfirmDialog.vue';
import ReassignClimberDialog from './ReassignClimberDialog.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const isTouchDevice = computed(() => detectTouchDevice());

const props = defineProps({
  videos: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  location: {
    type: Object,
    default: null
  },
  allRoutesettings: {
    type: Array,
    default: () => []
  },
  boulderProblems: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['video-deleted', 'reprocess-video', 'open-manual-assign', 'routesetting-changed']);

// Video deletion composable
const {
  showDeleteConfirm,
  videoToDelete,
  deleting,
  canDeleteVideo,
  handleDeleteClick,
  cancelDelete,
  confirmDelete: executeDelete,
} = useVideoDelete({
  onSuccess: (deletedVideoId) => {
    // Notify parent component to refresh the video list
    emit('video-deleted', deletedVideoId);
  },
});

const isDeletingAll = ref(false);

// Routesetting change state
const videoToChangeRoutesetting = ref(null);
const availableRoutesettings = computed(() => props.allRoutesettings || []);

// Reassign climber state
const videoToReassign = ref(null);

// Default poster image (gray placeholder with play icon)
const defaultPoster = getDefaultVideoPoster();

const formatDuration = formatVideoDuration;

// Get progress text for a video using shared composable
const getVideoProgressText = (video) => {
  const { progressText } = useVideoProgress(video);
  return progressText.value || 'Processing...';
};

// Normalize upload queue objects to canonical ascent structure
const normalizeToAscent = (video) => {
  // If it's already in ascent format (has video nested object), return as-is
  if (video.video && typeof video.video === 'object') {
    return video;
  }
  
  // Transform flat upload structure to canonical ascent structure
  return {
    ...video,
    video: {
      transcodedPath: video.url || video.downloadUrl || null,
      originalPath: video.url || video.downloadUrl || null,
      thumbnailUrl: video.thumbnailUrl || null,
    },
    problemSnapshot: video.metadata ? {
      name: video.metadata.problemName || null,
      grade: video.metadata.problemGrade || null,
      color: video.metadata.problemColor || null,
    } : null,
    userName: video.uploadedBy || video.userName || 'Unknown',
  };
};

const canReprocessVideo = (video) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Can re-process if:
  // 1. It's the user's video OR user is admin
  // 2. Video is not currently uploading or analyzing
  // Note: Allow re-analysis even if problem is already detected (might be wrong)
  return (
    (video.userId === currentUser.uid || userStore.isAdmin) &&
    !video.isUploading &&
    !video.isAnalyzing
  );
};

const canReassignVideo = (video) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Can reassign if:
  // 1. User is admin OR it's the user's video
  return video.userId === currentUser.uid || userStore.isAdmin;
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

const handleChangeRoutesettingClick = (video) => {
  videoToChangeRoutesetting.value = video;
};

const handleRoutesettingChanged = (videoId) => {
  videoToChangeRoutesetting.value = null;
  emit('routesetting-changed', videoId);
};

const handleReassignClick = (video) => {
  videoToReassign.value = video;
};

const handleClimberReassigned = async (videoId) => {
  videoToReassign.value = null;
  // Reload videos to show updated climber name
  emit('routesetting-changed', videoId);
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

// Computed title for video player (capitalization handled by CSS)
const videoPlayerTitle = computed(() => {
  const problemId = route.query.problemId;
  if (problemId) {
    // Find a video with this problemId to get the problem name
    const problemVideo = props.videos.find(video => video.problemId === problemId);
    if (problemVideo?.metadata?.problemName) {
      return `${problemVideo.metadata.problemName} Videos`;
    }
  }
  // Use location name instead of generic "Beta Videos"
  if (props.location?.name) {
    return `${props.location.name} Videos`;
  }
  return 'Beta Videos';
});

// Function to provide videos to VideoPlayerShorts
const getPlayerVideos = async () => {
  // If videos aren't loaded yet (hard refresh case), fetch them directly
  let allVideos = props.videos;
  if (allVideos.length === 0 && props.location?.id) {
    try {
      allVideos = await videoService.getLocationVideos(props.location.id);
    } catch (error) {
      console.error('Failed to load videos for player:', error);
      return [];
    }
  }
  
  // Get videos that have a URL (local or server)
  let filteredVideos = allVideos.filter(video => video.url || video.downloadUrl);
  
  // If problemId is in query params, filter to only that problem's videos
  // (including the linked partner so all recordings of the same holds are shown)
  const problemId = route.query.problemId;
  if (problemId) {
    const problem = props.boulderProblems.find(p => p.id === problemId);
    const linkedId = problem?.linkedProblemId;
    filteredVideos = filteredVideos.filter(video =>
      video.problemId === problemId || (linkedId && video.problemId === linkedId)
    );
  }
  
  return filteredVideos;
};
</script>
