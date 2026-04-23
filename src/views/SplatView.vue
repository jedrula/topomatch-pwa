<template>
  <div class="splat-view">
    <div v-if="loading" class="overlay">
      <p>Loading splat…</p>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div ref="container" class="canvas-container" />

    <button class="back-btn" @click="goBack">← Back</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';

const GATEWAY = 'http://localhost:8000';

const route = useRoute();
const router = useRouter();
const splatStore = useSplatStore();

const container = ref(null);
const loading = ref(true);
const error = ref('');
let viewer = null;

onMounted(async () => {
  const splatId = route.params.splatId;

  // Try in-memory blob first (local file pick), then fall back to API fetch
  let objectUrl = splatStore.getBlob(splatId);

  if (!objectUrl) {
    try {
      const res = await fetch(`${GATEWAY}/topowall/api/v1/video-to-splat/${splatId}/splat`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
    } catch (err) {
      error.value = 'Failed to load splat: ' + err.message;
      loading.value = false;
      return;
    }
  }

  try {
    const [{ Viewer }, THREE] = await Promise.all([
      import('@mkkellogg/gaussian-splats-3d'),
      import('three'),
    ]);

    // preserveDrawingBuffer is required so toDataURL() reads a real frame
    // instead of a black cleared buffer (default WebGL behaviour).
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

    // Capture a thumbnail after the scene has had a moment to render.
    // Stored in localStorage so the history page can show it without re-rendering.
    captureThumbnail(splatId);
  } catch (err) {
    error.value = 'Failed to render splat: ' + err.message;
    loading.value = false;
  }
});

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
