<template>
  <div class="splat-view">
    <div class="splat-header">
      <RouterLink :to="{ name: 'splat-upload' }" class="splat-tab">Upload</RouterLink>
      <RouterLink :to="{ name: 'splat-history' }" class="splat-tab">History</RouterLink>
      <span class="splat-header-id">{{ route.params.splatId }}</span>
    </div>
    <!-- Splat loading spinner -->
    <div v-if="loading && !processing" class="overlay">
      <p>Loading splat…</p>
    </div>

    <!-- Processing / error state -->
    <div v-if="processing" class="processing-overlay">
      <div class="processing-card">
        <div class="processing-header">
          <span class="status-dot" :class="jobStatus"></span>
          <span class="status-label">
            <template v-if="jobStatus === 'error'">Pipeline error</template>
            <template v-else-if="jobStatus === 'cancelled'">Job cancelled</template>
            <template v-else-if="jobStatus === 'queued'">Queued — position #{{ queuePosition }}</template>
            <template v-else>Gaussian splatting in progress…</template>
          </span>
        </div>
        <pre v-if="logLines.length" class="log-pre">{{ logLines.join('\n') }}</pre>
        <p v-else class="log-empty">No log output yet.</p>
        <div class="processing-actions">
          <button class="refresh-btn" :disabled="refreshing" @click="checkStatus">
            {{ refreshing ? 'Checking…' : 'Refresh' }}
          </button>
          <button
            v-if="jobStatus === 'queued' || jobStatus === 'running'"
            class="cancel-btn"
            :disabled="cancelling"
            @click="cancelJob"
          >
            {{ cancelling ? 'Cancelling…' : 'Cancel' }}
          </button>
          <button
            v-if="jobStatus === 'cancelled' || jobStatus === 'error'"
            class="rerun-btn"
            @click="rerunJob"
          >
            Run Again ↩
          </button>
        </div>
      </div>
    </div>

    <div v-if="error && !processing" class="error">{{ error }}</div>

    <div ref="container" class="canvas-container" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';
import { getGateway } from '../config/gateway.js';
import { thumbGet, thumbSet } from '../utils/thumbDb.js';

const route = useRoute();
const router = useRouter();
const splatStore = useSplatStore();

const container = ref(null);
const loading = ref(true);
const error = ref('');
const processing = ref(false);
const refreshing = ref(false);
const cancelling = ref(false);
const jobStatus = ref('');
const queuePosition = ref(null);
const logLines = ref([]);
const jobMeta = ref(null); // { scene, params, stored_videos }
let viewer = null;
let currentObjectUrl = null;

async function cancelJob() {
  if (!confirm('Cancel this job? The pipeline will be stopped and cannot be resumed.')) return;
  const splatId = route.params.splatId;
  cancelling.value = true;
  try {
    const gateway = await getGateway();
    await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/cancel`, { method: 'POST' });
    jobStatus.value = 'cancelled';
    processing.value = true;
    loading.value = false;
  } catch (err) {
    error.value = 'Cancel failed: ' + err.message;
  } finally {
    cancelling.value = false;
  }
}

async function checkStatus() {
  const splatId = route.params.splatId;
  refreshing.value = true;
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/status`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const { status, queue_position, scene, params, stored_videos } = await res.json();
    jobStatus.value = status;
    queuePosition.value = queue_position;
    if (scene || params) {
      jobMeta.value = { scene, params, stored_videos: stored_videos ?? [] };
    }

    if (status === 'done') {
      processing.value = false;
      loading.value = true;
      await loadSplat(splatId, gateway);
    } else {
      // Fetch log lines for display
      const logsRes = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/logs`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        logLines.value = data.log_lines ?? [];
      }
      processing.value = true;
      loading.value = false;
    }
  } catch (err) {
    error.value = 'Could not reach server: ' + err.message;
    processing.value = false;
    loading.value = false;
  } finally {
    refreshing.value = false;
  }
}

async function loadSplat(splatId, gateway) {
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/splat`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    currentObjectUrl = URL.createObjectURL(blob);
    await renderSplat(currentObjectUrl, splatId);
  } catch (err) {
    error.value = 'Failed to load splat: ' + err.message;
    loading.value = false;
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }
}

onMounted(async () => {
  const splatId = route.params.splatId;

  // Local file pick (in-memory blob) — skip status check, render directly
  const objectUrl = splatStore.getBlob(splatId);
  if (objectUrl) {
    currentObjectUrl = objectUrl;
    await renderSplat(objectUrl, splatId);
    return;
  }

  // Server job: check status first
  await checkStatus();
});

async function renderSplat(objectUrl, splatId) {
  try {
    const [{ Viewer }, THREE] = await Promise.all([
      import('@mkkellogg/gaussian-splats-3d'),
      import('three'),
    ]);

    const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      container.value.clientWidth || window.innerWidth,
      container.value.clientHeight || window.innerHeight,
    );
    container.value.appendChild(renderer.domElement);

    viewer = new Viewer({
      renderer,
      rootElement: container.value,
      cameraUp: [0, -1, 0],
      initialCameraPosition: [0, 0, -3],
      initialCameraLookAt: [0, 0, 0],
    });
    await viewer.addSplatScene(objectUrl, {
      splatAlphaRemovalThreshold: 5,
      format: 0,
    });
    loading.value = false;
    viewer.start();
    captureThumbnail(splatId);
  } catch (err) {
    error.value = 'Failed to render splat: ' + err.message;
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  viewer?.stop?.();
  viewer?.dispose?.();
  viewer = null;
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
});

function rerunJob() {
  const splatId = route.params.splatId;
  const meta = jobMeta.value ?? {};
  sessionStorage.setItem('splat-rerun', JSON.stringify({
    jobId: splatId,
    scene: meta.scene,
    params: meta.params,
    storedVideos: meta.stored_videos ?? [],
  }));
  router.push({ name: 'splat-upload' });
}

function captureThumbnail(splatId) {
  const key = `splat-thumb-${splatId}`;
  setTimeout(async () => {
    try {
      if (await thumbGet(key)) {
        console.log(`[splat-capture] Already captured for ${splatId}, skipping.`);
        return;
      }
      const canvas = container.value?.querySelector('canvas');
      if (!canvas) {
        console.warn('[splat-capture] No canvas found in container.');
        return;
      }
      const cropped = cropToContent(canvas);
      if (!cropped) {
        console.warn('[splat-capture] cropToContent returned null — canvas may be empty or all-black.');
        return;
      }
      const dataUrl = cropped.toDataURL('image/jpeg', 0.85);
      if (dataUrl && dataUrl !== 'data:,') {
        await thumbSet(key, dataUrl);
        console.log(`[splat-capture] Capture saved for ${splatId} (${Math.round(dataUrl.length / 1024)} KB).`);
      } else {
        console.warn('[splat-capture] toDataURL returned empty data URL.');
      }
    } catch (err) {
      console.error('[splat-capture] Failed to capture thumbnail:', err);
    }
  }, 2500);
}

/**
 * Returns a new canvas containing only the non-black content region of src.
 * Scans pixel data for any pixel brighter than `threshold` (per-channel),
 * then crops a padded bounding box around it.
 */
function cropToContent(srcCanvas, threshold = 15, padding = 12) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;

  // Draw the WebGL canvas into a regular 2D canvas so we can read pixels.
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);

  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i] > threshold || data[i + 1] > threshold || data[i + 2] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Nothing found — return null so we skip saving.
  if (maxX <= minX || maxY <= minY) return null;

  // Add padding, clamped to canvas bounds.
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(w, maxX + padding);
  maxY = Math.min(h, maxY + padding);

  const cw = maxX - minX;
  const ch = maxY - minY;
  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(tmp, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}


</script>

<style scoped>
.splat-view {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #111;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: calc(100vh - 44px);
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 1rem;
  z-index: 10;
  background: #111;
}

.processing-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
  background: #111;
  z-index: 10;
  overflow-y: auto;
}

.processing-card {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.processing-header {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e5e7eb;
  font-size: 1rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.running { background: #facc15; animation: pulse 1.5s infinite; }
.status-dot.queued  { background: #f59e0b; }
.status-dot.error   { background: #f87171; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.log-pre {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 12px 14px;
  color: #9ca3af;
  font-size: 0.72rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 60vh;
  overflow-y: auto;
}

.log-empty {
  color: #6b7280;
  font-style: italic;
  font-size: 0.85rem;
}

.processing-actions {
  display: flex;
  gap: 10px;
}

.refresh-btn {
  padding: 8px 18px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.refresh-btn:disabled { opacity: 0.5; cursor: default; }
.refresh-btn:hover:not(:disabled) { background: #1d4ed8; }

.cancel-btn {
  padding: 8px 18px;
  background: #7f1d1d;
  color: #fca5a5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.cancel-btn:disabled { opacity: 0.5; cursor: default; }
.cancel-btn:hover:not(:disabled) { background: #991b1b; }

.rerun-btn {
  padding: 8px 18px;
  background: #166534;
  color: #bbf7d0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.rerun-btn:hover { background: #15803d; }

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

.splat-header {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #0d0d0d;
  border-bottom: 1px solid #1f1f1f;
  z-index: 20;
  position: relative;
}

.splat-tab {
  padding: 0 16px;
  height: 100%;
  display: flex;
  align-items: center;
  color: #9ca3af;
  font-size: 0.875rem;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s;
}
.splat-tab:hover { color: #fff; }

.splat-header-id {
  font-family: monospace;
  font-size: 0.85rem;
  color: #6b7280;
  letter-spacing: 0.03em;
  margin-left: auto;
}
</style>
