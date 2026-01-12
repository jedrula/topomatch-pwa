<template>
  <BaseDrawer :is-open="isOpen" title="Likes" @close="close">
    <!-- Loading State -->
    <div v-if="loading" class="py-8 text-center">
      <div class="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-sm text-gray-600">Loading...</p>
    </div>

    <!-- User List -->
    <div v-else-if="users.length > 0" class="divide-y divide-gray-100">
      <button
        v-for="user in users"
        :key="user.id"
        @click="goToProfile(user.id)"
        class="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
      >
        <!-- Avatar -->
        <div class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 text-white font-semibold">
          {{ getUserInitial(user) }}
        </div>
        
        <!-- User Info -->
        <div class="flex-1 text-left min-w-0">
          <div class="text-[15px] font-medium text-gray-900 truncate">
            {{ user.displayName || 'User' }}
          </div>
          <div v-if="user.email" class="text-[13px] text-gray-500 truncate">
            {{ user.email }}
          </div>
        </div>

        <!-- Arrow Icon -->
        <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="py-8 text-center">
      <p class="text-sm text-gray-600">No likes yet</p>
    </div>
  </BaseDrawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import BaseDrawer from './BaseDrawer.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  userIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close']);

const router = useRouter();
const loading = ref(false);
const users = ref([]);

// Fetch user details for all userIds
const fetchUsers = async () => {
  if (!props.userIds || props.userIds.length === 0) {
    users.value = [];
    return;
  }

  loading.value = true;
  try {
    const userPromises = props.userIds.map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          return {
            id: userDoc.id,
            ...userDoc.data()
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
      }
    });

    const fetchedUsers = await Promise.all(userPromises);
    users.value = fetchedUsers.filter(u => u !== null);
  } catch (error) {
    console.error('Error fetching users:', error);
    users.value = [];
  } finally {
    loading.value = false;
  }
};

// Watch for drawer opening
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    fetchUsers();
  }
});

const getUserInitial = (user) => {
  return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
};

const goToProfile = (userId) => {
  close();
  router.push(`/user/${userId}`);
};

const close = () => {
  emit('close');
};
</script>
