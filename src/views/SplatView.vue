<template>
  <div class="splat-view">
    <!-- Splat loading spinner -->
    <div v-if="loading && !processing" class="overlay">
      <p>Loading splat…</p>
    </div>

    <!-- Processing / error state -->
    <div v-if="processing" class="processing-overlay">
      <div class="processing-card">
        <div class="processing-header">
          <span class="status-dot" :class="jobStatus"></span>
          <span class="status-label">{{ jobStatus === 'error' ? 'Pipeline error' : 'Gaussian splatting in progress…' }}</span>
        </div>
        <pre v-if="logLines.length" class="log-pre">{{ logLines.join('\n') }}</pre>
        <p v-else class="log-empty">No log output yet.</p>
        <div class="processing-actions">
          <button class="refresh-btn" :disabled="refreshing" @click="checkStatus">
            {{ refreshing ? 'Checking…' : 'Refresh' }}
          </button>
          <button class="back-btn-inline" @click="goBack">← Back</button>
        </div>
      </div>
    </div>

    <div v-if="error && !processing" class="error">{{ error }}</div>

    <div ref="container" class="canvas-container" />

    <button v-if="!processing" class="back-btn" @click="goBack">← Back</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const router = useRouter();
const splatStore = useSplatStore();

const container = ref(null);
const loading = ref(true);
const error = ref('');
const processing = ref(false);
const refreshing = ref(false);
const jobStatus = ref('');
const logLines = ref([]);
let viewer = null;

async function checkStatus() {
  const splatId = route.params.splatId;
  refreshing.value = true;
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/status`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const { status } = await res.json();
    jobStatus.value = status;

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
    await renderSplat(URL.createObjectURL(blob), splatId);
  } catch (err) {
    error.value = 'Failed to load splat: ' + err.message;
    loading.value = false;
  }
}

onMounted(async () => {
  const splatId = route.params.splatId;

  // Local file pick (in-memory blob) — skip status check, render directly
  const objectUrl = splatStore.getBlob(splatId);
  if (objectUrl) {
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
});

function captureThumbnail(splatId) {
  const key = `splat-thumb-${splatId}`;
  setTimeout(() => {
    try {
      const canvas = container.value?.querySelector('canvas');
      if (!canvas) return;
      const cropped = cropToContent(canvas);
      if (!cropped) return;
      const dataUrl = cropped.toDataURL('image/jpeg', 0.85);
      if (dataUrl && dataUrl !== 'data:,') {
        localStorage.setItem(key, dataUrl);
      }
    } catch {
      // Cross-origin or WebGL read-back not available — silently skip
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

function goBack() {
  router.push({ name: 'splat-playground' });
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
  height: 100vh;
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

.back-btn-inline {
  padding: 8px 14px;
  background: transparent;
  color: #9ca3af;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.back-btn-inline:hover { color: #e5e7eb; border-color: #666; }

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

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}
.back-btn:hover {
  background: rgba(0, 0, 0, 0.85);
}
</style>
