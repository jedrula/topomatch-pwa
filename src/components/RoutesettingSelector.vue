<template>
  <div class="routesetting-selector">
    <!-- Current Routesetting Display -->
    <div class="card border-blue-200/60 bg-blue-50/30">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <div class="text-[12px] text-blue-600 font-medium">Current Routesetting</div>
            <div class="text-[14px] font-semibold text-blue-900 mt-0.5">
              {{ currentRoutesetting ? formatDate(currentRoutesetting) : 'None' }}
              <span v-if="isLatest" class="ml-2 text-[11px] text-green-600 font-medium">(Latest)</span>
            </div>
          </div>
        </div>
        
        <!-- View History button -->
        <button
          v-if="allRoutesettings.length > 1"
          @click="showSelector = !showSelector"
          class="h-8 px-3 text-[13px] text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-all"
        >
          {{ showSelector ? 'Cancel' : 'View History' }}
        </button>
      </div>

      <!-- Selector Dropdown -->
      <div v-if="showSelector && allRoutesettings.length > 1" class="mt-4 space-y-2">
        <div class="text-[12px] text-blue-600 font-medium mb-2">Routesetting History:</div>
        <button
          v-for="setting in otherRoutesettings"
          :key="setting"
          @click="viewRoutesetting(setting)"
          class="w-full text-left px-3 py-2.5 bg-white border border-blue-200/60 rounded-md hover:bg-blue-50/50 transition-all active:scale-[0.99]"
        >
          <div class="text-[14px] font-medium text-gray-900">{{ formatDate(setting) }}</div>
        </button>
      </div>
    </div>

    <!-- Admin: Create New Routesetting -->
    <div v-if="canEdit && !showCreateForm" class="mt-3">
      <button
        @click="openCreateForm"
        class="w-full h-9 px-4 text-[13px] text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create New Routesetting
      </button>
    </div>

    <!-- Create Form -->
    <div v-if="showCreateForm" class="mt-3 card">
      <h3 class="text-[15px] font-semibold text-gray-900 mb-4">Create New Routesetting</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-[13px] font-medium text-gray-700 mb-1.5">Setting Date & Time</label>
          <input
            v-model="newSettingDate"
            type="datetime-local"
            class="input"
            :max="todayWithTime"
          />
        </div>

        <!-- Image Selection -->
        <div v-if="availableImages.length" class="border-t border-gray-200/60 pt-4">
          <label class="block text-[13px] font-medium text-gray-700 mb-1">
            Select images to carry forward <span class="text-gray-500">({{ selectedImageIds.length }}/{{ availableImages.length }})</span>
          </label>
          <div class="text-[12px] text-gray-500 mb-3">
            Choose which images are still relevant for the new routesetting
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
          <div class="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-gray-50 p-2 rounded-md border border-gray-200/60">
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

        <div class="flex gap-2 pt-2">
          <button
            @click="createRoutesetting"
            :disabled="!newSettingDate || isCreating"
            class="btn flex-1"
          >
            {{ isCreating ? 'Creating...' : 'Create' }}
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
</template>

<script setup>
import { ref, computed } from 'vue';
import { routesettingService } from '@/services/routesettingService';
import { locationService } from '@/services/locationService';

const props = defineProps({
  locationId: {
    type: String,
    required: true
  },
  allRoutesettings: {
    type: Array,
    required: true
  },
  currentRoutesetting: {
    type: String,
    default: null
  },
  canEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['routesetting-changed']);

const showSelector = ref(false);
const showCreateForm = ref(false);
const newSettingDate = ref('');
const isCreating = ref(false);
const selectedImageIds = ref([]);
const availableImages = ref([]);

// Check if current routesetting is the latest one
const isLatest = computed(() => {
  if (!props.currentRoutesetting || props.allRoutesettings.length === 0) return false;
  // Array is sorted newest first, so first item is latest
  return props.currentRoutesetting === props.allRoutesettings[0];
});

const todayWithTime = computed(() => {
  return new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
});

const otherRoutesettings = computed(() => {
  return props.allRoutesettings.filter(s => s !== props.currentRoutesetting);
});

function formatDate(dateStr) {
  // All routesettings now use ISO timestamp format (YYYY-MM-DDTHH:mm:ss)
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function viewRoutesetting(routesetting) {
  showSelector.value = false;
  emit('routesetting-changed', routesetting);
}

async function createRoutesetting() {
  if (!newSettingDate.value) return;
  
  isCreating.value = true;
  try {
    await routesettingService.createRoutesetting(
      props.locationId,
      newSettingDate.value,
      { 
        imageIds: selectedImageIds.value // Pass selected images to add to new routesetting
      }
    );
    
    // Emit event so parent reloads routesettings and switches to new one
    emit('routesetting-changed', newSettingDate.value);
    
    cancelCreate();
  } catch (error) {
    console.error('Error creating routesetting:', error);
    alert('Failed to create routesetting: ' + error.message);
  } finally {
    isCreating.value = false;
  }
}

function cancelCreate() {
  showCreateForm.value = false;
  newSettingDate.value = '';
  selectedImageIds.value = [];
  availableImages.value = [];
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

async function loadCurrentImages() {
  try {
    // Load images for current routesetting (if exists)
    if (!props.currentRoutesetting) {
      availableImages.value = [];
      selectedImageIds.value = [];
      return;
    }
    
    const images = await locationService.getLocationImages(props.locationId, props.currentRoutesetting);
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

async function openCreateForm() {
  showCreateForm.value = true;
  await loadCurrentImages();
}
</script>

<style scoped>
.routesetting-selector {
  /* Component-specific styles if needed */
}
</style>
