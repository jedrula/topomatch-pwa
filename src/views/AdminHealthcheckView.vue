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
                  {{ firestoreConfig?.holdDetection?.serverUrl || 'Not configured' }}
                </div>
                <a
                  v-if="firestoreConfig?.holdDetection?.serverUrl"
                  :href="firestoreConfig.holdDetection.serverUrl"
                  target="_blank"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
                <a
                  v-if="firestoreConfig?.holdDetection?.serverUrl"
                  :href="`${firestoreConfig.holdDetection.serverUrl}/docs`"
                  target="_blank"
                  class="h-9 px-4 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Swagger
                </a>
              </div>

              <div class="flex items-center gap-2 mt-3">
                <input
                  v-model="serverUrlDraft"
                  placeholder="https://…"
                  class="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm font-mono text-gray-900"
                />
                <button
                  @click="saveServerUrl"
                  :disabled="savingServerUrl"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!savingServerUrl">Save</span>
                  <span v-else>Saving...</span>
                </button>
              </div>

              <div v-if="serverUrlSaveResult" class="mt-2 px-3 py-2 rounded-md text-sm font-medium" :class="serverUrlSaveResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ serverUrlSaveResult.message }}
              </div>
            </div>

            <!-- Status indicator -->
            <div v-if="!firestoreConfig?.holdDetection?.serverUrl">
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
                v-if="firestoreConfig?.holdDetection?.serverUrl"
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

            <!-- Test match-images API -->
            <div>
              <button
                v-if="firestoreConfig?.holdDetection?.serverUrl"
                @click="testMatchImages"
                :disabled="testingMatch"
                class="h-9 px-4 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="!testingMatch">Test Match Images API</span>
                <span v-else class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </span>
              </button>
              <div v-if="matchTestResult" class="mt-2">
                <div class="px-3 py-2 rounded-md text-sm font-medium" :class="matchTestResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ matchTestResult.message }}
                </div>
                <details v-if="matchTestResult.details" class="mt-2 text-xs">
                  <summary class="cursor-pointer text-gray-700 font-medium">Response Details</summary>
                  <pre class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded overflow-x-auto">{{ matchTestResult.details }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- Cluster Service -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 class="text-lg font-semibold text-gray-900">Cluster Service</h2>
            <p class="text-xs text-gray-500 mt-1">Used for draft problem clustering and magic wand. Falls back to Hold Detection URL if not set.</p>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono text-gray-900">
                  {{ firestoreConfig?.cluster?.serverUrl || '(not set — falls back to Hold Detection URL)' }}
                </div>
                <a
                  v-if="firestoreConfig?.cluster?.serverUrl"
                  :href="firestoreConfig.cluster.serverUrl"
                  target="_blank"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              </div>

              <div class="flex items-center gap-2 mt-3">
                <input
                  v-model="clusterUrlDraft"
                  placeholder="https://… (leave empty to use Hold Detection URL)"
                  class="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm font-mono text-gray-900"
                />
                <button
                  @click="saveClusterUrl"
                  :disabled="savingClusterUrl"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!savingClusterUrl">Save</span>
                  <span v-else>Saving...</span>
                </button>
              </div>

              <div v-if="clusterUrlSaveResult" class="mt-2 px-3 py-2 rounded-md text-sm font-medium" :class="clusterUrlSaveResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ clusterUrlSaveResult.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- Topowall Splat (Panorama Stitching) -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 class="text-lg font-semibold text-gray-900">Topowall Splat</h2>
            <p class="text-xs text-gray-500 mt-1">Panorama stitching service (topowall-splat FastAPI). If not set, defaults to <code>holdDetection.serverUrl/topowall</code> via the gateway.</p>
          </div>
          <div class="px-6 py-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
              <div class="flex items-center gap-2">
                <div class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-mono text-gray-900">
                  {{ firestoreConfig?.topowall?.serverUrl || `(auto: ${firestoreConfig?.holdDetection?.serverUrl || '?'}/topowall)` }}
                </div>
                <a
                  v-if="firestoreConfig?.topowall?.serverUrl"
                  :href="firestoreConfig.topowall.serverUrl"
                  target="_blank"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open
                </a>
              </div>

              <div class="flex items-center gap-2 mt-3">
                <input
                  v-model="topowallUrlDraft"
                  placeholder="https://… (leave empty to auto-derive from Hold Detection URL)"
                  class="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm font-mono text-gray-900"
                />
                <button
                  @click="saveTopowallUrl"
                  :disabled="savingTopowallUrl"
                  class="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!savingTopowallUrl">Save</span>
                  <span v-else>Saving...</span>
                </button>
              </div>

              <div v-if="topowallUrlSaveResult" class="mt-2 px-3 py-2 rounded-md text-sm font-medium" :class="topowallUrlSaveResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ topowallUrlSaveResult.message }}
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
                <div class="text-sm font-medium text-gray-900">{{ formatTimestamp(firestoreConfig?.updatedAt || config?.timestamp) }}</div>
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
import { getBackendAppConfig, setHoldDetectionServerUrl, setClusterServerUrl, setTopowallServerUrl } from '@/services/appConfigService'

const loading = ref(true);
const error = ref(null);
const config = ref(null);
const firestoreConfig = ref(null);
const testing = ref(false);
const testResult = ref(null);
const testingMatch = ref(false);
const matchTestResult = ref(null);

const serverUrlDraft = ref('')
const savingServerUrl = ref(false)
const serverUrlSaveResult = ref(null)

const clusterUrlDraft = ref('')
const savingClusterUrl = ref(false)
const clusterUrlSaveResult = ref(null)

const topowallUrlDraft = ref('')
const savingTopowallUrl = ref(false)
const topowallUrlSaveResult = ref(null)

// 100x100 test images with actual features (checkerboard pattern)
// These have corners and edges that feature detectors can find
const TEST_IMAGE_1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA0UlEQVR42u3QMQEAAAgDILV/b3hA8yUFhiYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwzAUcmAABjLfBCAAAAABJRU5ErkJggg==';
const TEST_IMAGE_2 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA50lEQVR42u3PsQ0AIAwDwfD+O9NRsAVNxgURBSQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9dAAE2AAFN6qQGAAAAAElFTkSuQmCC';

const loadConfig = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true;
  error.value = null;
  
  try {
    const [backendConfig, appConfig] = await Promise.all([
      httpsCallable(functions, 'getBackendConfig')().then(r => r.data).catch(() => null),
      getBackendAppConfig({ forceRefresh: true }).catch(() => null)
    ])

    config.value = backendConfig
    firestoreConfig.value = appConfig
    serverUrlDraft.value = firestoreConfig.value?.holdDetection?.serverUrl || ''
    clusterUrlDraft.value = firestoreConfig.value?.cluster?.serverUrl || ''
    topowallUrlDraft.value = firestoreConfig.value?.topowall?.serverUrl || ''
  } catch (err) {
    console.error('Error loading backend config:', err);
    error.value = err.message || 'Failed to load configuration';
  } finally {
    if (!silent) loading.value = false;
  }
};

const saveServerUrl = async () => {
  savingServerUrl.value = true
  serverUrlSaveResult.value = null

  try {
    const nextUrl = serverUrlDraft.value?.trim()
    if (!nextUrl) {
      throw new Error('Please enter a URL')
    }
    if (!/^https?:\/\//i.test(nextUrl)) {
      throw new Error('URL must start with http:// or https://')
    }

    const saved = await setHoldDetectionServerUrl(nextUrl)
    serverUrlDraft.value = saved
    serverUrlSaveResult.value = { success: true, message: '✅ Saved' }

    firestoreConfig.value = {
      ...(firestoreConfig.value || {}),
      holdDetection: {
        ...(firestoreConfig.value?.holdDetection || {}),
        serverUrl: saved,
      }
    }

    await loadConfig({ silent: true })
  } catch (err) {
    serverUrlSaveResult.value = {
      success: false,
      message: `❌ Save failed: ${err.message || err}`
    }
  } finally {
    savingServerUrl.value = false
  }
}

const saveClusterUrl = async () => {
  savingClusterUrl.value = true
  clusterUrlSaveResult.value = null

  try {
    const nextUrl = clusterUrlDraft.value?.trim()
    // Allow empty string to clear the cluster URL (will fall back to hold detection URL)
    if (nextUrl && !/^https?:\/\//i.test(nextUrl)) {
      throw new Error('URL must start with http:// or https://')
    }

    const saved = await setClusterServerUrl(nextUrl || '')
    clusterUrlDraft.value = saved
    clusterUrlSaveResult.value = { success: true, message: '✅ Saved' }

    firestoreConfig.value = {
      ...(firestoreConfig.value || {}),
      cluster: {
        ...(firestoreConfig.value?.cluster || {}),
        serverUrl: saved,
      }
    }

    await loadConfig({ silent: true })
  } catch (err) {
    clusterUrlSaveResult.value = {
      success: false,
      message: `❌ Save failed: ${err.message || err}`
    }
  } finally {
    savingClusterUrl.value = false
  }
}

const saveTopowallUrl = async () => {
  savingTopowallUrl.value = true
  topowallUrlSaveResult.value = null

  try {
    const nextUrl = topowallUrlDraft.value?.trim()
    if (nextUrl && !/^https?:\/\//i.test(nextUrl)) {
      throw new Error('URL must start with http:// or https://')
    }

    const saved = await setTopowallServerUrl(nextUrl || '')
    topowallUrlDraft.value = saved
    topowallUrlSaveResult.value = { success: true, message: '✅ Saved' }

    firestoreConfig.value = {
      ...(firestoreConfig.value || {}),
      topowall: {
        ...(firestoreConfig.value?.topowall || {}),
        serverUrl: saved,
      }
    }

    await loadConfig({ silent: true })
  } catch (err) {
    topowallUrlSaveResult.value = {
      success: false,
      message: `❌ Save failed: ${err.message || err}`
    }
  } finally {
    savingTopowallUrl.value = false
  }
}

const testHoldDetection = async () => {
  if (!firestoreConfig.value?.holdDetection?.serverUrl) return;
  
  testing.value = true;
  testResult.value = null;
  
  try {
    const response = await fetch(`${firestoreConfig.value.holdDetection.serverUrl}/health`, {
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

const testMatchImages = async () => {
  if (!firestoreConfig.value?.holdDetection?.serverUrl) return;
  
  testingMatch.value = true;
  matchTestResult.value = null;
  
  try {
    // Extract base64 data from data URL
    const image1Base64 = TEST_IMAGE_1.split(',')[1];
    const image2Base64 = TEST_IMAGE_2.split(',')[1];
    
    // Mimic real transform points structure from extractTransformPoints()
    const requestBody = {
      image1: image1Base64,
      image2: image2Base64,
      output_filename: 'health_check_test.jpg',
      video_dimensions: { width: 100, height: 100 },
      location_dimensions: { width: 100, height: 100 },
      transform_points: [
        { id: 'left_wrist', name: 'Left Wrist', x: 25, y: 25 },
        { id: 'right_wrist', name: 'Right Wrist', x: 75, y: 25 },
        { id: 'left_ankle', name: 'Left Ankle', x: 25, y: 75 },
        { id: 'right_ankle', name: 'Right Ankle', x: 75, y: 75 }
      ],
      create_debug_images: true
    };
    
    console.log('🔬 Testing match-images API with sample data...');
    const startTime = performance.now();
    
    const response = await fetch(`${firestoreConfig.value.holdDetection.serverUrl}/api/v1/match-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(requestBody)
    });
    
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    
    if (response.ok) {
      const result = await response.json();
      
      // Check for debug URLs
      const hasDebugUrls = !!(
        result.debug_images?.combined_url ||
        result.visualizationUrl ||
        result.download_url ||
        result.pose_debug_url
      );
      
      matchTestResult.value = {
        success: true,
        message: `✅ API responding (${elapsed}s) - Debug URLs: ${hasDebugUrls ? '✅ Present' : '❌ Missing'}`,
        details: JSON.stringify({
          elapsed: `${elapsed}s`,
          hasHomography: !!result.homography_matrix,
          inliers: result.inlier_matches || 0,
          totalMatches: result.total_matches || 0,
          localizedTransforms: result.localized_transforms?.length || 0,
          debugUrls: {
            combined: result.debug_images?.combined_url || null,
            visualization: result.visualizationUrl || result.download_url || null,
            poseDebug: result.pose_debug_url || null
          }
        }, null, 2)
      };
    } else {
      const errorText = await response.text();
      matchTestResult.value = {
        success: false,
        message: `❌ API error: HTTP ${response.status}`,
        details: errorText
      };
    }
  } catch (err) {
    matchTestResult.value = {
      success: false,
      message: `❌ Request failed: ${err.message}`,
      details: err.stack
    };
  } finally {
    testingMatch.value = false;
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate().toLocaleString();
  }
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  loadConfig();
});
</script>
