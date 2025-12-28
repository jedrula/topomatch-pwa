<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog @close="$emit('close')" class="relative z-[100]">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="transition-opacity duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="transition-opacity duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-950/20" />
      </TransitionChild>

      <!-- Modal positioning -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
          <TransitionChild
            as="template"
            enter="transition-all duration-200"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="transition-all duration-150"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md bg-white rounded-lg shadow-lg">
              <!-- Header -->
              <div class="relative px-6 pt-6 pb-4 border-b border-gray-200/60">
                <DialogTitle class="text-lg font-semibold text-gray-900 text-center">
                  {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
                </DialogTitle>
                <p class="text-[13px] text-gray-600 text-center mt-1">
                  {{ isSignUp ? 'Join TopoMatch to save your climbing progress' : 'Sign in to access your account' }}
                </p>
                
                <!-- Close button -->
                <button
                  @click="$emit('close')"
                  class="absolute top-6 right-6 h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100/60 transition-all"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
                <!-- Display Name (Sign Up Only) -->
                <div v-if="isSignUp">
                  <label for="displayName" class="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Name <span class="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="displayName"
                    v-model="form.displayName"
                    type="text"
                    placeholder="Your name"
                    class="input"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    ref="emailInput"
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    class="input"
                  />
                </div>

                <!-- Password -->
                <div>
                  <label for="password" class="block text-[13px] font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    required
                    :placeholder="isSignUp ? 'At least 6 characters' : 'Your password'"
                    class="input"
                  />
                </div>

                <!-- Error Message -->
                <div v-if="error" class="px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-md">
                  {{ error }}
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="w-full h-10 flex items-center justify-center text-[14px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <span v-if="isLoading" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {{ isSignUp ? 'Creating...' : 'Signing in...' }}
                  </span>
                  <span v-else>
                    {{ isSignUp ? 'Create Account' : 'Sign In' }}
                  </span>
                </button>
              </form>

              <!-- Toggle Mode -->
              <div class="px-6 pb-6 pt-2 text-center">
                <p class="text-[13px] text-gray-600">
                  {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
                  <button
                    @click="toggleMode"
                    type="button"
                    class="text-gray-900 hover:text-gray-700 font-medium ml-1"
                  >
                    {{ isSignUp ? 'Sign In' : 'Create Account' }}
                  </button>
                </p>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';
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
      emailInput.value?.focus();
    }, 100);
  }
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
