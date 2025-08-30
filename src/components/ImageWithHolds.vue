<template>
  <div class="image-with-holds-container relative">
    <!-- Image slot -->
    <div class="image-container">
      <slot name="image" />
    </div>
    
    <!-- SVG overlay positioned absolutely over the image -->
    <div class="overlay-container absolute inset-0 pointer-events-none">
      <svg 
        class="w-full h-full"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Overlay slot for SVG content -->
        <slot name="overlay" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'

const props = defineProps({
  viewBox: {
    type: String,
    default: '0 0 100 100'
  },
  autoDetectViewBox: {
    type: Boolean,
    default: false
  }
})

// Ref for detected viewBox
const detectedViewBox = ref(null)

// Computed viewBox - use auto-detected if available, otherwise use prop
const viewBox = computed(() => {
  if (props.autoDetectViewBox && detectedViewBox.value) {
    return detectedViewBox.value
  }
  return props.viewBox
})

// Auto-detect viewBox from image dimensions
const detectImageViewBox = async () => {
  if (!props.autoDetectViewBox) return
  
  await nextTick()
  
  // Find the img element within the image slot
  const imageElement = document.querySelector('.image-with-holds-container img')
  
  if (imageElement) {
    const onImageLoad = () => {
      const naturalWidth = imageElement.naturalWidth
      const naturalHeight = imageElement.naturalHeight
      
      if (naturalWidth && naturalHeight) {
        detectedViewBox.value = `0 0 ${naturalWidth} ${naturalHeight}`
        console.log('Auto-detected viewBox:', detectedViewBox.value)
      }
    }
    
    if (imageElement.complete && imageElement.naturalWidth) {
      onImageLoad()
    } else {
      imageElement.addEventListener('load', onImageLoad, { once: true })
    }
  }
}

onMounted(() => {
  detectImageViewBox()
})

// Watch for changes in autoDetectViewBox prop
watch(() => props.autoDetectViewBox, () => {
  if (props.autoDetectViewBox) {
    detectImageViewBox()
  }
})
</script>

<style scoped>
.image-with-holds-container {
  display: inline-block;
  position: relative;
}

.image-container {
  position: relative;
  z-index: 1;
}

.overlay-container {
  z-index: 2;
}

/* Ensure images don't have their own positioning that conflicts */
.image-container :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
