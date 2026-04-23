<template>
  <div class="splat-playground">

    <!-- ── Picker state ── -->
    <div v-if="!loaded" class="picker">
      <h2>Splat Viewer</h2>

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

        <label class="pick-btn secondary">
          Choose video
          <input type="file" accept=".mp4,.mov,.MOV,.MP4" @change="onVideoFile" hidden />
        </label>
        <p v-if="videoFile" class="filename">{{ videoFile.name }}</p>

        <div v-if="videoFile" class="params">
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

          <button class="process-btn" :disabled="processing" @click="startJob">
            {{ processing ? 'Processing…' : 'Process Video' }}
          </button>
        </div>

        <div v-if="logs.length > 0 || processing" class="log-box">
          <pre ref="logPre">{{ logs.join('\n') }}</pre>
        </div>
      </section>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div ref="container" class="canvas-container" />

    <button v-if="loaded" class="reset-btn" @click="reset">← pick another</button>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue';

const GATEWAY = 'http://localhost:8000';

const container = ref(null);
const loaded = ref(false);
const error = ref('');
let viewer = null;

// .splat file picker
async function onSplatFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  error.value = '';
  await loadSplatBlob(URL.createObjectURL(file));
}

// Video → splat
const videoFile = ref(null);
const paramMode = ref('nframes');
const nFrames = ref(3);
const duration = ref(6);
const fps = ref(0.5);
const fpsDuration = ref(null);
const iters = ref(1000);
const sceneName = ref('');
const processing = ref(false);
const logs = ref([]);
const logPre = ref(null);

function onVideoFile(e) {
  videoFile.value = e.target.files[0] || null;
  logs.value = [];
}

async function startJob() {
  if (!videoFile.value) return;
  error.value = '';
  logs.value = [];
  processing.value = true;

  const form = new FormData();
  form.append('video', videoFile.value);
  form.append('iters', iters.value);
  if (sceneName.value) form.append('scene', sceneName.value);

  if (paramMode.value === 'nframes') {
    form.append('n_frames', nFrames.value);
    form.append('duration', duration.value);
  } else {
    form.append('fps', fps.value);
    if (fpsDuration.value) form.append('duration', fpsDuration.value);
  }

  let jobId;
  try {
    const res = await fetch(`${GATEWAY}/topowall/api/v1/video-to-splat`, {
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

  // Stream logs via SSE
  const es = new EventSource(`${GATEWAY}/topowall/api/v1/video-to-splat/${jobId}/logs`);

  es.onmessage = async (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }

    if (msg.type === 'log') {
      logs.value.push(msg.data);
      await nextTick();
      if (logPre.value) logPre.value.scrollTop = logPre.value.scrollHeight;
    } else if (msg.type === 'done') {
      es.close();
      processing.value = false;
      logs.value.push('✓ Done — loading splat…');
      await loadSplatFromJob(jobId);
    } else if (msg.type === 'error') {
      es.close();
      processing.value = false;
      error.value = 'Pipeline error: ' + msg.data;
    }
  };

  es.onerror = () => {
    es.close();
    processing.value = false;
    if (!loaded.value) error.value = 'Lost connection to log stream.';
  };
}

async function loadSplatFromJob(jobId) {
  try {
    const res = await fetch(`${GATEWAY}/topowall/api/v1/video-to-splat/${jobId}/splat`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    await loadSplatBlob(URL.createObjectURL(blob));
  } catch (err) {
    error.value = 'Failed to load splat: ' + err.message;
  }
}

async function loadSplatBlob(objectUrl) {
  try {
    const { Viewer } = await import('@mkkellogg/gaussian-splats-3d');
    viewer = new Viewer({
      rootElement: container.value,
      cameraUp: [0, -1, 0],
      initialCameraPosition: [0, 0, -3],
      initialCameraLookAt: [0, 0, 0],
    });
    await viewer.addSplatScene(objectUrl, {
      splatAlphaRemovalThreshold: 5,
      format: 0,
    });
    loaded.value = true;
    viewer.start();
  } catch (err) {
    error.value = 'Failed to load splat: ' + err.message;
  }
}

function reset() {
  if (viewer) {
    viewer.stop?.();
    viewer.dispose?.();
    viewer = null;
  }
  loaded.value = false;
  error.value = '';
  videoFile.value = null;
  logs.value = [];
  processing.value = false;
}

onBeforeUnmount(reset);
</script>

<style scoped>
.splat-playground {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #111;
  overflow: hidden;
}

.picker {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 20px;
  gap: 12px;
  color: #ccc;
  z-index: 10;
  overflow-y: auto;
}

.picker h2 { font-size: 1.4rem; color: #fff; margin-bottom: 8px; }

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

.filename { font-size: 0.8rem; color: #9ca3af; }

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

.log-box {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}
.log-box pre {
  margin: 0;
  font-size: 0.72rem;
  color: #6ee7b7;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
}

.canvas-container { width: 100%; height: 100vh; }

.error {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 20;
  font-size: 0.85rem;
  max-width: 80%;
  text-align: center;
}

.reset-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  padding: 8px 14px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.reset-btn:hover { background: rgba(0,0,0,0.8); }
</style>
