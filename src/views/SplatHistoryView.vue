<template>
  <div class="history-page">
    <div class="header">

      <h1>Splat History</h1>
      <button class="refresh-btn" @click="load">↻ Refresh</button>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="jobs.length === 0" class="state-msg muted">No jobs yet.</div>

    <div v-else class="job-list">
      <div v-for="job in jobs" :key="job.job_id" class="job-card" :class="job.status">
        <div class="job-top">
          <div class="job-left">
            <span class="job-id">{{ job.job_id }}</span>
            <span class="badge" :class="job.status">{{ job.status }}</span>
          </div>
          <div class="job-right">
            <img v-if="job.thumbnail" :src="job.thumbnail" class="job-thumb" alt="splat preview" @click="openCaptureLightbox(job.job_id, job.thumbnail)" style="cursor:pointer" />
            <span class="time">{{ formatDate(job.created_at) }}</span>
            <span v-if="job.elapsed_s != null" class="elapsed">{{ formatElapsed(job.elapsed_s) }}</span>
          </div>
        </div>

        <div class="scene-name">{{ job.scene || '—' }}</div>

        <div v-if="job.params" class="params">
          <div v-for="(val, key) in displayParams(job.params)" :key="key" class="param">
            <span class="param-key">{{ key }}</span>
            <span class="param-val">{{ val }}</span>
          </div>
          <!-- Early stop outcome -->
          <div class="param" :class="job.early_stopped ? 'early-stop' : 'full-run'">
            <span class="param-key">stopped at</span>
            <span class="param-val">
              {{ job.early_stopped ? `iter ${job.stopped_at_iter} (early)` : (job.status === 'done' ? `iter ${job.params?.iters} (full)` : '—') }}
            </span>
          </div>
        </div>

        <!-- Multi-video filenames are shown inside each video-info row above -->

        <!-- Video info: one row per video -->
        <div v-if="job.video_infos.length" class="info-section">
          <span class="info-label">{{ job.video_infos.length === 1 ? 'Video' : `Videos (${job.video_infos.length})` }}</span>
          <div class="video-info-rows">
            <div v-for="(vi, idx) in job.video_infos" :key="idx" class="video-info-row">
              <span v-if="vi.filename" class="video-fname">{{ vi.filename }}</span>
              <div class="info-chips">
                <span v-if="vi.width && vi.height" class="chip">{{ vi.width }}×{{ vi.height }}</span>
                <span v-if="vi.duration_s != null" class="chip">{{ vi.duration_s }}s</span>
                <span v-if="vi.fps" class="chip">{{ vi.fps }} fps</span>
                <span v-if="vi.codec" class="chip codec">{{ vi.codec }}</span>
                <span v-if="vi.size_bytes" class="chip">{{ formatBytes(vi.size_bytes) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step timings -->
        <div v-if="job.pipeline_stats" class="info-section">
          <span class="info-label">Steps</span>
          <div class="steps">
            <div class="step">
              <span class="step-name">MASt3R</span>
              <span class="step-bar-wrap"><span class="step-bar mast3r" :style="stepWidth(job.pipeline_stats.mast3r_s, totalPipelineS(job))"></span></span>
              <span class="step-time">{{ formatElapsed(job.pipeline_stats.mast3r_s) }}</span>
            </div>
            <div class="step">
              <span class="step-name">3DGS train</span>
              <span class="step-bar-wrap"><span class="step-bar train" :style="stepWidth(job.pipeline_stats.train_s, totalPipelineS(job))"></span></span>
              <span class="step-time">{{ formatElapsed(job.pipeline_stats.train_s) }}</span>
            </div>
            <div v-if="job.pipeline_stats.ply2splat_s != null" class="step">
              <span class="step-name">PLY→splat</span>
              <span class="step-bar-wrap"><span class="step-bar ply2splat" :style="stepWidth(job.pipeline_stats.ply2splat_s, totalPipelineS(job))"></span></span>
              <span class="step-time">{{ formatElapsed(job.pipeline_stats.ply2splat_s) }}</span>
            </div>
          </div>
        </div>

        <div v-if="job.error" class="job-error">{{ job.error }}</div>

        <div v-if="job.status === 'done'" class="action-row">
          <RouterLink
            class="view-btn"
            :to="{ name: 'splat-viewer', params: { splatId: job.job_id } }"
          >
            View Splat →
          </RouterLink>
          <button class="view-btn rerun-btn" @click="rerunJob(job)">Run Again ↩</button>
          <button
            v-if="job.thumbnail"
            class="view-btn capture-btn"
            @click="toggleCapture(job.job_id)"
          >
            {{ expandedCapture.has(job.job_id) ? 'Hide Capture ✕' : 'View Capture 🖼' }}
          </button>
          <button class="view-btn log-btn" @click="toggleLogs(job.job_id)">
            {{ expandedLogs.has(job.job_id) ? 'Hide Logs ✕' : 'Logs 📄' }}
          </button>
          <button v-if="job.image_count > 0" class="view-btn img-btn" @click="toggleImages(job.job_id)">
            {{ expandedImages.has(job.job_id) ? 'Hide Images ✕' : `Images 🗂 (${job.image_count})` }}
          </button>
          <span v-else class="no-images">no images</span>
          <a :href="splatUrl(job.job_id)" class="view-btn dl-splat-btn" download>⬇ .splat</a>
          <a :href="plyUrl(job.job_id)" class="view-btn dl-ply-btn" download>⬇ .ply</a>
          <template v-for="v in job.stored_videos" :key="v.stored">
            <a :href="videoUrl(job.job_id, v.stored)" class="view-btn vid-btn" download>⬇ {{ v.filename }}</a>
          </template>
          <button class="view-btn del-btn" @click="deleteJob(job)">Delete 🗑</button>
        </div>

        <!-- Logs for non-done jobs too -->
        <div v-if="job.status !== 'done'" class="action-row">
          <button v-if="job.status === 'error'" class="view-btn rerun-btn" @click="rerunJob(job)">Run Again ↩</button>
          <button
            v-if="job.status === 'queued' || job.status === 'running'"
            class="view-btn cancel-btn"
            :disabled="cancellingJobs.has(job.job_id)"
            @click="cancelJob(job)"
          >
            {{ cancellingJobs.has(job.job_id) ? 'Cancelling…' : 'Cancel ✕' }}
          </button>
          <template v-if="job.status === 'queued'">
            <span class="queue-pos">Queue position: #{{ job.queue_position }}</span>
          </template>
          <button class="view-btn log-btn" @click="toggleLogs(job.job_id)">
            {{ expandedLogs.has(job.job_id) ? 'Hide Logs ✕' : 'Logs 📄' }}
          </button>
          <button class="view-btn del-btn" @click="deleteJob(job)">Delete 🗑</button>
        </div>

        <div v-if="expandedLogs.has(job.job_id)" class="log-expand">
          <pre v-if="jobLogs.get(job.job_id)?.length" class="log-pre-history">{{ jobLogs.get(job.job_id).join('\n') }}</pre>
          <p v-else class="log-empty-history">No log output available.</p>
        </div>

        <!-- Images grid -->
        <div v-if="expandedImages.has(job.job_id)" class="images-expand">
          <div v-if="jobImages.get(job.job_id)?.length" class="images-grid">
            <img
              v-for="fn in jobImages.get(job.job_id)"
              :key="fn"
              :src="imageUrl(job.job_id, fn)"
              class="frame-thumb"
              :alt="fn"
              loading="lazy"
              @click="openFrameLightbox(job.job_id, fn)"
            />
          </div>
          <p v-else class="log-empty-history">No images available.</p>
        </div>



        <div v-if="job.thumbnail && expandedCapture.has(job.job_id)" class="capture-preview">
          <img :src="job.thumbnail" alt="splat capture" class="capture-img" @click="openCaptureLightbox(job.job_id, job.thumbnail)" />
        </div>
      </div>
    </div>

    <!-- Lightbox overlay -->
    <Teleport to="body">
      <div v-if="lightboxSrc" class="lightbox-overlay" @click="closeLightbox">
        <button class="lightbox-close" @click.stop="closeLightbox">✕</button>
        <button v-if="lightboxList.length > 1" class="lightbox-arrow lightbox-prev" @click.stop="lightboxStep(-1)">‹</button>
        <img :src="lightboxSrc" class="lightbox-img" alt="full size" @click.stop />
        <button v-if="lightboxList.length > 1" class="lightbox-arrow lightbox-next" @click.stop="lightboxStep(1)">›</button>
        <div v-if="lightboxList.length > 1" class="lightbox-counter">{{ lightboxIndex + 1 }} / {{ lightboxList.length }}</div>
        <div v-if="lightboxJob" class="lightbox-params" @click.stop>
          <span class="lightbox-job-id">{{ lightboxJob.job_id }}</span>
          <div v-for="(val, key) in displayParams(lightboxJob.params ?? {})" :key="key" class="param">
            <span class="param-key">{{ key }}</span>
            <span class="param-val">{{ val }}</span>
          </div>
          <div class="param" :class="lightboxJob.early_stopped ? 'early-stop' : 'full-run'">
            <span class="param-key">stopped at</span>
            <span class="param-val">{{ lightboxJob.early_stopped ? `iter ${lightboxJob.stopped_at_iter} (early)` : (lightboxJob.status === 'done' ? `iter ${lightboxJob.params?.iters} (full)` : '—') }}</span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const router = useRouter();
const route = useRoute();
const jobs = ref([]);
const loading = ref(true);
const error = ref('');
const expandedCapture = ref(new Set());
const expandedLogs = ref(new Set());
const expandedImages = ref(new Set());
const jobLogs = ref(new Map());
const jobImages = ref(new Map());
const cancellingJobs = ref(new Set());
let gatewayCache = null;
async function resolvedGateway() {
  if (!gatewayCache) gatewayCache = await getGateway();
  return gatewayCache;
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
const lightboxList = ref([]);   // array of { src, jobId, filename }
const lightboxIndex = ref(0);
const lightboxSrc = computed(() => lightboxList.value[lightboxIndex.value]?.src ?? null);
const lightboxJob = computed(() => {
  const item = lightboxList.value[lightboxIndex.value];
  return item ? jobs.value.find(j => j.job_id === item.jobId) ?? null : null;
});

function openLightbox(list, index) {
  lightboxList.value = list;
  lightboxIndex.value = index;
  const item = list[index];
  router.replace({ query: { ...route.query, img: `${item.jobId}/${item.filename}` } });
}

function closeLightbox() {
  lightboxList.value = [];
  lightboxIndex.value = 0;
  const q = { ...route.query };
  delete q.img;
  router.replace({ query: q });
}

function lightboxStep(dir) {
  const n = lightboxList.value.length;
  if (n < 2) return;
  lightboxIndex.value = (lightboxIndex.value + dir + n) % n;
  const item = lightboxList.value[lightboxIndex.value];
  router.replace({ query: { ...route.query, img: `${item.jobId}/${item.filename}` } });
}

function onKeydown(e) {
  if (!lightboxSrc.value) return;
  if (e.key === 'ArrowRight') lightboxStep(1);
  else if (e.key === 'ArrowLeft') lightboxStep(-1);
  else if (e.key === 'Escape') closeLightbox();
}

// Open frame images for a job card
function openFrameLightbox(jobId, filename) {
  const frames = jobImages.value.get(jobId) ?? [];
  const list = frames.map(fn => ({ src: imageUrl(jobId, fn), jobId, filename: fn }));
  const idx = Math.max(0, list.findIndex(x => x.filename === filename));
  openLightbox(list, idx);
}

// Open capture/thumbnail — builds a list of all jobs with thumbnails for arrow navigation
function openCaptureLightbox(jobId, src) {
  const list = jobs.value
    .filter(j => j.thumbnail)
    .map(j => ({ src: j.thumbnail, jobId: j.job_id, filename: 'capture' }));
  const idx = Math.max(0, list.findIndex(x => x.jobId === jobId));
  openLightbox(list.length ? list : [{ src, jobId, filename: 'capture' }], idx);
}

// Restore lightbox from URL on load (after jobs are loaded)
function restoreLightboxFromUrl() {
  const imgParam = route.query.img;
  if (!imgParam) return;
  const slash = imgParam.indexOf('/');
  if (slash < 0) return;
  const jobId = imgParam.slice(0, slash);
  const filename = imgParam.slice(slash + 1);
  if (filename === 'capture') {
    const job = jobs.value.find(j => j.job_id === jobId);
    if (job?.thumbnail) openCaptureLightbox(jobId, job.thumbnail);
  } else {
    // Frames need to be loaded first
    toggleImages(jobId).then(() => openFrameLightbox(jobId, filename));
  }
}

function toggleCapture(jobId) {
  const s = new Set(expandedCapture.value);
  s.has(jobId) ? s.delete(jobId) : s.add(jobId);
  expandedCapture.value = s;
}

async function toggleImages(jobId) {
  const s = new Set(expandedImages.value);
  if (s.has(jobId)) { s.delete(jobId); expandedImages.value = s; return; }
  s.add(jobId);
  expandedImages.value = s;
  if (!jobImages.value.has(jobId)) {
    try {
      const gateway = await resolvedGateway();
      const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${jobId}/images`);
      if (res.ok) {
        const data = await res.json();
        const m = new Map(jobImages.value);
        m.set(jobId, data.images ?? []);
        jobImages.value = m;
      }
    } catch { /* silent */ }
  }
}

function imageUrl(jobId, filename) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/images/${filename}`;
}

function videoUrl(jobId, storedFilename) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/video/${storedFilename}`;
}

function splatUrl(jobId) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/splat`;
}

function plyUrl(jobId) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/ply`;
}

async function cancelJob(job) {
  const s = new Set(cancellingJobs.value);
  s.add(job.job_id);
  cancellingJobs.value = s;
  try {
    const gateway = await resolvedGateway();
    await fetch(`${gateway}/topowall/api/v1/video-to-splat/${job.job_id}/cancel`, { method: 'POST' });
    jobs.value = jobs.value.map(j =>
      j.job_id === job.job_id ? { ...j, status: 'cancelled', queue_position: null } : j
    );
  } catch { /* best-effort */ } finally {
    const s2 = new Set(cancellingJobs.value);
    s2.delete(job.job_id);
    cancellingJobs.value = s2;
  }
}

async function deleteJob(job) {
  if (!confirm(`Delete job ${job.job_id}? This removes all files from the server and cannot be undone.`)) return;
  try {
    const gateway = await resolvedGateway();
    await fetch(`${gateway}/topowall/api/v1/video-to-splat/${job.job_id}`, { method: 'DELETE' });
  } catch { /* best-effort */ }
  // Remove from localStorage
  localStorage.removeItem(`splat-thumb-${job.job_id}`);
  localStorage.removeItem(`splat-${job.job_id}`);
  // Remove from list
  jobs.value = jobs.value.filter(j => j.job_id !== job.job_id);
}

async function toggleLogs(jobId) {
  const s = new Set(expandedLogs.value);
  if (s.has(jobId)) {
    s.delete(jobId);
    expandedLogs.value = s;
    return;
  }
  s.add(jobId);
  expandedLogs.value = s;
  if (!jobLogs.value.has(jobId)) {
    try {
      const gateway = await resolvedGateway();
      const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${jobId}/logs`);
      if (res.ok) {
        const data = await res.json();
        const m = new Map(jobLogs.value);
        m.set(jobId, data.log_lines ?? []);
        jobLogs.value = m;
      }
    } catch { /* silent */ }
  }
}

function rerunJob(job) {
  sessionStorage.setItem('splat-rerun', JSON.stringify({
    jobId: job.job_id,
    scene: job.scene,
    params: job.params,
    storedVideos: job.stored_videos,
  }));
  router.push({ name: 'splat-upload' });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/jobs`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    gatewayCache = gateway;
    jobs.value = data.jobs.map(job => {
      // Normalize legacy shapes so the template always sees arrays
      const videoInfos = Array.isArray(job.video_info)
        ? job.video_info
        : job.video_info ? [job.video_info] : [];

      const params = job.params ? { ...job.params } : null;
      if (params) {
        // Normalize old filename/video_count to filenames[]
        if (!params.filenames) {
          const fn = params.filename;
          params.filenames = fn ? (Array.isArray(fn) ? fn : [fn]) : [];
        }
        delete params.filename;
        delete params.video_count;
      }

      return {
        ...job,
        video_infos: videoInfos,
        params,
        stored_videos: job.stored_videos ?? [],
        image_count: job.image_count ?? 0,
        thumbnail: localStorage.getItem(`splat-thumb-${job.job_id}`) || null,
      };
    });
  } catch (err) {
    error.value = 'Failed to load history: ' + err.message;
  } finally {
    loading.value = false;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatElapsed(seconds) {
  if (seconds == null) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function displayParams(params) {
  const skip = ['filenames', 'filename', 'scene', 'video_count'];
  return Object.fromEntries(
    Object.entries(params)
      .filter(([k, v]) => !skip.includes(k) && v != null)
      .map(([k, v]) => k === 'early_stop' ? ['early stop', v ? 'on' : 'off'] : [k, v])
  );
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function totalPipelineS(job) {
  const s = job.pipeline_stats;
  if (!s) return null;
  return (s.mast3r_s || 0) + (s.train_s || 0) + (s.ply2splat_s || 0) || null;
}

function stepWidth(stepS, totalS) {
  if (!stepS || !totalS || totalS === 0) return { width: '0%' };
  return { width: `${Math.min(100, Math.round((stepS / totalS) * 100))}%` };
}

onMounted(async () => {
  await load();
  restoreLightboxFromUrl();
  window.addEventListener('keydown', onKeydown);
});
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: #111;
  color: #ccc;
  padding: 24px 20px 40px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 1.3rem;
  color: #fff;
  flex: 1;
  margin: 0;
}

.refresh-btn {
  padding: 7px 14px;
  background: rgba(255,255,255,0.07);
  color: #ccc;
  border: 1px solid #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
}
.refresh-btn:hover { background: rgba(255,255,255,0.13); }

.state-msg {
  text-align: center;
  margin-top: 60px;
  font-size: 1rem;
  color: #555;
}
.state-msg.error { color: #f87171; }
.state-msg.muted { color: #444; }

.job-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
  margin: 0 auto;
}

.job-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.job-card.done { border-color: #1a4731; }
.job-card.error { border-color: #4a1a1a; }
.job-card.running { border-color: #1a3050; }
.job-card.queued { border-color: #78350f; }

.job-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.job-left { display: flex; align-items: center; gap: 10px; }
.job-right { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; }
.job-thumb { width: 80px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #333; flex-shrink: 0; }

.job-id {
  font-family: monospace;
  font-size: 0.85rem;
  color: #6b7280;
}

.badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.badge.done { background: #14532d; color: #6ee7b7; }
.badge.error { background: #7f1d1d; color: #fca5a5; }
.badge.running { background: #1e3a5f; color: #93c5fd; }
.badge.queued { background: #78350f; color: #fbbf24; }
.badge.cancelled { background: #374151; color: #9ca3af; }

.time { color: #6b7280; }
.elapsed {
  color: #9ca3af;
  background: #1f2937;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
}

.scene-name {
  font-size: 1rem;
  color: #e5e7eb;
  font-weight: 500;
}

.params {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.param {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 0.78rem;
}

.param-key { color: #6b7280; }
.param-val { color: #d1d5db; font-family: monospace; }

.job-error {
  font-size: 0.78rem;
  color: #f87171;
  background: #1c0f0f;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #3f1515;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 120px;
  overflow-y: auto;
}

.param.early-stop .param-val { color: #fbbf24; }
.param.full-run .param-val { color: #6ee7b7; }

.lightbox-params {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  pointer-events: none;
}
.lightbox-job-id {
  font-size: 0.72rem;
  font-family: monospace;
  color: #4b5563;
  margin-right: 4px;
}
.lightbox-params .param {
  pointer-events: none;
  background: rgba(17,24,39,0.85);
  border-color: #374151;
}

.info-section {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.video-info-rows { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.video-info-row { display: flex; flex-direction: column; gap: 3px; }
.video-fname { font-size: 0.75rem; color: #6b7280; font-style: italic; }

.info-label {
  font-size: 0.72rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  width: 44px;
  flex-shrink: 0;
  padding-top: 3px;
}

.info-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}



.chip {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.78rem;
  color: #9ca3af;
  font-family: monospace;
}
.chip.codec { color: #6b7280; }

.steps {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
}

.step-name {
  width: 70px;
  color: #6b7280;
  flex-shrink: 0;
}

.step-bar-wrap {
  flex: 1;
  height: 6px;
  background: #1f2937;
  border-radius: 3px;
  overflow: hidden;
}

.step-bar {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.step-bar.mast3r   { background: #7c3aed; }
.step-bar.train     { background: #2563eb; }
.step-bar.ply2splat { background: #0d9488; }

.step-time {
  width: 46px;
  text-align: right;
  color: #9ca3af;
  font-family: monospace;
  flex-shrink: 0;
}

.view-btn {
  align-self: flex-start;
  padding: 8px 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
}
.view-btn:hover { background: #1d4ed8; }

.action-row { display: flex; gap: 8px; flex-wrap: wrap; }

.capture-btn { background: #4f46e5; }
.capture-btn:hover { background: #4338ca; }

.log-btn { background: #374151; }
.log-btn:hover { background: #4b5563; }

.log-expand { margin-top: 8px; }
.log-pre-history {
  background: #1a1a1a;
  border: 1px solid #2d2d2d;
  border-radius: 6px;
  padding: 10px 12px;
  color: #9ca3af;
  font-size: 0.68rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
.log-empty-history {
  color: #6b7280;
  font-style: italic;
  font-size: 0.8rem;
}

.capture-preview {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
}
.capture-img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 420px;
  object-fit: contain;
  background: #000;
}

.img-btn { background: #065f46; }
.img-btn:hover { background: #047857; }

.rerun-btn { background: #7c3aed; }
.rerun-btn:hover { background: #6d28d9; }

.no-images {
  font-size: 0.78rem;
  color: #4b5563;
  align-self: center;
}

.vid-btn {
  background: #7c2d12;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.vid-btn:hover { background: #9a3412; }

.dl-splat-btn {
  background: #1e3a5f;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.dl-splat-btn:hover { background: #1e40af; }

.dl-ply-btn {
  background: #1a3a2a;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.dl-ply-btn:hover { background: #166534; }

.del-btn { background: #7f1d1d; margin-left: auto; }
.del-btn:hover { background: #991b1b; }

.cancel-btn { background: #92400e; color: #fde68a; }
.cancel-btn:hover:not(:disabled) { background: #b45309; }
.cancel-btn:disabled { opacity: 0.5; cursor: default; }

.queue-pos {
  font-size: 0.78rem;
  color: #fbbf24;
  background: #78350f;
  padding: 2px 8px;
  border-radius: 4px;
}

.images-expand { margin-top: 8px; }
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px;
}
.frame-thumb {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #2a2a2a;
  background: #0d0d0d;
  cursor: pointer;
  transition: opacity 0.15s, border-color 0.15s;
}
.frame-thumb:hover { opacity: 0.85; border-color: #4b9eff; }

.capture-img { cursor: pointer; }

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.lightbox-img {
  max-width: 95vw;
  max-height: 93vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.8);
  cursor: default;
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 1;
}
.lightbox-close:hover { background: rgba(255,255,255,0.22); }

.lightbox-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 1;
  user-select: none;
}
.lightbox-arrow:hover { background: rgba(255,255,255,0.25); }
.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }

.lightbox-counter {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: #ccc;
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 999px;
  pointer-events: none;
}
</style>
