<template>
  <div class="location-jobs-view">
    <div class="header">
      <h1>Background Jobs</h1>
      <p class="subtitle">Active video analysis tasks</p>
    </div>

    <div v-if="activeJobs.length === 0" class="empty-state">
      <p>No active jobs</p>
      <p class="hint">Upload a video to see analysis progress here</p>
    </div>

    <div v-else class="jobs-list">
      <div 
        v-for="job in activeJobs" 
        :key="job.id"
        class="job-card"
        :class="{ 
          'error': job.status === 'error',
          'complete': job.status === 'complete'
        }"
      >
        <div class="job-header">
          <h3>
            <span v-if="job.status === 'complete'">✅ </span>
            {{ job.status === 'complete' ? 'Complete' : (getProblemName(job) || 'Analyzing...') }}
          </h3>
          <span class="time-ago">{{ getTimeAgo(job.createdAt) }}</span>
        </div>

        <div class="job-status">
          <span class="status-label">
            <template v-if="job.status === 'complete' && job.detectedProblemId">
              Identified problem: 
              <router-link 
                :to="`/location/${locationId}/problem/${job.detectedProblemId}`"
                class="problem-link"
              >
                "{{ getDetectedProblemName(job) }}"
              </router-link>
            </template>
            <template v-else-if="job.status === 'complete'">
              {{ getStatusLabel(job.status) }} (no problem detected)
            </template>
            <template v-else>
              {{ getStatusLabel(job.status) }}
            </template>
          </span>
          <span class="step-info">{{ getCurrentStep(job) }}</span>
        </div>

        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${job.progress}%` }"
          ></div>
        </div>

        <div class="job-meta">
          <span>Progress: {{ job.progress }}%</span>
          <span v-if="job.status === 'complete' && job.detectedProblemId">
            ✅ Detected: 
            <router-link 
              :to="`/location/${locationId}/problem/${job.detectedProblemId}`"
              class="problem-link"
            >
              {{ getDetectedProblemName(job) }}
            </router-link>
          </span>
        </div>

        <div v-if="job.error" class="error-message">
          ❌ {{ job.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVideoAnalysisQueueStore } from '../stores/videoAnalysisQueueStore.js';
import { useRoute } from 'vue-router';

const route = useRoute();
const locationId = computed(() => route.params.locationId);
const analysisStore = useVideoAnalysisQueueStore();

// Filter jobs for this location (including completed)
const activeJobs = computed(() => {
  const allJobs = Object.values(analysisStore.jobs);
  
  return allJobs
    .filter(job => {
      // Only show jobs for this location
      if (job.locationId !== locationId.value) return false;
      
      // Show all jobs (including completed) - they'll go away on page refresh
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Newest first
});

const getStatusLabel = (status) => {
  const labels = {
    'queued': 'Queued',
    'extracting': 'Extracting frames',
    'detecting': 'Analyzing pose',
    'matching': 'Matching location',
    'loading-holds': 'Matching location',  // Group with matching
    'scoring': 'Identifying problem',
    'updating': 'Identifying problem',  // Group with scoring
    'complete': 'Complete',
    'error': 'Error'
  };
  return labels[status] || status;
};

const getCurrentStep = (job) => {
  const steps = {
    'detecting': 'Step 1/3',
    'matching': 'Step 2/3',
    'loading-holds': 'Step 2/3',  // Group with matching
    'scoring': 'Step 3/3',
    'updating': 'Step 3/3'  // Group with scoring
  };
  return steps[job.status] || '';
};

const getProblemName = (job) => {
  // Try to find problem name from detected problem
  if (job.detectedProblemId && job.boulderProblems) {
    const problem = job.boulderProblems.find(p => p.id === job.detectedProblemId);
    return problem?.name;
  }
  return null;
};

const getDetectedProblemName = (job) => {
  if (job.detectedProblemId && job.boulderProblems) {
    const problem = job.boulderProblems.find(p => p.id === job.detectedProblemId);
    return problem?.name || 'Unknown';
  }
  return 'Unknown';
};

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};
</script>

<style scoped>
.location-jobs-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin: 0 0 8px 0;
}

.empty-state .hint {
  font-size: 14px;
  color: #999;
}

.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.job-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.job-card.error {
  border-color: #f44336;
  background: #fff5f5;
}

.job-card.complete {
  border-color: #4caf50;
  background: #f5fff5;
  opacity: 0.8;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.job-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.time-ago {
  font-size: 13px;
  color: #999;
}

.job-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.status-label {
  font-weight: 500;
  color: #333;
}

.step-info {
  color: #666;
  font-size: 13px;
}

.progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.job-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: #ffebee;
  border-left: 3px solid #f44336;
  font-size: 13px;
  color: #c62828;
  border-radius: 4px;
}

.problem-link {
  color: #2196f3;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.problem-link:hover {
  color: #1976d2;
  text-decoration: underline;
}
</style>
