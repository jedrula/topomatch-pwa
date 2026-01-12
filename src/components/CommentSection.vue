<template>
  <BaseDrawer :is-open="isOpen" :title="`Comments (${comments.length})`" @close="$emit('close')">
    <!-- Comment input at top -->
    <div class="flex-shrink-0 border-b border-gray-200 p-4 bg-gray-50">
      <form @submit.prevent="submitComment" class="flex space-x-3">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
            {{ userInitials }}
          </div>
        </div>
        <div class="flex-1">
          <textarea
            ref="commentInput"
            v-model="newComment"
            placeholder="Add a comment..."
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
            style="font-size: 16px;"
            :disabled="submitting"
          />
          <div class="flex justify-end mt-2">
            <button
              type="submit"
              :disabled="!newComment.trim() || submitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Posting...' : 'Post' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Comments list -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <div class="mx-auto w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p class="text-gray-500 text-sm mt-2">Loading comments...</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="comments.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-gray-500">No comments yet</p>
        <p class="text-gray-400 text-sm mt-1">Be the first to comment!</p>
      </div>

      <!-- Comment list -->
      <div v-else v-for="comment in comments" :key="comment.id" class="flex space-x-3">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {{ getInitials(comment.userName) }}
          </div>
        </div>

        <!-- Comment content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <span class="font-medium text-gray-900 text-sm">{{ comment.userName }}</span>
            <span class="text-gray-400 text-xs">{{ formatTimeAgo(comment.createdAt) }}</span>
          </div>
          <p class="text-gray-700 text-sm mt-1 whitespace-pre-wrap break-words">{{ comment.text }}</p>
        </div>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { commentService } from '@/services/commentService';
import { formatTimeAgo } from '@/utils/dateUtils';
import BaseDrawer from './BaseDrawer.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  ascentId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'update']);

const userStore = useUserStore();
const comments = ref([]);
const loading = ref(true);
const newComment = ref('');
const submitting = ref(false);
const commentInput = ref(null);

const userInitials = computed(() => {
  if (!userStore.user) return '?';
  const name = userStore.user.displayName || userStore.user.email || 'User';
  return getInitials(name);
});

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const loadComments = async () => {
  try {
    loading.value = true;
    comments.value = await commentService.getComments(props.ascentId);
  } catch (error) {
    console.error('Error loading comments:', error);
  } finally {
    loading.value = false;
  }
};

// Watch for drawer opening
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadComments();
  }
});

const submitComment = async () => {
  if (!newComment.value.trim() || submitting.value) return;

  try {
    submitting.value = true;
    const comment = await commentService.addComment(props.ascentId, newComment.value);
    
    // Add comment to list (it will appear at top since we sort by newest)
    comments.value.unshift(comment);
    
    // Clear input
    newComment.value = '';
    
    // Notify parent to update comment count
    emit('update', comments.value.length);
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Failed to post comment. Please try again.');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* Custom scrollbar for comments */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}
</style>
