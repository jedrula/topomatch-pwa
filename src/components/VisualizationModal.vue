<template>
  <dialog
    ref="dialogRef"
    class="fixed inset-0 w-full h-full max-w-none max-h-none bg-black/95 backdrop-blur-sm hidden flex-col items-center justify-center border-0 p-0 m-0 overflow-hidden z-50 open:flex"
    @close="onDialogClose"
  >
    <!-- Close button -->
    <button
      @click="closeModal"
      class="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Navigation arrows -->
    <button
      v-if="imageList.length > 1 && currentImageIndex > 0"
      @click="navigateImage(-1)"
      class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <button
      v-if="imageList.length > 1 && currentImageIndex < imageList.length - 1"
      @click="navigateImage(1)"
      class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Toggle between Preview/Visualization button -->
    <button
      v-if="canVisualize || visualizationAvailability[imageList[currentImageIndex]] !== undefined"
      @click="canVisualize ? toggleMode() : null"
      :disabled="!canVisualize"
      :title="
        !canVisualize && matchCount !== null && matchCount < 50
          ? `Not enough matches (${matchCount}) to visualize`
          : ''
      "
      class="absolute top-4 left-4 z-10 backdrop-blur-sm text-white border rounded-lg px-3 py-2 flex items-center gap-2 transition-all duration-200"
      :class="
        canVisualize
          ? 'bg-white/10 hover:bg-white/20 border-white/20 cursor-pointer'
          : 'bg-gray-600/50 border-gray-500/30 cursor-not-allowed opacity-60'
      "
    >
      <svg
        v-if="modalMode === 'preview'"
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span class="text-sm">
        {{ modalMode === "preview" ? "Show Matches" : "Show Image" }}
      </span>
    </button>

    <!-- Visualization Canvas (for match visualization) -->
    <canvas
      v-if="modalMode === 'visualization'"
      ref="canvasRef"
      class="max-w-[90vw] max-h-[80vh] bg-gray-800 rounded-lg shadow-2xl border border-gray-600"
    ></canvas>

    <!-- Winner indicator for best match (shown in both modes) -->
    <div
      v-if="isWinner"
      class="absolute top-16 left-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg px-3 py-2 text-green-100 text-sm font-medium"
    >
      🏆 Best Match
    </div>

    <!-- Status indicator replacing simple counter -->
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <!-- Analysis status -->
      <div
        v-if="isProcessing"
        class="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-100 rounded-lg px-3 py-1 text-sm font-medium flex items-center gap-2"
      >
        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Analyzing images...
      </div>

      <!-- Image analysis status -->
      <div class="bg-black/50 backdrop-blur-sm text-white rounded-lg px-3 py-1 text-sm font-medium">
        <div v-if="currentImagePosition !== null" class="flex items-center gap-3">
          <!-- Position among analyzed -->
          <span>#{{ currentImagePosition }} of {{ analyzedImagesCount }} analyzed</span>

          <!-- Match count -->
          <span v-if="matchCount !== null" class="text-gray-300"> {{ matchCount }} matches </span>
        </div>

        <div v-else-if="matchCount !== null" class="flex items-center gap-3">
          <span class="text-gray-300">{{ matchCount }} matches</span>
          <span v-if="analyzedImagesCount > 0">({{ analyzedImagesCount }} images analyzed)</span>
        </div>

        <div v-else-if="analyzedImagesCount > 0">{{ analyzedImagesCount }} images analyzed</div>

        <div v-else>Not yet analyzed</div>
      </div>
    </div>

    <!-- Image Preview (for large image view) -->
    <div
      v-if="modalMode === 'preview'"
      class="max-w-[90vw] max-h-[80vh] flex items-center justify-center"
    >
      <CachedImage
        :src="previewImage"
        alt="Large image preview"
        class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
      />
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import CachedImage from '@/components/CachedImage.vue';

const props = defineProps({
  modalMode: {
    type: String,
    required: true,
  },
  previewImage: {
    type: String,
    default: null,
  },
  canVisualize: {
    type: Boolean,
    default: false,
  },
  isWinner: {
    type: Boolean,
    default: false,
  },
  visualizationData: {
    type: Object,
    default: null,
  },
  imageList: {
    type: Array,
    default: () => [],
  },
  currentImageIndex: {
    type: Number,
    default: 0,
  },
  visualizationAvailability: {
    type: Object,
    default: () => ({}),
  },
  isProcessing: {
    type: Boolean,
    default: false,
  },
  matchCount: {
    type: Number,
    default: null,
  },
  analyzedImagesCount: {
    type: Number,
    default: 0,
  },
  currentImagePosition: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close', 'toggle-mode', 'navigate']);

const dialogRef = ref(null);
const canvasRef = ref(null);

const showModal = () => {
  if (dialogRef.value) {
    dialogRef.value.showModal();
  }
};

const closeModal = () => {
  if (dialogRef.value) {
    dialogRef.value.close();
  }
};

const onDialogClose = () => {
  emit('close');
};

const toggleMode = () => {
  emit('toggle-mode');
};

const navigateImage = (direction) => {
  const newIndex = props.currentImageIndex + direction;
  if (newIndex >= 0 && newIndex < props.imageList.length) {
    const nextImage = props.imageList[newIndex];
    const hasVisualizationData = props.visualizationAvailability[nextImage];

    // If we're in visualization mode but the next image can't be visualized,
    // suggest switching to preview mode
    let suggestedMode = props.modalMode;
    if (props.modalMode === 'visualization' && !hasVisualizationData) {
      suggestedMode = 'preview';
    }

    emit('navigate', { index: newIndex, mode: suggestedMode });
  }
};

const handleKeyDown = (event) => {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    navigateImage(-1);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    navigateImage(1);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
  }
};

const drawVisualization = (rawData, images, imgWidth, imgHeight) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  canvas.width = imgWidth * 2;
  canvas.height = imgHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
  ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);
  for (let i = 0; i < Math.min(20, rawData.matches.dims[0]); i++) {
    const matchBaseIndex = i * rawData.matches.dims[1];
    const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
    const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);
    const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
    const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
    const x1 =
      Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) + imgWidth;
    const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
};

// Keyboard navigation
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});

// Watch for visualization data changes and draw when needed
watch(
  () => props.visualizationData,
  (newData) => {
    if (newData && props.modalMode === 'visualization') {
      nextTick(() => {
        drawVisualization(newData.rawData, newData.images, newData.imgWidth, newData.imgHeight);
      });
    }
  },
  { immediate: true }
);

// Watch for mode changes to redraw visualization
watch(
  () => props.modalMode,
  (newMode) => {
    if (newMode === 'visualization' && props.visualizationData) {
      nextTick(() => {
        drawVisualization(
          props.visualizationData.rawData,
          props.visualizationData.images,
          props.visualizationData.imgWidth,
          props.visualizationData.imgHeight
        );
      });
    }
  }
);

defineExpose({
  showModal,
  closeModal,
});
</script>
