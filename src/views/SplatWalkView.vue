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

    <div class="walk-status" :class="{ err: !!error }">{{ error || status }}</div>
    <div v-if="showHint" class="walk-hint">click to start walking</div>
    <RouterLink :to="{ name: 'splat-viewer', params: { splatId } }" class="walk-back">← standard viewer</RouterLink>
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
const walkMode = ref(true);
const radius = ref(0.6);
const speed = ref(1);
const distInfo = ref('');
const showHint = ref(false);

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

    status.value = 'downloading splat (.ply)…';
    const plyRes = await fetch(`${base}/ply`);
    if (!plyRes.ok) throw new Error(`ply ${plyRes.status}`);
    objectUrl = URL.createObjectURL(await plyRes.blob());

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

    status.value = 'rendering…';
    await viewer.addSplatScene(objectUrl, { splatAlphaRemovalThreshold: 5, format: GS.SceneFormat.Ply });
    viewer.start();
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
  }
});

onBeforeUnmount(() => {
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
  background: rgba(0,0,0,.6); padding: 6px 10px; border-radius: 6px; font: 12px system-ui; }
.walk-status.err { color: #f88; }
.walk-hint { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  z-index: 20; color: #fff; background: rgba(0,0,0,.7); padding: 14px 20px; border-radius: 10px; font-size: 15px; }
.walk-back { position: fixed; top: 10px; right: 12px; z-index: 10; color: #9cf;
  background: rgba(0,0,0,.6); padding: 6px 10px; border-radius: 6px; font: 12px system-ui; text-decoration: none; }
.walk-back:hover { color: #fff; }
</style>
