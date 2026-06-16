<template>
  <div class="picker">
    <!-- Load existing .splat file (hidden once any video is picked) -->
    <section v-if="!videoFiles.length" class="section narrow">
      <h3>Load .splat file</h3>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onSplatFile" hidden />
      </label>
    </section>

    <div v-if="!videoFiles.length" class="divider">or</div>

    <!-- ── Create from video ──────────────────────────────────────────────────── -->
    <section class="section wide">

      <!-- No videos yet: prominent pick button -->
      <template v-if="!videoFiles.length">
        <h3>Create from video</h3>
        <label class="pick-btn secondary" :class="{ loading: videoLoading }">
          {{ videoLoading ? 'Downloading video…' : 'Choose video(s)' }}
          <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="videoLoading" hidden />
        </label>
      </template>

      <!-- Videos added — Phase 1: frame picking -->
      <template v-else>
        <div class="phase-row">
          <span class="phase-label">1 — Pick frames</span>
          <label class="add-video-btn" :class="{ disabled: anyScoring || videoLoading }" :title="anyScoring ? 'Wait for current video to finish scoring' : ''">
            + Add video
            <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="anyScoring || videoLoading" hidden />
          </label>
        </div>

        <div class="video-strips">
          <VideoStrip
            v-for="(strip, si) in videoStrips"
            :key="si"
            :strip="strip"
            :batch-size="batchSize"
            :batch-buffer="batchBuffer"
            @trim="onTrim(si, $event)"
            @remove="removeVideo(si)"
          />
        </div>

        <!-- Batch controls (once any strip has frames) -->
        <div v-if="videoStrips.some(s => s.scoredFrames.length)" class="batch-controls">
          <label class="batch-ctrl">
            <span>Batch size</span>
            <input type="number" v-model.number="batchSize" min="1" max="50" />
            <span class="batch-hint">frames per group</span>
          </label>
          <label class="batch-ctrl">
            <span>Buffer</span>
            <input type="number" v-model.number="batchBuffer" min="0" max="20" />
            <span class="batch-hint">frames skipped between groups</span>
          </label>
          <span class="batch-total">{{ liveSelection.length }} frames from {{ videoFiles.length }} video(s)</span>
        </div>

        <!-- Phase 2: training settings (shown when frames are ready and nothing is scoring) -->
        <template v-if="liveSelection.length && !anyScoring">
          <div class="phase-divider">
            <span class="phase-label">2 — Training settings</span>
          </div>

          <TrainingParams :model-value="params" :vast-instances="vastInstances" />

          <!-- Upload progress -->
          <div v-if="uploading" class="extraction-progress">
            <div class="prog-row">
              <span class="prog-label">Uploading</span>
              <span class="prog-count">{{ uploadTotal > 0 ? Math.round(uploadLoaded / uploadTotal * 100) + '%' : 'Uploading…' }}</span>
            </div>
            <div v-if="uploadTotal > 0" class="prog-track">
              <div class="prog-fill-blue" :style="{ width: (uploadLoaded / uploadTotal * 100) + '%' }" />
            </div>
          </div>

          <button class="process-btn create-model-btn" @click="confirmUpload" :disabled="uploading">
            {{ uploading ? 'Uploading…' : `Create model from ${liveSelection.length} frames` }}
          </button>
        </template>
      </template>
    </section>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!videoFiles.length" class="divider">or</div>

    <!-- ── Create from photos ─────────────────────────────────────────────────── -->
    <section v-if="!videoFiles.length" class="section wide">
      <h3>Create from photos</h3>

      <label class="pick-btn secondary">
        Choose photos
        <input type="file" accept="image/*" multiple @change="onPhotoFile" hidden />
      </label>

      <template v-if="rerunJobId && rerunImageCount > 0">
        <div class="rerun-banner">
          ↩ Reusing {{ rerunImageCount }} image{{ rerunImageCount !== 1 ? 's' : '' }} from previous job
          <button class="rerun-clear" @click="rerunJobId = null">✕ Pick new images</button>
        </div>
      </template>

      <template v-if="photoFiles.length || rerunJobId">
        <div class="photo-grid">
          <div v-for="(p, i) in photoFiles" :key="i" class="photo-item">
            <img :src="p.url" class="photo-thumb" />
            <span class="photo-name">{{ p.name }}</span>
            <button class="photo-remove" @click="removePhoto(i)">✕</button>
          </div>
        </div>

        <TrainingParams :model-value="params" :vast-instances="vastInstances" />

        <button v-if="rerunJobId" class="process-btn" :disabled="processingPhotos" @click="startRerun">
          {{ processingPhotos ? 'Submitting…' : `Re-run with ${rerunImageCount} image${rerunImageCount !== 1 ? 's' : ''}` }}
        </button>
        <button v-else class="process-btn" :disabled="processingPhotos || !photoFiles.length" @click="startPhotoJob">
          {{ processingPhotos ? 'Submitting…' : `Process ${photoFiles.length} Photo${photoFiles.length !== 1 ? 's' : ''}` }}
        </button>
        <div class="process-hint">
          {{ rerunJobId ? rerunImageCount : photoFiles.length }} image{{ (rerunJobId ? rerunImageCount : photoFiles.length) !== 1 ? 's' : '' }} — no blur check, straight to pipeline
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';
import { getGateway } from '../config/gateway.js';
import VideoStrip from '../components/VideoStrip.vue';
import TrainingParams from '../components/TrainingParams.vue';
import { batchedSelectMain } from '../utils/frameScoringUtils.js';

const router    = useRouter();
const splatStore = useSplatStore();
const error     = ref('');

// ── Training params (shared by video + photo flows) ───────────────────────────
const params = reactive({
  iters: 5000,
  imageSize: 256,
  sceneName: '',
  earlyStop: false,
  sparsePairs: false,
  sparseGa: false,
  colmapBa: false,
  colmapMatcher: 'exhaustive',
  viewGraphCalibrator: false,
  sfm: 'glomap_sift',
  trainer: 'brush',
  mcmc: true,
  viewer: false,
  postProcessing: 'none',
  bilateralGridFused: false,
  randomBkgd: false,
  ssimLambda: 0.2,
  selectedVastInstance: '',
});

const vastInstances = ref([]);

const sharedParams = computed(() => ({
  iters:                params.iters,
  image_size:           params.imageSize,
  early_stop:           params.earlyStop,
  sparse_pairs:         params.sparsePairs,
  sparse_ga:            params.sparseGa,
  sfm:                  params.selectedVastInstance ? 'megasam'  : params.sfm,
  trainer:              params.selectedVastInstance ? 'pgsr'     : params.trainer,
  mcmc:                 params.mcmc,
  viewer:               params.viewer,
  post_processing:      params.postProcessing,
  bilateral_grid_fused: params.bilateralGridFused,
  random_bkgd:          params.randomBkgd,
  ssim_lambda:          params.ssimLambda,
  colmap_ba:              params.colmapBa,
  colmap_matcher:         params.colmapMatcher !== 'auto' ? params.colmapMatcher : '',
  view_graph_calibrator:  params.viewGraphCalibrator,
}));

function appendSharedParams(form) {
  const p = sharedParams.value;
  form.append('iters',                p.iters);
  form.append('image_size',           p.image_size);
  form.append('early_stop',           p.early_stop);
  form.append('sparse_pairs',         p.sparse_pairs);
  form.append('sparse_ga',            p.sparse_ga);
  form.append('sfm',                  p.sfm);
  form.append('trainer',              p.trainer);
  form.append('mcmc',                 p.trainer === 'gsplat' ? p.mcmc : false);
  form.append('viewer',               (p.trainer === 'gsplat' || p.trainer === '2dgs') ? p.viewer : false);
  if (p.trainer === 'gsplat') {
    form.append('post_processing',      p.post_processing);
    form.append('bilateral_grid_fused', p.bilateral_grid_fused);
    form.append('random_bkgd',          p.random_bkgd);
    form.append('ssim_lambda',          p.ssim_lambda);
  } else if (p.trainer === '2dgs') {
    form.append('ssim_lambda',          p.ssim_lambda);
  }
  form.append('colmap_ba', p.colmap_ba);
  if (p.colmap_matcher) form.append('colmap_matcher', p.colmap_matcher);
  if (p.view_graph_calibrator) form.append('view_graph_calibrator', true);
}

// ── Splat file ────────────────────────────────────────────────────────────────
async function onSplatFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  error.value = '';
  const splatId = crypto.randomUUID();
  splatStore.storeBlob(splatId, URL.createObjectURL(file));
  router.push({ name: 'splat-viewer', params: { splatId } });
}

// ── Video — state ─────────────────────────────────────────────────────────────
const EXTRACTION_FPS = 10;
const videoFiles  = ref([]);
const videoStrips = ref([]);
const videoLoading = ref(false);
const batchSize   = ref(5);
const batchBuffer = ref(2);
const uploading   = ref(false);
const uploadLoaded = ref(0);
const uploadTotal  = ref(0);

const activeWorkers = [];
const stripWorkers  = new Map();  // strip index → Worker

function makeStrip(name) {
  return { name, frames: [], videoDuration: 0, startTime: 0, endTime: null, scoredFrames: [], keyframeCount: 0, scoring: false };
}

const liveSelection = computed(() =>
  videoStrips.value.flatMap((strip, si) =>
    batchedSelectMain(strip.scoredFrames, batchSize.value, batchBuffer.value).map(f => ({ ...f, fileIdx: si }))
  )
);

const anyScoring = computed(() => videoStrips.value.some(s => s.scoring));

// ── Video — workers ───────────────────────────────────────────────────────────
function makeWorker() {
  return new Worker(new URL('../workers/frameExtractor.worker.js', import.meta.url), { type: 'module' });
}

function scoreWithWorker(file, fps, startTime, endTime, fileIdx, callbacks = {}) {
  return new Promise((resolve, reject) => {
    const worker = makeWorker();
    activeWorkers.push(worker);
    callbacks.workerRef?.(worker);
    const cleanup = () => {
      const i = activeWorkers.indexOf(worker);
      if (i !== -1) activeWorkers.splice(i, 1);
      worker.terminate();
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'total') {
        callbacks.onTotal?.(data.count);
      } else if (data.type === 'frame-scored') {
        const thumbUrl = URL.createObjectURL(data.thumbBlob);
        callbacks.onFrame?.({ index: data.index, timeS: data.timeS, score: data.score, thumbUrl });
      } else if (data.type === 'done') {
        cleanup(); resolve();
      } else if (data.type === 'error') {
        cleanup(); reject(new Error(data.message));
      }
    };
    worker.onerror = (e) => { cleanup(); reject(new Error(e.message)); };
    worker.postMessage({ file, extractionFps: fps, startTime: startTime || 0, endTime: endTime ?? Infinity });
  });
}

function decodeWithWorker(file, timestamps, scores = {}) {
  return new Promise((resolve, reject) => {
    const worker = makeWorker();
    activeWorkers.push(worker);
    const cleanup = () => {
      const i = activeWorkers.indexOf(worker);
      if (i !== -1) activeWorkers.splice(i, 1);
      worker.terminate();
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'done') { cleanup(); resolve(data.frames); }
      else if (data.type === 'error') { cleanup(); reject(new Error(data.message)); }
    };
    worker.onerror = (e) => { cleanup(); reject(new Error(e.message)); };
    worker.postMessage({ mode: 'decode', file, timestamps, scores });
  });
}

async function scoreStrip(idx) {
  const file  = videoFiles.value[idx];
  const strip = videoStrips.value[idx];
  strip.scoring      = true;
  strip.scoredFrames = [];
  strip.keyframeCount = 0;
  try {
    await scoreWithWorker(file, EXTRACTION_FPS, strip.startTime, strip.endTime, idx, {
      onTotal: (count) => { if (videoStrips.value[idx]) videoStrips.value[idx].keyframeCount = count; },
      onFrame: (frame) => { if (videoStrips.value[idx]) videoStrips.value[idx].scoredFrames.push(frame); },
      workerRef: (w)   => { stripWorkers.set(idx, w); },
    });
    stripWorkers.delete(idx);
  } catch (err) {
    error.value = `Frame extraction failed for "${strip.name}": ${err.message}`;
  } finally {
    if (videoStrips.value[idx]) videoStrips.value[idx].scoring = false;
  }
}

// ── Video — actions ───────────────────────────────────────────────────────────
async function extractFrames(file, count = 10) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.addEventListener('loadedmetadata', async () => {
      const THUMB_H = 120;
      const scale   = THUMB_H / (video.videoHeight || THUMB_H);
      const canvas  = document.createElement('canvas');
      canvas.height = THUMB_H;
      canvas.width  = Math.round((video.videoWidth || 160) * scale);
      const ctx   = canvas.getContext('2d');
      const frames = [];
      const videoDuration = isFinite(video.duration) ? video.duration : 0;
      for (let i = 0; i < count; i++) {
        const t = videoDuration > 0 ? (videoDuration * i) / (count - 1) : 0;
        await new Promise((res) => {
          video.currentTime = t;
          video.addEventListener('seeked', res, { once: true });
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
      }
      URL.revokeObjectURL(url);
      resolve({ frames, videoDuration });
    });
    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve({ frames: [], videoDuration: 0 }); });
  });
}

async function onVideoFile(e) {
  const newFiles = Array.from(e.target.files);
  e.target.value = '';
  for (const file of newFiles) {
    const idx = videoStrips.value.length;
    videoFiles.value.push(file);
    videoStrips.value.push(makeStrip(file.name));
    const { frames, videoDuration } = await extractFrames(file);
    if (videoStrips.value[idx]) {
      videoStrips.value[idx] = { ...videoStrips.value[idx], frames, videoDuration };
    }
    scoreStrip(idx);
  }
}

function removeVideo(idx) {
  for (const f of videoStrips.value[idx].scoredFrames) {
    if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
  }
  const w = stripWorkers.get(idx);
  if (w) { w.terminate(); stripWorkers.delete(idx); }
  videoFiles.value.splice(idx, 1);
  videoStrips.value.splice(idx, 1);
  // Re-key workers above the removed index
  const rekeyed = new Map();
  for (const [k, v] of stripWorkers) rekeyed.set(k > idx ? k - 1 : k, v);
  stripWorkers.clear();
  for (const [k, v] of rekeyed) stripWorkers.set(k, v);
}

function onTrim(si, { handle, time }) {
  const strip = videoStrips.value[si];
  if (handle === 'start') {
    strip.startTime = Math.min(time, (strip.endTime ?? strip.videoDuration) - 0.1);
  } else {
    strip.endTime = Math.max(time, strip.startTime + 0.1);
    if (strip.endTime >= strip.videoDuration - 0.05) strip.endTime = null;
  }
}

async function confirmUpload() {
  let gateway;
  try { gateway = await getGateway(); }
  catch (err) { error.value = 'Gateway not configured: ' + err.message; return; }

  const selected = liveSelection.value;
  uploading.value = true;
  uploadLoaded.value = 0;
  uploadTotal.value  = 0;

  let allFrameBlobs;
  try {
    const perFile = await Promise.all(
      videoFiles.value.map((file, si) => {
        const timestamps = selected.filter(f => f.fileIdx === si).map(f => f.timeS);
        const scores     = Object.fromEntries(selected.filter(f => f.fileIdx === si).map(f => [f.timeS, f.score]));
        return timestamps.length ? decodeWithWorker(file, timestamps, scores) : Promise.resolve([]);
      })
    );
    allFrameBlobs = perFile.flat();
  } catch (err) {
    error.value = 'Frame decode failed: ' + err.message;
    uploading.value = false;
    return;
  }

  const form = new FormData();
  allFrameBlobs.forEach((f, i) =>
    form.append('images', new File([f.fullBlob], `frame_${String(i).padStart(5, '0')}.jpg`, { type: 'image/jpeg' }))
  );
  appendSharedParams(form);
  if (params.sceneName) form.append('scene', params.sceneName);
  if (params.selectedVastInstance) form.append('vast_instance_id', params.selectedVastInstance);

  let jobId;
  try {
    jobId = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${gateway}/topowall/api/v1/images-to-splat`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) { uploadLoaded.value = e.loaded; uploadTotal.value = e.total; }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText).job_id); }
          catch { reject(new Error('Invalid server response')); }
        } else {
          reject(new Error(`Server error ${xhr.status}: ${xhr.responseText.slice(0, 200)}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  } catch (err) {
    error.value = 'Upload failed: ' + err.message;
    uploading.value = false;
    return;
  }

  router.push({ name: 'splat-viewer', params: { splatId: jobId } });
}

// ── Photos ────────────────────────────────────────────────────────────────────
const photoFiles       = ref([]);
const processingPhotos = ref(false);
const rerunJobId       = ref(null);
const rerunImageCount  = ref(0);

function onPhotoFile(e) {
  const incoming = Array.from(e.target.files).map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
  photoFiles.value = [...photoFiles.value, ...incoming];
  e.target.value = '';
}

function removePhoto(i) {
  URL.revokeObjectURL(photoFiles.value[i].url);
  photoFiles.value.splice(i, 1);
}

async function startPhotoJob() {
  if (!photoFiles.value.length) return;
  error.value = '';
  processingPhotos.value = true;
  let gateway;
  try { gateway = await getGateway(); }
  catch (err) { error.value = 'Gateway not configured: ' + err.message; processingPhotos.value = false; return; }

  const form = new FormData();
  for (const p of photoFiles.value) form.append('images', p.file);
  appendSharedParams(form);
  if (params.sceneName) form.append('scene', params.sceneName);
  if (params.selectedVastInstance) form.append('vast_instance_id', params.selectedVastInstance);

  let jobId;
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/images-to-splat`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text()}`);
    ({ job_id: jobId } = await res.json());
  } catch (err) {
    error.value = 'Failed to start job: ' + err.message;
    processingPhotos.value = false;
    return;
  }
  processingPhotos.value = false;
  router.push({ name: 'splat-viewer', params: { splatId: jobId } });
}

async function startRerun() {
  if (!rerunJobId.value) return;
  error.value = '';
  processingPhotos.value = true;
  let gateway;
  try { gateway = await getGateway(); }
  catch (err) { error.value = 'Gateway not configured: ' + err.message; processingPhotos.value = false; return; }

  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerunJobId.value}/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sharedParams.value, scene: params.sceneName || undefined }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text()}`);
    const { job_id: jobId } = await res.json();
    router.push({ name: 'splat-viewer', params: { splatId: jobId } });
  } catch (err) {
    error.value = 'Failed to start rerun: ' + err.message;
  } finally {
    processingPhotos.value = false;
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const gw = await getGateway();
    const r  = await fetch(`${gw}/topowall/api/v1/vast/instances`);
    if (r.ok) vastInstances.value = (await r.json()).instances || [];
  } catch { /* vast unavailable */ }

  const rerunRaw = sessionStorage.getItem('splat-rerun');
  if (!rerunRaw) return;
  sessionStorage.removeItem('splat-rerun');
  const rerun = JSON.parse(rerunRaw);

  const rp = rerun.params;
  if (rp) {
    params.iters               = rp.iters ?? 1000;
    params.imageSize           = rp.image_size ?? 256;
    params.earlyStop           = rp.early_stop   === true || rp.early_stop   === 'true';
    params.sparsePairs         = rp.sparse_pairs  === true || rp.sparse_pairs  === 'true';
    params.sparseGa            = rp.sparse_ga     === true || rp.sparse_ga     === 'true';
    params.colmapBa              = rp.colmap_ba            === true || rp.colmap_ba            === 'true';
    params.colmapMatcher         = rp.colmap_matcher || 'auto';
    params.viewGraphCalibrator   = rp.view_graph_calibrator === true || rp.view_graph_calibrator === 'true';
    params.sfm                 = rp.sfm ?? (rp.engine === 'pgsr' ? 'mast3r' : rp.engine) ?? 'mast3r';
    params.trainer             = rp.trainer ?? (rp.engine === 'pgsr' ? 'pgsr' : 'instantsplat') ?? 'instantsplat';
    params.mcmc                = rp.mcmc   === true || rp.mcmc   === 'true';
    params.viewer              = rp.viewer !== false && rp.viewer !== 'false';
    params.postProcessing      = rp.post_processing || 'none';
    params.bilateralGridFused  = !!rp.bilateral_grid_fused;
    params.randomBkgd          = !!rp.random_bkgd;
    params.ssimLambda          = rp.ssim_lambda != null ? parseFloat(rp.ssim_lambda) : 0.2;
  }
  if (rerun.scene) params.sceneName = rerun.scene;

  if (rerun.storedVideos?.length && rerun.jobId) {
    videoLoading.value = true;
    try {
      const gateway = await getGateway();
      const files = await Promise.all(
        rerun.storedVideos.map(async (v) => {
          const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerun.jobId}/video/${v.stored}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          return new File([blob], v.filename || v.stored, { type: blob.type || 'video/mp4' });
        })
      );
      for (const file of files) {
        const idx = videoStrips.value.length;
        videoFiles.value.push(file);
        videoStrips.value.push(makeStrip(file.name));
        const { frames, videoDuration } = await extractFrames(file);
        if (videoStrips.value[idx]) videoStrips.value[idx] = { ...videoStrips.value[idx], frames, videoDuration };
        scoreStrip(idx);
      }
    } catch { /* video fetch failed — user can pick manually */ }
    finally { videoLoading.value = false; }
  }

  if (rerun.inputSource === 'images' && rerun.jobId) {
    rerunJobId.value = rerun.jobId;
    rerunImageCount.value = rp?.filenames?.length || 0;
    if (!rerunImageCount.value) {
      try {
        const gateway = await getGateway();
        const listRes = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerun.jobId}/images`);
        if (listRes.ok) rerunImageCount.value = (await listRes.json()).images.length;
      } catch { /* silent */ }
    }
  }
});

onUnmounted(() => {
  for (const strip of videoStrips.value) {
    for (const f of strip.scoredFrames) {
      if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
    }
  }
  for (const w of activeWorkers) w.terminate();
});
</script>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px;
  gap: 12px;
  color: #ccc;
  overflow-y: auto;
  min-height: calc(100vh - 45px);
}

.section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.section.narrow { max-width: 480px; }
.section.wide   { max-width: 1200px; }
.section h3 { font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em; }

.divider { color: #444; font-size: 0.8rem; margin: 4px 0; }

.pick-btn {
  padding: 12px 28px;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.pick-btn:hover { background: #1d4ed8; }
.pick-btn.secondary { background: #374151; }
.pick-btn.secondary:hover { background: #4b5563; }
.pick-btn.loading { opacity: 0.65; cursor: wait; }

/* Phase headers */
.phase-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.phase-label {
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.phase-divider {
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid #1e293b;
  margin-top: 8px;
}

.add-video-btn {
  padding: 6px 14px;
  background: #1f2937;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background 0.15s, color 0.15s;
}
.add-video-btn:hover:not(.disabled) { background: #374151; color: #e5e7eb; }
.add-video-btn.disabled { opacity: 0.45; cursor: not-allowed; }

/* Video strips list */
.video-strips {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Batch controls */
.batch-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  padding-top: 4px;
}
.batch-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: default;
}
.batch-ctrl input[type="number"] {
  width: 56px;
  background: #1e293b;
  border: 1px solid #374151;
  border-radius: 5px;
  color: #e2e8f0;
  padding: 3px 6px;
  font-size: 0.85rem;
  text-align: center;
}
.batch-hint  { font-size: 0.7rem; color: #4b5563; }
.batch-total { font-size: 0.75rem; color: #60a5fa; margin-left: auto; font-variant-numeric: tabular-nums; }

/* Upload progress (Phase 2) */
.extraction-progress { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 5px; margin-top: 8px; }
.prog-row    { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.prog-label  { flex: 1; color: #d1d5db; }
.prog-count  { font-size: 0.75rem; color: #6b7280; font-variant-numeric: tabular-nums; }
.prog-track  { height: 5px; background: #1e293b; border-radius: 3px; overflow: hidden; }
.prog-fill-blue { height: 100%; background: #3b82f6; border-radius: 3px; transition: width 0.2s ease; }

/* Buttons */
.process-btn {
  margin-top: 8px;
  padding: 12px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  max-width: 480px;
  transition: background 0.2s;
}
.process-btn:hover:not(:disabled) { background: #15803d; }
.process-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.create-model-btn { background: #1d4ed8; }
.create-model-btn:hover:not(:disabled) { background: #1e40af; }

.process-hint { font-size: 0.75rem; color: #6b7280; text-align: center; margin-top: -4px; }

.error {
  background: #7f1d1d;
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  max-width: 80%;
  text-align: center;
}

/* Photos */
.rerun-banner {
  width: 100%;
  padding: 10px 14px;
  background: #1a2a1a;
  border: 1px solid #3a6a3a;
  border-radius: 8px;
  color: #7ec87e;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rerun-clear {
  background: none;
  border: 1px solid #3a6a3a;
  color: #7ec87e;
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}

.photo-grid  { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
.photo-item  { position: relative; width: 120px; flex-shrink: 0; }
.photo-thumb { width: 120px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #374151; display: block; }
.photo-name  { display: block; font-size: 0.65rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
.photo-remove {
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff; border: none;
  cursor: pointer; font-size: 0.7rem;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.photo-remove:hover { background: #dc2626; }
</style>
