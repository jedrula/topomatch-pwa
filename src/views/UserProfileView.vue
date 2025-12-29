<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container py-6 sm:py-8">
      <!-- Profile Header -->
      <div class="card mb-6">
        <div class="flex items-center gap-4 mb-6">
          <!-- User Avatar/Initial -->
          <div class="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-semibold">
            {{ userInitial }}
          </div>
          
          <!-- User Info -->
          <div>
            <h1 class="text-[20px] font-semibold text-gray-900">{{ userName }}</h1>
            <p v-if="userEmail" class="text-[13px] text-gray-600 mt-0.5">{{ userEmail }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200/60">
          <div class="text-center">
            <div class="text-[24px] font-semibold text-gray-900">{{ totalAscents }}</div>
            <div class="text-[13px] text-gray-600 mt-0.5">Total Sends</div>
          </div>
          <div class="text-center">
            <div class="text-[24px] font-semibold text-gray-900">{{ videoCount }}</div>
            <div class="text-[13px] text-gray-600 mt-0.5">Beta Videos</div>
          </div>
          <div class="text-center">
            <div class="text-[24px] font-semibold text-gray-900">{{ uniqueProblems }}</div>
            <div class="text-[13px] text-gray-600 mt-0.5">Problems</div>
          </div>
        </div>
      </div>

      <!-- Beta Videos Section -->
      <div class="card">
        <div class="pb-4 border-b border-gray-200/60 mb-4">
          <h2 class="text-[15px] font-semibold text-gray-900">Beta Videos</h2>
          <p v-if="!loading && videos.length > 0" class="text-[13px] text-gray-600 mt-0.5">
            {{ videos.length }} {{ videos.length === 1 ? 'video' : 'videos' }}
          </p>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-gray-600 text-[13px]">Loading videos...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="videos.length === 0" class="text-center py-12">
          <div class="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-[15px] font-semibold text-gray-900 mb-1">No beta videos yet</h3>
          <p class="text-gray-600 text-[13px]">Start recording your sends!</p>
        </div>

        <!-- Video Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <VideoGridItem
            v-for="(video, index) in videos"
            :key="video.id"
            :video-url="video.downloadUrl"
            :thumbnail-url="video.thumbnailBase64 || defaultPoster"
            :problem-name="video.problemName"
            :problem-grade="video.metadata?.problemGrade"
            :user-name="userName"
            :like-count="video.likeCount || 0"
            @click="openVideoPlayer(video.id)"
          />
        </div>
      </div>
    </div>

    <!-- Video Player Shorts -->
    <VideoPlayerShorts
      v-if="route.query.videoId"
      :get-videos="getPlayerVideos"
      :title="`${userName}'s Beta Videos`"
      @close="closeVideoPlayer"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ascentService } from '@/services/ascentService';
import { videoService } from '@/services/videoService';
import { getDefaultVideoPoster } from '@/utils/videoUtils';
import VideoPlayerShorts from '@/components/VideoPlayerShorts.vue';
import VideoGridItem from '@/components/VideoGridItem.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const videos = ref([]);
const ascents = ref([]);

// Default poster image (gray placeholder with play icon)
const defaultPoster = getDefaultVideoPoster();

// Get userId from route or use current user
const userId = computed(() => route.params.userId || userStore.user?.uid);

// User display info
const userName = computed(() => {
  if (userId.value === userStore.user?.uid) {
    return userStore.user?.displayName || 'You';
  }
  // TODO: Fetch user data for other users
  return ascents.value[0]?.userName || 'User';
});

const userEmail = computed(() => {
  if (userId.value === userStore.user?.uid) {
    return userStore.user?.email;
  }
  return null;
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

// Stats
const totalAscents = computed(() => ascents.value.length);
const videoCount = computed(() => videos.value.length);
const uniqueProblems = computed(() => {
  const problemIds = new Set(ascents.value.map(a => a.problemId));
  return problemIds.size;
});

// Video player handlers
const openVideoPlayer = (videoId) => {
  router.push({
    query: {
      ...route.query,
      videoId,
    },
  });
};

const closeVideoPlayer = () => {
  const query = { ...route.query };
  delete query.videoId;
  router.push({ query });
};

// Function to provide videos to VideoPlayerShorts
const getPlayerVideos = async () => {
  return videos.value;
};

// Format date for display
const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Load user's ascents and videos
const loadUserData = async () => {
  if (!userId.value) {
    console.warn('No userId available');
    loading.value = false;
    return;
  }

  try {
    loading.value = true;

    // Load ascents and videos in parallel
    const [ascentsData, videosData] = await Promise.all([
      ascentService.getUserAscents(userId.value),
      videoService.getUserVideos(userId.value)
    ]);

    ascents.value = ascentsData;
    videos.value = videosData;

  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUserData();
});
</script>
