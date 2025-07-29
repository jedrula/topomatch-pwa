<template>
  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" :class="userStore.isAdmin ? 'bg-red-500' : 'bg-blue-500'"></div>
          <span class="text-sm font-medium text-gray-700">
            {{ userStore.user?.name }} ({{ userStore.user?.role }})
          </span>
        </div>
        <div class="text-xs text-gray-500">
          {{ userStore.isAdmin ? 'Can edit locations' : 'Read-only access' }}
        </div>
      </div>
      
      <button
        @click="userStore.toggleRole()"
        class="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Switch to {{ userStore.isAdmin ? 'User' : 'Admin' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore.js'

const userStore = useUserStore()
</script>
