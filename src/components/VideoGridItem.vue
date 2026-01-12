<template>
  <div
    class="aspect-square bg-gray-50 rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-gray-900/10 transition-all"
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
    <div class="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-all">
      <div class="w-12 h-12 bg-white/90 group-hover:bg-white group-hover:scale-110 rounded-full flex items-center justify-center transition-all shadow-lg opacity-0 group-hover:opacity-100">
        <svg class="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
    </div>

    <!-- Info overlay -->
    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
      <div class="flex items-end justify-between gap-2">
        <!-- Left: Problem and user info -->
        <div class="min-w-0 flex-1">
          <!-- Problem name -->
          <div v-if="problemName" class="text-[13px] font-medium text-white line-clamp-1">
            {{ problemName }}
            <span v-if="problemGrade && typeof problemGrade === 'string'" class="text-[11px] text-white/60 ml-1">{{ problemGrade }}</span>
          </div>
          <!-- User name -->
          <div class="text-[11px] text-white/90 line-clamp-1 leading-4 mt-0.5">{{ userName }}</div>
        </div>
        
        <!-- Right: Likes -->
        <div v-if="likeCount > 0" class="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full flex-shrink-0">
          <span class="text-[13px]">💪</span>
          <span class="font-medium text-[11px] text-white">{{ formatLikeCount(likeCount) }}</span>
        </div>
      </div>
    </div>

    <!-- Action buttons slot for custom actions (delete, reprocess, etc.) -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getDefaultVideoPoster } from '@/utils/videoUtils';

const props = defineProps({
  ascent: {
    type: Object,
    required: true
  }
});

defineEmits(['click']);

// Extract data from canonical ascent structure
const videoUrl = computed(() => {
  // Handle both flat (transformed) and nested (raw) structures
  return props.ascent.downloadUrl || props.ascent.url || props.ascent.video?.transcodedPath || props.ascent.video?.originalPath || '';
});

const thumbnailUrl = computed(() => {
  // Handle both flat (transformed) and nested (raw) structures
  return props.ascent.thumbnailBase64 || props.ascent.video?.thumbnailBase64 || getDefaultVideoPoster();
});

const problemName = computed(() => {
  return props.ascent.problemSnapshot?.name || props.ascent.problemName || null;
});

const problemGrade = computed(() => {
  return props.ascent.problemSnapshot?.grade || props.ascent.metadata?.problemGrade || null;
});

const userName = computed(() => {
  return props.ascent.userName || 'Unknown';
});

const likeCount = computed(() => props.ascent.likeCount || 0);

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
