<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-7xl mx-auto p-4">
      <!-- Profile Header -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-center gap-4">
          <!-- User Avatar/Initial -->
          <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {{ userInitial }}
          </div>
          
          <!-- User Info -->
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ userName }}</h1>
            <p class="text-gray-600">{{ userEmail }}</p>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ totalAscents }}</div>
            <div class="text-sm text-gray-600">Total Sends</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ videoCount }}</div>
            <div class="text-sm text-gray-600">Beta Videos</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ uniqueProblems }}</div>
            <div class="text-sm text-gray-600">Problems</div>
          </div>
        </div>
      </div>

      <!-- Beta Videos Section -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Beta Videos</h2>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading videos...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="videos.length === 0" class="text-center py-12">
          <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No beta videos yet</h3>
          <p class="text-gray-600">Start recording your sends!</p>
        </div>

        <!-- Video Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="(video, index) in videos"
            :key="video.id"
            class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer"
            @click="openVideoGallery(index)"
          >
            <video
              :src="video.downloadUrl"
              class="w-full h-full object-cover"
              muted
              preload="metadata"
            />

            <!-- Play button overlay -->
            <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
              <div class="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-6 h-6 text-gray-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <!-- Video info overlay -->
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
              <p class="text-white text-sm font-medium truncate">{{ video.problemName }}</p>
              <p class="text-white text-xs opacity-75">{{ formatDate(video.uploadedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Gallery Modal -->
    <VideoGallery
      :videos="videos"
      :initial-index="videoGalleryIndex"
      :is-open="isVideoGalleryOpen"
      @close="closeVideoGallery"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { ascentService } from '@/services/ascentService';
import { videoService } from '@/services/videoService';
import VideoGallery from '@/components/VideoGallery.vue';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(true);
const videos = ref([]);
const ascents = ref([]);
const isVideoGalleryOpen = ref(false);
const videoGalleryIndex = ref(0);

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

// Video gallery handlers
const openVideoGallery = (index) => {
  videoGalleryIndex.value = index;
  isVideoGalleryOpen.value = true;
};

const closeVideoGallery = () => {
  isVideoGalleryOpen.value = false;
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
