<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <!-- Header -->
    <div class="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h2 class="text-base sm:text-lg font-semibold text-gray-900">Trending This Week</h2>
      </div>
      <p class="text-sm text-gray-600 mt-1">Most liked videos from the last 2 weeks</p>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-6 pt-3 sm:pt-4">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <div class="mx-auto w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 text-sm">Loading trending videos...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="ascents.length === 0" class="text-center py-8">
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
        <h3 class="text-lg font-medium text-gray-900 mb-2">No trending videos yet</h3>
        <p class="text-gray-500 text-sm max-w-sm mx-auto">
          Be the first to upload and share climbing videos!
        </p>
      </div>

      <!-- Videos grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <VideoGridItem
          v-for="(video, index) in videosForPlayer"
          :key="video.id"
          :video-url="video.downloadUrl"
          :thumbnail-url="video.thumbnailBase64"
          :problem-name="video.problemSnapshot?.name"
          :problem-grade="video.problemSnapshot?.grade"
          :user-name="video.userName"
          :like-count="video.likeCount"
          @click="openVideoPlayer(index)"
        />
      </div>
    </div>

    <!-- Video Player Modal -->
    <VideoPlayerShorts
      v-if="showVideoPlayer"
      :get-videos="getPlayerVideos"
      :initial-video-id="videosForPlayer[currentVideoIndex]?.id"
      :title="'Trending Videos'"
      @close="closeVideoPlayer"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ascentService } from '@/services/ascentService';
import { getVideoUrlFromAscent } from '@/services/videoService';
import VideoPlayerShorts from './VideoPlayerShorts.vue';
import VideoGridItem from './VideoGridItem.vue';

const ascents = ref([]);
const loading = ref(true);
const showVideoPlayer = ref(false);
const currentVideoIndex = ref(0);

// Transform ascents to video format for VideoPlayerShorts
const videosForPlayer = computed(() => {
  return ascents.value.map(ascent => {
    const videoUrl = getVideoUrlFromAscent(ascent.video);
    
    return {
      id: ascent.id,
      url: videoUrl,
      downloadUrl: videoUrl,
      thumbnailBase64: ascent.video.thumbnailBase64,
      title: ascent.problemSnapshot?.name || 'Untitled',
      locationId: ascent.locationId,
      problemId: ascent.problemId,
      userName: ascent.userName,
      userId: ascent.userId,
      date: ascent.date,
      likeCount: ascent.likeCount || 0,
      likedByUserIds: ascent.likedByUserIds || [],
      problemSnapshot: ascent.problemSnapshot,
      userGrade: ascent.userGrade,
      attemptType: ascent.attemptType,
      notes: ascent.notes,
    };
  });
});

const loadTrendingAscents = async () => {
  try {
    loading.value = true;
    const data = await ascentService.getTrendingAscents(8); // Show top 8
    ascents.value = data;
  } catch (error) {
    console.error('Error loading trending ascents:', error);
  } finally {
    loading.value = false;
  }
};

const getPlayerVideos = async () => {
  // Return the videos array for VideoPlayerShorts
  return videosForPlayer.value;
};

const openVideoPlayer = (index) => {
  currentVideoIndex.value = index;
  showVideoPlayer.value = true;
};

const closeVideoPlayer = () => {
  showVideoPlayer.value = false;
};
onMounted(loadTrendingAscents);
</script>
