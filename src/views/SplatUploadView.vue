<template>
  <div class="picker">
    <!-- Load existing .splat file -->
    <section class="section narrow">
      <h3>Load .splat file</h3>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onSplatFile" hidden />
      </label>
    </section>

    <div class="divider">or</div>

    <!-- Create from video -->
    <section class="section wide">
      <h3>Create from video</h3>

      <label class="pick-btn secondary" :class="{ loading: videoLoading }">
        {{ videoLoading ? 'Downloading video…' : 'Choose video(s)' }}
        <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="videoLoading" hidden />
      </label>

      <template v-if="videoFiles.length">
        <!-- Mode selector above strips -->
        <div class="mode-row">
          <span class="mode-label">Mode</span>
          <div class="toggle-group">
            <button :class="{ active: paramMode === 'nframes' }" @click="paramMode = 'nframes'">n-frames + duration</button>
            <button :class="{ active: paramMode === 'fps' }" @click="paramMode = 'fps'">fps</button>
          </div>
        </div>

        <!-- Per-video strips -->
        <div class="video-strips">
          <div v-for="(strip, i) in videoStrips" :key="strip.name" class="strip">
            <div class="strip-label">{{ strip.name }}</div>

            <!-- Frame strip with trimmer overlay -->
            <div class="strip-frames">
              <img v-for="(src, fi) in strip.frames" :key="fi" :src="src" class="frame-thumb" />
              <div v-if="!strip.frames.length" v-for="j in 10" :key="'ph'+j" class="frame-placeholder" />

              <div class="trimmer-overlay">
                <!-- dark regions outside selection -->
                <div class="trim-dark" :style="{ left: 0, width: startPct(strip) + '%' }" />
                <div class="trim-dark" :style="{ right: 0, width: (100 - endPct(strip)) + '%' }" />
                <!-- selection bracket -->
                <div class="trim-bracket" :style="{ left: startPct(strip) + '%', width: (endPct(strip) - startPct(strip)) + '%' }" />
                <!-- handles -->
                <div class="trim-handle trim-handle-left"
                     :style="{ left: startPct(strip) + '%' }"
                     @mousedown.prevent="startTrimDrag($event, i, 'start')" />
                <div class="trim-handle trim-handle-right"
                     :style="{ left: endPct(strip) + '%' }"
                     @mousedown.prevent="startTrimDrag($event, i, 'end')" />
              </div>
            </div>

            <!-- Frames that will actually be extracted -->
            <template v-for="pf in [previewFrames(strip)]" :key="strip.name + '_pf'">
              <div v-if="pf.length" class="preview-strip">
                <div class="preview-label">{{ pf.length }} frame{{ pf.length !== 1 ? 's' : '' }} to extract</div>
                <div class="preview-frames">
                  <img v-for="(src, fi) in pf.slice(0, 60)" :key="fi" :src="src" class="preview-thumb" />
                  <div v-if="pf.length > 60" class="preview-more">+{{ pf.length - 60 }} more</div>
                </div>
              </div>
            </template>

            <!-- Per-video params + trim times -->
            <div class="strip-params">
              <template v-if="paramMode === 'nframes'">
                <label class="param-input">n-frames
                  <input type="number" v-model.number="strip.nFrames" min="2" max="20" />
                </label>
              </template>
              <template v-else>
                <label class="param-input">fps
                  <input type="number" v-model.number="strip.fps" min="0.1" max="5" step="0.1" />
                </label>
              </template>
              <div class="trim-times">
                <span class="time-field">start <span class="time-val">{{ formatTime(strip.startTime) }}</span></span>
                <span class="time-field">end <span class="time-val">{{ formatTime(strip.endTime ?? strip.videoDuration) }}</span></span>
                <span class="time-field total">duration <span class="time-val">{{ formatTime((strip.endTime ?? strip.videoDuration) - strip.startTime) }}</span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Shared params -->
        <div class="params">
          <div class="param-row">
            <label>iters</label>
            <input type="number" v-model.number="iters" min="100" max="5000" step="100" />
          </div>
          <div class="param-row">
            <label>image size</label>
            <div class="toggle-group">
              <button v-for="s in [256, 512]" :key="s" :class="{ active: imageSize === s }" @click="imageSize = s">
                {{ s }}px<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ s === 256 ? '40+ frames' : '≤14 frames' }}</span>
              </button>
            </div>
          </div>
          <div class="param-row">
            <label>scene name</label>
            <input type="text" v-model="sceneName" placeholder="auto from filename" />
          </div>
          <div class="param-row">
            <label>early stop</label>
            <label class="toggle">
              <input type="checkbox" v-model="earlyStop" />
              <span class="toggle-label">{{ earlyStop ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row">
            <label>sparse pairs</label>
            <label class="toggle">
              <input type="checkbox" v-model="sparsePairs" />
              <span class="toggle-label">{{ sparsePairs ? 'on' : 'off' }}</span>
            </label>
          </div>
          <button class="process-btn" :disabled="processing || videoLoading" @click="startJob">
            {{ processing ? 'Submitting…' : videoLoading ? 'Preparing…' : videoFiles.length > 1 ? `Process ${videoFiles.length} Videos` : 'Process Video' }}
          </button>
          <div class="process-hint">about {{ videoStrips.reduce((s, strip) => s + previewFrames(strip).length, 0) }} frames to extract</div>
        </div>
      </template>
    </section>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';
import { getGateway } from '../config/gateway.js';

const router = useRouter();
const splatStore = useSplatStore();

const error = ref('');

async function onSplatFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  error.value = '';
  const splatId = crypto.randomUUID();
  splatStore.storeBlob(splatId, URL.createObjectURL(file));
  router.push({ name: 'splat-viewer', params: { splatId } });
}

const videoFiles = ref([]);
const videoStrips = ref([]);
const paramMode = ref('fps');
const iters = ref(1000);
const imageSize = ref(256);
const sceneName = ref('');
const earlyStop = ref(false);
const sparsePairs = ref(false);
const processing = ref(false);
const videoLoading = ref(false);

function makeStrip(name) {
  return { name, frames: [], videoDuration: 0, startTime: 0, endTime: null, fps: 0.5, nFrames: 3 };
}

function startPct(strip) {
  return strip.videoDuration > 0 ? (strip.startTime / strip.videoDuration) * 100 : 0;
}
function endPct(strip) {
  const end = strip.endTime ?? strip.videoDuration;
  return strip.videoDuration > 0 ? (end / strip.videoDuration) * 100 : 100;
}
function formatTime(s) {
  if (s == null || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`;
}

function previewFrames(strip) {
  if (!strip.frames.length || strip.videoDuration === 0) return [];
  const start = strip.startTime;
  const end = strip.endTime ?? strip.videoDuration;
  const dur = end - start;
  if (dur <= 0) return [];

  const timestamps = [];
  if (paramMode.value === 'nframes') {
    const n = Math.max(1, strip.nFrames);
    for (let i = 0; i < n; i++) {
      timestamps.push(start + (n > 1 ? (dur * i) / (n - 1) : 0));
    }
  } else {
    const interval = 1 / Math.max(0.01, strip.fps);
    for (let t = start; t <= end + 0.001; t += interval) {
      timestamps.push(Math.min(t, end));
    }
  }

  const last = strip.frames.length - 1;
  return timestamps.map((t) => {
    const idx = Math.round((t / strip.videoDuration) * last);
    return strip.frames[Math.max(0, Math.min(last, idx))];
  });
}

// Trim drag
function startTrimDrag(e, stripIndex, handle) {
  const framesEl = e.currentTarget.closest('.strip-frames');
  const rect = framesEl.getBoundingClientRect();

  const onMove = (me) => {
    const fraction = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
    const strip = videoStrips.value[stripIndex];
    const time = fraction * strip.videoDuration;
    if (handle === 'start') {
      strip.startTime = Math.min(time, (strip.endTime ?? strip.videoDuration) - 0.1);
    } else {
      strip.endTime = Math.max(time, strip.startTime + 0.1);
      if (strip.endTime >= strip.videoDuration - 0.05) strip.endTime = null;
    }
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.userSelect = '';
  };

  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

async function extractFrames(file, count = 10) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.addEventListener('loadedmetadata', async () => {
      const THUMB_H = 120;
      const scale = THUMB_H / (video.videoHeight || THUMB_H);
      const canvas = document.createElement('canvas');
      canvas.height = THUMB_H;
      canvas.width = Math.round((video.videoWidth || 160) * scale);
      const ctx = canvas.getContext('2d');
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
  videoFiles.value = Array.from(e.target.files);
  videoStrips.value = videoFiles.value.map((f) => makeStrip(f.name));
  await Promise.all(
    videoFiles.value.map(async (f, i) => {
      const { frames, videoDuration } = await extractFrames(f);
      videoStrips.value[i] = { ...videoStrips.value[i], frames, videoDuration };
    })
  );
}

async function startJob() {
  if (!videoFiles.value.length) return;
  error.value = '';
  processing.value = true;

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    processing.value = false;
    return;
  }

  const form = new FormData();
  for (const f of videoFiles.value) form.append('video', f);
  form.append('iters', iters.value);
  form.append('image_size', imageSize.value);
  form.append('early_stop', earlyStop.value);
  form.append('sparse_pairs', sparsePairs.value);
  if (sceneName.value) form.append('scene', sceneName.value);

  for (const strip of videoStrips.value) {
    form.append('start_time', strip.startTime);
    form.append('end_time', strip.endTime ?? strip.videoDuration);
    if (paramMode.value === 'nframes') {
      form.append('n_frames', strip.nFrames);
    } else {
      form.append('fps', strip.fps);
    }
  }

  let jobId;
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Server error ${res.status}: ${detail}`);
    }
    ({ job_id: jobId } = await res.json());
  } catch (err) {
    error.value = 'Failed to start job: ' + err.message;
    processing.value = false;
    return;
  }

  processing.value = false;
  router.push({ name: 'splat-viewer', params: { splatId: jobId } });
}

onMounted(async () => {
  const rerunRaw = sessionStorage.getItem('splat-rerun');
  if (!rerunRaw) return;
  sessionStorage.removeItem('splat-rerun');
  const rerun = JSON.parse(rerunRaw);

  const p = rerun.params;
  if (p) {
    iters.value = p.iters ?? 1000;
    imageSize.value = p.image_size ?? 256;
    earlyStop.value = p.early_stop === true || p.early_stop === 'true';
    sparsePairs.value = p.sparse_pairs === true || p.sparse_pairs === 'true';
    paramMode.value = p.n_frames != null ? 'nframes' : 'fps';
  }
  if (rerun.scene) sceneName.value = rerun.scene;

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
      videoFiles.value = files;
      videoStrips.value = files.map((f, idx) => {
        const strip = makeStrip(f.name);
        if (p) {
          if (p.n_frames != null) strip.nFrames = (Array.isArray(p.n_frames) ? p.n_frames[idx] : p.n_frames) ?? 3;
          if (p.fps != null) strip.fps = (Array.isArray(p.fps) ? p.fps[idx] : p.fps) ?? 0.5;
        }
        return strip;
      });
      await Promise.all(
        files.map(async (f, i) => {
          const { frames, videoDuration } = await extractFrames(f);
          videoStrips.value[i] = { ...videoStrips.value[i], frames, videoDuration };
        })
      );
    } catch {
      // video fetch failed — user can pick manually
    } finally {
      videoLoading.value = false;
    }
  }
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
.section.wide { max-width: 1200px; }

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

/* Mode selector */
.mode-row { display: flex; align-items: center; gap: 12px; }
.mode-label { font-size: 0.85rem; color: #9ca3af; }

.toggle-group { display: flex; gap: 4px; }
.toggle-group button {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.8rem;
}
.toggle-group button.active { background: #2563eb; color: #fff; border-color: #2563eb; }

/* Video strips */
.video-strips { width: 100%; display: flex; flex-direction: column; gap: 20px; }

.strip { display: flex; flex-direction: column; gap: 6px; }

.strip-label { font-size: 0.8rem; color: #9ca3af; padding-left: 2px; }

/* Frame strip — fills full width, no scroll */
.strip-frames {
  display: flex;
  width: 100%;
  height: 120px;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}
.frame-thumb {
  flex: 1;
  min-width: 0;
  height: 100%;
  object-fit: cover;
  display: block;
}
.frame-placeholder {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: #1f2937;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

/* Trimmer overlay */
.trimmer-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.trim-dark {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
}
.trim-bracket {
  position: absolute;
  top: 0;
  bottom: 0;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
  pointer-events: none;
}
.trim-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 3px;
  cursor: ew-resize;
  pointer-events: all;
  opacity: 0.85;
  transition: opacity 0.1s;
}
.trim-handle:hover { opacity: 1; }

/* Preview strip */
.preview-strip { display: flex; flex-direction: column; gap: 4px; }
.preview-label { font-size: 0.72rem; color: #6b7280; padding-left: 2px; }
.preview-frames {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.preview-thumb {
  height: 72px;
  width: auto;
  border-radius: 4px;
  flex-shrink: 0;
  display: block;
  border: 1px solid #374151;
}
.preview-more {
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
}

/* Per-video params row */
.strip-params {
  display: flex;
  align-items: center;
  gap: 24px;
}
.param-input {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
}
.param-input input[type="number"] {
  width: 80px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  padding: 4px 8px;
  font-size: 0.85rem;
}
.trim-times {
  display: flex;
  gap: 16px;
  margin-left: auto;
}
.time-field {
  font-size: 0.75rem;
  color: #6b7280;
}
.time-val {
  color: #d1d5db;
  font-variant-numeric: tabular-nums;
  margin-left: 4px;
}
.time-field.total .time-val { color: #60a5fa; }

/* Shared params */
.params { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

.param-row { display: flex; align-items: center; gap: 12px; }
.param-row > label {
  width: 130px;
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: right;
  flex-shrink: 0;
}
.param-row input[type="number"],
.param-row input[type="text"] {
  flex: 1;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle input[type="checkbox"] { accent-color: #2563eb; width: 16px; height: 16px; cursor: pointer; }
.toggle-label { font-size: 0.85rem; color: #9ca3af; }

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
  transition: background 0.2s;
}
.process-btn:hover:not(:disabled) { background: #15803d; }
.process-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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
</style>
