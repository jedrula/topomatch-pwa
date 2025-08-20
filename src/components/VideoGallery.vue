<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center"
    @click="closeOnBackdrop"
    @keydown.esc="closeGallery"
    tabindex="0"
  >
    <!-- Close button -->
    <button
      @click="closeGallery"
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-[10000]"
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

    <!-- Main video display -->
    <div class="flex flex-col items-center justify-center max-w-6xl max-h-full p-4">
      <div class="relative w-full flex-1 flex items-center justify-center">
        <!-- Video player -->
        <video
          v-if="currentVideo"
          :src="currentVideo.downloadUrl"
          controls
          autoplay
          class="max-h-screen max-w-screen rounded-lg"
          @loadedmetadata="onVideoLoaded"
        />

        <!-- Loading state -->
        <div v-else class="text-white">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    </div>

    <!-- Video info - Bottom right corner -->
    <div
      v-if="currentVideo"
      class="absolute bottom-6 right-6 text-white text-right max-w-xs bg-black bg-opacity-50 p-3 rounded-lg text-sm"
    >
      <h3 class="font-medium mb-1 text-gray-200">{{ currentVideo.name }}</h3>
      <div class="text-xs text-gray-400 space-y-0.5">
        <p v-if="currentVideo.problemName" class="text-blue-300">
          Problem: {{ currentVideo.problemName }}
        </p>
        <p v-if="currentVideo.uploadedBy">{{ currentVideo.uploadedBy }}</p>
        <p v-if="currentVideo.uploadedAt">{{ formatDate(currentVideo.uploadedAt) }}</p>
        <p v-if="currentVideo.size">{{ formatFileSize(currentVideo.size) }}</p>
      </div>
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
