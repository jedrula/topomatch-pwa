<template>
  <header class="app-header bg-white border-b border-gray-200/60">
    <nav class="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <!-- Logo -->
      <router-link 
        to="/" 
        class="text-[15px] font-medium text-gray-900 hover:text-gray-600 transition-colors"
      >
        TopoMatch
      </router-link>

      <!-- Desktop Navigation -->
      <div class="hidden sm:flex items-center gap-4">
        <!-- Nav Links -->
        <div class="flex items-center gap-1">
          <router-link
            v-if="userStore.canViewLocations"
            to="/"
            class="h-8 px-3 flex items-center text-[13px] text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100/60 transition-all"
            :class="{ 'text-gray-900 bg-gray-100/80': isLocationRoute }"
          >
            Locations
          </router-link>
          <router-link
            v-if="currentLocationId"
            :to="`/location/${currentLocationId}/jobs`"
            class="h-8 px-3 flex items-center text-[13px] text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100/60 transition-all"
            :class="{ 'text-gray-900 bg-gray-100/80': isJobsRoute }"
          >
            Jobs
          </router-link>
        </div>

        <!-- Auth Actions -->
        <div v-if="userStore.isLoggedIn" class="flex items-center gap-1 ml-2 pl-3 border-l border-gray-200/80">
          <button
            @click="showReporter = true"
            class="h-8 px-3 flex items-center text-[13px] text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100/60 transition-all"
            title="Report a problem"
          >
            Report Problem
          </button>
          <router-link
            to="/profile"
            class="h-8 px-3 flex items-center text-[13px] text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100/60 transition-all"
          >
            {{ userStore.userDisplayName }}
          </router-link>
          <button
            @click="handleSignOut"
            class="h-8 px-3 flex items-center text-[13px] text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100/60 transition-all"
          >
            Sign out
          </button>
        </div>
        <button
          v-else
          @click="openAuthModal"
          class="h-8 px-3 ml-2 text-[13px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Sign in
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <button
        @click="toggleMobileMenu"
        class="sm:hidden h-8 w-8 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Toggle menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path
            v-if="!showMobileMenu"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </nav>

    <!-- Mobile Menu -->
    <div v-if="showMobileMenu" class="sm:hidden border-t border-gray-200/60 bg-white animate-in">
      <div class="px-4 py-3 space-y-0.5">
        <router-link
          v-if="userStore.canViewLocations"
          to="/"
          @click="closeMobileMenu"
          class="h-9 px-3 flex items-center text-[14px] text-gray-700 hover:bg-gray-100/60 rounded-md transition-colors"
          :class="{ 'bg-gray-100/80 text-gray-900': isLocationRoute }"
        >
          Locations
        </router-link>
        <router-link
          v-if="currentLocationId"
          :to="`/location/${currentLocationId}/jobs`"
          @click="closeMobileMenu"
          class="h-9 px-3 flex items-center text-[14px] text-gray-700 hover:bg-gray-100/60 rounded-md transition-colors"
          :class="{ 'bg-gray-100/80 text-gray-900': isJobsRoute }"
        >
          Jobs
        </router-link>
        
        <div v-if="userStore.isLoggedIn" class="pt-3 mt-3 border-t border-gray-200/60 space-y-0.5">
          <button
            @click="showReporter = true; closeMobileMenu();"
            class="w-full h-9 px-3 flex items-center text-[14px] text-gray-600 hover:bg-gray-100/60 rounded-md transition-colors"
          >
            Report Problem
          </button>
          <router-link
            to="/profile"
            @click="closeMobileMenu"
            class="h-9 px-3 flex items-center text-[14px] text-gray-900 hover:bg-gray-100/60 rounded-md transition-colors"
          >
            {{ userStore.userDisplayName }}
          </router-link>
          <button
            @click="handleSignOut"
            class="w-full h-9 px-3 flex items-center text-[14px] text-gray-600 hover:bg-gray-100/60 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
        <button
          v-else
          @click="openAuthModal"
          class="w-full h-9 mt-3 text-[14px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Sign in
        </button>
      </div>
    </div>
    
    <!-- Diagnostic Reporter Modal -->
    <DiagnosticReporter
      :show="showReporter"
      @close="showReporter = false"
      @sent="onReportSent"
    />
  </header>
</template>

<script setup>
import { computed, ref, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/userStore.js';
import DiagnosticReporter from './DiagnosticReporter.vue';

const route = useRoute();
const userStore = useUserStore();
const showMobileMenu = ref(false);
const showReporter = ref(false);

const onReportSent = () => {
  showReporter.value = false;
};

// Inject auth modal methods from App.vue
const authModal = inject('authModal');

const isLocationRoute = computed(
  () =>
    route.name === 'home' ||
    route.name === 'location-detail' ||
    route.name === 'location-edit' ||
    route.name === 'add-location'
);

const isJobsRoute = computed(() => route.name === 'location-jobs');

const currentLocationId = computed(() => {
  // Show Jobs link when viewing a location or its jobs
  if (route.params.locationId) {
    return route.params.locationId;
  }
  return null;
});

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
};

const handleSignOut = async () => {
  try {
    await userStore.signOut();
    closeMobileMenu();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};

const openAuthModal = () => {
  authModal.open();
  closeMobileMenu();
};
</script>
