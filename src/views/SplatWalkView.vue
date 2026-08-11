<template>
  <div class="walk-view">
    <div ref="container" class="walk-canvas"></div>

    <div class="walk-hud">
      <div><b>Walk / Fly</b> — splat <code>{{ splatId }}</code></div>
      <div>Click to capture mouse · <b>WASD</b> move · mouse look · <b>Esc</b> release</div>
      <div>
        <label><input type="checkbox" v-model="walkMode" /> carpet-walk</label>
        (uncheck = free-fly / drone)
      </div>
      <div>
        radius <b>r</b> <input type="range" min="0.1" max="6" step="0.05" v-model.number="radius" />
        {{ radius.toFixed(2) }}
      </div>
      <div>
        speed <input type="range" min="0.2" max="5" step="0.1" v-model.number="speed" /> {{ speed.toFixed(1) }}
      </div>
      <div v-if="distInfo" class="walk-dist">{{ distInfo }}</div>
    </div>

    <div class="walk-status" :class="{ err: !!error }">
      {{ error || status }}<span v-if="!error && progressLabel"> — {{ progressLabel }}</span>
      <div v-if="!error && loading" class="walk-progress">
        <div class="walk-progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>
    <div v-if="showHint" class="walk-hint">click to start walking</div>
    <RouterLink :to="{ name: 'splat-viewer', params: { splatId } }" class="walk-back">← standard viewer</RouterLink>

    <button class="fix-btn" :disabled="fixing" @click="fixView" title="Esc to release the mouse first, then click">
      {{ fixing ? '✨ Fixing…' : '✨ Fix this view' }}
    </button>
    <div v-if="fixError" class="fix-err">{{ fixError }}</div>

    <div v-if="fixedUrl" class="fix-overlay">
      <img :src="fixedUrl" alt="Fixer-cleaned novel view" />
      <div class="fix-overlay-bar">
        <span>NVIDIA Fixer — cleaned novel view</span>
        <a :href="fixedUrl" download="fixed_view.png">Download</a>
        <button @click="closeFixed">Back to live ✕</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const splatId = route.params.splatId;
const container = ref(null);
const status = ref('loading…');
const error = ref('');
const loading = ref(true);
const progressPct = ref(0);
const progressLabel = ref('');
const walkMode = ref(true);
const radius = ref(0.6);
const speed = ref(1);
const distInfo = ref('');
const showHint = ref(false);
const fixing = ref(false);
const fixedUrl = ref('');
const fixError = ref('');

let viewer = null;
let rafId = null;
let objectUrl = null;
let cleanupFns = [];

onMounted(async () => {
  try {
    const gateway = await getGateway();
    const base = `${gateway}/topowall/api/v1/video-to-splat/${splatId}`;

    status.value = 'fetching carpet…';
    const carpetRes = await fetch(`${base}/carpet`);
    if (!carpetRes.ok) throw new Error(`carpet ${carpetRes.status} (job needs COLMAP sparse)`);
    const carpet = await carpetRes.json();

    // TODO(perf): the raw .ply is ~150-250 MB and slow over the tunnel. A compressed
    // format is the obvious win but is BLOCKED on the encoder side, verified 2026-08-11:
    //   - SPZ would be ~12x smaller (149.4 -> 12.4 MB on this very splat) and keeps all
    //     45 f_rest SH coefficients, but this viewer (@mkkellogg 0.4.7, the LATEST) hard
    //     rejects anything above SPZ v2: `if (header.version < 1 || header.version > 2)`
    //     in deserializePackedGaussians. @playcanvas/splat-transform only writes v3/v4
    //     (2.4.0 offers --spz-version 3|4; 2.0.0 cannot write .spz at all), so NO
    //     available release produces a compatible file. The .spz examples that DO load
    //     came with the SceneSplat dataset, encoded by their tooling, not by us.
    //     Symptom if you try it anyway: "Error decompressing gzipped data: Failed to
    //     fetch" then "Cannot read properties of null (reading 'shDegree')" — Chrome
    //     surfaces a DecompressionStream failure as a fetch error.
    //   - .splat is ~20 MB here but drops 45 of 48 SH coefficients (DC only = flat
    //     colour, no view-dependence), which is exactly the cue that sells motion.
    //   - .ksplat is the viewer's native compressed format and preserves SH, but
    //     splat-transform cannot output it and the npm package ships no converter.
    // Next thing to try: mkkellogg's util/create-ksplat.js from the GitHub repo (absent
    // from the npm package), or write an SPZ v2 encoder against the decoder above.
    // The server /spz endpoint exists and works; it is just unusable by this viewer.
    status.value = 'downloading splat…';
    const plyRes = await fetch(`${base}/ply`);
    if (!plyRes.ok) throw new Error(`ply ${plyRes.status}`);
    const total = Number(plyRes.headers.get('Content-Length')) || 0;
    if (plyRes.body && total) {
      const reader = plyRes.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        progressPct.value = Math.round((received / total) * 100);
        progressLabel.value = `${(received / 1e6).toFixed(0)} / ${(total / 1e6).toFixed(0)} MB`;
      }
      objectUrl = URL.createObjectURL(new Blob(chunks));
    } else {
      // no Content-Length (tunnel stripped it) → indeterminate; just download the blob
      progressLabel.value = 'downloading…';
      objectUrl = URL.createObjectURL(await plyRes.blob());
    }
    progressPct.value = 100;

    const [GS, THREE] = await Promise.all([
      import('@mkkellogg/gaussian-splats-3d'),
      import('three'),
    ]);

    const UP = new THREE.Vector3(...carpet.world_up).normalize();
    const centers = carpet.centers.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
    const start = new THREE.Vector3(...carpet.start_pos);
    let dir = new THREE.Vector3(...carpet.start_fwd).normalize();
    const spacing = carpet.median_spacing || 0.05;

    viewer = new GS.Viewer({
      rootElement: container.value,
      cameraUp: carpet.world_up,
      initialCameraPosition: carpet.start_pos,
      initialCameraLookAt: [start.x + dir.x, start.y + dir.y, start.z + dir.z],
      useBuiltInControls: false,
      sharedMemoryForWorkers: false,
    });

    status.value = 'processing splat…';
    progressPct.value = 0;
    progressLabel.value = '';
    await viewer.addSplatScene(objectUrl, {
      splatAlphaRemovalThreshold: 5,
      format: GS.SceneFormat.Ply,
      onProgress: (pct, label) => {
        if (typeof pct === 'number') progressPct.value = Math.round(pct);
        if (label) progressLabel.value = label;
      },
    });
    viewer.start();
    loading.value = false;
    progressLabel.value = '';
    status.value = 'ready — click to walk';
    showHint.value = true;

    const cam = viewer.camera;
    cam.up.copy(UP);

    // ---- pointer-lock + look ----
    const canvas = viewer.renderer?.domElement || container.value.querySelector('canvas');
    let yaw = 0, pitch = Math.asin(THREE.MathUtils.clamp(dir.dot(UP), -1, 1)) * -1;
    let refFwd = dir.clone().addScaledVector(UP, -dir.dot(UP));
    if (refFwd.lengthSq() < 1e-6) refFwd.set(1, 0, 0);
    refFwd.normalize();
    const rightOf = (f) => new THREE.Vector3().crossVectors(f, UP).normalize();
    const currentDir = () => {
      const f = refFwd.clone().applyAxisAngle(UP, yaw);
      return f.applyAxisAngle(rightOf(f), pitch).normalize();
    };
    const keys = {};

    const onClick = () => canvas?.requestPointerLock();
    const onLock = () => { showHint.value = document.pointerLockElement !== canvas; };
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      yaw -= e.movementX * 0.0025;
      pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0025, -1.35, 1.35);
    };
    const onKeyDown = (e) => { keys[e.code] = true; };
    const onKeyUp = (e) => { keys[e.code] = false; };
    canvas?.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('mousemove', onMove);
    addEventListener('keydown', onKeyDown);
    addEventListener('keyup', onKeyUp);
    cleanupFns.push(() => {
      canvas?.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLock);
      document.removeEventListener('mousemove', onMove);
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
    });

    const nearest = (p) => {
      let best = centers[0], bd = Infinity;
      for (const c of centers) { const d = p.distanceToSquared(c); if (d < bd) { bd = d; best = c; } }
      return { p: best, d: Math.sqrt(bd) };
    };

    const pos = start.clone();
    let last = performance.now();
    const loop = () => {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const d = currentDir();
      const fwdH = d.clone().addScaledVector(UP, -d.dot(UP)).normalize();
      const right = rightOf(fwdH);
      const step = speed.value * spacing * 60 * dt;
      const mv = new THREE.Vector3();
      if (keys['KeyW']) mv.add(fwdH);
      if (keys['KeyS']) mv.addScaledVector(fwdH, -1);
      if (keys['KeyD']) mv.add(right);
      if (keys['KeyA']) mv.addScaledVector(right, -1);
      if (!walkMode.value) {
        if (keys['Space']) mv.addScaledVector(UP, 1);
        if (keys['ShiftLeft']) mv.addScaledVector(UP, -1);
      }
      if (mv.lengthSq() > 0) pos.addScaledVector(mv.normalize(), step);
      if (walkMode.value) {
        const nc = nearest(pos);
        if (nc.d > radius.value) pos.copy(nc.p).addScaledVector(pos.clone().sub(nc.p).normalize(), radius.value);
      }
      const nc = nearest(pos);
      distInfo.value = `dist to carpet: ${nc.d.toFixed(2)} (r=${radius.value.toFixed(2)}) · ${walkMode.value ? 'clamped' : 'free-fly'}`;
      cam.position.copy(pos);
      cam.up.copy(UP);
      cam.lookAt(pos.clone().add(d));
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  } catch (e) {
    error.value = 'Failed: ' + e.message;
    loading.value = false;
  }
});

// Send the CURRENT novel view to the Fixer service (single-step diffusion cleanup) and overlay the result.
async function fixView() {
  if (!viewer || fixing.value) return;
  fixing.value = true;
  fixError.value = '';
  try {
    const canvas = viewer.renderer?.domElement || container.value.querySelector('canvas');
    // Force a fresh frame, then read the buffer SYNCHRONOUSLY (toDataURL, not async toBlob) —
    // the mkkellogg renderer has no preserveDrawingBuffer, so the buffer is only valid this tick.
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
  if (rafId) cancelAnimationFrame(rafId);
  cleanupFns.forEach((fn) => fn());
  if (document.pointerLockElement) document.exitPointerLock();
  try { viewer?.dispose?.(); } catch (_) {}
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<style scoped>
.walk-view { position: fixed; inset: 0; background: #000; overflow: hidden; }
.walk-canvas { position: absolute; inset: 0; }
.walk-hud {
  position: fixed; top: 10px; left: 10px; z-index: 10; color: #eee;
  background: rgba(0,0,0,.6); padding: 10px 12px; border-radius: 8px;
  font: 13px/1.5 system-ui, sans-serif; max-width: 340px;
}
.walk-hud b { color: #7fd; }
.walk-hud code { color: #9cf; }
.walk-hud input[type=range] { width: 140px; vertical-align: middle; }
.walk-dist { color: #9f9; margin-top: 4px; }
.walk-status { position: fixed; bottom: 10px; left: 10px; z-index: 10; color: #9f9;
  background: rgba(0,0,0,.6); padding: 6px 10px; border-radius: 6px; font: 12px system-ui; min-width: 220px; }
.walk-status.err { color: #f88; }
.walk-progress { margin-top: 6px; height: 6px; background: rgba(255,255,255,.15); border-radius: 3px; overflow: hidden; }
.walk-progress-fill { height: 100%; background: #4cd; border-radius: 3px; transition: width .15s ease; }
.walk-hint { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 20; color: #fff; background: rgba(0,0,0,.7); padding: 14px 20px; border-radius: 10px; font-size: 15px; }
.walk-back { position: fixed; top: 10px; right: 12px; z-index: 10; color: #9cf;
  background: rgba(0,0,0,.6); padding: 6px 10px; border-radius: 6px; font: 12px system-ui; text-decoration: none; }
.walk-back:hover { color: #fff; }

.fix-btn {
  position: fixed; top: 42px; right: 12px; z-index: 11;
  background: #7a3fd0; color: #fff; border: none; border-radius: 6px;
  padding: 8px 14px; font: 600 13px system-ui, sans-serif; cursor: pointer;
  box-shadow: 0 4px 14px -4px rgba(0,0,0,.5); transition: background .15s;
}
.fix-btn:hover:not(:disabled) { background: #8f57e0; }
.fix-btn:disabled { opacity: .6; cursor: default; }
.fix-err {
  position: fixed; top: 82px; right: 12px; z-index: 11; max-width: 280px;
  background: rgba(120,20,20,.85); color: #fdd; padding: 6px 10px;
  border-radius: 6px; font: 12px system-ui; }
.fix-overlay {
  position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,.92);
  display: flex; flex-direction: column; align-items: center; justify-content: center; }
.fix-overlay img { max-width: 100%; max-height: calc(100% - 48px); object-fit: contain; }
.fix-overlay-bar {
  display: flex; align-items: center; gap: 16px; height: 48px; color: #ddd;
  font: 13px system-ui; }
.fix-overlay-bar a, .fix-overlay-bar button {
  color: #c78bff; background: none; border: 1px solid #c78bff; border-radius: 5px;
  padding: 5px 12px; cursor: pointer; text-decoration: none; font: 13px system-ui; }
.fix-overlay-bar a:hover, .fix-overlay-bar button:hover { background: rgba(199,139,255,.15); }
</style>
