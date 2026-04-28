<template>
  <div class="picker">
    <!-- Load existing .splat file -->
    <section class="section">
      <h3>Load .splat file</h3>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onSplatFile" hidden />
      </label>
    </section>

    <div class="divider">or</div>

    <!-- Create from video -->
    <section class="section">
      <h3>Create from video</h3>

      <label class="pick-btn secondary" :class="{ loading: videoLoading }">
        {{ videoLoading ? 'Downloading video…' : 'Choose video(s)' }}
        <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="videoLoading" hidden />
      </label>
      <div v-if="videoStrips.length" class="video-strips">
        <div v-for="strip in videoStrips" :key="strip.name" class="strip">
          <div class="strip-label">{{ strip.name }}</div>
          <div class="strip-frames">
            <img v-for="(src, i) in strip.frames" :key="i" :src="src" class="frame-thumb" />
            <div v-if="!strip.frames.length" v-for="i in 10" :key="'ph'+i" class="frame-placeholder" />
          </div>
        </div>
      </div>

      <div v-if="videoFiles.length" class="params">
        <div class="param-row">
          <label>Mode</label>
          <div class="toggle-group">
            <button :class="{ active: paramMode === 'nframes' }" @click="paramMode = 'nframes'">n-frames + duration</button>
            <button :class="{ active: paramMode === 'fps' }" @click="paramMode = 'fps'">fps</button>
          </div>
        </div>

        <template v-if="paramMode === 'nframes'">
          <div class="param-row">
            <label>n-frames</label>
            <input type="number" v-model.number="nFrames" min="2" max="20" />
          </div>
          <div class="param-row">
            <label>duration (s)</label>
            <input type="number" v-model.number="duration" min="1" max="120" />
          </div>
        </template>

        <template v-else>
          <div class="param-row">
            <label>fps</label>
            <input type="number" v-model.number="fps" min="0.1" max="5" step="0.1" />
          </div>
          <div class="param-row">
            <label>duration (s, optional)</label>
            <input type="number" v-model.number="fpsDuration" min="0" placeholder="full video" />
          </div>
        </template>

        <div class="param-row">
          <label>iters</label>
          <input type="number" v-model.number="iters" min="100" max="5000" step="100" />
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
      </div>
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
const videoStrips = ref([]); // [{ name, frames: [dataUrl, ...] }]
const paramMode = ref('fps');
const nFrames = ref(3);
const duration = ref(6);
const fps = ref(0.5);
const fpsDuration = ref(null);
const iters = ref(1000);
const sceneName = ref('');
const earlyStop = ref(false);
const sparsePairs = ref(false);
const processing = ref(false);
const videoLoading = ref(false);

async function extractFrames(file, count = 10) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.addEventListener('loadedmetadata', async () => {
      const THUMB_H = 90;
      const scale = THUMB_H / (video.videoHeight || THUMB_H);
      const canvas = document.createElement('canvas');
      canvas.height = THUMB_H;
      canvas.width = Math.round((video.videoWidth || 160) * scale);
      const ctx = canvas.getContext('2d');
      const frames = [];
      const dur = isFinite(video.duration) ? video.duration : 0;

      for (let i = 0; i < count; i++) {
        const t = dur > 0 ? (dur * i) / (count - 1) : 0;
        await new Promise((res) => {
          video.currentTime = t;
          video.addEventListener('seeked', res, { once: true });
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
      }

      URL.revokeObjectURL(url);
      resolve(frames);
    });

    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve([]); });
  });
}

async function onVideoFile(e) {
  videoFiles.value = Array.from(e.target.files);
  videoStrips.value = videoFiles.value.map((f) => ({ name: f.name, frames: [] }));
  await Promise.all(
    videoFiles.value.map(async (f, i) => {
      const frames = await extractFrames(f);
      videoStrips.value[i] = { name: f.name, frames };
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
  form.append('early_stop', earlyStop.value);
  form.append('sparse_pairs', sparsePairs.value);
  if (sceneName.value) form.append('scene', sceneName.value);

  if (paramMode.value === 'nframes') {
    form.append('n_frames', nFrames.value);
    form.append('duration', duration.value);
  } else {
    form.append('fps', fps.value);
    const dur = Number(fpsDuration.value);
    if (dur > 0) form.append('duration', dur);
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
    earlyStop.value = p.early_stop === true || p.early_stop === 'true';
    sparsePairs.value = p.sparse_pairs === true || p.sparse_pairs === 'true';
    if (p.n_frames != null) {
      paramMode.value = 'nframes';
      nFrames.value = p.n_frames;
      if (p.duration != null) duration.value = p.duration;
    } else if (p.fps != null) {
      paramMode.value = 'fps';
      fps.value = p.fps;
      if (p.duration != null) fpsDuration.value = p.duration;
    }
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
      videoStrips.value = files.map((f) => ({ name: f.name, frames: [] }));
      await Promise.all(
        files.map(async (f, i) => {
          const frames = await extractFrames(f);
          videoStrips.value[i] = { name: f.name, frames };
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
  justify-content: flex-start;
  padding: 40px 20px;
  gap: 12px;
  color: #ccc;
  overflow-y: auto;
  min-height: calc(100vh - 45px);
}

.section {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

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

.video-strips { width: min(100%, 900px); display: flex; flex-direction: column; gap: 12px; }
.strip { display: flex; flex-direction: column; gap: 4px; }
.strip-label { font-size: 0.75rem; color: #9ca3af; padding-left: 2px; }
.strip-frames { display: flex; gap: 2px; overflow-x: auto; border-radius: 4px; }
.frame-thumb { height: 90px; width: auto; border-radius: 3px; flex-shrink: 0; display: block; }
.frame-placeholder { height: 90px; width: 120px; background: #1f2937; border-radius: 3px; flex-shrink: 0; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

.params { width: 100%; display: flex; flex-direction: column; gap: 8px; }

.param-row { display: flex; align-items: center; gap: 12px; }

.param-row label {
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
