<template>
  <div
    v-if="video"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Reassign Climber</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <!-- Current climber -->
        <div class="mb-4 p-3 bg-gray-50 rounded-md">
          <div class="text-xs text-gray-500 mb-1">Current climber</div>
          <div class="text-sm font-medium text-gray-900">
            {{ video.userName || video.uploadedBy || 'Unknown' }}
          </div>
        </div>

        <!-- User search/input -->
        <div class="space-y-3">
          <label class="block">
            <span class="text-sm font-medium text-gray-700">Search for user</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Enter email or name..."
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              @input="handleSearch"
            />
          </label>

          <!-- Search results -->
          <div v-if="loading" class="text-center py-4">
            <div class="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
            <button
              v-for="user in searchResults"
              :key="user.uid"
              @click="selectUser(user)"
              class="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
              :class="{ 'bg-blue-50 border-blue-500': selectedUser?.uid === user.uid }"
            >
              <div class="font-medium text-sm text-gray-900">{{ user.displayName || user.email }}</div>
              <div class="text-xs text-gray-500">{{ user.email }}</div>
            </button>
          </div>

          <div v-else-if="searchQuery && !loading" class="text-center py-4 text-sm text-gray-500">
            No users found
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleReassign"
          :disabled="!selectedUser || reassigning"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!reassigning">Reassign</span>
          <span v-else class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Reassigning...
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { videoService } from '@/services/videoService';

const props = defineProps({
  video: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'success']);

const searchQuery = ref('');
const searchResults = ref([]);
const selectedUser = ref(null);
const loading = ref(false);
const reassigning = ref(false);

let searchTimeout = null;

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout);
  
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    await searchUsers();
  }, 300);
};

const searchUsers = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) return;
  
  loading.value = true;
  try {
    const usersRef = collection(db, 'users');
    const searchLower = searchQuery.value.toLowerCase();
    
    // Search by email (starts with)
    const emailQuery = query(
      usersRef,
      where('email', '>=', searchLower),
      where('email', '<=', searchLower + '\uf8ff'),
      limit(10)
    );
    
    const emailSnapshot = await getDocs(emailQuery);
    const users = emailSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    // Remove duplicates by uid
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.uid, u])).values()
    );
    
    searchResults.value = uniqueUsers;
  } catch (error) {
    console.error('Error searching users:', error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

const selectUser = (user) => {
  selectedUser.value = user;
};

const handleReassign = async () => {
  if (!selectedUser.value || !props.video) return;
  
  reassigning.value = true;
  try {
    await videoService.reassignVideo(
      props.video.ascentId || props.video.id,
      selectedUser.value.uid,
      selectedUser.value.displayName || selectedUser.value.email
    );
    
    emit('success', props.video.id);
  } catch (error) {
    console.error('Error reassigning video:', error);
    alert('Failed to reassign video: ' + error.message);
  } finally {
    reassigning.value = false;
  }
};

// Reset state when dialog opens/closes
watch(() => props.video, (newVideo) => {
  if (newVideo) {
    searchQuery.value = '';
    searchResults.value = [];
    selectedUser.value = null;
  }
});
</script>
