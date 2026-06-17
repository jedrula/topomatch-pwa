<template>
  <div class="splat-view">
    <div class="splat-header">
      <RouterLink :to="{ name: 'splat-upload' }" class="splat-tab">Upload</RouterLink>
      <RouterLink :to="{ name: 'splat-history' }" class="splat-tab">History</RouterLink>
      <button
        v-if="!loading && !processing"
        class="locate-btn"
        :disabled="localizing"
        @click="fileInput.click()"
      >{{ localizing ? 'Localizing…' : 'Locate' }}</button>
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="localize" />
      <button
        v-if="!loading && !processing"
        class="segment-btn"
        :disabled="segmenting"
        @click="segmentView"
      >{{ segmenting ? 'Segmenting…' : 'Segment' }}</button>
      <span class="splat-header-id">{{ route.params.splatId }}</span>
    </div>
    <div v-if="localizeError" class="locate-error">{{ localizeError }}</div>
    <!-- Splat loading spinner -->
    <div v-if="loading && !processing" class="overlay">
      <p>Loading splat… {{ loadProgress }}%<span v-if="splatSizeBytes"> ({{ (splatSizeBytes / 1024 / 1024).toFixed(1) }} MB)</span></p>
      <div class="load-progress-bar">
        <div class="load-progress-fill" :style="{ width: loadProgress + '%' }"></div>
      </div>
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
            v-if="jobStatus === 'running' && viewerPort"
            class="preview-btn"
            @click="openViewer"
          >
            Live preview ↗
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

    <div class="canvas-wrapper">
      <div ref="container" class="canvas-container" />
      <!-- Mask overlay: SVGs returned by SAM2 layered over the splat canvas -->
      <div v-if="segmentMasks.length" class="mask-overlay" @click="clearMasks">
        <svg class="mask-svg" :viewBox="`0 0 ${maskViewW} ${maskViewH}`" xmlns="http://www.w3.org/2000/svg">
          <g v-for="(mask, i) in segmentMasks" :key="i">
            <path :d="mask.path" :fill="mask.color" fill-opacity="0.45" stroke="white" stroke-width="1.5" />
          </g>
        </svg>
        <div class="mask-hint">{{ segmentMasks.length }} hold{{ segmentMasks.length !== 1 ? 's' : '' }} detected — click to clear</div>
      </div>
    </div>
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
const loadProgress = ref(0);
const splatSizeBytes = ref(0);
const error = ref('');
const processing = ref(false);
const refreshing = ref(false);
const cancelling = ref(false);
const jobStatus = ref('');
const queuePosition = ref(null);
const viewerPort = ref(null);
const logLines = ref([]);
const jobMeta = ref(null); // { scene, params, stored_videos }
const fileInput = ref(null);
const localizing = ref(false);
const localizeError = ref('');
const segmenting = ref(false);
const segmentMasks = ref([]);
const maskViewW = ref(1920);
const maskViewH = ref(1080);
let viewer = null;
let currentObjectUrl = null;
let THREE = null;

function openViewer() {
  window.open(`http://localhost:${viewerPort.value}`, '_blank');
}

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
    const { status, queue_position, scene, params, stored_videos, viewer_port } = await res.json();
    jobStatus.value = status;
    queuePosition.value = queue_position;
    viewerPort.value = viewer_port ?? null;
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

    const total = +res.headers.get('Content-Length');
    splatSizeBytes.value = total;
    loadProgress.value = 0;
    let received = 0;
    const reader = res.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      loadProgress.value = Math.round(received / total * 100);
    }
    currentObjectUrl = URL.createObjectURL(new Blob(chunks, { type: 'application/octet-stream' }));

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

async function fetchInitialCamera(splatId, gateway) {
  if (!gateway || !splatId) return null;
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/initial-camera`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function renderSplat(objectUrl, splatId) {
  try {
    const gateway = await getGateway();
    const [{ Viewer }, threeModule, initialCam] = await Promise.all([
      import('@mkkellogg/gaussian-splats-3d'),
      import('three'),
      fetchInitialCamera(splatId, gateway),
    ]);
    THREE = threeModule;

    const renderer = new threeModule.WebGLRenderer({
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
      cameraUp: initialCam?.up ?? [0, -1, 0],
      initialCameraPosition: initialCam?.position ?? [0, 0, -3],
      initialCameraLookAt: initialCam?.look_at ?? [0, 0, 0],
      sharedMemoryForWorkers: false,
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

async function localize(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || !viewer) return;

  localizing.value = true;
  localizeError.value = '';
  try {
    const gateway = await getGateway();
    const splatId = route.params.splatId;
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/localize`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`;
      throw new Error(detail);
    }
    const cam = await res.json();
    console.log('[localize] response:', cam);
    jumpToCamera(cam);
  } catch (err) {
    localizeError.value = 'Localization failed: ' + err.message;
    setTimeout(() => { localizeError.value = ''; }, 6000);
  } finally {
    localizing.value = false;
  }
}

function clearMasks() {
  segmentMasks.value = [];
}

// Hue-distributed colours for each detected hold
const HOLD_COLOURS = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6','#ec4899','#14b8a6'];

async function segmentView() {
  if (!viewer) return;
  const canvas = viewer.renderer?.domElement ?? container.value?.querySelector('canvas');
  if (!canvas) return;

  segmenting.value = true;
  segmentMasks.value = [];
  try {
    maskViewW.value = canvas.width;
    maskViewH.value = canvas.height;

    // Capture current WebGL frame as JPEG blob
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const blob = await (await fetch(dataUrl)).blob();

    const gateway = await getGateway();
    const splatId = route.params.splatId;
    const form = new FormData();
    form.append('image', blob, 'view.jpg');
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/segment-view`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`;
      throw new Error(detail);
    }
    const data = await res.json();
    console.log('[segment-view] response:', data);

    // data.holds: SAM2 HoldDetection[] — { polygon:[[x,y],...], bbox:{x,y,width,height}, ... }
    // data.image_info: { width, height } — coordinate space of the polygons
    const holds = data.holds ?? [];
    const imgW = data.image_info?.width ?? maskViewW.value;
    const imgH = data.image_info?.height ?? maskViewH.value;
    maskViewW.value = imgW;
    maskViewH.value = imgH;
    segmentMasks.value = holds.map((h, i) => {
      const colour = HOLD_COLOURS[i % HOLD_COLOURS.length];
      let path = '';
      if (h.polygon && h.polygon.length >= 3) {
        path = `M ${h.polygon[0][0]},${h.polygon[0][1]}` +
               h.polygon.slice(1).map(p => ` L ${p[0]},${p[1]}`).join('') + ' Z';
      } else if (h.bbox) {
        const { x, y, width, height } = h.bbox;
        path = `M ${x},${y} L ${x+width},${y} L ${x+width},${y+height} L ${x},${y+height} Z`;
      }
      return { path, color: colour, pts: h.polygon ?? null };
    });
  } catch (err) {
    console.error('[segment-view] error:', err);
    localizeError.value = 'Segmentation failed: ' + err.message;
    setTimeout(() => { localizeError.value = ''; }, 6000);
  } finally {
    segmenting.value = false;
  }
}

function jumpToCamera(cam) {
  if (!viewer || !THREE) return;
  const [px, py, pz] = cam.position;
  const [lx, ly, lz] = cam.look_at;
  const [ux, uy, uz] = cam.up;
  viewer.camera.position.set(px, py, pz);
  viewer.camera.up.set(ux, uy, uz);
  if (viewer.controls?.target) {
    viewer.controls.target.set(lx, ly, lz);
    viewer.controls.update();
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 1rem;
  z-index: 10;
  background: #111;
  gap: 12px;
}
.load-progress-bar {
  width: 200px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}
.load-progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 2px;
  transition: width 0.15s ease;
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

.preview-btn {
  padding: 8px 18px;
  background: #065f46;
  color: #6ee7b7;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.preview-btn:hover { background: #047857; }

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

.locate-btn {
  margin-left: 8px;
  padding: 4px 14px;
  background: #1e1b4b;
  color: #a5b4fc;
  border: 1px solid #3730a3;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
}
.locate-btn:hover:not(:disabled) { background: #312e81; }
.locate-btn:disabled { opacity: 0.5; cursor: default; }

.locate-error {
  position: absolute;
  top: 52px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 8px 18px;
  border-radius: 6px;
  z-index: 30;
  font-size: 0.82rem;
  max-width: 80%;
  text-align: center;
  pointer-events: none;
}

.segment-btn {
  margin-left: 8px;
  padding: 4px 14px;
  background: #14532d;
  color: #86efac;
  border: 1px solid #166534;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
}
.segment-btn:hover:not(:disabled) { background: #166534; }
.segment-btn:disabled { opacity: 0.5; cursor: default; }

.canvas-wrapper {
  position: relative;
  width: 100%;
}

.mask-overlay {
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 20;
}

.mask-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.mask-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.65);
  color: #d1fae5;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.78rem;
  pointer-events: none;
  white-space: nowrap;
}
</style>
