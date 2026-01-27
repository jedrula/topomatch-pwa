<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Diagnostic Reports</h1>
    
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white p-4 rounded-lg border">
        <div class="text-sm text-gray-600">Total Reports</div>
        <div class="text-2xl font-bold">{{ reports.length }}</div>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div class="text-sm text-blue-600">Manual Reports</div>
        <div class="text-2xl font-bold text-blue-700">{{ manualCount }}</div>
      </div>
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div class="text-sm text-gray-600">Auto Reports</div>
        <div class="text-2xl font-bold">{{ autoCount }}</div>
      </div>
      <div class="bg-red-50 p-4 rounded-lg border border-red-200">
        <div class="text-sm text-red-600">Last 24h</div>
        <div class="text-2xl font-bold text-red-700">{{ recentCount }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-lg border mb-6 space-y-4">
      <div class="flex gap-4 items-center">
        <label class="flex items-center gap-2">
          <input type="radio" v-model="filter" value="all" />
          <span>All Reports</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" v-model="filter" value="manual" />
          <span>Manual Only</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="radio" v-model="filter" value="auto" />
          <span>Auto Only</span>
        </label>
      </div>
      
      <!-- User Filter -->
      <div class="border-t pt-4">
        <div class="flex items-center gap-3 mb-2">
          <label class="text-sm font-medium text-gray-700">Filter by User:</label>
          <input
            v-model="userIdFilter"
            type="text"
            placeholder="Enter user ID or select below"
            class="px-3 py-1 border rounded text-sm flex-1 max-w-md"
            @input="handleUserFilterChange"
          />
          <button
            v-if="userIdFilter"
            @click="clearUserFilter"
            class="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        
        <!-- Quick select from unique users -->
        <div v-if="uniqueUsers.length > 0" class="flex flex-wrap gap-2">
          <span class="text-xs text-gray-500">Quick select:</span>
          <button
            v-for="userId in uniqueUsers.slice(0, 10)"
            :key="userId"
            @click="selectUser(userId)"
            :class="[
              'px-2 py-1 rounded text-xs transition-colors',
              userIdFilter === userId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ userId.substring(0, 8) }}...
          </button>
          <span v-if="uniqueUsers.length > 10" class="text-xs text-gray-400">
            +{{ uniqueUsers.length - 10 }} more
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8 text-gray-500">
      Loading reports...
    </div>

    <!-- Reports List -->
    <div v-else class="space-y-4">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <span
              :class="[
                'px-2 py-1 rounded text-xs font-medium',
                report.autoReported
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-blue-100 text-blue-700'
              ]"
            >
              {{ report.autoReported ? 'Auto' : 'Manual' }}
            </span>
            <span
              v-if="report.context?.type"
              class="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700"
            >
              {{ report.context.type }}
            </span>
          </div>
          <div class="text-sm text-gray-500">
            {{ formatDate(report.timestamp) }}
          </div>
        </div>

        <!-- Error Message -->
        <div class="mb-3">
          <div class="font-medium text-gray-900 mb-1">
            {{ getErrorMessage(report) }}
          </div>
          <div v-if="report.context?.userComment" class="text-sm text-gray-600 italic">
            "{{ report.context.userComment }}"
          </div>
        </div>

        <!-- Device Info -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
          <div>
            <span class="text-gray-500">User ID:</span>
            <span class="ml-1 font-medium text-xs break-all">{{ report.userId || 'unknown' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Platform:</span>
            <span class="ml-1 font-medium">{{ report.device?.platform || 'unknown' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Memory:</span>
            <span class="ml-1 font-medium">{{ report.device?.memoryGB || '?' }}GB</span>
          </div>
          <div>
            <span class="text-gray-500">Connection:</span>
            <span class="ml-1 font-medium">{{ report.device?.connection || 'unknown' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Version:</span>
            <span class="ml-1 font-medium">{{ report.appVersion || 'unknown' }}</span>
          </div>
        </div>

        <!-- Expand/Collapse Details -->
        <button
          @click="toggleExpanded(report.id)"
          class="text-sm text-blue-600 hover:text-blue-700"
        >
          {{ expandedReports.has(report.id) ? 'Hide' : 'Show' }} Details
        </button>

        <!-- Expanded Details -->
        <div v-if="expandedReports.has(report.id)" class="mt-4 space-y-4">
          <!-- Stack Trace -->
          <div v-if="getStackTrace(report)" class="bg-gray-50 p-3 rounded text-xs">
            <div class="font-medium text-gray-700 mb-2">Stack Trace:</div>
            <pre class="whitespace-pre-wrap font-mono text-gray-600">{{ getStackTrace(report) }}</pre>
          </div>

          <!-- Recent Logs -->
          <div v-if="report.recentLogs?.length" class="bg-gray-50 p-3 rounded">
            <div class="font-medium text-gray-700 mb-2">Recent Logs (last {{ report.recentLogs.length }}):</div>
            <div class="space-y-1 text-xs max-h-64 overflow-y-auto">
              <div
                v-for="(log, i) in report.recentLogs"
                :key="i"
                :class="[
                  'py-1 px-2 rounded',
                  log.level === 'error' ? 'bg-red-50' : 'bg-white'
                ]"
              >
                <span class="text-gray-500">{{ formatLogTime(log.time) }}</span>
                <span
                  :class="[
                    'ml-2 font-medium',
                    log.level === 'error' ? 'text-red-700' : 'text-gray-700'
                  ]"
                >
                  {{ log.message }}
                </span>
                <span v-if="log.args" class="ml-1 text-gray-600">
                  {{ log.args.join(' ') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Storage Info -->
          <div v-if="report.storage" class="bg-gray-50 p-3 rounded text-sm">
            <div class="font-medium text-gray-700 mb-2">Storage:</div>
            <div class="text-gray-600">
              {{ report.storage.usedMB }}MB / {{ report.storage.quotaMB }}MB
              ({{ report.storage.percentUsed }}% used)
            </div>
          </div>

          <!-- User Agent -->
          <div v-if="report.device?.userAgent" class="bg-gray-50 p-3 rounded text-xs">
            <div class="font-medium text-gray-700 mb-2">User Agent:</div>
            <div class="text-gray-600 break-all">{{ report.device.userAgent }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredReports.length === 0" class="text-center py-12 text-gray-500">
        No reports found
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/services/firebase';

const reports = ref([]);
const loading = ref(true);
const filter = ref('all');
const userIdFilter = ref('');
const expandedReports = ref(new Set());

const manualCount = computed(() => 
  reports.value.filter(r => !r.autoReported).length
);

const autoCount = computed(() => 
  reports.value.filter(r => r.autoReported).length
);

const recentCount = computed(() => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return reports.value.filter(r => 
    new Date(r.timestamp) > oneDayAgo
  ).length;
});

const uniqueUsers = computed(() => {
  const userIds = new Set();
  reports.value.forEach(r => {
    if (r.userId) userIds.add(r.userId);
  });
  return Array.from(userIds);
});

const filteredReports = computed(() => {
  if (filter.value === 'manual') {
    return reports.value.filter(r => !r.autoReported);
  }
  if (filter.value === 'auto') {
    return reports.value.filter(r => r.autoReported);
  }
  return reports.value;
});

const loadReports = async () => {
  loading.value = true;
  try {
    // Build query with optional user filter
    let q;
    if (userIdFilter.value) {
      q = query(
        collection(db, 'diagnosticReports'),
        where('userId', '==', userIdFilter.value),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        collection(db, 'diagnosticReports'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
    }
    
    const snapshot = await getDocs(q);
    reports.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Already sorted by timestamp desc from Firestore query
    // No additional sorting needed - newest reports appear first
  } catch (error) {
    console.error('Failed to load reports:', error);
  } finally {
    loading.value = false;
  }
};

const toggleExpanded = (reportId) => {
  if (expandedReports.value.has(reportId)) {
    expandedReports.value.delete(reportId);
  } else {
    expandedReports.value.add(reportId);
  }
};

const selectUser = (userId) => {
  userIdFilter.value = userId;
  loadReports();
};

const clearUserFilter = () => {
  userIdFilter.value = '';
  loadReports();
};

const handleUserFilterChange = () => {
  // Debounce would be nice here, but for simplicity just reload on enter
  // User can type the full ID and press Enter, or use quick select buttons
};

const getErrorMessage = (report) => {
  // For console.error logs, look in recentLogs array
  if (report.recentLogs && Array.isArray(report.recentLogs)) {
    const consoleErrors = report.recentLogs.filter(log => 
      log.level === 'error' && log.message === 'Console error' && log.args
    );
    if (consoleErrors.length > 0) {
      // Get the most recent console error
      const lastError = consoleErrors[consoleErrors.length - 1];
      return lastError.args.join(' ');
    }
  }
  
  // Try context.error paths
  if (report.context?.error?.args) {
    return report.context.error.args.join(' ');
  }
  if (report.context?.error?.message) return report.context.error.message;
  if (report.context?.error?.reason) return report.context.error.reason;
  if (report.context?.message) return report.context.message;
  return 'Unknown error';
};

const getStackTrace = (report) => {
  return report.context?.error?.stack || null;
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const formatLogTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

onMounted(() => {
  loadReports();
});
</script>
