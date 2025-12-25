<template>
  <div
    class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer"
    @click="$emit('click')"
  >
    <!-- Video thumbnail -->
    <video
      :src="videoUrl"
      :poster="thumbnailUrl"
      class="w-full h-full object-cover"
      muted
      preload="metadata"
      crossorigin="anonymous"
    />

    <!-- Play button overlay -->
    <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
      <div class="w-12 h-12 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center transition-colors">
        <svg class="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
    </div>

    <!-- Info overlay -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
      <!-- Problem info -->
      <div v-if="problemName" class="text-white text-sm mb-1">
        <div class="font-medium line-clamp-1">{{ problemName }}</div>
        <div v-if="problemGrade && typeof problemGrade === 'string'" class="text-xs text-gray-300">{{ problemGrade }}</div>
      </div>

      <!-- User and like count -->
      <div class="flex items-center justify-between text-xs text-white/90">
        <span class="line-clamp-1">{{ userName }}</span>
        <div class="flex items-center space-x-1">
          <span class="text-base">💪</span>
          <span class="font-medium">{{ formatLikeCount(likeCount) }}</span>
        </div>
      </div>
    </div>

    <!-- Action buttons slot for custom actions (delete, reprocess, etc.) -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
defineProps({
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  problemName: {
    type: String,
    default: null
  },
  problemGrade: {
    type: [String, Object],
    default: null
  },
  userName: {
    type: String,
    default: 'Unknown'
  },
  likeCount: {
    type: Number,
    default: 0
  }
});

defineEmits(['click']);

const formatLikeCount = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
