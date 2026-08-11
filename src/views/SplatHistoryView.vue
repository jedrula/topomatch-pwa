<template>
  <div class="history-page">
    <div class="header">

      <h1>Splat History</h1>
      <button class="refresh-btn" @click="load">↻ Refresh</button>
    </div>

    <HistoryFilters
      v-if="!loading && !error && jobs.length > 0"
      v-model="filters"
      :jobs="jobs"
      :total-count="jobs.length"
      :match-count="filteredJobs.length"
    />

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <div v-else-if="jobs.length === 0" class="state-msg muted">No jobs yet.</div>
    <div v-else-if="filteredJobs.length === 0" class="state-msg muted">No jobs match the current filters.</div>

    <div v-else class="job-list">
      <div v-for="job in filteredJobs" :key="job.job_id" class="job-card" :class="job.status">
        <div class="job-top">
          <div class="job-left">
            <span class="job-id">{{ job.job_id }}</span>
            <span class="badge" :class="job.status">{{ job.status }}</span>
            <span v-if="job.executor === 'vast'" class="badge vast" :title="'vast instance ' + job.vast_instance_id">VAST ☁</span>
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
              <span class="step-name">{{ job.pipeline_stats.sfm || job.params?.sfm || 'sfm' }}</span>
              <span class="step-bar-wrap"><span class="step-bar mast3r" :style="stepWidth(job.pipeline_stats.sfm_s, totalPipelineS(job))"></span></span>
              <span class="step-time">{{ formatElapsed(job.pipeline_stats.sfm_s) }}</span>
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

        <!-- Quality metrics -->
        <div v-if="job.metrics && (job.metrics.psnr != null || job.metrics.registered_images != null)" class="metrics-row">
          <span v-if="job.metrics.psnr != null" class="metric" :class="psnrClass(job.metrics.psnr)" title="PSNR — higher is better. >24 dB = good, >22 = ok, <20 = poor">
            PSNR {{ job.metrics.psnr.toFixed(1) }} dB
          </span>
          <span v-if="job.metrics.ssim != null" class="metric" title="SSIM — structural similarity, 0–1, higher better">
            SSIM {{ job.metrics.ssim.toFixed(3) }}
          </span>
          <span v-if="job.metrics.lpips != null" class="metric" title="LPIPS — perceptual loss, lower better">
            LPIPS {{ job.metrics.lpips.toFixed(3) }}
          </span>
          <span v-if="job.metrics.registered_images != null" class="metric muted" title="SfM: registered images / sparse points">
            📷 {{ job.metrics.registered_images }}{{ job.image_count ? '/' + job.image_count : '' }}
          </span>
          <span v-if="job.metrics.sfm_points != null" class="metric muted" title="Sparse point count from SfM">
            pts {{ job.metrics.sfm_points.toLocaleString() }}
          </span>
          <span v-if="job.metrics.gaussian_count != null" class="metric muted" title="Number of Gaussians in splat">
            G {{ (job.metrics.gaussian_count / 1000).toFixed(0) }}k
          </span>
        </div>

        <!-- Note -->
        <div class="note-section">
          <template v-if="editingNotes.has(job.job_id)">
            <textarea
              class="note-textarea"
              :ref="el => el && el.focus()"
              v-model="pendingNotes[job.job_id]"
              @blur="saveNote(job.job_id)"
              @keydown.esc="cancelNoteEdit(job.job_id)"
              placeholder="Note quality, floaters, initial view, settings impressions…"
              rows="3"
            ></textarea>
            <div class="note-edit-actions">
              <button class="note-save-btn" @mousedown.prevent @click="saveNote(job.job_id)">Save</button>
              <button class="note-cancel-btn" @mousedown.prevent @click="cancelNoteEdit(job.job_id)">Cancel</button>
            </div>
          </template>
          <div
            v-else
            class="note-display"
            :class="{ 'note-empty': !job.note }"
            @click="startNoteEdit(job.job_id, job.note)"
            :title="job.note ? 'Click to edit note' : 'Click to add note'"
          >{{ job.note || 'Add note…' }}</div>
        </div>

        <div v-if="job.status === 'done'" class="action-row">
          <RouterLink
            class="view-btn"
            :to="{ name: 'splat-viewer', params: { splatId: job.job_id } }"
            target="_blank"
          >
            View Splat →<span v-if="job.splat_size_bytes" class="splat-size-inline"> {{ (job.splat_size_bytes / 1024 / 1024).toFixed(1) }} MB</span>
          </RouterLink>
          <RouterLink
            class="view-btn walk-btn"
            :to="{ name: 'splat-walk', params: { splatId: job.job_id } }"
            target="_blank"
          >
            Walk / Fly 🚶
          </RouterLink>
          <RouterLink
            class="view-btn walk2-btn"
            :to="{ name: 'splat-walk2', params: { splatId: job.job_id } }"
            target="_blank"
            title="POC: PlayCanvas + SOG — 13.7x smaller download, spherical harmonics preserved"
          >
            Walk v2 ⚡
          </RouterLink>
          <button class="view-btn rerun-btn" @click="rerunJob(job)">Run Again ↩</button>
          <button class="view-btn fork-btn" @click="toggleFork(job.job_id)">
            {{ expandedFork.has(job.job_id) ? 'Cancel ✕' : 'Fork Training ⑂' }}
          </button>
          <button
            v-if="job.thumbnail"
            class="view-btn capture-btn"
            @click="toggleCapture(job.job_id)"
          >
            {{ expandedCapture.has(job.job_id) ? 'Hide Capture ✕' : 'View Capture 🖼' }}
          </button>
          <button v-if="job.has_pointcloud" class="view-btn pc-btn" @click="togglePointCloud(job.job_id)">
            {{ expandedPointCloud.has(job.job_id) ? 'Hide Cloud ✕' : 'Point Cloud ✦' }}
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
          <a v-if="job.has_colmap_sparse" :href="colmapDatasetUrl(job.job_id)" class="view-btn dl-colmap-btn" download>⬇ COLMAP</a>
          <template v-for="v in job.stored_videos" :key="v.stored">
            <a :href="videoUrl(job.job_id, v.stored)" class="view-btn vid-btn" download>⬇ {{ v.filename }}</a>
          </template>
          <button class="view-btn assign-toggle-btn" @click="toggleAssign(job.job_id)">
            {{ expandedAssign.has(job.job_id) ? 'Cancel' : 'Assign 📍' }}
          </button>
          <button class="view-btn del-btn" @click="deleteJob(job)">Delete 🗑</button>
          <span class="crop-inline">
            <button
              class="view-btn crop-btn"
              :disabled="cropState[job.job_id]?.status === 'running'"
              @click="cropAndView(job.job_id)"
            >{{ cropState[job.job_id]?.status === 'running' ? 'Cropping…' : 'Crop ✂' }}</button>
            <input
              class="crop-dist-input"
              type="number" min="1" max="50" step="0.5"
              :value="cropDist[job.job_id] ?? 7"
              @change="cropDist[job.job_id] = +$event.target.value"
            />m
            <RouterLink
              v-if="cropState[job.job_id]?.variant"
              class="view-btn crop-view-btn"
              :to="{ name: 'splat-viewer', params: { splatId: job.job_id }, query: { variant: cropState[job.job_id].variant } }"
              target="_blank"
            >View Cropped →</RouterLink>
            <span v-if="cropState[job.job_id]?.error" class="crop-error">{{ cropState[job.job_id].error }}</span>
          </span>
        </div>

        <!-- Fork training panel -->
        <div v-if="expandedFork.has(job.job_id) && forkParams[job.job_id]" class="fork-panel">
          <div class="fork-hint">SfM poses from job {{ job.job_id }} are reused — only training runs.</div>
          <TrainingParams :model-value="forkParams[job.job_id]" mode="fork" />
          <div v-if="forkParams[job.job_id].error" class="fork-error">{{ forkParams[job.job_id].error }}</div>
          <button class="fork-submit-btn" :disabled="forkParams[job.job_id].submitting" @click="submitFork(job.job_id)">
            {{ forkParams[job.job_id].submitting ? 'Starting…' : 'Start Fork' }}
          </button>
        </div>

        <!-- Splat assignment panel -->
        <div v-if="expandedAssign.has(job.job_id)" class="assign-panel">
          <div v-if="locationsLoading" class="assign-msg">Loading locations…</div>
          <div v-else-if="locationsError" class="assign-msg assign-error">{{ locationsError }}</div>
          <template v-else>
            <div class="assign-row">
              <label class="assign-label">Location</label>
              <select
                :value="assignSelections[job.job_id]?.locationId ?? ''"
                @change="e => onLocationSelect(job.job_id, e.target.value)"
                class="assign-select"
              >
                <option value="">Choose location…</option>
                <option v-for="loc in locationsList" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>

            <template v-if="assignSelections[job.job_id]?.locationId">
              <div class="assign-row">
                <label class="assign-label">Routesetting</label>
                <select
                  :value="assignSelections[job.job_id]?.routesetting ?? ''"
                  @change="e => onRoutesettingSelect(job.job_id, e.target.value)"
                  class="assign-select"
                >
                  <option value="">Choose routesetting…</option>
                  <option
                    v-for="rs in getLocationRoutesettings(assignSelections[job.job_id].locationId)"
                    :key="rs"
                    :value="rs"
                  >{{ formatDate(rs) }}</option>
                </select>
              </div>

              <button
                v-if="assignSelections[job.job_id]?.routesetting && !assignSelections[job.job_id]?.done"
                :disabled="assignSelections[job.job_id]?.saving"
                @click="saveAssignment(job.job_id)"
                class="view-btn assign-confirm-btn"
              >
                {{ assignSelections[job.job_id]?.saving ? 'Saving…' : 'Confirm assignment ✓' }}
              </button>

              <div v-if="assignSelections[job.job_id]?.done" class="assign-success">
                ✓ Assigned! Users will now see "View in 3D" on that routesetting.
              </div>
            </template>
          </template>
        </div>

        <!-- Logs for non-done jobs too -->
        <div v-if="job.status !== 'done'" class="action-row">
          <button v-if="job.status === 'error' || job.status === 'cancelled'" class="view-btn rerun-btn" @click="rerunJob(job)">Run Again ↩</button>
          <button
            v-if="job.status === 'queued' || job.status === 'running'"
            class="view-btn cancel-btn"
            :disabled="cancellingJobs.has(job.job_id)"
            @click="cancelJob(job)"
          >
            {{ cancellingJobs.has(job.job_id) ? 'Cancelling…' : 'Cancel ✕' }}
          </button>
          <button v-if="job.has_pointcloud" class="view-btn pc-btn" @click="togglePointCloud(job.job_id)">
            {{ expandedPointCloud.has(job.job_id) ? 'Hide Cloud ✕' : 'Point Cloud ✦' }}
          </button>
          <template v-if="job.status === 'queued'">
            <span class="queue-pos">Queue position: #{{ job.queue_position }}</span>
          </template>
          <button class="view-btn log-btn" @click="toggleLogs(job.job_id)">
            {{ expandedLogs.has(job.job_id) ? 'Hide Logs ✕' : 'Logs 📄' }}
          </button>
          <button v-if="job.image_count > 0" class="view-btn img-btn" @click="toggleImages(job.job_id)">
            {{ expandedImages.has(job.job_id) ? 'Hide Images ✕' : `Images 🗂 (${job.image_count})` }}
          </button>
          <button class="view-btn del-btn" @click="deleteJob(job)">Delete 🗑</button>
        </div>

        <!-- Point cloud viewer -->
        <div v-if="expandedPointCloud.has(job.job_id)" class="pc-expand">
          <PointCloudViewer :url="pointcloudUrl(job.job_id)" />
        </div>

        <div v-if="expandedLogs.has(job.job_id)" class="log-expand">
          <pre v-if="jobLogs.get(job.job_id)?.length" class="log-pre-history" :data-job-id="job.job_id">{{ jobLogs.get(job.job_id).join('\n') }}</pre>
          <p v-else class="log-empty-history">No log output available.</p>
        </div>

        <!-- Images grid -->
        <div v-if="expandedImages.has(job.job_id)" class="images-expand">
          <div v-if="job.has_masks" class="mask-toggle-row">
            <label class="mask-toggle-label">
              <input type="checkbox" :checked="maskEnabled.has(job.job_id)" @change="toggleMask(job.job_id)" />
              Apply mask
            </label>
          </div>
          <div v-if="jobImages.get(job.job_id)?.length" class="images-grid">
            <div
              v-for="fn in jobImages.get(job.job_id)"
              :key="fn"
              class="thumb-cell"
              @click="openFrameLightbox(job.job_id, fn)"
            >
              <img
                :src="imageUrl(job.job_id, fn)"
                class="frame-thumb"
                :alt="fn"
                loading="lazy"
              />
              <img
                v-if="maskEnabled.has(job.job_id)"
                :src="maskUrl(job.job_id, fn)"
                class="mask-overlay"
                :alt="'mask-' + fn"
                loading="lazy"
              />
            </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getDocs, collection, orderBy, query as fsQuery, doc, updateDoc, FieldPath } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { getGateway } from '../config/gateway.js';
import { thumbGet, thumbDelete } from '../utils/thumbDb.js';
import PointCloudViewer from '../components/PointCloudViewer.vue';
import HistoryFilters from '../components/HistoryFilters.vue';
import TrainingParams from '../components/TrainingParams.vue';

const router = useRouter();
const route = useRoute();
const jobs = ref([]);

const filters = ref({ statuses: null, minPsnr: null });

const filteredJobs = computed(() => {
  const { statuses, trainers, sources, minPsnr, maxIters, query } = filters.value;
  const needle = query?.trim().toLowerCase();
  return jobs.value.filter(job => {
    if (statuses  && !statuses.has(job.status))          return false;
    if (trainers  && !trainers.has(job.params?.trainer)) return false;
    if (sources   && !sources.has(job.params?.source))   return false;
    if (maxIters != null && (job.params?.iters ?? Infinity) > maxIters) return false;
    if (minPsnr != null) {
      const psnr = job.metrics?.psnr;
      if (psnr == null || psnr < minPsnr) return false;
    }
    if (needle) {
      const haystack = (job.scene ?? '').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
});
const loading = ref(true);
const error = ref('');
const expandedCapture = ref(new Set());
const expandedLogs = ref(new Set());
const expandedFork = ref(new Set());
const forkParams = ref({});  // job_id → training params object + submitting/error state
const expandedImages = ref(new Set());
const expandedPointCloud = ref(new Set());
const cropDist = ref({});    // job_id → distance in metres (default 7)
const cropState = ref({});   // job_id → { status, variant, error }
const maskEnabled = ref(new Set());
const jobLogs = ref(new Map());
const jobImages = ref(new Map());
const cancellingJobs = ref(new Set());
const editingNotes = ref(new Set());
const pendingNotes = ref({});
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

function maskUrl(jobId, filename) {
  const stem = filename.replace(/\.[^.]+$/, '');
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/masks/${stem}.png`;
}

function toggleMask(jobId) {
  const s = new Set(maskEnabled.value);
  s.has(jobId) ? s.delete(jobId) : s.add(jobId);
  maskEnabled.value = s;
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

function pointcloudUrl(jobId) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/pointcloud`;
}

function colmapDatasetUrl(jobId) {
  return `${gatewayCache}/topowall/api/v1/video-to-splat/${jobId}/colmap-dataset`;
}

function togglePointCloud(jobId) {
  const s = new Set(expandedPointCloud.value);
  s.has(jobId) ? s.delete(jobId) : s.add(jobId);
  expandedPointCloud.value = s;
}

async function cancelJob(job) {
  if (!confirm('Cancel this job? The pipeline will be stopped and cannot be resumed.')) return;
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
  thumbDelete(`splat-thumb-${job.job_id}`);
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
        nextTick(() => {
          const el = document.querySelector(`.log-pre-history[data-job-id="${jobId}"]`);
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    } catch { /* silent */ }
  }
}

function startNoteEdit(jobId, currentNote) {
  const s = new Set(editingNotes.value);
  s.add(jobId);
  editingNotes.value = s;
  pendingNotes.value[jobId] = currentNote ?? '';
}

async function saveNote(jobId) {
  const s = new Set(editingNotes.value);
  if (!s.has(jobId)) return;
  s.delete(jobId);
  editingNotes.value = s;
  const text = pendingNotes.value[jobId] ?? '';
  const job = jobs.value.find(j => j.job_id === jobId);
  if (job) job.note = text.trim();
  try {
    const gateway = await resolvedGateway();
    await fetch(`${gateway}/topowall/api/v1/video-to-splat/${jobId}/note`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: text }),
    });
  } catch { /* best-effort */ }
}

function cancelNoteEdit(jobId) {
  const s = new Set(editingNotes.value);
  s.delete(jobId);
  editingNotes.value = s;
}

async function cropAndView(jobId) {
  const dist = cropDist.value[jobId] ?? 7;
  cropState.value[jobId] = { status: 'running', variant: null, error: null };
  try {
    const gateway = await resolvedGateway();
    const res = await fetch(
      `${gateway}/topowall/api/v1/video-to-splat/${jobId}/crop?max_dist_m=${dist}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || res.statusText);
    }
    const data = await res.json();
    cropState.value[jobId] = { status: 'done', variant: data.variant, error: null };
  } catch (e) {
    cropState.value[jobId] = { status: 'error', variant: null, error: e.message };
  }
}

function rerunJob(job) {
  sessionStorage.setItem('splat-rerun', JSON.stringify({
    jobId: job.job_id,
    scene: job.scene,
    params: job.params,
    storedVideos: job.stored_videos,
    inputSource: job.params?.source ?? 'video',
  }));
  router.push({ name: 'splat-upload' });
}

function toggleFork(jobId) {
  const s = new Set(expandedFork.value);
  if (s.has(jobId)) {
    s.delete(jobId);
  } else {
    s.add(jobId);
    if (!forkParams.value[jobId]) {
      forkParams.value[jobId] = {
        trainer: 'brush', iters: 5000, brushExtraArgs: '',
        mcmc: false, viewer: false,
        postProcessing: 'none', bilateralGridFused: false, randomBkgd: false, ssimLambda: 0.2,
        sceneName: '',
        submitting: false, error: '',
      };
    }
  }
  expandedFork.value = s;
}

async function submitFork(jobId) {
  const p = forkParams.value[jobId];
  if (!p || p.submitting) return;
  p.submitting = true;
  p.error = '';
  try {
    const gateway = await resolvedGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${jobId}/fork-training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainer:              p.trainer,
        iters:                p.iters,
        mcmc:                 p.mcmc,
        post_processing:      p.postProcessing,
        bilateral_grid_fused: p.bilateralGridFused,
        random_bkgd:          p.randomBkgd,
        ssim_lambda:          p.ssimLambda,
        brush_extra_args:     p.brushExtraArgs || undefined,
        scene:                p.sceneName || undefined,
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`${res.status}: ${msg.slice(0, 200)}`);
    }
    const { job_id } = await res.json();
    router.push({ name: 'splat-viewer', params: { splatId: job_id } });
  } catch (err) {
    p.error = err.message;
    p.submitting = false;
  }
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
        thumbnail: null, // loaded async below
      };
    });
    // Load thumbnails from IndexedDB without blocking the list render
    jobs.value.forEach(async (job) => {
      const thumb = await thumbGet(`splat-thumb-${job.job_id}`);
      if (thumb) job.thumbnail = thumb;
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

function psnrClass(psnr) {
  if (psnr >= 24) return 'metric-good';
  if (psnr >= 21) return 'metric-ok';
  return 'metric-poor';
}

function formatElapsed(seconds) {
  if (seconds == null) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function displayParams(params) {
  const skip = ['filenames', 'filename', 'scene', 'video_count', 'capture_info'];
  return Object.fromEntries(
    Object.entries(params)
      .filter(([k, v]) => !skip.includes(k) && v != null)
      .map(([k, v]) => {
        if (k === 'early_stop') return ['early stop', v ? 'on' : 'off'];
        if (k === 'forked_from') return ['forked from', v];
        if (k === 'image_resolution') return ['resolution', v];
        if (k === 'brush_extra_args') return ['brush args', v];
        return [k, v];
      })
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
  return (s.sfm_s || 0) + (s.train_s || 0) + (s.ply2splat_s || 0) || null;
}

function stepWidth(stepS, totalS) {
  if (!stepS || !totalS || totalS === 0) return { width: '0%' };
  return { width: `${Math.min(100, Math.round((stepS / totalS) * 100))}%` };
}

// ── Splat assignment ─────────────────────────────────────────────────────────
const expandedAssign = ref(new Set());
const locationsList = ref([]);
const locationsLoading = ref(false);
const locationsError = ref('');
// Per-job selection state: { locationId, routesetting, saving, done }
const assignSelections = ref({});

function toggleAssign(jobId) {
  const s = new Set(expandedAssign.value);
  if (s.has(jobId)) {
    s.delete(jobId);
  } else {
    s.add(jobId);
    if (!assignSelections.value[jobId]) {
      assignSelections.value[jobId] = { locationId: '', routesetting: '', saving: false, done: false };
    }
    if (locationsList.value.length === 0 && !locationsLoading.value) {
      loadLocations();
    }
  }
  expandedAssign.value = s;
}

async function loadLocations() {
  locationsLoading.value = true;
  locationsError.value = '';
  try {
    const snap = await getDocs(fsQuery(collection(db, 'locations'), orderBy('name')));
    locationsList.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    locationsError.value = 'Failed to load locations: ' + err.message;
  } finally {
    locationsLoading.value = false;
  }
}

function onLocationSelect(jobId, locationId) {
  assignSelections.value[jobId] = { locationId, routesetting: '', saving: false, done: false };
}

function onRoutesettingSelect(jobId, routesetting) {
  assignSelections.value[jobId] = { ...assignSelections.value[jobId], routesetting, done: false };
}

function getLocationRoutesettings(locationId) {
  const loc = locationsList.value.find(l => l.id === locationId);
  if (!loc?.routesettings?.length) return [];
  return [...loc.routesettings].sort((a, b) => b.localeCompare(a));
}

async function saveAssignment(jobId) {
  const sel = assignSelections.value[jobId];
  if (!sel?.locationId || !sel?.routesetting) return;
  sel.saving = true;
  try {
    const gateway = gatewayCache ?? await resolvedGateway();
    const ref = doc(db, 'locations', sel.locationId);
    // FieldPath handles ISO timestamp keys that contain dots/colons
    await updateDoc(ref, new FieldPath('splatJobs', sel.routesetting), jobId, 'splatGatewayUrl', gateway);
    sel.done = true;
    // Auto-close panel after 3s
    setTimeout(() => {
      const s = new Set(expandedAssign.value);
      s.delete(jobId);
      expandedAssign.value = s;
      sel.done = false;
    }, 3000);
  } catch (err) {
    alert('Failed to save assignment: ' + err.message);
  } finally {
    sel.saving = false;
  }
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
.badge.vast { background: #312e81; color: #a5b4fc; }

.time { color: #6b7280; }
.elapsed {
  color: #9ca3af;
  background: #1f2937;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
}
.splat-size-inline {
  opacity: 0.55;
  font-size: 0.78em;
  margin-left: 2px;
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

.metrics-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.metric {
  font-size: 0.72rem;
  font-family: monospace;
  padding: 2px 7px;
  border-radius: 4px;
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
}
.metric.muted { opacity: 0.65; }
.metric.metric-good { color: #4ade80; border-color: #166534; background: #052e16; }
.metric.metric-ok   { color: #fbbf24; border-color: #78350f; background: #1c1000; }
.metric.metric-poor { color: #f87171; border-color: #7f1d1d; background: #1c0a0a; }

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
  padding: 6px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background 0.15s;
  white-space: nowrap;
}
.view-btn:hover { background: #1d4ed8; }

.action-row { display: flex; gap: 6px; flex-wrap: wrap; }

.capture-btn { background: #4f46e5; }
.capture-btn:hover { background: #4338ca; }

.pc-btn { background: #4c1d95; }
.pc-btn:hover { background: #6d28d9; }
.pc-expand { margin-top: 8px; }
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
.walk2-btn { background: #1f6f43; }
.walk2-btn:hover { background: #185835; }

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

.dl-colmap-btn {
  background: #1c2a3a;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.crop-inline { display: inline-flex; align-items: center; gap: 4px; }
.crop-btn { background: #3d2a00; }
.crop-btn:hover { background: #7c5500; }
.crop-btn:disabled { opacity: 0.5; cursor: default; }
.crop-dist-input {
  width: 48px; padding: 2px 4px; background: #1a1a2e; color: #eee;
  border: 1px solid #444; border-radius: 4px; font-size: 11px; text-align: center;
}
.crop-view-btn { background: #14532d; text-decoration: none; }
.crop-view-btn:hover { background: #166534; }
.crop-error { color: #f87171; font-size: 11px; }
.dl-colmap-btn:hover { background: #1e3a5f; }

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
.mask-toggle-row {
  margin-bottom: 6px;
}
.mask-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: pointer;
  user-select: none;
}
.mask-toggle-label input[type="checkbox"] { cursor: pointer; accent-color: #4b9eff; }
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 4px;
}
.thumb-cell {
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
  background: #0d0d0d;
  aspect-ratio: 4/3;
  transition: border-color 0.15s;
}
.thumb-cell:hover { border-color: #4b9eff; }
.thumb-cell:hover .frame-thumb { opacity: 0.85; }
.frame-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.15s;
}
.mask-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.capture-img { cursor: pointer; }

.note-section { margin-top: 2px; }

.note-display {
  font-size: 0.82rem;
  color: #9ca3af;
  background: #111827;
  border: 1px dashed #2d3748;
  border-radius: 6px;
  padding: 7px 10px;
  cursor: text;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  transition: border-color 0.15s, background 0.15s;
  min-height: 32px;
}
.note-display:hover { border-color: #4b5563; background: #1a2030; }
.note-display.note-empty { color: #3d4f66; font-style: italic; }

.note-textarea {
  width: 100%;
  box-sizing: border-box;
  background: #111827;
  border: 1px solid #4b6fa0;
  border-radius: 6px;
  padding: 7px 10px;
  color: #e5e7eb;
  font-size: 0.82rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}
.note-textarea:focus { border-color: #60a5fa; }

.note-edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 5px;
}
.note-save-btn {
  padding: 4px 12px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.78rem;
}
.note-save-btn:hover { background: #1d4ed8; }
.note-cancel-btn {
  padding: 4px 10px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #374151;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.78rem;
}
.note-cancel-btn:hover { color: #9ca3af; border-color: #4b5563; }

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

/* ── Splat assignment ── */
.assign-toggle-btn { background: #1d4e3c; color: #6ee7b7; }
.assign-toggle-btn:hover { background: #15573f; }

.fork-btn { background: #0e4166; }
.fork-btn:hover { background: #0d5a8a; }

.fork-panel {
  background: #0d1a26;
  border: 1px solid #1a3d5c;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fork-hint {
  font-size: 0.75rem;
  color: #6b7280;
}
.fork-error {
  font-size: 0.78rem;
  color: #f87171;
}
.fork-submit-btn {
  align-self: flex-start;
  background: #0e4166;
  color: #e5e7eb;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 0.82rem;
  cursor: pointer;
}
.fork-submit-btn:hover:not(:disabled) { background: #0d5a8a; }
.fork-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.assign-panel {
  background: #0f1a14;
  border: 1px solid #1a3d28;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.assign-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assign-label {
  font-size: 0.78rem;
  color: #6b7280;
  width: 88px;
  flex-shrink: 0;
}

.assign-select {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 0.82rem;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
}
.assign-select:focus { border-color: #6ee7b7; }

.assign-confirm-btn { background: #065f46; color: #6ee7b7; }
.assign-confirm-btn:hover:not(:disabled) { background: #047857; }
.assign-confirm-btn:disabled { opacity: 0.5; cursor: default; }

.assign-msg { font-size: 0.82rem; color: #6b7280; }
.assign-error { color: #f87171; }

.assign-success {
  font-size: 0.82rem;
  color: #6ee7b7;
  background: #052e16;
  border: 1px solid #14532d;
  border-radius: 6px;
  padding: 8px 12px;
}
</style>
