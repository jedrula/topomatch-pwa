<template>
  <!-- Modal Overlay -->
  <div v-if="isOpen" class="fixed inset-0 z-[100]">
    <!-- Background overlay with opacity -->
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- Modal container - positioned closer to top -->
    <div class="relative flex justify-center pt-16 pb-4 px-4">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
        </h2>
        <p class="text-gray-600 mt-2">
          {{ isSignUp ? 'Join TopMatch to save your climbing progress' : 'Sign in to access your account' }}
        </p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Display Name (Sign Up Only) -->
        <div v-if="isSignUp">
          <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
            Name (optional)
          </label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            placeholder="Your name"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            ref="emailInput"
            v-model="form.email"
            type="email"
            required
            placeholder="your@email.com"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            :placeholder="isSignUp ? 'At least 6 characters' : 'Your password'"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSignUp ? 'Creating Account...' : 'Signing In...' }}
          </span>
          <span v-else>
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </span>
        </button>
      </form>

      <!-- Toggle Mode -->
      <div class="mt-6 text-center">
        <p class="text-gray-600">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <button
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-700 font-medium ml-1"
          >
            {{ isSignUp ? 'Sign In' : 'Create Account' }}
          </button>
        </p>
      </div>

      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../stores/userStore.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'success']);

const userStore = useUserStore();
const emailInput = ref(null);
const isSignUp = ref(false);
const isLoading = ref(false);
const error = ref('');

const form = reactive({
  email: '',
  password: '',
  displayName: ''
});

// Clear form when modal opens/closes and autofocus email
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm();
    // Focus email input after modal is rendered
    setTimeout(() => {
      if (emailInput.value) {
        emailInput.value.focus();
      }
    }, 100);
  }
});

// Handle ESC key to close modal
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

// Add/remove event listener when modal opens/closes
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

const resetForm = () => {
  form.email = '';
  form.password = '';
  form.displayName = '';
  error.value = '';
  isLoading.value = false;
};

const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  error.value = '';
};

const handleSubmit = async () => {
  if (isLoading.value) return;
  
  error.value = '';
  isLoading.value = true;

  try {
    if (isSignUp.value) {
      await userStore.signUp(form.email, form.password, form.displayName || null);
    } else {
      await userStore.signIn(form.email, form.password);
    }
    
    emit('success');
    emit('close');
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};
</script>
