<template>
  <div>
    <!-- Header -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-1">
        <svg class="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h2 class="section-header">Trending this week</h2>
      </div>
      <p class="text-[13px] text-gray-600">Most liked recent videos</p>
    </div>

    <!-- Content -->
    <div>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="mx-auto w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-3"></div>
        <p class="text-[13px] text-gray-500">Loading trending videos...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="ascents.length === 0" class="text-center py-12">
        <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No trending videos yet</h3>
        <p class="text-[13px] text-gray-500 max-w-sm mx-auto">
          Be the first to upload and share climbing videos!
        </p>
      </div>

      <!-- Videos grid -->
      <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        <VideoGridItem
          v-for="(ascent, index) in ascents"
          :key="ascent.id"
          :ascent="ascent"
          @click="openVideoPlayer(index)"
        />
      </div>
    </div>

    <!-- Video Player Modal -->
    <VideoPlayerShorts
      v-if="route.query.videoId && !loading && ascents.length > 0"
      :get-videos="getPlayerVideos"
      :initial-video-id="route.query.videoId"
      :title="'Trending Videos'"
      @close="closeVideoPlayer"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ascentService } from '@/services/ascentService';
import { getVideoUrlFromAscent } from '@/services/videoService';
import VideoPlayerShorts from './VideoPlayerShorts.vue';
import VideoGridItem from './VideoGridItem.vue';

const route = useRoute();
const router = useRouter();

const ascents = ref([]);
const loading = ref(true);

// Transform ascents to video format for VideoPlayerShorts
const videosForPlayer = computed(() => {
  return ascents.value.map(ascent => {
    const videoUrl = getVideoUrlFromAscent(ascent.video);
    
    return {
      id: ascent.id,
      url: videoUrl,
      downloadUrl: videoUrl,
      thumbnailBase64: ascent.video.thumbnailBase64,
      name: ascent.problemSnapshot?.name || 'Untitled', // Changed from title to name
      locationId: ascent.locationId,
      problemId: ascent.problemId,
      uploadedBy: ascent.userName, // Changed from userName to uploadedBy
      userId: ascent.userId,
      uploadedAt: ascent.date?.toDate?.() || ascent.date, // Changed from date to uploadedAt
      likeCount: ascent.likeCount || 0,
      likedByUserIds: ascent.likedByUserIds || [],
      commentCount: ascent.commentCount || 0,
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
  const video = videosForPlayer.value[index];
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
  // Remove videoId from URL when closing player
  const query = { ...route.query };
  delete query.videoId;
  router.push({ query });
};
onMounted(loadTrendingAscents);
</script>
