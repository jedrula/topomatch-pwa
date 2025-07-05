<template>
  <img
    :src="cachedSrc || src"
    :alt="alt"
    :class="imageClass"
    @load="onLoad"
    @error="onError"
    v-bind="$attrs"
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { imageCacheService } from "@/services/imageCacheService";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: "",
  },
  class: {
    type: String,
    default: "",
  },
});

const cachedSrc = ref(null);
const imageClass = ref(props.class);

const loadFromCache = async (imagePath) => {
  try {
    const cachedResponse = await imageCacheService.getCachedImage(imagePath);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      cachedSrc.value = URL.createObjectURL(blob);
      console.log(`Loaded from cache: ${imagePath}`);
    }
  } catch (error) {
    console.error("Error loading from cache:", error);
  }
};

const onLoad = () => {
  // Image loaded successfully
};

const onError = () => {
  console.warn(`Failed to load image: ${props.src}`);
  // Fallback to original src if cached version fails
  if (cachedSrc.value) {
    cachedSrc.value = null;
  }
};

// Load from cache when component mounts
onMounted(() => {
  loadFromCache(props.src);
});

// Watch for src changes
watch(
  () => props.src,
  (newSrc) => {
    cachedSrc.value = null; // Reset cached src
    loadFromCache(newSrc);
  }
);

// Clean up blob URLs when component unmounts
const cleanup = () => {
  if (cachedSrc.value && cachedSrc.value.startsWith("blob:")) {
    URL.revokeObjectURL(cachedSrc.value);
  }
};

// Note: Vue 3 doesn't have beforeUnmount in script setup, but we can use onBeforeUnmount
import { onBeforeUnmount } from "vue";
onBeforeUnmount(cleanup);
</script>

<style scoped>
/* Component inherits all styling from parent */
</style>
