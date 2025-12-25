<template>
  <button
    @click="handleClick"
    :disabled="loading"
    class="like-button flex flex-col items-center space-y-1 transition-all group"
    :class="{ 'animate-pulse': loading }"
  >
    <!-- Biceps Emoji 💪 -->
    <div 
      class="relative flex items-center justify-center transition-transform duration-200 text-4xl"
      :class="{ 
        'scale-110': isLiked, 
        'group-hover:scale-125': !loading,
        'group-hover:rotate-12': !loading
      }"
    >
      <span 
        class="transition-all duration-200"
        :class="isLiked ? 'grayscale-0' : 'grayscale opacity-80'"
      >
        💪
      </span>
      
      <!-- Pulse animation on like -->
      <transition name="pulse">
        <div 
          v-if="showPulse" 
          class="absolute inset-0 rounded-full bg-orange-500 opacity-50 animate-ping"
        ></div>
      </transition>
    </div>
    
    <!-- Like count -->
    <span 
      class="text-xs font-medium text-white"
    >
      {{ displayCount }}
    </span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { toggleLike } from '@/services/likeService';

const props = defineProps({
  ascent: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update']);

const userStore = useUserStore();
const loading = ref(false);
const showPulse = ref(false);

const isLiked = computed(() => {
  if (!userStore.user?.uid || !props.ascent) return false;
  return props.ascent.likedByUserIds?.includes(userStore.user.uid) || false;
});

const displayCount = computed(() => {
  const count = props.ascent?.likeCount || 0;
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count;
});

const handleClick = async () => {
  if (!userStore.user) {
    // TODO: Show login prompt
    alert('Please sign in to like videos');
    return;
  }

  if (loading.value) return;

  try {
    loading.value = true;
    
    const result = await toggleLike(props.ascent.id);
    
    // Show pulse animation on like
    if (result.liked) {
      showPulse.value = true;
      setTimeout(() => {
        showPulse.value = false;
      }, 600);
    }
    
    // Emit update event so parent can refresh ascent data
    emit('update', {
      liked: result.liked,
      likeCount: result.likeCount
    });
    
  } catch (error) {
    console.error('Failed to toggle like:', error);
    alert('Failed to update like. Please try again.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.like-button {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.like-button:active {
  transform: scale(0.95);
}

.like-button:not(:disabled):hover {
  cursor: pointer;
}

.pulse-enter-active {
  animation: pulse-animation 0.6s ease-out;
}

@keyframes pulse-animation {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.4;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>
