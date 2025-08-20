<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
    @click="closeOnBackdrop"
    @keydown.esc="closeGallery"
    @keydown.left="previousVideo"
    @keydown.right="nextVideo"
    tabindex="0"
  >
    <!-- Close button -->
    <button
      @click="closeGallery"
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Video counter -->
    <div class="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">
      {{ currentIndex + 1 }} / {{ videos.length }}
    </div>

    <!-- Previous button -->
    <button
      v-if="videos.length > 1"
      @click="previousVideo"
      class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
      :disabled="currentIndex === 0"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === 0 }"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <!-- Next button -->
    <button
      v-if="videos.length > 1"
      @click="nextVideo"
      class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
      :disabled="currentIndex === videos.length - 1"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === videos.length - 1 }"
    >
      <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Main video display -->
    <div class="flex flex-col items-center justify-center max-w-6xl max-h-full p-4">
      <div class="relative w-full h-full flex items-center justify-center">
        <!-- Video player -->
        <video
          v-if="currentVideo"
          :src="currentVideo.downloadUrl"
          controls
          class="max-h-screen rounded-lg"
          @loadedmetadata="onVideoLoaded"
        />

        <!-- Loading state -->
        <div v-else class="text-white">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>

      <!-- Video info -->
      <div v-if="currentVideo" class="mt-4 text-white text-center max-w-2xl">
        <h3 class="text-lg font-semibold mb-2">{{ currentVideo.name }}</h3>
        <div class="text-sm text-gray-300 space-y-1">
          <p v-if="currentVideo.uploadedBy">Uploaded by {{ currentVideo.uploadedBy }}</p>
          <p v-if="currentVideo.uploadedAt">
            {{ formatDate(currentVideo.uploadedAt) }}
          </p>
          <p v-if="currentVideo.size">
            {{ formatFileSize(currentVideo.size) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div
      v-if="videos.length > 1"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-2 rounded-lg max-w-xl overflow-x-auto"
    >
      <button
        v-for="(video, index) in videos"
        :key="video.id"
        @click="currentIndex = index"
        :class="[
          'w-16 h-12 rounded border-2 transition-all flex-shrink-0 overflow-hidden relative',
          index === currentIndex
            ? 'border-white bg-gray-700'
            : 'border-gray-500 hover:border-gray-300 opacity-70 hover:opacity-100 bg-gray-800',
        ]"
      >
        <!-- Video thumbnail content -->
        <div class="w-full h-full flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        
        <!-- Current video indicator -->
        <div
          v-if="index === currentIndex"
          class="absolute inset-0 border-2 border-white rounded"
        ></div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { videoService } from "../services/videoService.js";

const props = defineProps({
  videos: {
    type: Array,
    default: () => [],
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["close", "video-change"]);

// State
const currentIndex = ref(0);

// Computed
const currentVideo = computed(() => props.videos[currentIndex.value] || null);

// Methods
const closeGallery = () => {
  emit("close");
};

const closeOnBackdrop = (event) => {
  if (event.target === event.currentTarget) {
    closeGallery();
  }
};

const previousVideo = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
};

const nextVideo = () => {
  if (currentIndex.value < props.videos.length - 1) {
    currentIndex.value++;
  }
};

const onVideoLoaded = (event) => {
  // Video metadata loaded
  console.log("Video loaded:", event.target.duration);
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const formatFileSize = (bytes) => {
  return videoService.formatFileSize(bytes);
};

// Watchers
watch(
  () => props.initialIndex,
  (newIndex) => {
    currentIndex.value = newIndex;
  },
  { immediate: true }
);

watch(currentIndex, (newIndex) => {
  emit("video-change", newIndex, currentVideo.value);
});

// Focus management
onMounted(() => {
  if (props.isOpen) {
    document.addEventListener("keydown", handleKeydown);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

const handleKeydown = (event) => {
  if (!props.isOpen) return;

  switch (event.key) {
    case "Escape":
      closeGallery();
      break;
    case "ArrowLeft":
      previousVideo();
      break;
    case "ArrowRight":
      nextVideo();
      break;
  }
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeydown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "";
    }
  }
);
</script>
