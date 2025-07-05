<template>
  <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <svg 
          class="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-800">Offline Downloads</h3>
      </div>
      
      <!-- Status Badge -->
      <div class="flex items-center space-x-2">
        <span 
          v-if="cacheStatus.total > 0"
          class="text-sm text-gray-600"
        >
          {{ cacheStatus.cached }}/{{ cacheStatus.total }} images
        </span>
        <div 
          class="w-3 h-3 rounded-full"
          :class="statusIndicatorClass"
          :title="statusTooltip"
        ></div>
      </div>
    </div>

    <!-- Description -->
    <p class="text-sm text-gray-600 mb-4">
      Download this region's images for offline use. Perfect for areas with poor network coverage.
    </p>

    <!-- Progress Bar (when downloading) -->
    <div v-if="isDownloading" class="mb-4">
      <div class="flex justify-between text-sm mb-1">
        <span class="text-gray-700">Downloading images...</span>
        <span class="text-gray-600">{{ downloadProgress.current }}/{{ downloadProgress.total }}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex space-x-3">
      <!-- Download Button -->
      <button
        v-if="!isFullyCached && !isDownloading"
        @click="downloadRegion"
        class="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        :disabled="isDownloading"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{{ isPartiallyCached ? 'Complete Download' : 'Download for Offline' }}</span>
      </button>

      <!-- Downloaded Indicator -->
      <div
        v-if="isFullyCached && !isDownloading"
        class="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="font-medium">Downloaded</span>
      </div>

      <!-- Cancel Button -->
      <button
        v-if="isDownloading"
        @click="cancelDownload"
        class="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>Cancel</span>
      </button>

      <!-- Remove Downloads Button -->
      <button
        v-if="cacheStatus.cached > 0 && !isDownloading"
        @click="removeDownloads"
        class="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Remove Downloads</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { imageCacheService } from '@/services/imageCacheService'

const props = defineProps({
  regionId: {
    type: String,
    required: true
  },
  imagePaths: {
    type: Array,
    required: true
  }
})

const cacheStatus = ref({ cached: 0, total: 0 })
const downloadProgress = ref({ current: 0, total: 0 })
const isDownloading = ref(false)
const downloadController = ref(null)

// Computed properties
const isFullyCached = computed(() => 
  cacheStatus.value.total > 0 && cacheStatus.value.cached === cacheStatus.value.total
)

const isPartiallyCached = computed(() => 
  cacheStatus.value.cached > 0 && cacheStatus.value.cached < cacheStatus.value.total
)

const progressPercentage = computed(() => {
  if (downloadProgress.value.total === 0) return 0
  return (downloadProgress.value.current / downloadProgress.value.total) * 100
})

const statusIndicatorClass = computed(() => {
  if (isDownloading.value) return 'bg-blue-500 animate-pulse'
  if (isFullyCached.value) return 'bg-green-500'
  if (isPartiallyCached.value) return 'bg-yellow-500'
  return 'bg-gray-300'
})

const statusTooltip = computed(() => {
  if (isDownloading.value) return 'Downloading...'
  if (isFullyCached.value) return 'Fully downloaded'
  if (isPartiallyCached.value) return 'Partially downloaded'
  return 'Not downloaded'
})

// Methods
const updateCacheStatus = async () => {
  if (props.imagePaths.length === 0) return
  
  try {
    const status = await imageCacheService.getCacheStatus(props.imagePaths)
    cacheStatus.value = status
  } catch (error) {
    console.error('Error checking cache status:', error)
  }
}

const downloadRegion = async () => {
  if (isDownloading.value) return
  
  isDownloading.value = true
  downloadProgress.value = { current: 0, total: props.imagePaths.length }
  downloadController.value = new AbortController()
  
  try {
    await imageCacheService.cacheRegionImages(
      props.imagePaths,
      (current, total) => {
        downloadProgress.value = { current, total }
      },
      downloadController.value.signal
    )
    
    // Update cache status
    await updateCacheStatus()
    
    console.log(`Successfully downloaded ${props.regionId} for offline use`)
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Download cancelled by user')
    } else {
      console.error('Error downloading region:', error)
    }
  } finally {
    isDownloading.value = false
    downloadController.value = null
  }
}

const cancelDownload = () => {
  if (downloadController.value) {
    downloadController.value.abort()
  }
}

const removeDownloads = async () => {
  if (confirm(`Remove all downloaded images for ${props.regionId}? You'll need to re-download them for offline use.`)) {
    try {
      await imageCacheService.removeCachedImages(props.imagePaths)
      await updateCacheStatus()
      console.log(`Removed downloads for ${props.regionId}`)
    } catch (error) {
      console.error('Error removing downloads:', error)
    }
  }
}

// Watchers
watch(() => props.imagePaths, updateCacheStatus, { immediate: false })

// Lifecycle
onMounted(async () => {
  // Small delay to ensure everything is properly initialized
  await new Promise(resolve => setTimeout(resolve, 100));
  await updateCacheStatus();
  
  // Listen for cache refresh events
  imageCacheService.addEventListener('cacheRefresh', updateCacheStatus);
});

// Cleanup event listeners
onUnmounted(() => {
  imageCacheService.removeEventListener('cacheRefresh', updateCacheStatus);
});
</script>
