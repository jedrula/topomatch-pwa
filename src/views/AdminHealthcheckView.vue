<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">System Health Check</h1>
        <p class="text-sm text-gray-600 mt-1">Backend configuration and service status</p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div class="text-sm font-medium text-red-900">Failed to load configuration</div>
            <div class="text-xs text-red-700 mt-1">{{ error }}</div>
          </div>
        </div>
      </div>

      <!-- Configuration cards -->
      <div v-else class="space-y-4">
        <!-- Hold Detection Service -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 class="text-lg font-semibold text-gray-900">Hold Detection Service</h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <!-- Server URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono text-gray-900">
                  {{ config?.holdDetection?.serverUrl || 'Not configured' }}
                </div>
                <a
                  v-if="config?.holdDetection?.serverUrl"
                  :href="config.holdDetection.serverUrl"
                  target="_blank"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              </div>
            </div>

            <!-- Status indicator -->
            <div v-if="!config?.holdDetection?.configured">
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div class="flex items-center gap-2">
                <div class="px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                  Not Configured
                </div>
              </div>
            </div>

            <!-- Test endpoint button -->
            <div>
              <button
                v-if="config?.holdDetection?.serverUrl"
                @click="testHoldDetection"
                :disabled="testing"
                class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!testing">Test Connection</span>
                <span v-else class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </span>
              </button>
              <div v-if="testResult" class="mt-2 px-3 py-2 rounded-md text-sm font-medium" :class="testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ testResult.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- System Info -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 class="text-lg font-semibold text-gray-900">System Information</h2>
          </div>
          <div class="px-6 py-4 space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs text-gray-500 mb-1">Region</div>
                <div class="text-sm font-medium text-gray-900">{{ config?.region || 'Unknown' }}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 mb-1">Last Updated</div>
                <div class="text-sm font-medium text-gray-900">{{ formatTimestamp(config?.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { functions } from '@/services/firebase';
import { httpsCallable } from 'firebase/functions';

const loading = ref(true);
const error = ref(null);
const config = ref(null);
const testing = ref(false);
const testResult = ref(null);

const loadConfig = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const getBackendConfig = httpsCallable(functions, 'getBackendConfig');
    const result = await getBackendConfig();
    config.value = result.data;
  } catch (err) {
    console.error('Error loading backend config:', err);
    error.value = err.message || 'Failed to load configuration';
  } finally {
    loading.value = false;
  }
};

const testHoldDetection = async () => {
  if (!config.value?.holdDetection?.serverUrl) return;
  
  testing.value = true;
  testResult.value = null;
  
  try {
    const response = await fetch(`${config.value.holdDetection.serverUrl}/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (response.ok) {
      testResult.value = {
        success: true,
        message: '✅ Server is responding'
      };
    } else {
      testResult.value = {
        success: false,
        message: `❌ Server error: ${response.status}`
      };
    }
  } catch (err) {
    testResult.value = {
      success: false,
      message: `❌ Connection failed: ${err.message}`
    };
  } finally {
    testing.value = false;
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadConfig();
});
</script>
