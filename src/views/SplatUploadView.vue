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
      <ul v-if="videoFiles.length" class="filenames">
        <li v-for="f in videoFiles" :key="f.name">{{ f.name }}</li>
      </ul>

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
const paramMode = ref('fps');
const nFrames = ref(3);
const duration = ref(6);
const fps = ref(0.5);
const fpsDuration = ref(null);
const iters = ref(1000);
const sceneName = ref('');
const earlyStop = ref(true);
const processing = ref(false);
const videoLoading = ref(false);

function onVideoFile(e) {
  videoFiles.value = Array.from(e.target.files);
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

.filenames { margin: 4px 0 0; padding: 0; list-style: none; font-size: 0.8rem; color: #9ca3af; }
.filenames li::before { content: '▸ '; }

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
