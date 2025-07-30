<template>
  <div class="space-y-4">
    <!-- Ascent Statistics -->
    <div
      v-if="ascentStore.ascentStats"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Ascent Statistics</h3>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-center p-3 bg-gray-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {{ ascentStore.ascentStats.totalAscents }}
          </div>
          <div class="text-gray-600">Total Sends</div>
        </div>
        <div class="text-center p-3 bg-gray-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">
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
    <div
      v-if="ascentStore.ascents.length > 0"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Ascents</h3>

      <div class="space-y-3 max-h-64 overflow-y-auto">
        <div
          v-for="ascent in ascentStore.ascents.slice(0, 10)"
          :key="ascent.id"
          class="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-1">
              <span class="font-medium text-gray-900">{{ ascent.userName }}</span>
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-yellow-100 text-yellow-800': ascent.attemptType === 'flash',
                  'bg-orange-100 text-orange-800': ascent.attemptType === 'second',
                  'bg-red-100 text-red-800': ascent.attemptType === 'multiple',
                }"
              >
                {{ ascentStore.getAttemptTypeLabel(ascent.attemptType) }}
              </span>
            </div>

            <div class="text-sm text-gray-600">
              {{ ascentStore.formatDate(ascent.createdAt) }}
            </div>

            <div v-if="ascent.userGrade" class="text-sm text-gray-600">
              Grade opinion: {{ ascent.userGrade }}
            </div>

            <div v-if="ascent.notes" class="text-sm text-gray-700 mt-1">"{{ ascent.notes }}"</div>

            <!-- Beta Video Display -->
            <div v-if="ascent.betaVideo" class="mt-2">
              <div class="bg-black rounded-lg overflow-hidden max-w-xs">
                <video
                  :src="ascent.betaVideo.downloadUrl"
                  controls
                  preload="metadata"
                  class="w-full h-auto max-h-32 object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <p class="text-xs text-gray-500 mt-1">Beta video</p>
            </div>
          </div>

          <!-- Actions for current user's ascents -->
          <div v-if="ascent.userId === userStore.user?.id" class="flex items-center space-x-1 ml-2">
            <button
              @click="editAscent(ascent)"
              class="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit ascent"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                ></path>
              </svg>
            </button>
            <button
              @click="deleteAscent(ascent)"
              class="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete ascent"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="ascentStore.ascents.length > 10" class="mt-3 text-center">
        <p class="text-sm text-gray-500">Showing 10 of {{ ascentStore.ascents.length }} ascents</p>
      </div>
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
import { useAscentStore } from "@/stores/ascentStore";
import { useUserStore } from "@/stores/userStore";
import { watch } from "vue";

const ascentStore = useAscentStore();
const userStore = useUserStore();

const emit = defineEmits(["edit-ascent"]);

// Debug: Watch for changes in ascents
watch(
  () => ascentStore.ascents,
  (newAscents) => {
    console.log("AscentHistory: Ascents updated:", newAscents);
    newAscents.forEach((ascent, index) => {
      if (ascent.betaVideo) {
        console.log(`Ascent ${index} has video:`, ascent.betaVideo);
      }
    });
  },
  { immediate: true, deep: true }
);

const editAscent = (ascent) => {
  emit("edit-ascent", ascent);
};

const deleteAscent = async (ascent) => {
  if (confirm("Are you sure you want to delete this ascent?")) {
    try {
      await ascentStore.deleteAscent(ascent.id);
    } catch (error) {
      console.error("Error deleting ascent:", error);
    }
  }
};
</script>
