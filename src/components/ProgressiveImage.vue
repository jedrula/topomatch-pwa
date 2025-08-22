<template>
  <div class="relative overflow-hidden">
    <!-- Blur placeholder (small thumbnail) -->
    <img
      v-if="thumbnailSrc && !isFullImageLoaded"
      :src="thumbnailSrc"
      :alt="alt"
      class="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110 transition-opacity duration-300"
      :class="{ 'opacity-0': isFullImageLoaded }"
    />
    
    <!-- Loading skeleton -->
    <div
      v-if="!thumbnailSrc && !isFullImageLoaded"
      class="absolute inset-0 bg-gray-200 animate-pulse"
    />
    
    <!-- Full resolution image -->
    <img
      v-show="isFullImageLoaded"
      :src="fullSrc"
      :alt="alt"
      :class="imageClass"
      @load="onFullImageLoad"
      @error="onImageError"
      loading="lazy"
    />
    
    <!-- Loading indicator -->
    <div
      v-if="!isFullImageLoaded && !hasError"
      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
    >
      <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
    
    <!-- Error state -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getStorageDownloadURL } from '../services/storageUtils.js'

const props = defineProps({
  // Base path without size suffix (e.g., "location-images/123-image.jpg")
  imagePath: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  imageClass: {
    type: String,
    default: 'w-full h-full object-cover'
  },
  // Use different sizes based on container
  size: {
    type: String,
    default: 'medium', // thumb, medium, large
    validator: (value) => ['thumb', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['load', 'error'])

const isFullImageLoaded = ref(false)
const hasError = ref(false)
const thumbnailUrl = ref(null)
const fullUrl = ref(null)

// Generate different sized image URLs
const thumbnailSrc = computed(() => {
  return thumbnailUrl.value
})

const fullSrc = computed(() => {
  return fullUrl.value
})

// Load URLs when imagePath changes
const loadImageUrls = async () => {
  if (!props.imagePath) {
    thumbnailUrl.value = null
    fullUrl.value = null
    return
  }

  try {
    const thumbPath = addSizeToPath(props.imagePath, 'thumb')
    const fullPath = addSizeToPath(props.imagePath, props.size)
    
    // Get Firebase Storage URLs
    thumbnailUrl.value = await getStorageDownloadURL(thumbPath)
    fullUrl.value = await getStorageDownloadURL(fullPath)
  } catch (error) {
    console.warn('Failed to load image URLs:', error)
    hasError.value = true
  }
}

// Watch for imagePath changes
watch(() => props.imagePath, loadImageUrls, { immediate: true })
watch(() => props.size, loadImageUrls)

function addSizeToPath(path, size) {
  const lastDotIndex = path.lastIndexOf('.')
  if (lastDotIndex === -1) return `${path}_${size}`
  
  const pathWithoutExt = path.substring(0, lastDotIndex)
  const extension = path.substring(lastDotIndex)
  return `${pathWithoutExt}_${size}${extension}`
}

const onFullImageLoad = () => {
  isFullImageLoaded.value = true
  hasError.value = false
  emit('load')
}

const onImageError = () => {
  hasError.value = true
  console.warn('Failed to load image:', fullSrc.value)
  emit('error')
}
</script>
