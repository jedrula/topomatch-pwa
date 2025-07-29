<template>
  <div class="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-lg p-3 text-xs">
    <div class="flex flex-col space-y-2">
      <div class="flex items-center space-x-2">
        <div
          class="w-2 h-2 rounded-full"
          :class="userStore.isAdmin ? 'bg-red-500' : 'bg-blue-500'"
        ></div>
        <span class="font-medium text-gray-700">
          {{ userStore.user?.role }}
        </span>
      </div>
      
      <button
        @click="userStore.toggleRole()"
        class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
      >
        Switch to {{ userStore.isAdmin ? "User" : "Admin" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "../stores/userStore.js";

const userStore = useUserStore();
</script>
