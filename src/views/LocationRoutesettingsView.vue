<template>
  <div class="min-h-screen pb-20">
    <ToastNotification />

    <div class="container py-2 sm:py-4">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="mb-6 flex items-center gap-2 text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to {{ location?.name }}
      </button>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md mb-6">
        {{ error }}
      </div>

      <!-- Content -->
      <div v-else class="space-y-6">
        <!-- Header -->
        <div class="card">
          <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            Routesetting History
          </h1>
          <p class="text-[14px] text-gray-600">
            Manage routesetting versions for {{ location?.name }}
          </p>
        </div>

        <!-- Currently Viewing Routesetting -->
        <div v-if="allRoutesettings.length > 0 && viewingRoutesetting" class="card border-blue-200/60 bg-blue-50/30">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-[12px] text-blue-700 font-medium mb-1">Currently Viewing</div>
              <div class="text-[16px] font-semibold text-blue-900">
                {{ formatDate(viewingRoutesetting) }}
                <span v-if="viewingRoutesetting === allRoutesettings[0]" class="ml-2 text-[11px] text-green-600 font-medium">(Latest)</span>
              </div>
            </div>
            <button
              @click="viewRoutesetting(viewingRoutesetting)"
              class="h-9 px-4 text-[13px] text-blue-700 border border-blue-700 rounded-md hover:bg-blue-100 transition-all"
            >
              View
            </button>
          </div>
        </div>

        <!-- All Routesettings -->
        <div v-if="otherRoutesettings.length > 0" class="space-y-3">
          <h2 class="text-[15px] font-semibold text-gray-900">
            {{ viewingRoutesetting ? 'Other Routesettings' : 'All Routesettings' }}
          </h2>
          <div class="space-y-2">
            <div
              v-for="setting in otherRoutesettings"
              :key="setting"
              class="card hover:bg-gray-50/50 transition-all"
              :class="{
                'border-green-200 bg-green-50/20': setting === allRoutesettings[0] && setting !== viewingRoutesetting
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    :class="{
                      'bg-green-100': setting === allRoutesettings[0] && setting !== viewingRoutesetting,
                      'bg-gray-100': setting !== allRoutesettings[0] || setting === viewingRoutesetting
                    }"
                  >
                    <svg v-if="setting === allRoutesettings[0] && setting !== viewingRoutesetting" class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span v-else class="text-[12px] text-gray-600 font-medium">{{ allRoutesettings.indexOf(setting) + 1 }}</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <div class="text-[14px] font-medium text-gray-900">
                        {{ formatDate(setting) }}
                      </div>
                      <span v-if="setting === allRoutesettings[0] && setting !== viewingRoutesetting" class="text-[11px] text-green-600 font-medium">(Latest)</span>
                    </div>
                    <div class="text-[12px] text-gray-500 mt-0.5">
                      {{ getRelativeTime(setting) }}
                    </div>
                  </div>
                </div>
                <button
                  @click="viewRoutesetting(setting)"
                  class="h-8 px-3 text-[13px] text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-all"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Routesettings State -->
        <div v-if="allRoutesettings.length === 0" class="card text-center py-12">
          <svg class="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-[14px] text-gray-600">
            No routesettings yet. Create one to get started.
          </p>
        </div>

        <!-- Admin: Create New Routesetting -->
        <div v-if="userStore.canEditLocations && !showCreateForm" class="card">
          <button
            @click="openCreateForm"
            class="w-full h-10 px-4 text-[14px] text-blue-600 border-2 border-blue-600 border-dashed rounded-md hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Routesetting
          </button>
        </div>

        <!-- Create Form -->
        <div v-if="showCreateForm" class="card">
          <h3 class="text-[16px] font-semibold text-gray-900 mb-5">Create New Routesetting</h3>
          
          <div class="space-y-5">
            <div>
              <label class="block text-[13px] font-medium text-gray-700 mb-2">Setting Date & Time</label>
              <input
                v-model="newSettingDate"
                type="datetime-local"
                class="input"
                :max="todayWithTime"
              />
            </div>

            <!-- Image Selection -->
            <div v-if="availableImages.length" class="border-t border-gray-200/60 pt-5">
              <label class="block text-[13px] font-medium text-gray-700 mb-2">
                Carry forward images <span class="text-gray-500">({{ selectedImageIds.length }}/{{ availableImages.length }})</span>
              </label>
              <div class="text-[12px] text-gray-500 mb-3">
                Select which images from the current routesetting are still relevant
              </div>
              
              <!-- Select All / Deselect All -->
              <div class="flex gap-3 mb-3">
                <button
                  @click="selectAllImages"
                  type="button"
                  class="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <span class="text-gray-300">|</span>
                <button
                  @click="deselectAllImages"
                  type="button"
                  class="text-[12px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Deselect All
                </button>
              </div>

              <!-- Image Grid -->
              <div class="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto bg-gray-50 p-2 rounded-md border border-gray-200/60">
                <div
                  v-for="image in availableImages"
                  :key="image.imageId"
                  @click="toggleImageSelection(image.imageId)"
                  class="relative aspect-square cursor-pointer border-2 rounded-md overflow-hidden transition-all"
                  :class="{
                    'border-blue-500 ring-2 ring-blue-200': selectedImageIds.includes(image.imageId),
                    'border-gray-200 hover:border-gray-300': !selectedImageIds.includes(image.imageId)
                  }"
                >
                  <img
                    :src="image.url"
                    :alt="image.name"
                    crossorigin="anonymous"
                    class="w-full h-full object-cover"
                    :class="{ 'opacity-50': !selectedImageIds.includes(image.imageId) }"
                  />
                  <!-- Checkmark overlay -->
                  <div
                    v-if="selectedImageIds.includes(image.imageId)"
                    class="absolute top-1 right-1"
                  >
                    <div class="bg-blue-600 rounded-full p-0.5 shadow-md">
                      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                @click="createRoutesetting"
                :disabled="!newSettingDate || isCreating"
                class="btn flex-1"
              >
                {{ isCreating ? 'Creating...' : 'Create Routesetting' }}
              </button>
              <button
                @click="cancelCreate"
                class="btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import { routesettingService } from '@/services/routesettingService';
import { locationService } from '@/services/locationService';
import ToastNotification from '@/components/ToastNotification.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const locationId = computed(() => route.params.locationId);

const location = ref(null);
const allRoutesettings = ref([]);
const viewingRoutesetting = computed(() => route.query.routesetting || null);
const isLoading = ref(true);
const error = ref('');
const showCreateForm = ref(false);
const newSettingDate = ref('');
const isCreating = ref(false);
const selectedImageIds = ref([]);
const availableImages = ref([]);

const otherRoutesettings = computed(() => {
  // Show all routesettings except the one currently being viewed
  return allRoutesettings.value.filter(s => s !== viewingRoutesetting.value);
});

const todayWithTime = computed(() => {
  return new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
});

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function goBack() {
  router.push({
    path: `/location/${locationId.value}`,
    query: viewingRoutesetting.value ? { routesetting: viewingRoutesetting.value } : {}
  });
}

function viewRoutesetting(routesetting) {
  router.push({
    path: `/location/${locationId.value}`,
    query: { routesetting }
  });
}

async function openCreateForm() {
  showCreateForm.value = true;
  await loadCurrentImages();
}

function cancelCreate() {
  showCreateForm.value = false;
  newSettingDate.value = '';
  selectedImageIds.value = [];
  availableImages.value = [];
}

async function loadCurrentImages() {
  try {
    // Load images for latest routesetting (if exists)
    if (allRoutesettings.value.length === 0) {
      availableImages.value = [];
      selectedImageIds.value = [];
      return;
    }
    
    const latestRoutesetting = allRoutesettings.value[0];
    const images = await locationService.getLocationImages(locationId.value, latestRoutesetting);
    availableImages.value = images.map(img => ({
      imageId: img.imageId,
      url: img.downloadUrl,
      name: img.fileName
    }));
    // By default, no images selected (user must explicitly choose)
    selectedImageIds.value = [];
  } catch (error) {
    console.error('Error loading current images:', error);
    availableImages.value = [];
    selectedImageIds.value = [];
  }
}

function toggleImageSelection(imageId) {
  const index = selectedImageIds.value.indexOf(imageId);
  if (index > -1) {
    selectedImageIds.value.splice(index, 1);
  } else {
    selectedImageIds.value.push(imageId);
  }
}

function selectAllImages() {
  selectedImageIds.value = availableImages.value.map(img => img.imageId);
}

function deselectAllImages() {
  selectedImageIds.value = [];
}

async function createRoutesetting() {
  if (!newSettingDate.value) return;
  
  isCreating.value = true;
  try {
    await routesettingService.createRoutesetting(
      locationId.value,
      newSettingDate.value,
      { 
        imageIds: selectedImageIds.value
      }
    );
    
    // Reload routesettings and switch to new one
    await loadRoutesettings();
    viewRoutesetting(newSettingDate.value);
  } catch (error) {
    console.error('Error creating routesetting:', error);
    alert('Failed to create routesetting: ' + error.message);
  } finally {
    isCreating.value = false;
  }
}

async function loadRoutesettings() {
  try {
    allRoutesettings.value = await routesettingService.getRoutesettings(locationId.value);
  } catch (err) {
    console.error('Error loading routesettings:', err);
    error.value = 'Failed to load routesettings';
  }
}

onMounted(async () => {
  try {
    isLoading.value = true;
    
    // Load location info
    location.value = await locationService.getLocation(locationId.value);
    
    // Load routesettings
    await loadRoutesettings();
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = 'Failed to load location data';
  } finally {
    isLoading.value = false;
  }
});
</script>
