<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container py-6 sm:py-8">
      <!-- Profile Header -->
      <div class="mb-8">
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
        <div class="grid grid-cols-3 gap-4 pt-6">
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
      <div>
        <h2 class="section-header mb-4">
          Beta videos
          <span v-if="!loading && videoCount > 0" class="section-header-count ml-1.5">({{ videoCount }})</span>
        </h2>
        
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
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <VideoGridItem
            v-for="ascent in videos"
            :key="ascent.ascentId || ascent.id"
            :ascent="ascent"
            @click="() => openVideoPlayer(ascent.ascentId || ascent.id)"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="!loading && videos.length > 0 && videos.length < videoCount" class="text-center py-6">
          <button 
            @click="loadMore"
            :disabled="loadingMore"
            class="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loadingMore ? 'Loading...' : 'Show More' }}
          </button>
        </div>
      </div>

      <!-- Account Settings (iOS style) -->
      <div class="mt-8">
        <h2 class="section-header mb-4">Account</h2>
        
        <!-- Logout Button -->
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-between py-3 px-4 text-[15px] text-red-600 hover:bg-red-50 transition-colors rounded-lg border border-red-100"
        >
          <span class="font-medium">Log Out</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
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
import { ref, computed, onMounted, watch } from 'vue';
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
const loadingMore = ref(false);
const videos = ref([]);
const stats = ref({ totalAscents: 0, videoCount: 0, uniqueProblems: 0 });
const videosPromise = ref(null); // Cache the promise to avoid duplicate API calls
const pageSize = 8;


// Get userId from route or use current user
const userId = computed(() => route.params.userId || userStore.user?.uid);

// User display info
const userName = computed(() => {
  if (userId.value === userStore.user?.uid) {
    return userStore.user?.displayName || 'You';
  }
  // TODO: Fetch user data for other users
  return videos.value[0]?.userName || 'User';
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
const totalAscents = computed(() => stats.value.totalAscents);
const videoCount = computed(() => stats.value.videoCount);
const uniqueProblems = computed(() => stats.value.uniqueProblems);

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
// Reuses cached promise to avoid duplicate API calls
const getPlayerVideos = async () => {
  if (!userId.value) return [];
  
  // Reuse existing promise if available
  if (videosPromise.value) {
    return await videosPromise.value;
  }
  
  // Create and cache the promise (fetch first page)
  videosPromise.value = videoService.getUserVideos(userId.value, pageSize);
  return await videosPromise.value;
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

    // Create the videos promise if not already cached
    if (!videosPromise.value) {
      videosPromise.value = videoService.getUserVideos(userId.value, pageSize);
    }

    // Load stats and wait for videos (reusing cached promise)
    const [statsData, videosData] = await Promise.all([
      ascentService.getUserStats(userId.value),
      videosPromise.value
    ]);
    
    stats.value = statsData;
    videos.value = videosData;

  } catch (error) {
    console.error('Error loading user data:', error);
  } finally {
    loading.value = false;
  }
};

// Load more videos
const loadMore = async () => {
  if (loadingMore.value || videos.value.length >= videoCount.value) return;
  
  try {
    loadingMore.value = true;
    const moreVideos = await videoService.getUserVideos(userId.value, pageSize, videos.value.length);
    videos.value = [...videos.value, ...moreVideos];
  } catch (error) {
    console.error('Error loading more videos:', error);
  } finally {
    loadingMore.value = false;
  }
};

// Logout handler
const handleLogout = async () => {
  try {
    await userStore.signOut();
    router.push('/');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

onMounted(() => {
  if (userId.value) {
    loadUserData();
  }
});

// Watch userId for when auth initializes on page load
watch(userId, (newId) => {
  // Clear cached promise when userId changes
  videosPromise.value = null;
  
  if (newId && videos.value.length === 0) {
    loadUserData();
  }
});
</script>
