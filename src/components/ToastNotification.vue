<script setup>
import { useToast } from '../composables/useToast.js';

const { showToast, toastMessage, toastType, toastAction, hide } = useToast();

const handleAction = () => {
  if (toastAction.value?.onClick) {
    toastAction.value.onClick();
    hide();
  }
};
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="transform translate-y-2 opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-2 opacity-0"
  >
    <div
      v-if="showToast"
      class="fixed top-4 right-4 z-50 rounded-lg shadow-lg max-w-md"
      :class="{
        'bg-blue-500 text-white': toastType === 'loading',
        'bg-green-500 text-white': toastType === 'success',
        'bg-red-500 text-white': toastType === 'error',
        'bg-yellow-500 text-white': toastType === 'warning',
        'bg-gray-700 text-white': toastType === 'info'
      }"
    >
      <div class="px-6 py-3">
        <div class="flex items-center space-x-2">
          <!-- Spinner for loading -->
          <svg
            v-if="toastType === 'loading'"
            class="animate-spin h-5 w-5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          
          <!-- Checkmark for success -->
          <svg
            v-else-if="toastType === 'success'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          
          <!-- Error X -->
          <svg
            v-else-if="toastType === 'error'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          
          <!-- Warning triangle -->
          <svg
            v-else-if="toastType === 'warning'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          
          <!-- Info icon -->
          <svg
            v-else-if="toastType === 'info'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          
          <span class="flex-grow">{{ toastMessage }}</span>
        </div>
        
        <!-- Action Button -->
        <button
          v-if="toastAction"
          @click="handleAction"
          class="mt-2 text-sm font-semibold underline hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
        >
          {{ toastAction.label }}
        </button>
      </div>
    </div>
  </Transition>
</template>
