<template>
  <div
    class="aspect-square bg-gray-50 rounded-lg overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-gray-900/10 transition-all"
    @click="$emit('click')"
  >
    <!-- Video thumbnail - use poster only, don't load video -->
    <img
      v-if="thumbnailUrl"
      :src="thumbnailUrl"
      :class="thumbnailUrl === '/climbing-placeholder.svg' ? 'climbing-placeholder' : 'w-full h-full object-cover'"
      crossorigin="anonymous"
      loading="lazy"
      alt="Video thumbnail"
    />
    <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>

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
        <!-- Left: User name and location/problem info -->
        <div class="min-w-0 flex-1">
          <!-- User name (primary line) -->
          <div class="text-[13px] font-medium text-white line-clamp-1">
            {{ userName }}
          </div>
          <!-- Location + Problem (secondary line) -->
          <div class="text-[11px] text-white/90 line-clamp-1 leading-4 mt-0.5 capitalize location-problem-line">
            <span v-if="locationName" class="location-name">{{ locationName }}</span>
            <span v-if="problemName" class="problem-name">{{ problemName }}</span>
          </div>
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


const thumbnailUrl = computed(() => {
  // Handle both flat (transformed) and nested (raw) structures
  return props.ascent.thumbnailUrl || props.ascent.video?.thumbnailUrl || getDefaultVideoPoster();
});

const problemName = computed(() => {
  return props.ascent.problemSnapshot?.name || props.ascent.problemName || props.ascent.name || null;
});

const locationName = computed(() => {
  return props.ascent.locationName || null;
});

const problemGrade = computed(() => {
  return props.ascent.problemSnapshot?.grade || props.ascent.metadata?.problemGrade || null;
});

const userName = computed(() => {
  return props.ascent.userName || props.ascent.uploadedBy || 'Unknown';
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

/* Add comma between location and problem name using CSS */
.location-problem-line .location-name + .problem-name::before {
  content: ', ';
}

/* Style placeholder SVG to be centered and 50% size */
.climbing-placeholder {
  width: 50%;
  height: 50%;
  opacity: 0.8;
  position: relative;
  top: 25%;
  left: 0;
  right: 0;
  margin: 0 auto;
  object-fit: contain;
}
</style>
