<template>
  <div :class="compact ? 'space-y-2' : 'space-y-4'">
    <!-- Ascent Statistics -->
    <div
      v-if="ascentStore.ascentStats"
      :class="[
        'bg-white rounded-lg shadow-sm border border-gray-200',
        compact ? 'p-3' : 'p-6'
      ]"
    >
      <h3 :class="compact ? 'text-base font-semibold text-gray-900 mb-2' : 'text-lg font-semibold text-gray-900 mb-4'">Ascent Statistics</h3>

      <div :class="compact ? 'grid grid-cols-2 gap-2 text-xs' : 'grid grid-cols-2 gap-4 text-sm'">
        <div :class="compact ? 'text-center p-2 bg-gray-50 rounded-lg' : 'text-center p-3 bg-gray-50 rounded-lg'">
          <div :class="compact ? 'text-lg font-bold text-blue-600' : 'text-2xl font-bold text-blue-600'">
            {{ ascentStore.ascentStats.totalAscents }}
          </div>
          <div class="text-gray-600">Total Sends</div>
        </div>
        <div :class="compact ? 'text-center p-2 bg-gray-50 rounded-lg' : 'text-center p-3 bg-gray-50 rounded-lg'">
          <div :class="compact ? 'text-lg font-bold text-green-600' : 'text-2xl font-bold text-green-600'">
            {{ ascentStore.ascentStats.uniqueClimbers }}
          </div>
          <div class="text-gray-600">Climbers</div>
        </div>
      </div>

      <!-- Attempt Type Breakdown -->
      <div v-if="ascentStore.ascentStats.totalAscents > 0" class="mt-4">
        <h4 class="font-medium text-gray-900 mb-2">Send Types</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Flash (1st attempt)</span>
            <div class="flex items-center space-x-2">
              <div class="w-16 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-yellow-500 h-2 rounded-full"
                  :style="{
                    width: `${
                      (ascentStore.ascentStats.attemptTypes.flash /
                        ascentStore.ascentStats.totalAscents) *
                      100
                    }%`,
                  }"
                ></div>
              </div>
              <span class="w-8 text-right">{{ ascentStore.ascentStats.attemptTypes.flash }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">2nd attempt</span>
            <div class="flex items-center space-x-2">
              <div class="w-16 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-orange-500 h-2 rounded-full"
                  :style="{
                    width: `${
                      (ascentStore.ascentStats.attemptTypes.second /
                        ascentStore.ascentStats.totalAscents) *
                      100
                    }%`,
                  }"
                ></div>
              </div>
              <span class="w-8 text-right">{{ ascentStore.ascentStats.attemptTypes.second }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">3rd+ attempts</span>
            <div class="flex items-center space-x-2">
              <div class="w-16 bg-gray-200 rounded-full h-2">
                <div
                  class="bg-red-500 h-2 rounded-full"
                  :style="{
                    width: `${
                      (ascentStore.ascentStats.attemptTypes.multiple /
                        ascentStore.ascentStats.totalAscents) *
                      100
                    }%`,
                  }"
                ></div>
              </div>
              <span class="w-8 text-right">{{
                ascentStore.ascentStats.attemptTypes.multiple
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Average User Grade -->
      <div
        v-if="ascentStore.ascentStats.averageUserGrade"
        class="mt-4 pt-4 border-t border-gray-100"
      >
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Community Grade Opinion</span>
          <span class="font-medium text-gray-900">{{
            ascentStore.ascentStats.averageUserGrade
          }}</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">
          Based on {{ ascentStore.ascentStats.userGrades.length }} user rating{{
            ascentStore.ascentStats.userGrades.length !== 1 ? "s" : ""
          }}
        </p>
      </div>
    </div>

    <!-- Recent Ascents -->
    <div v-if="ascentStore.ascents.length > 0">
      <h3 :class="compact ? 'text-base font-semibold text-gray-900 mb-2' : 'text-lg font-semibold text-gray-900 mb-3'">
        Recent Ascents
      </h3>
      
      <!-- Reuse LocationVideos component -->
      <LocationVideos 
        :videos="ascentVideos" 
        :loading="false"
        @video-click="handleVideoClick"
      />
    </div>

    <!-- No Ascents Yet -->
    <div
      v-else-if="!ascentStore.isLoading"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center"
    >
      <svg
        class="w-12 h-12 text-gray-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        ></path>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No ascents yet</h3>
      <p class="text-gray-500">Be the first to send this problem!</p>
    </div>

    <!-- Loading State -->
    <div
      v-if="ascentStore.isLoading"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading ascents...</p>
    </div>

    <!-- Error State -->
    <div v-if="ascentStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-red-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p class="text-red-700 text-sm">{{ ascentStore.error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAscentStore } from '@/stores/ascentStore';
import LocationVideos from '@/components/LocationVideos.vue';

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
});

const ascentStore = useAscentStore();

const emit = defineEmits(['video-fullscreen']);

// Transform ascents with videos into LocationVideos format
const ascentVideos = computed(() => {
  return ascentStore.ascents
    .filter(ascent => ascent.betaVideo) // Only ascents with videos
    .slice(0, 12) // Limit to 12
    .map(ascent => ({
      id: ascent.id,
      downloadUrl: ascent.betaVideo.downloadUrl,
      metadata: {
        problemName: ascent.userName,
        uploadedBy: ascent.userEmail,
        duration: null, // Duration not stored in ascent
      }
    }));
});

// Handle video click - emit fullscreen with the video URL
const handleVideoClick = (index) => {
  const video = ascentVideos.value[index];
  if (video?.downloadUrl) {
    emit('video-fullscreen', video.downloadUrl);
  }
};
</script>
