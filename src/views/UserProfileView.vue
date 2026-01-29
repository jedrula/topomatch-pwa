<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container py-2 sm:py-4">
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
          >
            <template #actions>
              <!-- Delete button (only for video owner) -->
              <button
                v-if="canDeleteVideo(ascent)"
                @click.stop="handleDeleteClick(ascent)"
                class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white text-red-600 rounded-full shadow-sm transition-all z-10"
                :class="[isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100']"
                :aria-label="'Delete video'"
                title="Delete video"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </template>
          </VideoGridItem>
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
        
        <div class="space-y-2">
          <!-- Report Problem Button -->
          <button
            @click="showReporter = true"
            class="w-full flex items-center justify-between py-3 px-4 text-[15px] text-gray-900 hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
          >
            <span class="font-medium">Report Problem</span>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
          
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
    </div>

    <!-- Delete Confirmation Dialog -->
    <VideoDeleteConfirmDialog
      :model-value="showDeleteConfirm"
      :deleting="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Video Player Shorts -->
    <VideoPlayerShorts
      v-if="route.query.videoId"
      :get-videos="getPlayerVideos"
      :title="`${userName}'s Beta Videos`"
      @close="closeVideoPlayer"
    />

    <!-- Diagnostic Reporter -->
    <DiagnosticReporter 
      v-if="showReporter"
      @close="showReporter = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ascentService } from '@/services/ascentService';
import { videoService } from '@/services/videoService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import VideoPlayerShorts from '@/components/VideoPlayerShorts.vue';
import VideoGridItem from '@/components/VideoGridItem.vue';
import DiagnosticReporter from '@/components/DiagnosticReporter.vue';
import VideoDeleteConfirmDialog from '@/components/VideoDeleteConfirmDialog.vue';
import { isTouchDevice as detectTouchDevice } from '@/utils/platform';
import { useVideoDelete } from '@/composables/useVideoDelete';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isTouchDevice = computed(() => detectTouchDevice());

const loading = ref(true);
const loadingMore = ref(false);
const videos = ref([]);
const stats = ref({ totalAscents: 0, videoCount: 0, uniqueProblems: 0 });
const videosPromise = ref(null); // Cache the promise to avoid duplicate API calls
const profileUser = ref(null); // Store other user's data
const pageSize = 8;
const showReporter = ref(false);

// Video deletion composable
const {
  showDeleteConfirm,
  deleting,
  canDeleteVideo,
  handleDeleteClick,
  cancelDelete,
  confirmDelete: executeDelete,
} = useVideoDelete({
  onSuccess: (deletedVideoId) => {
    // Remove from local list
    videos.value = videos.value.filter(v => v.id !== deletedVideoId);
    
    // Update video count in stats
    if (stats.value?.videoCount) {
      stats.value.videoCount = Math.max(0, stats.value.videoCount - 1);
    }
  },
});

// Get userId from route or use current user
const userId = computed(() => route.params.userId || userStore.user?.uid);

// User display info
const userName = computed(() => {
  if (userId.value === userStore.user?.uid) {
    return userStore.user?.displayName || 'You';
  }
  return profileUser.value?.displayName || videos.value[0]?.userName || 'User';
});

const userEmail = computed(() => {
  if (userId.value === userStore.user?.uid) {
    return userStore.user?.email;
  }
  return profileUser.value?.email || null;
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
// Returns all currently loaded videos, waiting for initial load if needed
const getPlayerVideos = async () => {
  if (!userId.value) return [];
  
  // If no loading has started yet, trigger it
  if (!videosPromise.value && videos.value.length === 0) {
    await loadUserData();
  }
  
  // Wait for any ongoing loading to complete
  if (videosPromise.value) {
    await videosPromise.value;
  }
  
  // Return all videos that have been loaded (including from "Show More")
  return videos.value;
};

// Alias for the composable's confirmDelete (for clarity)
const confirmDelete = executeDelete;

// Fetch other user's profile data
const loadProfileUser = async () => {
  if (!userId.value || userId.value === userStore.user?.uid) {
    profileUser.value = null;
    return;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', userId.value));
    if (userDoc.exists()) {
      profileUser.value = { id: userDoc.id, ...userDoc.data() };
    }
  } catch (error) {
    console.error('Error loading profile user:', error);
  }
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

    // Create and store the loading promise
    const loadingPromise = Promise.all([
      loadProfileUser(),
      ascentService.getUserStats(userId.value),
      videoService.getUserVideos(userId.value, pageSize)
    ]);
    
    videosPromise.value = loadingPromise;
    
    const [, statsData, videosData] = await loadingPromise;
    
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
    
    // Create and store the loading promise
    const loadingPromise = videoService.getUserVideos(userId.value, pageSize, videos.value.length);
    videosPromise.value = loadingPromise;
    
    const moreVideos = await loadingPromise;
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
  // Clear cached promise and profile data when userId changes
  videosPromise.value = null;
  profileUser.value = null;
  
  if (newId && videos.value.length === 0) {
    loadUserData();
  }
});
</script>
