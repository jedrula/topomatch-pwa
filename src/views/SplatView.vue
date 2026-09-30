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
      <button
        v-if="!loading && !processing"
        class="segment-training-btn"
        :disabled="segmenting"
        @click="segmentTraining"
      >{{ segmenting ? 'Segmenting…' : 'Segment Training' }}</button>
      <button
        v-if="!loading && !processing && segmentMasks.length"
        class="clear-holds-btn"
        :disabled="clearingHolds"
        @click="clearAllHolds"
      >{{ clearingHolds ? 'Clearing…' : 'Clear holds' }}</button>
      <button
        v-if="!loading && !processing"
        class="fix-btn"
        :disabled="fixing"
        @click="fixView"
      >{{ fixing ? '✨ Fixing…' : '✨ Fix view' }}</button>
      <RouterLink
        v-if="!loading && !processing"
        class="assign-btn"
        :to="{ name: 'splat-hold-assign', params: { splatId: route.params.splatId } }"
      >Assign Holds</RouterLink>
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
      <!-- 3D-locked mask overlay: redrawn every frame via RAF -->
      <canvas ref="overlayCanvas" class="mask-overlay-canvas" />
      <div v-if="segmentMasks.length" class="mask-hint" @click="clearMasks">
        {{ segmentMasks.length }} hold{{ segmentMasks.length !== 1 ? 's' : '' }} detected — click to clear
      </div>
    </div>

    <div v-if="fixError" class="fix-err">{{ fixError }}</div>
    <div v-if="fixedUrl" class="fix-overlay">
      <img :src="fixedUrl" alt="Fixer-cleaned view" />
      <div class="fix-overlay-bar">
        <span>NVIDIA Fixer — cleaned view</span>
        <a :href="fixedUrl" download="fixed_view.png">Download</a>
        <button @click="closeFixed">Back to live ✕</button>
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
const fixing = ref(false);
const fixedUrl = ref('');
const fixError = ref('');
const localizing = ref(false);
const localizeError = ref('');
const segmenting = ref(false);
const clearingHolds = ref(false);
const segmentMasks = ref([]);  // truthy when masks active — drives hint visibility
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
    const variant = route.query.variant ? `?variant=${route.query.variant}` : '';
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/splat${variant}`);
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
    // format must be explicit: blob URLs carry no extension for the library to
    // sniff. sphericalHarmonicsDegree 3 is what makes .ply/.spz look right —
    // .splat stores DC colour only, so SH there would be a no-op.
    const sceneFormat = splatStore.getFormat(splatId);
    await viewer.addSplatScene(objectUrl, {
      splatAlphaRemovalThreshold: 5,
      format: sceneFormat,
      sphericalHarmonicsDegree: sceneFormat === 0 ? 0 : 3,
    });
    loading.value = false;
    viewer.start();
    captureThumbnail(splatId);
    restoreSavedHolds(splatId, gateway);
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

// ── Segment-view: 3D-locked mask overlay ─────────────────────────────────────
// Hold colours are assigned by the backend (single source of truth) and arrive
// on each hold via /holds — the FE only renders them.

// masks3D: [{ color, center: THREE.Vector3 }]  — one world-space centroid per hold
let masks3D = [];
let maskRafId = null;
const overlayCanvas = ref(null);  // bound to the overlay <canvas> element

function clearMasks() {
  segmentMasks.value = [];
  masks3D = [];
  if (maskRafId !== null) { cancelAnimationFrame(maskRafId); maskRafId = null; }
  const c = overlayCanvas.value;
  if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

async function clearAllHolds() {
  const splatId = route.params.splatId;
  clearingHolds.value = true;
  try {
    const gateway = await getGateway();
    await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/holds`, { method: 'DELETE' });
    clearMasks();
  } finally {
    clearingHolds.value = false;
  }
}

// Point-in-polygon test (ray casting algorithm)
function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Lift 2D mask polygons → 3D centroids. For each mask, collects all Gaussian centers
// that project inside the polygon, depth-filters via IQR, then returns the mean
// world-space position as a single representative THREE.Vector3 (or null).
function liftMasksToGaussians(masks, imgW, imgH) {
  const splatMesh = viewer.splatMesh;
  if (!splatMesh) return masks.map(() => null);

  const count = splatMesh.getSplatCount();
  const cam = viewer.camera;
  const tmp = new THREE.Vector3();

  // Per-mask: accumulate { world, ndcZ } for depth filtering
  const raw = masks.map(() => []);

  for (let i = 0; i < count; i++) {
    splatMesh.getSplatCenter(i, tmp, true);

    const proj = tmp.clone().project(cam);
    if (proj.z < -1 || proj.z > 1) continue;

    const px = (proj.x + 1) / 2 * imgW;
    const py = (-proj.y + 1) / 2 * imgH;
    if (px < 0 || px > imgW || py < 0 || py > imgH) continue;

    for (let m = 0; m < masks.length; m++) {
      if (masks[m].pts && pointInPolygon(px, py, masks[m].pts)) {
        raw[m].push({ world: tmp.clone(), ndcZ: proj.z });
      }
    }
  }

  // Depth-filter via IQR then compute centroid of survivors.
  return raw.map(pts => {
    if (pts.length === 0) return null;

    // IQR Tukey fence — removes floaters and background depth layers
    let survivors = pts;
    if (pts.length >= 6) {
      const zs = pts.map(p => p.ndcZ).sort((a, b) => a - b);
      const n = zs.length;
      const q1 = zs[Math.floor(n * 0.25)];
      const q3 = zs[Math.floor(n * 0.75)];
      const iqr = Math.max(q3 - q1, 0.005);
      const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
      const filtered = pts.filter(p => p.ndcZ >= lo && p.ndcZ <= hi);
      if (filtered.length >= 3) survivors = filtered;
    }

    // Centroid of depth-filtered Gaussians → single representative 3D point
    const c = new THREE.Vector3();
    for (const p of survivors) c.add(p.world);
    c.divideScalar(survivors.length);
    return c;
  });
}

function drawMasks3D() {
  const c = overlayCanvas.value;
  if (!c || !masks3D.length || !viewer) return;

  const cam = viewer.camera;
  const W = c.width, H = c.height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const tmp = new THREE.Vector3();
  for (const { color, center } of masks3D) {
    tmp.copy(center).project(cam);
    if (tmp.z < -1 || tmp.z > 1) continue;

    const sx = (tmp.x + 1) / 2 * W;
    const sy = (-tmp.y + 1) / 2 * H;

    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fillStyle = color + 'cc';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  maskRafId = requestAnimationFrame(drawMasks3D);
}

function startMaskLoop() {
  if (maskRafId !== null) cancelAnimationFrame(maskRafId);
  maskRafId = requestAnimationFrame(drawMasks3D);
}

// Rebuild the 3D-locked overlay from a server holds list ([{ color, center:[x,y,z] }]).
function restoreHolds(holdsList) {
  masks3D = (holdsList ?? [])
    .filter(h => Array.isArray(h.center) && h.center.length === 3)
    .map(h => ({ color: h.color, center: new THREE.Vector3(h.center[0], h.center[1], h.center[2]) }));

  const glCanvas = viewer?.renderer?.domElement ?? container.value?.querySelector('canvas');
  const oc = overlayCanvas.value;
  if (oc && glCanvas) { oc.width = glCanvas.width; oc.height = glCanvas.height; }

  if (masks3D.length) {
    segmentMasks.value = masks3D;  // truthy — keeps hint visible
    startMaskLoop();
  }
}

// Fetch previously-saved holds for this splat and re-project them (no segmentation).
async function restoreSavedHolds(splatId, gateway) {
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/holds`);
    if (!res.ok) return;  // 404 for local/in-memory splats — non-fatal
    const { holds } = await res.json();
    if (holds?.length) restoreHolds(holds);
  } catch {
    /* non-fatal — overlay simply stays empty */
  }
}

async function segmentView() {
  if (!viewer || !THREE) return;
  const glCanvas = viewer.renderer?.domElement ?? container.value?.querySelector('canvas');
  if (!glCanvas) return;

  segmenting.value = true;
  clearMasks();
  try {
    const dataUrl = glCanvas.toDataURL('image/jpeg', 0.9);
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

    const holds = data.holds ?? [];
    const imgW = data.image_info?.width ?? glCanvas.width;
    const imgH = data.image_info?.height ?? glCanvas.height;

    // Size overlay canvas to match the WebGL canvas
    const oc = overlayCanvas.value;
    if (oc) { oc.width = glCanvas.width; oc.height = glCanvas.height; }

    // Build mask descriptors (polygon for the point-in-polygon test)
    const maskDescs = holds.map((h) => ({
      pts: h.polygon ?? (h.bbox
        ? [[h.bbox.x, h.bbox.y], [h.bbox.x+h.bbox.width, h.bbox.y],
           [h.bbox.x+h.bbox.width, h.bbox.y+h.bbox.height], [h.bbox.x, h.bbox.y+h.bbox.height]]
        : []),
    }));

    // Lift each mask to a single representative 3D centroid — one point per hold
    const centers = liftMasksToGaussians(maskDescs, imgW, imgH);
    const newCentres = centers
      .filter(c => c !== null)
      .map(c => ({ center: [c.x, c.y, c.z] }));

    // Persist server-side. The BE accumulates (idempotent + overlap-aware) and
    // owns colour assignment, so we render whatever authoritative set it returns.
    const saveRes = await fetch(
      `${gateway}/topowall/api/v1/video-to-splat/${splatId}/holds`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holds: newCentres }),
      },
    );
    if (!saveRes.ok) throw new Error(`Save failed: HTTP ${saveRes.status}`);
    const { holds: merged } = await saveRes.json();
    restoreHolds(merged);
  } catch (err) {
    console.error('[segment-view] error:', err);
    localizeError.value = 'Segmentation failed: ' + err.message;
    setTimeout(() => { localizeError.value = ''; }, 6000);
  } finally {
    segmenting.value = false;
  }
}

async function segmentTraining() {
  segmenting.value = true;
  clearMasks();
  const gateway = await getGateway();
  const splatId = route.params.splatId;
  try {
    const res = await fetch(
      `${gateway}/topowall/api/v1/video-to-splat/${splatId}/segment-training`,
      { method: 'POST' },
    );
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`;
      throw new Error(detail);
    }
    const data = await res.json();
    console.log('[segment-training]', data.processed_images, 'images,', data.raw_detections, 'raw detections,', data.holds.length, 'merged holds');
    restoreHolds(data.holds);
  } catch (err) {
    console.error('[segment-training] error:', err);
    localizeError.value = 'Segment training failed: ' + err.message;
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

// Send the current view to the Fixer service and overlay the cleaned result.
async function fixView() {
  if (!viewer || fixing.value) return;
  fixing.value = true;
  fixError.value = '';
  try {
    const canvas = viewer.renderer?.domElement || container.value?.querySelector('canvas');
    if (!canvas) throw new Error('no canvas');
    // Force a fresh frame, then read SYNCHRONOUSLY (mkkellogg renderer has no preserveDrawingBuffer).
    viewer.update();
    viewer.render();
    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const gateway = await getGateway();
    const fd = new FormData();
    fd.append('file', blob, 'view.png');
    const res = await fetch(`${gateway}/topowall/api/v1/fix?orient=auto`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`fix ${res.status} (is the Fixer service up?)`);
    if (fixedUrl.value) URL.revokeObjectURL(fixedUrl.value);
    fixedUrl.value = URL.createObjectURL(await res.blob());
  } catch (e) {
    fixError.value = e.message;
  } finally {
    fixing.value = false;
  }
}
function closeFixed() {
  if (fixedUrl.value) URL.revokeObjectURL(fixedUrl.value);
  fixedUrl.value = '';
}

onBeforeUnmount(() => {
  if (fixedUrl.value) URL.revokeObjectURL(fixedUrl.value);
  if (maskRafId !== null) { cancelAnimationFrame(maskRafId); maskRafId = null; }
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

.fix-btn {
  padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer;
  background: #7a3fd0; color: #fff; font: 600 0.85rem system-ui, sans-serif;
}
.fix-btn:hover:not(:disabled) { background: #8f57e0; }
.fix-btn:disabled { opacity: 0.5; cursor: default; }
.fix-err {
  position: fixed; top: 60px; right: 14px; z-index: 60; max-width: 300px;
  background: rgba(120,20,20,.9); color: #fdd; padding: 6px 10px; border-radius: 6px;
  font: 12px system-ui; }
.fix-overlay {
  position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,.92);
  display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fix-overlay img { max-width: 100%; max-height: calc(100% - 48px); object-fit: contain; }
.fix-overlay-bar { display: flex; align-items: center; gap: 16px; height: 48px; color: #ddd; font: 13px system-ui; }
.fix-overlay-bar a, .fix-overlay-bar button {
  color: #c78bff; background: none; border: 1px solid #c78bff; border-radius: 5px;
  padding: 5px 12px; cursor: pointer; text-decoration: none; font: 13px system-ui; }
.fix-overlay-bar a:hover, .fix-overlay-bar button:hover { background: rgba(199,139,255,.15); }

.segment-training-btn {
  margin-left: 4px;
  padding: 4px 14px;
  background: #0c4a1e;
  color: #6ee7b7;
  border: 1px solid #065f46;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
}
.segment-training-btn:hover:not(:disabled) { background: #065f46; }
.segment-training-btn:disabled { opacity: 0.5; cursor: default; }

.clear-holds-btn {
  padding: 6px 14px;
  background: #450a0a;
  color: #fca5a5;
  border: 1px solid #7f1d1d;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}
.clear-holds-btn:hover:not(:disabled) { background: #7f1d1d; }
.clear-holds-btn:disabled { opacity: 0.5; cursor: default; }

.assign-btn {
  margin-left: 8px;
  padding: 4px 14px;
  background: #292524;
  color: #d6d3d1;
  border: 1px solid #44403c;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.assign-btn:hover { background: #3c3836; color: #fff; }

.canvas-wrapper {
  position: relative;
  width: 100%;
}

.mask-overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 20;
  pointer-events: none;
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
  cursor: pointer;
  z-index: 21;
  white-space: nowrap;
}
</style>
