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
        :viewBox="props.viewBox"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Overlay slot for SVG content -->
        <slot name="overlay" />
      </svg>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  viewBox: {
    type: String,
    required: true
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
